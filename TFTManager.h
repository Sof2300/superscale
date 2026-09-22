#ifndef TFTMANAGERS_H_
#define TFTMANAGERS_H_
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

#define TFTUPDATEFREQ 660
#define TFTUPDATELENGTH 50


#define DEFAULTAPNAME "SuperScale"

#define TOUCH_CS 11	// just to make the warning stop appearing, but could interfere
#include "lib/device/TFTScreen.h"

#define POSTDELAY 150


class TFTManager;

void statDisplay(TFTManager *tftman);
void statReDisplay(TFTManager *tftman);

class TFTManager : public EventListener{
	SimpleTFT mytft;
	String prevval;
	Ticker ticker;
public:
	TFTManager(){}
 	TFT_eSPI *getTFT(){return mytft.getTFT();}

    // Note: reverseLines() and improveHistory() were safely deleted from here!

	bool notify(std::string ename, Event *e){
		StringEvent *se=0;
		if(e->isClassType("StringEvent")) se=(StringEvent *)e;
		else return false;

        // "history" has been removed from this trigger list
		if(ename =="weight" || ename=="id" || ename=="species" || ename=="totalharvest" || ename=="blockbe" || ename =="command" || ename=="argument"|| ename=="blockdate"){
			String str=se->str.c_str();

			if(ename=="totalharvest" && str.length()>0) str=""+str+"g";
			if(ename=="blockbe" && str.length()>0) str+="% BE";
			if(ename=="weight") {
				if(str==prevval) return false;
				prevval=str;
				str="   "+str+"   ";
			}
			if(ename=="blockdate") str=str.substring(0,str.lastIndexOf("/"));
			if(ename=="command") {if(str.length()>20) {str=str.substring(0,21);str+="..";}}

			if(str.length()==0) str="  ";

            // FIX: Explicitly pad "species" with spaces to completely wipe out older, longer strings
            if(ename=="species") {
                str = str + "    ";
            }

            // "history" check removed here
			if(ename!="species" && ename!="date") str=String()+" "+str+" ";

 			mytft.setSpotString(ename.c_str(), str);
			if(ename!="weight") postdisplay();

			return true;
		}

		return false;
	}
	void setText(String spot,String value){};
	bool waitingpostdisplay=false;
	void postdisplay(){
		if(waitingpostdisplay) return;
		waitingpostdisplay=true;
		ticker.once_ms(POSTDELAY, statDisplay,this);
	}
	void display(){waitingpostdisplay=false;}
	void postredisplay(){
		if(waitingpostdisplay) return;
		waitingpostdisplay=true;
		ticker.once_ms(POSTDELAY, statReDisplay,this);
	}
	void redisplay(){
		mytft.redisplay();
		waitingpostdisplay=false;}

	void setupTFT() {
		mytft.setRotation(4);
		uint16_t titlecolor=0xFFF7;
		uint16_t commandcolor=0xfe18;
		uint16_t argcolor=0xff59;
		uint16_t blockcolor=0xc7f8;
		uint16_t totalharvestcolor=0xc63f;

		int zone1start=0;
		int zone2start=60;
		int zone3start=110;
		bool bg1=true, bg2=true, bg3=true;

		uint16_t bgcolor1=0x1800;// dark red
		uint16_t bgcolor2=0x0004;// dark cyan
		uint16_t bgcolor3=0x08C0;// dark green

		if(bg1) mytft.addRect(Rect(0, zone1start, 135, zone2start-zone1start, bgcolor1));

		mytft.addDisplaySpot("weight");
		mytft.setSpot("weight", DisplaySpot("---", 2, 4,titlecolor,bgcolor1, 4,true,0,68,0));

		mytft.addLine(Rect(0, zone2start-1, 135, zone2start-1, 0xA000));
		if(bg2) mytft.addRect(Rect(0, zone2start, 135,zone3start-zone2start, bgcolor2));

		mytft.addDisplaySpot("command");
		mytft.setSpot("command", DisplaySpot("", 1, 2,commandcolor, bgcolor2, 8,true,1,0,zone2start));
		mytft.addDisplaySpot("argument");
		mytft.setSpot("argument", DisplaySpot("", 1, 2, argcolor, bgcolor2, 8, true, -1, 134, zone2start+26));

		mytft.addLine(Rect(0, zone3start-2, 135, zone3start-2, TFT_DARKGREEN));
		if(bg3) mytft.addRect(Rect(0, zone3start, 135,240-zone3start, bgcolor3));

		mytft.addDisplaySpot("id");
		mytft.setSpot("id", DisplaySpot("-", 1, 4,blockcolor, bgcolor3, 8,true, 0, 67,zone3start));

        // --- NEW ENLARGED FONTS & SPREAD OUT LAYOUT ---
        // (Swapped "4, 1" and "1, 2" to "1, 4" for a smoother, larger font)

		mytft.addDisplaySpot("species");
		mytft.setSpot("species", DisplaySpot("", 1, 3,blockcolor, bgcolor3,8,true,1, 0, zone3start+40));

		mytft.addDisplaySpot("blockdate");
		mytft.setSpot("blockdate", DisplaySpot("", 1, 3,blockcolor, bgcolor3,8,true,1, 0, zone3start+70));

		mytft.addDisplaySpot("totalharvest");
		mytft.setSpot("totalharvest", DisplaySpot("", 1, 3,totalharvestcolor, bgcolor3, 8,true,1, 0, zone3start+100));

	//	mytft.addDisplaySpot("blockbe");
	//	mytft.setSpot("blockbe", DisplaySpot("", 1, 3,blockcolor, bgcolor3, 8,true,0, 0, zone3start+100));

        // History spot has been entirely deleted

	//	mytft.addDisplaySpot("alert");
	//	mytft.setSpot("alert", DisplaySpot("", 1, 4,historycolor,bgcolor3,8,true,1,0,zone3start+100));

		mytft.display();
	}
};


