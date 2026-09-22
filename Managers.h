#ifndef MANAGERS_H_
#define MANAGERS_H_
#ifndef x86BUILD
#define ESP32BUILD
#endif
#include <Ticker.h>

#include <ArduinoJson.h>
#include "lib/datastruct/GenString.h"
#include "lib/device/Beeper.h"
#include "Pricing.h"
#define PRICEFILENAME "/prices.json"
#define CONFIGFILENAME "/config.json"

#include "lib/net/WifiMan.h"
/*
#define REQFREQ 660
#define REQLENGTH 50
#define REQJSONFREQ 110
#define REQJSONLENGTH 15
*/
#define DEFAULTAPNAME "SuperScale"

class WifiSubMan: public EventListener
{
	DataMap *sconfig;
public:
	WifiSubMan(DataMap *config0){sconfig=config0;}

	bool hasAP(){
		if(WifiMan::getMode()=="AP") return true;
		return false;
	}
	String getMode(){return WifiMan::getMode();}
	void run(){WifiMan::reconnectIfNeeded();}
	bool notify(GenString ename, Event *e){return notify(String(ename.c_str()),e);}
	bool notify(String ename, Event *e){
		StringMapEvent *se=0;
		if(e->isClassType("StringMapEvent")) se=(StringMapEvent *)e;
		if(ename=="/switchToStation" || ename=="/switchToAP") {
			String ssid=se->values["ssid"].c_str(),password=se->values["password"].c_str(),nmdnsname=se->values["mdns"].c_str();
			if(!ssid.length()) return false;
			if(ename=="/switchToStation"){
				bool b=WifiMan::connectStation(ssid.c_str(),password.c_str());	// contains delay rather should be called from the main loop
				if(!b) WifiMan::connectAP(WifiMan::apssid.c_str(), WifiMan::appassword.c_str());
				else {
					sconfig->update("ssid", ssid);// save it to config
					sconfig->update("password", password);// save it to config
				}
			} else if(ename=="/switchToAP") {
				if(ssid.length()>0) {
					sconfig->update("apssid", ssid);// save it to config
					sconfig->update("appassword", password);// save it to config
					WifiMan::connectAP(ssid.c_str(),password.c_str());	// contains delay rather should be called from the main loop
				}
			}
			if(nmdnsname!=sconfig->get("mdns")) {sconfig->update("mdns",nmdnsname);}
			if(getMode()!=sconfig->get("mode")) {sconfig->update("mode",getMode());}			// ssid/password got from server are not saved in the data -> save to sconfig			// if ssid not provided, retreive from sconfig			//saveSettings();
			return false;
		};
		return false;
	}

	bool connect(){// connect wifi//
		Serial.println("WifiSubMan::connect "+sconfig->get("mode"));
		bool connected=false;
		sconfig->set("mode","ST");	//always try st before ap
		if(sconfig->get("mode")!="AP"){
			Serial.println(String()+"WifiSubMan::connect Search config station ssid: "+(*sconfig)["ssid"]);
			if(sconfig->get("ssid").length()>0) {
				Serial.println(String()+"WifiSubMan::connect Found config station ssid: "+(*sconfig)["ssid"]);
				connected=WifiMan::connectStation((*sconfig)["ssid"].c_str(), (*sconfig)["password"].c_str());	// try saved ssid
			} else {
				Serial.println(String()+"WifiSubMan::connect using default config station ssid: "+DEFSSID);
				connected=WifiMan::connectStation(DEFSSID,DEFPASSWORD);	// try my ssid
			}
		}
		if(!connected) {	// try ap
			String APname=DEFAULTAPNAME,APpass="";
			if(sconfig->get("mode")=="AP" && sconfig->get("apssid").length()>0) {APname=sconfig->get("apssid");APpass=sconfig->get("appassword");}
			Serial.println(String()+"WifiSubMan::connect AP connect: config apssid:'"+(*sconfig)["apssid"]+"', appassword:'"+APpass+"', final apname:'"+APname+"'");
			/*			if(sconfig->exists("apssid")){
				Serial.println(String()+"Found saved apssid:"+sconfig->get("apssid")+" / appassword:"+sconfig->get("appassword"));
				APname=sconfig->get("apssid");APpass=sconfig->get("appassword");}	// try saved AP
			 */
			WifiMan::connectAP(APname.c_str(),APpass.c_str());
			if(APname!=sconfig->get("apssid")) sconfig->update("apssid",APname);
			if(APpass!=sconfig->get("appassword")) sconfig->update("appassword",APpass);
			if(getMode()!=sconfig->get("mode")) sconfig->update("mode","AP");
		}
		sconfig->update("ip",WifiMan::getIP());
		return connected;
	}
};



