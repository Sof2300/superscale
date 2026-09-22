/*
 * StatClassifier.h
 *
 *  Created on: 7 juin 2021
 *      Author: Pok
 *


	100% vs 50% sawdust		-> only SD, no other substrate in base substrate list
	100% fin
	100% peami
	100% tourikis

	SD vs Ft vs Fp vs		-> only pure substrate
	FtSD vs FpSD			-> only specific substrate all present and only them
	Pc vs Pp
	Alpha vs bran			-> specific enrichment excluding in the same list
	20% vs 30% vs 40%		-> specific amount of enrichment & specific
	5.5 vs 6 (per substrate)
	(intraspecies only, across species)


	Overall
	average/variance of data (total harvest, BE, first flush harvest, first flush BE)

	Per group
	average/variance of data (total harvest, BE, first flush harvest, first flush BE)

	How to order the data into groups ?

 */

#ifndef STATCLASSIFIER_H_
#define STATCLASSIFIER_H_
#include "StatComparison.h"

#include "../lib/datastruct/GenString.h"

/*
// 9 species -> 9 anova x 9 groups = 81 group
String samplegroupconditions=String()+
		"substratelist:substrate/sawdust, substrate/finetourikis, substrate/finepeami, substrate/strawpellet, substrate/crownbeechpellet, substrate/kostawoodchips\n" + //			// start with definition of lists
		"ANOVA1:Substrate Comparison\nacross:species\npresent:substrate/bran"+						// ANOVA+N	//across : means reproduce this anova for each values of species
		"ANOVA1/GROUP1:sawdust 100% (SD)\nsolo:substratelist,substrate/sawdust\n"+					// GROUP+N
		"ANOVA1/GROUP2:finetourikis 100% (Ft)\nsolo:substratelist,substrate/finetourikis\n"+		// solo: all present with no other from list
		"ANOVA1/GROUP3:finepeami 100% (Fp)\nsolo:substratelist,substrate/finepeami\n"+
		"ANOVA1/GROUP4:strawpellet 100% (Pp)\nsolo:substratelist,nsubstrate/strawpellet\n"+
		"ANOVA1/GROUP5:crownbeechpellet 100% (Pc)\nsolo:substratelist,nsubstrate/crownbeechpellet\n"+
		"ANOVA1/GROUP6:kostawoodchips 100% (K)\nsolo:substratelist, substrate/kostawoodchips\n"+
		"ANOVA1/GROUP7:sawdust 50% finetourikis 50% (FtSD)\nsolo:substratelist,substrate/sawdust,substrate/finetourikis\n"+
		"ANOVA1/GROUP8:sawdust 50% finetourikis 50% (FtSD)\npresent:substrate/sawdust\npresent:substrate/finetourikis\n"+			// present: on of arg keyword exist
		"ANOVA1/GROUP9:sawdust 50% finepeami 50% (FpSD)\npresent:substrate/sawdust\npresent:substrate/finepeami\n"+
		"";
 */



#define DEFINITIONFILE "/testgroups.txt"



class StatClassifier {	// a class used to parse the group description and classify blocks into groups
	std::vector<StatComparison> stattests;
	std::map<String,String> lists;		// lists contain what is parsed in the beginning of the file, the list of variables
	bool ready=false, inited=false;
	bool collectingvalues=false;
	String samplegroupconditions;
	std::vector<String> vartitles;
	std::vector<String> groupfilters;

public:
	void init(std::vector<String> vars){	// load/prepare groups, parse
		vartitles=vars;
		if(inited) return;
		samplegroupconditions=SimpleFS.readFileToString(DEFINITIONFILE);
		//	Serial.println(String()+"StatClassifier::init "+samplegroupconditions.indexOf("\r"));
		samplegroupconditions=replaceAll(samplegroupconditions,String("\r"),String(""));
		//	Serial.println(String()+"StatClassifier::init2 "+samplegroupconditions.indexOf("\r"));
		parse(samplegroupconditions);
		inited=true;
	};

