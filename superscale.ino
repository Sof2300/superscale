
/* Development notes
 * current:
 *
 * popular:
 *
 	 Incubation
Query: harvestcount==empty
	GreenHouse
Query: harvestcount>0 !compost !spent
	Compost
Query: compost spent





Todo



Done
	Ok - UI
		 UI to test on device
		  	- tags save buttons
			- refocus on id & select
			- cannot find avg
			- freed up drop down for argument and maybe values
			 - block viz
			 - command revert after tag


	Ok - server
			- 6 saves bug
	 	 	- tare button misbehaving
	 	 	- sound issue
	 	 	- More readable screen display
	 	 	- daily harvest wrong
		 	- prices missing
		 	- timer to reset to default command 1h


 * old:
 	bugs
 		- save from UI button crash sometimes, when and why not sure
 		- unresponsive when reconnecting wifi, why does it take so long
 		- config file is rewritten without a part of the fields
 		- cancell all don't work
 	improvements
		- in blockinfo, total sub (& be) from formula
		- in UI, show flushes number and flushdates
		- in stats/edit UI, escape & to %26 before saving
		- in UI, display boottime in local time rather than GMT

CURRENT ISSUES

minor
- UI slow load page : data.txt super slow to arrive


will not solve now
- wifi once in 2 not connected to st, only soft reset buggs ?

resolved
- time 2 string not working properly on the esp32 3.0	=>resolved
- find why cancelled harvest breaks everything
- harvest 0 or 1 should not be allowed to be saved
- UI enter validate the field set it remotely
- find way to keep last data 5 operations, provide undo function/button
- UI reload JSON after button interaction, especially set & save
- UI avg value of non identified species Nan average -> average of all data
- QR tag more new
- make black button undo

setup
- all esp pins are not able to pmw
- tft espi need to be set to ttgo see in library files
- ledc changed and now regular analog write seem to work fine

ideas for enhancements
- roll it inside on a power bank
- improve the plateau height & stability
- lower the facade to not touch easily

 big idea
 - rfid reader
 - kaizen / keep innovating


bugs/improvements
	- screen species when missing doesn't erase previous
	- separate multi save from one line by default, together as optional
	- after multi cleared start to save the 1 line several times
	- bug of the multisave that save 6 times
	- make separate multi and command (have a save button for multi parameters), the idea is to leave the block info there permanently
	- make the multiblock syntax to set but means last block for monoblock things like blockinfo
	- there is a mistake in the average, its always the same, doesn't change per species. Maybe could provide n for the avg.
		Also limit the data to last 12 months, or even the new year only, if n sufficient (eg >4). say something about what avg we are seeing

	- pb with screen species that don't erase so next if missing or smaller don't cover all
	- bug of double save
	- new system of separate save of blockinfo, comment, and harvest/main command
	- check that cancel works as expected were on server & ui
	- auto trim argument and other fields
	-

 */


#ifndef x86BUILD
#define ESP32BUILD
//#define USEMDNS true
#endif

// HX711 circuit wiring
const int LOADCELL_DOUT_PIN = 27;
const int LOADCELL_SCK_PIN = 26;

#define SAVEBUTTON_PIN 33
#define TAREBUTTON_PIN 12
#define PRICEBUTTON_PIN 32
#define SCREENSWITCHBUTTON_PIN 0
#define PRICECHANGEBUTTON_PIN 35
// right on board button pin : 35, left is 0


#define BUZZER_PIN 25//14

//#define DEFSSID "Bamboo"
//#define DEFPASSWORD "gingembre"
#define DEFSSID "Gardening, cheaper than therapy"
#define DEFPASSWORD "seeds freedom"

#define DEFMDNS "superscale"
#define DEFCOMMANDVAR "defaultcommand"
#define COMMANDVAR "command"

#define STARTFREQ 5000 //440
#define STARTLENGTH 200

#define RFIDID_FILENAME "RFID2ID.csv"


#include "lib/net/WifiMan.h"

#include "lib/fs/SimpleFS.h"
#include "lib/datastruct/DataMap.h"

