#ifndef GENSTRING_H
#define GENSTRING_H


#include <string>
#define GenString std::string
//#define RF(x) x
#ifdef ESP8266BUILD
#undef FTEMPLATE
#define FFX(string_literal) (reinterpret_cast<const __FlashStringHelper *>(((__extension__({static const char __c[] __attribute__((section(FTEMPLATE))) = ((string_literal)); &__c[0];})))))
#define RF(x) String(FFX(x)).c_str()
#define FTEMPLATE ".irom.text.genstring"
#endif


String removeComments(String content) {
	bool found=true;
	while(found){
		int i=content.indexOf("//");
		if(i<0) found=false;
		else {
			int j=content.indexOf("\n",i);
			if(j<0) j=content.length();
			content=content.substring(0,i)+content.substring(j+1);
		}
	}
	found=true;
	while(found){
		int i=content.indexOf("/*");
		if(i<0) found=false;
		else {
			int j=content.indexOf("*/",i);
			if(j<0) j=content.length();
			content=content.substring(0,i)+content.substring(j+1);
		}
	}
	return content;


}

String getLastToken(String pile, String sep, int index, String *res){
//	Serial.println(String()+"DataManager::getLastToken:  start index"+index+" pile:"+pile );
	int i=pile.lastIndexOf(sep),j=pile.length();
//	Serial.println(String()+"DataManager::getLastToken:  i"+i+" j"+j );
	while(i>-1){
		if(index==0) {if(res) *res=pile.substring(0,i)+pile.substring(j,pile.length());String ret=pile.substring(i+1,j);ret.trim();return ret;}
		index--;j=i;
//		Serial.println(String()+"DataManager::getLastToken:  i"+i+" j"+j );
		i=pile.lastIndexOf(sep,j-1);
	}
	if(index==0) {if(res) *res="";pile.trim();return pile;}
	else {if(res) *res=pile.substring(i,pile.length()); String ret=pile.substring(0,i);ret.trim();return ret;}
}
String getToken(String pile, String sep, int index, String *res=0){
//	Serial.println(String()+"DataManager::getToken:  start index "+index+" pile:"+pile+" sep '"+sep+"'");
	int i=pile.indexOf(sep),j=0;
//	Serial.println(String()+"DataManager::getToken1:  i "+i+" j "+j );
	bool started=false;

	if(index==0 && i>-1) {
	  	if(res) {
	  		*res=pile.substring(i+sep.length(),pile.length());
//	  		Serial.println(String()+"DataManager::getToken1.5: '"+*res+"'");
	  	}
		String ret=pile.substring(0,i);
	//	Serial.println(String()+"DataManager::getToken1.6:  ret '"+ret+"'");
		return ret;
	}

	while(i>-1 && (index>0 || !started) ){
		started=true;
		index--;j=i+sep.length();
		i=pile.indexOf(sep,j);
//		Serial.println(String()+"DataManager::getToken2:  i "+i+" j "+j );
	}
	//if(index==0) {if(res) *res="";pile.trim();return pile;}
	//else {
	//Serial.println(String()+"DataManager::getToken3:  j "+j);
	if(!started) {if(index==0) return pile; else return "";}
	if(res) {
		*res=pile.substring(0,j-sep.length());
		if(i>-1) *res+=pile.substring(i,pile.length());
//		Serial.println(String()+"DataManager::getToken4:  res "+*res);
	}
	if(i==-1) i=pile.length();
	String ret=pile.substring(j,i);
//	Serial.println(String()+"DataManager::getToken5:  ret "+ret);
	ret.trim();
	return ret;
	//}
};

unsigned int tokenNumber(String pile, String sep){
	int i=pile.indexOf(sep);
	unsigned int n=1;
	while(i>-1) {n++;i=pile.indexOf(sep,i+1);}
	return n;
}
unsigned int tokenNumber(String pile, const char *sepc){
	String sep=String(sepc);
	int i=pile.indexOf(sep);
	unsigned int n=1;
	while(i>-1) {n++;i=pile.indexOf(sep,i+1);}
	return n;
}

String trimToPrecision(String number, unsigned int precision){
	int i=number.indexOf(".");
	if(i<-1) return number;
	return number.substring(0,i+1+precision);
}


uint64_t stoull(std::string const value) {
	uint64_t result = 0;
	char const* p = value.c_str();
	char const* q = p + value.size();
	while (p < q) {
		result = (result << 1) + (result << 3) + *(p++) - '0';
	}
	return result;
}
uint64_t lstoull(std::string const &value) {
	uint64_t result = 0;
	char const* p = value.c_str();
	char const* q = p + value.size();
	while (p < q) {
		result = (result << 1) + (result << 3) + *(p++) - '0';
	}
	return result;
}

