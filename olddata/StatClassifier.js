/*
class StatGroupData {
    constructor();

};
*/

//////////////////////////
class StatCondition {
    constructor(text,varlist){
        let asep=",";
        let parts=text.split(":");
        if(parts.length<2) return;
        this.command=parts[0];
        this.arguments=parts[1].split(asep).map(item => item.trim());
        this.text=text;
        this.varlist=varlist;
    }

    meetCriteria(data){
     //   console.log(data);
        if(this.command=="across") return true;
        if(this.command=="present") {
            if(data.hasCommand(this.arguments[0])) return true;
            else return false;
        }
        if(this.command=="solo") {
            console.log();
            if(!data.hasCommand(this.arguments[1])) return false;
            var blacklist=[], otherargs=this.arguments.slice(1), list=this.varlist[this.arguments[0]];
            for(let v in otherargs) if(!data.hasCommand(otherargs[v])) return false;
            for(let v in list) if(!otherargs.find(e => e==list[v])) blacklist.push(list[v]);    // black list of argument existing in varlist but not in condiiton
            for(let v in blacklist) if(data.hasCommand(blacklist[v])) return false;
            return true;
        }
        return true;
    }

}
//suerteomuerte castillo
// 694 846 9878
//////////////////////////

class StatCategoryPattern {
    constructor(text,varlist){
        let asep=",", parts=text.split(":");
        if(parts.length<2) return;
        this.tag=parts[0];
        this.arguments=parts[1].split(asep).map(item => item.trim());
        this.text=text;
        this.varlist=varlist;
    }
    getVarName(){return this.arguments[0];};

    makeCategories(vallist){
        // go through values
            // if not number check if we have this value already

            // if numbers sort first
                // see if we have a near enough number 67-166,420-520
                // or see if fit in predone category 0-99,100-199,200-299

        let tolerence=0;
        if(this.arguments[0]) tolerence=this.arguments[0];
        this.categories=[];
        for(let val in vallist){
            let toadd=true;
            for(let cv of this.categories) {
                if(typeof val=="number") {
                    if(val>(cv.min-tolerence) || (cv.min && val<(cv.max+tolerence))) {
                       // if()
                            toadd=false;
                        break;
                        if(toadd) this.categories.push({min:val});
                    }
                }

            }
        }
    };
}


//////////////////////////
class StatClassification {
    constructor(name,varlist){this.name=name;this.varlist=varlist;this.conditions=[];this.catpattern=[];}
    setDescription(desc){
        this.description=desc;
        let st=desc.lastIndexOf("("), en=desc.lastIndexOf(")");
        if(st>-1 && en+1>st-1) {this.shorttitle=desc.substring(st+1,en).trim();this.description=desc.substring(0,st).trim();}
    }
    addParameter(line) {
        let parts=line.split(":");
        if(parts.length<2) return;
        let tag=parts[0];
        if(tag=="across") this.addStatCategoryPattern(line);
    }
    addCondition(cond){this.conditions.push(new StatCondition(cond,this.varlist));}
    addStatCategoryPattern(pattern){this.catpattern.push(new StatCategoryPattern(pattern,this.varlist));}
};

////////////////////////////////////////////////////
class StatGroup extends StatClassification{
    addData(data){
        for(let c in this.conditions) if(!this.conditions[c].meetCriteria(data)) return false;
        if(!this.list) this.list=[];
        this.list.push(data);
        return true;
    }
    getN(){return this.list.length;}
    clear(){this.list=[];}

    getBlock(varname,value){
        for(let i in this.list) {
            let val=this.list[i].get(varname);
            //if(val==undefined) continue;
            if(val==value) return this.list[i];
        }
        return;
    }

    getGroupData(varname){
        var obj={};
        obj.name=this.name;
        obj.n2=this.list.length;
        obj.xsum=0;obj.x2sum=0;
        obj.n=0;
        for(let i in this.list) {
            let val=this.list[i].get(varname);
            if(val==undefined) continue;
            obj.xsum+=val;
            obj.x2sum+=val*val;
            obj.n++;
        }
        return obj;
    }
};

////////////////////////////////////////////////////
class StatTest extends StatClassification {
    constructor(name,varlist){super(name,varlist);this.groups=[];}
    addData(data){
        for(let c in this.conditions) if(!this.conditions[c].meetCriteria(data)) return false;
        for(let g in this.groups) {
            let b=this.groups[g].addData(data);
            if(b) break;    // do not add same data to several groups
        }
    }
    clear(){for(var g in this.groups) this.groups[g].clear();}

