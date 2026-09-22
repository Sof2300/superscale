#ifndef MULTIMANAGER_H
#define MULTIMANAGER_H
#include <Ticker.h>
#include <ArduinoJson.h>

#define MULTI_SEP "/"
#define MULTI_KEYTEXT "multi"

#define MULTIFILENAME "/multisave.json"

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class MultiManager;
void saveMultiStat(MultiManager *);

class MultiManager {
	DataMap multimap;
	std::vector<String> multiexcluded={DATE_TEXT,ID_TEXT};
	unsigned int multiindex=1;
	DataMap *datamap,*configstate;
	std::vector<String> *dataorder;

private:
	int getMultiIndex(String key){
		int pos=key.lastIndexOf(MULTI_SEP);
		if(pos==-1) return -1;
		String val=key.substring(0,pos);
		int index=val.toInt();
		return index;
	}
	int getMaxMultiIndex(){
		int max=-1;	//
		//	Serial.println(String()+"DataManager:getMaxMultiIndex 0 max:"+max);
		for(auto it : *(multimap.getMap())) {	//
			//	Serial.println(String()+"DataManager:getMaxMultiIndex 1 max:"+max);
			int mi=getMultiIndex(it.first.c_str());	//
			//	Serial.println(String()+"DataManager:getMaxMultiIndex mi:"+mi+" max:"+max);
			if(max<mi) max=mi;
		}
		return max;
	}



public:
	String makeMultiKey(String okey,int index){
		return String()+index+MULTI_SEP+okey;
	}
	String getMultiKey(String key){
		int pos=key.lastIndexOf(MULTI_SEP);
		if(pos==-1) return key;
		return key.substring(pos+1,key.length());
	}
	MultiManager(DataMap *datamap0, DataMap *configstate0, std::vector<String> *dataorder0): datamap(datamap0), configstate(configstate0), dataorder(dataorder0) {}
	DataMap &getMap(){return multimap;}
	String getJson(){return multimap.getJson();}
	std::vector<GenString> getUrlNames(){return {"/multiPush","/multiClear","/multiSet","/multiAdd"};}

	bool processRequest(String ename, StringMapEvent *se, bool *captured) {
		if(ename==String("/multiPush")) {
			addToMulti();
			if(captured )*captured=true;
			return true;
		}
		if(ename==String("/multiClear")) {
			multiClear(se);
			if(captured )*captured=true;
			return true;
		}
		if(ename==String("/multiSet")) {
			bool b;
			if(configstate->get(MULTI_KEYTEXT)=="1") b=multiAddRequest(se);
			else b=multiSetRequest(&(se->values));
			if(captured )*captured=true;
			return b;
		}
		if(ename==String("/multiAdd")) {
			bool b=multiAddRequest(se);
			if(captured )*captured=true;
			return b;
		}
		return false;
	}

	void addToMulti(){	// copy current to become another line
		std::map<String,String> *map=datamap->getMap();
		bool changed=false;
		for(auto it : (*map)){
			String okey=it.first.c_str();
			String oval=it.second.c_str();
			Serial.println(String()+"DataManager:addToMulti okey:"+okey+" multiindex:"+multiindex+" oval:"+oval);
			if(multiexcludedkey(okey)) continue;
//			if(oval.length()>0)	{	//why exclude empty fields ?
				multimap.update(makeMultiKey(okey,multiindex), oval);changed=true;
				Serial.println(String()+"DataManager:addToMulti updated with okey:"+okey+" multiindex:"+multiindex+" oval:"+oval);
//			}
		}
		if(changed) {
			multiindex++;
			postSaveToFile();
		}
	}

