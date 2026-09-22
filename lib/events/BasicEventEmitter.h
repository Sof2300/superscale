#ifndef BASICEVENTEMITTER_H
#define BASICEVENTEMITTER_H

#include "EventEmitter.h"

#include <initializer_list>
#include <map>

#include "../datastruct/GenString.h"


template <typename K, typename V>
class GenObjMap {
	std::multimap<K,V> map;
public:
	void set(K ename, V sub){map.insert(std::pair<K,V>(ename,sub));};
	std::vector<V> getAll(K ename){
		//	Serial.println(String()+"getAll:"+ename+", map size:"+map.size());
		std::vector<V> vect;
		for(auto it = map.begin(); it!=map.end(); it++) {
			//			Serial.println(String()+"it->first:"+it->first);
			if(it->first==ename) vect.push_back(it->second);
		}
		//	Serial.println(String()+"vect size:"+vect.size());
		return vect;
	}
	std::multimap<K,V> *getMap(){return &map;};
	bool has(K ename){return (map.find(ename)!=map.end()); }
	bool erase(K ename, V value) {
		bool ret=false;
		for (auto it = map.begin();it != map.end(); it++){
			auto it2=it; it++;
			if(it2->first==ename && it->second==value) {map.erase(it2);ret=true;}
		}
		return ret;
	}
	unsigned int size() {return map.size();}
};



struct Subscription {
	EventListener* listener=0;
	bool once=false;
	Subscription(EventListener* listener0, bool once0=false):listener(listener0), once(once0){};
	Subscription(const Subscription &sub){listener=sub.listener;once=sub.once;};
	Subscription(Subscription *sub){listener=sub->listener;once=sub->once;};
	Subscription(){};
	//	inline bool operator==(const Subscription& sub){ return sub.listener==listener && sub.once==once; };
	inline bool operator==(Subscription sub){ return sub.listener==listener && sub.once==once; };
};



class BasicEventEmitter : public EventEmitter{
	//std::vector<Subscription> listeners;
	GenObjMap<GenString, Subscription> listeners;

public:
	BasicEventEmitter():EventEmitter(){};
	void on(GenString ename, EventListener *er);
	void on(std::vector<GenString> enames, EventListener *er);

	void once(GenString ename, EventListener*);
	void removeListener(GenString ename, EventListener*);

	bool emit(GenString ename, Event*);

	void on(EventListener *er){on("",er);};
	bool emit(Event*e){return emit("",e);};
	bool hasListener(GenString ename);
	unsigned int listenerNumber(){return listeners.size();};
};


void BasicEventEmitter::on(GenString ename, EventListener *er)
{
	Subscription sub(er);
	listeners.set(ename, sub);
};

void BasicEventEmitter::on(std::vector<GenString> enames, EventListener *er)
{
	for(GenString n : enames) this->on(n,er);
};


void BasicEventEmitter::once(GenString ename, EventListener *er)
{	 Subscription sub(er,true);
listeners.set(ename, sub);
};

bool BasicEventEmitter::hasListener(GenString ename){return listeners.has(ename);}

bool BasicEventEmitter::emit(GenString ename, Event*event){//sync emit,
	//	Serial.println("BasicEventEmitter::emit");
	bool b=false;
	auto *map=listeners.getMap();
	for(auto it = map->begin(); it!=map->end(); it++) {
		if(it->first==ename && it->second.listener) {it->second.listener->notify(ename,event);b=true;}// TODO : remove once
		yield();
	}

	/*	std::vector<Subscription> vect= listeners.getAll(ename);
//	Serial.println("BasicEventEmitter::emit2");
	for(Subscription er:vect){
//		Serial.println("BasicEventEmitter::emit3");
		if(er.listener){er.listener->notify(ename,event);b=true;}	// TODO : remove once
	}*/
	//	Serial.println("BasicEventEmitter::emit4");
	return b;
};

void BasicEventEmitter::removeListener(GenString ename, EventListener *el){
	//	unsigned int i=0;
	std::vector<Subscription> vect= listeners.getAll(ename);
	std::vector<Subscription> toerase;
	for(Subscription er:vect){
		if(er.listener==el){toerase.push_back(er);}	//remove once
	}
	for(Subscription er:toerase){
		listeners.erase(ename,er);
	}

};



#endif