	void addData(BlockInfo &info, std::vector<float> values){
		//	Serial.println(String()+"StatClassifier::addData "+inited+" "+ready);
		//if(!inited) init();
		if(!ready) return;
		addSampleData(info,values);
	}
	String getStatusTable(){
		String res;
		for(unsigned int i=0;i<stattests.size();i++) {
			if(res.length()>0) res+="\n";
			stattests[i].setGroupFilters(groupfilters);
			res+=stattests[i].getStatusTable(vartitles);
			stattests[i].clearGroupFilters();
		}
		return res;
	}
	String getStatusCompare(){
		String res;
		for(unsigned int i=0;i<stattests.size();i++) {
			if(res.length()>0) res+="\n";
			stattests[i].setGroupFilters(groupfilters);
			res+=stattests[i].getStatusCompare(vartitles);
			stattests[i].clearGroupFilters();
		}
		return res;
	}
	String getShortPrint(){
		String res;
		for(unsigned int i=0;i<stattests.size();i++) {
			if(res.length()>0) res+="\n";
			stattests[i].setGroupFilters(groupfilters);
			res+=stattests[i].getShortStatus(vartitles);
			stattests[i].clearGroupFilters();
		}
		return res;
	};
	void printResult(){
		Serial.println("StatClassifier:: print result:");
		for(unsigned int i=0;i< stattests.size();i++) {
			stattests[i].setGroupFilters(groupfilters);
			stattests[i].printStatus(vartitles);
			stattests[i].clearGroupFilters();
			Serial.println("StatClassifier:: print result: loop");
		}
		Serial.println("StatClassifier:: print result: end");
	};

	void addGroupFilter(String filter){	groupfilters.push_back(filter);}
	void setGroupFilter(String filter){	groupfilters.clear();groupfilters.push_back(filter);}
	void clearGroupFilters(){groupfilters.clear();}
private:

	void addSampleData(BlockInfo &info, std::vector<float> values){
		//		Serial.println(String()+"StatClassifier::addSampleData ");
		for(unsigned int i=0;i< stattests.size();i++) stattests[i].addData(info, values);
	}


	std::vector<String> getGroups(String groupsdef, int anovanum){
		std::vector<String> ret;
		String tofind=String()+ANOVAKEYWORD+anovanum+"/"+GROUPKEYWORD;
		int groupstart=groupsdef.indexOf(tofind);
		Serial.println(String()+"StatClassifier::getGroups tofind:"+tofind+" groupstart:"+groupstart+" anovanum:"+anovanum);
		while(groupstart>-1) {
			int groupend=groupsdef.indexOf(":",groupstart+1);
			ret.push_back(groupsdef.substring(groupstart, groupend));
			groupstart=groupsdef.indexOf(tofind,groupstart+1);
		}
		return ret;
	}




	StatGroup *getGroup(String name){
		//	Serial.println(String()+"StatClassifier::getGroup name:"+name);
		for(unsigned int i=0;i<stattests.size();i++) {
			StatGroup *p=stattests[i].getGroup(name);
			if(p) return p;
		};
		//stattests.addGroup(StatGroup(name));
		return 0;//&(stattests[stattests.size()-1]);
	}
	StatComparison *getTest(int n){
		for(unsigned int i=0;i<stattests.size();i++) if(stattests[i].number==n) return &(stattests[i]);
		stattests.push_back(StatComparison(n, &lists));
		return &(stattests[stattests.size()-1]);
	}

