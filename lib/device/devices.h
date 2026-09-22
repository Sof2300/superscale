#ifndef DEVICES_H
#define DEVICES_H

#ifdef x86BUILD
class RFIDReader {public:RFIDReader(unsigned, unsigned,unsigned){};void run(){};};
#endif

#ifdef ESP32BUILD
#include "RFIDReader.h"
#endif

#endif
