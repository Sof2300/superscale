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
		// Sync API responses are plain-text tokens: declare the content type explicitly.
		if (ename.startsWith("/sync_")) se->insertValue("type", "text/plain");
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

		String clientCRCArg = se->get("crc");

		if (clientCRCArg.length() == 0) {
			se->insertValue("response", "missing crc parameter");
			return;
		}

		// Lock file access
		if (xSemaphoreTake(fileMutex, pdMS_TO_TICKS(5000)) != pdTRUE) {
			se->insertValue("response", "SERVER_BUSY");
			return;
		}

		ensureFileExists();
		size_t serverSize = getLocalSize();

		// Compute CRC of the entire file
		String serverCRC = getLocalCRC(serverSize);
		Serial.println(String() + "RemoteSyncServer server crc :'" + serverCRC + "'");
		Serial.println(String() + "RemoteSyncServer client crc :'" + clientCRCArg + "'");
		Serial.println(String() + "RemoteSyncServer serverSize :" + serverSize);

		if (serverCRC != clientCRCArg) {
			// CRC mismatch -> Client must download full file
			se->insertValue("response", "FULL_UPDATE");
		} else {
			// CRC matches -> Up to date
			se->insertValue("response", "UP_TO_DATE");
		}

		Serial.printf("[SYNC-SRV] sync_check serverSize=%u response=%s\n",
				(unsigned)serverSize, se->get("response").c_str());

		xSemaphoreGive(fileMutex);
	}

	void handleFileDownload(StringMapEvent *se) {
		Serial.println(String()+"handleFileDownload se:"+se->toString().c_str());
		ensureFileExists();
		// Let outer framework handle offsets for download_delta/sync_download via the File stream wrapper
		se->insertValue("Download", syncFilename.c_str());
		se->insertValue("ContentType", "application/octet-stream");

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

		// Verify total size matches (the Content-Range total is a precondition the client asserts)
		if (total != currentSize) {
			Serial.printf("[SYNC-SRV] PATCH 412 SIZE MISMATCH: client=%u, server=%u\n",
					(unsigned)total, (unsigned)currentSize);
			xSemaphoreGive(fileMutex);
			se->insertValue("response", String()+"SIZE MISMATCH server="+String((unsigned)currentSize)+" client="+String((unsigned)total));
			se->insertValue("statuscode", "412");
			return;
		}

		// Verify CRC (If-Match is the entity validator; a mismatch is a failed precondition)
		String serverCRC = getLocalCRC(currentSize);
		if (serverCRC != ifMatch) {
			Serial.printf("[SYNC-SRV] PATCH 412 CRC MISMATCH: client=%s, server=%s\n",
					ifMatch.c_str(), serverCRC.c_str());
			xSemaphoreGive(fileMutex);
			se->insertValue("response", String()+"CRC MISMATCH server="+serverCRC+" client="+ifMatch);
			se->insertValue("statuscode", "412");
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
		return {"/sync_check", "/sync_download", "/sync_patch"};
	}
};

#endif