	void parse(String groupdefinition){		//		Serial.println(String()+"StatClassifier::parse groupdefinition:"+groupdefinition);
		int anovastart=groupdefinition.indexOf(ANOVAKEYWORD);
		//	Serial.println(String()+"StatClassifier::parse i:"+anovastart);
		if(anovastart<-1) return;	//can't start
		if(anovastart>0) {
			String intro=groupdefinition.substring(0,anovastart);
			int n=tokenNumber(intro,"\n");
			for(int j=0;j<n;j++) {
				String line=getToken(intro,String("\n"),j);
				if(line.length()>0 && line.indexOf(":")>-1) {
					String varname=getToken(line,":",0);
					String content=getToken(line,":",1);
					//					Serial.println(String()+"StatClassifier::parse vars "+varname+" : "+content);
					lists[varname]=content;
				}
			}
		}
		// get anova number & title
		int anovanum=getAnovaNumber(groupdefinition,anovastart);
		StatComparison *sc=getTest(anovanum);
		String title=getAnovaTitle(groupdefinition,anovanum);
		//		Serial.println(String()+"StatClassifier::parse "+ANOVAKEYWORD+anovanum+":"+title);
		sc->title=title;		// parse header content
		String header=getAnovaContent(groupdefinition,anovastart);
		int hn=tokenNumber(header,"\n");
		for(int hi=0;hi<hn;hi++) {
			String line=getToken(header,"\n",hi);			// create anova	// if across remember it to duplicate test and add a different condition at global level// if condition add it
			//		Serial.println(String()+"StatClassifier::parse line:'"+line+"'");
			if(line.length()==0) continue;
			String comm=getToken(line,":",0);
			String arg=getToken(line,":",1);
			//			Serial.println(String()+"StatClassifier::parse "+ANOVAKEYWORD+anovanum+" "+comm+" : "+arg);
			sc->addCondition(comm, arg);
		}
		// parse groups
		std::vector<String> groups=getGroups(groupdefinition,anovanum);
		for(String g : groups) {			//Serial.println(String()+"StatClassifier::parse group:'"+g+"'");
			StatGroup *group=sc->addGroup(g);	// create if unkown name and get a pointer to a StatGroup class anyway
			if(!group) return;			//		Serial.println(String()+"StatClassifier::parse group2:'"+g+"'");
			if(group->title.length()==0) group->title=getGroupTitle(groupdefinition, g);			//		Serial.println(String()+"StatClassifier::parse group3:'"+g+"'");
			String content=getGroupContent(groupdefinition, g);		//		Serial.println(String()+"StatClassifier::parse group4:'"+g+"'");
			int hn=tokenNumber(content, "\n");			//		Serial.println(String()+"StatClassifier::parse group5:'"+g+"'");

			for(int hi=0;hi<hn;hi++) {
				String line=getToken(content,"\n",hi);				//			Serial.println(String()+"StatClassifier::parse line:'"+line+"'");
				if(line.length()==0) continue;
				String comm=getToken(line,":",0);
				String arg=getToken(line,":",1);
				//				Serial.println(String()+"StatClassifier::parse "+g+" "+comm+" : "+arg);
				group->addCondition(comm, arg);
			}
		}		//		int nextline=groupdefinition.indexOf("\n",anovastart);
		int nextitem=groupdefinition.indexOf(ANOVAKEYWORD,anovastart);
		if(nextitem<0) nextitem=groupdefinition.length();
		//		while(nextline<nextitem)
		ready=true;
	}

	// to mitigate the memory limitation issues: compensate by taking more time
	//		- the number of block parsed is limited to n (e.g. 10) by 1 lecture of data file
	//		- for group info two options : 1 pass keep all blocks minimal data and group attribution to calculate the variances, 2 pass first keep avg per group, then calculate variances


	// for content it is the same
	// find the anova and group number -> create if necessary
	// if dynamic groups, add a test function  // if it has conditions -> goes to the anova comparison test level (and all groups)

	// then we have the test function
	// for each sample, will go through each test and each group and add it where it is relevant;
	// or we can code the data variables and the belonging as a string with "," ?, pointer vector ?
	// we could store vectors to the data (groups)



