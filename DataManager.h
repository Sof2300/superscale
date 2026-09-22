#ifndef DATAMANAGER_H_
#define DATAMANAGER_H_

#include <Ticker.h>

#define DATAFILENAME "/data.txt"
#define HEADERFILENAME "/headers.txt"
#define CSV_SEP ','

#include "lib/datastruct/DataMap.h"
#include "lib/TimeUtil.h"
#include "RemoteSyncServer.h"

#define DATE_TEXT "date"
#define ID_TEXT "id"
#define ARGUMENT_TEXT "argument"
#define COMMAND_TEXT "command"

#define NOHTML_TEXT "nohtml"


// beeps
#define SETBLOCKFREQ 440 //440
#define SETBLOCKLENGTH 200
#define SETFREQ 880
#define SETLENGTH 200
#define SAVEFREQ 3520
#define SAVELENGTH 180
#define ERRORFREQ 220
#define ERRORLENGTH 600

#define REQFREQ 660
#define REQLENGTH 35
#define REQJSONFREQ 110
#define REQJSONLENGTH 15

#define DEFAULT_COMMAND "defaultcommand"
#define HARVEST_KEYWORD "harvest"
#define BLOCKDATE_TEXT "blockdate"
#define WEIGHT_TEXT "weight"
#define CANCEL_TEXT "cancel"

#define BLOCKGENERATE_KEYTEXT "block-generate"
#define SAVEONSET_KEYTEXT "save-on-set"
#define DATAVERSION_KEYTEXT "data-version"
#define FREESPACE_KEYTEXT "free-space"

#define LOWERSCALEPACK "command"

#define LINE_TEXT "line"
#define MINIMUMSPACE 100//000000
#define LOWSPACE 100*1024

#define INACTIVITY_DURATION_SEC_KEYWORD "inactivitydurationsec"
//#define INACTIVITY_TIMEOUT 3600000

#include "BlockInfoManager.h"


std::map<String,String> stdToStringMap(std::map<std::string, std::string> *values){ // maybe should find which datamap contain this key, then make the change // when we get a set request :
	std::map<String, String> nmap;
	for(auto it=values->begin();it!=values->end();it++) nmap[it->first.c_str()]=it->second.c_str();
	return nmap;
}

bool shouldAutofillWeight(String key, String val, String comm){
	if(key==ARGUMENT_TEXT && val.length()==0 && comm!=BLOCKDATE_TEXT && comm!=CANCEL_TEXT && comm.length()>0) return true;
	return false;
}
bool shouldAutofillDate(String key, String val, String comm){
	if(key==DATE_TEXT && val.length()==0) return true;
	if(key==ARGUMENT_TEXT && val.length()==0 && comm==BLOCKDATE_TEXT) return true;
	return false;
}

bool shouldPull(String key, String data, String command){
	if(shouldAutofillDate(key,data,command)) return true;
	if(shouldAutofillWeight(key,data,command)) return true;
	String vallow=data;
		vallow.toLowerCase();
		//Serial.println(String()+"DataManager:shouldAutofillDate vallow:"+vallow);
	if((key==DATE_TEXT || key==ARGUMENT_TEXT) && vallow=="today()") return true;
	return false;
}

String pullData(String key, String data, String command, DataMap *scalemap, bool nodatepulling=false){
	if(shouldAutofillDate(key,data,command)) {	// find date and replace
		if(key==DATE_TEXT && nodatepulling) return data;
		String timestr=getTimeString(true,false,false);
//		Serial.println(String()+"DataManager:pullData time:"+timestr.c_str());
		return timestr;
	}
//	Serial.println(String()+"DataManager:pullData key '"+key+"' should pull weight:"+shouldAutofillWeight(key,data,command));
	if(shouldAutofillWeight(key,data,command)) {	// find weight and replace
		String weight=scalemap->get(WEIGHT_TEXT);
//			Serial.println(String()+"DataManager:pullData weight:"+weight.c_str());
		return weight;
	}
	String vallow=data;
	vallow.toLowerCase();
	//Serial.println(String()+"DataManager:shouldAutofillDate vallow:"+vallow);
	if((key==DATE_TEXT || key==ARGUMENT_TEXT) && vallow=="today()") {
		String timestr=getTimeString(true,false,false);
//		Serial.println(String()+"DataManager:pullData time :"+timestr.c_str());
		return timestr;
	}

	return data;
}

#include "PileManager.h"
#include "MultiManager.h"
/*
class DataManager;
void statSave(DataManager *dataman);
 */
class DataManager: public EventListener {
	DataMap datamap, dataconfigmap, blockinfo, scalemap, configstate;
	std::vector<String> dataorder;//={"date","id", "command","argument"};
	std::vector<String> configvars={MULTI_KEYTEXT,PILE_KEYTEXT,SAVEONSET_KEYTEXT,BLOCKGENERATE_KEYTEXT,PILE_FIFO_KEYTEXT};

	MultiManager multiman;
	PileManager pileman;

	RemoteSyncServer remoteSyncServer;
	BlockInfoManager *blockinfomanptr;

	Beeper *beeper=0;
	bool timesynced=false;

	unsigned long lastInteractionTime = 0;
//	const unsigned long INACTIVITY_TIMEOUT = 3600000;

public:
	bool fileready=true;


	DataManager (): multiman(&datamap,&configstate,&dataorder), pileman(&datamap,&(multiman.getMap()),&configstate,&scalemap){}

