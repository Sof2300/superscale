#ifndef BEEPER_H
#define BEEPER_H


#define BUZZER_SEQ_MAX_LENGTH 64

#ifdef ESP32BUILD

//#include <analogWrite.h>
//#include <pwmWrite.h>

// for esp32

int playing = 0;
//unsigned long startts=0;
void playtone(byte pin, int freq, long durationms=0) {
//  ledcSetup(0, 2000, 8); // setup beeper
//  ledcAttachPin(pin, 0); // attach beeper

///  ledcAttach(pin, 2000, 8);
///  ledcWriteTone(0, freq); // play tone
//	Serial.println(String()+"playtone() call pin:"+pin+", freq:"+freq+", playing:"+playing);
  tone(pin, freq, durationms);
  playing = pin; // store pin
 // startts=millis();
}
void stopTone() {
 // int diff=millis()-startts;
 // Serial.println(String()+"noTone() call pin:"+playing+", diff:"+diff+"ms");
  noTone(playing);
// tone(playing, 0);	// second should not be here
 // startts=0;
  playing = 0;
}
/*
// Arduino like analogWrite
// value has to be between 0 and valueMax
void myAnalogWrite(uint8_t pin, uint32_t value, uint32_t valueMax = 255) {
	  // calculate duty, 4095 from 2 ^ 12 - 1
	  uint32_t duty = (4095 / valueMax) * min(value, valueMax);

	  // write duty to LEDC
	  ledcWrite(pin, duty);
}

*/
#endif






////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Buzzer {
  int buzzerpin;
  unsigned long beepts=0, sequencets=0;
  bool active=false;
  float seq[BUZZER_SEQ_MAX_LENGTH], steps=0, tempo=250;
  int currentstep=0, silentsteps=0;
  bool repeat=false;
  //  bool seqplaying=false;
public:
  Buzzer(int buzzerpin0, bool active1=true):buzzerpin(buzzerpin0), active(active1){
    pinMode(buzzerpin, OUTPUT);
   // ledcAttach(buzzerpin, 2000, 8);
  };

  bool isPlaying(){return sequencets || beepts;};

  void beepPassive(int freq=1000, long durationms=50){
//	Serial.println(String()+"beepPassive freq:"+freq+ " durationms:"+durationms);
	playtone(buzzerpin, freq, durationms);
    beepts=millis()+durationms;
  };
  void beepActive(int pwm=1024, long durationms=50){
    if(pwm>=1024) digitalWrite(buzzerpin, HIGH);
    else if(pwm==0) digitalWrite(buzzerpin, LOW);
    else analogWrite(buzzerpin,pwm);
    beepts=millis()+durationms;
  };

  void beep(float param=1024, long durationms=50) {
    if(active) beepActive(param, durationms);
    else beepPassive(param, durationms);
  }

  void playsequencefixedtempo(float *seq1, int steps1, bool repeat1=false, int silentsteps1=0, int durationms=-1){
    for(int i=0;i<steps1;i++) seq[i]=seq1[i];
    steps=steps1;
    repeat=repeat1;
    silentsteps=silentsteps1;
    if(durationms>=0) tempo=durationms;
//    Serial.println(String()+"playsequencefixedtempo 0 :"+seq[0]+ " tempo:"+tempo);
    beep(seq[0],tempo);
    //    if(seq[0]>=1024) digitalWrite(buzzerpin, HIGH); else digitalWrite(seq[0], HIGH);
    currentstep=1;
    sequencets=millis()+tempo;
//    Serial.println(String()+"sequencets :"+sequencets);
  }

  void stopSequence() {sequencets=0;if(beepts>0 && beepts<millis()) {beepts=0; digitalWrite(buzzerpin, LOW);/*Serial.println(String()+"stopSequence");*/}}

  long testts=0;
  void run(){
/*	if(testts){
		long diff=millis()-testts;
		if(diff>1) Serial.println(String()+"Buzzer::beeper run testts:"+testts+" beepts:"+beepts+" milis():"+millis()+" diff:"+(millis()-beepts));
	}*/
    if(beepts>0 && beepts<millis()) {/*Serial.println(String()+"beeper stopped beepts:"+beepts+" milis():"+millis()+" diff:"+(millis()-beepts));*/
    	 if(active) digitalWrite(buzzerpin, LOW); else stopTone();
    	 beepts=0;}
    //if(sequencets>0)
 //   Serial.println(String()+"- sequencets:"+sequencets+", millis()"+millis());
    if(sequencets>0 && sequencets<millis()) {
 //     Serial.println(String()+"current step:"+currentstep);
      if(currentstep>=steps+silentsteps) { // stop or restart
          if(repeat) currentstep=0; else sequencets=0;
        }
//      Serial.println(String()+"sequencets:"+sequencets+ " millis:"+millis());
      if(sequencets>0) {
  //      Serial.println(String()+"current step:"+currentstep+ " steps:"+steps);
        if(currentstep<steps) {
 //       	  Serial.println(String()+"playsequencefixedtempo "+currentstep+" :"+seq[0]+ " tempo:"+tempo);
        	beep(seq[currentstep],tempo);
        }
        currentstep++;
        sequencets=millis()+tempo;
      }
    }
  };
};