    getGroupData(varname){
        var newlist=[];
        for(let g in this.groups)
            if(this.groups[g].list.length>0) {
                var obj=this.groups[g].getGroupData(varname);
                if(obj.n>0) newlist.push(obj);
            };
        return newlist;
    }
 /*   getGroupByName(vars, name){
        for (let g in vars) if(this.groups[g].name==name) return this.groups[g];
    }-*/
};

////////////////////////////////////////////////////
function makeTestResult(vars, test){
    function sumGroups(groups){
        let gsumx=0,gn=0;
        for(var g in groups) {gsumx+=groups[g].xsum;gn+=groups[g].n;}
        return {sum:gsumx,n:gn};
    }

    var result={};
    result.title=test.description; // title
    result.name=test.name;
    var includedgroups={};
    for(let g in test.groups) includedgroups[test.groups[g].name]=0;
    result.data=[];

    for(var v in vars){
        let varname=vars[v], dataline=[];
        let groups=test.getGroupData(varname);    // return sumx, sumx2, and n for groups not empty and passing the filter// make a pool of non void filtered groups
        if(groups.length==0) continue;
        for(let g in groups) includedgroups[groups[g].name]=1;  // update list of used groups
        dataline.varname=varname;
        dataline.testF=AnovaOneway.calculateF(groups);
        dataline.tableF=AnovaOneway.getFtable(groups);
        dataline.signifdiff=(dataline.testF>=dataline.tableF);
        dataline.ordered=AnovaOneway.sortAndCompare(groups);
        let sumgroups=sumGroups(groups);
        dataline.average=sumgroups.sum/sumgroups.n;
        dataline.count=sumgroups.n;
        console.log();        // make an object with all the raw result
        result.data.push(dataline);
    }
    result.groups=[];
    for(var g in test.groups){
        var obj={};
        //let gitem=test.getGroupByName(vars, test.groups[g].name);
        let gitem=test.groups[g];
        obj.name=gitem.name;
        obj.title=gitem.description;
        obj.shorttitle=gitem.shorttitle;
        obj.included=includedgroups[gitem.name];
        obj.n=gitem.getN();
        result.groups.push(obj);
    }        // make a table style object       // make a comprison object
    /*

    var subt="";// subtitle
    for(let g in test.groups) if(includedgroups[test.groups[g].name]) {
        if(subt.length>0) subt+=", "
        subt+=test.groups[g].shorttitle+": "+test.groups[g].description;
    }
    subt+="(excluded:"
    for(let g in test.groups) if(!includedgroups[test.groups[g].name]) {
        if(subt.length>0) subt+=", "
        subt+=test.groups[g].shorttitle+": "+test.groups[g].n;
    }
    subt+=")";
    header.subtitle=subt;
    result.header=header;*/
    return result;
}
function findObjWithPropInList(val,propname,list){for (var i in list) if(val==list[i][propname]) return list[i];return undefined;}
////////////////////////////////////////////////////
////////////////////////////////////////////////////
class Classifier {
    constructor(){this.tests={};}

    getBlockList(testname,groupname){
        let test=findObjWithPropInList(testname,"name",this.tests);
        if(groupname===undefined || groupname.toLowerCase()=="all") {
            return this.getAllTestBlockList(test);
        } else {
            let group=findObjWithPropInList(groupname,"name",test.groups);
            return group.list;
        }
    }
    getAllTestBlockList(test){
        let alllist=[];
        for(let g in test.groups) alllist=alllist.concat( test.groups[g].list);
        return alllist;

    }
    getAllBlockList(){
        var list=[];
        for(let t in this.tests) for(let g in this.tests[t].groups) list=list.concat(this.tests[t].groups[g].list);
        return list;
    }

    getBlockGroups(id){
        var groups="";
        for(let t in this.tests) for(let g in this.tests[t].groups) if(this.tests[t].groups[g].getBlock("id",id)){
            if(groups.length>0) groups+=",";
            groups+=this.tests[t].name+"-"+this.tests[t].groups[g].shorttitle;
        }
        return groups;
    }

    getTestResultTable(vars){
        var arr=[];
        for(let t in this.tests){ // for each test
            let nres=makeTestResult(vars,this.tests[t]);  // from groupdata make tests and build table
            arr.push(nres);
        }
        return arr;
    }

    updateExtraFilters(textfilter){
        //if(!this.extrafilters)
        this.extrafilters=[];
        if(textfilter.length==0) return ;
        let subconds=textfilter.split(";")
        for(let c of subconds) this.extrafilters.push(new StatCondition(c,this.varlist));
    }

