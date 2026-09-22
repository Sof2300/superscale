




function stringToDate(_date,_format,_delimiter)
{ // use : stringToDate("17/9/2014","dd/MM/yyyy","/");stringToDate("9/17/2014","mm/dd/yyyy","/");stringToDate("9-17-2014","mm-dd-yyyy","-")
	var formatLowerCase=_format.toLowerCase();
	var formatItems=formatLowerCase.split(_delimiter);
	var dateItems=_date.split(_delimiter);
	var monthIndex=formatItems.indexOf("mm");
	var dayIndex=formatItems.indexOf("dd");
	var yearIndex=formatItems.indexOf("yyyy");
	var month=parseInt(dateItems[monthIndex]);
	month-=1;
	var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
	return formatedDate;
}

class BlockInfo extends StatDataSample {
    constructor(newid) {
        super(newid);
        this.calcnow = true;
    }

    static retreiveToken(objline, i) {
        if (objline.length < i + 1) return null;
        return objline[i];
    }

    static retreiveDate(objline) {return BlockInfo.retreiveToken(objline, 0);}
    static retreiveId(objline) {return BlockInfo.retreiveToken(objline, 1);}
    static retreiveCommand(objline) {return BlockInfo.retreiveToken(objline, 2);}
    static retreiveArgument(objline, argnum = 0) {return BlockInfo.retreiveToken(objline, 3 + argnum);}
    static retreiveArguments(objline) {return objline.slice(3);}
    static isSubstrate(sub) {var found=sub.indexOf(SUBSTRATEKEYWORD); return found > -1;}
    static isHarvest(sub) {var found=sub.indexOf(HARVESTKEYWORD);return found > -1;}


    static timestampFromString(stringtime) {
    	var index=stringtime.lastIndexOf("/");
    	var year=stringtime.substring(index+1);
    	year=Number(year);
    	if(isNaN(year)) return null;
		if(year>50 && year<100) year+=1900;
		if(year<50) year+=2000;
		stringtime=stringtime.substring(0,index+1)+year ;
    	return stringToDate(stringtime,"dd/mm/yyyy","/");}

    addDataLine(line) {					// here many things are done
    //	console.log(line);
        this.addHistoryLine(line);			// add line to local history
        if (this.calcnow) this.calcVars();
    };

    addHistoryLine(line) {
        this.history.unshift(line);
    }

    calcVars() {
        this.finalhistory = this.history;
        this.applyCancels();
        this.calcSubstrate();		// calculate substrate expression and total
        this.calcFlushes();			// calculate number of flushes and per flush harvest and total
        this.updateInfo(this.info);				// total BE & first flush BE
        this.calcAuto();
    }

    calcAutoFind(name,val) {
        for(var v in this.finalhistory){
            let l=this.finalhistory[v];
            let comm=BlockInfo.retreiveCommand(l), args=BlockInfo.retreiveArguments(l);
            if(comm==name && args==val) return true;
     //       if(args.length==1) args=args[0];
    //        if(comm!="harvest") this.info[comm]=args;   // skip harvest since there is several
        }
        return false;
    }

    calcAutoHas(name,val) {
        for(var v in this.finalhistory){
            let l=this.finalhistory[v];
            let comm=BlockInfo.retreiveCommand(l);
            if(comm==name ) return true;
        }
        return false;
    }
    calcAutoCopy(key,name,val) {
        this.info[key]=name;
        this.info[key+"-0"]=name.split("x")[0];
        this.info[key+"-1"]=name.split("x")[1];
        for(let k in val){
            let v=val[k];
           // this.info[k]=v;
      //      if(!this.info["substrate"]) this.info["substrate"]={};
      //      this.info["substrate"][k]=v;
        }
    }
    calcAuto(){
        if(this.info["formula"]) {this.calcAutoCopy("formula",this.info["formula"]);return;}    // maybe we should copy the matching formula if known
        for(var e in doubleautocalc){
            let content=doubleautocalc[e];
            for(let m in content.map) {
                let formulamap=content.map[m];
                let blacklist=content.list.slice(0);
                let foundall=true;
                for(let ingredientname in formulamap){
                    let ingredientval=formulamap[ingredientname];
                    let found=this.calcAutoFind(ingredientname,ingredientval);
                    if(!found) {foundall=false;break;}
                    let i=blacklist.indexOf(ingredientname);
                    if(i>=0) blacklist.splice(i,1);
                }
                if(!foundall) continue;
                foundall=false;
                for(let ingredientname in blacklist){
                    let found=this.calcAutoHas(ingredientname);
                    if(found) {foundall=true;break;}
                }
                if(!foundall) this.calcAutoCopy(e, m,formulamap);
            }
            console.log();
        }
    }