	bool isTimesynced(){return timesynced;}
	DataMap *getDataMap(){return &datamap;}
	DataMap *getDataConfigMap(){return &dataconfigmap;}
	DataMap *getConfigStateMap(){return &configstate;}
	DataMap *getBlockInfoMap(){return &blockinfo;}
	DataMap *getScaleMap(){return &scalemap;}
	std::vector<String> *getDataOrder(){return &dataorder;}

	RemoteSyncServer *getRemoteSyncServer(){return &remoteSyncServer;}
	void initRemoteSync(const String &filename){ remoteSyncServer.init(filename); }

	std::vector<GenString> getUrlNames(){
		std::vector<GenString>vect={"/set","/setBypass","/save","/tare", "boottime","/json","/clear","/clearAll","/deleteDataFile","/filewrite","/setBypass","/undo","/generateID"},
				v2=multiman.getUrlNames(), v3=pileman.getUrlNames(), v4=RemoteSyncServer::getUrlNames();
		for(GenString s:v2) vect.push_back(s);
		for(GenString s:v3) vect.push_back(s);
		for(GenString s:v4) vect.push_back(s);
		return vect;
	}

	void eraseDataFile(){
		SimpleFS.erase(DATAFILENAME);
	};

	void registerInteraction() {
			//	Serial.println(String()+"DataManager::registerInteraction");
				lastInteractionTime = millis();
			}

	void setBlockInfoMan(BlockInfoManager *blockinfomanptr0){blockinfomanptr=blockinfomanptr0;}

	void run() {
			String def=dataconfigmap.get(INACTIVITY_DURATION_SEC_KEYWORD);
			if(def.length()==0){
//				Serial.println(String()+"DataManager::Inactivity timeout: def is no good :"+def+" "+INACTIVITY_DURATION_SEC_KEYWORD);
				return;
			} //else Serial.println(String()+"DataManager::Inactivity timeout: def good :"+def+" "+INACTIVITY_DURATION_SEC_KEYWORD);

			long INACTIVITY_TIMEOUT=(long)1000*def.toInt();
			// If 1 hour has passed since the last interaction
	//		Serial.println(String()+"DataManager::Inactivity lastInteractionTime:"+lastInteractionTime);

	//		Serial.println(String()+"DataManager::Inactivity timeout:INACTIVITY_TIMEOUT:"+INACTIVITY_TIMEOUT);
	//		Serial.println(String()+"DataManager::Inactivity timeout:millis() - lastInteractionTime:"+(millis() - lastInteractionTime));

			if (lastInteractionTime > 0 && (millis() - lastInteractionTime > INACTIVITY_TIMEOUT)) {
				String def=dataconfigmap.get(DEFAULT_COMMAND);

				if (def.length()>0 && get(COMMAND_TEXT) != def) {
					Serial.println(String()+"DataManager::Inactivity timeout: Reverting to default command :"+def);
					// Use update() to change it silently without beeping, but still updates the screen
					datamap.update(COMMAND_TEXT, def);
					datamap.update(ARGUMENT_TEXT, "");
					beepError();beepError();beepError();
				}
				lastInteractionTime = millis(); // Reset timer so it doesn't fire constantly
			}
		}

	void load(Beeper *beeper0=0){	// load headers file
		if(beeper0) beeper=beeper0;
		size_t size=0;
		GenString headers=SIMPLEFS.readFileToStdString(GenString(HEADERFILENAME),size);
		Serial.println (String()+"Datamanager::load headers '"+headers.c_str()+"'");
		if(headers.size()>0) {
			std::vector<GenString> vect=explode(headers,CSV_SEP);
			dataorder.clear();
			for(GenString s : vect) dataorder.push_back(s.c_str());
		}
		for(String vn:dataorder) {
			datamap.set(vn.c_str(), "");
			//		Serial.println (String()+"Datamanager::load header :"+vn);
		}

		scalemap.set("weight","0");
		scalemap.set("totare","0");

		configstate.set(MULTI_KEYTEXT,"0");	//should be in another non saved map ?

		configstate.set(SAVEONSET_KEYTEXT,"0");
		configstate.set(BLOCKGENERATE_KEYTEXT,"0");
		configstate.set(DATAVERSION_KEYTEXT,"0");

		multiman.loadFromFile();
	}


	void beepnotify(){if(beeper){beeper->simpleBeep(REQFREQ,REQLENGTH);}	}//					Serial.println (String()+"Datamanager:: will beepnotify");
	void beepjsonnotify(){if(beeper){beeper->simpleBeep(REQJSONFREQ,REQJSONLENGTH);}	}//					Serial.println (String()+"Datamanager:: will beepnotify");

	bool pushOnSet(StringMapEvent *se){
		bool change=false;
		for(auto it:se->values) {
			String key=it.first.c_str(), val=it.second.c_str();
			if(datamap.exists(key) && datamap.get(key)!=val) {change=true;break;}
		}
		if(!change) return false;
		if(!se->exists(PILE_KEYTEXT) && configstate.get(PILE_KEYTEXT)=="1" && configstate.get(SAVEONSET_KEYTEXT)=="0"){ // when we saveonset we don't want to pile in the same time to unpile it just afterward
			//			Serial.println(String()+"Datamanager::notify PILE_KEYTEXT:"+PILE_KEYTEXT+" configstate.get(PILE_KEYTEXT):"+configstate.get(PILE_KEYTEXT));
			pileman.push();
		}
		return true;
	}

