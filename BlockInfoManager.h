#ifndef BLOCKINFOMANAGER_H_
#define BLOCKINFOMANAGER_H_

#include "lib/datastruct/DataMap.h"
#include "lib/datastruct/GenString.h"
#include "lib/TimeUtil.h"
#include "DataManager.h"	// for version text and other const


#define HISTORY_KEYTEXT "history"
#define SPECIES_KEYTEXT "species"
#define BLOCKDATE_KEYTEXT "blockdate"
#define HARVEST_KEYTEXT "harvest"
#define CANCEL_KEYTEXT "cancel"
#define SUBSTRATE_KEYTEXT "substrate"
#define BLOCKBE_KEYTEXT "blockbe"

#define FLUSHNUMBER_KEYTEXT "flushnumber"
#define FLUSHES_KEYTEXT "flushes"
#define FORMULA_KEYTEXT "formula"

#define LINERETURN "\n"

#define CONFIG_LASTVALNAMES "lastvalnames"
#define CONFIG_SUMNAMES "sumnames"
#define CONFIG_MULTIVALNAMES "multivalnames"

#define MAXINTERVALSEC 10*SECONDSPERDAY	//days

class Interval {
	unsigned long ts;
	unsigned long ts2;
	int value=0;
public:
	Interval(unsigned long ts0,int weightval){ts=ts0;ts2=ts0;value=weightval;}
	int getValue(){return value;}
	unsigned long getTS(){return ts;};
	unsigned long getTS2(){return ts2;};
	bool overlap(unsigned long nts){
		if(nts>=ts && nts<=ts2) return true;
		unsigned long diff=0;
		if(nts>ts2) diff=nts-ts2;
		if(nts<ts) diff=ts-nts;
		if(diff<MAXINTERVALSEC) return true;
		return false;
	}
	void mergeWith(unsigned long nts, int weightval){
		if(nts<ts) ts=nts;
		if(nts>ts2) ts2=nts;
		value+=weightval;
	}
};

class IntervalList {
	std::vector<Interval> intervals;
public:
	void clear(){intervals.clear();}
	int size(){return intervals.size();};
	void addPoint(String date, String weight){
		unsigned long ts=tsFromString(date);
		int weightval=weight.toInt();
		// check if new point overlap with existing interval
		bool found=false;
		for(int i=0;i<intervals.size();i++)	if(intervals[i].overlap(ts)) {
			intervals[i].mergeWith(ts, weightval);
			found=true;
			break;
		}
		if(!found) intervals.push_back(Interval(ts,weightval));
	}
	String getJson(){
		String json="[";
		for(int i=0;i<intervals.size();i++){
			if(i>0) json+=",";
			json+="{\"ts\":\""+getTimeString(intervals[i].getTS(),true,false,false)+"\"";
			if(intervals[i].getTS2()!=intervals[i].getTS()) json+=",\"ts2\":\""+getTimeString(intervals[i].getTS2(),true,false,false)+"\"";
			json+=String()+",\"val\":\""+intervals[i].getValue()+"\"}";
		}
		json+="]";
		return json;
	}

};

class BlockInfoManager;
void statUpdate(BlockInfoManager *blockinfoman);

//////////////////////////////////////////////
class BlockInfoManager: public EventListener {
	DataMap *blockinfo, *datamap;
	std::vector<String> *dataorder;
	String history, cleanhistory, canceledhistory, currentid;
	int idindex=1;
	//	std::vector<String> lastvalnames={SPECIES_KEYTEXT, BLOCKDATE_KEYTEXT,FORMULA_KEYTEXT}, sumnames={HARVEST_KEYTEXT,SUBSTRATE_KEYTEXT};
	//	std::vector<String> lastvalnames, sumnames;
	std::map<String,String> lastvals, multivals;
	std::map<String,int> sumvals;

	int blockBE=-1;
	IntervalList flushes;

	DataMap *configmap;

public:

	BlockInfoManager(DataMap *blockinfomap0, DataMap *datamap0, std::vector<String> *dataorder0):
		blockinfo(blockinfomap0), datamap(datamap0), dataorder(dataorder0) {
		blockinfo->update(ID_TEXT,"");			// should it be set() rather than update()
		blockinfo->update(SPECIES_KEYTEXT,"");
		blockinfo->update(BLOCKDATE_KEYTEXT,"");
		blockinfo->update("substrate","");
		blockinfo->update(String()+"total"+HARVEST_KEYTEXT,"");
		blockinfo->update(String()+"total"+SUBSTRATE_KEYTEXT,"");
		blockinfo->update("blockbe","");
		blockinfo->update(HISTORY_KEYTEXT,"");
		blockinfo->update(FLUSHNUMBER_KEYTEXT,"");
		blockinfo->update(FLUSHES_KEYTEXT,"");
		blockinfo->update(FORMULA_KEYTEXT,"");
	}

	void setConfigMap(DataMap *configmap1){
		this->configmap=configmap1;
	}

