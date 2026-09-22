

#ifndef STATCOMPARISON_H_
#define STATCOMPARISON_H_

#define ANOVAKEYWORD "ANOVA"
#define GROUPKEYWORD "GROUP"


#define  STAT_DEBUG_LEVEL 0


#include "StatDataUnit.h"

#include "StatCondition.h"



class AcrossWatcher{	// will watch data for a certain variable and build categories
	String towatch;
	bool digitvalues=true;
	std::vector<float> fvalues;
	std::vector<String> svalues;
	int tolerance=0;
public:
	AcrossWatcher(String towatch0):towatch(towatch0){};

	float abs(float f){if(f<0) return -f; else return f;}

	bool addFValue(float val){	// return true if created a new category
		bool found=false;
		for(float f:fvalues) if(abs(f-val)<=tolerance) {found=true;break;}
		if(!found) {fvalues.push_back(val);return true;}
		return false;
	}
	bool addSValue(String val){	// return true if created a new category
		bool found=false;
		for(String s:svalues) if(s==val) {found=true;break;}
		if(!found) {svalues.push_back(val);return true;}
		return false;
	}

	void addData(BlockInfo *binfo){
		String str=binfo->getString(towatch);
		if(str.length()==0){
			int val=binfo->getInt(towatch);
			addFValue(val);
		} else {
			addSValue(str);
		}
	}
};



///////////////////////////////////////////////////////////////////////////////////////////////////////////
class StatGroup {	// anova test
public:
	int number=-1;
	String name;
	String title;
	std::vector<StatCondition> conditions;
	std::map<String,String>*lists;

	StatDataUnit statdata;

	StatGroup(int n0, std::map<String,String>*lists0):number(n0){lists=lists0;}//Serial.println(String()+"Group::constructor number:"+number);}
	StatGroup(String name0, std::map<String,String>*lists0):name(name0){lists=lists0;}//Serial.println(String()+"Group::constructor name:"+name);}
	void addCondition(String comm, String args) {conditions.push_back(StatCondition(comm,args,lists));}
	bool meetConditions(BlockInfo &info){
		//		Serial.println(String()+"StatGroup::meetConditions id:'"+info.id+"' group:"+name);
		for(unsigned int i=0;i<conditions.size();i++) if(!conditions[i].meetCriteria(info)) return false;
		return true;
	}
	bool addData(BlockInfo &info, std::vector<float> &values){
		if(!meetConditions(info)) {/*Serial.println(String()+"StatGroup::addData "+info.id+" conditions not met for group "+name);*/return false;}

		Serial.println(String()+"StatGroup::addData ("+statdata.sumcount+") "+info.id+" added to group "+name+" !");
		statdata.addPoint(values);		// calculate mean or avg	// calculate sum of square of deviation or error sse
		return true;
	};
	void printStatus(){
		if(statdata.sumcount==0) Serial.println(String()+"Stat group "+name+" status : no data ");
		Serial.println(String()+"Stat group "+name+" : "+title);
		statdata.print();
	}
	unsigned int getDataCount(){return statdata.sumcount;}
	std::vector<float> getAvgs(){
		//	Serial.println(String()+"StatGroup::getAvgs::Stat group "+name+" : "+title+" count:"+statdata.sumcount);
		return statdata.getAvg();
	}
	String getShort(){		//	int i0=title.lastIndexOf("(")+1,i1=title.lastIndexOf(")");//	String str=title.substring(title.lastIndexOf("(")+1,title.lastIndexOf(")"));
		return title.substring(title.lastIndexOf("(")+1,title.lastIndexOf(")"));
	}
	bool matchFilter(String filter){
		int n=tokenNumber(filter,":");
		if(n<2) return false;
		String command=getToken(filter,":",0);
		String argument=getToken(filter,":",1);
		for(unsigned i=0;i<conditions.size();i++) {
			bool b=conditions[i].matchFilter(command,argument);
			if(!b) return false;
		}
		return true;
	}
};







///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#define STATUSTABLESEP ';'
class StatComparison {	// anova test
public:
	//	StatDataUnit statdata;

	int number=-1;
	String name;
	String title;
	std::vector<StatCondition> conditions;
	std::vector<StatGroup> groups;
	std::map<String,String>*lists;

	std::vector<String> groupfilters;
	std::vector<AcrossWatcher> datawatchers;