	bool hasDataArgs(StringMapEvent *se){
		for(auto it : se->values)
			for(String s : dataorder) {
				String key=it.first.c_str();
				if(key==s) return true;
				if(multiman.getMultiKey(key)==s) return true;
				//if(pileman.pileSubKey(key)==s) return true;
			}

		return false;
	}
	bool inDataOrder(String key){
		for(String s : dataorder) {
			if(key==s) return true;
			if(multiman.getMultiKey(key)==s) return true;
		}
		return false;
	}
	bool isLineArg(String key){
		String t=LINE_TEXT;
		if(key.substring(0,t.length())==t) return true;
		return false;
	}
	int getLineNum(String key){
		String t=LINE_TEXT;
		if(key.length()==t.length()) return -1;
		return key.substring(t.length()).toInt();
	}

	void translateArguments(StringMapEvent *se){
		std::map<String,String> nmap;
		std::vector<String> toremove;
		for(auto it : se->values){
			String key=it.first.c_str();
			if(isLineArg(key)) {
				int linenum=getLineNum(key), max=tokenNumber(it.second.c_str(),",");
				for(int i=0;i<dataorder.size();i++) {
					if(i>=max) break;
					String s=dataorder[i], nkey, val=getToken(it.second.c_str(),",",i);
					if(val.length()==0) continue;
					if(linenum<0) nkey=s;
					else nkey=multiman.makeMultiKey(s,linenum);
					nmap[nkey]=val;
					//	Serial.println(String()+"DataManager::translateArguments linenum:"+linenum);
					//	Serial.println(String()+"DataManager::translateArguments nkey:"+nkey+" val:"+val+" key:"+key+" oval:"+it.second.c_str());
				}
				toremove.push_back(key);
			}
		}
		for(String s: toremove) {
			auto it=se->values.find(s.c_str());
			se->values.erase(it);
		}
		for(auto it: nmap) se->values[it.first.c_str()]=it.second.c_str();
	}

	bool containConfig(StringMapEvent *se){
		for(String v:configvars) if(se->exists(v.c_str())) return true;
		return false;
	}

	bool startsetrequest(StringMapEvent *se){
		pushOnSet(se);
		bool changed=false, cconf=containConfig(se);
		if(!cconf && hasDataArgs(se) && configstate.get(MULTI_KEYTEXT)=="1") changed=multiman.multiAddRequest(se);
		else changed=setRequest(se);// maybe this class should only modify model, and this trigger another class to autofill by loading or save an entry// this would mean another variable that would be tosave//		se->insertValue("type","text/html");
		if(changed && !cconf && configstate.get(SAVEONSET_KEYTEXT)=="1") saveCurrent();	//should not save on setting the param on/off
		return changed;
	}

