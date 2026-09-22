
#ifndef STATDATAUNIT_H_
#define STATDATAUNIT_H_

#define PRECISIONTYPE double


class StatDataUnit{
public:					// SST variance in 1 pass => x1^2+ x2^2 +x3^2 +n*avg^2 - 2*avg(x1 + x2 + x3) = sum(x^2)+n*avg^2 - 2*avg*sum(x)	//https://www.thoughtco.com/example-of-an-anova-calculation-3126404
	// SSE intragroup 1 pass => sum(x^2)-sum(x)^2/n
	std::vector<PRECISIONTYPE> x2sum;
	std::vector<PRECISIONTYPE> xsum;
	unsigned int sumcount=0;

	StatDataUnit getMergedWith(StatDataUnit &sdu2){
		StatDataUnit *a=this,*b=&sdu2;//		Serial.println(String()+"StatDataUnit::getMergedWith : start xsum.size():"+xsum.size()+" x2sum.size():"+x2sum.size());
		StatDataUnit sdu;
		if(sumcount==0) {
			if(sdu2.sumcount==0) return sdu;
			StatDataUnit *c=a;
			a=b;b=c;
		}
		sdu.xsum.resize(a->xsum.size());
		sdu.x2sum.resize(a->x2sum.size());

		for(unsigned int i=0;i<a->xsum.size();i++) {
			//		Serial.println(String()+"StatDataUnit::getMergedWith : i:"+i);
			sdu.xsum[i]=a->xsum[i];
			if(i<b->xsum.size()) sdu.xsum[i]+=b->xsum[i];
			sdu.x2sum[i]=a->x2sum[i];
			if(i<b->x2sum.size()) sdu.x2sum[i]+=b->x2sum[i];
		}
		sdu.sumcount=a->sumcount+b->sumcount;
		//	Serial.println(String()+"StatDataUnit::getMergedWith : end");
		return sdu;
	}

	void addPoint(std::vector<float> &values){
#if STAT_DEBUG_LEVEL>0
		Serial.print("Adding :");
		for(int i=0;i<values.size();i++) Serial.print(String()+" "+i+":"+values[i]);
		Serial.println();
#endif
		if(xsum.size()==0) {
			xsum.resize(values.size());
			for(unsigned int i=0;i<xsum.size();i++) xsum[i]=values[i];
			x2sum.resize(values.size());
			for(unsigned int i=0;i<x2sum.size();i++) x2sum[i]=values[i]*values[i];
			sumcount=1;}
		else {
			for(unsigned int i=0;i<xsum.size();i++) {xsum[i]+=values[i]; x2sum[i]+=values[i]*values[i];}	// sum
			sumcount++;
		}// 		Serial.print("Result :");// 		for(int i=0;i<xsum.size();i++) Serial.println(String()+" "+i+":"+xsum[i]);
	}

	void print(){
		if(sumcount==0) {Serial.println(String()+"no data");return;}
		for(unsigned int i=0;i<xsum.size();i++){
			PRECISIONTYPE avg=xsum[i]/(float)sumcount;
			Serial.println(String()+"data avg:"+avg+", count:"+sumcount+" xsum:"+xsum[i]+" x2sum:"+x2sum[i]+" SSE:"+getSSE(i));
		}
	}

	void printExtra(int groupnumber, std::vector<float> sst, std::vector<float> sse) {
		Serial.println(String()+" ");
		for(unsigned int i=0;i<xsum.size();i++){
			Serial.println(String()+"global SSE:"+sse[i] +
					", global SST:"+sst[i]+
					" dfe:"+getdfe(groupnumber)+
					" dft:"+getdft(groupnumber)+
					" mSSE:"+getmSSE(sse[i],i, groupnumber)+
					" mSST:"+getmSST(i,groupnumber,sst[i])+
					" F:"+getF(i, groupnumber,sst[i],sse[i]));
		}
	}