	DataMap *getMap(){return blockinfo;}

	bool notify(GenString ename, Event *e){return notify(String(ename.c_str()),e);}
	bool notify(String ename, Event *e){
		Serial.println(String()+"BlockInfoManager:notify ename:"+ename);
		//	Serial.println(String()+"BlockInfoManager:Yielding server debug ts:"+millis());

		/*		if(ename[ename.length()-1]=='/') ename=ename.substring(0,ename.length()-1);
		StringMapEvent *se=0;
		if(e->isClassType("StringMapEvent")) se=(StringMapEvent *)e;
		if(se==0) return false;
		 */
		if(ename==String(ID_TEXT)) {
			postUpdateCurrentBlock();
			return true;
		}

		if(ename==String(DATAVERSION_KEYTEXT)) {
			postUpdateCurrentBlock();
			return true;
		}

		return false;
	}


private:
	int getIndexOf(String match){
		for(int i=0;i<dataorder->size();i++) if((*dataorder)[i]==match) return i;
		return -1;
	}


	//	bool waitingpostupdate=false,
	bool updatebusy=false;
	Ticker ticker;/*
#define POSTDELAY 10
		bool postUpdateCurrentBlock2(){
		Serial.println(String()+"BlockInfoManager:postUpdateCurrentBlock currentid:"+currentid);
			if(waitingpostupdate) {return false;}
			waitingpostupdate=true;
			ticker.once_ms(POSTDELAY, statUpdate,this);
			return true;
		}*/
	bool needupdate=false;
	bool postUpdateCurrentBlock(){
//		Serial.println(String()+"BlockInfoManager:postUpdateCurrentBlock currentid:"+currentid);
		needupdate=true;
		return true;
	}
public:
	void run(){
		if(needupdate) {delay(1);updateCurrentBlock();}
	}

	void updateCurrentBlock(){
//		Serial.println(String()+"BlockInfoManager:updateCurrentBlock currentid:"+currentid);

		if(updatebusy) {return;}	// busy now, schedule another update for later
		//		waitingpostupdate=false;
		needupdate=false;
//		Serial.println(String()+"BlockInfoManager:updateCurrentBlock2 currentid:"+currentid);
		//		TIMEPROFILER.reset("updateCurrentBlock","start");
		// extractHistory
		String newid=datamap->get(ID_TEXT);
		//		TIMEPROFILER.tick("updateCurrentBlock","postget");
		//	if(newid==blockinfo->get(ID_TEXT)) return;	//not the right place or else how to update
		//	if(newid==currentid) return; //do nothing //why ?

		//		Serial.println(String()+"BlockInfoManager:updateCurrentBlock currentid:"+currentid);
		//		Serial.println(String()+"BlockInfoManager:updateCurrentBlock0 debug ts:"+millis());
		//		TIMEPROFILER.tick("updateCurrentBlock","postprint");
		if(newid.length()==0) return;	// no id loaded
		updatebusy=true;
		currentid=newid;

		// 		blockinfo->update(ID_TEXT,currentid);
		//		TIMEPROFILER.tick("updateCurrentBlock","postupdate");

		idindex=getIndexOf(ID_TEXT);
		//		for(int i=0;i<dataorder->size();i++) if((*dataorder)[i]==ID_TEXT) idindex=i;
		if(idindex<0) return;
		history="";canceledhistory="";
		//		TIMEPROFILER.tick("updateCurrentBlock","preread");
		readHistory();// read file line by line						//		Serial.println(String()+"\nBlockInfoManager:updateCurrentBlock middle history:'"+history+"'");
		//		TIMEPROFILER.tick("updateCurrentBlock","postread");
		//		Serial.println(String()+"BlockInfoManager:updateCurrentBlock1 debug ts:"+millis());

		blockinfo->update(HISTORY_KEYTEXT,history);
		//		TIMEPROFILER.tick("updateCurrentBlock","posthistoryupdate");
		//		Serial.println(String()+"BlockInfoManager:updateCurrentBlock2 debug ts:"+millis());
		//		if(history.length()>0) {	// we need all the variable reinit going with history
		removeCancelled();
		//		TIMEPROFILER.tick("updateCurrentBlock","postremoveCancelled");
		//		Serial.println(String()+"BlockInfoManager:updateCurrentBlock3 debug ts:"+millis());
		parseHistory();
		blockinfo->update(ID_TEXT,currentid);
		//		TIMEPROFILER.tick("updateCurrentBlock","postparse");
		//		Serial.println(String()+"BlockInfoManager:updateCurrentBlock4 debug ts:"+millis());
		//		}		//		Serial.println(String()+"\nBlockInfoManager:updateCurrentBlock ended history:'"+history+"'");		//		Serial.println(String()+"\nBlockInfoManager:updateCurrentBlock ended blockinfo->get(HISTORY_KEYTEXT):'"+blockinfo->get(HISTORY_KEYTEXT)+"'");
		//		TIMEPROFILER.tick("updateCurrentBlock","send");
		//		TIMEPROFILER.printProfile("updateCurrentBlock");
		updatebusy=false;
	};
private:

