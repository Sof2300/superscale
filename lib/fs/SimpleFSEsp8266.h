#ifndef SIMPLEFS_H
#define SIMPLEFS_H


/*
  SimpleFS Status : mostly code salvaged from ioktopus and some new using String rather than std::string. Most likely will be moved to littlefs, hopefully with only few defines.

 * */


#define FFX(string_literal) (reinterpret_cast<const __FlashStringHelper *>(((__extension__({static const char __c[] __attribute__((section(FTEMPLATE))) = ((string_literal)); &__c[0];})))))
#define RF(x) String(FFX(x)).c_str()
#define FTEMPLATE ".irom.text.rf"

void println(std::string str){
	String str2=String(str.c_str());
	Serial.println(str2);
}
void print(std::string str){
	String str2=String(str.c_str());
	Serial.print(str2);
}


#include <FS.h>

#define CurFS SPIFFS

#if CurFS==LITTLEFS
#include <LITTLEFS.h>
#endif

#if CurFS==SPIFFS
#include <SPIFFS.h>
#endif

struct FileFS {
	std::string name;
	unsigned int size;
};

struct SimpleFileFS : public FileFS
{
	File fileptr;
	SimpleFileFS(std::string name0, unsigned int size0, File fileptr0): fileptr(fileptr0) {name=name0; size=size0;};
};


class SimpleFS {
public:

	SimpleFS(){ CurFS.begin();};
	bool exists(std::string path){return CurFS.exists(path.c_str());};
	bool exists(String path){return CurFS.exists(path.c_str());};
	bool exists(const char *path){return CurFS.exists(path);};
	bool rename(String namesrc,String namedst){
	//	Serial.println(String()+"SimpleFS renaming "+namesrc+" "+namedst);
		return CurFS.rename(namesrc, namedst);}


	unsigned long fileSize(std::string path){
		File f = CurFS.open(path.c_str(), "r");
		if (!f) { println(std::string()+RF("CurFS::fileSize Error: could not open file ")+path.c_str()); return 0; }
		unsigned long sz=f.size();
		f.close();
		return sz;
	};
	// code triggering C9000 warning


	void printFiles(){
		// list all files
		String str;
		Dir dir = CurFS.openDir(String("/"));
		while (dir.next()) {
			str += dir.fileName();
			str +=  "(";
			str += dir.fileSize();
			str += "bytes)\r\n";
		}
		Serial.println(str);
	};

	bool erase(const char *path){return erase(std::string(path));}
	bool erase(String path){
	//	Serial.println(String()+"SimpleFS: erasing file "+path);
		return erase(std::string(path.c_str()));}
	bool erase(std::string path) {
#ifndef CurFSNOWRITE
		if(CurFS.remove(path.c_str())) {println(std::string() + RF("Deleted with success file ")+path.c_str());return true;}
		else {println(std::string() + RF("Error deleting file ")+path);return false;}
#else
		return false;
#endif
	};

	unsigned int appendToFile(const char * path, const char * txt, unsigned size) {
#ifndef CurFSNOWRITE
		File f = CurFS.open(path, "a");
		if (!f) {println(std::string()+RF("CURFS::appendToFile: Could not appending ")+path);return 0;}
	//	println(std::string()+RF("CURFS::appendToFile: appending ")+path);

		unsigned int w=f.write(txt, size);
		f.close();
		return w;
#else
		return 0;
#endif
	}
	unsigned int appendToFile(String path, String txt) {
		return appendToFile(path.c_str(), txt.c_str(), txt.length());
	}
	unsigned int appendToFile(std::string path, std::vector<unsigned char> vect) {
		return appendToFile(path.c_str(), (const char *)vect.data(), vect.size());

	}







	void eraseAllFiles(){
		// list all files
		String str;
		Dir dir = CurFS.openDir(String("/"));
		while (dir.next()) {
			str += dir.fileName();
			str += "\n";
		}
		//Serial.println(str);
		// erase the list
		unsigned i=str.indexOf("\n"),ip=0;
		while (i<str.length()){
			String filename=str.substring(ip,i);
			erase(filename.c_str());
			Serial.println(RF("Erasing file :")+filename);
			ip=i+1;
			i=str.indexOf("\n",i+1);
		}
	};


	///////////////////////////////
	std::vector<FileFS> listFiles(std::string path0, std::string filenamebase){
		if(path0.substr(path0.length()-1)!="/") path0+="/";
		Dir dir = CurFS.openDir(path0.c_str());
		std::vector<FileFS> v;
		filenamebase=path0+filenamebase;
		while (dir.next()) {
			std::string fname=dir.fileName().c_str();
			//print(fname+" / "+String(dir.fileSize()).c_str());
			if(fname.substr(0,filenamebase.size())==filenamebase) {
				FileFS ffs;
				ffs.name=fname;
				ffs.size=dir.fileSize();
				v.push_back(ffs);
				//	Serial.print(RF(" added "));
				//	Serial.print(ffs.name.c_str());
			}
			//Serial.println();

		}
		return v;

	};


