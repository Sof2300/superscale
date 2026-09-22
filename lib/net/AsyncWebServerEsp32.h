#ifndef WEBSERVERESP32
#define WEBSERVERESP32

#define USEMDNS true

#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

#include <map>


#if USEMDNS
#include <ESPmDNS.h>
#define DEFAULT_MDNSNAME "EspServer"
#endif

#include "../fs/SimpleFS.h"

#include "../datastruct/GenString.h"

#undef FTEMPLATE
#define FTEMPLATE ".irom.text.curwebserver"

#define CUSTOMSTREAM 0
#define CHUNKSIZE 4096

struct DataPacket {
	uint8_t *data=0; size_t len=0; size_t index=0; size_t total=0;
	DataPacket(){};
	DataPacket(uint8_t *data0, size_t len0, size_t index0, size_t total0){data=data0;len=len0;index=index0;total=total0;};
};

struct HttpRange {
    bool valid = false;
    size_t start = 0;
    size_t end = 0;

    HttpRange(){}
    HttpRange(String range, size_t filesize) {
    	HttpRange r=parseRange(range,filesize);
    	valid=r.valid;
    	start=r.start;
    	end=r.end;
    }

	HttpRange parseRange(const String& range, size_t fileSize) {
	    HttpRange r;

	    if (!range.startsWith("bytes=") || fileSize == 0)
	        return r;

	    String spec = range.substring(6);
	    int dash = spec.indexOf('-');
	    if (dash < 0)
	        return r;

	    String a = spec.substring(0, dash);
	    String b = spec.substring(dash + 1);

	    if (a.length() == 0) {
	        // bytes=-N
	        size_t suffix = b.toInt();
	        if (suffix == 0) return r;
	        if (suffix > fileSize) suffix = fileSize;
	        r.start = fileSize - suffix;
	        r.end = fileSize - 1;
	        r.valid = true;
	    } else {
	        r.start = a.toInt();
	        r.end = (b.length() > 0) ? b.toInt() : (fileSize - 1);

	        if (r.start >= fileSize)
	            return r;

	        if (r.end >= fileSize)
	            r.end = fileSize - 1;

	        if (r.end < r.start)
	            return r;

	        r.valid = true;
	    }

	    return r;
	}
};

class AsyncWebServerEsp32 {
public:
	int port;
	AsyncWebServer server;
#if USEMDNS
	String mdnsname;
	bool mdnsstarted=false;
#endif

	String currentURI="";
	AsyncWebServerRequest *currentRequest=0;
	size_t currentContentLength=0;

	bool busy=false;

    DataPacket datapacket;


	AsyncWebServerEsp32(unsigned int port0=80): port(port0), server(port0){};

	void collectHeaders(const char **headers, size_t length){
		//to implement
		// server.collectHeaders(headers,length);
	}
	DataPacket getDatapacket(){return datapacket;}

	//	void setMdnsName(GenString newmdnsname){mdnsname=newmdnsname;}
#if USEMDNS
	void setMdnsName(String newmdnsname){
		if(newmdnsname.length()>0){ MDNS.setInstanceName(newmdnsname.c_str());mdnsname=newmdnsname;}
	}
#endif


	void begin(String mdnsname){
#if USEMDNS
		/*	if(!mdnsname.empty()) {
			Serial.println(String()+"WebServerEsp32 starting mdns with name"+mdnsname.c_str());
			mdnsstarted=MDNS.begin(mdnsname.c_str());
		}*/
		bool mdnsstarted=false;
		if(mdnsname.length()==0) mdnsname="EspServer";
		mdnsstarted=MDNS.begin(mdnsname.c_str()); //should wait to start? // https://github.com/espressif/arduino-esp32/blob/master/libraries/ESPmDNS/examples/mDNS_Web_Server/mDNS_Web_Server.ino
		Serial.println(String()+"mdns started with name : "+mdnsname);

#endif
		//		Serial.println("WebServerEsp32 starting server");
		server.begin();

#if USEMDNS
		if(mdnsstarted) MDNS.addService("http", "tcp", 80);
#endif
	};


