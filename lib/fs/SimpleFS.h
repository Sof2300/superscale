#ifndef SIMPLEFS_H
#define SIMPLEFS_H


#ifdef ESP32BUILD
#define SIMPLEFS SIMPLEFSESP32
#include "SimpleFSEsp32.h"
#endif


#define SimpleFS SIMPLEFS

#endif