	bool notify(GenString ename, Event *e){return notify(String(ename.c_str()),e);}
	bool notify(String ename, Event *e){
		//Serial.println(String()+"DataManager:notify ename:"+ename);
		if(ename[ename.length()-1]=='/') ename=ename.substring(0,ename.length()-1);
		StringMapEvent *se=0;
		if(e->isClassType("StringMapEvent")) se=(StringMapEvent *)e;
		if(se==0) return false;

		translateArguments(se);

		if(ename==String("/set")) {registerInteraction();
			beepnotify();
			bool changed=startsetrequest(se);
			String nohtmltext=se->get(NOHTML_TEXT);
			bool nohtml=false;
			if(nohtmltext=="1") nohtml=true;
			reply(changed, se, nohtml);
			return true;
		}
		if(ename==String("/setBypass")) {registerInteraction();
			beepnotify();
			bool changed =setRequest(se);
			reply(changed,se);
			return true;
		}
		// to save substrate we need to cancel each substrate that is in the history and not in the new command
		if(ename==String("/save")) {registerInteraction();
			beepnotify();
			bool b=saveRequest(se);
			String nohtmltext=se->get(NOHTML_TEXT);
			bool nohtml=false;
			if(nohtmltext=="1") nohtml=true;
			reply(b,se, nohtml);
			return true;
		}
		if(ename==String("/tare")) {registerInteraction();
			beepnotify();
			scalemap.update("totare","1");
			reply(1,se);
			return true;}// not a supergood way to communicate with scale

		if(ename=="boottime"){
			beepnotify();
			String str=se->get("boottime").c_str();
			now32_boottime=str.toInt();
			//		dataconfigmap.update("timestamp", getTimeString(now32_boottime,true,true,true));
//			Serial.println(String()+"Datamanager updated now32_boottime to "+now32_boottime+" / "+getTimeString(now32_boottime,true,true,true).c_str());
			dataconfigmap.update("boottime",getTimeString(now32_boottime,true,true,true));
			timesynced=true;	//
			String stime=getTimeString(true,false,false);	//
//			Serial.println(String()+"DataManager:updated time :"+stime.c_str());
			return true;
		}

		if(ename==String("/json")) {
			beepjsonnotify();
			se->insertValue("response",makeJson().c_str());
			return true;
		}
		if(ename==String("/undo")) {registerInteraction();
			beepnotify();
			bool b=undo();
			if(!b) beepError();
		//	Serial.println(String()+"Undo handled");
			return true;
		}
		if(ename==String("/clear")) {registerInteraction();
			beepnotify();
			bool b=clear();
			reply(b,se);
			return true;
		}
		if(ename==String("/clearAll")) {registerInteraction();
			beepnotify();
			bool changed=clear();
			bool changed2=multiman.clearAll();
			bool changed3=pileman.clearPile();
			reply(changed || changed2 || changed3,se);
			return true;
		}
		if(ename==String("/generateID")) {registerInteraction();
/*			String nohtmltext=se->get(NOHTML_TEXT);
			bool nohtml=false;
			if(nohtmltext=="1") nohtml=true;
*/			if(!blockinfomanptr) {
				Serial.println(String()+"DataManager::notify generateID: Error blockinfoptr null!");
				beepError(); reply(0,se);return true;
			}
			if(configstate.get(BLOCKGENERATE_KEYTEXT)=="1"){
				beepnotify();beepnotify();
				String id=datamap.get(ID_TEXT);
				replyText(id,se);
				return false;
			}
			beepnotify();beepnotify();beepnotify();
			String cid=datamap.get(ID_TEXT);
			if(se->get(ID_TEXT).length()>0) cid=se->get(ID_TEXT);
			if (cid.length()==0) {
				Serial.println(String()+"DataManager::notify generateID: Error id null!");
				beepError(); reply(0,se);return true;
			}
			int i=0;
			while(!(cid[i] >= '0' && cid[i] <= '9') && i<cid.length()) i++;
			String base=cid.substring(0,i);
			long highest=blockinfomanptr->findHighestID(base);
			//if(highest==0) highest=1;
			String newid=base+String(highest+1);
			Serial.println(String()+"DataManager::notify generateID: newid:"+newid);
			se->updateValue(ID_TEXT,newid.c_str());
//			Serial.println(String()+"DataManager::notify generateID: in se:"+se->get(ID_TEXT));;
			startsetrequest(se);
			replyText(newid,se);
			return true;
		}

		if(ename==String("/deleteDataFile")) {
			beepnotify();
			eraseDataFile();
			reply(1,se);
			return true;
		}
		if(ename==String("/filewrite")) {
			beepnotify();
			if(se->exists("path") && se->exists("content")) {
				String p=se->get("path"),content=se->get("content");
				if(writePermitted(p)) {
					bool b=serveFileWrite(p,content);
					if(b) se->insertValue("response",(String()+"File updated "+p).c_str());
					else se->insertValue("response",(String()+"File NOT updated "+p).c_str());
				} else se->insertValue("response",(String()+"Writing not allowed for "+p).c_str());
			}
		}

		bool captured=false;
		bool ret=multiman.processRequest(ename,se,&captured);
		if(captured) {beepnotify();reply(ret,se);return true;}
		if(!captured){
			ret=pileman.processRequest(ename,se,&captured);
			if(captured) {beepnotify();reply(ret,se);return true;}
		}
		if(!captured){
			ret=remoteSyncServer.processRequest(ename,se,&captured);
			if(captured) {beepnotify();return true;}
		}

		return false;
	}
	/*
	/////// trying to fix the crash when we let the tcp wait too long
	bool waitingpostsave=false;
	Ticker ticker;
	#define POSTDELAY 10
public:
	StringMapEvent sesave;
private:
	bool postSaveRequest(StringMapEvent *se){	//not used anymore should remove it
		sesave=StringMapEvent(se->values);
		if(waitingpostsave) return false;
		waitingpostsave=true;
		ticker.once_ms(POSTDELAY, statSave,this);
		return true;
	}
	 */
	bool clear(){
		bool b=false;
		for(auto it : *datamap.getMap()) {
			if(it.second!=""){
				bool b2=set(it.first,"");
				if(b2) b=true;
			}
		}
		return b;
	}

private:

	bool writePermitted(String path){return true;}

	bool serveFileWrite(String path, String &cont){
		String p0=path;
		Serial.println(String()+("Filewrite : ")+path+(" ")+ p0 +(" :")+cont);
		if(startsWith(p0.c_str(),"http://")) {//remove http and host
			int pos=p0.indexOf("/",7);
			if(pos>=0) p0=p0.substring(pos);
		}
		SimpleFS.rewriteFile(p0.c_str(),(unsigned char *)cont.c_str(),cont.length());//write file
		return true;
	}