	static void onFound(){}

	template<typename Func>
	void on(std::string path, WebRequestMethodComposite getpost, Func func){
		server.on(path.c_str(), getpost, [this,func](AsyncWebServerRequest *request){
			unsigned long ts=millis();
			while(this->busy) delay(1);
			this->busy=true;
			//	Serial.println(String()+"AsyncWebServerEsp32::on processing request "+request->url()+" millis:"+millis());
			this->currentURI=request->url();
			this->currentRequest=request;
			func();
			this->currentRequest=0;						//	        request->send(200, "text/plain", "Hello, world");
			Serial.println(String()+"AsyncWebServerEsp32::on duration:"+(millis()-ts)+"ms");//		Serial.println(String()+"AsyncWebServerEsp32::on finished processing request "+request->url()+" millis:"+millis());
			this->busy=false;
		});
	};

	void on(std::string path, WebRequestMethodComposite getpost, void (*func)(),void (*func2)()){
		// what does it do func2 ? is it error ?
		//	server.on(path.c_str(), getpost, func,func2);
	};


	template<typename Func>
	void onRequestBody(Func func){
			server.onRequestBody([this,func](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
			    Serial.printf(
			      "onRequestBody arguments:\n"
			      "  request: %p\n"
			      "  URL:     %s\n"
			      "  data:    %p\n"
			      "  len:     %u\n"
			      "  index:   %u\n"
			      "  total:   %u\n",
			      static_cast<void *>(request),
			      request ? request->url().c_str() : "(null)",
			      static_cast<void *>(data),
			      static_cast<unsigned int>(len),
			      static_cast<unsigned int>(index),
			      static_cast<unsigned int>(total)
			    );
			    // Optional: print the body chunk as text.
			    // Only use this if the request body is textual and not binary.
			    if (data != nullptr && len > 0) {
			      Serial.printf("  body:    ");
			      Serial.write(data, len);
			      Serial.println();
			    }
			    //uint8_t *data, size_t len, size_t index, size_t total;
			    this->datapacket=DataPacket(data,len,index,total);

				unsigned long ts=millis();
				while(this->busy) delay(1);
				this->busy=true;
				//	Serial.println(String()+"AsyncWebServerEsp32::on processing request "+request->url()+" millis:"+millis());
				this->currentURI=request->url();
				this->currentRequest=request;
				func();
				this->currentRequest=0;						//	        request->send(200, "text/plain", "Hello, world");
				Serial.println(String()+"AsyncWebServerEsp32::onRequestBody duration:"+(millis()-ts)+"ms");//		Serial.println(String()+"AsyncWebServerEsp32::on finished processing request "+request->url()+" millis:"+millis());
				this->busy=false;

				this->datapacket=DataPacket();
			});
		};
	template<typename T>
	void onNotFound(T f) {
		server.onNotFound([this,f](AsyncWebServerRequest *request){
			unsigned long ts=millis();
			while(this->busy) delay(1);
			this->busy=true;
			//	Serial.println(String()+"AsyncWebServerEsp32::onnotfound processing request "+request->url()+" millis:"+millis());
			this->currentURI=request->url();
			this->currentRequest=request;
			f();
			this->currentRequest=0;
			Serial.println(String()+"AsyncWebServerEsp32::onnotfound duration:"+(millis()-ts)+"ms");		//	Serial.println(String()+"AsyncWebServerEsp32::onnotfound finished processing request "+request->url()+" millis:"+millis());
			this->busy=false;
		});
	};
	//void onNotFound(void (*func)()){server.onNotFound(func);};
	void handleClient(){
		/*
#if USEMDNS
		if(mdnsstarted) MDNS.update();
#endif
		 */
		//	server.handleClient();
	};
	void sendHeader( std::string header, std::string value){
		// TODO: implementable ?
		//		server.sendHeader(header.c_str(), value.c_str());
	};
	void send(int status){if(currentRequest) currentRequest->send(status);};
	void send(int status, std::string type, std::string message){
		if(currentRequest) currentRequest->send(status, type.c_str(), message.c_str());
	};
	/*
	void sendContent(std::string message){
		if(currentRequest) currentRequest->sendContent(message.c_str());
		//	if(message.size()==0) server.client().stop();	//seems useless
		//	yield();	//seems useless too
	};
	 */
	void setContentLength(const size_t contentLength){ currentContentLength=contentLength;};

