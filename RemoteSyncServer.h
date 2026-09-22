#ifndef REMOTESYNCSERVER_H
#define REMOTESYNCSERVER_H

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include "lib/fs/SimpleFS.h"
#include <rom/crc.h>

// Uncomment to enable debug printouts
// #define REMOTESYNC_DEBUG

class RemoteSyncServer {
protected:
	String syncFilename;
	SemaphoreHandle_t fileMutex = NULL;

	void ensureFileExists() {
		if (syncFilename.length() == 0) return;
		SIMPLEFS.begin();
		if (!SIMPLEFS.exists(syncFilename)) {
#ifdef REMOTESYNC_DEBUG
			Serial.println("[SYNC-SRV-DEBUG] ensureFileExists() - file does not exist, creating empty file");
#endif
			SIMPLEFS.rewriteFile(syncFilename.c_str(), "", 0);
		}
	}

	size_t getLocalSize() {
		return SIMPLEFS.fileSize(syncFilename.c_str());
	}

	String getLocalCRC(size_t limit) {
		//		Serial.println(String()+"getLocalCRC limit:"+limit+" file:"+syncFilename);
		FileFS *ffs = SIMPLEFS.openFile(syncFilename.c_str());
		if (!ffs) {
			char hex[9];
			snprintf(hex, sizeof(hex), "%08lx", (unsigned long)0);
			return String(hex);
		}

		const size_t BLOCK_SIZE = 1024;
		uint8_t buffer[BLOCK_SIZE];
		uint32_t crc = 0;
		size_t totalRead = 0;

		while (totalRead < limit) {
			size_t toRead = BLOCK_SIZE;
			if (totalRead + toRead > limit) toRead = limit - totalRead;
			size_t bytesRead = SIMPLEFS.readFile(buffer, toRead, ffs);
			if (bytesRead == 0) break;
			crc = crc32_le(crc, buffer, bytesRead);
			totalRead += bytesRead;
			//            Serial.println(String()+"getLocalCRC crc:"+crc+" totalRead:"+totalRead);
			//            Serial.println(String()+"getLocalCRC buffer:'"+String(buffer,bytesRead)+"'");
		}

		SIMPLEFS.closeFile(ffs);

		char hex[9];
		snprintf(hex, sizeof(hex), "%08lx", (unsigned long)crc);
		return String(hex);
	}

public:
	void init(String filename) {
		if (fileMutex == NULL) {
			fileMutex = xSemaphoreCreateMutex();
		}
		Serial.println(String() + "RemoteSyncServer init :'" + filename + "'");
		syncFilename = filename;
		if (syncFilename.length() == 0) return;
		if (syncFilename[0] != '/') syncFilename = String("/") + syncFilename;
		ensureFileExists();
		Serial.printf("[SYNC-SRV] initialized file=%s\n", syncFilename.c_str());
	}

	bool processRequest(String ename, StringMapEvent *se, bool *captured) {
		if (ename == String("/sync_check")) {
			handleSyncCheck(se);
			if (captured) *captured = true;
			return true;
		}
		if(ename == String("/sync_download")) {
			handleFileDownload(se);
			//if (captured) *captured = true;
			return true;
		}

		if (ename == String("/sync_download_delta")) {
			handleDeltaDownload(se);
			//if (captured) *captured = true;
			return true;
		}

		if (ename == String("/sync_push_delta")) {
			handlePushDelta(se);
			if (captured) *captured = true;
			return true;
		}

		if (ename == String("/sync_patch")) {
			handlePatch(se);
			if (captured) *captured = true;
			return true;
		}
		return false;
	}