	int getAnovaNumber(String groupdefinition,int i){
		int j=groupdefinition.indexOf(ANOVAKEYWORD,i);
		j+=String(ANOVAKEYWORD).length();
		int k=groupdefinition.indexOf(":",j);
		//	Serial.println(String()+"StatClassifier::getAnovaNumber j:"+j+" i:"+i+" k:"+k+" res:"+groupdefinition.substring(j,k));
		return groupdefinition.substring(j,k).toInt();
	};
	String getAnovaTitle(String groupdefinition,int i){
		int j=groupdefinition.indexOf(ANOVAKEYWORD,i);
		int k=groupdefinition.indexOf(":",j);
		int nl=groupdefinition.indexOf("\n",k);
		return groupdefinition.substring(k+1,nl);
	};
	String getAnovaContent(String groupdefinition,int i){
		int ca=groupdefinition.indexOf(ANOVAKEYWORD,i);
		int nl=groupdefinition.indexOf("\n",ca);
		int na=groupdefinition.indexOf(ANOVAKEYWORD,nl+1);
		//	Serial.println(String()+"StatClassifier::getAnovaContent ca:"+ca+" nl:"+nl+" na:"+na+" res:"+groupdefinition.substring(nl,na));
		return groupdefinition.substring(nl,na);
	};

	String getGroupTitle(String groupdefinition, String g){
		int j=groupdefinition.indexOf(g);
		if(j<0) return "";
		int k=groupdefinition.indexOf(":",j);
		int nl=groupdefinition.indexOf("\n",k);
		return groupdefinition.substring(k+1,nl);
	};
	String getGroupContent(String groupdefinition, String g){
		int j=groupdefinition.indexOf(g);
		if(j<0) return "";
		int nl=groupdefinition.indexOf("\n",j);
		int na=groupdefinition.indexOf(ANOVAKEYWORD,nl+1);
		return groupdefinition.substring(nl,na);
	}
};




/*
String samplegroupconditions2=String()+
		"enrichmentlist:substrate/bran, substrate/alfalfa\n" +
		"ANOVA2:Enrichment Comparison\nacross:species\n"+
		"ANOVA2/GROUP1:bran any rate\nsolo:enrichmentlist,substrate/bran\n"+
		"ANOVA2/GROUP2:alfalfa any rate\nsolo:enrichmentlist,substrate/alfalfa\n"+
		"";

String samplegroupconditions3=String()+
		"enrichmentlist:substrate/bran, substrate/alfalfa\n" +
		"ANOVA4:Bran percent Comparison\nacross:species\n"+
		"ANOVA4/GROUPS: bran percent\naccording:enrichmentpercent, 5\nsolo:enrichmentlist,substrate/bran\n"+	//GROUPS generate groups // according: criteria variable, tolerance
		"";

String samplegroupconditions4=String()+
		"enrichmentlist:substrate/bran, substrate/alfalfa\n" +
		"ANOVA3:Bran percent Comparison\nacross:species\n"+
		"ANOVA3/GROUPS: alfalfa percent\naccording:enrichmentpercent, 5\nsolo:enrichmentlist,substrate/alfalfa\n"+	//GROUPS generate groups // according: criteria variable, tolerance
		"";

String samplegroupconditions5=String()+
		"ANOVA5:Total substrate Comparison\nacross:species\npresent:substrate/finetourikis\n"+
		"ANOVA5/GROUPS: total substrate \naccording:totalsubstrate, 50\nsolo:enrichmentlist,substrate/alfalfa\n"+	//GROUPS generate groups // according: criteria variable, tolerance
		"";

String samplegroupconditions6=String()+ // same as previous with other method
		"ANOVA6:Total substrate Comparison2\nacross:species\npresent:substrate/finetourikis\n"+
		"ANOVA6/GROUP1: x5.5\nequal:totalsubstrate,1495,50\n"+	//equal: variable, value, tolerance
		"ANOVA6/GROUP2: x6\nequal:totalsubstrate,1645,50\n"+	//equal: variable, value, tolerance
		"";

String samplegroupconditions6=String()+ // same as previous with other method
		"ANOVA6:Total substrate Comparison2\nacross:species\npresent:substrate/finetourikis\n"+
		"ANOVA6/GROUP1: x5.5\nequal:totalsubstrate,1495,50\n"+	//equal: variable, value, tolerance
		"ANOVA6/GROUP2: x6\nequal:totalsubstrate,1645,50\n"+	//equal: variable, value, tolerance
		"";
 */




#endif /* STATCLASSIFIER_H_ */