	size_t streamFile(std::string path, std::string contentType,unsigned long start=0,unsigned long stop=0){
		//Serial.println(String()+"streamFile "+SimpleFS.exists(path)+" path:"+path.c_str()+" currentRequest:"+(long)currentRequest);

		if(SimpleFS.exists(path) || SimpleFS.exists(path+".gz")) {
#if CUSTOMSTREAM==1
			return customstream(path,contentType,start,stop);
#endif
#if CUSTOMSTREAM==0
			streamFileRange(path,contentType, start,stop);
#endif
		} else println(std::string()+("WebServerEsp32::streamFile: path not found :")+path);
		return 0;
	};

	void builtinstream(std::string path, std::string contentType) {
		if(currentRequest) {
//			Serial.println(String()+"builtinstream: streaming" + path.c_str());
			std::lock_guard<std::mutex> lck(simpleFS_mutex);
			bool isgzfile=String(path.c_str()).endsWith(".gz");
			if(isgzfile) path=path.substr(0,path.size()-3);	// remove the gz extension to send it "normally"

//			Serial.println(String()+"builtinstream: response path" + path.c_str());
			AsyncWebServerResponse *response = currentRequest->beginResponse(CurFS, path.c_str(), contentType.c_str());//String());
			if(isgzfile) response->addHeader("Content-Encoding", "gzip");
			//response->addHeader("Accept-Ranges", "bytes");
			currentRequest->send(response);

			// could use instead: request->send(SD, "/path/to/file.json", "application/json", true);
		}
	}








	void builtinstreamRange(std::string path, std::string contentType) {
//		Serial.println(String()+"AsyncWebServerEsp32: builtinstreamRange0 path:"+path.c_str()+" currentRequest:"+(currentRequest==0));

	    if (!currentRequest) return;

//	    Serial.println(String()+"AsyncWebServerEsp32: builtinstreamRange1 path:"+path.c_str()+" currentRequest:"+(currentRequest==0));
	    if (!SimpleFS.exists(path)) {
	        currentRequest->send(404);
	        return;
	    }

	    size_t fileSize = SimpleFS.fileSize(path.c_str());

	    if (!currentRequest->hasHeader("Range")) {
//		    Serial.println(String()+"AsyncWebServerEsp32: builtinstreamRange no 'Range' path:"+path.c_str()+" currentRequest:"+(currentRequest==0));
	    	builtinstream(path,contentType);
	        return;
	    }

	    HttpRange range =
	    		HttpRange(currentRequest->header("Range"), fileSize);

//	    Serial.println(String()+"AsyncWebServerEsp32: builtinstreamRange2 path:"+path.c_str()+" currentRequest:"+(currentRequest==0));
	    if (!range.valid) {
//		    Serial.println(String()+"AsyncWebServerEsp32: builtinstreamRange Range not valid path:"+path.c_str()+" currentRequest:"+(currentRequest==0));
	        currentRequest->send(416, "text/plain", "Invalid Range");
	        return;
	    }
	    Serial.println(String()+"AsyncWebServerEsp32: builtinstreamRange pre streamFileRange path:"+path.c_str()+" currentRequest:"+(currentRequest==0));

	    streamFileRange(path.c_str(),contentType.c_str(), range.start,range.end);
	}