	StatComparison(int n0, std::map<String,String>*lists0):number(n0){name=String()+ANOVAKEYWORD+n0;lists=lists0;}//Serial.println(String()+"StatComparison::constructor "+number);}
	void addCondition(String command, String arguments){

		if(command=="across") {datawatchers.push_back(AcrossWatcher(arguments));return;}

		conditions.push_back(buildCondition(command,arguments,lists));}
	bool meetConditions(BlockInfo &info){for(unsigned int i=0;i<conditions.size();i++) if(!conditions[i].meetCriteria(info)) return false;return true;}

	StatGroup *addGroup(String groupname){
		//for(unsigned int i=0;i<groups.size();i++) if(groups[i].name==name) return ;
		StatGroup *group=getGroup(groupname);
		if(group) return group;
		groups.push_back(StatGroup(groupname,lists));
		return &(groups[groups.size()-1]);
	};
	StatGroup *getGroup(String name) {
		for(unsigned int i=0;i<groups.size();i++) if(groups[i].name==name) return &(groups[i]);
		return 0;
	}


	bool addData(BlockInfo &info, std::vector<float> values){
		if(!meetConditions(info)) {/*Serial.println(String()+"StatComparison::addData "+info.id +" does not match conditions of "+name);*/ return false;}
		for(unsigned int i=0;i<datawatchers.size();i++) datawatchers[i].addData(&info);
		bool added=false;
		for(unsigned int i=0;i<groups.size();i++){
			bool b=groups[i].addData(info,values);
			if(b) {added=true;break;}		// groups are supposed to be exclusive
		}

		return added;
	}
	/*
	unsigned int countNonVoidGroups(){
		int count=0;
		for(unsigned int i=0;i<groups.size();i++) if(groups[i].getDataCount()>0) count++;
		return count;
	}
	 */

	void setGroupFilters(std::vector<String> &groupfilters1){groupfilters=groupfilters1;}
	void clearGroupFilters(){groupfilters.clear();}

	bool groupOk(StatGroup &g){
		int count=g.getDataCount();
		if(count==0) return false;
		for(String s : groupfilters) if(!g.matchFilter(s)) return false;
		return true;
	}

	int countGroupOk(){
		int gcount=0;
		for(unsigned int i=0;i<groups.size();i++) {
			int count=groups[i].getDataCount();
			if(count==0) continue;
			bool passed=true;
			for(String s : groupfilters) if(!groups[i].matchFilter(s)) {passed=false;break;}
			if(passed) gcount++;
		}
		return gcount;
	}

	String getStatusCompare(std::vector<String> &titles){return getGroupsOrderedAndCompared(titles);}


	StatDataUnit getMerged(){
		StatDataUnit merged;
		for(StatGroup g : groups) if(groupOk(g)) merged=merged.getMergedWith((g.statdata));
		return merged;
	}

	String getStatusTable(std::vector<String> &titles){

		String out=getTableHeader();
		int groupnumber=countGroupOk();
		if(groupnumber==0) return out;
		//headers
		String lastline="n";
		for(unsigned int i=0;i<groups.size();i++) {
			bool b =groupOk(groups[i]);//int count=groups[i].getDataCount();
			if(b) {
				String s=groups[i].getShort();
				out+=String()+","+s;//+i+"."+groups[i].substring(0,groups[i].lastIndexOf("("));
				lastline+=String()+","+groups[i].getDataCount();
			}
		}
		out+=String()+",All,Sign.Diff."+STATUSTABLESEP;		//		Serial.println(String()+"StatComparison::getStatusTable : 2 ");

		//for each var
		std::vector<float> sst=getGSST();
		std::vector<float> sse=getGSSE();
		StatDataUnit statdata=getMerged();
		std::vector<float> sdavgs=statdata.getAvg();		//		Serial.println(String()+"StatComparison::getStatusTable : 3 ");

		for(unsigned int i=0;i<statdata.xsum.size();i++) {			// write header
			std::vector<StatGroup*>ordered=getOrderedGroups(i);		//first we will compare the groups ordered and make significance groups
			std::map<String,String> letters;
			char initletter='a',letter=initletter;
			for(unsigned j=0;j<ordered.size();j++) {
				letters[ordered[j]->name]=letter;
				if((j+1)<ordered.size()){
					std::vector<StatDataUnit*> tomerge;
					tomerge.push_back(&(ordered[j]->statdata));
					tomerge.push_back(&(ordered[j+1]->statdata));
					bool diff=testGroups(tomerge,i);
					if(diff) letter++;
				}
			}
			String line;
			line+=String()+titles[i];
			float vf=getMerged().getF(i,groupnumber,sst[i],sse[i]);
			float tf=getTableValue(statdata.getdft(groupnumber), statdata.getdfe(groupnumber));
			bool b=vf>=tf;
			for(unsigned int j=0;j<groups.size();j++) {
				if(!groupOk(groups[j])) continue;
				std::vector<float> gavg=groups[j].getAvgs();
				line+=String()+","+gavg[i];
				if(letter>initletter && letters.find(groups[j].name)!=letters.end()) line+=letters[groups[j].name];
			}
			line+=String()+","+sdavgs[i];
			if(b) line+=String()+", YES ("+vf+">"+tf+")";
			else line+=String()+", NO ("+vf+"<"+tf+")";
			out+=line;
			if(i+1<statdata.xsum.size()) out+=STATUSTABLESEP;
		}
		out+=String()+STATUSTABLESEP+lastline+","+statdata.sumcount;		//		Serial.println(out);
		return out;
	}