	bool isMarked(int index, std::vector<int> vect) {
		bool found=false;
//		Serial.print(String()+"in vect of size "+vect.size()+" compare "+index+" to :");
		for(int i=0;i<vect.size();i++) {
//				if(i>0) Serial.print(", ");
//				Serial.print(String()+vect[i]+"="+index);
				if(index==vect[i]) {found=true;break;}
		}
//		Serial.println();
		return found;
	}

	void removeCancelled(){
//				Serial.println(String()+"BlockInfoManager:removeCancelled pre history :"+history);
		cleanhistory=history;
		int commandindex=getIndexOf(COMMAND_TEXT);
		int argindex=getIndexOf(ARGUMENT_TEXT);
		std::vector<int> toremove;
		int lines=tokenNumber(cleanhistory, LINERETURN);
		for(int line=0;line<lines;line++){
//						Serial.println(String()+"BlockInfoManager:removeCancelled loop line :"+line);
			bool found=false;
			for(int i=0;i<toremove.size();i++) {if(line==toremove[i]) found=true;break;}
			if(isMarked(line,toremove)) {
//				Serial.println(String()+"BlockInfoManager:removeCancelled already toremove line :"+line);
				continue;
			}
			String textline=getToken(cleanhistory, LINERETURN, line);
//			Serial.println(String()+"BlockInfoManager:removeCancelled loop text line :"+textline);

			String currentcommand=getToken(textline, String(CSV_SEP), commandindex);			//String currentarg=getToken(textline, String(CSV_SEP), argindex);
			String currentarg=getToken(textline, String(CSV_SEP), argindex);
			int vline=line;

			if(currentcommand==CANCEL_KEYTEXT){		// cancel previous commands with same id: all, just the previous one or a spefic previous one
				if(currentarg=="all") {		// don't work
//										Serial.println(String()+"BlockInfoManager:removeCancelled basic cancel all line :"+line);
					toremove.push_back(vline);
					while(vline>0) {
						vline--;
						toremove.push_back(vline);
					}
				} else if(currentarg.length()==0 || currentarg=="0") {
//									Serial.println(String()+"BlockInfoManager:removeCancelled basic cancel line :"+line);
					toremove.push_back(vline);
					while(vline>0) {
						vline--;
						if(!isMarked(vline,toremove)) {toremove.push_back(vline);break;}
					}
				} else if(currentarg.length()>0) {
//							Serial.println(String()+"BlockInfoManager:removeCancelled cancel with arg line:"+line);
					toremove.push_back(vline);
					for(int i=vline-1;i>=0;i--) {
//						Serial.println(String()+"BlockInfoManager:removeCancelled i:"+i+" toremove.size():"+toremove.size());
						if(isMarked(i,toremove)) continue;
						String prevline=getToken(cleanhistory, LINERETURN, i);
						String prevcommand=getToken(prevline, String(CSV_SEP), commandindex);
//								Serial.println(String()+"BlockInfoManager:removeCancelled i:"+i+" prevcommand:"+prevcommand+" currentarg:"+currentarg+" prevline:"+prevline);
						if(prevcommand==currentarg) {
							toremove.push_back(i);
//							Serial.println(String()+"BlockInfoManager:removeCancelled marked for removal i:"+i+" "+prevline);
							break; // remove only once per occurrence
						}
					}
				}
			}
		}

//			Serial.println(String()+"BlockInfoManager:removeCancelled presort toremove.size():"+toremove.size());
		std::sort(toremove.begin(), toremove.end());
		//	Serial.println(String()+"BlockInfoManager:removeCancelled preremove toremove.size():"+toremove.size()+" cleanhistory :"+cleanhistory);
		for(int i=toremove.size()-1; i>=0;i--){
			int line=toremove[i];
//					Serial.println(String()+"BlockInfoManager:removeCancelled remove line :"+line);
			String cleantext;
			String textline=getToken(cleanhistory, LINERETURN, line, &cleantext);
//					Serial.println(String()+"BlockInfoManager:removeCancelled remove line :"+line+" line:"+textline+" cleantext:"+cleantext);
			cleanhistory=cleantext;
			canceledhistory+=textline+LINERETURN;
			//		Serial.println(String()+"BlockInfoManager:removeCancelled remove canceledhistory :"+canceledhistory);
		}
//			Serial.println(String()+"BlockInfoManager:removeCancelled post clean history :"+cleanhistory);
//			Serial.println(String()+"BlockInfoManager:removeCancelled post canceled history :"+canceledhistory);
	}