	void streamFileRange(std::string path, std::string contentType, unsigned long start = 0, unsigned long end = 0) {
//			Serial.println(String()+"AsyncWebServerEsp32: streamFileRange0  path:"+path.c_str()+" currentRequest:"+(currentRequest==0));

			if (!currentRequest) return;

			File file = CurFS.open(path.c_str(), "r");
			if (!file) {
//				Serial.println(String()+"AsyncWebServerEsp32: streamFileRange couldn't open path:"+path.c_str());
				currentRequest->send(404, "text/plain", "File Not Found");
				return;
			}

			unsigned long fileSize = file.size();
			bool isRange = (start > 0 || end > 0);

			// If end is not specified, default to the last byte of the file
			if (end == 0 || end >= fileSize) {
				end = fileSize > 0 ? fileSize - 1 : 0;
			}

			// Validate the requested range
			if (fileSize > 0 && (start > end || start >= fileSize)) {
				currentRequest->send(416, "text/plain", "Requested Range Not Satisfiable");
				return;
			}

			size_t contentLength = (fileSize > 0) ? (end - start + 1) : 0;

//			Serial.println(String()+"AsyncWebServerEsp32: streamFileRange beginResponse path:"+path.c_str()+" currentRequest:"+(currentRequest==0));

			// Create a dynamic response using a filler callback
			AsyncWebServerResponse *response = currentRequest->beginResponse(
				contentType.c_str(),
				contentLength,
				[file, start, contentLength,path](uint8_t *buffer, size_t maxLen, size_t index) mutable -> size_t {
//					Serial.println(String()+"AsyncWebServerEsp32: streamFileRange beginResponse call back called :"+path.c_str());

					// index is the current offset within the payload, not the file
					if (index >= contentLength) return 0;

					// Limit bytes to read by remaining content, server TCP buffer (maxLen), and your custom CHUNKSIZE
					size_t bytesToRead = contentLength - index;
					if (bytesToRead > maxLen) bytesToRead = maxLen;
					if (bytesToRead > CHUNKSIZE) bytesToRead = CHUNKSIZE;

					// Seek accurately to ensure concurrency safety if multiple clients request at once
					file.seek(start + index);
					size_t bytesRead = file.read(buffer, bytesToRead);

					// Aggressive cleanup (optional, but good practice. The lambda dropping out of scope will also close it)
					if (index + bytesRead >= contentLength) file.close();
					Serial.println(String()+"streamFileRange: streaming part index:"+(start+index)+" size:" + bytesRead);
					return bytesRead;
				}
			);

//			Serial.println(String()+"AsyncWebServerEsp32: streamFileRange post beginResponse path:"+path.c_str()+" currentRequest:"+(currentRequest==0));
			// Add necessary headers
			if (isRange) {
				response->setCode(206);
				response->addHeader("Content-Range", String("bytes ") + start + "-" + end + "/" + fileSize);
			}
			//response->addHeader("Accept-Ranges", "bytes");

			if (String(path.c_str()).endsWith(".gz")) {
				response->addHeader("Content-Encoding", "gzip");
			}

//			Serial.println(String()+"AsyncWebServerEsp32: streamFileRange presend path:"+path.c_str()+" currentRequest:"+(currentRequest==0));
			currentRequest->send(response);
//			Serial.println(String()+"AsyncWebServerEsp32: streamFileRange postsend path:"+path.c_str()+" currentRequest:"+(currentRequest==0));
		}



#ifdef oldncomplicated