	std::vector<std::map<String,String>> multiSave(){//		Serial.println(String()+"DataManager:multiSave ");
		std::vector<std::map<String,String>> fullmap;
		if(multiindex<2) return fullmap;
		for(unsigned int i=1;i<multiindex;i++){//			Serial.println(String()+"DataManager:multiSave loopstart multiindex:"+multiindex);
			std::map<String,String> map;
			for(String key:*dataorder){
				String subkey=String()+i+MULTI_SEP+key;//			Serial.println(String()+"DataManager:multiSave subkey:"+subkey);
				//String v;
				if(multimap.exists(subkey)) map[key]=multimap.get(subkey);	// if found in multimap we take it there
				else map[key]=datamap->get(key);	// if not found we take it from current data
				//	map[key]=v;
			}
			if(map.size()>0) fullmap.push_back(map);//saveLine(&map);
			//	map.clear();	//		Serial.println(String()+"DataManager:multiSave loopend");
		}//		Serial.println(String()+"DataManager:multiSave end");
		return fullmap;
	}

	bool multiSetRequest(std::map<std::string, std::string> *values){ // maybe should find which datamap contain this key, then make the change // when we get a set request :
		std::map<String,String> nmap=stdToStringMap(values);
		bool b=multiSetRequest(&nmap);
		return b;
	}
	bool multiSetRequest(std::map<String, String> *values){ // maybe should find which datamap contain this key, then make the change // when we get a set request :
		bool changed=false;		//
		//	Serial.println(String()+"DataManager::multiSetRequest begin values->size():"+values->size());
		for(auto it=values->begin();it!=values->end();it++){	// go through request arguments
			//String arg=it->second.c_str();
			String key=it->first.c_str();
			int index=getMultiIndex(key);
			String subkey=getMultiKey(key);			//
			//	Serial.println(String()+"DataManager::multiSetRequest "+key+" "+it->second.c_str()+" subkey:"+subkey);
			bool b=false;
			for(String s:*dataorder) {				//
				//			Serial.println(String()+"DataManager::multiSetRequest2 s:"+s+" subkey:"+subkey);
				if(s==subkey) {b=true;break;}
			}			//
			//		Serial.println(String()+"DataManager::multiSetRequest2 b:"+b+" index:"+index);
			if(!b || index<0) continue;			//
			//		Serial.println(String()+"DataManager::multiSetRequest3 "+key+" "+it->second.c_str()+" subkey:"+subkey);
			String toset=it->second.c_str();
			if(subkey==LOWERSCALEPACK) toset.toLowerCase();

			if(index==0) datamap->update(subkey,toset.c_str());
			else if(!multiexcludedkey(subkey)) multimap.update(key,toset.c_str());			//			Serial.println(String()+"DataManager::multiSetRequest4 index:"+index);
			int max=getMaxMultiIndex();
			if(max>0) multiindex=max+1;
			else multiindex=1;			//
			//		Serial.println(String()+"DataManager::multiSetRequest5 multiindex:"+multiindex+" max:"+max);
			changed=true;
		}
		if(changed) {
			multiCloseHoles();
			postSaveToFile();
		}
		return changed;
	}

	bool multiAddRequest(StringMapEvent *se){ // maybe should find which datamap contain this key, then make the change // when we get a set request :
		// if keyname contain path push this data by translating paths and giving them to multiset
		// if keyname contain no path
		//	Serial.println(String()+"DataManager::multiAddRequest begin");
		int min=-1;
		for(auto it=se->values.begin();it!=se->values.end();it++){	// go through request arguments
			String key=it->first.c_str();
			int index=getMultiIndex(key);	//		Serial.println(String()+"MultiManager::multiAddRequest index:"+index);
			if(index<0) {min=0;continue;} //nopath //String subkey=getMultiKey(key);
			if(min<0) min=index;
			if(min>index) min=index;
		}
		int lmax=getMaxMultiIndex();//
		//	Serial.println(String()+"MultiManager::multiAddRequest lmax:"+lmax);

		if(lmax<0) lmax=0;
		int diff=1+lmax-min;	//	Serial.println(String()+"MultiManager::multiAddRequest min:"+min+" lmax:"+lmax+" diff:"+diff);
		std::map<String,String> nmap;
		for(auto it=se->values.begin();it!=se->values.end();it++){	// go through request arguments
			String key=it->first.c_str(), val=it->second.c_str();
			int index=getMultiIndex(key);
			if(index<0) index=0;
			String subkey=getMultiKey(key);
			if(multiexcludedkey(subkey)) continue;
			String nkey=makeMultiKey(subkey,index+diff);	//		Serial.println(String()+"MultiManager::multiAddRequest nkey:"+nkey+" val:"+val);
			nmap[nkey]=val;			//		changed=true;
		}
		return multiSetRequest(&nmap);		//		return changed
	}

