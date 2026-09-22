/*
 * Logger.h
 *
 *  Created on: 16 mai 2021
 *      Author: Pok
 */

#ifndef LOGGER_H_
#define LOGGER_H_

#include "lib/datastruct/GenString.h"

#include "stats/StatAnalyzer.h"


class FileManager {
	String filenamebase, fileext,fname;
public:
	FileManager(String filenamebase0, String fileext0):filenamebase(filenamebase0), fileext(fileext0){
		fname=String()+"/"+filenamebase+"."+fileext;
	};

	void addDataLine(String dataline){
		//	Serial.println(String()+"FileManager::addDataLine appending to:"+fname+" "+dataline);
		SimpleFS.appendToFile(fname,dataline);
		//SimpleFS.printFiles();
	};

	template<typename Func>
	void readFile(Func f) {
		bool b=SimpleFS.exists(fname);
		if(b){
			//		Serial.println(String()+"FileManager::readFile :"+fname);
			auto file=SimpleFS.openFile(fname.c_str());
			String line=""; bool started=false;
			while (line.length()>0 || !started) {
			//	unsigned long parsets=millis();
				line=SimpleFS.readLine(file);
			//	Serial.println(String()+"FileManager::readFile parseline took:"+(millis()-parsets)+"ms");
				if(line.length()>0) f(line);
				started=true;
				//			Serial.println(String()+"FileManager::readFile line.length :'"+line.length()+"'");
			}
			SimpleFS.closeFile(file);
		}
	}
};


class PseudofFileManager {

};

#define FileMan FileManager
/*
#define SUMSCOUNT 2
struct BlockInfo{
	String id="";
	String species;
	String date;
	float sums[SUMSCOUNT];
	String histories[SUMSCOUNT];
	String idlist;
	unsigned int flushes=0;
	String substrate;

	void clear(){
		Serial.println("Clearing blockInfo");
		for(int i=0;i<SUMSCOUNT;i++) {sums[i]=0;histories[i]="";}
		flushes=0;
		substrate="";
	}
};
*/



//////////////////////////////////////////////////////////////////////////////////////////
class Logger {
	BlockInfo blockinfo;
	//String virtuallog="";
	FileMan fileman=FileMan("data","txt");
 	StatAnalyzer statman;

	BlockInfoReader inforeader;

	String currentid;

/*

	String history;

	char linesep='\n', cellsep=',', histsep=' ', linehistsep='\n';
	String sumnames[SUMSCOUNT]={"harvest","substrate"};
	String lastevent[SUMSCOUNT]={"",""};

	unsigned int maxflushdays=7;
	String flushstring="harvest";
	unsigned long flushts=0;
	String substratestring="substrate", cancelstring="cancel";
	std::map<String,int> submap;
	std::vector<String> suborder;
*/
	char linesep='\n', cellsep=',';
	String idlist;


public:
	BlockInfo& getBlockInfo(){return blockinfo;}
	String getIdList(){return idlist;}

	String getSubstrate(){return blockinfo.substrate;}

	unsigned getFlushes(){return blockinfo.flushes;}

	void init(){
		statman.init();
		clearInfos();
	//	Logger *that=this;
		BlockInfoReader *reader=&inforeader;
		String *idlistptr=&idlist;
		fileman.readFile([reader,idlistptr](String line) {
		//	Serial.println(String()+"Logger::init::readFile "+line);
//			unsigned long parsets=millis();
			reader->parseLine(String(), line, idlistptr);
	//		Serial.println(String()+"Logger::init parseLine took:"+(millis()-parsets)+"ms");
		});
//		statLoad();
		return ;
	}

	void updateStatGroupFilter(String str){statman.setGroupFilter(str);}
	void updateStatDataFilter(String str){statman.setDataFilter(str);}
	void clearStatGroupFilters(){statman.clearGroupFilters();}
	void clearStatDataFilters(){statman.clearDataFilters();}
	String getStatResult(){return statman.getStatusTable();}
	String getStatCompare(){return statman.getStatusCompare();}

