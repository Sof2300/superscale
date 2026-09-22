#define MAXINTERRUPTS 2


bool InterruptManInited=false;
class InterruptCB{
public:
	virtual void callback()=0;
};
class InterruptMan {
	static unsigned interruptnumber;
	static InterruptCB * (cbobjs[MAXINTERRUPTS]);
public:
	static void init(){
		interruptnumber=0;
		if(!InterruptManInited) for(int i=0;i<MAXINTERRUPTS;i++) cbobjs[i]=0; //init table
		InterruptManInited=true;
	}
	static int attach(unsigned pin, char mode,InterruptCB *ptr){
		if(!ptr) return -1;	// will do nothing otherwise
		if(interruptnumber==MAXINTERRUPTS) return -1; //
		auto modeo=RISING;
		if(mode==1) modeo=FALLING;
		else if(mode==2) modeo=CHANGE;
		else if(mode==3) modeo=LOW;
		switch(interruptnumber){
		case 0:attachInterrupt(pin, func0,modeo);break;
		case 1:attachInterrupt(pin, func1,modeo);break;	}

		cbobjs[interruptnumber]=ptr;
		interruptnumber++;
		return interruptnumber-1;
	};	// return an index

	bool detach(unsigned index){return false;};

	static void ICACHE_RAM_ATTR func0(){if(cbobjs[0]) (cbobjs[0])->callback();}
	static void ICACHE_RAM_ATTR func1(){if(cbobjs[1]) (cbobjs[1])->callback();}
};

InterruptCB * (InterruptMan::cbobjs[MAXINTERRUPTS]);
unsigned InterruptMan::interruptnumber;