	bool multiexcludedkey(String k){
		for(String s : multiexcluded) {	//		Serial.println(String()+"DataManager:multiexcludedkey k:"+k+" s:"+s);
			if(s==k) return true;
		}
		return false;
	}


	void multiClear(StringMapEvent *se){
		Serial.println(String()+"DataManager:multiClear start");
		bool found=false;
		std::vector<int> removed;
		int nmultiindex=multiindex;
		for(auto it=se->values.begin();it!=se->values.end();it++){	// go through request arguments
			String arg=it->second.c_str();
			String key=it->first.c_str();
			Serial.println(String()+"DataManager:multiClear arg:"+arg+" "+key);
			if(key=="path") {
				int intval=arg.toInt();
				if(intval>0) {
					bool found2=false;
					for(String k : *dataorder) {
						//				Serial.println(String()+"DataManager:multiClear preerase:"+(String()+intval+MULTI_SEP+k));
						bool b=multimap.erase(String()+intval+MULTI_SEP+k);
						//				Serial.println(String()+"DataManager:multiClear erase:"+(String()+intval+MULTI_SEP+k)+" res "+b);
						if(b) found2=true;
					}
					//			Serial.println(String()+"DataManager:multiClear post dataorder");
					if(found2) {
						removed.push_back(intval);
						nmultiindex--;found=true;
					}
				}
			} else found=true;
		}
		//	Serial.println(String()+"DataManager:addToMulti preclear "+found);
		if(!found) {multimap.clear();multiindex=1;}
		else {
			// close the holes
			//		Serial.println(String()+"DataManager:multiClear hole removal");
			multiCloseHoles();
			multiindex=nmultiindex;
		}
		postSaveToFile();
	}

	String replaceMultiIndex(String key, int index){
		String nkey=getMultiKey(key);
		nkey=makeMultiKey(nkey,index);
		return nkey;
	}

	bool clearAll(){
		if(multimap.size()>0) {multimap.clear();multiindex=1;postSaveToFile();return true;}
		return false;
	}

	void shift(int start, int shiftby){
		//		Serial.println(String()+"DataManager:shift 0 with start:"+start+" shiftby:"+shiftby+" multimap.size():"+multimap.size());
		std::map<String,String> keystocreate;
		for(auto it:*(multimap.getMap())){
			int index=getMultiIndex(it.first);
			//			Serial.println(String()+"DataManager:shift 1 with start:"+start+" index:"+index);
			if(index>=start) {
				//				Serial.println(String()+"DataManager:shift 2 with it.first:"+it.first+" replaceMultiIndex(it.first,index+shiftby):"+replaceMultiIndex(it.first,index+shiftby));
				keystocreate[replaceMultiIndex(it.first,index+shiftby)]=it.second;	// save the value and the new key
			}
			else keystocreate[it.first]=it.second;
		}
		multimap.clear();
		for(auto it:keystocreate) multimap.update(it.first, it.second);	// create the values with new keys
	}