#include "Managers.h"

#include "TimeProfiler.h"

#include <Button2.h>

#include "lib/net/BasicServer.h"
#include "lib/device/LoadCellReader.h"
#include "lib/device/Beeper.H"

#include "DataManager.h"

#include "BlockInfoManager.h"

#define USE_TFT
//#define USE_TFT
#ifdef USE_TFT
#include "TFTManager.h"
#endif



ConfigManager configman;


LoadCellReader loadcell(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);

DataManager dataman;
BlockInfoManager blockinfoman = BlockInfoManager(dataman.getBlockInfoMap(), dataman.getDataMap(), dataman.getDataOrder());


WifiSubMan wifisubman = WifiSubMan(dataman.getDataConfigMap());
BasicServer *server;


#ifdef USE_TFT
//TFTManager tftman(&dataset);
//SimpleTFT mytft;

TFTManager *tftman;
TFTPrice *tftprice;
TFTConsole *tftconsole ;//
#endif

Ticker loopticker;

Beeper beeper(BUZZER_PIN, false);

Button2 savebutton = Button2(SAVEBUTTON_PIN);
Button2 tarebutton = Button2(TAREBUTTON_PIN);
Button2 pricebutton = Button2(PRICEBUTTON_PIN);
Button2 screenswitchbutton = Button2(SCREENSWITCHBUTTON_PIN);
Button2 pricechangebutton = Button2(PRICECHANGEBUTTON_PIN);

#ifdef USE_TFT
PriceManager priceman;
bool pricetft = true;
#endif

void buttonsave(Button2& btn) {
	Serial.println("Button save callback");
	dataman.saveCurrent();
}

void buttontare(Button2& btn) {
	Serial.println("Button tare callback");
	loadcell.tare();
	dataman.registerInteraction();
}

void buttonresetsum(Button2& btn) {		// long click tare
//	Serial.println("Button reset sum callback");
#ifdef USE_TFT
	if (!priceman.getActiveScreen()) return;
	priceman.reset();
	tftprice->display();
#endif
}
void buttonchangeprice(Button2& btn) {	// double click price
//	Serial.println("Button change price callback");
#ifdef USE_TFT
	if (!priceman.getActiveScreen()) return;
	priceman.change();
	tftprice->display();
#endif
}
void buttonaddsum(Button2& btn) {	// click price
	Serial.println("Button add sum callback");
#ifdef USE_TFT
	if (!priceman.getActiveScreen()) {
		dataman.publicUndo();
		return;
	}
	priceman.addCurrent();
	tftprice->display();
#endif
}
void buttonswitchscreen(Button2& btn) {	// click price
	Serial.println("Button switch screen callback");
#ifdef USE_TFT
	priceman.setActiveScreen(!priceman.getActiveScreen());
	tftprice->display();
#endif

}

