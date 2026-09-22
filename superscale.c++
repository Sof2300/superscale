

#include <iostream>
using namespace std;

#define x86BUILD

#include "lib\x86\monoTimer.h"
#include "lib/x86/compat.h"
#include "superscale.ino"

#include <list>
#include <vector>
#include <map>

#include "lib/TimeUtil.h"

#include "stats/StatAnalyzer.h"

/*
class String {
	std::string str;
public:

	String(const char *strptr):str(strptr) {}
	String(std::string str0):str(str0) {}
	String(){}
	char operator[](unsigned int i) const {
	        return str[i];
	    }
	String operator+(String nstr) const {return String(str+nstr.getStr());}
	String operator+(int i) const {return String(str+std::to_string(i));}

	void remove(int start, int length) {str.erase(start,length);}
	std::string getStr(){return str;};
	int indexOf(String tofind, int startindex=0) {
		string::size_type loc =str.find(tofind.getStr(),startindex);
		if( loc == string::npos ) return -1;
		else return loc;
	}
//	int indexOf(const char *strptr, int startindex=0) {return indexOf(String(strptr),startindex);}

	String substring(int start, int end){return str.substr(start,end-start);}
	unsigned length(){return str.size();}
};



class SerialClass{
public:
	void println(String str){cout << str.getStr() << endl;};
} Serial;

String trim(String value){
		while(value[0]==' ' && value.length()>0) value.remove(0,1);
		if(value.length()==0) return value;
		if(value[0]=='\"') value.remove(0,1);
		//int i=value.length()-1;
		while(value.length()>0 && value[value.length()-1]==' ') value.remove(value.length()-1,1);
		if(value[value.length()-1]=='"') value.remove(value.length()-1,1);
		return value;
	}

bool unserialize(String serialized){

		Serial.println(String()+"unserialized serialized:"+serialized);
		int i =serialized.indexOf("{");
		while(i>=0 && i<serialized.length()) {
			int j =serialized.indexOf("\"",i+1);
			int k =serialized.indexOf("\"",j+1);
	//		Serial.println(String()+"i:"+i+",j:"+j+", k:"+k);
	//		Serial.println(String()+"chars i:'"+serialized.substring(i,i+5)+"',j:'"+serialized.substring(j,j+5)+"', k:'"+serialized.substring(k,k+5)+"'");

			String key=serialized.substring(j+1,k);
			int sep =serialized.indexOf(":",k+1);
			// value will either start with '"' or finish with ,
			int nextitem=serialized.indexOf(",",sep+1);
			if(nextitem<0) nextitem=serialized.indexOf("}",sep+1);
			int vstart =serialized.indexOf("\"",sep+1);
			if(vstart<0) vstart=sep+1;
			int vend =serialized.indexOf("\"",vstart+1);
			if(nextitem<vstart || vend<0) {vstart=sep+1;vend=nextitem;}
			else if(vend>0) vend++;
	//		Serial.println(String()+"vstart:"+vstart+", vend:"+vend+", nextitem:"+nextitem);
			String value=serialized.substring(vstart,vend);
	//		Serial.println(String()+"untrimmed value:"+value);
			value=trim(value);
//			if(key.length()>0) set(key,value);
			Serial.println(String()+"unserialized key:"+key+", value:"+value);
//			Serial.println(String()+"- vstart:"+vstart+", vend:"+vend+", nextitem:"+nextitem);
//			Serial.println(String()+" vend chars: '"+serialized.substring(vend,vend+5)+"'");
			i =serialized.indexOf(",",vend);
		}
		return true;
	}
 */





String gendata(){
	int table[4][5]={{8,9,6,7,3},{2,4,3,5,1},{3,5,4,2,3},{2,2,-1,0,3}};
	//	int table[4][5]={{800,900,600,700,300},{200,400,300,500,100},{300,500,400,200,300},{200,200,-100,0,300}};
	String groups[4][4]={{"substrate/sawdust,1150","substrate/bran,300","substrate/gypsum,45",""},
			{"substrate/finetourikis,1260","substrate/bran,330","substrate/gypsum,45",""},
			{"substrate/strawpellet,1260","substrate/bran,330","substrate/gypsum,45",""},
			{"substrate/sawdust,630","substrate/finetourikis,630","substrate/bran,330","substrate/gypsum,45"}
	};
	String speciestable[5]={"POm","HU","PCg","LE","HEg"};
	String ret;
	for(int i=0;i<4;i++){
		for(int j=0;j<5;j++){
			ret+=String()+"25/6/21,A"+i+j+",species,"+speciestable[j]+"\n";
			for(int k=0;k<4;k++) if(groups[i][k].length()>0) ret+=String()+"25/9/21,A"+i+j+","+groups[i][k]+"\n";
			ret+=String()+"25/6/21,A"+i+j+",harvest,"+table[i][j]+"\n";
		}
	}
	Serial.println(String()+"gendata::"+ret);
	return ret;
}

void loadStatsx86(StatAnalyzer*statmanptr){
	String sampledata=gendata();
	statmanptr->clear();
	bool finished=false;
	int i=0;
	while(!finished){
		bool stop=false;
		while(!stop) {
			int j=sampledata.indexOf("\n",i);//Serial.println(String()+"loadStatx86:0 sampledata.size():"+sampledata.length()+" i:"+i+" j:"+j);
			if(j<0) j=sampledata.length();
			String line=sampledata.substring(i,j);
			statmanptr->addLine(line);
			i=j+1;
			if((unsigned)i>sampledata.length()) {i=0;stop=true;}
		}

		finished=statmanptr->dataEnd();
	}
	Serial.println(String()+"loadStatsx86 end ");
}

void teststat(){

	StatAnalyzer statan;

	statan.init();
	loadStatsx86(&statan);
	statan.calculate();
	String restable=statan.getStatusTable();
	Serial.println(String()+"teststat:: restable:"+restable);
	String restable3=statan.getStatusCompare();
	Serial.println(String()+"teststat:: restable2:"+restable3);



	String groupfilter="present:substrate/sawdust", datafilter="present:substrate/sawdust";

	//	statan.getStatusTable();

	statan.addGroupFilter(groupfilter);
	String restable2=statan.getStatusTable();
	Serial.println(String()+"teststat:: "+restable);


	StatAnalyzer statan2;
	statan2.init();
	statan2.addDataFilter(datafilter);
	loadStatsx86(&statan2);
	statan2.calculate();
	String restablestatus=statan2.getStatusTable();
	Serial.println(String()+"teststat:: restablestatus:"+restablestatus);
	String restablecompare=statan2.getStatusCompare();
	Serial.println(String()+"teststat:: restablecompare:"+restablecompare);

	std::cout << "superscale v0.3 ended"<<std::endl;
}


#include "Pricing.h"


int main() {
	std::cout << "superscale v0.3 starting"<<std::endl;

		setup();
//	testPricing();
//	teststat();

	// x86 timer and server maintaining

	bool first=true;
	while(1){
		if(first) {std::cout << "loop started :" << monomillis() << std::endl;first=false;}
		//or IOFactory::yield();
		loop();
		//	 std::cout << ". " << monomillis() << std::endl;
		delay(20);
		//		*	std::cout << "millis 2 " << monomillis() << std::endl;
		//	std::cout << std::endl;
	}

	std::cout << "superscale v0.01 ended"<<std::endl;

	//end();	//cleanup

	return 0;
}