    ///// below is internal functions

    getArgumentForCommand(comm) {
        let h=this.hasCommand(comm);
        if(h) return h;
        var fh = this.finalhistory;
        for (var line in fh) {
            if (BlockInfo.retreiveCommand(fh[line]) == comm) return BlockInfo.retreiveArgument(fh[line]);	// we give back the first we find, meaning the most recent, thus applying the pattern last update override previous (except for harvest)
        }
        return undefined;
    }

    getInfo(comm){
        if(this[comm]) return this[comm];
        return this.info[comm];
    }

    getHistoryText(){
        let fulltext="";
        for(let l of this.history){
            let line="";
            for(let c of l){
                if(line.length>0) line+=" ";
                line+=c;
            }
            fulltext+=line+"\n";
        }
        return fulltext;
    }

    isMultiVal(command){
            if(configuration)// here we subsume a global variable configuration loaded from stats.html
                for(let n of configuration.multivalnames){
                    if(command.indexOf(n)>=0) return true;
                };
            return false;
    }

    updateInfo(info) {
    /*    var species=this.getArgumentForCommand("species");
        if(species) this.info.species = species;
        var date = this.getArgumentForCommand("date");
        if(date) this.info.date=date;*/
        for(var v in this.finalhistory){
            let l=this.finalhistory[v];
            let comm=BlockInfo.retreiveCommand(l), args=BlockInfo.retreiveArguments(l);
            if(args.length==1) args=args[0];
            if(this.isMultiVal(comm)) {
                if(!this.info[comm]) this.info[comm]="";
                else this.info[comm]+=", ";
                this.info[comm]+=args;      // values are concatened
            } else if(comm!="harvest") this.info[comm]=args;   // skip harvest since there is several

        }

    //    this.info.substrate = this.substratetext;
        this.info.flushes = this.flushinfos.length;
        let flushnames=["first","second","third","fourth","fifth","sixth","seventh","eighth","nineth"]
        for(let i in this.flushinfos){ let j=i;
            this.info[flushnames[j]+"flushharvest"]=this.flushinfos[i].val;
            if(this.totalsubstrate>0) this.info[flushnames[j]+"flushBE"]=100*this.flushinfos[i].val/this.totalsubstrate;
            if (info.blockdate) info[flushnames[j]+"flushdays"] = (this.flushinfos[0].ts - BlockInfo.timestampFromString(info.blockdate))/(60*60*24*1000);
        }
        this.info.totalharvest = this.totalharvest;
        if(this.totalsubstrate>0) this.info.totalBE=100*this.totalharvest/this.totalsubstrate;
    }

    applyCancels() {
        // take the history from recent to old
   //     console.log(this);
        for(let l=0; l<this.finalhistory.length;l++) {
            let line=this.finalhistory[l];
        //    console.log(line);
            let comm=BlockInfo.retreiveCommand(line), args=BlockInfo.retreiveArguments(line)[0];
            if(args===undefined) args="";
            if(comm=="cancel" && args=="all") {this.finalhistory.splice(l,this.finalhistory.length);l--;}
            else if(comm=="cancel" && (args.length==0 || args=="0")) {this.finalhistory.splice(l,2);l--;}
            else if(comm=="cancel" && (args.length!=0 && args!="0")) {
                this.finalhistory.splice(l,1);
                for(let l2=l;l2<this.finalhistory.length;l2++){
                    let line2=this.finalhistory[l2];
                    let comm2=BlockInfo.retreiveCommand(line2);
                    if(comm2==args) {this.finalhistory.splice(l2,1);break;}
                }
                l--;
            }
        }
        // for each cancel command
        // remove cancel line and
        // find next command equal to cancel argument and remove it
        // if no argument is provided, next command (previous in time) will be removed
    }