	size_t customstream(std::string path, std::string contentType,unsigned long start=0,unsigned long stop=0){
		// https://github.com/me-no-dev/ESPAsyncWebServer#chunked-response
		std::lock_guard<std::mutex> lck(simpleFS_mutex);
		FileFS *filefsfs = SimpleFS.openFile(path.c_str());
		SimpleFileFS *filefs=(SimpleFileFS*) filefsfs;
		size_t sent =0;
		Serial.println(String()+"streamFile2 "+String((unsigned long)filefs));
		if(filefs){
			if(start>filefs->size) stop=filefs->size;//{SimpleFS.closeFile(filefs);return 0;}
			if(!stop) stop=filefs->size;
			println(std::string()+("WebServerEsp32::streamFile: sending ")+to_string(start)+" - "+to_string(stop)+", file size: "+to_string(filefs->size));
			if(start>0 || (stop>0 && stop<filefs->size)) sent =streamFilePart(filefs,contentType,start,stop);
			else sent =streamFilePart(filefs,contentType,0,filefs->size);//sent= server.streamFile(filefs->fileptr, contentType.c_str());
			println(std::string()+("WebServerEsp32::streamFile: sent ")+to_string(sent));
			//SimpleFS.closeFile(filefs);
		}
		return sent;
	}


	unsigned int streamFilePart(SimpleFileFS *file, std::string contentType,unsigned long start,unsigned long stop) {
		int n=CHUNKSIZE;
		//	unsigned int sent=0,sentall=0;
		//	char* buff=(char *) malloc(n);
		String nope="";
	//	Serial.println(String()+"will seek position "+start);
		if(start>0) file->fileptr.seek(start, SeekSet);
		unsigned long sendts=millis();
		String filename=file->name.c_str();
		AsyncWebServerResponse *response = currentRequest->beginChunkedResponse(contentType.c_str(), [sendts,filename, file ,start, stop](uint8_t *buffer, size_t maxLen, size_t sentall) -> size_t {//Write up to "maxLen" bytes into "buffer" and return the amount written.//index equals the amount of bytes that have been already sent//You will be asked for more data until 0 is returned//Keep in mind that you can not delay or yield waiting for more data!
			Serial.println(String()+"streamFilePart: called for "+filename+" with sentall:"+sentall+" maxLen:"+maxLen+" stop:"+stop+" ts:"+(millis()-sendts));
			//maxLen = maxLen >> 1;
			if(start+sentall>=stop) {
				//SimpleFS.closeFile(file);
		//		Serial.println(String()+"streamFilePart: aborting: start+sentall:"+(start+sentall)+" stop:"+stop);
				return 0;
			}

			unsigned int nn=maxLen;
			if(nn>CHUNKSIZE) nn=CHUNKSIZE;
			//if((start+sentall+nn)>stop)	// AI said to comment this: Otherwise the last chunk size is too large whenever start != 0, which can over-read past stop.
				nn=stop-sentall;
			unsigned int sent= file->fileptr.readBytes((char *)buffer, nn);
			sentall+=sent;
	//		Serial.println(String()+"streamFilePart: sending "+sent+" bytes");
	//		Serial.println(String()+"streamFilePart: sent all "+sentall+" bytes");

			if(start+sentall>=stop) {
				SimpleFS.closeFile(file);
	//			Serial.println(String()+"streamFilePart: closed file");
				return sent;
			}

			return sent;
		});
		if(String(filename.c_str()).endsWith(".gz")) response->addHeader("Content-Encoding", "gzip");
		currentRequest->send(response);

		//	free(buff);
		//SimpleFS.closeFile(&file);
		return 0;
	}
	/*
	unsigned int oldstreamFilePart(SimpleFileFS file, std::string contentType,unsigned long start,unsigned long stop) {
		//	println(std::string()+("WebServerEsp32::streamFilePart: sending ")+to_string(start)+" - "+to_string(stop));
		//	println(std::string()+("WebServerEsp32::streamFilePart: content type ")+contentType);
		//	if(&currentRequest) return 0;

		if(!stop) stop=file.size;

		int n=CHUNKSIZE;
		unsigned int sent=0,sentall=0;
		char* buff=(char *) malloc(n);
		String nope="";
		//		server.send(200, contentType.c_str(), "");
		server.sendContent(String()+("HTTP/1.1 200 OK\r\nContent-Type:")+contentType.c_str()+("\r\n\r\n")); //send headers
		//	if(String(path.c_str()).endsWith(".gz")) response->addHeader("Content-Encoding", "gzip");
		//	String contentTypeString=contentType.c_str();
		file.fileptr.seek(start, SeekSet);
		while (file.fileptr.position()<stop){
			unsigned int nn=n;
			if((sentall+nn)>stop) nn=stop-sentall;
			sent= file.fileptr.readBytes(buff, nn);
			sentall+=sent;
			Serial.println(String()+"sending "+sent+" bytes");
			//	AsyncWebServerResponse *response = currentRequest->beginChunkedResponse(contentTypeString, buff, sent, 0);
			//	currentRequest->send(response);
			server.sendContent_P(buff,sent);
			Serial.println(String()+"sent "+sentall+" bytes");
			yield();
		}
		free(buff);
		//SimpleFS.closeFile(&file);
		return sentall;
	}*/