	bool savableData(){
		if(!timesynced && datamap.get(DATE_TEXT).length()==0) return false;	//have a timestamp or a provided date
		if(datamap.get(ID_TEXT).length()==0) return false;					// have an id provided
		return true;
	}
	bool savableLine(std::map<String,String> *map){
		if(map->find(COMMAND_TEXT) != map->end()) if((*map)[COMMAND_TEXT].length()>0) return true; // if command has value
		return false;
	}
	String tosave="";
	bool saveLine(std::map<String,String> *map){

		//	TIMEPROFILER.reset("saveLine","start");
		//		Serial.println("DataManager::saveLine :");
		unsigned long ts=millis();
		//for(auto it:*map) Serial.print(String()+it.first+"="+it.second+", ");
		//Serial.println();
//		Serial.println(String()+"DataManager::saveLine 1.5 : "+get(COMMAND_TEXT,map)+ ": "+get(ARGUMENT_TEXT,map));
		if(!savableLine(map)) return false;
//		Serial.println(String()+"DataManager::saveLine 1.6 : "+get(COMMAND_TEXT,map)+ ": "+get(ARGUMENT_TEXT,map));
		String arg=pullData(ARGUMENT_TEXT, get(ARGUMENT_TEXT,map), get(COMMAND_TEXT,map), &scalemap);	// make pull to test before pack
//		Serial.println(String()+"DataManager::saveLine 1.7 command : "+get(COMMAND_TEXT,map)+ ", arg: '"+arg+"'");
		if(!testSavability(get(COMMAND_TEXT,map),arg)) return false;
//		Serial.println(String()+"DataManager::saveLine 1.8 command : "+get(COMMAND_TEXT,map)+ ", arg: '"+arg+"'");

		//		Serial.println(String()+"DataManager::saveLine 1 :"+(millis()-ts)+"ms");ts=millis();

		//		Serial.println(String()+"DataManager::saveLine 1.5 :"+(millis()-ts)+"ms");ts=millis();
		String packed="";
		String command=(*map)[COMMAND_TEXT];
		//		Serial.println(String()+"DataManager::saveLine 2 :"+(millis()-ts)+"ms");ts=millis();
		//	TIMEPROFILER.printick("saveLine","prepackloop");
		for(int i=0;i<dataorder.size();i++){
			String key=dataorder[i];
			if(i>0) packed+=CSV_SEP;
			if(map->find(key) != map->end()){	// what if key not found, shouldn't we add a csv sep anyway ?
				String topack=(*map)[key];
				//			Serial.println(String()+"DataManager::saveLine 2.5 :"+topack.length());
			//	TIMEPROFILER.printick(String()+"saveLine","prepulldata"+topack);
				if(shouldPull(key, topack, command)) topack=pullData(key, topack, command, &scalemap);
			//				TIMEPROFILER.printick(String()+"saveLine","postpulldata"+topack);
				packed+=topack;
			}
		}
		//	TIMEPROFILER.printick("saveLine","postpackloop");
		//		Serial.println(String()+"DataManager::saveLine 3 :"+(millis()-ts)+"ms");ts=millis();
		//		Serial.println(String()+"DataManager:saveRequest packing 5:"+packed.c_str());
		packed+="\n";
		//		Serial.println(String()+"DataManager:saveRequest packed:"+packed.c_str());
		//		SIMPLEFS.appendToFile(DATAFILENAME, packed.c_str());
		tosave+=packed;

		if(beeper){	// this should be done asynchronously
			//			Serial.println (String()+"Datamanager:: will beep 1 save request done");
			beeper->simpleBeep(SAVEFREQ,SAVELENGTH);
		}

		//		Serial.println(String()+"DataManager::saveLine 4 :"+(millis()-ts)+"ms");ts=millis();
		return true;
	}


	///////////////////////////////// range request
	bool testRangeRequest(String idrange){
		if(idrange.indexOf("->")>0) return true;
		if(idrange.indexOf(",")>0) return true;
		return false;
	}

	String getDigits(String id) {
		for(int i=id.length()-1;i>=0;i--) if(!isDigit(id[i])) {
			//		Serial.println(String()+"DataManager::getDigits :"+id.substring(i+1));
			return id.substring(i+1);
		}
		//	Serial.println(String()+"DataManager::getDigits : not found in "+id);
		return id;
	}
	void interpolateTokens(String start, String end, std::vector<String> *range) {
		//		Serial.println(String()+"DataManager::interpolateTokens 0");
		String digitstart=getDigits(start);
		String digitend=getDigits(end);
		//		Serial.println(String()+"DataManager::interpolateTokens digitstart:"+digitstart+", digitend:"+digitend);
		if(digitstart.length()==0 || digitend.length()==0) return;
		// check if same beginning
		String startbeg=start.substring(0,start.length()-digitstart.length());
		String endbeg=end.substring(0,end.length()-digitend.length());
		//		Serial.println(String()+"DataManager::interpolateTokens startbeg:"+startbeg+", endbeg:"+endbeg);
		if(startbeg!=endbeg) return;
		unsigned startn=digitstart.toInt();
		unsigned endn=digitend.toInt();
		//		Serial.println(String()+"DataManager::interpolateTokens startn:"+startn+", endn:"+endn);
		if(startn>endn) {unsigned n2=startn;startn=endn;endn=n2;}
		for(int i=startn;i<=endn;i++) range->push_back(startbeg+i);
	}

	std::vector<String> idRangeToList(String rangetext){
		std::vector<String>range;
		String res;
		unsigned n=tokenNumber(rangetext,",");
		//		Serial.println(String()+"DataManager::idRangeToList 0: tokenNumber n:"+n);
		for(unsigned i=0;i<n;i++) {
			String tok=getToken(rangetext,",", i,&res);
			unsigned tn=tokenNumber(tok,"->");
			//			Serial.println(String()+"DataManager::idRangeToList 1: tokenNumber tn:"+tn);
			if(tn==1) range.push_back(tok);
			else if(tn>1){
				String starttok=getToken(tok,"->",0,&res);
				String endtok=getToken(tok,"->",1,&res);
				//				Serial.println(String()+"DataManager::idRangeToList 1: starttok:"+starttok+", endtok:"+endtok);
				interpolateTokens(starttok,endtok,&range);
			}
		}
		return range;
	}