	void loadStats(){
		loadStats(&statman);
	}
	void loadStats(StatAnalyzer *statan){
		if(!statan) return;
		bool finished=false;//, *pfinished=&finished;
		statan->clear();

		while (!finished){
			fileman.readFile([statan](String line) {//			Serial.println(String()+"Logger::statload::readFile "+line);
			//			unsigned long parsets=millis();
						statan->addLine(line);
			//			Serial.println(String()+"Logger::statload addLine took:"+(millis()-parsets)+"ms");
			});
			finished=statan->dataEnd();
		}
		statan->calculate();
		Serial.println(String()+"Logger::statload end ");
	}

	bool loadBlock(String id){
		currentid=id;
		loadHistory(id);
		return blockinfo.history.length()>0;
	}

	void saveEntry(String id, String command, String argument){
		if(!id.length() || !command.length()) return;
		String ts=getTimeString(true, false);
		Serial.println(String()+"Logger::saveEntry:"+ts+" "+id+" "+command+" "+argument);
		//virtuallog+
		String vl=ts+cellsep+id+cellsep+ command+cellsep+argument+linesep;
		fileman.addDataLine(vl);
		//	Serial.println(String()+"Logger::saveEntry: virtuallog:"+virtuallog);
		if(!(currentid==id)) {
			currentid=id;
			loadHistory(id);
		} else {
			inforeader.insertHistory(ts, id,command,argument);
			inforeader.end();
		}
	}


	void cancelSubstrate(std::map<String,String> values){
		Serial.println(String()+"Logger::cancelSubstrate: start1");
		//	Serial.print("Free Memory :");Serial.println(ESP.getFreeHeap());
		if(blockinfo.id.length()==0) return;
		std::vector<String>  cancellist;
		// first make a list of the substrate in values
	//	for(auto it : values) {if(it.first.indexOf(SUBSTRATE_KEYWORD)>-1) list.push_back(it.first);}
	//	if(list.empty()) return;
		// then go through the current substrate and for non existing ones in the new list
		std::map<String,String> mmap=inforeader.getMap();
		for(auto it : mmap) {
			Serial.println(String()+"Logger::cancelSubstrate: value"+it.first);
			String kw=SUBSTRATE_KEYWORD, text=it.first;
			if(text.indexOf(kw)>-1
					&& values.find(it.first)==values.end()) {
				Serial.println(String()+"Logger::cancelSubstrate: value saved");
				cancellist.push_back(it.first);}
		}
		for(String it: cancellist) saveEntry(blockinfo.id, CANCEL_EVENT_NAME, it);		// save a cancel event for this item
	}


	void clearInfos(){
		idlist="";
	}

/*
	bool statAnalyze(String id){
		clearInfos();
		bool found=false, *fb;
		fb=&found;
		Logger *that=this;
		fileman.readFile([that,fb,id](String line) {
			//			Serial.println(String()+"Logger::loadHistory::readFile "+line);
			that->parseLineStatAnalyze(id, line);*fb=true;
		});
//		statman.close();
		return found;

	}

*/
	bool loadHistory(String id){
//		statAnalyze(id);
		unsigned int ts0=millis();
		clearInfos();
		bool found=false, *fb;
		fb=&found;
		//Logger *that=this;
		inforeader.init(id,&blockinfo);
		BlockInfoReader *reader=&inforeader;
		String *idlistptr=&idlist;
		fileman.readFile([idlistptr,reader,fb,id](String line) {
						Serial.println(String()+"Logger::loadHistory::readFile "+line);
			//that->parseLine(id, line);
			reader->parseLine(id,line,idlistptr);
			*fb=true;
		});
		inforeader.end();
		unsigned int diff=millis()-ts0;
		Serial.println(String()+"loadHistory took "+diff+"ms");
		return found;
 	}

	String getHistoryCurrent(){
		return blockinfo.history;
	}

private:




};




#endif /* LOGGER_H_ */