	void parseHistory(){
		//		TIMEPROFILER.reset("parseHistory","start");
		// extract the last value of the following
		int line=0;
		int argindex=getIndexOf(ARGUMENT_TEXT);
		int commandindex=getIndexOf(COMMAND_TEXT);
		int dateindex=getIndexOf(DATE_TEXT);
		lastvals.clear();
		sumvals.clear();
		multivals.clear();
		flushes.clear();
		blockBE=-1;
//		Serial.println("Clean history to start from :"+cleanhistory);
		//		TIMEPROFILER.tick("parseHistory","prep");
		int lines=tokenNumber(cleanhistory, LINERETURN);
		//		TIMEPROFILER.tick("parseHistory","firsttok");
		//		for(int i=0;i<dataorder->size();i++) if((*dataorder)[i]=="argument")
		while(line<lines){
//								Serial.println(String()+"BlockInfoManager:parseHistory loop line :"+line);
			String textline=getToken(cleanhistory, LINERETURN, line);
//								Serial.println(String()+"BlockInfoManager:parseHistory loop textline :"+textline);
			String currentcommand=getToken(textline, String(CSV_SEP), commandindex);
			String currentarg=getToken(textline, String(CSV_SEP), argindex);
//								Serial.println(String()+"BlockInfoManager:parseHistory currentcommand :"+currentcommand+", currentarg:"+currentarg);
			calcCommand(currentcommand,currentarg);
			String currentdate=getToken(textline, String(CSV_SEP), dateindex);
			if(currentcommand==HARVEST_KEYTEXT) flushes.addPoint(currentdate, currentarg);
			line++;
		}
		//	TIMEPROFILER.tick("parseHistory","loop");
//		for(auto it : sumvals) Serial.println(String()+"BlockInfoManager:parseHistory pretest:"+it.first+" value:"+it.second);
		if((sumvals.find(HARVEST_KEYTEXT) != sumvals.end()) && (sumvals.find(SUBSTRATE_KEYTEXT) != sumvals.end())){
			if(sumvals[SUBSTRATE_KEYTEXT]!=0) blockBE=100*sumvals[HARVEST_KEYTEXT]/sumvals[SUBSTRATE_KEYTEXT];
		}
		//		TIMEPROFILER.tick("parseHistory","postloop");
		transferVals();
		//		TIMEPROFILER.tick("parseHistory","transfer");
		//		TIMEPROFILER.printProfile("parseHistory");

	};

	std::vector<String> parseArray(String array){
		std::vector<String> vect;
		if(array.length()<3) return vect;
		array=array.substring(1,array.length()-1);// we assume it is a json array
		//		Serial.println(String()+"BlockInfoManager:parseArray array:"+array);
		unsigned n=tokenNumber(array,",");
		for(unsigned int i=0;i<n;i++) {
			String tok=getToken(array,",",i);
			if(tok.length()<3) continue;
			tok=tok.substring(1,tok.length()-1);
			//			Serial.println(String()+"BlockInfoManager:parseArray tok:"+tok);
			vect.push_back(tok);
		}
		return vect;
	}

	void transferVals(){
		//		TIMEPROFILER.reset("transferVals","start");
//			Serial.println(String()+"BlockInfoManager:transferVals sumvals.size():"+sumvals.size());
		if(!configmap) return;
		std::vector<String> lastvalnames=parseArray((*configmap).get(CONFIG_LASTVALNAMES));
		std::vector<String> sumnames=parseArray((*configmap).get(CONFIG_SUMNAMES));
		std::vector<String> multivalnames=parseArray((*configmap).get(CONFIG_MULTIVALNAMES));
		//		TIMEPROFILER.tick("transferVals","parseArray");

		for(String s : lastvalnames) {
//				Serial.println(String()+"BlockInfoManager:transferVals lastvalnames s:'"+s+"' lastvals.find(s) != lastvals.end():"+(lastvals.find(s) != lastvals.end()));
			String current=blockinfo->get(s);
			if(lastvals.find(s) != lastvals.end()) {String nval=lastvals[s];
			if(current!=nval) blockinfo->update(s,nval);
//				Serial.println(String()+"BlockInfoManager:transferVals s:"+s+", lastvals[s]:"+lastvals[s]);
			} else if(current!="") blockinfo->update(s,"");

			//			TIMEPROFILER.tick("transferVals",s);
		}
		//		TIMEPROFILER.tick("transferVals","lastvalnames");
		for(String s : sumnames) {
//					Serial.println(String()+"BlockInfoManager:transferVals sumnames s:"+s+" sumvals.find(s) != sumvals.end():"+(sumvals.find(s) != sumvals.end()));
			if(sumvals.find(s) != sumvals.end()) {
				blockinfo->update(String()+"total"+s,String(sumvals[s]));
//							Serial.println(String()+"BlockInfoManager:transferVals post s:"+s+" sumvals.find(s) != sumvals.end():"+(sumvals.find(s) != sumvals.end()));				//				Serial.println(String()+"BlockInfoManager:transferVals val:"+sumvals[s]);
			} else blockinfo->update(String()+"total"+s,"");
		}
		//		TIMEPROFILER.tick("transferVals","sumnames");
		for(String s : multivalnames) {
			//		Serial.println(String()+"BlockInfoManager:transferVals multivalnames s:"+s+" sumvals.find(s) != sumvals.end():"+(sumvals.find(s) != sumvals.end()));
			if(multivals.find(s) != multivals.end()) {
				blockinfo->update(s,String(multivals[s]));
				//				Serial.println(String()+"BlockInfoManager:transferVals post s:"+s+" multivals[s]:"+(multivals[s]));				//				Serial.println(String()+"BlockInfoManager:transferVals val:"+sumvals[s]);
			} //else blockinfo->update(s,"");
		}
		//		TIMEPROFILER.tick("transferVals","multivalnames");
		blockinfo->update(FLUSHNUMBER_KEYTEXT, String(flushes.size()));
		if(flushes.size()>0) blockinfo->update(FLUSHES_KEYTEXT, flushes.getJson());
		else blockinfo->update(FLUSHES_KEYTEXT, "");
		if(blockBE!=-1) blockinfo->update(BLOCKBE_KEYTEXT, String(blockBE));
		else blockinfo->update(BLOCKBE_KEYTEXT, "");
		//		TIMEPROFILER.tick("transferVals","updates");
		//		TIMEPROFILER.printProfile("transferVals");

	}

