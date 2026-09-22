#ifndef PILEMANAGER_H_
#define PILEMANAGER_H_

#define PILE_SEP "/"
#define PILE_KEYTEXT "pile"
#define PILE_FIFO_KEYTEXT "fifo"	// or !FILO


#define DONT_PILE_EMPTY_VALUE 1

class PileManager {
	DataMap pilemap;
	//	unsigned int pileindex=1;
	DataMap *datamap, *multimap, *configmap, *scalemap;
public:
	PileManager(DataMap *datamap0, DataMap *multimap0, DataMap *configmap0, DataMap*scalemap0):
		datamap(datamap0), multimap(multimap0), configmap(configmap0), scalemap(scalemap0){
		configmap->set(PILE_KEYTEXT,"0");
		configmap->set(PILE_FIFO_KEYTEXT,"0");
	}
	String getJson(){return pilemap.getJson();}
	bool clearPile(){if(pilemap.size()>0) {pilemap.clear();return true;} else return false;}

	std::vector<GenString> getUrlNames(){return {"/pilePop","/pilePush","/pileClear","/pileEdit"};}
	void editValue(String key, String value){pilemap.update(key,value);}

	bool processRequest(String ename, StringMapEvent *se, bool *captured) {
		if(ename==String("/pilePop")) {
			if(se->exists("path")){
				String path=se->get("path");
				if(path[0]=='p') path=path.substring(1);
				int index=path.toInt();
				pop(index);
			} else pop();
			if(captured) *captured=true;
			return true;
		}
		if(ename==String("/pilePush")) {
			push();
			if(captured) *captured=true;
			return true;
		}
		if(ename==String("/pileClear")) {
			if(pilemap.size()==0) return false;
			if(se->exists("path")){
				String path=se->get("path");
				if(path[0]=='p') path=path.substring(1);
				int index=path.toInt();
				clearPileLine(index);
			} else pilemap.clear();
			if(captured) *captured=true;
			return true;
		}
		if(ename==String("/pileEdit")) {
			bool changed;
			for(auto it=se->values.begin();it!=se->values.end();it++){	// go through request arguments
				//String arg=it->second.c_str();
				String key=it->first.c_str();
				//			Serial.println(String()+"PileManager::processRequest "+key+" "+it->second.c_str());
				pilemap.update(key,it->second.c_str());
				changed=true;
			}
			if(captured) *captured=true;
			return changed;
		}
		return false;
	}

	void push() {
		// move all existing to next key
		shiftPileIndex(1,0);
		bool changed=false;
		//copy all current and multi to pilemap with added path
		String subpath=getPileIndexText(0)+PILE_SEP;
		std::map<String,String> *map=datamap->getMap();
		String command=(*map)[COMMAND_TEXT];
		for(auto it:*map){
			String k=it.first, v=it.second;
			v=pullData(k, v, command,scalemap,true);
			if(DONT_PILE_EMPTY_VALUE && v.length()==0) continue;//{				Serial.println(String()+"PileManager::pileUp skipping k:"+k+" v:'"+v+"'");	}
			String newkey=String()+subpath+"0"+PILE_SEP+k;
			pilemap.update(newkey,v);
			changed=true;			//		Serial.println(String()+"PileManager::pileUp saving newkey:"+newkey+" v:'"+v+"'");
		}
		for(auto it:*(multimap->getMap())){
			String k=it.first, v=it.second;
			String newkey=String()+subpath+k;
			pilemap.update(newkey,v);
		}		//		if(changed)	pileindex++;else
		if(!changed) shiftPileIndex(-1,0);
	}


	void pop(int itopop=0){
		if(pilemap.size()==0) return;
		if(itopop==0 && configmap->get(PILE_FIFO_KEYTEXT)=="1") {int max=getMaxPath();if(max>0) itopop=max;}
		// copy p1 to current and multi
		multimap->clear();	// should we clear all or fuse with multi ?
		for(auto it:*(pilemap.getMap())){
			String key=it.first, val=it.second;
			int index=getPileIndex(key);
			String subkey=getPileSubkey(key);
			int multiindex=getPileMultiIndex(key);
			if(index!=itopop || subkey.length()==0 || multiindex<0) {
				Serial.println(String()+"PileManager::pop skipping key:"+key+" index:"+index+" itopop:"+itopop+" multiindex:"+multiindex+" subkey:"+subkey);
				continue;
			}
			if(multiindex==0) {	datamap->update(subkey, val);			//			Serial.println(String()+"PileManager::pop updating datamap key:"+subkey+" val:"+val);
			}else {	multimap->update(String()+multiindex+PILE_SEP+subkey, val);				//			Serial.println(String()+"PileManager::pop undating multimap key:"+(String()+multiindex+PILE_SEP+subkey)+" val:"+val);
			}
		}
		clearPileLine(itopop);
	}

	void clearPileLine(int index){
		// erase and move back the index of other keys
		std::vector<String> removed;
		for(auto it:*(pilemap.getMap())) {
			int pindex=getPileIndex(it.first);
			if(pindex==index) removed.push_back(it.first);
		}
		for(String s : removed) pilemap.erase(s);
		shiftPileIndex(-1,index);
		//	pileindex--;
	}

	String getPileSubkey(String key){
		int lim=key.lastIndexOf(PILE_SEP);
		if(lim>0) return key.substring(lim+1,key.length());
		return "";
	}
private:


	int getMaxPath(){
		int max=-1;
		for(auto it:*(pilemap.getMap())) {
			int pi=getPileIndex(it.first);
			if(pi>max) max=pi;
		}
		return max;
	}

	void shiftPileIndex(int shift, int limit){
		std::map<String,String> keystocreate;
		for(auto it:*(pilemap.getMap())){
			int index=getPileIndex(it.first);
			if(index>=limit) keystocreate[replacePileIndex(it.first,index+shift)]=it.second;	// save the value and the new key
			else keystocreate[it.first]=it.second;
		}
		pilemap.clear();	//maybe a problem if there is listeners and not only values
		for(auto it:keystocreate) pilemap.update(it.first, it.second);	// create the values with new keys
	}

	int getPileIndex(String key){
		int lim=key.indexOf(PILE_SEP);
		if(lim>=0) return key.substring(1,lim).toInt();
		return -1;
	}


	int getPileMultiIndex(String key){
		int lim=key.indexOf(PILE_SEP);
		if(lim<0) return -1;
		int lim2=key.indexOf(PILE_SEP,lim+1);
		if(lim>=0) return key.substring(lim+1,lim2).toInt();
		return -1;
	}
	String getPileMultiSubkey(String key){
		int lim=key.indexOf(PILE_SEP);
		if(lim>0) return key.substring(lim+1,key.length());
		return "";
	}

	String getPileIndexText(int index){return String()+"p"+index;};
	String replacePileIndex(String key, int replacement){
		int lim=key.indexOf(PILE_SEP);
		if(lim<0) return "";
		return getPileIndexText(replacement)+key.substring(lim);
	}

};





#endif