	std::vector<String> savedvect;
	unsigned int savedmax=5;
	void addToSave(String str){
		savedvect.push_back(str);
		if(savedvect.size()>savedmax) savedvect.erase(savedvect.begin());
	}

public:
	bool publicUndo(){
		beepnotify();
		bool b=undo();
		if(!b) beepError();
		return b;
	}
private:
	bool undo() {
		if(savedvect.size()==0) return false;
		unsigned long undo_ts=millis();
		long diff=millis()-undo_ts;
		String newstr="";
		String str=savedvect[savedvect.size()-1];
//		Serial.println(String()+"Will undo :"+str);
 		savedvect.erase(savedvect.begin()+savedvect.size()-1);

		int method=1;
		if(method==1) {
				std::vector<String> expl=explode(str,"\n");
			for(String s : expl){
					std::vector<String> expl2=explode(s,",");
		//		Serial.println(String()+"Will explundo :"+str+" expl2.size():"+expl2.size());
				if(expl2.size()!=4) continue;
				newstr+=expl2[0]+","+expl2[1]+",cancel,"+expl2[2]+"\n";
			}
		} else {

		}

	 	diff=millis()-undo_ts;
		Serial.println(String()+"undo half after "+diff+"ms");
//		Serial.println(String()+"undone from:'"+str+"'");
//		Serial.println(String()+"To:'"+newstr+"'");
		unsigned written=SIMPLEFS.appendToFile(DATAFILENAME, newstr.c_str());
		Serial.println(String()+"undo 3/4 after "+diff+"ms");
		if(written!=newstr.length()) {
			beeper->reset();
			Serial.println(String()+"undo cannot write :"+newstr);
			beepError();beepError();beepError();
			return false;
		}
		incrementDatafileUpdateID();

		if(beeper) beeper->simpleBeep(SAVEFREQ,SAVELENGTH);
		diff=millis()-undo_ts;
		Serial.println(String()+"undo end after "+diff+"ms");
		return true;
	}

	bool rangeSaveRequest(StringMapEvent *se, bool *error) {
		Serial.println(String()+"DataManager::rangeSaveRequest");
		//	TIMEPROFILER.reset("rangeSaveRequest","start");
		//	unsigned long ts=millis();
		if(!se->exists(ID_TEXT)) return false;	// no id provided
		String idstring=se->get(ID_TEXT);
		if(!timesynced && datamap.get(DATE_TEXT).length()==0) {beepError();*error=true;return true;}	//date not defined
		bool b=testRangeRequest(idstring);
		if(!b) return false;	//no "," or "->" in id
		se->values.erase(ID_TEXT);
		setRequest(se);
		std::vector<String>range=idRangeToList(idstring);
		//	Serial.println(String()+"DataManager::rangeSaveRequest 0: range size:"+range.size());
		for(String s:range) Serial.println(String()+"Range:"+s);
		// save each id all at once
		//	Serial.println(String()+"DataManager::rangeSaveRequest 1: range size:"+range.size());
		if(range.size()==0) {beepErrorShort();*error=true;return true;} //no range built
		//	Serial.println(String()+"DataManager::rangeSaveRequest 2 "+(millis()-ts)+"ms");ts=millis();
		bool changed=false;
		String lastkey;
		//	TIMEPROFILER.printick("rangeSaveRequest","presaveloop");
		// could prepull date instead every saveLine
		for(String s:range) {
			delay(1);
			datamap.set(ID_TEXT,s);
			changed=saveLine(datamap.getMap());
			//		Serial.println(String()+"DataManager::rangeSaveRequest 3 :"+(millis()-ts)+"ms");ts=millis();
			//		Serial.println(String()+"DataManager::rangeSaveRequest 3:"+tosave);
			if(!changed) beepError();
			std::vector<std::map<String,String>> multitosave=multiman.multiSave();
			//	Serial.println(String()+"DataManager::rangeSaveRequest 4 :"+(millis()-ts)+"ms");ts=millis();
			for(std::map<String,String> m :multitosave) {
				Serial.println(String()+"DataManager::rangeSaveRequest 5:"+m[COMMAND_TEXT]+"="+m[ARGUMENT_TEXT]);
				if(m[COMMAND_TEXT]==HARVEST_KEYWORD){
		//			if(!testSavability(get(COMMAND_TEXT),get(ARGUMENT_TEXT))) continue;//return false;	// no need test done in saveline
//					if(m[ARGUMENT_TEXT].length()==0 || m[ARGUMENT_TEXT].toInt()==0 || m[ARGUMENT_TEXT].toInt()==1) continue;
				}	// skip if harvest with no argument, harvest with 0 or 1 as argument
				delay(1);
				bool b=saveLine(&m);
				//			Serial.println(String()+"DataManager::rangeSaveRequest 5 :"+(millis()-ts)+"ms");ts=millis();
				//			Serial.println(String()+"DataManager::rangeSaveRequest 5:"+tosave);
				if(!b) beepErrorShort();
				changed=changed || b;
			}
			//	Serial.println(String()+"DataManager::rangeSaveRequest 5.5 :"+(millis()-ts)+"ms");ts=millis();
			lastkey=s;
			beeper->simpleBeep(REQFREQ,20);
		}
		//	TIMEPROFILER.printick("rangeSaveRequest","postsaveloop");

		if(changed) {
			//		Serial.println("DataManager::rangeSaveRequest : saving: \n"+tosave);
			//		Serial.println("DataManager::rangeSaveRequest : endsave");
			Serial.println(String()+"DataManager::rangeSaveRequest appending "+tosave.length()+" bytes :\n"+tosave);//ts=millis();
			//		TIMEPROFILER.printick("rangeSaveRequest","preappend");
			unsigned written=SIMPLEFS.appendToFile(DATAFILENAME, tosave.c_str());
			if(written!=tosave.length()) {
				beeper->reset();
				beepError();beepError();beepError();
			}
			addToSave(tosave);
			//		TIMEPROFILER.printick("rangeSaveRequest","postappend");
			/*	if(beeper){	// this should be done asynchronously
				//			Serial.println (String()+"Datamanager:: will beep 1 save request done");
				beeper->simpleBeep(SAVEFREQ,SAVELENGTH);
			}*/
			//			Serial.println(String()+"DataManager::rangeSaveRequest 6 :"+(millis()-ts)+"ms");ts=millis();
			tosave="";
			incrementDatafileUpdateID();
		}
		//	TIMEPROFILER.printick("rangeSaveRequest","postappendloop");
		datamap.update(ID_TEXT,lastkey);// set last id
		if(changed && configstate.get(PILE_KEYTEXT)=="1") pileman.pop();
		//	Serial.println(String()+"DataManager::rangeSaveRequest 7 :"+(millis()-ts)+"ms");ts=millis();
		*error=!changed;
		//	TIMEPROFILER.printick("rangeSaveRequest","end");
		return true;
	}
	///////////////////////////////

public:
	bool saveRequest(StringMapEvent *se){
		Serial.println("DataManager::saveRequest :");
		busysaving=true;
		if(SIMPLEFS.getFreeSpace()<MINIMUMSPACE) {
			Serial.print(String()+"Disk full, free space : "+SIMPLEFS.getFreeSpace());
			beepError();beepError();beepError();beepError();beepError();beepError();beepError();beepError();
			busysaving=false;
			return false;
		}
		bool rangeerror=false;
		bool isrange=rangeSaveRequest(se,&rangeerror);
		if(isrange) {
			busysaving=false;
			return !rangeerror;
		} else {
			setRequest(se); //set anything needed to be set
			bool b=saveCurrent();
			busysaving=false;
			return b;
		}
		//		waitingpostsave=false;
	}
private:
	bool setRequest(StringMapEvent *se){ // maybe should find which datamap contain this key, then make the change // when we get a set request :

		if(testRangeRequest(se->get(ID_TEXT))) {se->values.erase(ID_TEXT);}
		bool changed=false;
		for(auto it=se->values.begin();it!=se->values.end();it++){	// go through request arguments
			//String arg=it->second.c_str();
			String key=it->first.c_str();
			//			Serial.println(String()+"DataManager::setRequest "+key+" "+it->second.c_str());
			String toset=it->second.c_str();
			if(key==LOWERSCALEPACK) toset.toLowerCase();
			bool b=set(key,toset.c_str());
			changed=changed || b;
		}
		return changed;
	}