	void calcCommand(String currentcommand, String currentarg){
//			Serial.println(String()+"BlockInfoManager:calcCommand currentcommand:"+currentcommand+" currentarg:"+currentarg);
//		for(auto it : lastvals) Serial.println(String()+"BlockInfoManager:calcCommand precalc lastvals key:"+it.first+" value:"+it.second);
		if(!configmap) return;
		std::vector<String> lastvalnames=parseArray((*configmap).get(CONFIG_LASTVALNAMES));
		std::vector<String> sumnames=parseArray((*configmap).get(CONFIG_SUMNAMES));
		std::vector<String> multivalnames=parseArray((*configmap).get(CONFIG_MULTIVALNAMES));
		for(String s : lastvalnames) {
			//				Serial.println(String()+"BlockInfoManager:calcCommand currentcommand:"+currentcommand+" s:"+s+ " (lastvals.find(s) == lastvals.end()):"+(lastvals.find(s) == lastvals.end())+" currentcommand==s:"+(currentcommand==s));
			if(currentcommand==s) {
				lastvals[s]=currentarg;
				//						Serial.println(String()+"BlockInfoManager:calcCommand updated lastvals[s] :"+lastvals[s]+" with val:"+currentarg);
			}
		}
//			for(auto it : lastvals) Serial.println(String()+"BlockInfoManager:calcCommand postcalc lastvals key:"+it.first+" value:"+it.second);
//			for(auto it : sumvals) Serial.println(String()+"BlockInfoManager:calcCommand pre sumval key:"+it.first+" value:"+it.second);
		for(String s : sumnames) {
			if(currentcommand.indexOf(s)>=0) {	// if current command contain keywork in sumnames
				if(sumvals.find(s) == sumvals.end()) sumvals[s]=0;			//
//				Serial.println(String()+"BlockInfoManager:calcCommand s:"+s+" sumvals[s]:"+sumvals[s]);
				sumvals[s]+=currentarg.toInt();				//
//				Serial.println(String()+"BlockInfoManager:calcCommand s:"+s+" sumvals[s]:"+sumvals[s]+" currentarg.toInt():"+currentarg.toInt());
				//
//				Serial.println(String()+"BlockInfoManager:calcCommand adding sumval currentcommand:"+currentcommand+" currentarg:"+currentarg);
			}
		}
		//		for(auto it : sumvals) Serial.println(String()+"BlockInfoManager:calcCommand post sumval key:"+it.first+" value:"+it.second);
		//		Serial.println(String()+"BlockInfoManager:calcCommand sumvals.size():"+sumvals.size());
		for(String s : multivalnames) {
			if(currentcommand.indexOf(s)>=0) {	// if current command contain keywork in sumnames
				if(multivals.find(s) == multivals.end()) multivals[s]=""; else multivals[s]+=", ";	//	maybe we should store data as vector ?							Serial.println(String()+"BlockInfoManager:calcCommand s:"+s+" sumvals[s]:"+sumvals[s]);
				multivals[s]+=currentarg;				//								Serial.println(String()+"BlockInfoManager:calcCommand s:"+s+" sumvals[s]:"+sumvals[s]+" currentarg.toInt():"+currentarg.toInt());
				//						Serial.println(String()+"BlockInfoManager:calcCommand adding sumval currentcommand:"+currentcommand+" currentarg:"+currentarg);
			}
		}
	}



	void loadLine(String line) {// for each line
		//	Serial.println(String()+"BlockInfoManager:loadLine line:"+line);
		String fid=extractID3(line);// parse it up to id
		//	Serial.println(String()+"BlockInfoManager:loadLine line:"+line);
		//	Serial.println(String()+"BlockInfoManager:loadLine find id:"+fid);
		if(fid==currentid) {
			if(history.length()>0) history+=LINERETURN;
			history+=line;
		}
	}