    clear(){for(var t in this.tests) this.tests[t].clear();}


    makeResult(blocklist,classifierData,vars){
        this.parse(classifierData);
        this.applyAcrosses(blocklist);
        this.classify(blocklist);
        return this.getTestResultTable(vars);
    }

    applyAcrosses(list){
        // 1. make a list of values to watch
        // 2. save values for each
        // 3. build categories

        let patterns={};        // make a map of category patterns
        for(let t in this.tests)
            for(let g in this.tests[t].groups)
                var cat=this.tests[t].groups[g].catpattern;
                for(let cp in cat) {
                    patterns[cat[cp]]=[];
                }
        if(!Object.keys(patterns).length) return;
        for(let b in list) {    // fill the map with values of matching varname
            let block=list[b];
            for(let p in patterns){
                let varname = p.getVarName();
                pattern[p].push(block.get(varname));
            }
        }

        for(let p in patterns) {
            p.makeCategories(pattern[p]);
        }
        console.log();
    }

    classify(collection){
        this.clear();   // erase and reclassifie entirely, do not update existing data
        for(var c in collection){
            var item=collection[c];
            for(var t in this.tests){
                let pass=true;
                if(this.extrafilters) for(let xf of this.extrafilters) if(!xf.meetCriteria(item)) {pass=false;break;}// test extrafilters first
                if(pass) this.tests[t].addData(item);
            }
        }
    }

    parse(testgroups){
        // all lines not starting with anova are list definitions
        // all lines starting with anova+number+: are definitions of tests
        // all lines starting with anova+number+/+group: are definition of groups
        let nl="\r\n", vsep=":", gsep="/", testkeyword="ANOVA", b=false;
        this.varlist={};
        let fo=testgroups.indexOf(testkeyword);
        if(fo>0) {
            let intro=testgroups.substring(0,fo);
            let sublines=intro.split(nl);
            for(let s in sublines){
                let parts=sublines[s].split(vsep);
                if(parts<2) continue;
                this.varlist[parts[0]]=parts[1].split(",").map(item => item.trim());
                b=true;
            }
        }
        let groupdesc=testgroups.substring(fo+testkeyword.length);
        let lines=groupdesc.split(nl+testkeyword);
        this.tests={};
        for(var l in lines) {
            var line = lines[l];
            let vs = line.indexOf(vsep);
            if (vs < 0) continue;
            b = true;
            let tname = testkeyword + line.substring(0, vs);
            if (tname.indexOf("/") > -1) tname = tname.substring(0, tname.indexOf("/"));
            if (!this.tests[tname]) this.tests[tname] = new StatTest(tname,this.varlist);
            let gs = line.indexOf(gsep);
            if (gs < 0 || gs > vs) {
                let cline = line.substring(vs + 1);
                let sublines = cline.split(nl);
                this.tests[tname].setDescription(sublines[0]);
                for (let cl = 1; cl < sublines.length; cl++) this.tests[tname].addParameter(sublines[cl]);
            } else {
                let gname = line.substring(gs + 1, vs);
                if (!this.tests[tname].groups[gname]) this.tests[tname].groups[gname] = new StatGroup(gname,this.varlist);
                let cline = line.substring(vs + 1);
                let sublines = cline.split(nl);
                this.tests[tname].groups[gname].setDescription(sublines[0]);
                for (let cl = 1; cl < sublines.length; cl++) this.tests[tname].addParameter(sublines[cl]);  // this.tests[tname].groups[gname].addCondition(sublines[cl]);

            }
        }
        return b;
    }
}

/*
findTestNames(testgroups){
    var keyword="ANOVA", seps=["/"," ",":"];
    var names=[], i=testgroups.indexOf(keyword);
    while(i>-1){
        var j0=i+keyword.length,j=j0;
        var stop=false;
        while(!stop){
            for (let s in seps) if(testgroups[j]==seps[s]) {stop=true;break;}
            j++;
        }
        let nn=testgroups.substring(i,j-1).trim(), add=true;
        for(var tn in names) if(names[tn]==nn) {add=false;break;}
        if(add) names.push(nn);
        i=testgroups.indexOf(keyword,i+1);
    }
    return names;
}
parseHeader(head){
    var subhead=head.split(":")
    if(subhead.length<2) return false;
    this.varlist={};
    var name=subhead[0].trim(), content=subhead[1];
    this.varlist[name]=content;
    return true;
};
parseTestDescription(testdesc){

    return true;
};*/