class ConfigManager;
void saveConfigStat(ConfigManager *cman);

class ConfigManager : public EventListener {
	//	std::map <String,std::vector<String>> configmap;
	DataMap *configmap=0;
	Ticker lticker;
	bool willtick=false;

public:

	void setConfigMap(DataMap *configmap1) {
		configmap=configmap1;
	}

	//	std::map <String,std::vector<String>>*
	DataMap *getMap() {return configmap;}

	bool notify(GenString ename, Event *e){return notify(String(ename.c_str()),e);}
	bool notify(String ename, Event *e){
		Serial.println(String()+"ConfigManager::notify saved current config:"+ename);
		if(!willtick) {
			lticker.once_ms(500, saveConfigStat, this);
			willtick=true;
		}
		return true;
	};

	void saveConfig(){
		willtick=false;
		if(!configmap) return;
		String json=configmap->getJson({"mode"});
		SimpleFS.rewriteFile(CONFIGFILENAME,json.c_str(),json.length());
		Serial.println("ConfigManager::saveConfig saved current config:");
		Serial.println(json);
	}
	/*
	String getJson(){
		String json="{",Q="\"";
		bool kfirst=true;
		for (auto it : configmap) {
			String key=it.first;
			std::vector<String> vect=it.second;
			if(kfirst) kfirst=false; else json+=",";
			json+=String()+Q+key+Q+":[";
			bool first=true;
			for (String val : vect) {
				if(first) first=false; else json+=",";
				json+=String()+Q+val+Q;
			}
			json+="]";
		}
		json+="}";
		return json;
	}
	 */
	void printMap(){
		Serial.println("Config loaded:>>");
		for (auto it : *(configmap->getMap())) {
			String key=it.first;
			String val=it.second;
			Serial.println(String()+"- "+key+": "+val);
		}
		Serial.println("<<");

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
				configmap->update(key,vals);
				continue;
			}
		};




		/*
			JsonArray subarray =kv.value().as<JsonArray>();
			//std::vector<String> vect;
			String vals="[";
			bool first=true;
			for( JsonVariant subv : subarray ){
				if(first) first=false; else vals+=",";
				String val=subv.as<char*>();
				//vect.push_back(val);
				vals+="\""+val+"\"";				//		    	Serial.println(String()+"ConfigManager::parse2: val:"+val);
			}
			vals+="]";
			if(vals.length()>2) configmap->update(key,vals);*/
		//  Serial.println(kv.value().as<JsonArray>());
	}
	//	configmap->printMap();
	//		Serial.println(String()+"ConfigManager::parse1 :'"+filecontent+"'");
	/*
		for (JsonVariant value : doc2) {		//		String val=value.as<char*>();		//		Serial.println(String()+"PriceManager::parse: "+val);
			Serial.println(String()+"JsonArray::parse+: "+value);
			JsonObject obj=value.as<JsonObject>();
			if(obj){
				String name=obj["title"];
				float price=obj["price"];
				Serial.println(String()+"JsonArray::parse2: name:"+name+" price:"+price);
				//			pricing.addPrice(name,price);
				JsonVariant var=obj["names"];
				for( JsonVariant kv : var.as<JsonArray>() ) {
					String val=kv.as<char*>();
					//				straintoname[val]=name;
					Serial.println(String()+"JsonArray::parse3: name:"+name+" val:"+val);
				}
			}
		}*/
	//	Serial.println(String()+"PriceManager::parse end :pricing:"+pricing.getPrices()->size());


public:

	void load(){
		String filecontent=SimpleFS.readFileToString(CONFIGFILENAME);
		filecontent=removeComments(filecontent);
		parse(filecontent);
		printMap();
	}


};

void saveConfigStat(ConfigManager *cman){
	cman->saveConfig();
}


#endif