	String extractID2(String line){
		return getToken(line, String(CSV_SEP), idindex);
	}

	String extractID(String line){
		int i=line.indexOf(CSV_SEP);
		if(i<-1) return "";
		int j=line.indexOf(CSV_SEP,i+1);
		if(j<-1) return "";
		String id=line.substring(i+1,j);
		id.trim();
		return id;

		//		return getToken(line, String(CSV_SEP), idindex);
	}
	String extractID3(String line){
		unsigned s=line.length();
		unsigned found=0, foundindex=0;;
		for(unsigned int i=0;i<s;i++) {
			if(line[i]==CSV_SEP){
				if(found==idindex){
					return line.substring(foundindex+1,i);
				} else {found++;foundindex=i;}
			}
		}
		return "";

		//		return getToken(line, String(CSV_SEP), idindex);
	}

#define LINESPERDELAY 200

	// reading line by line too slow
	// instead should load a chunk of data, lets say 4K in memory,
	// then parse line by line, when finished load next chunk of data, until finished

#define BIMCHUNKSIZE 4*1024*8
#define MINICHUNKSIZE 256


	unsigned long processHistoryChunk(unsigned char *buffer, size_t size, unsigned char *minibuffer, size_t minisize){
		unsigned char *idstart=0, *linestart=0;
		bool foundid=false, tosave=false, foundstart=false;
		unsigned idindexcount=idindex;
		unsigned char *ptr=minibuffer;
		if(minisize>0) {
		//	Serial.println(String()+"BlockInfoManager:readHistory minibuffer :"+String(std::string((const char*)minibuffer,minisize).c_str()));

			linestart=minibuffer;
			for(;(ptr-minibuffer)<minisize;ptr++) {
				if(!foundid && *ptr==CSV_SEP) {
					if(idindexcount==0) {
						if(currentid==std::string((const char*)idstart,ptr-idstart).c_str()) tosave=true;
			//			Serial.println(String()+"BlockInfoManager:readHistory foundid from minibuffer :"+std::string((const char*)idstart,ptr-idstart).c_str());
					//	Serial.println(String()+"BlockInfoManager:readHistory ptr from minibuffer :"+*ptr);
						foundid=true;} //no trim here
					else {idstart=ptr+1;
						idindexcount--;}
				} else if(*ptr=='\n') {
					idindexcount=idindex;
					if(tosave) {
						history+=String(std::string((const char*)linestart,ptr-linestart).c_str())+'\n';
			//			Serial.println(String()+"BlockInfoManager:readHistory history added from minibuffer :"+String(std::string((const char*)linestart,ptr-linestart).c_str()));
						tosave=false;}
					linestart=ptr+1;
					foundid=false;
				}
			}
		}
	//	if(linestart) Serial.println(String()+"BlockInfoManager:readHistory in between linestart:"+(linestart-minibuffer)+" idindexcount:"+idindexcount);
		String leftover;
		if(linestart && (tosave || !foundid)) leftover=String(std::string((const char*)linestart,ptr-linestart).c_str());
		linestart=buffer;
		for(ptr=buffer;(ptr-buffer)<size;ptr++) {
			if(!foundid && *ptr==CSV_SEP) {
				if(idindexcount==0) {
					String foundidstr;
					if(!foundstart) {
						foundidstr=std::string((const char*)idstart,minisize-(idstart-minibuffer)).c_str();
						idstart=buffer;
					}
					foundidstr+=std::string((const char*)idstart,ptr-idstart).c_str();
			//		if(!foundstart) Serial.println(String()+"BlockInfoManager:readHistory foundid :"+foundidstr);
				//	Serial.println(String()+"BlockInfoManager:readHistory foundid :"+foundid);
					if(currentid==foundidstr) tosave=true;
					foundid=true;} //no trim here
				else {idstart=ptr+1;foundstart=true;}
				idindexcount--;
			} else if(*ptr=='\n') {
				idindexcount=idindex;
				if(tosave) {
					if(leftover.length()>0) {history+=leftover;
		//			Serial.println(String()+"BlockInfoManager:readHistory history leftover :"+leftover);
					}
					history+=String(std::string((const char*)linestart,ptr-linestart).c_str())+'\n';
		//			Serial.println(String()+"BlockInfoManager:readHistory history added :"+String(std::string((const char*)linestart,ptr-linestart).c_str()));
		//			Serial.println(String()+"BlockInfoManager:readHistory history total: :"+history);
					tosave=false;
				}
				if(leftover.length()>0) leftover="";
				//Serial.println(String()+"BlockInfoManager:readHistory processed :"+String(std::string((const char*)linestart,ptr-linestart).c_str()));

				linestart=ptr+1;
				foundid=false;
			}
		}
		return (linestart-buffer);
	};


