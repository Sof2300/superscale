#ifndef COMPAT_H
#define COMPAT_H
//#include "../datastruct/GenString.h"




std::string tostring(uint64_t num){
	uint8_t i = 0;  uint64_t n = num;
	char str[24];//should be 21
	do i++;
	while ( n /= 10 );
	str[i] = '\0';
	n = num;
	do str[--i] = ( n % 10 ) + '0';
	while ( n /= 10 );

	return std::string(str);
};

std::string replaceAll2(std::string src, std::string pattern,std::string newval){
	std::string::size_type n = 0;
	while ( ( n = src.find( pattern, n ) ) != std::string::npos ){
		src.replace( n, pattern.size(), newval );
		n += pattern.size();
	}
	return src;
}
#include <math.h>
std::string doubleToString(double d,int decimals=2){
	bool neg=false;
	if(d<0) {neg=true;d=-d;}
	long int l=1;
	for(int i=decimals;i>0;i--) l=l*10;
	l=round(l*d);
	std::string str=to_string(l);
	int sl=str.size();
	while(sl<=decimals) {str="0"+str;sl=str.size();}
	str=str.substr(0,sl-decimals)+"."+str.substr(sl-decimals,sl);
	for(int i=decimals;i>0;i--)
		if(str.substr(str.size()-1,str.size())=="0")
			str=str.substr(0,str.size()-1);
	if(str.substr(str.size()-1,str.size())==".") str=str.substr(0,str.size()-1);
	if(neg && str!="0") str="-"+str;
	return str;
}

int stdStringtoInt(std::string str) {return std::stoi(str);}


class String {
	std::string str;
public:

	String(const char *strptr):str(strptr) {}
	String(char c){str=c;}
	String(double d){str=doubleToString(d);}
	String(unsigned int strint) {str=tostring(strint);}
	String(long unsigned int strint) {str=tostring(strint);}
	String(int strint) {str=to_string(strint);}
	String(long int strint) {str=to_string(strint);}
	String(std::string str0):str(str0) {}
	String(){}
	const char *c_str(){return str.c_str();}
	char operator[](unsigned int i) const {
		return str[i];
	}
	String operator+(String nstr) const {return String(str+nstr.getStr());}
	String operator+(const char *strptr) const {return String(str+std::string(strptr));}
	String operator+(const char *strptr) {return String(str+std::string(strptr));}
	String operator+(char c) {return String(str+c);}
	String operator+(int i)  {return String(str+std::to_string(i));}
	String operator+(unsigned int i) {return String(str+std::to_string(i));}
	String operator+(float i) {return String(str+doubleToString(i));}
	String operator+(double d) {return String(str+doubleToString(d));}

	unsigned char operator [](int i) const {return str[i];}
//	unsigned char & operator [](int i) {return &str[i];}

	//	String operator+(String &str2,const char *strptr) {return String(std::string(strptr)+str2.getStr());}
	//	const char* operator+(String nstr)  {return String(str+nstr.getStr()).c_str();}
	String &operator+=(String nstr) {str=str+nstr.getStr();return *this;}
	String &operator+=(const char *strptr) {str=str+std::string(strptr);return *this;}
	bool operator<(String str2) {return str<str2.getStr();}
	bool operator<(const String &str1) const {
		String str2=str1;
		return str<str2.getStr();}
	//	bool operator==(String str2) {return str==str2.getStr();}
	bool operator==(String str2) const {
		String str1=str2;
		return str==str1.getStr();}

	bool operator!=(const String str2) {
		String str1=str2;
		return str!=str1.getStr();}

	int toInt(){ return stdStringtoInt(str);}

	void remove(int start, int length) {str.erase(start,length);}
	std::string getStr(){return str;};
	int indexOf(String tofind, int startindex=0) {
		string::size_type loc =str.find(tofind.getStr(),startindex);
		if( loc == string::npos ) return -1;
		else return loc;
	}
	int lastIndexOf(String tofind, int startindex=-1) {
		if(startindex==-1) startindex=length();
		string::size_type loc =str.find_last_of(tofind.getStr(),startindex);
//		string::size_type loc2 =str.find_last_of("(",length());
		if( loc == string::npos ) return -1;
		else return loc;
	}
	void trim(){
		std::string str2=str;
		int f=str.find_first_not_of(' ');
		if(f>0) str2.erase(0, f);       //prefixing spaces
		size_t l=str.find_last_not_of(' ');
		if(l!=std::string::npos && l<str2.size()) str2.erase(l+1);         //surfixing spaces
		str=str2;
	}
	//const char *c_str(){return str.c_str();}
	//std::string getStdString(){return str};
	void replace(String pattern, String newval){replaceAll2(str,pattern.c_str(),newval.c_str());}

	//	int indexOf(const char *strptr, int startindex=0) {return indexOf(String(strptr),startindex);}

	String substring(int start, int end=-1){
		if(end<0) end=str.size();
		return str.substr(start,end-start);}
	unsigned length(){return str.size();}
};

class SerialPrinter {
public:
	void begin(unsigned){};
	void println (const char *c){std::cout << c<<std::endl;}
	void println (String c){println(c.c_str());}
	void println (){std::cout << std::endl;}

	void print (const char *c){std::cout << c;}
	void print (String c){print(c.c_str());}

} Serial;

class PseudoSimpleFS {
public:
	void appendToFile(String filename, String data);
	bool exists(String filename){return false;}
	String readFileToString(String filename){
		if(filename=="/testgroups.txt") {
			// 9 species -> 9 anova x 9 groups = 81 group
			String samplegroupconditions=String()+
					"substratelist:substrate/sawdust, substrate/finetourikis, substrate/finepeami, substrate/strawpellet, substrate/crownbeechpellet, substrate/kostawoodchips\n" + //			// start with definition of lists
					"ANOVA1:Substrate Comparison\nacross:species\npresent:substrate/bran"+						// ANOVA+N	//across : means reproduce this anova for each values of species
					"ANOVA1/GROUP1:sawdust 100% (SD)\nsolo:substratelist,substrate/sawdust\n"+					// GROUP+N
					"ANOVA1/GROUP2:finetourikis 100% (Ft)\nsolo:substratelist,substrate/finetourikis\n"+		// solo: all present with no other from list
					"ANOVA1/GROUP3:finepeami 100% (Fp)\nsolo:substratelist,substrate/finepeami\n"+
					"ANOVA1/GROUP4:strawpellet 100% (Pp)\nsolo:substratelist,substrate/strawpellet\n"+
					"ANOVA1/GROUP5:crownbeechpellet 100% (Pc)\nsolo:substratelist,substrate/crownbeechpellet\n"+
					"ANOVA1/GROUP6:kostawoodchips 100% (K)\nsolo:substratelist, substrate/kostawoodchips\n"+
					"ANOVA1/GROUP7:sawdust 50% finetourikis 50% (FtSD)\nsolo:substratelist,substrate/sawdust,substrate/finetourikis\n"+
		//			"ANOVA1/GROUP8:sawdust 50% finetourikis 50% (FtSD)\npresent:substrate/sawdust\npresent:substrate/finetourikis\n"+			// present: on of arg keyword exist
					"ANOVA1/GROUP8:sawdust 50% finepeami 50% (FpSD)\npresent:substrate/sawdust\npresent:substrate/finepeami\n"+
					"";
			return samplegroupconditions;
		}
		return String();};
} SimpleFS;



















#endif