	String getShortStatus(std::vector<String> &titles){
		String out;
		std::vector<float> sst=getGSST();
		std::vector<float> sse=getGSSE();
		int groupnumber=countGroupOk();
		StatDataUnit statdata=getMerged();
		out+=String()+"anova:"+title+","+statdata.sumcount;
		std::vector<float> sdavgs=statdata.getAvg();
		for(unsigned int j=0;j<sdavgs.size();j++) {out+=String()+","+sdavgs[j];}
		for(unsigned int i=0;i<statdata.xsum.size();i++) {
			float vf=statdata.getF(i,groupnumber,sst[i],sse[i]);
			float tf=getTableValue(statdata.getdft(groupnumber), statdata.getdfe(groupnumber));
			bool b=vf>=tf;
			out+=String()+";v"+i+":"+titles[i]+","+sdavgs[i]+","+b+","+vf+","+tf;
		}
		String groupnames;
		for(unsigned int i=0;i<groups.size();i++) {
			int count=groups[i].getDataCount();
			if(count>0){
				groupnames+=String()+";g"+i+":"+groups[i].title+","+count;
				std::vector<float> avgs=groups[i].getAvgs();
				for(unsigned int j=0;j<avgs.size();j++) {groupnames+=String()+","+avgs[j];}
			}
		}
		out+=groupnames;
		//		Serial.println(String()+"StatComparison::getShortStatus : end ");
		return out;
	}


	void printStatus(std::vector<String> &titles){
		Serial.println(String()+"----------------------------");
		int groupnumber=countGroupOk();
		std::vector<float> sst=getGSST();
		std::vector<float> sse=getGSSE();
		StatDataUnit statdata=getMerged();
		statdata.printExtra(groupnumber,sst,sse);
		for(unsigned int i=0;i<groups.size();i++) {
			int c=groups[i].getDataCount();
			Serial.println(String()+"StatComparison::printStatus: "+c);
			if(c>0) groups[i].printStatus();
		}
		std::vector<bool> b=testDifference();

		for(unsigned int i=0;i<statdata.xsum.size();i++) {
			if(b[i]) Serial.println(String()+"Anova test found significative difference between groups F:"+statdata.getF(i,groupnumber,sst[i],sse[i])+"(>"+getTableValue(statdata.getdft(groupnumber), statdata.getdfe(groupnumber))+") at p=0.05");
			else Serial.println(String()+"Anova test found NO significative difference between groups F:"+statdata.getF(i,groupnumber,sst[i],sse[i])+"(<"+getTableValue(statdata.getdft(groupnumber), statdata.getdfe(groupnumber))+") at p=0.05");
		}
		Serial.println(String()+"Short status : ");
		String ss=getShortStatus(titles);
		Serial.println(ss);
		Serial.println(String()+"StatComparison::printStatus : end ");
	}












private:

