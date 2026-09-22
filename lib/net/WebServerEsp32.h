#ifndef WEBSERVERESP32
#define WEBSERVERESP32

#define USEMDNS true

#include <map>
#include <WebServer.h>

#if USEMDNS
#include <ESPmDNS.h>
#define DEFAULT_MDNSNAME "EspServer"
#endif

#include "../fs/SimpleFS.h"

#include "../datastruct/GenString.h"

//#undef FTEMPLATE
//#define FTEMPLATE ".irom.text.curwebserver"

#define DIYSTREAMING

#define CHUNKSIZE 4096

class WebServerEsp32 {
public:
	int port;
	WebServer server;
#if USEMDNS
	String mdnsname;
	bool mdnsstarted=false;
#endif

	WebServerEsp32(unsigned int port0=80): port(port0), server(port0){};

	void collectHeaders(const char **headers,size_t length){server.collectHeaders(headers,length);}

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
	void on(std::string path, HTTPMethod getpost, Func func){
		server.on(path.c_str(), getpost, func);
	};

	void on(std::string path, HTTPMethod getpost, void (*func)(),void (*func2)()){
			server.on(path.c_str(), getpost, func,func2);
		};
	template<typename T>
	void onNotFound(T f) {server.onNotFound(f);};
	//void onNotFound(void (*func)()){server.onNotFound(func);};
	void handleClient(){
/*
#if USEMDNS
		if(mdnsstarted) MDNS.update();
#endif
*/
		server.handleClient();
	};
	void sendHeader( std::string header, std::string value){server.sendHeader(header.c_str(), value.c_str());};
	void send(int status){server.send(status);};
	void send(int status, std::string type, std::string message){server.send(status, type.c_str(), message.c_str());};
	void sendContent(std::string message){
		server.sendContent(message.c_str());
		//	if(message.size()==0) server.client().stop();	//seems useless
		//	yield();	//seems useless too
	};
	void setContentLength(const size_t contentLength){server.setContentLength(contentLength);};

	size_t streamFile(std::string path, std::string contentType,unsigned long start=0,unsigned long stop=0){
		Serial.println(String()+"streamFile "+SimpleFS.exists(path)+" "+path.c_str());
		if(SimpleFS.exists(path)) {
			FileFS *filefsfs = SimpleFS.openFile(path.c_str());
			SimpleFileFS *filefs=(SimpleFileFS*) filefsfs;
			size_t sent =0;
			Serial.println(String()+"streamFile2 "+String((unsigned long)filefs));
			if(filefs){
				println(std::string()+("WebServerEsp32::streamFile: sending ")+to_string(start)+" - "+to_string(stop)+", file size: "+to_string(filefs->size));
				if(start>filefs->size) {SimpleFS.closeFile(filefs);return 0;}
				if(start>0 || (stop>0 && stop<filefs->size)) sent =streamFilePart(*filefs,contentType,start,stop);
				else
#ifdef DIYSTREAMING
					sent =streamFilePart(*filefs,contentType,0,filefs->size);
#endif
#ifndef DIYSTREAMING
				sent= server.streamFile(filefs->fileptr, contentType.c_str());
#endif
				println(std::string()+("WebServerEsp32::streamFile: sent ")+to_string(sent));
				SimpleFS.closeFile(filefs);
			}
			return sent;
		} else println(std::string()+("WebServerEsp32::streamFile: path not found :")+path);
		return 0;
	};


	unsigned int streamFilePart(SimpleFileFS file, std::string contentType,unsigned long start,unsigned long stop) {
	//	println(std::string()+("WebServerEsp32::streamFilePart: sending ")+to_string(start)+" - "+to_string(stop));
	//	println(std::string()+("WebServerEsp32::streamFilePart: content type ")+contentType);
		if(!stop) stop=file.size;

		int n=CHUNKSIZE;
		unsigned int sent=0,sentall=0;
	 	char* buff=(char *) malloc(n);
		String nope="";
		//		server.send(200, contentType.c_str(), "");
		server.sendContent(String()+("HTTP/1.1 200 OK\r\nContent-Type:")+contentType.c_str()+("\r\n\r\n")); //send headers
		file.fileptr.seek(start, SeekSet);
		while (file.fileptr.position()<stop){
			unsigned int nn=n;
			if((sentall+nn)>stop) nn=stop-sentall;
			sent= file.fileptr.readBytes(buff, nn);
			sentall+=sent;
			Serial.println(String()+"sending "+sent+" bytes");
			server.sendContent_P(buff,sent);
			Serial.println(String()+"sent "+sentall+" bytes");
			yield();
		}
		free(buff);
 		//SimpleFS.closeFile(&file);
	 	return sentall;
	}

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

	std::string uri(){return std::string(server.uri().c_str());};
	std::map<std::string,std::string> getArguments(){
		std::map<std::string,std::string> ret;
		int argn=server.args();
		for(int i=0;i<argn;i++) ret[server.argName(i).c_str()]=server.arg(i).c_str();
//		 Serial.print("Argument:"); Serial.println(server.argName(i));
//		 Serial.println(server.arg(i));
		return ret;
	};
	bool hasArg(std::string arg){return server.hasArg(arg.c_str());}
	bool hasHeader(std::string arg){return server.hasHeader(arg.c_str());}
	std::string header(std::string arg){return std::string(server.header(arg.c_str()).c_str());}

	String header(int i){return server.header(i);};              // get request header value by number
	String headerName(int i){return server.headerName(i);};          // get request header name by number
	int headers(){return server.headers();};
};

#endif