void statDisplay(TFTManager *tftman){
	if(tftman) tftman->display();
};

void statReDisplay(TFTManager *tftman){
	if(tftman) tftman->redisplay();
};


class TFTPrice {
	SimpleTFT mytft;
	//DataMap *map;
public:
	TFTPrice(){}//DataMap *map0):map(map0){}
	TFT_eSPI *getTFT(){return mytft.getTFT();}


	void update(String varname, String value){
		if(value.length()>=2) value=String()+" "+value+" ";
		value=String()+" "+value+" ";
		mytft.setSpotString(varname.c_str(), value.c_str());
	}

	void display(){mytft.display();}
	void redisplay(){mytft.redisplay();}
	void setupTFT() {// f1s1 < f2s1 < f1s2 < f4s1 < f2s2 < f1s3 <f1s4 < f2s3 < f4s2
		mytft.setRotation(4);
		uint16_t titlecolor=0x97F0;
		uint16_t commandcolor=0xFC10;
		uint16_t argcolor=0xFD40;
		uint16_t blockcolor=0xfe7f;
		uint16_t historycolor=0xFC39;

		int zone1start=0;
		int zone2start=56;
		int zone3start=130;
		bool bg1=true, bg2=true, bg3=true;

		uint16_t bgcolor1=0x1800;// dark red
		uint16_t bgcolor2=0x0004;// dark cyan 		//0x1804;// dark purple
		uint16_t bgcolor3=0x08C0;// dark green 		//0x1804;// dark purple

		if(bg1) mytft.addRect(Rect(0, zone1start, 135, zone2start-zone1start, bgcolor1));

		//	mytft.setCursor(0, 0);
		mytft.addDisplaySpot("weight");
		mytft.setSpot("weight", DisplaySpot("---", 2, 4,titlecolor,bgcolor1, 4,true,0,68,0));

		mytft.addLine(Rect(0, zone2start-1, 135, zone2start-1, 0xA000));
		if(bg2) mytft.addRect(Rect(0, zone2start, 135,zone3start-zone2start, bgcolor2));

		mytft.addDisplaySpot("current"); //      4, 1
		mytft.setSpot("current", DisplaySpot("---", 4, 1,commandcolor, bgcolor2, 8,true,1,0,zone2start+3));//	mytft.setSpot("command", DisplaySpot("spawn/prep", 4, 1,commandcolor,bgcolor2, 8,true,1,0,zone2start));

		mytft.addLine(Rect(0, zone3start-2, 135, zone3start-2, TFT_DARKGREEN));
		if(bg3) mytft.addRect(Rect(0, zone3start, 135,240-zone3start, bgcolor3));

		mytft.addDisplaySpot("unitprice");
		mytft.setSpot("unitprice", DisplaySpot("-/kg", 1, 3,commandcolor, bgcolor2, 8,true, 0, 67,zone3start-20)); // mytft.setSpot("block", DisplaySpot("A111", 1, 4,blockcolor, bgcolor3, 8,true, 0, 67,zone3start));
		mytft.addDisplaySpot("price");
		mytft.setSpot("price", DisplaySpot("-e", 2, 3,titlecolor, bgcolor3, 8,true, 0, 67,zone3start+15)); // mytft.setSpot("block", DisplaySpot("A111", 1, 4,blockcolor, bgcolor3, 8,true, 0, 67,zone3start));
		mytft.addDisplaySpot("pricetitle");
		mytft.setSpot("pricetitle", DisplaySpot("price", 1, 2,titlecolor, bgcolor3, 8,true,0, 40, zone3start+3));//mytft.setSpot("total", DisplaySpot("Tot. 550g", 2, 1,blockcolor, bgcolor3, 8,true,0, 40, zone3start+53));
		mytft.addDisplaySpot("sumtitle");
		mytft.setSpot("sumtitle", DisplaySpot("total", 1, 2,blockcolor, bgcolor3, 8,true,0, 40, zone3start+61));//mytft.setSpot("total", DisplaySpot("Tot. 550g", 2, 1,blockcolor, bgcolor3, 8,true,0, 40, zone3start+53));
		mytft.addDisplaySpot("sum");
		mytft.setSpot("sum", DisplaySpot("-e", 1, 4,blockcolor, bgcolor2, 8,true, 0, 67,zone3start+78)); // mytft.setSpot("block", DisplaySpot("A111", 1, 4,blockcolor, bgcolor3, 8,true, 0, 67,zone3start));

		/*		mytft.addDisplaySpot("species");
		mytft.setSpot("species", DisplaySpot("", 4, 1,blockcolor, bgcolor3,8,true,0, 28, zone3start+32)); //mytft.setSpot("species", DisplaySpot("LEm", 4, 1,blockcolor, bgcolor3,8,true,0, 40, zone3start+32));
		mytft.addDisplaySpot("blockdate");
		mytft.setSpot("blockdate", DisplaySpot("", 4, 1,blockcolor, bgcolor3,8,true,0, 102, zone3start+32)); // mytft.setSpot("date", DisplaySpot("1.3", 4, 1,blockcolor, bgcolor3,8,true,0, 102, zone3start+32));
		mytft.addDisplaySpot("totalharvest");
		mytft.setSpot("totalharvest", DisplaySpot("", 2, 1,blockcolor, bgcolor3, 8,true,0, 40, zone3start+53));//mytft.setSpot("total", DisplaySpot("Tot. 550g", 2, 1,blockcolor, bgcolor3, 8,true,0, 40, zone3start+53));
		mytft.addDisplaySpot("blockbe");
		mytft.setSpot("blockbe", DisplaySpot("", 2, 1,blockcolor, bgcolor3, 8,true,0, 102, zone3start+53));//mytft.setSpot("blockbe", DisplaySpot("47% BE", 2, 1,blockcolor, bgcolor3, 8,true,0, 102, zone3start+53));

		mytft.addDisplaySpot("history");
		mytft.setSpot("history", DisplaySpot("", 2, 1,historycolor,bgcolor3,8,true,1,0,zone3start+68));//mytft.setSpot("history", DisplaySpot("5/5 harvest 120\n15/4 harvest 300\n3/4 harvest 150\n16/3 harvest 250", 2, 1,historycolor,bgcolor3,8,true,1,0,zone3start+68));
		 */
		mytft.display();
		// this should b updted with real values
	}
};