	String getTableHeader(){
		String out;	//csv style
		out=String()+"table:"+title+":";
		String line,exc;
		for(unsigned int i=0;i<groups.size();i++) {
			bool b =groupOk(groups[i]);//int count=groups[i].getDataCount();
			if(b) {
				if(line.length()>0) line+=" / ";
				line+=String()+groups[i].title;
			} else {
				if(exc.length()==0) exc="excluded: ";else exc+=",";
				String s=String()+groups[i].getShort()+":"+groups[i].getDataCount();
				exc+=s;
			}
		}
		out+=line+" ("+exc+")"+STATUSTABLESEP;
		return out;
	}



	std::vector<float> getGSST(){return getGSST(groups);}
	std::vector<float> getGSST(std::vector<StatGroup> groups1){		// 		Serial.println(String()+"StatClassifier::getSST "+name+" status : ");
		std::vector<StatDataUnit*> groups2;
		for(unsigned int i=0;i<groups1.size();i++)
			if(groupOk(groups1[i])) groups2.push_back(&(groups1[i].statdata));
		return calcGSST(groups2);	}
	/*	std::vector<float> getGSST(StatDataUnit &statdata1, std::vector<StatGroup*> groups1){		// 		Serial.println(String()+"StatClassifier::getSST "+name+" status : ");
		std::vector<float> sst;
		std::vector<float> globalavg=statdata1.getAvg();
		sst.resize(globalavg.size());

		for(unsigned int i=0;i<groups1.size();i++) {			//			Serial.println(String()+"StatClassifier::getSST4 i:"+i+" groups[i].getDataCount()"+groups[i].getDataCount());
			int groupcount=groups1[i]->getDataCount();
			if(groupcount==0) continue;
			std::vector<float> groupavg=groups1[i]->statdata.getAvg();
			for(unsigned int j=0;j<globalavg.size();j++) {	// 			Serial.println(String()+"StatClassifier::getSST5 j:"+j+" sst.size():"+sst.size()+" groupavg.size():"+groupavg.size());
				float diff=(groupavg[j]-globalavg[j])*(groupavg[j]-globalavg[j]);
				sst[j]+=diff*groupcount;			//	 			Serial.println(String()+"StatComparison::getGSST i:"+i+" j:"+j+" sst[j]:"+sst[j]+" groupavg[j]:"+groupavg[j]+" globalavg[j]:"+globalavg[j]+" diff:"+diff);
			}
		}
		return sst;
	}*/

	std::vector<float> getGSSE(){return getGSSE(groups);}
	std::vector<float> getGSSE(std::vector<StatGroup> groups1){
		std::vector<StatDataUnit*> groups2;
		for(unsigned int i=0;i<groups1.size();i++) if(groupOk(groups1[i])) groups2.push_back(&(groups1[i].statdata));
		return calcGSSE(groups2);	}
	/*	std::vector<float> getGSSE(StatDataUnit &statdata1, std::vector<StatGroup*> groups1){
		//		Serial.println(String()+"StatClassifier::getSSE "+name+" status : ");
		std::vector<float> sse;
		std::vector<float> globalavg=statdata1.getAvg();
		sse.resize(globalavg.size());

		for(unsigned int i=0;i<groups1.size();i++) {
			//		Serial.println(String()+"StatClassifier::getSST4 i:"+i+" groups[i].getDataCount()"+groups[i].getDataCount());
			if(groups1[i]->getDataCount()==0) continue;
			for(unsigned int j=0;j<globalavg.size();j++) {
				float groupsse=groups1[i]->statdata.getSSE(j);
				sse[j]+=groupsse;
				//			Serial.println(String()+"StatComparison::getGSSE i:"+i+" j:"+j+" sse[j]:"+sse[j]+" groupsse:"+groupsse);
			}
		}
		return sse;
	}*/



