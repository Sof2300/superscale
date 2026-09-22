#ifndef DATAMAP_H
#define DATAMAP_H

#include"../events/DefaultEventEmitter.h"
#include <map>


/////////////////

boolean isFloat(String tString) {
	String tBuf;
	boolean decPt = false;
	if(tString.charAt(0) == '+' || tString.charAt(0) == '-') tBuf = &tString[1]; else tBuf = tString;
	for(unsigned x=0;x<tBuf.length();x++){
		if(tBuf.charAt(x) == '.') {
			if(decPt) return false; else decPt = true;
		} else if(tBuf.charAt(x) < '0' || tBuf.charAt(x) > '9') return false;
	}
	return true;
}


class DataMap: public DefaultEventEmitter {
	std::map<String,String> data;
public:
	//String operator [](String key)    {return data[key];}
	String& operator [](String key) {return data[key];}
	std::map<String,String> *getMap(){return &data;}
	String get(String key){if(exists(key)) return data[key]; else return "";}	// prevent from creating keys by reading inexisting keys
	void set(String key, String value){
		data[key]=value;
	/*	for(auto it:data) {
			if(key!="weight") Serial.println(String()+"DataMap::set it.first:"+it.first+" it.second:"+ it.second+" (it.first==key):"+(it.first==key)+" key:"+ key);
		}*/
	}
	void printMap(){
		for(auto it:data) Serial.println(String()+"DataMap::printMap "+it.first+" "+ it.second);
	}
	void set(String key, float value){data[key]=String(value);}
	void set(String key, int value){ data[key]=String(value);}

	bool erase(String key){return (bool)data.erase(key);}
	void clear(){data.clear();}

	int size(){return data.size();}

	void update(String key, float fvalue){update(key,String(fvalue));}
	void update(String key, String value) {	//
	//	Serial.println(String()+"DataMap::update '"+key+"':'"+ value+"'");
	//	TIMEPROFILER.reset("DataMap::update "+key,"start");
		set(key,value);
	//	TIMEPROFILER.tick("DataMap::update "+key,"set");
	//	if(listenerNumber()==0) return;
		StringEvent *ev=new StringEvent(value.c_str());
	//	Serial.println(String()+"DataMap::update preemit '"+key+"':'"+ ev->str.c_str()+"'");
	//	TIMEPROFILER.tick("DataMap::update "+key,"event");
		emit(key.c_str(), ev);
	//	TIMEPROFILER.tick("DataMap::update "+key,"emit");
	//	TIMEPROFILER.printProfile("DataMap::update "+key);
		delete ev;	//	StringMapEvent ev=new StringMapEvent({key, value});emit(key, ev);delete ev;
	}
	bool exists(String key){return (data.find(key) != data.end());};

	float getAsFloat(String key){
		if(!exists(key)) return (float)nan("");
		//	Serial.println(String()+"DataMap::getAsFloat "+key+" "+ get(key).toFloat());
		return get(key).toFloat();};
	long getAsLong(String key){
		if(!exists(key)) return -1;
		return strtol(get(key).c_str(), NULL, 10);
	};

	String getJson(std::vector<String> hidden={}, bool withouter=true){
			String json;
			if(withouter) json+="{";
			for(auto it=data.begin();it!=data.end();it++){
				bool found=false;
				for(String s : hidden) {if(it->first==s) found=true;break;}
				if(found) continue;
				if(it!=data.begin()) json+=",";
				json+=String()+"\""+it->first+"\":";
				bool subarray=false;
				String val=it->second;
				if(val[0]=='[') subarray=true;
				if(found || it->second.length()==0) json+="\"\"";		// hide the value not the field
				else if(isFloat(it->second) || subarray) json+=it->second;
				else json+=String()+"\""+it->second+"\"";

// 				Serial.println(String()+"DataMap::getJson map so far:"+json);
			}
			if(withouter) json+="}";
		//	Serial.println(String()+"DataMap::getJson map to:"+json);
			return json;
		}

	String serialize(std::vector<String> hidden, bool withouter=true){
		String json=getJson(hidden,withouter);
		Serial.println(String()+"Serialized map to:"+json);
		return json;
	}

	String trim(String value){
		while(value[0]==' ' && value.length()>0) value.remove(0,1);
		if(value.length()==0) return value;
		if(value[0]=='\"') value.remove(0,1);
		//int i=value.length()-1;
		while(value.length()>0 && value[value.length()-1]==' ') value.remove(value.length()-1,1);
		if(value[value.length()-1]=='"') value.remove(value.length()-1,1);
		return value;
	}

	bool unserialize(String serialized){
		Serial.println(String()+"unserialized serialized:"+serialized);
		int i =serialized.indexOf("{");
		while(i>=0 && i<(int)serialized.length()) {
			int j =serialized.indexOf("\"",i+1);
			int k =serialized.indexOf("\"",j+1);
			//		Serial.println(String()+"i:"+i+",j:"+j+", k:"+k);
			//		Serial.println(String()+"chars i:'"+serialized.substring(i,i+5)+"',j:'"+serialized.substring(j,j+5)+"', k:'"+serialized.substring(k,k+5)+"'");

			String key=serialized.substring(j+1,k);
			int sep =serialized.indexOf(":",k+1);
			// value will either start with '"' or finish with ,
			int nextitem=serialized.indexOf(",",sep+1);
			if(nextitem<0) nextitem=serialized.indexOf("}",sep+1);
			int vstart =serialized.indexOf("\"",sep+1);
			if(vstart<0) vstart=sep+1;
			int vend =serialized.indexOf("\"",vstart+1);
			if(nextitem<vstart || vend<0) {vstart=sep+1;vend=nextitem;}
			else if(vend>0) vend++;
			//		Serial.println(String()+"vstart:"+vstart+", vend:"+vend+", nextitem:"+nextitem);
			String value=serialized.substring(vstart,vend);
			//		Serial.println(String()+"untrimmed value:"+value);
			value=trim(value);
			if(key.length()>0) set(key,value);
			Serial.println(String()+"unserialized key:"+key+", value:"+value);
			//			Serial.println(String()+"- vstart:"+vstart+", vend:"+vend+", nextitem:"+nextitem);
			//			Serial.println(String()+" vend chars: '"+serialized.substring(vend,vend+5)+"'");
			i =serialized.indexOf(",",vend);
		}
		return true;
	}
};



#endif
