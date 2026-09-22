#ifndef CURWEBSERVER_H
#define CURWEBSERVER_H

#ifdef ESP8266BUILD
#include "WebServerEsp8266.h"
#define SimpleWebServer WebServerEsp8266
#endif

#ifdef ESP32BUILD
//#include "WebServerEsp32.h"
//#define SimpleWebServer WebServerEsp32
#include "AsyncWebServerEsp32.h"
#define SimpleWebServer AsyncWebServerEsp32

#endif

#ifdef x86BUILD
#define SimpleWebServer CurWebServerx86
class CurWebServerx86{};
#endif

#endif
