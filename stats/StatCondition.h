

#ifndef STATCONDITION_H_
#define STATCONDITION_H_


///////////////////////////////////////////////////////////////////////////////////////////////////////////
class StatCondition {
	String command;
	String arguments;
	std::map<String,String>*lists=0;
public:
	StatCondition(String command0, String arguments0, std::map<String,String>*lists0):command(command0), arguments(arguments0){lists=lists0;}
	StatCondition(String filter){
		int n=tokenNumber(filter,":");
		if(n<2) return;
		command=getToken(filter,":",0);
		arguments=getToken(filter,":",1);
	}
	bool meetCriteria(BlockInfo &info){
		if(command=="present") {
			int n=tokenNumber(arguments,",");
			for(int i=0;i<n;i++) {
				String arg=getToken(arguments,",",i);
				if(info.hasCommand(arg)) {
#if STAT_DEBUG_LEVEL>0
					Serial.println(String()+"StatCondition:meetCriteria "+info.id+" meet condition "+command+" "+arguments);
#endif
					return true;
				}
			}
		}
		if(command=="solo") {
			int n=tokenNumber(arguments,",");
			if(n<2) return true;
			for(int i=1;i<n;i++) {
				String arg=getToken(arguments,",",i);
				if(!info.hasCommand(arg)) return false;
			}
			std::vector<String> blacklist=getSoloBlackList(arguments);
			for(String s:blacklist) {	//				Serial.println(String()+"StatCondition:meetCriteria solo s:"+s);
				bool b=info.hasCommand(s);
				if(b) return false;	//	Serial.println(String()+"StatCondition:meetCriteria solo "+info.id+" "+command+" "+arguments+" condition not met");
			}
#if STAT_DEBUG_LEVEL>0
			Serial.println(String()+"StatCondition:meetCriteria "+info.id+" meet condition "+command+" "+arguments);
#endif
			return true;
		}
		if(command=="across") return true;	// not a real condition, not supposed to be tested
		//	Serial.println(String()+"StatCondition:meetCriteria "+info.id+" "+command+" "+arguments+" will return false");
		return false;
	}

	std::vector<String> getSoloBlackList(String args){
		int n=tokenNumber(args,",");
		if(n<2) return std::vector<String>();
		String listname=getToken(args,",",0);
		std::vector<String> blacklist=getList(listname);
		for(int i=1;i<n;i++) {
			String arg=getToken(args,",",i);
			for(unsigned int j=0;j<blacklist.size();j++) if(blacklist[j]==arg) {//	Serial.println(String()+"StatCondition:meetCriteria solo erase:"+blacklist[j]);
				blacklist.erase(blacklist.begin()+j);break;} // .erase(getToken(arguments,",",i));
		}
		return blacklist;
	}

	std::vector<String> getList(String listname){
		std::vector<String> ret;
		if(!lists) return ret;
		if(lists->find(listname)!=lists->end()) {
			String list=(*lists)[listname];
			int n=tokenNumber(list,",");
			for(int i=0;i<n;i++) {
				String elem=getToken(list,",",i);
				ret.push_back(elem);
			}
		}
		return ret;
	}

	bool isAmongArgs(String s){
		unsigned m=tokenNumber(arguments,",");
		for(unsigned j=1;j<m;j++){
			String subarg=getToken(arguments,",",j);
			if(subarg==s) return true;
		}
		return false;
	}

	bool matchFilter(String fcommand, String farguments){
		if(fcommand=="solo") {	// check in filter arguments that solos are present and other lists items are not
			if(command=="present" || command=="solo") {
				bool ok=true;
				int n=tokenNumber(farguments,",");
				if(n<2) return false;
				for(int i=1;i<n;i++) {
					String arg=getToken(farguments,",",i);
					if(!isAmongArgs(arg)) ok=false;
				}
				if(!ok) return false;
				std::vector<String> blacklist=getSoloBlackList(arguments);
				for(String arg:blacklist) {	//				Serial.println(String()+"StatCondition:meetCriteria solo s:"+s);
					if(isAmongArgs(arg)) return false;
				}
				return true;
			}
		}

		if(fcommand=="present") {	// check that filter arguments are "required" by conditions
			if(command=="present" || command=="solo") {	// check that filter present arguments exist in condition present arguments
				bool ok=false;
				unsigned n=tokenNumber(farguments,",");
				for(unsigned i=0;i<n;i++) {
					String fsubarg=getToken(farguments,",",i);
					if(isAmongArgs(fsubarg)) ok=true;
				}
				return ok;
			}
		}
		return false;
	}
};


StatCondition buildCondition(String command,String arguments,std::map<String,String>*lists) {return StatCondition(command,arguments,lists);}



#endif