	void handleSyncCheck(StringMapEvent *se) {
		if (syncFilename.length() == 0) {
			se->insertValue("response", "sync filename not initialized");
			return;
		}

		String clientSizeArg = se->get("size");
		String clientCRCArg = se->get("crc");
		String clientTotalArg = se->get("total_size");

		if (clientSizeArg.length() == 0) {
			se->insertValue("response", "missing size parameter");
			return;
		}

		size_t clientBaseSize = clientSizeArg.toInt();
		size_t clientTotalSize = clientTotalArg.length() > 0 ? clientTotalArg.toInt() : clientBaseSize;

		// Lock file access to prevent checking while a push delta is writing
		if (xSemaphoreTake(fileMutex, pdMS_TO_TICKS(5000)) != pdTRUE) {
			se->insertValue("response", "SERVER_BUSY");
			return;
		}

		ensureFileExists();
		size_t serverSize = getLocalSize();

		// 1. If client expects a base larger than the server has, server was reset/truncated.
		if (clientBaseSize > serverSize) {
			se->insertValue("response", "FULL_UPDATE");
		}
		else {
			// 2. Compute CRC up to the client's base checkpoint (not the whole file)
			String serverCRC = getLocalCRC(clientBaseSize);
			Serial.println(String() + "RemoteSyncServer server crc :'" + serverCRC + "'");
			Serial.println(String() + "RemoteSyncServer client crc :'" + clientCRCArg + "'");
			Serial.println(String() + "RemoteSyncServer clientBaseSize :" + clientBaseSize + ", clientTotalSize"+clientTotalSize);

			if (serverCRC != clientCRCArg) {
				// The shared base diverges -> Client must redownload
				se->insertValue("response", "FULL_UPDATE");
			} else {
				// Base perfectly matches! Determine next steps
				if (serverSize > clientBaseSize) {
					// Server has appended new data since client's base
					se->insertValue("response", (String("PULL_DELTA:") + String(serverSize)).c_str());
				} else {
					// Server has NO new data
					if (clientTotalSize > clientBaseSize) {
						// Client has appended new data locally
						se->insertValue("response", "PUSH_DELTA");
					} else {
						// Both sides match perfectly
						se->insertValue("response", "UP_TO_DATE");
					}
				}
			}
		}

		Serial.printf("[SYNC-SRV] sync_check clientBase=%u clientTotal=%u serverSize=%u response=%s\n",
				(unsigned)clientBaseSize, (unsigned)clientTotalSize, (unsigned)serverSize, se->get("response").c_str());

		xSemaphoreGive(fileMutex);
	}

	void handleFileDownload(StringMapEvent *se) {
		Serial.println(String()+"handleFileDownload se:"+se->toString().c_str());
		ensureFileExists();
		// Let outer framework handle offsets for download_delta/sync_download via the File stream wrapper
		se->insertValue("Download", syncFilename.c_str());
		se->insertValue("ContentType", "application/octet-stream");

	}
	void handleDeltaDownload(StringMapEvent *se) {
		Serial.println(String()+"handleDeltaDownload se:"+se->toString().c_str());
		size_t offset = se->get("offset").toInt();
		unsigned size= SIMPLEFS.fileSize(syncFilename.c_str());
		se->insertValue("Download", syncFilename);
		String range= String()+"bytes="+offset+"-"+size;
		se->insertValue("Range", range.c_str());
		se->insertValue("ContentType", "application/octet-stream");
		return;
	}