	void readHistory() {// read file by block
//		Serial.println(String()+"BlockInfoManager:readHistory");
		unsigned long ts=millis();
		bool b=SimpleFS.exists(DATAFILENAME);
		if(!b) {Serial.println(String()+"BlockInfoManager:readHistory data file not found:"+DATAFILENAME);return;}

		std::lock_guard<std::mutex> lck(simpleFS_mutex);	//maybe operation too long to lock the whole fs
		auto file=SimpleFS.openFile(DATAFILENAME);
		size_t filesize=file->size;
		size_t currentindex=0, sizeleft=0;
		unsigned char *buffer=new unsigned char[BIMCHUNKSIZE];
		unsigned char *minibuffer=new unsigned char[MINICHUNKSIZE];

		while(currentindex<filesize) {
			size_t sizeread= SimpleFS.readFile(buffer,CHUNKSIZE,file);
			currentindex+=sizeread;
			size_t processedsize=processHistoryChunk(buffer,sizeread,minibuffer, sizeleft);
			if(processedsize<sizeread) {
		//		Serial.println(String()+"BlockInfoManager:readHistory sizeread "+(sizeread)+" bytes, processedsize:"+processedsize+" bytes");
		//		Serial.println(String()+"BlockInfoManager:readHistory leftover "+(sizeread-processedsize)+"bytes");
		//		Serial.println(String()+"BlockInfoManager:readHistory leftover content "+std::string((const char*)(buffer+processedsize),sizeread-processedsize).c_str());
				for(unsigned char *ptr2=buffer+processedsize,*targetptr=minibuffer;(ptr2-buffer)<sizeread;ptr2++,targetptr++) *targetptr=*ptr2;
		//		Serial.println(String()+"BlockInfoManager:readHistory leftover content copied"+std::string((const char*)(minibuffer),sizeread-processedsize).c_str());
				sizeleft=sizeread-processedsize;
			} else sizeleft=0;
		}
		SimpleFS.closeFile(file);
		Serial.println(String()+"BlockInfoManager:readHistory end "+(millis()-ts)+"ms");
//		Serial.println(String()+"BlockInfoManager:readHistory result history "+history);
		delete buffer;
		delete minibuffer;
	}