////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#define BEEPLEVEL 8

#define LOUDLEVEL 1024
#define STARTBEEP 512
#define ENDBEEP 256
#define SEQUENCELENGHT 64
#define BEEPLENGTH 8
float seq[SEQUENCELENGHT];
float beep1[]={LOUDLEVEL,LOUDLEVEL,0,LOUDLEVEL ,0,0,0,0}, beep3[]={256,0,128,0, 0,64,0,32}, beep2[]={32,0,0,128, 0,0,256,0}; //shutdown, no rise, fallback
float beepstart[]={STARTBEEP/128,STARTBEEP/64,STARTBEEP/32,STARTBEEP/16, STARTBEEP/8,STARTBEEP/4,STARTBEEP/2,STARTBEEP};
float beepend[]={ENDBEEP,0,ENDBEEP/2,0, ENDBEEP/4,0,ENDBEEP/8,ENDBEEP/16};
int beepduration1=50, beepduration2=200;

float seq1[]={3,0,3,0, 0,0,0,0,  3,3,3,0};

#define BEEPERPILESIZE 64
#define MINPAUSELENGTH 100

class Beeper{
	int pin;
	Buzzer buzz;
	bool started=false, interrupt=false;
	unsigned long pausets=0;

	float ppile[BEEPERPILESIZE];
	long dpile[BEEPERPILESIZE];
	unsigned int pileend=0, pilestart=0;

	int getPileLength(){
		int pilelength=pileend-pilestart;
		if(pilelength<0) pilelength=-pilelength;
//		Serial.println(String()+"Beeper:: pileLength :"+pilelength);
		return pilelength;
	}

public:
	Beeper(int pin0, bool active=true):buzz(pin0,active){}

	bool isPlaying(){return buzz.isPlaying();}

	void stop(){
		if(started) buzz.stopSequence();
		started=false;
	}
	void reset(){
		if(buzz.isPlaying()) buzz.stopSequence();
		pileend=0, pilestart=0;pausets=0; started=false;
		}

	void run(){
		buzz.run();

		if(!buzz.isPlaying() && getPileLength()>0) {
			auto now=millis();
			if(!pausets) pausets=now;
			else if((now-pausets)>MINPAUSELENGTH) {
		//		Serial.println(String()+"Beeper::simpleBeep Buzzer will play "+ppile[pilestart]+" "+dpile[pilestart]);
				buzz.beep(ppile[pilestart],dpile[pilestart]);
				pausets=0;
//				Serial.println(String()+"Beeper:: piling down pilestart:"+pilestart+" param:"+ppile[pilestart]+" "+dpile[pilestart]);
				pilestart++;
				if(pilestart>=BEEPERPILESIZE) pilestart=0;
			}
		}
	}
	void simpleBeep(float param=1024, long durationms=50){
		if(buzz.isPlaying() || getPileLength()>0){
			if(getPileLength()<BEEPERPILESIZE) {
				ppile[pileend]=param, dpile[pileend]=durationms;
		//		Serial.println(String()+"Beeper:: piling up pileend:"+pileend+" param:"+param+" "+durationms);
				pileend++;if(pileend>=BEEPERPILESIZE) pileend=0;
				return;
			} else {Serial.println("Buzzer pile full playing something else");if(!interrupt) return;}
		}
 	//	Serial.println(String()+"Beeper::simpleBeep Buzzer will play "+param+" "+durationms);
		buzz.beep(param,durationms);
	}

	void repeatBeep(int type, int repeat=1, bool repeatseq=true){
// 		Serial.println(String()+"repeatBeep:: isPlaying() : "+isPlaying()+" started:"+started);
		if(buzz.isPlaying()) {
			//	Serial.println("Buzzer busy already playing something else");
			return;	//should be postponed instead ?
		}
//		Serial.println(String()+"repeat : "+repeat);
		//type=1;
		int rep=repeat*BEEPLENGTH;
		for(int i=0;i<SEQUENCELENGHT;i++){
			if(rep>0) {
			//	Serial.println(String()+"repeat2 : "+rep);
				if (type==2) seq[i]=beep2[i%BEEPLENGTH];
				else if (type==3) seq[i]=beep3[i%BEEPLENGTH];
				else if (type==4) seq[i]=beepstart[i%BEEPLENGTH];
				else if (type==5) seq[i]=beepend[i%BEEPLENGTH];
				else seq[i]=beep1[i%BEEPLENGTH];
			} else seq[i]=0;
			rep--;
		}
	//	Serial.print("Beeper : ");
		for(int j=0;j<SEQUENCELENGHT;j++){
			if(j>0) Serial.print(", ");
			Serial.print(String()+seq[j]);
		}
		Serial.println();
		int beepduration=200;
		if(type==2) beepduration=beepduration2;
		else beepduration=beepduration1;
//		Serial.println(String()+"repeat*BEEPLENGTH : "+repeat*BEEPLENGTH);
		buzz.playsequencefixedtempo(&seq[0], repeat*BEEPLENGTH, repeatseq, repeat*BEEPLENGTH, beepduration);
		// buzz.playsequencefixedtempo(seq1,12,true, 20);
		started=true;
	}
};




#endif
