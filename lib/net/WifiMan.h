#ifndef WIFIMAN_H
#define WIFIMAN_H
#ifndef x86BUILD
#include <WiFi.h>
#include "esp_wifi.h"	// improve performance
#include <ESPmDNS.h>
#endif

#define USEMDNS 1

#ifndef DEFMDNS
#define DEFMDNS "superscale"
#endif

//////////////////////////////////////

class WifiMan {
public:
	static String mode;
	static unsigned limitwaitms;
	static String apssid,appassword,stssid,stpassword;
	static unsigned long previousMillis, interval;

	static String getMode(){return mode;};

	static String getIP(){
/*		Serial.println(String()+"getIP mode:"+mode);
		Serial.println(String()+"getIP WiFi.localIP().toString():"+WiFi.localIP().toString());
		Serial.println(String()+"getIP WiFi.softAPIP().toString():"+WiFi.softAPIP().toString());
*/
		if(mode=="ST" || mode=="station") return WiFi.localIP().toString();
		if(mode=="AP") return WiFi.softAPIP().toString();
		return "";
	}
	static bool connectAP(const char *nssid,const char *npassword){
		WiFi.mode(WIFI_AP);           //Only Access point
		esp_wifi_set_ps (WIFI_PS_NONE);
		WiFi.softAP(nssid, npassword);  //Start HOTspot removing password will disable security

		IPAddress myIP = WiFi.softAPIP(); //Get IP address
		Serial.println(String()+"created AP :"+nssid);
		Serial.print("IP address:");
		Serial.println(myIP);
		mode="AP";
		apssid=nssid;
		appassword=npassword;
		return true;
	}

	static bool connectStation(const char *nssid,const char *npassword){
		Serial.printf("Connecting to %s ", nssid);
		WiFi.mode(WIFI_STA);
		esp_wifi_set_ps (WIFI_PS_NONE);	// improve performance
		unsigned timestarted=millis();
		WiFi.begin(nssid, npassword);
		while (WiFi.status() != WL_CONNECTED){
			if((millis()-timestarted)>limitwaitms) return false;//connectAP(apssid,"");
			delay(500);
			Serial.print("-");
		}
		mode="ST";
		WiFi.setSleep(false);
		esp_wifi_set_ps(WIFI_PS_NONE);
		Serial.println(String()+ " connected in "+String((millis()-timestarted)/1000)+" sec");
		Serial.print("IP address: ");
		Serial.println(WiFi.localIP());  //Print the local IP
/*		Serial.print("IP address bis : ");
		Serial.println(WiFi.localIP().toString());  //Print the local IP
*/		stssid=nssid;
		stpassword=npassword;
		return true;
	};

	static bool reconnectIfNeeded(){
		unsigned long currentMillis = millis();
		// if WiFi is down, try reconnecting
		if ((WiFi.status() != WL_CONNECTED) && (currentMillis - previousMillis >=interval)) {
		  Serial.print(millis());
		  Serial.println("WifiMan::Reconnecting to WiFi...");
		  WiFi.disconnect();
		  WiFi.reconnect();
		  previousMillis = currentMillis;
		  return true;
		}
		return false;
	}

	static bool startMDNS(const char *name=DEFMDNS){
#ifdef USEMDNS
		if(!name || strlen(name)==0) name=DEFMDNS;
		Serial.printf("[mDNS] Starting responder for '%s'...\n", name);
		static bool mdns_started = false;
		if(mdns_started) {
			MDNS.end();
			mdns_started = false;
		}
		if(MDNS.begin(name)){
			MDNS.addService("http", "tcp", 80);
			//MDNS.addService("_http", "_tcp", 80);
			mdns_started = true;
			Serial.printf("[mDNS] SUCCESS! Responder active: http://%s.local/ (IP: %s)\n", name, getIP().c_str());

			// Retrieve and print the actual (resolved) hostname - checking if there are any conflicts in the network
			  char actualHostname[MDNS_NAME_BUF_LEN];  // MDNS_NAME_BUF_LEN is 64 from mdns.h
			  esp_err_t err = mdns_hostname_get(actualHostname);
			  if (err == ESP_OK) {
			    String actualName = String(actualHostname);
			    Serial.println("mDNS responder started. Given name: " + String(name));
			    Serial.println("Current hostname: http://" + actualName + ".local");
			    if (actualName != name) {
			      Serial.println("Hostname renamed.");
			    }
			  } else {
			    Serial.println("Failed to retrieve current hostname (error: " + String(err) + ")");
			  }
			/*  IPAddress serverIp;
			  // Poll until a valid IP is resolved
			  while (serverIp.toString() == "0.0.0.0") {
			      serverIp = MDNS.queryHost("superscale"); // or just "hostname"
			      delay(50); // Short delay to prevent excessive polling
			  }

			  if (serverIp.toString() != "0.0.0.0") {
			      Serial.print("Resolved IP: ");
			      Serial.println(serverIp);
			  }*/
/*
			  IPAddress ip;
			  if (MDNS.queryHost("my-esp32")) {
			      ip = MDNS.IP(0);
			      Serial.print("mDNS ip: ");
			      Serial.println(ip);
			  } else {
			      Serial.println("mDNS resolution failed");
			  }*/

			return true;
		}
		Serial.printf("[mDNS] FAILED to start responder for '%s'!\n", name);
#endif
		return false;
	}
};
String WifiMan::mode, WifiMan::apssid, WifiMan::appassword, WifiMan::stssid, WifiMan::stpassword;
unsigned WifiMan::limitwaitms=25000;
unsigned long WifiMan::interval=5*60*1000, WifiMan::previousMillis=0;





#endif