	// Parses the numeric suffix directly from raw memory (Zero allocations)
	long getNumericSuffix(const char* str, size_t len, const char* prefix, unsigned int targetColumn, char sep) {
	    unsigned int currentIdx = 0;
	    int startPos = 0;
	    int pfxLen = strlen(prefix);

	    for (size_t i = 0; i <= len; i++) {
	        // If we hit the separator or the end of the line segment
	        if (i == len || str[i] == sep) {
//	        	Serial.println(String()+"BlockInfoManager:getNumericSuffix i : "+i);
//	        	Serial.println(String()+"BlockInfoManager:getNumericSuffix targetColumn : "+targetColumn);
//	        	Serial.println(String()+"BlockInfoManager:getNumericSuffix currentIdx : "+currentIdx);

	            if (currentIdx == targetColumn) {
	                // If it's the right column, check if it starts with our prefix
//	            	Serial.println(String()+"BlockInfoManager:getNumericSuffix strncmp: "+strncmp(str + startPos, prefix, pfxLen));
//	            	String tst="";
//					for(int k=0;k<10 && k+startPos<len;k++) tst+=*(str+startPos+k);

//					Serial.println(String()+"BlockInfoManager:getNumericSuffix tst : "+tst);
	                if (i - startPos >= pfxLen && strncmp(str + startPos, prefix, pfxLen) == 0) {
	                    long num = 0;
	                    int numStart = startPos + pfxLen;

	                    // Parse the characters immediately following the prefix into an integer
	                    for (size_t j = numStart; j < i; j++) {
	                        if (str[j] >= '0' && str[j] <= '9') {
	                            num = (num * 10) + (str[j] - '0');
	                        } else {
	                            break; // Stop at first non-digit
	                        }
	                    }
	                    return num;
	                }
	                return -1; // Wrong prefix
	            }
	            startPos = i + 1;
	            currentIdx++;
	        }
	    }
	    return -1;
	}


public:
	long findHighestID(String startingwith) {
	//		Serial.println(String()+"BlockInfoManager:findHighestID start "+startingwith);
		    unsigned long ts = millis();
		    if (!SimpleFS.exists(DATAFILENAME)) {
		        Serial.println("BlockInfoManager:findHighestID data file not found");
		        return 0;
		    }

		    std::lock_guard<std::mutex> lck(simpleFS_mutex);
		    auto file = SimpleFS.openFile(DATAFILENAME);
		    if (!file) return 0;

		    size_t filesize = file->size;
		    size_t currentindex = 0;

		    unsigned char* buffer = new unsigned char[BIMCHUNKSIZE+1];*(buffer+BIMCHUNKSIZE)=0;

		    String leftover = "";
		    leftover.reserve(256); // Used exclusively for chunk boundaries

		    String bestLine = "";
		    long highestNumber = 0;
		    unsigned char* pfx = (unsigned char*)startingwith.c_str();
	//	    Serial.println(String()+"BlockInfoManager:findHighestID will read now "+startingwith);
		    while (currentindex < filesize) {
		    	unsigned long prechunkStartTS = millis(); // Time the whole chunk, not the characters
		        size_t sizeread = SimpleFS.readFile(buffer, BIMCHUNKSIZE, file);
		        if (sizeread == 0) break;

		        currentindex += sizeread;

		        // Flag to know if this chunk is the absolute end of the file
		        bool isEOF = (currentindex >= filesize);
		        size_t lineStart = 0;
		//        Serial.println("Chunk reading took: " + String(millis() - prechunkStartTS) + " ms");
		        unsigned long chunkStartTS = millis(); // Time the whole chunk, not the characters

		        // Note: i goes up to <= sizeread (one extra iteration) to catch the EOF cleanly
		        for (size_t i = 0; i <= sizeread; i++) {

		            bool isNewLine = (i < sizeread && buffer[i] == '\n');
		            bool isEndOfFile = (isEOF && i == sizeread && lineStart < i);

		            if (isNewLine || isEndOfFile) {
		                long currentNum = -1;
		                String tempLine;
		                unsigned char* start = 0;
		                unsigned long length = 0;

		                if (leftover.length() < 1) {
		                    start = buffer + lineStart;
		                    length = i - lineStart;
		                } else {
		                    // Stitch the cut-off part with the rest of the line from this chunk
		                    tempLine = leftover + String((char*)buffer + lineStart, i - lineStart);
		                    leftover = "";
		                    start = (unsigned char*)tempLine.c_str();
		                    length = tempLine.length();
		                }

		                // --- EVALUATE ---
		                currentNum = getNumericSuffix((const char*)start, length, (const char*)pfx, idindex, CSV_SEP);

		                if (currentNum > highestNumber) {
		                    highestNumber = currentNum;
		                    bestLine = String((char*)start, length);
		                    // It is OK to print here because finding a HIGHER number only happens a few times per file!
		                //    Serial.println("New Highest ID found: " + String(currentNum) + " in line: " + bestLine);
		                }

		                lineStart = i + 1; // Move start pointer past this line
		            }
		        }

		        // Only save partial lines to 'leftover' if we haven't reached the EOF yet
		        if (lineStart < sizeread && !isEOF) {
		            leftover += String((char*)buffer + lineStart, sizeread - lineStart);
		        }

		 //       Serial.println("Chunk processed in: " + String(millis() - chunkStartTS) + " ms");
		    }
		   // Serial.println(".");
		    SimpleFS.closeFile(file);
		    delete[] buffer;
		    Serial.println(String()+"BlockInfoManager:findHighestID found number: "+startingwith+String(highestNumber));
		    Serial.println("BlockInfoManager: findHighestID search took " + String(millis() - ts) + "ms");
		    return highestNumber;
		}


	void readHistory2() {// read file line by line -> too slow
		Serial.println(String()+"BlockInfoManager:readHistory");
		unsigned long ts=millis();
		bool b=SimpleFS.exists(DATAFILENAME);
		unsigned int lines=0;
		unsigned long microsecsread=0, microsecsload=0, microsecswait=0;
		if(b){
			auto file=SimpleFS.openFile(DATAFILENAME);
			String line=""; bool started=false;
			int delaycount=LINESPERDELAY;
			while (line.length()>0 || !started) {
				unsigned long preread=micros();
				if(delaycount==0) {yield();delay(1);delaycount=LINESPERDELAY;} //keep watchdog happy if reading the file is too long
				delaycount--;
				microsecswait+=micros()-preread;
				preread=micros();
				line=SimpleFS.readLine(file);
				microsecsread+=micros()-preread;
				preread=micros();
				//	Serial.println(String()+"BlockInfoManager:readHistory post readLine "+(millis()-preread)+"ms ");
				if(line.length()>0) loadLine(line);
				microsecsload+=micros()-preread;
				//	Serial.println(String()+"BlockInfoManager:readHistory post loadLine "+(millis()-preread)+"ms ");
				started=true;
				lines++;
			}
			SimpleFS.closeFile(file);
			Serial.println(String()+"BlockInfoManager:readHistory end "+(millis()-ts)+"ms, lines: "+lines);

			Serial.println(String()+"BlockInfoManager:readHistory microsecsread "+(microsecsread/1000)+"ms, microsecsload: "+(microsecsload/1000)+"ms, microsecswait:"+(microsecswait/1000)+"ms");
			Serial.print(String()+"BlockInfoManager:readHistory freemem: ");
			Serial.println(ESP.getFreeHeap());
		}
	}

};

void statUpdate(BlockInfoManager *blockinfoman){
	Serial.println(String()+"BlockInfoManager:statUpdate");
	if(blockinfoman) blockinfoman->updateCurrentBlock();
};

#endif




