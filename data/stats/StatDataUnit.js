class StatDataSample {
    constructor(newid) {
        this.id = newid;
        this.info = {};		// contain values for each info
        this.history = [];	// contain entry lines as objects
    }
    hasCommand(comm){
        return this.info[comm];
    }
    get(key){
        if(this[key]) return this[key];
        return this.info[key];
    }
};


class AnovaOneway {

    static getGlobalAverage(groups) {
        var sum = 0, n = 0;
        for (let g in groups) {
            sum += groups[g].xsum;
            n += groups[g].n;
        }
        return sum / n;
    }

    static getGlobalN(groups) {
        var totalN = 0;
        for (let g in groups) totalN += groups[g].n;
        return totalN;
    }

    static dfe(groups) {
        return AnovaOneway.getGlobalN(groups) - groups.length;
    }

    static dft(groups) {
        return groups.length - 1;
    };

    static mSST(groups) {
        let globalavg = AnovaOneway.getGlobalAverage(groups);// global average
        var gsst = 0;
        for (let g in groups) {
            let group = groups[g];
            let groupavg = group.xsum / group.n;
            let diff = (groupavg - globalavg) * (groupavg - globalavg);
            gsst += diff * group.n;
        }
        return gsst / AnovaOneway.dft(groups);
    };

    static mSSE(groups) {
        var gsse = 0;
        for (let g in groups) {
            let group = groups[g];
            let sse = group.x2sum - group.xsum * group.xsum / group.n
            gsse += sse;
        }
        return gsse / AnovaOneway.dfe(groups);
    };

    static calculateF(groups) {  // assume groups is [{xsum:X,x2sum:Y,n:N}] and there is no empty groups
        var f = AnovaOneway.mSST(groups) / AnovaOneway.mSSE(groups);
        return f;
    };

    static significativeDifference(groups) {
        let f = AnovaOneway.calculateF(groups);
        let ft = AnovaOneway.getFtable(groups);
        return f >= ft;
    };


    static sortAndCompare(groups){
        // calculate avgs and make a sorted list
        var ordered=[];
        for(var g in groups){
            var nindex=0;
            for(;nindex<ordered.length;){
                var gavg=groups[g].xsum/groups[g].n;
                if(gavg>(ordered[nindex].xsum/ordered[nindex].n)) break;
                nindex++
            }
            ordered.splice(nindex,0,groups[g]);
        }
        var orderedres=[], number=0;
        for(let i=0;i<ordered.length;i++){
            var obj={}
            obj.name=ordered[i].name;
            obj.signifgroup=number;
            obj.average=ordered[i].xsum/ordered[i].n;
            obj.n=ordered[i].n;
            orderedres.push(obj);
            if(i+1<ordered.length){
                let ngroups=[];
                ngroups.push(ordered[i]);
                ngroups.push(ordered[i+1]);
                if(AnovaOneway.significativeDifference(ngroups)) number++;
            }
        }
        return orderedres;
        /*
        var orderedtree=[],subarray=[];
        for(let i=0;i<ordered.length;i++){
            subarray.push(ordered[i]);
            if(i+1<ordered.length){
                let ngroups=[];
                ngroups.push(ordered[i]);
                ngroups.push(ordered[i+1]);
                if(AnovaOneway.significativeDifference(ngroups)) {orderedtree.push(subarray);subarray=[];};
            } else orderedtree.push(subarray);
        }
        return orderedtree;*/
        // compare groups 2 by 2 and save the result as [[G1,G2],[G3],[G4]] meaning the groups together are not significatively different
        // this can be translated to letters or > >=
    };

    static getFtable(groups) {
        let Fdistribution=[[0,1,2,3,4,5,7,10,15,20,30,60,120,500,1000],
        [1,161.45,199.50,215.71,224.58,230.16,236.77,241.88,245.95,248.01,250.10,252.20,253.25,254.06,254.19],
        [2,18.513,19.000,19.164,19.247,19.296,19.353,19.396,19.429,19.446,19.462,19.479,19.487,19.494,19.495],
        [3,10.128,9.5522,9.2766,9.1172,9.0135,8.8867,8.7855,8.7028,8.6602,8.6165,8.5720,8.5493,8.5320,8.5292],
        [4,7.7086,6.9443,6.5915,6.3882,6.2560,6.0942,5.9644,5.8579,5.8026,5.7458,5.6877,5.6580,5.6352,5.6317],
        [5,6.6078,5.7862,5.4095,5.1922,5.0504,4.8759,4.7351,4.6187,4.5582,4.4958,4.4314,4.3985,4.3731,4.3691],
        [7,5.5914,4.7375,4.3469,4.1202,3.9715,3.7871,3.6366,3.5108,3.4445,3.3758,3.3043,3.2675,3.2388,3.2344],
        [10,4.9645,4.1028,3.7082,3.4780,3.3259,3.1354,2.9782,2.8450,2.7741,2.6996,2.6210,2.5801,2.5482,2.5430],
        [15,4.5431,3.6823,3.2874,3.0556,2.9013,2.7066,2.5437,2.4035,2.3275,2.2467,2.1601,2.1141,2.0776,2.0718],
        [20,4.3512,3.4928,3.0983,2.8660,2.7109,2.5140,2.3479,2.2032,2.1241,2.0391,1.9463,1.8962,1.8563,1.8498],
        [30,4.1709,3.3159,2.9223,2.6896,2.5336,2.3343,2.1646,2.0149,1.9317,1.8408,1.7396,1.6835,1.6376,1.6300],
        [60,4.0012,3.1505,2.7581,2.5252,2.3683,2.1666,1.9927,1.8365,1.7480,1.6492,1.5343,1.4672,1.4093,1.3994],
        [120,3.9201,30718,2.6802,2.4473,2.2898,2.0868,1.9104,1.7505,1.6587,1.5544,1.4289,1.3519,1.2804,1.2674],
        [500,3.8601,3.0137,2.6227,2.3898,2.2320,2.0278,1.8496,1.6864,1.5917,1.4820,1.3455,1.2552,1.1586,1.1378],
        [1000,3.8508,3.0047,2.6137,2.3808,2.2230,2.0187,1.8402,1.6765,1.5811,1.4705,1.3318,1.2385,1.1342,1.1096]];
        let dfwithin = AnovaOneway.dfe(groups), dfbetween = AnovaOneway.dft(groups);
        let col = 1, row = 1;
        for (let i = 1; i < Fdistribution[0].length; i++) {		//			Serial.println(String()+"StatComparison::higherThanTable0.5  i:"+i+" Fdistribution[0][i]:"+Fdistribution[0][i]);
            if (Fdistribution[0][i] > dfbetween) break;
            col = i;
        }
        for (let j = 1; j < Fdistribution.length; j++) {		//			Serial.println(String()+"StatComparison::higherThanTable0.75  j:"+j+" Fdistribution[j][0]:"+Fdistribution[j][0]);
            if (Fdistribution[j][0] > dfwithin) break;
            row = j;
        }	//		Serial.println(String()+"StatComparison::higherThanTable1  row:"+row+" col:"+col);	//		if(col==0 || row==0) return false;
        let tablef = Fdistribution[row][col];	//		Serial.println(String()+"StatComparison::higherThanTable2  f:"+f+" tablef:"+tablef+" row:"+row+" col:"+col);
        return tablef;
    };



}