#include<vector>

std::vector<String> explode(String str, String delimiter){
//	Serial.println(String()+"explode "+str+" "+delimiter);
	std::vector<String> vect;
	int i=str.indexOf(delimiter),j=0;
//	Serial.println(String()+"explode i "+i);
	while(i>-1) {
//		Serial.println(String()+"explode push "+str.substring(j,i));
		vect.push_back(str.substring(j,i));
		j=i+1;
		i=str.indexOf(delimiter,i+1);
	}
	vect.push_back(str.substring(j,str.length()));
	return vect;
}

const std::vector<std::string> explode(const std::string& s, const char& c){
	std::string buff{""};
	std::vector<std::string> v;
	for(auto n:s)
	{
		if(n != c) buff+=n; else
			if(n == c && buff != "") { v.push_back(buff); buff = ""; }
	}
	if(buff != "") v.push_back(buff);
	return v;
}

String replaceAll(String src, String pattern,String newval){
	while (src.indexOf(pattern)>-1)	src.replace(pattern, newval);
	return src;
}

std::string replaceAll(std::string src, std::string pattern,std::string newval){
	std::string::size_type n = 0;
	while ( ( n = src.find( pattern, n ) ) != std::string::npos ){
		src.replace( n, pattern.size(), newval );
		n += pattern.size();
	}
	return src;
}

inline bool replaceAllInplace(std::string &src, std::string pattern,std::string newval,std::string::size_type start, std::string::size_type end){
	bool changed=false;
	unsigned int ns=newval.size(), ps=pattern.size();
	while ( ( start = src.find( pattern, start ) ) < end ) {
		src.replace( start, ps, newval );
		end=end+ns-ps;	// match the size change
		changed=true;
		start += ns;
	}
	return changed;
}

bool endsWith(std::string &fullString, std::string &ending) {
	if (fullString.length() >= ending.length()) {
		return (0 == fullString.compare (fullString.length() - ending.length(), ending.length(), ending));
	} else return false;
};

bool endsWith(std::string const &fullString, std::string const &ending) {
	if (fullString.length() >= ending.length()) {
		return (0 == fullString.compare (fullString.length() - ending.length(), ending.length(), ending));
	} else
		return false;
};

bool startsWith(std::string const &fullString, std::string const &start) {
	if (fullString.length() >= start.length()) {
		return (0 == fullString.compare (0, start.length(), start));
	} else
		return false;
};

//////////////////////////////////////////////
bool isDigit(GenString str){
	char *ptr;
	//double srcval=
	std::strtod(str.c_str(),&ptr);
	if(*ptr || str.size()==0) return false;
	return true;
};
bool isDigit(String str) {return isDigit(GenString(str.c_str()));}

bool isDigit(const char *str) {return isDigit(GenString(str));}

double strToDouble(std::string str){
	char *ptr;
	double srcval=std::strtod(str.c_str(),&ptr);
	//	if(*ptr || str.size()==0) return false;
	return srcval;
};

uint64_t strToUint64(std::string value){

	//	unsigned long srcval=std::stoul (str);
	//	return srcval;
	uint64_t result = 0;
	char const* p = value.c_str();
	char const* q = p + value.size();
	while (p < q) {
		result = (result << 1) + (result << 3) + *(p++) - '0';
	}
	return result;
};
#define strToUnsignedLong strToUint64
//uint64_t strToUnsignedLong(std::string value){	return strToUint64(value);}

GenString getMin(GenString v0,GenString v1){
	if(isDigit(v0)){
		if(isDigit(v1)){
			double d0=strToDouble(v0);
			double d1=strToDouble(v1);
			if(d0<d1) return v0;
			else return v1;
		} else return v0;
	} else if(isDigit(v1)) return v1;
	else return "";
};

GenString getMax(GenString v0,GenString v1){
	if(isDigit(v0)){
		if(isDigit(v1)){
			double d0=strToDouble(v0);
			double d1=strToDouble(v1);
			if(d0>d1) return v0;
			else return v1;
		} else return v0;
	} else if(isDigit(v1)) return v1;
	else return "";
};


/*	getPath functions
 * 	- getPathToken
 * 	- getPathTokenNumber
 * 	- getPathLeaf
 * 	- getPathBranch
 * */