	std::vector<float> getAvg(){
		std::vector<float> vect;	//		Serial.println(String()+"StatCondition:getAvg1 "+sumcount);
		if(sumcount==0) return vect;
		vect.resize(xsum.size());		//		Serial.println(String()+"StatCondition:getAvg2 vect.size():"+vect.size()+" xsum.size():"+xsum.size());
		for(unsigned int i=0;i<xsum.size();i++) vect[i]=xsum[i]/(float)sumcount;
		return vect;
	}

	float getSSE(int i){ float SSE=x2sum[i]-xsum[i]*xsum[i]/(float)sumcount; return SSE;}
	//	float getSST(int i, float avg){float SST=x2sum[i]+sumcount*avg*avg -xsum[i]*2*avg; return SST;}

	float getdft(int groupnumber){return groupnumber-1;}
	float getdfe(int groupnumber){return (float)(sumcount-groupnumber);}
	float getmSSE(float sse,int i, int groupnumber){ return sse/getdfe(groupnumber);}
	float getmSST(int i,int groupnumber, float sst){ return sst/getdft(groupnumber);}
	float getF(int i, int groupnumber, float sst, float sse){ if(sst==0) return 0; return getmSST(i,groupnumber,sst)/getmSSE(sse,i,groupnumber);}


};

std::vector<float> calcGSST(std::vector<StatDataUnit*> units){		// 		Serial.println(String()+"StatClassifier::getSST "+name+" status : ");
	StatDataUnit global;
	for(unsigned int i=0;i<units.size();i++) global=global.getMergedWith(*units[i]);
	std::vector<float> globalavg=global.getAvg();
	std::vector<float> sst;
	sst.resize(globalavg.size());

	for(unsigned int i=0;i<units.size();i++) {			//			Serial.println(String()+"StatClassifier::getSST4 i:"+i+" groups[i].getDataCount()"+groups[i].getDataCount());
		int groupcount=units[i]->sumcount;
		if(groupcount==0) continue;
		std::vector<float> groupavg=units[i]->getAvg();
		for(unsigned int j=0;j<globalavg.size();j++) {	// 			Serial.println(String()+"StatClassifier::getSST5 j:"+j+" sst.size():"+sst.size()+" groupavg.size():"+groupavg.size());
			float diff=(groupavg[j]-globalavg[j])*(groupavg[j]-globalavg[j]);
			sst[j]+=diff*groupcount;			//	 			Serial.println(String()+"StatComparison::getGSST i:"+i+" j:"+j+" sst[j]:"+sst[j]+" groupavg[j]:"+groupavg[j]+" globalavg[j]:"+globalavg[j]+" diff:"+diff);
		}
	}
	return sst;
}


std::vector<float> calcGSSE(std::vector<StatDataUnit*> units){			//		Serial.println(String()+"StatClassifier::getSSE "+name+" status : ");
	StatDataUnit global;
	for(unsigned int i=0;i<units.size();i++) global=global.getMergedWith(*units[i]);
	std::vector<float> globalavg=global.getAvg();
	std::vector<float> sse;
	sse.resize(globalavg.size());

	for(unsigned int i=0;i<units.size();i++) {				//		Serial.println(String()+"StatClassifier::getSST4 i:"+i+" groups[i].getDataCount()"+groups[i].getDataCount());
		if(units[i]->sumcount==0) continue;
		for(unsigned int j=0;j<globalavg.size();j++) {
			float groupsse=units[i]->getSSE(j);
			sse[j]+=groupsse;					//			Serial.println(String()+"StatComparison::getGSSE i:"+i+" j:"+j+" sse[j]:"+sse[j]+" groupsse:"+groupsse);
		}
	}
	return sse;
}