	/*
	File fsUploadFile;
	bool uploadFile(){
		HTTPUpload& upload = server.upload();
		println(GenString()+"handleFileUpload "+to_string(upload.status)+" "+to_string(UPLOAD_FILE_START));
		if(upload.status == UPLOAD_FILE_START){
			String filename = upload.filename;
			if(!filename.startsWith("/")) filename = "/"+filename;
			Serial.print("handleFileUpload name: "); Serial.println(filename);
			fsUploadFile = SPIFFS.open(filename, "w");            // Open the file for writing in SPIFFS (create if it doesn't exist)
			filename = String();
		} else if(upload.status == UPLOAD_FILE_WRITE){
			if(fsUploadFile)
				fsUploadFile.write(upload.buf, upload.currentSize); // Write the received bytes to the file
		} else if(upload.status == UPLOAD_FILE_END){
			if(fsUploadFile) {                                    // If the file was successfully created
				fsUploadFile.close();                               // Close the file again
				Serial.print("handleFileUpload Size: "); Serial.println(upload.totalSize);
				//  server.sendHeader("Location","/success.html");      // Redirect the client to the success page
				//  server.send(303);
			} else {
				return false;

			}
		}
		return true;
	}
	 */
#endif
	std::string uri(){return std::string(currentURI.c_str());};

	std::map<std::string,std::string> getHeaders(){
		std::map<std::string,std::string> ret;
		if(!currentRequest) return ret;
		int hn=currentRequest->headers();
		for(int i=0;i<hn;i++) ret[currentRequest->headerName(i).c_str()]=currentRequest->header(i).c_str();
		return ret;
	};

	std::map<std::string,std::string> getArguments(){
		std::map<std::string,std::string> ret;
		if(!currentRequest) return ret;
		int argn=currentRequest->args();
		for(int i=0;i<argn;i++) ret[currentRequest->argName(i).c_str()]=currentRequest->arg(i).c_str();
		return ret;
	};
	std::map<std::string, std::string> getParameters() {
	    std::map<std::string, std::string> ret;
	    if (!currentRequest) return ret;

	    // Number of parameters (query + body, depending on how they were added)
	    size_t argn = currentRequest->params();
	    for (size_t i = 0; i < argn; ++i) {
	        const char* name  = currentRequest->getParam(i)->name().c_str();
	        const char* value = currentRequest->getParam(i)->value().c_str();
	        ret[std::string(name)] = std::string(value);
	    }

	    return ret;
	}


	bool hasArg(std::string arg){
		if(currentRequest) return currentRequest->hasArg(arg.c_str());
		else return false;
	}
	bool hasHeader(std::string arg){
		if(currentRequest) return currentRequest->hasHeader(arg.c_str());
		else return false;
	}
	std::string header(std::string arg){
		if(currentRequest) return std::string(currentRequest->header(arg.c_str()).c_str());
		return "";
	}

	String header(int i){
		if(currentRequest) return (currentRequest->header(i).c_str());
		return "";};              // get request header value by number
	String headerName(int i){
		if(currentRequest) return (currentRequest->headerName(i).c_str());
		return "";};          // get request header name by number
	int headers(){
		if(currentRequest) return (currentRequest->headers());
		return 0;};
};

#endif