class PriceManager: public EventListener  {

	SuperPricing pricing;
	std::map <String,String> straintoname;
	DataMap *scalemap;
	Beeper *beeper;

	bool activeScreen=false;
public:
	bool getActiveScreen(){return activeScreen;}
	void setActiveScreen(bool b){
		//	if(!activeScreen && b)
		activeScreen=b;
	}
	void addCurrent(){
		pricing.addSumWeight(scalemap->get("weight").toFloat()/1000);
	}
	void change(){pricing.changeSelected();}
	void reset(){pricing.resetSum();}

private:
	void reply(bool b, StringMapEvent *se ){
		if(b) se->insertValue("response","OK");	// what is this ok used to ? dont remember
		else se->insertValue("response","NOTOK");
	}

	void beepnotify(){if(beeper){beeper->simpleBeep(TFTUPDATEFREQ,TFTUPDATELENGTH);}	}

	bool notify(GenString ename, Event *e){return notify(String(ename.c_str()),e);}
	bool notify(String ename, Event *e){		//	Serial.println(String()+"DataManager:notify ename:"+ename);
		if(ename[ename.length()-1]=='/') ename=ename.substring(0,ename.length()-1);
		StringMapEvent *se=0;
		if(e->isClassType("StringMapEvent")) se=(StringMapEvent *)e;
		if(se==0) return false;

		if(ename==String("/price/screen")){
			beepnotify();
			activeScreen=!activeScreen;
			reply(true,se);
			return true;
		}

		if(ename==String("/price/clear")) {
			beepnotify();
			pricing.resetSum();
			reply(true,se);
			return true;
		}
		if(ename==String("/price/add")) {
			beepnotify();
			auto sesstd=se->values.begin();
			String ses=sesstd->second.c_str();
			float weight=scalemap->get("weight").toInt();
			weight=weight/1000;
			if(ses.length()==0 || ses==String(pricing.getCurrentPriceForWeight(weight))){
				pricing.addSumWeight(weight);
			} else {
				pricing.addSumPrice(ses.toFloat());
			}
			reply(true,se);
			return true;
		}	//addcurrent weight*price to sum

		if(ename==String("/price/change")) {
			beepnotify();
			pricing.changeSelected();	// change selected price
			reply(true,se);
			return true;
		}
		if(ename==String("/price/select")) {
			beepnotify();
			auto sesstd=se->values.begin();
			String ses=sesstd->second.c_str();
			Serial.println(String()+"select "+ses);
			bool b=false;
			if(!ses.length()==0) b=pricing.select(ses);
			reply(b,se);
			return true;
		}
		if(ename==String("/price/set")) {
			beepnotify();
			auto sesstd=se->values.begin();
			String k=sesstd->first.c_str();
			String v=sesstd->second.c_str();
			bool b=pricing.setPrice(k,v.toFloat());	// change price value
			reply(b,se);
			return true;
		}
		if(ename==String("/price/setsum")) {
			beepnotify();
			auto sesstd=se->values.begin();
			String v=sesstd->second.c_str();
			bool b=pricing.setSum(v.toFloat());	// change price value
			reply(b,se);
			return true;
		}
		if(ename==String("/price/json")) {
			//beepnotify();
			se->insertValue("response",makeJson().c_str());
			reply(true,se);
			return true;
		}

		return true;
	}

