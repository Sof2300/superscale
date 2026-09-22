#ifndef EVENT_H
#define EVENT_H

#include <initializer_list>
#include <map>

class Event{
public:
	virtual ~Event(){};
	virtual Event* getCopy(){return new Event();};
	virtual const char *getClassType(){return "Event";}
	virtual bool isClassType(const char *type){if(String(type)==String(getClassType())) return true; else return false;};
};

#include "../datastruct/GenString.h"
#define GenMap std::map<GenString,GenString>
//bool keyexists(GenString k, GenMap *m){return (m->find(k) != m->end()); };


class StringEvent:public Event {
public:
	GenString str;

	virtual Event* getCopy(){return new StringEvent(str);};
	StringEvent(GenString str0=""):str(str0){};
	virtual const char *getClassType(){return "StringEvent";}
};

class StringMapEvent : public Event{
public:
	bool ok=true;
	GenMap values;
	StringMapEvent(){};		// empty map constructor
	StringMapEvent(GenMap *src): values(*src) {}
#if 0
	StringMapEvent(std::multimap<GenString,GenString> *src): values(*src)  {};
#endif
//	StringMapEvent(std::initializer_list<std::initializer_list<GenString>> src): values(src)  {};
	StringMapEvent(GenMap src): values(src)  {};
	void insertValue(GenString k, GenString v){values.insert(std::pair<GenString,GenString>(k,v));};
	void insertValue(String k, String v){insertValue(GenString(k.c_str()), GenString(v.c_str()));};
	void insertValue(const char *k, const char * v){insertValue(GenString(k), GenString(v));};
	void updateValue(GenString k, GenString v){
	if (values.find(k) == values.end()) insertValue(k,v);
	else {
		values.find(k)->second=v;
	}
	};
	bool exists(GenString k){return (values.find(k) != values.end()); };
	bool exists(String k){return (values.find(k.c_str()) != values.end()); };
	bool exists(const char *k){return (values.find(k) != values.end()); };
	GenString get(GenString k){ if(exists(k)) return values[k].c_str(); else return "";}
	String get(String k){ return get(GenString(k.c_str())).c_str();}
	String get(const char *k){return get(GenString(k)).c_str();}
	virtual Event* getCopy(){return new StringMapEvent(&values);};
	virtual const char *getClassType(){return "StringMapEvent";}
	virtual bool isClassType(const char *type){
			if(Event::isClassType(type)) return true;
			else if(String(getClassType())==String(type)) return true;
			else return false;
		};
	GenString toString(){
		GenString s="";
		for(auto e : values) {
			if(s.length()==0) s="{";
			else s+=",";
			s+=GenString()+e.first.c_str()+":"+e.second.c_str();
		}
		if(s.length()==0) return "";
		s+="}";
		return s;
	}
};


class NamedStringMapEvent : public StringMapEvent{
public:
	std::string ename;
	NamedStringMapEvent(std::string ename0,GenMap *src) : StringMapEvent(src), ename(ename0){};
	NamedStringMapEvent(std::string ename0,GenMap src): StringMapEvent(src), ename(ename0) {};
#if 0
	NamedStringMapEvent(std::string ename0,std::multimap<GenString,GenString> *src):  StringMapEvent(src), ename(ename0) {};
#endif
	virtual Event* getCopy(){return new NamedStringMapEvent(ename,&values);};
	virtual const char *getClassType(){return "NamedStringMapEvent";}
	virtual bool isClassType(const char *type){
			if(StringMapEvent::isClassType(type)) return true;
			else if(String(getClassType())==String(type)) return true;
			else return false;
		};
};


#endif