	void multiCloseHoles(){	// pb with this algo
		//		Serial.println(String()+"DataManager:multiCloseHoles multiindex:"+multiindex);
		for(int i=1;i<multiindex;){
			int line=i, nextline=line+1;
			bool found=false;
			for(String k : *dataorder) if(multimap.exists(makeMultiKey(k,line))) found=true; // is it an empty line ?
			//			Serial.println(String()+"DataManager:multiCloseHoles 0 with line:"+line+" multiindex:"+multiindex);
			if(found) {i++;continue;} // no we do nothing
			//			Serial.println(String()+"DataManager:multiCloseHoles 1 with line:"+line+" newline:"+nextline);			//String thatkey=makeMultiKey(k,line);//String()+line+MULTI_SEP+k;
			while(nextline<multiindex && !found){
				//				Serial.println(String()+"DataManager:multiCloseHoles 2 with line:"+line+" newline:"+nextline+" multiindex:"+multiindex);
				for(String k : *dataorder) if(multimap.exists(makeMultiKey(k,nextline))) found=true; // is it an empty line ?
				if(found) break;
				nextline++;
			}
			int diff=(nextline-line);
			//			Serial.println(String()+"DataManager:multiCloseHoles 3 with diff:"+line);
			shift(line,-diff);
			multiindex-=diff;
			//			Serial.println(String()+"DataManager:multiCloseHoles 4 with multiindex:"+multiindex);
		}
	}

	void parse(String filecontent){
		//		String filecontent = "[\"one\",\"two\",{\"three\":3}]";
		DynamicJsonDocument doc2(2500);//filecontent.length());
		deserializeJson(doc2, filecontent);
		//		Serial.println(String()+"ConfigManager::parse0 :'"+filecontent+"'");
		JsonObject  root = doc2.as<JsonObject>();
		for (JsonPair kv : root) {
			String key=kv.key().c_str();
			const char *val=kv.value().as<const char*>();
			String vals;
			serializeJson(kv.value(), vals);
			//Serial.println(String()+"ConfigManager::parse1: key:"+key+" val:"+val);

			/*	if(!val) {
					JsonArray subarray =kv.value().as<JsonArray>();				//std::vector<String> vect;
					String vals="[";
					bool first=true;
					for( JsonVariant subv : subarray ){
						if(first) first=false; else vals+=",";
						String val=subv.as<char*>();					//vect.push_back(val);
						vals+="\""+val+"\"";				//		    	Serial.println(String()+"ConfigManager::parse2: val:"+val);
					}
					vals+="]";
					if(vals.length()>2) configmap->update(key,vals);
				} else vals=val;*/


			//			Serial.println(String()+"ConfigManager::parse1: key:"+key+" vals:"+vals);
			if(val) vals=val;
			if(vals.length()>0) {
				multimap.update(key,vals);
				int max=getMaxMultiIndex();
				if(max>0) multiindex=max+1;
				else multiindex=1;
				continue;
			}
		};
	}

public:
	void printMap(){
		Serial.println("Multi loaded:>>");
		for (auto it : *(multimap.getMap())) {
			String key=it.first;
			String val=it.second;
			Serial.println(String()+"- "+key+": "+val);
		}
		Serial.println("<<");
	}

	void loadFromFile(){
		String filecontent=SimpleFS.readFileToString(MULTIFILENAME);
		if(filecontent.length()<3) return;
		filecontent=removeComments(filecontent);
		parse(filecontent);
		Serial.println("MultiManager::loadFromFile loaded multi from file:");
		printMap();
	}
	bool willtick=false;
	Ticker lticker;
	void postSaveToFile(){
		if(!willtick) {
			lticker.once_ms(500, saveMultiStat, this);
			willtick=true;
		}
	}
	void saveToFile(){
		if(multiindex==1) {SimpleFS.erase(MULTIFILENAME); Serial.println("MultiManager::saveToFile erased current multi:");return;}
		willtick=false;
		String json=multimap.getJson();
		SimpleFS.rewriteFile(MULTIFILENAME,json.c_str(),json.length());
		Serial.println("MultiManager::saveToFile saved current multi:");
		Serial.println(json);
	}
};

void saveMultiStat(MultiManager *cman){
	cman->saveToFile();
}

#endif

