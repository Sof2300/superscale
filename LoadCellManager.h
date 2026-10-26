#ifndef LOADCELLMANAGER_H_
#define LOADCELLMANAGER_H_

#include <stdlib.h>

#include "lib/datastruct/DataMap.h"
#include "lib/device/LoadCellReader.h"

class LoadCellManager {
	LoadCellReader loadcell;

	String formatTare(float tare) {
		String value = String(tare);
		if(value.length() >= 3 && value.substring(value.length() - 3) == ".00")
			value = value.substring(0, value.length() - 3);
		return value;
	}

	bool isValidTareValue(const String &value) {
		if(value.length() == 0 || !isFloat(value)) return false;
		for(unsigned int i = 0; i < value.length(); i++) {
			if(value[i] >= '0' && value[i] <= '9') return true;
		}
		return false;
	}

public:
	LoadCellManager(unsigned doutpin, unsigned sckpin) : loadcell(doutpin, sckpin) {}

	void run() { loadcell.run(); }
	bool hasNewValue() { return loadcell.hasNewValue(); }
	float getValue() { return loadcell.getValue(); }
	void tare() { loadcell.tare(); }

	void checkAndHandleTare(DataMap *scalemap) {
		String tareCommand = scalemap->get("tare");
		if(tareCommand.length() == 0 || tareCommand == "0") return;

		String savedTare = scalemap->get(SAVEDTARE_KEYTEXT);
		String updatedSavedTare = "";

		if(tareCommand == "tare") {
			loadcell.tare();
		}
		else if(tareCommand.substring(0, 7) == "tareto:") {
			String tareValue = tareCommand.substring(7);
			if(isValidTareValue(tareValue)) {
				loadcell.setTare(atof(tareValue.c_str()));
			} else {
				Serial.println(String() + "LoadCellManager: invalid tare value: " + tareValue);
			}
		}
		else if(tareCommand == "loadtare") {
			if(isValidTareValue(savedTare)) {
				loadcell.setTare(atof(savedTare.c_str()));
			} else {
				Serial.println("LoadCellManager: no valid saved tare to load");
			}
		}
		else if(tareCommand == "savetare") {
			updatedSavedTare = formatTare(loadcell.getTare());
			if(updatedSavedTare.length() > 0) {
				scalemap->update(SAVEDTARE_KEYTEXT, updatedSavedTare);
			}
		}
		else {
			Serial.println(String() + "LoadCellManager: unknown tare command: " + tareCommand);
		}

		scalemap->update("tare", "0");
	}
};

#endif
