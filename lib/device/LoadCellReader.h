
#ifdef x86BUILD
class LoadCellReader {public:LoadCellReader(unsigned,unsigned){};void run(){};bool hasNewValue(){return false;};float getValue(){return 0;}};
#endif

#ifdef ESP32BUILD


#include "HX711.h"



#define MAXMEDIAN 7
class Median {
	float sample[MAXMEDIAN];
	unsigned valuecount=0, newindex=0;
public:
	void reset(float val) {
		sample[0] = val;
		valuecount = 1;
		newindex = 1;
	}

	bool addValue(float val){
		if(valuecount<MAXMEDIAN) valuecount++;
		sample[newindex]=val;
		if(newindex==(MAXMEDIAN-1)) newindex=0; else newindex++;
		//   Serial.println(String()+"added value "+val+", newindex "+newindex);
		return true;
	};

	float getMedian(){	//   Serial.println(String()+"Median: valuecount:"+valuecount+" newindex:"+newindex);
		if(!valuecount) return 0;
		float sample2[MAXMEDIAN];
		for(int i=0;i<valuecount;i++){
			sample2[i]=sample[i];
			//     Serial.println(String()+"Median: sample:"+i+" value:"+sample[i]);
		}
		for (int i = 0; i < valuecount; i++)    { // Array Sorting - Asensding Order
			for (int j = i + 1; j < valuecount; j++){
				if (sample2[i] > sample2[j]){
					float temp =  sample2[i];
					sample2[i] = sample2[j];
					sample2[j] = temp;
				}
			}
		}
		//    for(int i=0;i<MAXMEDIAN;i++) Serial.println(String()+"-Median: sample2:"+i+" value:"+sample2[i]);

		return sample2[valuecount/2];
	}
};




class LoadCellReader {
	HX711 scale;
	byte doutpin,sckpin;
	bool newval=false;
	float value=0, avg=0;
	Median median;
	bool first=true;
//	unsigned long ts2=0;
//	float alpha=-479.56, beta=64100;	//5kg load cell
	float alpha=479.64, beta=-58800;	//5kg load cell
	float initval, tareval=0;
	long rawreading;
public:
	LoadCellReader(byte doutpin0, byte sckpin0){doutpin=doutpin0;sckpin=sckpin0;init();};
	bool hasNewValue(){return newval;}
	float getValue(){newval=false;return value;}
	void init(){
		Serial.println("setup start");
		scale.begin(doutpin,sckpin);
	}
private:
	void tare (float grossVal){
		tareval=grossVal;
		median.reset(grossVal);
		value=0;
		newval=true;
		Serial.println(String()+"tare to gross value :"+grossVal);
	}
public:
	void tare (){tare(median.getMedian());}

	void run(){
		if (scale.is_ready()) {
			rawreading = scale.read();
			newval=true;
			float calibratedreading=(float)(rawreading-beta)/alpha;

			if(first) {
				first=false;
				initval=calibratedreading;
				tare(calibratedreading);
				return;
			}

			median.addValue(calibratedreading);
			value=median.getMedian()-tareval;
		}
	}
};

#endif