void setup() {
	Serial.begin(115200);
//	delay(5000);
	Serial.println("Setup started");
	beeper.simpleBeep(STARTFREQ, STARTLENGTH);
	loopticker.attach_ms(5, buzzerloop);

	TIMEPROFILER.printick("setup","init");
//	Serial.println("SimpleFS will start");
	SIMPLEFS.begin();
//	Serial.println("SimpleFS will printinfo");
	SIMPLEFS.printInfo();
//	Serial.println("TFTManager will start");

//	while(beeper.isPlaying()) {beeper.run(); delay(10);}
	dataman.setBlockInfoMan(&blockinfoman);
	DataMap *configmap=dataman.getDataConfigMap();

	configman.setConfigMap(configmap);
	configman.load();

	blockinfoman.setConfigMap(configmap);

	dataman.load(&beeper);
	dataman.initRemoteSync(RFIDID_FILENAME);

	// here should check first if we don't already have wifi credentials, before using default
	// connect wifi
	if(!configmap->exists("mode")) configmap->set("mode", "ST");
	if(!configmap->exists("ssid")) configmap->set("ssid", DEFSSID);
	if(!configmap->exists("password")) configmap->set("password", DEFPASSWORD);
	if(!configmap->exists("mdns")) configmap->set("mdns", DEFMDNS);


	// here we should subscribe configman to configmap changes at least of wifi stuff
	configmap->on("mode",&configman);
	configmap->on("ssid",&configman);
	configmap->on("password",&configman);
	configmap->on("mdns",&configman);
	configmap->on("apssid",&configman);
	configmap->on("appassword",&configman);


	dataman.getConfigStateMap()->set(FREESPACE_KEYTEXT, String(SIMPLEFS.getFreeSpace()));

#ifdef USE_TFT
	tftman=new TFTManager();
	tftprice= new TFTPrice();
	tftconsole=new TFTConsole(tftman->getTFT());

	tftconsole->display();
	tftconsole->println("Connecting to wifi:\n '");// + configmap->get("ssid") + "'");
#endif

	wifisubman.connect();

#ifdef USE_TFT
	tftconsole->println("Wifi connected !");
#endif
	Serial.println("Wifi connected");

	// create server
	server = new BasicServer(configmap->get("mdns"));
	server->on(std::vector<GenString>({"/switchToStation", "/switchToAP"}), &wifisubman);
	server->on(dataman.getUrlNames(), &dataman);

	server->begin();
	Serial.println("HTTP server started");

	DataMap *datamap = dataman.getDataMap();
	datamap->on("id", &blockinfoman);		// id changed in datamap
	dataman.getConfigStateMap()->on(DATAVERSION_KEYTEXT, &blockinfoman);	// a save happened so need to update

#ifdef USE_TFT
	DataMap *blockinfomap = blockinfoman.getMap();
	blockinfomap->on("species", tftman);
	blockinfomap->on("blockdate", tftman);
	blockinfomap->on("totalharvest", tftman);
	blockinfomap->on("blockbe", tftman);
	blockinfomap->on("history", tftman);

	datamap->on("id", tftman);
	datamap->on("command", tftman);
	datamap->on("argument", tftman);
	DataMap *scalemap = dataman.getScaleMap();
	scalemap->on("weight", tftman);


 	tftprice->setupTFT();
	tftman->setupTFT();
//	tftman.setText("alert", "NO\nTIME");
#endif
	if(configmap->exists(DEFCOMMANDVAR)) {
		datamap->update(COMMANDVAR, configmap->get(DEFCOMMANDVAR));
		//		Serial.println("setup: defcommand found and loaded configmap->get(DEFCOMMANDVAR):"+configmap->get(DEFCOMMANDVAR)+" datamap->get(COMMANDVAR):"+datamap->get(COMMANDVAR));
	}

#ifdef USE_TFT
	savebutton.setPressedHandler(buttonsave);

	tarebutton.setPressedHandler(buttontare);
	tarebutton.setLongClickDetectedHandler(buttonresetsum);
	tarebutton.setLongClickTime(1000);

	pricebutton.setPressedHandler(buttonaddsum);
	 	/*
    #ifdef ONEPRICEBUTTON
    //	pricebutton.setLongClickDetectedHandler(buttonswitchscreen);
    /*	pricebutton.setLongClickTime(1000);
  	pricebutton.setDoubleClickTime(400);
  	pricebutton.setDoubleClickHandler(buttonchangeprice);
    /
    #else if
  	screenswitchbutton.setTapHandler(buttonswitchscreen);
  	pricechangebutton.setTapHandler(buttonchangeprice);
    #endif
	 */

	screenswitchbutton.setTapHandler(buttonswitchscreen);
	pricechangebutton.setTapHandler(buttonchangeprice);

	priceman.load(scalemap, &beeper);
	server->on(std::vector<GenString>({"/price/clear", "/price/add", "/price/set", "/price/setsum", "/price/json", "/price/select", "/price/screen"}), &priceman);
#endif

	// test beeps
	beeper.simpleBeep(SETFREQ, STARTLENGTH);
	beeper.simpleBeep(SETFREQ, STARTLENGTH);
	if (wifisubman.hasAP()) beeper.simpleBeep(ERRORFREQ, STARTLENGTH);
	Serial.println("3 beeps here");

/*
    beeper.simpleBeep(SETBLOCKFREQ,SETBLOCKLENGTH);
  	beeper.simpleBeep(SETFREQ,SETLENGTH);
  	beeper.simpleBeep(SAVEFREQ,SAVELENGTH);
   	beeper.simpleBeep(ERRORFREQ,ERRORLENGTH);
   	Serial.println("beep test finished");
*/
//	loopticker.attach_ms(5, buzzerloop);

	//	TIMEPROFILER.printick("setup","end");

	Serial.println("Setup finished");
}
bool prevactivescreen = false, prevtimesync = false, prevfreespaceinit=false;
long loopts = 0, freespacets=0, totarets=0, prevfreespace=0;
String prevloadcellval;
void serverloop();
void loop() {
//	TIMEPROFILER.reset("loop","start");
	//Serial.println(String()+"- last loop duration : "+ (millis()-loopts));
	//loopts=millis();
 	savebutton.loop();
	tarebutton.loop();
	pricebutton.loop();
	screenswitchbutton.loop();
	pricechangebutton.loop();
 //	TIMEPROFILER.printick("loop","postloops");

	loadcell.run();
	if (loadcell.hasNewValue()) {
		long l = loadcell.getValue() * 1;
		float v = (float)l / (float)1;
//		Serial.println(String()+"loadcell value :"+v);
		String str = String(v);
		if (str.indexOf(".") >= 0) str = str.substring(0, str.indexOf("."));
		if(prevloadcellval!=str) {
			prevloadcellval=str;
			dataman.set("weight", str);
			//	Serial.println(String()+"loop weight :"+dataman.get("weight"));
#ifdef USE_TFT
			if (!priceman.getActiveScreen()) {	//this could be passive wait of listener on datamap : weight
				if (prevactivescreen) tftman->postdisplay();
				else tftman->postredisplay();
			} else {
				if (!prevactivescreen) tftprice->display();
				//else tftprice->redisplay();
				priceman.update(tftprice);
			}
			prevactivescreen = priceman.getActiveScreen();
#endif
			}
	}
	if ((millis()-totarets)>100 && dataman.get("totare") == "1") {	//this should be passive wait of listener on datamap : totare
		totarets=millis();
		dataman.set("totare", "0");
		loadcell.tare();
	}
//	TIMEPROFILER.printick("loop","postloadcell");
	if((millis()-freespacets)>1000) {	//this should be passive wait of listener on datamap
		tftman->postredisplay();
		freespacets=millis();
		long freespace=SIMPLEFS.getFreeSpace();
		if(!prevfreespaceinit || freespace!=prevfreespace) {
#ifdef USE_TFT
			if (freespace< MINIMUMSPACE) {tftman->setText("alert", "DISK FULL!");} else	// this should happen in datamanager : freespace
				if (freespace< LOWSPACE) {tftman->setText("alert", "LOW\n SPACE !");} else
					if (!dataman.isTimesynced()) {
						tftman->setText("alert", "NO\nTIME");
				} else if (!prevtimesync) {
						prevtimesync = true;
						tftman->setText("alert", "");
						tftman->postdisplay();
					}
#endif
			}
	}
//	TIMEPROFILER.printick("loop","postfreespace");
 	serverloop();
//	buzzerloop();
	if(!dataman.busysaving) {dataman.fileready=false;blockinfoman.run();dataman.fileready=true;}

	delay(5);	// best delay for server response
};

void buzzerloop() {
	beeper.run();
}

void serverloop() {
	long serverts = millis();
	//	Serial.println(String()+"main:Yielding server ts:"+millis());
//	TIMEPROFILER.printick("loop","preyield");
	server->yield();// run the server
//	TIMEPROFILER.printick("loop","postyield");
	if (millis() - serverts > 10) Serial.println(String() + "server too long " + (millis() - serverts));
	wifisubman.run();
	dataman.run();
}