	void beepError(){
		if(beeper){	//Serial.println (String()+"Datamanager:: will beep 1 save request error");
			beeper->simpleBeep(ERRORFREQ,ERRORLENGTH);
		}
	}

	void beepErrorShort(){
		if(beeper){	//Serial.println (String()+"Datamanager:: will beep 1 save request error");
			beeper->simpleBeep(ERRORFREQ,SAVELENGTH);
		}
	}

public:
	bool busysaving=false;

	bool testSavability(String command, String argument) {
		if(command==HARVEST_KEYWORD){
/*			if(argument.length()==0) Serial.println(String()+"DataManager:testSavability not savable: no argument :'"+argument+"'");
			if(argument.toInt()==0) Serial.println(String()+"DataManager:testSavability not savable:argument=0:"+argument);
			if( argument.toInt()==1) Serial.println(String()+"DataManager:testSavability not savable:argument=1:"+argument);
*/
			if(argument.length()==0 || argument.toInt()==0 || argument.toInt()==1) return false;
		}	// skip if harvest with no argument, harvest with 0 or 1 as argument
		return true;
	}

	bool saveCurrent(){
//		Serial.print("DataManager::saveCurrent :");
		registerInteraction();
		if(!savableData()) {
			Serial.println(String()+"DataManager:saveRequest not savable:");
			beepError();
			return false;
		}
		bool changed=false;
//		if(testSavability(get(COMMAND_TEXT),get(ARGUMENT_TEXT))) {
	//		Serial.println("DataManager::saveCurrent 1.5 :");
			changed=saveLine(datamap.getMap());

		//}
		if(!changed) beepError();

//		Serial.println("DataManager::saveCurrent2 :");
		std::vector<std::map<String,String>> multitosave=multiman.multiSave();
		for(std::map<String,String> m :multitosave) {
			Serial.println(String()+"DataManager::saveCurrent2.5 current:"+m[COMMAND_TEXT]+"="+m[ARGUMENT_TEXT]);
			delay(1);
			bool b=saveLine(&m);
			if(!b) beepError();
			changed=changed || b;
		}
		if(changed) {
			Serial.println(String()+"DataManager::saveCurrent3 : writing into file:\n"+tosave.c_str());
			unsigned written=SIMPLEFS.appendToFile(DATAFILENAME, tosave.c_str());

			if(written!=tosave.length()) {
				beeper->reset();
				beepError();beepError();beepError();
			}
			addToSave(tosave);
			tosave="";
			/*	if(beeper){	// this should be done asynchronously
				//			Serial.println (String()+"Datamanager:: will beep 1 save request done");
				beeper->simpleBeep(SAVEFREQ,SAVELENGTH);
			}*/
			incrementDatafileUpdateID();
		}
		if(changed && configstate.get(PILE_KEYTEXT)=="1") pileman.pop();

		return changed;
	}



