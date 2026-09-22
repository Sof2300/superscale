/*
 Test the tft.print() viz embedded tft.write() function

 This sketch used font 2, 4, 7

 Make sure all the display driver and pin connections are correct by
 editing the User_Setup.h file in the TFT_eSPI library folder.

 Note that yield() or delay(0) must be called in long duration for/while
 loops to stop the ESP8266 watchdog triggering.

 #########################################################################
 ###### DON'T FORGET TO UPDATE THE User_Setup.h FILE IN THE LIBRARY ######
 #########################################################################

 TFT_eSPI/examples/Smooth Fonts/LittleFS/Font_Demo_4/Notes.ino
 TFT_BLACK       0x0000
TFT_NAVY        0x000F
TFT_DARKGREEN   0x03E0
TFT_DARKCYAN    0x03EF
TFT_MAROON      0x7800
TFT_PURPLE      0x780F
TFT_OLIVE       0x7BE0
TFT_LIGHTGREY   0xC618
TFT_DARKGREY    0x7BEF
TFT_BLUE        0x001F
TFT_GREEN       0x07E0
TFT_CYAN        0x07FF
TFT_RED         0xF800
TFT_MAGENTA     0xF81F
TFT_YELLOW      0xFFE0
TFT_WHITE       0xFFFF
TFT_ORANGE      0xFDA0
TFT_GREENYELLOW 0xB7E0
TFT_PINK        0xFC9F
 */

/*
uncomment #define ST7789_DRIVER in User_Setup.h
uncomment #include <User_Setups/Setup25_TTGO_T_Display.h> in User_Setup_Select.h

 * */

#include <TFT_eSPI.h> // Graphics and font library for ST7735 driver chip
#include <SPI.h>
#include <map>


#define TFT_GREY 0x5AEB // New colour

struct DisplaySpot {
	//	String name;
	String data;
	String displayed;
	int x=-1,y=-1;
	byte maxchars=-1;	// in chars it is trucated to
	byte fontnumber;	//font
	byte fontsize;		//
	bool endln=true;
	int align=1;	// 1 to the right, 0 is center, -1 is left
	uint16_t color,bgcolor;
	DisplaySpot(){};
	DisplaySpot(String data0, byte fontnumber0, byte fontsize0, uint16_t color0, uint16_t bgcolor0, byte maxchars0, bool endln0, int align0, int x0=-1, int y0=-1){
		data=data0;
		color=color0;
		bgcolor=bgcolor0;
		fontnumber=fontnumber0;
		fontsize=fontsize0;
		maxchars=maxchars0;
		endln=endln0;
		align=align0;
		x=x0;
		y=y0;
	}
};

struct Rect {
	uint x0, y0, x1,y1;
	uint16_t color;
	Rect(int x0i, int y0i, int x1i, int y1i, uint16_t colori){x0=x0i;y0=y0i;x1=x1i,y1=y1i;color=colori;}
};
// f1s1 < f2s1 < f1s2 < f4s1 < f2s2 < f1s3 <f1s4 < f2s3 < f4s2
class TFTConsole {
	TFT_eSPI *tft;
	String text ;
	int maxlines=10;
	int font=2,size=1;
	uint16_t textcolor=TFT_WHITE, bgcolor=TFT_BLACK;
public:
	TFTConsole(TFT_eSPI *tft0):tft(tft0){}
	void println(String s){
		text+=s+"\n";
		int lines=0;
		for(int i=0;i<text.length();i++) if(text[i]=='\n') lines++;
		while(lines>maxlines) {text=text.substring(text.indexOf("\n")+1);lines--;}
	//	Serial.println("TFTConsole::println "+text);
		redisplay();
	};
	void display(){tft->fillScreen(TFT_BLACK);redisplay();}
	void redisplay(){
		tft->setTextColor(textcolor,bgcolor);
		tft->setCursor(0,0);
		tft->setTextFont(font);
		tft->setTextSize(size);
		tft->print(text);
	}
};







class SimpleTFT {
	TFT_eSPI tft = TFT_eSPI(135,240);  // Invoke library, pins defined in User_Setup.h

	std::map<String,DisplaySpot> spotmap;
	std::vector<String> displaylist;
	std::vector<Rect> rectlist;
	std::vector<Rect> linelist;


	void displayLine(String str, byte font, byte size){
		tft.setTextFont(font);tft.setTextSize(size);tft.println(str.c_str() );
	}
	void displayColorLine(String str, byte font, byte size, uint16_t color){
		tft.setTextColor(color);
		displayLine(str, font, size);
	}
	void displayColorLine(String str, byte font, byte size, uint16_t color,uint16_t bgcolor){
		tft.setTextColor(color,bgcolor);
		displayLine(str, font, size);
	}
	void displayRect(Rect r){delay(1);tft.fillRect(r.x0, r.y0, r.x1, r.y1, r.color);}
	void displayLine(Rect r){tft.drawLine(r.x0, r.y0, r.x1, r.y1, r.color);}
public:
	SimpleTFT(){tft.init();}

	TFT_eSPI *getTFT(){return &tft;}
	void setSpotString(String key,String value){spotmap[key].data=value;}
	void setSpot(String key, DisplaySpot spot){spotmap[key]=spot;}
	void addRect(Rect r){rectlist.push_back(r);}
	void addLine(Rect r){linelist.push_back(r);}

	void display(){
	//	Serial.println(String()+"pre erase ");
//		Serial.println(millis());
		tft.fillScreen(TFT_BLACK); // erase previous
	//	Serial.println(String()+"post erase");
		for(Rect r : rectlist) displayRect(r);
		for(Rect r : linelist) displayLine(r);
		for(String k : displaylist) displaySpot(spotmap[k]);
	}
	void redisplay(){
		for(Rect r : linelist) displayLine(r);
		for(String k : displaylist) displaySpot(spotmap[k]);
	}

	void displaySpot(DisplaySpot spot){
		if(spot.displayed==spot.data) return;	// do not redisplay if not changed
	//	Serial.println(String()+"displaySpot :"+spot.data+" "+spot.align);
		spot.displayed=spot.data;
		if(spot.align<0) tft.setTextDatum(TR_DATUM);
		else if(spot.align==0) tft.setTextDatum(TC_DATUM);
		else if(spot.align>0) tft.setTextDatum(TL_DATUM);

		 if(spot.align<=0) {
			tft.setTextColor(spot.color, spot.bgcolor);
			tft.setTextSize(spot.fontsize);
			tft.drawString(spot.data.c_str() ,spot.x,spot.y,spot.fontnumber);
			return;
		}
		if(spot.x>=0 && spot.y>=0) setCursor(spot.x, spot.y);
		displayColorLine(spot.data, spot.fontnumber, spot.fontsize, spot.color, spot.bgcolor);
	}
	void setRotation(int a){tft.setRotation(a);}
	void setCursor(int x,int y) {tft.setCursor(x,y);/*Serial.println(String()+"setCursor to "+x+" "+y);*/}
	void fillScreen(uint16_t color){tft.fillScreen(color);}

	void test(String v){
		setCursor(0,0);
		tft.setTextColor(0x97F0,0x1800);
		tft.setTextFont(2);tft.setTextSize(4);//tft.println(v.c_str() );
		tft.drawRightString(v.c_str() ,135,0,2);
	}

	void addDisplaySpot(String spotname){displaylist.push_back(spotname);}

};