	unsigned long pushsize=0;
	bool pushfail=false;
	void handlePushDelta(StringMapEvent *se) {
		Serial.println(String()+"handlePushDelta se:"+se->toString().c_str());
		/*
        String offsetArg = se->get("offset");
        size_t offset = offsetArg.length() ? offsetArg.toInt() : 0;
        String payload = se->get("plain");
		 */
		String offsetArg = se->get("offset");
		size_t baseOffset = offsetArg.length() ? offsetArg.toInt() : 0;

		bool isChunk = (se->get("is_chunk") == "1");

		if (isChunk) {
			String payload = se->get("content");
			size_t index = se->get("index").toInt(); // Get chunk index

			Serial.println(String()+"handlePushDelta payload:"+payload+", baseOffset:"+baseOffset);

			if (payload.length() == 0) return;
			if (xSemaphoreTake(fileMutex, pdMS_TO_TICKS(5000)) != pdTRUE) return;

			ensureFileExists();
			size_t currentSize = getLocalSize();
			size_t expectedPos = baseOffset + index; //  Accurate offset calculation for large files
			if (expectedPos != currentSize) {
				Serial.printf("[SYNC-SRV] CONFLICT: expectedPos=%u currentSize=%u\n", expectedPos, currentSize);
				xSemaphoreGive(fileMutex);
				return;
			}
			unsigned written=SIMPLEFS.appendToFile(syncFilename.c_str(), payload, false);
			Serial.println(String()+"[SYNC-SRV] handlePushDelta :");
			pushsize+=written;
			xSemaphoreGive(fileMutex);
			if (written != payload.length()) pushfail=true;

		} else {
			if (pushsize== 0) {
				Serial.println(String()+"handlePushDelta empty payload, offset:"+baseOffset);
				se->insertValue("response", "empty delta payload");
				return;
			}

			// Lock file for atomic modification
			if (xSemaphoreTake(fileMutex, pdMS_TO_TICKS(5000)) != pdTRUE) {
				se->insertValue("response", "SERVER_BUSY");
				return;
			}

			if(pushfail) se->insertValue("response", "failed to append delta payload");
			else {
				size_t newSize = getLocalSize();
				Serial.printf("[SYNC-SRV] push_delta SUCCESS: baseOffset=%u pushsize=%u newSize=%u\n",
						(unsigned)baseOffset, (unsigned)pushsize, (unsigned)newSize);
				se->insertValue("response", "OK");
			}
			pushsize=0;
			pushfail=false;
		}
	}

	// Parse Content-Range header: "bytes start-end/total"
	bool parseContentRange(String rangeHeader, size_t &start, size_t &end, size_t &total) {
		if (!rangeHeader.startsWith("bytes ")) return false;

		String rangeStr = rangeHeader.substring(6); // Remove "bytes "
		int slashIdx = rangeStr.indexOf('/');
		if (slashIdx == -1) return false;

		String totalStr = rangeStr.substring(slashIdx + 1);
		String rangePart = rangeStr.substring(0, slashIdx);

		int dashIdx = rangePart.indexOf('-');
		if (dashIdx == -1) return false;

		String startStr = rangePart.substring(0, dashIdx);
		String endStr = rangePart.substring(dashIdx + 1);

		start = startStr.toInt();
		end = endStr.toInt();
		total = totalStr.toInt();

		return true;
	}

	// In-place file modification (similar to client's spliceFileInPlace)
	bool spliceFileInPlace(size_t startOffset, size_t endOffset, String newContent, bool mutexAlreadyHeld = false) {
		if (!mutexAlreadyHeld) {
			if (xSemaphoreTake(fileMutex, pdMS_TO_TICKS(5000)) != pdTRUE) {
				return false;
			}
		}

		File file = CurFS.open(syncFilename.c_str(), "r+");
		if (!file) {
			if (!mutexAlreadyHeld) xSemaphoreGive(fileMutex);
			return false;
		}

		size_t beforeSize = file.size();
		int diff = (int)newContent.length() - (int)(endOffset - startOffset);
		size_t tailSize = beforeSize - endOffset;

		if (diff > 0) {
			// SHIFT RIGHT (Iterate Backwards)
			const size_t CHUNK = 512;
			uint8_t buf[CHUNK];
			size_t bytesToShift = tailSize;

			while (bytesToShift > 0) {
				size_t toRead = (bytesToShift > CHUNK) ? CHUNK : bytesToShift;
				size_t readPos = endOffset + bytesToShift - toRead;
				size_t writePos = readPos + diff;

				file.seek(readPos, SeekSet);
				file.read(buf, toRead);
				file.seek(writePos, SeekSet);
				file.write(buf, toRead);

				bytesToShift -= toRead;
			}
		} else if (diff < 0) {
			// SHIFT LEFT (Iterate Forwards)
			const size_t CHUNK = 512;
			uint8_t buf[CHUNK];
			size_t bytesShifted = 0;

			while (bytesShifted < tailSize) {
				size_t toRead = (tailSize - bytesShifted > CHUNK) ? CHUNK : (tailSize - bytesShifted);
				size_t readPos = endOffset + bytesShifted;
				size_t writePos = readPos + diff;

				file.seek(readPos, SeekSet);
				file.read(buf, toRead);
				file.seek(writePos, SeekSet);
				file.write(buf, toRead);

				bytesShifted += toRead;
			}
		}

		// Insert the new content into the gap
		file.seek(startOffset, SeekSet);
		file.print(newContent);

		// Pad with spaces if shrunk (to maintain file size for CRC consistency)
		if (diff < 0) {
			file.seek(beforeSize + diff, SeekSet);
			for (int i = 0; i < -diff; i++) file.write(' ');
		}

		file.close();
		if (!mutexAlreadyHeld) xSemaphoreGive(fileMutex);

		return true;
	}