//http://www.mathandstatistics.com/wp-content/uploads/2014/07/Using-the-F-Table.jpg
#define FDISTRIBDF1COUNT 15
#define FDISTRIBDF2COUNT 15
float Fdistribution[FDISTRIBDF1COUNT][FDISTRIBDF2COUNT]={{0,1,2,3,4,5,7,10,15,20,30,60,120,500,1000},
		{1,161.45,199.50,215.71,224.58,230.16,236.77,241.88,245.95,248.01,250.10,252.20,253.25,254.06,254.19},
		{2,18.513,19.000,19.164,19.247,19.296,19.353,19.396,19.429,19.446,19.462,19.479,19.487,19.494,19.495},
		{3,10.128,9.5522,9.2766,9.1172,9.0135,8.8867,8.7855,8.7028,8.6602,8.6165,8.5720,8.5493,8.5320,8.5292},
		{4,7.7086,6.9443,6.5915,6.3882,6.2560,6.0942,5.9644,5.8579,5.8026,5.7458,5.6877,5.6580,5.6352,5.6317},
		{5,6.6078,5.7862,5.4095,5.1922,5.0504,4.8759,4.7351,4.6187,4.5582,4.4958,4.4314,4.3985,4.3731,4.3691},
		{7,5.5914,4.7375,4.3469,4.1202,3.9715,3.7871,3.6366,3.5108,3.4445,3.3758,3.3043,3.2675,3.2388,3.2344},
		{10,4.9645,4.1028,3.7082,3.4780,3.3259,3.1354,2.9782,2.8450,2.7741,2.6996,2.6210,2.5801,2.5482,2.5430},
		{15,4.5431,3.6823,3.2874,3.0556,2.9013,2.7066,2.5437,2.4035,2.3275,2.2467,2.1601,2.1141,2.0776,2.0718},
		{20,4.3512,3.4928,3.0983,2.8660,2.7109,2.5140,2.3479,2.2032,2.1241,2.0391,1.9463,1.8962,1.8563,1.8498},
		{30,4.1709,3.3159,2.9223,2.6896,2.5336,2.3343,2.1646,2.0149,1.9317,1.8408,1.7396,1.6835,1.6376,1.6300},
		{60,4.0012,3.1505,2.7581,2.5252,2.3683,2.1666,1.9927,1.8365,1.7480,1.6492,1.5343,1.4672,1.4093,1.3994},
		{120,3.9201,30718,2.6802,2.4473,2.2898,2.0868,1.9104,1.7505,1.6587,1.5544,1.4289,1.3519,1.2804,1.2674},
		{500,3.8601,3.0137,2.6227,2.3898,2.2320,2.0278,1.8496,1.6864,1.5917,1.4820,1.3455,1.2552,1.1586,1.1378},
		{1000,3.8508,3.0047,2.6137,2.3808,2.2230,2.0187,1.8402,1.6765,1.5811,1.4705,1.3318,1.2385,1.1342,1.1096}};

float getTableValue(float dfbetween, float dfwithin){	//		Serial.println(String()+"StatComparison::higherThanTable0  df1:"+df1+" df2:"+df2);
	int col=1, row=1;
	for(int i=1;i<FDISTRIBDF1COUNT;i++)	{		//			Serial.println(String()+"StatComparison::higherThanTable0.5  i:"+i+" Fdistribution[0][i]:"+Fdistribution[0][i]);
		if(Fdistribution[0][i]>dfbetween) break;
		col=i;
	}
	for(int j=1;j<FDISTRIBDF2COUNT;j++) {		//			Serial.println(String()+"StatComparison::higherThanTable0.75  j:"+j+" Fdistribution[j][0]:"+Fdistribution[j][0]);
		if(Fdistribution[j][0]>dfwithin) break;
		row=j;
	}	//		Serial.println(String()+"StatComparison::higherThanTable1  row:"+row+" col:"+col);	//		if(col==0 || row==0) return false;
	float tablef=Fdistribution[row][col];	//		Serial.println(String()+"StatComparison::higherThanTable2  f:"+f+" tablef:"+tablef+" row:"+row+" col:"+col);
	return tablef;
}

bool higherThanTable(float f, float dfbetween, float dfwithin){
	float tablef=getTableValue(dfbetween,dfwithin);
	return f>=tablef;
}


#endif