	std::vector<StatGroup*> getOrderedGroups(int k){
		Serial.println(String()+"StatComparison::getOrderedGroups : 0 ");
		std::vector<StatGroup*> ret;
		for(unsigned int i=0;i<groups.size();i++) {
			if(!groupOk(groups[i])) continue;			//if(groups[i].getDataCount()==0) continue;
			std::vector<float> iavgs=groups[i].getAvgs();
			int pos=0;
			for(unsigned int j=0;j<ret.size();j++){
				//	if(ret[j]->getDataCount()==0) continue;
				std::vector<float> javgs=ret[j]->getAvgs();
				pos=j;
				if(iavgs[k]>javgs[k]) {break;}
				pos++;
			}
			ret.insert(ret.begin()+pos, &groups[i]);
		};
		for(unsigned int i=0;i<ret.size();i++) Serial.println(String()+"StatComparison::getOrderedGroups : i:"+i+" ret[i].name:"+ret[i]->name+" avg["+k+"]:"+ret[i]->getAvgs()[k]);
		return ret;

	};
	bool testGroups(std::vector<StatDataUnit*> totest, int k){//	Serial.println(String()+"StatComparison::testGroups : 0 ");
		int groupnumber=totest.size();
		StatDataUnit merged=*totest[0];
		for(int i=1;i<groupnumber;i++) merged=merged.getMergedWith(*totest[i]);
		std::vector<float> sst=calcGSST(totest);
		std::vector<float> sse=calcGSSE(totest);
		float f=merged.getF(k, groupnumber, sst[k], sse[k]);
		float tf=getTableValue(merged.getdft(groupnumber), merged.getdfe(groupnumber));
		//		Serial.println(String()+"StatComparison::testGroups : 5 ");
		if(f>=tf && f>0) return true;
		return false;
	}

	String getGroupsOrderedAndCompared(std::vector<String> titles){//		Serial.println(String()+"StatComparison::getGroupsOrderedAndCompared : 0 ");		// order groups avgs
		String ret=getTableHeader();
		int n=ret.indexOf(":");
		int n2=ret.indexOf(":",n+1);
		if(n2>=0) ret=ret.substring(0,n2)+"(ordered) "+ret.substring(n2,ret.length());
		int groupnumber=countGroupOk();
		if(groupnumber==0) return ret;
		ret+=String()+"data,groups";
		StatDataUnit statdata=getMerged();
		for(unsigned int k=0;k<statdata.xsum.size();k++){			//			Serial.println(String()+"StatComparison::getGroupsOrderedAndCompared : 1 ");
			std::vector<StatGroup*> ordered=getOrderedGroups(k);
			if(ret.length()>0) ret+=STATUSTABLESEP;
			ret+=String()+titles[k]+",";
			for(unsigned int i=0;i<ordered.size();i++){// test each with next				//				Serial.println(String()+"StatComparison::getGroupsOrderedAndCompared : 2 ordered[i]->getAvgs().size():"+ordered[i]->getAvgs().size()+" k:"+k);
				ret+=ordered[i]->getShort()+":"+trimToPrecision(String(ordered[i]->getAvgs()[k]),1);
				if(i+1<ordered.size()){
					std::vector<StatDataUnit*> tomerge;
					tomerge.push_back(&(ordered[i]->statdata));
					tomerge.push_back(&(ordered[i+1]->statdata));
					bool b=testGroups(tomerge,k);
					// write output
					if(b) ret+=" > " ;else ret+=" >= ";
				}
			}			//			Serial.println(String()+"StatComparison::getGroupsOrderedAndCompared : 3 ");
		}
		//	Serial.println(String()+"StatComparison::getGroupsOrderedAndCompared : 4 ");
		//	Serial.println(String()+ret);
		return ret;
	}