	void handlePatch(StringMapEvent *se) {
		Serial.println(String()+"handlePatch se:"+se->toString().c_str());

		if (syncFilename.length() == 0) {
			se->insertValue("response", "sync filename not initialized");
			return;
		}

		// Extract headers
		String ifMatch = se->get("If-Match");
		String contentRange = se->get("Content-Range");
		String content = se->get("content");

		if (ifMatch.length() == 0) {
			se->insertValue("response", "missing If-Match header");
			return;
		}

		if (contentRange.length() == 0) {
			se->insertValue("response", "missing Content-Range header");
			return;
		}

		if (content.length() == 0) {
			se->insertValue("response", "missing content");
			return;
		}

		// Parse Content-Range
		size_t start, end, total;
		if (!parseContentRange(contentRange, start, end, total)) {
			se->insertValue("response", "invalid Content-Range format");
			return;
		}

		Serial.printf("[SYNC-SRV] PATCH request: If-Match=%s, Range=%u-%u/%u, contentLen=%u\n",
				ifMatch.c_str(), (unsigned)start, (unsigned)end, (unsigned)total, (unsigned)content.length());

		// Lock file for atomic operation
		if (xSemaphoreTake(fileMutex, pdMS_TO_TICKS(5000)) != pdTRUE) {
			se->insertValue("response", "SERVER_BUSY");
			return;
		}

		ensureFileExists();
		size_t currentSize = getLocalSize();

		// Verify total size matches
		if (total != currentSize) {
			Serial.printf("[SYNC-SRV] PATCH CONFLICT: total size mismatch (client=%u, server=%u)\n",
					(unsigned)total, (unsigned)currentSize);
			xSemaphoreGive(fileMutex);
			se->insertValue("response", "CONFLICT");
			return;
		}

		// Verify CRC
		String serverCRC = getLocalCRC(currentSize);
		if (serverCRC != ifMatch) {
			Serial.printf("[SYNC-SRV] PATCH CONFLICT: CRC mismatch (client=%s, server=%s)\n",
					ifMatch.c_str(), serverCRC.c_str());
			xSemaphoreGive(fileMutex);
			se->insertValue("response", "CONFLICT");
			return;
		}

		// Apply the patch (mutex is already held, spliceFileInPlace won't take it again)
		bool success = spliceFileInPlace(start, end, content, true);
		xSemaphoreGive(fileMutex);

		if (!success) {
			Serial.printf("[SYNC-SRV] PATCH splice FAILED: range=%u-%u\n",(unsigned)start, (unsigned)end);
			se->insertValue("response", "FAILED");
			return;
		}

		size_t newSize = getLocalSize();
		Serial.printf("[SYNC-SRV] PATCH SUCCESS: range=%u-%u, newSize=%u\n",
				(unsigned)start, (unsigned)end, (unsigned)newSize);
		se->insertValue("response", "OK");
	}

	static std::vector<GenString> getUrlNames() {
		return {"/sync_check", "/sync_push_delta", "/sync_download_delta","/sync_download", "/sync_patch"};
	}
};

#endif
