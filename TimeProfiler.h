#ifndef TIMEPROFILER_H
#define TIMEPROFILER_H

#include <map>
#include <vector>

#define MAXPROFILES 40
#define MAXCELLS 400

struct ProfilerCell {
	String cellname;
	uint32_t ts;
	ProfilerCell(String name,uint32_t ts0): cellname(name), ts(ts0){}
};


class TimeProfiler {
	std::map<String,std::vector<ProfilerCell>> profiles;

public:

	bool clear(String profilename) {
		bool b=profiles.find(profilename)!=profiles.end();
		if(b) profiles.erase(profiles.find(profilename));
		return b;
	}

	bool tick(String profilename,String cellname="") {
		uint32_t ts=millis();
		bool b=profiles.find(profilename)!=profiles.end();
		if(!b && profiles.size()>=MAXPROFILES) return b;
		if(profiles[profilename].size()>=MAXCELLS) return b;
		profiles[profilename].push_back(ProfilerCell(cellname,ts));
		return b;
	}

	bool reset(String profilename,String cellname=""){
		bool b=clear(profilename);
		tick(profilename,cellname);
		return b;
	}

	bool printick(String profilename,String cellname="") {
		bool b=tick(profilename,cellname);
		uint32_t diff=0;
		unsigned int size=profiles[profilename].size();
		//	  Serial.println(String()+"printick size :"+size+" b:"+b);
		if(b) {
			if(size>1) diff=profiles[profilename][size-1].ts-profiles[profilename][size-2].ts;
		}
		//		  if(size>0) Serial.println(String()+"TimeProfiler::printick - "+profilename+" : "+(size-1)+"/ "+profiles[profilename][size-1].cellname+" : "+String(profiles[profilename][size-1].ts)+", diff: " +String(diff)+" ms");
		if(size>0) printCell(profilename, (size-1), diff);
		return 0;
	}

	void printCell(String profilename, int index, uint32_t diff) {
		Serial.println(String()+"TimeProfiler::printick - "+profilename+" : "+index+"/ "+profiles[profilename][index].cellname+" : "+String(profiles[profilename][index].ts)+", diff: " +String(diff)+" ms");

	}

	void printProfile(String profile) {
		if(profiles.find(profile)==profiles.end()) return ;
		uint32_t diff=0;
		auto *cellvect=&(profiles[profile]);
		for(unsigned int i=0;i<cellvect->size();i++)  {
			if(i>0) diff=(*cellvect)[i].ts-(*cellvect)[i-1].ts;
			printCell(profile, i,  diff);
			//	Serial.println(String()+"TimeProfiler::printSummary - "+it.first+" : "+i+"/ "+it.second[i].cellname+" :"+String(it.second[i].ts)+", diff: " +String(diff)+" ms");
		}
	} ;

	void printSummary() {
		for(auto it:profiles) {
			uint32_t diff=0;
			for(unsigned int i=0;i<it.second.size();i++)  {
				if(i>0) diff=it.second[i].ts-it.second[i-1].ts;
				printCell(it.first, i,  diff);
				//	Serial.println(String()+"TimeProfiler::printSummary - "+it.first+" : "+i+"/ "+it.second[i].cellname+" :"+String(it.second[i].ts)+", diff: " +String(diff)+" ms");
			}
		}
	} ;

} TIMEPROFILER;





#endif
