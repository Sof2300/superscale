
#ifndef STATANALYZER_H_
#define STATANALYZER_H_

#include "BlockInfo.h"
#include "StatClassifier.h"


#define MAXBLOCKSIMLOAD 2

int findInVector(const String &s2, const std::vector<String> &vect) {
	String s=s2;
	for(unsigned int i=0;i<vect.size();i++) {if(vect[i]==s) return i;}
	return -1;}

class StatAnalyzer {

	StatClassifier classifier;

	std::map<String, BlockInfoReader> readers;
	std::vector<String> loadedIds;

	bool overflow=false;

	std::vector<String> channels={"totalharvest", "firstflushharvest", "totalBE", "firstflushBE"};

	std::vector<StatCondition> datafilters;

public:

	void init(){
		classifier.init(channels);
	}

	String getStatusTable(){return classifier.getStatusTable();};
	String getStatusCompare(){return classifier.getStatusCompare();};

	void clear(){
		loadedIds.clear();

		readers.clear();
		overflow=false;
	}
	void clearGroupFilters(){classifier.clearGroupFilters();}
	void clearDataFilters(){datafilters.clear();}
	void setGroupFilter(String filter){classifier.setGroupFilter(filter);}
	void setDataFilter(String filter){datafilters.clear();addDataFilter(filter);}
	void addGroupFilter(String filter){classifier.addGroupFilter(filter);}
	void addDataFilter(String filter){datafilters.push_back(StatCondition(filter));}

	void addLine(String line){
//		Serial.println(String()+"StatAnalyzer::addLine::readFile "+line);
		String id=parseId(line);
//		Serial.println(String()+"StatAnalyzer::addLine2 loadedIds "+loadedIds.size());
//		Serial.println(String()+"StatAnalyzer::addLine2 id:"+id);
//		Serial.println(String()+"StatAnalyzer::addLine2 findInVector(id,loadedIds):"+findInVector(id,loadedIds));
//		Serial.println(String()+"StatAnalyzer::addLine2 readers.size():"+readers.size());
		if(readers.find(id)==readers.end() && findInVector(id,loadedIds)<0) {	// was not already parsed this time or previous times
			if((readers.size()+1)>MAXBLOCKSIMLOAD) {
//				Serial.println(String()+"StatAnalyzer::addLine overflow readers.size():"+readers.size());
				overflow=true;
				return ;}	// no more space in the map
// 			Serial.println(String()+"StatAnalyzer::addLine2.5::create bloc "+id);
			BlockInfoReader bloc;//			bloc.init(id);	// if we init the bloc before adding, it would be useless
 			readers[id]=bloc;
 			readers[id].init(id);
		}
		if(readers.find(id)==readers.end()) return;	//if not followed this round
//		Serial.println(String()+"StatAnalyzer::addLine3::readFile "+line);
		readers[id].addHistoryLine(line);
//		Serial.println(String()+"StatAnalyzer::addLine4::readFile "+(unsigned long)&(readers[id]));

	}

	bool dataEnd(){
//		Serial.println(String()+"StatAnalyzer::dataEnd "+readers.size());
		for(auto it : readers) {
			loadedIds.push_back(it.first);
 //			Serial.println(String()+"StatAnalyzer::dataEnd it.first:"+it.first);
			readers[it.first].end();
			//it.second.end();	// it.second very bad since we manipulate a local copy of the object and not the object itself
		}
		// here we must keep the essential
		makeStatData();
		readers.clear();
		bool b=overflow;
		overflow=false;
		return !b;
	}

	bool passDataFilters(BlockInfo &bi){
		for(StatCondition sc:datafilters){if(!sc.meetCriteria(bi)) return false;}
		return true;
	}

	void makeStatData(){
		int i=0;
		for(auto it : readers) {
			BlockInfo *bi=it.second.getBlockInfo();
			if(!passDataFilters(*bi)) continue;
//			Serial.println(String()+"StatAnalyzer::makeStatData bi:"+(unsigned long)bi+" i:"+i);
			if(bi) classifier.addData(*bi,getInfoChannels(*bi, channels));
			i++;
		}
	}



	void calculate(){
//		classifier.calculateTest();
		classifier.printResult();
		Serial.println(String()+"StatAnalyzer::calculate end  :");
	};

private:
	std::vector<float> getInfoChannels(BlockInfo &bi, std::vector<String> &channels){
//		Serial.println(String()+"getInfoChannels::  channels:"+channels.size());
		std::vector<float> ret;
		for(String s : channels) {
			float v=bi.getInt(s);
//			Serial.println(String()+"getInfoChannels::  channel:"+s+" value:"+v);
			ret.push_back(v);
		}
		return ret;

	}






};



#endif