	String makeJson(){
		String json="{";
		json+=String()+"\"weight\":"+scalemap->get("weight")+",";
		json+=String()+"\"sum\":"+pricing.getSum()+",";
		json+=String()+"\"current\":\""+pricing.getCurrentName()+"\",";
		json+=String()+"\"unitprice\":"+pricing.getCurrentPrice()+",";
		Serial.println(String()+"PriceManager::makeJson0 pricing:"+pricing.getPrices()->size());

		json+=String()+"\"prices\":{";
		std::map<String,float> *map=pricing.getPrices();
		bool first=true;
		for(auto it: *map){
			if(first) first=false; else json+=",";
			json+=String()+"\""+it.first+"\":"+it.second;
		}
		json+="},";
		//		json+=String()+"\"units\":[\"kg\",\"/k";

		//		json+=String()+"\"prices\":{";
		// unit ?
		json+=String()+"\"detail\":"+pricing.getPriceSuperDetailJson();
		Serial.println(String()+ "PriceManager::makeJson1 :"+pricing.getPriceSuperDetailJson());

		json+="}";
		return json;
	}

	void parse(String filecontent){
		//		String filecontent = "[\"one\",\"two\",{\"three\":3}]";
		DynamicJsonDocument doc2(500);//filecontent.length());
		deserializeJson(doc2, filecontent);
		JsonArray arr2 = doc2.as<JsonArray>();
		//		Serial.println(String()+"PriceManager::parse0 :'"+filecontent+"'");

		for (JsonVariant value : arr2) {		//		String val=value.as<char*>();		//		Serial.println(String()+"PriceManager::parse: "+val);
			//		Serial.println(String()+"PriceManager::parse+: "+value.as<JsonObject>());
			JsonObject obj=value.as<JsonObject>();
			if(obj){
				String name=obj["title"];
				float price=obj["price"];
				//			Serial.println(String()+"PriceManager::parse2: name:"+name+" price:"+price);
				pricing.addPrice(name,price);
				JsonVariant var=obj["names"];
				for( JsonVariant kv : var.as<JsonArray>() ) {
					String val=kv.as<const char*>();
					straintoname[val]=name;
					//				Serial.println(String()+"PriceManager::parse3: name:"+name+" val:"+val);
				}
			}
		}
		//	Serial.println(String()+"PriceManager::parse end :pricing:"+pricing.getPrices()->size());
	};

public:
	void update(TFTPrice *tft){
		int w=scalemap->get("weight").toInt();
		tft->update("weight",String(w));
		tft->update("current",pricing.getCurrentName());
		float cprice=pricing.getCurrentPrice();
		tft->update("unitprice",String(cprice)+"/k");
		tft->update("price",String(cprice*w/1000)+"e");
		tft->update("sum",String(pricing.getSum())+"e");
		tft->redisplay();
		/*
			 		json+=String()+"\"weight\":"+scalemap->get("weight")+",";
			json+=String()+"\"sum\":"+pricing.getSum()+",";
			json+=String()+"\"current\":\""+pricing.getCurrentName()+"\",";
			json+=String()+"\"unitprice\":"+pricing.getCurrentPrice()+",";

		 */
	}
	void load(DataMap *nscalemap, Beeper *beeper0){
		scalemap=nscalemap;
		beeper=beeper0;
		String filecontent=SimpleFS.readFileToString(PRICEFILENAME);
		parse(filecontent);
	}

};


#endif