	void incrementDatafileUpdateID(){
		if(configstate.exists(DATAVERSION_KEYTEXT)) {
			String key=configstate.get(DATAVERSION_KEYTEXT);
			int version=key.toInt();
			version++;
			key=String(version);
			configstate.update(DATAVERSION_KEYTEXT,key);
		}
		configstate.update(FREESPACE_KEYTEXT,String(SIMPLEFS.getFreeSpace()));
	}


	String get(String key, std::map<String,String> *map=0){
		if(map && (map->find(key) != map->end())) {
			String arg=map->find(key)->second;	//update only those exist already, do not add new keys
//			Serial.println (String()+"Datamanager:: map get :"+key+" "+arg);
			return arg;
		} else if(datamap.exists(key)) {
			String arg=datamap.get(key);	//update only those exist already, do not add new keys
//						Serial.println (String()+"Datamanager:: datamap get :"+key+" "+arg);
			return arg;
		} else if(dataconfigmap.exists(key)) {
			String arg=dataconfigmap.get(key);	//update only those exist already, do not add new keys
			//			Serial.println (String()+"Datamanager:: dataconfigmap get :"+key+" "+arg);
			return arg;
		} else if(blockinfo.exists(key)) {
			String arg=blockinfo.get(key);
			//			Serial.println (String()+"Datamanager:: blockinfo get :"+key+" "+arg);
			return arg;
		} else if(scalemap.exists(key)) {
			String arg=scalemap.get(key);
			//	Serial.println (String()+"Datamanager:: scalemap get :"+key+" "+arg);
			return arg;
		} else {
			//			Serial.println (String()+"Datamanager:: no get :"+key);
			return "";
		}
	}

	void reply(bool b, StringMapEvent *se , bool nohtml=false){
		if(b) {
			String val="OK";
			if(!nohtml) val="<html><meta http-equiv=\"refresh\" content=\"5;url='/'\" />OK</html>";
			se->updateValue("response",val.c_str());	// what is this ok used to ? dont remember
			se->updateValue("type","text/html");
		}
		else se->updateValue("response","NOTOK");
	}
	void replyText(String text,StringMapEvent *se){
		se->updateValue("response",text.c_str());	// what is this ok used to ? dont remember
	}


	String getDataJson(){
		String json="{";bool first=true;
		for(String vn:dataorder) {
			if(first) first=!first;
			else json+=",";
			json+=String()+"\""+vn+"\":\""+datamap.get(vn)+"\"";
			//			Serial.println(String()+"DataManager:getDataJson vn:"+vn+"json so far :"+json);
		}
		//		Serial.println(String()+"DataManager:getDataJson json :"+json);
		json+="}";
		return json;
	}

	String makeJson(){
		String jsonresponse="{";
		jsonresponse+="\"data\":"+getDataJson();
		jsonresponse+=",\"scale\":"+scalemap.getJson();
		jsonresponse+=",\"blockinfo\":"+blockinfo.getJson();
		jsonresponse+=",\"multi\":"+multiman.getJson();
		jsonresponse+=",\"pile\":"+pileman.getJson();
		jsonresponse+=",\"config\":"+dataconfigmap.getJson({"password","stpassword","appassword"});
		jsonresponse+=",\"configstate\":"+configstate.getJson();
		jsonresponse+="}";
		//Serial.println(String()+"DataManager:makeJson jsonresponse :"+jsonresponse);
		return jsonresponse;
	}


	bool beepset(DataMap &map, String key, String val, bool beep=false, int freq=0,int length=0){
		if(map.exists(key) && map.get(key)!=val) map.update(key,val);	//update only those exist already, do not add new keys
		else return false;
		//	Serial.println (String()+"Datamanager:: datamap beepset key:"+key+" val:"+val+" beep:"+beep);
		if(beep && beeper) {	//Serial.println (String()+"Datamanager:: will beep 2 update datamap");
			beeper->simpleBeep(freq,length);}
		return true;
	}

	bool discardValue(String key, String val){ // don't update if value "" for most configstate vars
		if(key==SAVEONSET_KEYTEXT && val.length()==0) return true;
		if(key==PILE_KEYTEXT && val.length()==0) return true;
		if(key==PILE_FIFO_KEYTEXT && val.length()==0) return true;
		if(key==MULTI_KEYTEXT && val.length()==0) return true;
		return false;
	}

	bool set(String key,String arg){
		if(discardValue(key,arg)) return false;
		if(datamap.exists(key)) beepset(datamap,key,arg,true,SETFREQ,SETLENGTH);
		else if(dataconfigmap.exists(key)) beepset(dataconfigmap,key,arg);
		else if(blockinfo.exists(key)) beepset(blockinfo,key,arg,true,SETBLOCKFREQ,SETBLOCKLENGTH);
		else if(scalemap.exists(key)) beepset(scalemap,key,arg);
		else if(configstate.exists(key)) beepset(configstate,key,arg);
		else {
			Serial.println (String()+"Datamanager:: no set :"+key+" "+arg);
			return false;
		}
		return true;
	}
};
/*
void statSave(DataManager *dataman){
	if(dataman) dataman->saveRequest(&dataman->sesave);
};
 */
#endif