    calcSubstrate() {
        // for each line, starting from the oldest
        var substrateorder = [];
        this.substratemap = {};
        var fh = this.finalhistory;
        for (let i = fh.length; i > 0;) {
            i--;
            var comm = BlockInfo.retreiveCommand(fh[i]);
            if (!comm) continue;
            if (!BlockInfo.isSubstrate(comm)) continue;
            substrateorder.push(comm);// keep the order
            var arg = BlockInfo.retreiveArgument(fh[i]);
            if (!this.substratemap[comm]) this.substratemap[comm] = 0;
            if (isNaN(Number(arg))) continue;
            this.substratemap[comm] += Number(arg);			// sum each command in a map
        }
        this.substratetext = "";
        this.totalsubstrate = 0;
        for (let sub in substrateorder) {
            var so = substrateorder[sub];
            if (this.substratetext.length > 0) this.substratetext += ";";
            this.substratetext += so + " : " + this.substratemap[so];
            this.totalsubstrate += this.substratemap[so];
        }
    }


    calcFlushes() {
        function orderFlushes(flushes) {
            var newlist = [];
            for (let f in flushes) {
                var index = 0;               ;
                for (let nf in newlist) {
                    if (newlist[nf].ts > flushes[f].ts) {
                        var index = nf;
                        break;
                    }
                }
                newlist.splice(index, 0, flushes[f]);}
            return newlist;
        }
        function fuseFlushes(flushes) {
            function mergeFlushes(f1, f2) {
                var f3 = {val:f1.val+f2.val};
                if (f1.ts.getDate() == f2.ts.getDate()) {f3.ts = f1.ts;
                } else if (f1.ts.getDate() > f2.ts.getDate()) {f3.ts = f2.ts;f3.ts2 = f1.ts;
                } else {f3.ts = f1.ts;f3.ts2 = f2.ts;}
                return f3;
            }
           var i = 0;
           while (i +1< flushes.length) {
                var vi = flushes[i];
                var vj = flushes[i + 1]
                if (Math.abs(vj.ts - vi.ts) < MAXFLUSHDAYS*SECONDSPERDAY*1000) {    //ts is in ms
					flushes[i] = mergeFlushes(vi, vj);
                    flushes.splice(i + 1,1);
                } else i++;
           }
           return flushes;
        }

        // go through the lines and extract harvest lines
        var fh = this.finalhistory;this.flushinfos = [];
        this.totalharvest = 0;
        for (let line in fh) {
            var fl = fh[line];
            if (BlockInfo.isHarvest(fl)) {
                let val = BlockInfo.retreiveArgument(fl);
                this.flushinfos.push({ts: BlockInfo.timestampFromString(BlockInfo.retreiveDate(fl)), val: val});
                this.totalharvest += val;
            }
        }
        if(this.flushinfos.length==0) return;
        this.flushinfos = orderFlushes(this.flushinfos);// order the list by date
        this.flushinfos = fuseFlushes(this.flushinfos);// fuse the too near flushes

    }


};


class BlockCollection {
    constructor(alldata) {
        this.blocklist = {};
        for (let l in alldata) {
        	let line=alldata[l];
            var id = BlockInfo.retreiveId(line);
            if (!id) continue;
            var bi = this.blocklist[id];
            if (!bi) {
                bi = new BlockInfo(id);
                bi.calcnow=0;
                this.blocklist[id] = bi;
            }
            bi.addDataLine(line);
        }
        for(let b in this.blocklist) {this.blocklist[b].calcnow=true;this.blocklist[b].calcVars();}
    };

    getBlockInfo(fid) {
        return this.blocklist[fid];
    }

};