	std::vector<FileFS> listFilesByExt(std::string path0, std::string fileext){
		if(path0.substr(path0.length()-1)!="/") path0+="/";
		Dir dir = CurFS.openDir(path0.c_str());
		std::vector<FileFS> v;

		while (dir.next()) {
			std::string fname=dir.fileName().c_str();
			print(fname+" / "+String(dir.fileSize()).c_str());
			if(fname.size()>fileext.size() && fname.substr(fname.size()-fileext.size())==fileext) {
				FileFS ffs;
				ffs.name=fname;
				ffs.size=dir.fileSize();
				v.push_back(ffs);
				Serial.print(RF(" added "));
				Serial.print(ffs.name.c_str());
			}
			Serial.println();

		}
		return v;
		return std::vector<FileFS>();};






	unsigned int rewriteFile(const char *path, const char *buff, unsigned int size) {
#ifndef CurFSNOWRITE
		File f = CurFS.open(path, "w");
		if (!f) {println(std::string()+RF("CURFS::rewriteFile: Could not rewriteFile ")+path);return 0;}
		println(std::string()+RF("CURFS::rewriteFile: rewriting ")+path);

		unsigned int w=f.write(buff, size);
		f.close();
		return w;
#else
		return 0;
#endif
	}
	unsigned int rewriteFile(std::string path, unsigned char *buff, unsigned int size){
#ifndef CurFSNOWRITE
		File f = CurFS.open(path.c_str(), "w");
		if (!f) {println(std::string()+RF("CURFS::rewriteFile: Could not rewriteFile ")+path);return 0;}
		println(std::string()+RF("CURFS::rewriteFile: rewriting ")+path);

		unsigned int w=f.write(buff, size);
		f.close();
		return w;
#else
		return 0;
#endif
	};


	unsigned int rewriteFile(std::string path, std::vector<unsigned char> vect) {
		return rewriteFile(path,vect.data(),vect.size());
	}

	FileFS* openFile(std::string path){
		File f = CurFS.open(path.c_str(), "rb");
		if (!f) return 0;

		return new SimpleFileFS(path,f.size(),f);
	};

	void closeFile(FileFS* ffs){
		SimpleFileFS *cffs=(SimpleFileFS*) ffs;
		cffs->fileptr.close();
		delete cffs;
	};

	unsigned long readFile(unsigned char *r,unsigned long size,FileFS* ffs){
		SimpleFileFS *cffs=(SimpleFileFS*) ffs;
		//		long pos = ftell(cffs->fileptr);
		//		println("readFile: reading at pos:"+to_string(pos));
		size_t res= cffs->fileptr.readBytes((char *)r, size);
		//		pos = ftell(cffs->fileptr);
		//		println("readFile: post reading at pos:"+to_string(pos));
		return res;
	};

	void seekFile(unsigned long pos, FileFS* ffs){
		SimpleFileFS *cffs=(SimpleFileFS*) ffs;
		cffs->fileptr.seek(pos,SeekSet);
	};

	unsigned char* readFileBuffer(std::string path,size_t &size){
		File f = CurFS.open(path.c_str(), "r");
		if (!f) { println(std::string()+RF("readFileBuffer Error: could not open file ")+path.c_str()+"\n"); return 0; }
		unsigned char * buffer = new unsigned char[f.size()];
		size= f.readBytes((char *)buffer, f.size());
		//println(std::string()+ RF("reading ")+to_string(size));
		f.close();
		return buffer;
	};
	String readFileToString(String path){
		File f = CurFS.open(path.c_str(), "r");
		if (!f) { Serial.println(String()+"readFileToString Error: could not open file '"+path+"'\n"); return String(); }
		unsigned char * buffer = new unsigned char[f.size()];
		//size_t size=
				f.readBytes((char *)buffer, f.size());
		//		println(std::string()+ RF("reading ")+to_string(size));
		f.close();
		String str((const char *)buffer);
		delete buffer;
		return str;
	}
	std::string readFileToStdString(std::string path,size_t &size){
		File f = CurFS.open(path.c_str(), "r");
		if (!f) { println(std::string()+RF("readFileToString Error: could not open file '")+path.c_str()+"'\n"); return std::string(); }
		unsigned char * buffer = new unsigned char[f.size()];
		size= f.readBytes((char *)buffer, f.size());
		//		println(std::string()+ RF("reading ")+to_string(size));
		f.close();
		std::string str((const char *)buffer);
		delete buffer;
		return str;
	};

	void printFile(std::string path,size_t &size, int blocksize=128){
		File f = CurFS.open(path.c_str(), "r");
		if (!f) { println(std::string()+RF("printFile Error: could not open file ")+path.c_str()+"\n"); return ; }
		int sz=f.size();
		size=0;
		unsigned char * buffer = new unsigned char[blocksize+1];
		while(sz>0){
			if(sz<blocksize) blocksize=sz;
			size= f.readBytes((char *)buffer, blocksize);
			buffer[blocksize]=0;
			Serial.print(String((char *)buffer));
			sz-=blocksize;
		}
		f.close();
		return;
	};

} SIMPLEFS;
//684 static mem, i guess its CurFS.begin()



#endif