	std::vector<bool> testDifference(){
		//		Serial.println(String()+"StatComparison::testDifference  ");
		std::vector<float> sst=getGSST();
		std::vector<float> sse=getGSSE();
		std::vector<bool> res;
		StatDataUnit statdata=getMerged();
		res.resize(statdata.xsum.size());
		int groupnumber=countGroupOk();
		//		Serial.println(String()+"StatComparison::testDifference2 groupnumber:"+groupnumber);
		for(unsigned int i=0;i<res.size();i++) {
			float f=statdata.getF(i,groupnumber,sst[i],sse[i]);
			res[i]=higherThanTable(f,statdata.getdft(groupnumber), statdata.getdfe(groupnumber));
			//			Serial.println(String()+"StatComparison::testDifference3 i:"+i+" f:"+f+" res[i]:"+res[i]+" ");
		}
		return res;
	}






#ifdef INCLUDE_DEPRECATED
	std::vector<std::vector<std::vector<bool>>> getTwoByTwoComparison(){
		//	std::vector<String> ret;https://goo.gl/maps/JhKQ1yV8Jqd9VWcTA
		Serial.println(String()+"StatComparison::getTwoByTwoComparison : start ");
		int groupnumber=2;
		char letter='a';

		std::vector<std::vector<std::vector<bool>>> ret;
		ret.resize(groups.size());

		Serial.println(String()+"StatComparison::getTwoByTwoComparison : 2 ");
		for(unsigned int i=0;i<groups.size();i++) {
			Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3 i:"+i);
			int count=groups[i].getDataCount();
			if(count>0) {
				Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.1 i:"+i);
				for(unsigned int j=i+1;j<groups.size();j++) {
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.5 i:"+i+" j:"+j);
					if(groups[j].getDataCount()==0) continue;
					StatDataUnit merged=groups[i].statdata.getMergedWith(groups[j].statdata);
					//std::vector<float> avgs=merged.getAvg();
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.51 i:"+i+" j:"+j);
					std::vector<StatGroup> ngroups;
					ngroups.push_back(groups[i]);
					ngroups.push_back(groups[j]);
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.52 i:"+i+" j:"+j+" groups[i].getAvgs()[0]:"+groups[i].getAvgs()[0]+" ngroups[0].getAvgs()[0]:"+ngroups[0].getAvgs()[0]);
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.521 i:"+i+" j:"+j+" groups[i].statdata.sumcount:"+groups[i].statdata.sumcount+" ngroups[0].statdata.sumcount:"+ngroups[0].statdata.sumcount);
					std::vector<float> sst=getGSST(merged,ngroups);
					std::vector<float> sse=getGSSE(merged,ngroups);
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.53 i:"+i+" j:"+j+" sst.size():"+sst.size()+" sse.size():"+sse.size()+" merged.xsum.size():"+merged.xsum.size());
					//					std::vector<float> javgs=groups[j].getAvgs();
					for(unsigned int k=0;k<merged.xsum.size();k++) {
						Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.6 i:"+i+" j:"+j+" k:"+k);
						float f=merged.getF(k, groupnumber, sst[k], sse[k]);
						Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.61 i:"+i+" j:"+j+" k:"+k);
						float tf=higherThanTable(f,statdata.getdft(groupnumber), statdata.getdfe(groupnumber));
						Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.62 i:"+i+" j:"+j+" k:"+k);
						Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.62 f:"+f+" tf:"+tf);
						if(f>=tf && f>0) {
							// how to encode the information
							if(ret[i].size()==0) ret[i].resize(groups.size());
							if(ret[i][j].size()==0) ret[i][j].resize(merged.xsum.size());
							if(ret[j].size()==0) ret[j].resize(groups.size());
							if(ret[j][i].size()==0) ret[j][i].resize(merged.xsum.size());

							Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.63 groups significative difference i:"+i+" j:"+j+" for var k:"+k);
							Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.63 groups significative difference ret[i].size():"+ret[i].size()+" ret[i][j].size():"+ret[i][j].size()+" for var j:"+j);
							ret[i][j][k]=true;
							ret[j][i][k]=true;
							Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.63 ret[i][j][k]:"+ret[i][j][k]+" ret[j][i][k]:"+ret[j][i][k]);
						}
					}
				}
			}
		}
		Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4 ");
		std::vector<std::vector<String>> ret2;
		ret2.resize(groups.size());
		for(unsigned int i=0;i<ret.size();i++){
			if(ret[i].size()==0) continue;
			Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4.1 i:"+i);
			std::vector<float> iavgs =groups[i].getAvgs();
			for(unsigned int j=i+1;j<ret[i].size();j++) {
				if(ret[i][j].size()==0) continue;
				Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4.1.1 j:"+j);
				std::vector<float> javgs =groups[j].getAvgs();
				for(unsigned int k=0;k<iavgs.size();k++) {
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4.1.1.1 k:"+k);
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4.1.1.1 k:"+k+" ret[i].size():"+ret[i].size()+" ret[i][j].size():"+ret[i][j].size());
					if(!ret[i][j][k]) continue;
					if(ret2[i].size()==0) ret2[i].resize(iavgs.size());
					if(ret2[j].size()==0) ret2[j].resize(javgs.size());
					if(ret2[i][k].length()==0) ret2[i][k]=iavgs[k];
					if(ret2[j][k].length()==0) ret2[j][k]=javgs[k];
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4.1.1.2 k:"+k);
					ret2[i][k]+=letter;
					ret2[j][k]+=letter;
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4.1.1.3 ret2[i][k]:"+ret2[i][k]+" ret2[j][k]:"+ret2[j][k]);
					letter++;
				}
			}
		}

		Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4.2 ");
		Serial.println("StatComparison:: ");
		for(unsigned int i=0;i<ret2.size();i++){
			//	Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4.2.1 i:"+i);
			for(unsigned int j=0;j<ret2[i].size();j++) Serial.print(String()+" '"+ret2[i][j]+"'");
			if(ret[i].size()>0) Serial.println();
		}
		Serial.println(String()+"StatComparison::getTwoByTwoComparison : 5 ");
		return ret;
	}
#endif
	/*
	std::vector<std::vector<String>> getTwoByTwoComparison2(){
		//	std::vector<String> ret;https://goo.gl/maps/JhKQ1yV8Jqd9VWcTA
		Serial.println(String()+"StatComparison::getTwoByTwoComparison : start ");
		std::vector<int> indexes;
		int groupnumber=2;
		char letter='a';

		std::vector<std::vector<String>> ret;
		ret.resize(groups.size());

		indexes.resize(groups.size());
		Serial.println(String()+"StatComparison::getTwoByTwoComparison : 2 ");

		for(int i=0;i<groups.size();i++) {
			Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3 i:"+i);

			int count=groups[i].getDataCount();
			if(count>0) {
				Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.1 i:"+i);

				std::vector<float> iavgs=groups[i].getAvgs();
				/ *				Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.1.1 i:"+i);
				if(ret[i].size()==0) ret[i].resize(avgs.size());
				for(int k;k<avgs.size();k++) {
					ret[i][k]=String()+avgs[k];
				}
				Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.1.2 i:"+i);
	 * /
				for(int j=i+1;j<groups.size();j++) {
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.5 i:"+i+" j:"+j);
					if(groups[j].getDataCount()==0) continue;
					StatDataUnit merged=groups[i].statdata.getMergedWith(groups[j].statdata);
					//std::vector<float> avgs=merged.getAvg();
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.51 i:"+i+" j:"+j);
					std::vector<StatGroup> ngroups;
					ngroups.push_back(groups[i]);
					ngroups.push_back(groups[j]);
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.52 i:"+i+" j:"+j+" groups[i].getAvgs()[0]:"+groups[i].getAvgs()[0]+" ngroups[0].getAvgs()[0]:"+ngroups[0].getAvgs()[0]);
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.521 i:"+i+" j:"+j+" groups[i].statdata.sumcount:"+groups[i].statdata.sumcount+" ngroups[0].statdata.sumcount:"+ngroups[0].statdata.sumcount);
					std::vector<float> sst=getGSST(merged,ngroups);
					std::vector<float> sse=getGSSE(merged,ngroups);
					Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.53 i:"+i+" j:"+j+" sst.size():"+sst.size()+" sse.size():"+sse.size()+" merged.xsum.size():"+merged.xsum.size());
					std::vector<float> javgs=groups[j].getAvgs();
					for(int k=0;k<merged.xsum.size();k++) {
						Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.6 i:"+i+" j:"+j+" k:"+k);
						float f=merged.getF(k, groupnumber, sst[k], sse[k]);
						Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.61 i:"+i+" j:"+j+" k:"+k);
						float tf=higherThanTable(f,statdata.getdft(groupnumber), statdata.getdfe(groupnumber));
						Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.62 i:"+i+" j:"+j+" k:"+k);
						Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.62 f:"+f+" tf:"+tf);
						if(f>=tf && f>0) {
							// how to encode the information
							if(ret[i].size()==0) ret[i].resize(statdata.xsum.size());
							if(ret[i][k].length()==0) ret[i][k]=iavgs[k];
							if(ret[j].size()==0) ret[j].resize(statdata.xsum.size());
							if(ret[j][k].length()==0) ret[j][k]=javgs[k];
							Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.63 groups significative difference i:"+i+" j:"+j+" for var k:"+k);
							ret[i][k]+=letter;
							ret[j][k]+=letter;
							Serial.println(String()+"StatComparison::getTwoByTwoComparison : 3.63 ret[i][k]:"+ret[i][k]+" ret[j][k]:"+ret[j][k]);
							letter++;
						}
					}
				}
			}
		}
		Serial.println(String()+"StatComparison::getTwoByTwoComparison : 4 ");
		Serial.println("StatComparison:: ");
		for(int i=0;i<ret.size();i++){
			for(int j=0;j<ret[i].size();j++) Serial.print(String()+" '"+ret[i][j]+"'");
			if(ret[i].size()>0) Serial.println();
		}

		return ret;
	}
	 */


};

#endif