bool getPathIsLink(GenString val){	// n.b.: path starting directly with key is not considered a link, e.g. a/b/c/
	if(val.empty()) return false;
	if(val[0]=='/') return true;	// start with "/"	: absolute link
	if(startsWith(val,RF("./"))) return true;	// start with "./"	: relative link to current
	if(startsWith(val,RF("../"))) return true;	// start with "../"	: relative link to parent
	return false;// could do better, e.g. check syntax errors, etc
}
GenString getPathParent(GenString path);
GenString getPathAbs(GenString abspath, GenString relpath){	//maybe there is a simpler way, i.e. erase left to ../
		if(!getPathIsLink(relpath)) return "";

 		GenString parent=getPathParent(abspath);	// error if root
		if(startsWith(relpath,RF("./"))) relpath=parent+relpath.substr(1);
		if(startsWith(relpath,RF("../"))) relpath=getPathParent(parent)+relpath.substr(1);	// error if root

		// interepret correctly /a/aa/aaa/../../aa

		replaceAllInplace(relpath,RF("/./"),RF("/"),0,relpath.size());//
		unsigned int pos=relpath.find(RF("/../"));
		while(pos<relpath.size()) {
			unsigned ppos=relpath.rfind("/", pos);
			if(ppos==0) ppos=1;
			relpath.erase(ppos,pos-ppos+3);

		}
		return relpath;
/*
		unsigned int n=getPathTokenNumber(relpath);
		std::vector<GenString> pathvect;
		for(unsigned int i=0;i<n;i++){
			GenString t=getPathToken(relpath,i);
			if(t==RF(".")) continue;
			if(t==RF("..")) {pathvect.pop_back();continue;}
			pathvect.push_back(t);
		}
		GenString npath="/";
		for (GenString n:pathvect) npath+=n+'/';
		return npath;*/

	};

GenString getPathToken(GenString path,unsigned int pos){	// return the token in the path at position pos, e.g. /dev/etc/shared,1-> etc
		if(path.front()=='/') path.erase(0,1);	// remove first and last slash
		if(path.back()=='/') path.erase(path.size()-1,1);
		unsigned int index=path.find('/'), pindex=0;
		GenString subkey=path.substr(pindex,index-pindex);
		while(pos>0) {
			if(index>=path.size()) return "";
			pindex=index+1;
			index=path.find('/',pindex);
			if(index>path.size()) index=path.size();
			subkey=path.substr(pindex,index-pindex);
			pos--;
		}
		return subkey;
	}

unsigned int getPathTokenNumber(GenString path){
	if(path.front()=='/') path.erase(0,1);	// remove first and last slash
	if(path.back()=='/') path.erase(path.size()-1,1);
	unsigned int i=path.find('/'),ip=0, tokens=0;
	while(i<path.size()){
		if((i-ip)>0) tokens++;
		ip=i+1;
		i=path.find('/',ip);
	}
	if(ip<path.size()) tokens++;
	return tokens;
}



GenString getPathLeaf(GenString path){
	while(path[path.length()-1]=='/') path.pop_back();	// hope this remove last char
	unsigned int i=path.rfind('/');
	return path.substr(i+1);
};


GenString getPathBranch(GenString path){
	while(path.back()=='/') path.pop_back(); // hope this remove last char
	unsigned int i=path.rfind('/');
	if(i==0) {
		if(path.front()=='/' && path.size()>1) return GenString()+'/';
		else return GenString();
	}
	return path.substr(0,i);
};
GenString getPathParent(GenString path){return getPathBranch(path);}


std::string to_string(uint64_t num){
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

//#ifdef USEMATH_H

#include <math.h>
std::string to_stringWithPrecision(double d,int decimals){
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

//#endif

#include <algorithm>
// trim from start (in place)
static inline void ltrim(std::string &s) {
	s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](int ch) {
		return !std::isspace(ch);
	}));
}

// trim from end (in place)
static inline void rtrim(std::string &s) {
	s.erase(std::find_if(s.rbegin(), s.rend(), [](int ch) {
		return !std::isspace(ch);
	}).base(), s.end());
}

// trim from both ends (in place)
static inline void trim(std::string &s) {
	ltrim(s);
	rtrim(s);
}




/*
////////////
///Memory tests:

//////////// math.h : 0 bytes sram
#include <math.h>
void setup() {
   int u,l=round(u);
}
void loop() { delay(100);}
////////////

//////////// string : 416 bytes sram
#include<string>
#define RF(x) String(F(x)).c_str()
void setup() {
    Serial.begin(115200);
 // int u,l=round(u);
  std::string str,str2;
  int n,n1;
   str+=str;
  if(str==str2) str2;
  str.find(str2,n);
  str.compare(n1,n,str2);
  str.replace(n,n1,str2);
  str.size();

  str.c_str();
  str.erase(n);
  str.rfind(str2);
  str.substr(n,n1);

  std::strtod(str.c_str(),0);
  Serial.print(("1234567"));
}
void loop() {delay(100);}
////////////
 */

#endif
