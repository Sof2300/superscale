/*
class StatGroupData {
    constructor();

};
*/

//////////////////////////
var knowncommands=["present", "solo","equal","notequal","greater","greaterorequal","less","lessorequal"];
class StatCondition {
    constructor(command, data,varlist){
        this.command=command;
        this.arguments=data;
        //this.text=text;
        this.varlist=varlist;
    }

    meetCriteria(data) {
        if (this.arguments === undefined) {
            console.log();
        }

        if (this.command == "solo") {
            let listo=this.varlist[this.arguments.list];
            let blacklist=listo.slice(0);
            if (this.arguments.item) this.arguments.items=[this.arguments.item];
            for(let it in this.arguments.items) {
                let i=blacklist.indexOf(this.arguments.items[it]);
                if(i>=0) blacklist.splice(i,1);
                if(!data.hasCommand(this.arguments.items[it])) return false;
            }
            for (let v in blacklist) if (data.hasCommand(blacklist[v])) return false;
            return true;
        }

        if (this.command == "present") {
            if (data.hasCommand(this.arguments.item)!==undefined) return true;
            else return false;
        }
        if (this.command == "absent") {
            if (data.hasCommand(this.arguments.item)) return false;
            else return true;
        }


        let key=Object.keys(this.arguments)[0];
        let hascommand=data.hasCommand(key),
            argfor=data.getArgumentForCommand(key);

        if (this.command == "belong") {
            if(this.arguments[key].length==1 && argfor==this.arguments[key][0]) return true;
            else if(argfor>=this.arguments[key][0] && argfor<=this.arguments[key][1]) return true;
            else return false;
        }


        if(this.command=="equal") {
            if( hascommand&& argfor==this.arguments[key]) return true;
            else return false;
        }
        if(this.command=="notequal") {
            if(hascommand && argfor==this.arguments[key]) return false;
            else return true;   //maybe should not be true if data has no such command
        }
        if(this.command=="greater") {
            if(hascommand && argfor>this.arguments[key]) return true;
            else return false;
        }
        if(this.command=="greaterorequal") {
            if(hascommand && argfor>=this.arguments[key]) return true;
            else return false;
        }
        if(this.command=="less") {
            if(hascommand && argfor<this.arguments[key]) return true;
            else return false;
        }
        if(this.command=="lessorequal") {
            if(hascommand && argfor<=this.arguments[key]) return true;
            else return false;
        }

        return true;
    }

    meetCriteria2(data){
     //   console.log(data);
 //       if(this.command=="across") return true;
        if(this.command=="present") {
            if(data.hasCommand(this.arguments[0])) return true;
            else return false;
        }
        if(this.arguments===undefined) {
            console.log();
        }
        console.log(this.arguments);
        let hascommand=data.hasCommand(this.arguments[0]),
            argfor=data.getArgumentForCommand(this.arguments[0]);
        if(this.command=="equal") {
            if( hascommand&& argfor==this.arguments[1]) return true;
            else return false;
        }
        if(this.command=="notequal") {
            if(data.hasCommand(this.arguments[0]) && data.getArgumentForCommand(this.arguments[0])==this.arguments[1]) return false;
            else return true;   //maybe should not be true if data has no such command
        }
        if(this.command=="greater") {
            if(data.hasCommand(this.arguments[0]) && data.getArgumentForCommand(this.arguments[0])>this.arguments[1]) return true;
            else return false;
        }
        if(this.command=="greaterorequal") {
            if(data.hasCommand(this.arguments[0]) && data.getArgumentForCommand(this.arguments[0])>=this.arguments[1]) return true;
            else return false;
        }
        if(this.command=="less") {
            if(data.hasCommand(this.arguments[0]) && data.getArgumentForCommand(this.arguments[0])<this.arguments[1]) return true;
            else return false;
        }
        if(this.command=="lessorequal") {
            if(data.hasCommand(this.arguments[0]) && data.getArgumentForCommand(this.arguments[0])<=this.arguments[1]) return true;
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
        if(this.arguments===undefined) {
            console.log();
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
        var map={};
        this.categories=[];
        for(let val in vallist) {
            if(typeof vallist[val]==="string") {
                  map[vallist[val]]=1;
            }
        }
        for(var m in map){
            this.categories.push(m);
        }
            // if numbers sort first
                // see if we have a near enough number 67-166,420-520
                // or see if fit in predone category 0-99,100-199,200-299

        /*      let tolerence=0;
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
        }*/
    };
}


//////////////////////////
class StatClassification {
    constructor(name, data, varlist){
        this.name=name;
        this.varlist=varlist;
        this.short=data.short;
        this.title=data.title;
        this.description=data.title+" ("+data.short+")";
        this.conditions=this.makeConditions(data.conditions);

    //    this.catpattern=[];
    }

    makeConditions(conditions){
        var newtab=[];
        for(let c in conditions) {
            let co=conditions[c]
            let ks=Object.keys(co);
            newtab.push(new StatCondition(ks[0], conditions[c][ks[0]],this.varlist));
        }
        return newtab;
    }

/*    setDescription(desc){
        this.description=desc;
        let st=desc.lastIndexOf("("), en=desc.lastIndexOf(")");
        if(st>-1 && en+1>st-1) {this.shorttitle=desc.substring(st+1,en).trim();this.description=desc.substring(0,st).trim();}
    }*/
    addParameter(line) {
        let parts=line.split(":");
        if(parts.length<2) return;
        let tag=parts[0];
        if(tag=="across") this.addStatCategoryPattern(line);
    }
    addCondition(cond){this.conditions.push(new StatCondition(cond,this.varlist));}
//    addCondition(cond){this.conditions.push(new StatCondition(cond,this.varlist));}
    addStatCategoryPattern(pattern){this.catpattern.push(new StatCategoryPattern(pattern,this.varlist));}
};

////////////////////////////////////////////////////
class   StatGroup extends StatClassification{
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
    constructor(name, data, varlist,groups){
        super(name,data, varlist);
        this.groups=this.makeGroups(data,groups);

    }
    makeGroups(data,groupdesc){
        let res={};
        for(let g in data.groups) {
            let key=data.groups[g];
            let gdesc=key, name=g;
            if(typeof key!="object") {gdesc=groupdesc[key];name=key;}
            if(!gdesc) {console.log("error group description not found "+key);continue;}    //error no group
            let ngroup=new StatGroup(name,gdesc,this.varlist);
            res[name]=ngroup;
        }
        return res;
    }
    addData(data){
        for(let c in this.conditions) if(!this.conditions[c].meetCriteria(data)) return false;
        for(let g in this.groups) {
            let b=this.groups[g].addData(data);
            if(b) break;    // do not add same data to several groups
        }
    }
    clear(){for(var g in this.groups) this.groups[g].clear();}

    removeGroup(name){
        console.log(this.groups);
        delete this.groups[name];
    }
    addHiddenGroup(group){
        if(!this.hiddenGroups) this.hiddenGroups=[];
        this.hiddenGroups.push(group);  //keep it for later use
    }

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
        obj.title=gitem.title;
        obj.shorttitle=gitem.short;
        obj.included=includedgroups[gitem.name];
        let max=0;
        for(var v in vars){
            let varname=vars[v]
            let gobj=test.getGroupData(varname);
            for(var v in gobj){
                let line=gobj[v]
                if(line.name==obj.name) {if(line.n>max) max=line.n;break;}
            }
        }
        obj.n=max;//gitem.getN();
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

function removeEmptyLines(text){
    let ntext=text, found=true;
    while(found){
        found=false;
        let beg=ntext.indexOf("\n\n");
        if(beg>0) {
            ntext=ntext.substring(0,beg)+ntext.substring(beg+1);
            found=true;
        }
    }
    return ntext;
};

function removeComments(text){
    function removeComment(text, start, stop){
        let ntext=text, found=true;
        while(found){
            found=false;
            let beg=ntext.indexOf(start);
            if(beg>0) {
                let end= ntext.indexOf(stop,beg);
                if(end<0) end=ntext.length;
                ntext=ntext.substring(0,beg)+ntext.substring(end+stop.length);
                found=true;
            }
        }
        return ntext;
    };
    text=removeComment(text,"//","\n");
    text=removeComment(text,"/*","*/");
    return text;
}


class Classifier {
    constructor() {
        this.tests = {};
        this.catdata = {}
    }

    getBlockList(testname, groupname) {
        let test = findObjWithPropInList(testname, "name", this.tests);
        if (groupname === undefined || groupname.toLowerCase() == "all") {
            return this.getAllTestBlockList(test);
        } else {
            let group = findObjWithPropInList(groupname, "name", test.groups);
            return group.list;
        }
    }

    getAllTestBlockList(test) {
        let alllist = [];
        for (let g in test.groups) alllist = alllist.concat(test.groups[g].list);
        return alllist;

    }

    getAllBlockList() {
        var blocklist = [];
        for (let t in this.tests)
            for (let g in this.tests[t].groups) {
                var glist = this.tests[t].groups[g].list, nlist = [];
                for (var ge of glist) {
                    let found = 0;
                    for (var b of blocklist) {
                        if (ge == b) {
                            found = 1;
                            break;
                        }
                    }
                    if (found) continue;
                    nlist.push(ge);
                }

                blocklist = blocklist.concat(nlist);
            }
        return blocklist;
    }

    getBlockGroups(id) {
        var groups = "";
        for (let t in this.tests) for (let g in this.tests[t].groups) if (this.tests[t].groups[g].getBlock("id", id)) {
            if (groups.length > 0) groups += ", ";
            groups += this.tests[t].short + "/" + this.tests[t].groups[g].short;
        }
        return groups;
    }

    getTestResultTable(vars) {
        var arr = [];
        for (let t in this.tests) { // for each test
            let nres = makeTestResult(vars, this.tests[t]);  // from groupdata make tests and build table
            arr.push(nres);
        }
        return arr;
    }

    updateExtraFilters(textfilter) {
        this.extrafilters = [];
        if (textfilter.length == 0) return;
        var filters = JSON.parse(textfilter);
        for (let c of filters) {
            let cname = Object.keys(c)[0];
            this.extrafilters.push(new StatCondition(cname, c[cname], this.varlist));
        }
    }

    clear() {
        for (var t in this.tests) this.tests[t].clear();
    }


    makeResult(blocklist, classifierData, vars) {
        this.parse(classifierData, blocklist);
        //      this.applyAcrosses(blocklist);
        this.classify(blocklist);
        return this.getTestResultTable(vars);
    }

    /*
        applyAcrosses(list){
            // 1. make a list of values to watch
            // 2. save values for each
            // 3. build categories

            let patterns=[],valarray={};        // make a map of category patterns
            for(var t in this.tests)
                for(var g in this.tests[t].groups){
                    let cat=this.tests[t].groups[g].catpattern;
                    for(let cp in cat)  patterns.push(cat[cp]);
                    }
            if(!Object.keys(patterns).length) return;
            for(let b in list) {    // fill the map with values of matching varname
                let block=list[b];
                for(let p in patterns){
                    let varname = patterns[p].getVarName();
                    let blockval=block.get(varname);
                    if(blockval===undefined) continue;
                    if(!valarray[varname]) valarray[varname]=[];
                    valarray[varname].push(blockval);
                }
            }
            for(let p in patterns) {
                let varname = patterns[p].getVarName();
                patterns[p].makeCategories(valarray[varname]);
            }
            var newgroups={},toremove={};
            // now we need to create new groups and remove the current
            for(var t in this.tests)
                for(var g in this.tests[t].groups){
                    let groupn=this.tests[t].groups[g];
                    let cats=groupn.catpattern;
                    for(let c in cats){
                        let cat=cats[c].categories;
                        let grouparg=cats[c].arguments;
                        let arg0=grouparg[0];
                        if(cat.length>0) {
                            if(!toremove[t]) toremove[t]=[];
                            toremove[t].push(g);
                            for(let c in cat){
                                var val=cat[c], newname=groupn.description+"-"+val;
                                var newgroup = new StatGroup(newname,this.varlist);
                                newgroup.shorttitle=groupn.shorttitle+"-"+val.substring(0,5);
                                newgroup.addCondition("equals:"+arg0+","+val);
                                newgroup.setDescription(newname);
                                for(var cond in groupn.conditions) newgroup.conditions.push(groupn.conditions[cond]);
                                if(!newgroups[t]) newgroups[t]={};
                                newgroups[t][newname]=newgroup;
                            }
                        }
                    }
                }
            for(var t in newgroups) {
                var groups=newgroups[t];
                for(var g in groups) this.tests[t].groups[g]=newgroups[t][g];
            }
            for(var t in toremove) {
                var groupnames=toremove[t];
                for(var g in groupnames) {
                    this.tests[t].addHiddenGroup(this.tests[t].groups[groupnames[g]]);
                    this.tests[t].removeGroup(groupnames[g]);
                }
            }
            console.log();
        }
    */
    classify(collection) {
        this.clear();   // erase and reclassifie entirely, do not update existing data
        for (var c in collection) {
            var item = collection[c];
            for (var t in this.tests) {
                let pass = true;
                if (this.extrafilters) for (let xf of this.extrafilters) if (!xf.meetCriteria(item)) {
                    pass = false;
                    break;
                }// test extrafilters first
                if (pass) this.tests[t].addData(item);
            }
        }
    }


    makeSteps(array, steps) {
        // for each value make an interval %steps, if it does not belong to the prev intervals
        let narray = array.slice(0);
        for (let v in narray) narray[v] = Number(narray[v]);
        narray.sort((a, b) => a - b);
        let cats = [];
        for (let d in narray) {
            let found = false, val = narray[d];
            for (let c in cats) {
                let cat = cats[c];
                let valt1 = cats[c][0];
                if (cats[c].length == 1) {
                    if (valt1 <= val && (val - valt1) <= steps) {
                        cats[c] = [cats[c][0], val];
                        found = true;
                    }
                    if (valt1 > val && (valt1 - val) <= steps) {
                        cats[c] = [val, cats[c][0]];
                        found = true;
                    }
                } else if (cats[c].length == 2) {
                    let valt2 = cats[c][1];
                    ;
                    if (val < valt1 && steps >= (valt2 - val)) {
                        cats[c] = [val, valt2];
                        found = true;
                    }
                    if (val > valt2 && steps >= (val - valt1)) {
                        cats[c] = [valt1, val];
                        found = true;
                    }
                    if (val >= valt1 && val <= valt2) found = true;
                }
                if (found) break;
            }
            if (!found) cats.push([val]);
        }
        return cats;
    }

    makeCategory(varname, list, steps) {
        let valarray = [], valtab = {};        // make a map of category patterns
        for (let b in list) {    // fill the map with values of matching varname
            let block = list[b];
            let blockval = block.get(varname);
            if (blockval === undefined) continue;              // no data is not a category
            valtab[blockval] = 1;
        }
        for (let v in valtab) valarray.push(v);

        if (steps) valarray = this.makeSteps(valarray, steps);

        return valarray;
    }

    //belong


    generateGroupDescs(dataobj, values, varname) {
        let descs = {};
        for (let v in values) {
            let val = values[v], obj = 0;
            let cond = {};
            cond[varname] = val;
            if (typeof val == "object") {
                obj = val;
                val = "[" + val + "]";
            }
            let nname = dataobj.short + "-" + val;
            let nshort = val;//dataobj.short+"-"+val;
            let ntitle = varname + " " + val;//dataobj.title+"-"+val;

            let nconditions;
            if (typeof obj == "object") nconditions = [{"belong": cond}];//            "group1":{"title":"sawdust 100%","short":"SD","conditions":[{"solo":{"list":"substratelist","item":"substrate/sawdust"}}]},
            else nconditions = [{"equal": cond}];//            "group1":{"title":"sawdust 100%","short":"SD","conditions":[{"solo":{"list":"substratelist","item":"substrate/sawdust"}}]},

            let nobj = {"title": ntitle, "short": nshort, "conditions": nconditions}
            descs[nname] = nobj;
        }
        return descs;
    }

    generateGroups(dataobj, blocklist) {
        for (let ge in dataobj["generate"]) {
            let rule = dataobj["generate"][ge];
            if (rule.across) {
                let values = this.makeCategory(rule.across, blocklist, rule.step);
                let descs = this.generateGroupDescs(dataobj, values, rule.across);

                if (!dataobj.groups) dataobj.groups = descs;
                else for (let d in descs) dataobj.groups[d] = descs[d];
            }
        }
    }

    parse(testgroups, blocklist) {
        testgroups = removeComments(testgroups);
        testgroups = removeEmptyLines(testgroups);

        testgroups = JSON.parse(testgroups);

        this.varlist = testgroups.lists;

        for (let tname in testgroups.tests) {
            let tobj = testgroups.tests[tname];
            let gen = tobj["generate"];
            if (gen) this.generateGroups(tobj, blocklist);

            let ntest = new StatTest(tname, tobj, this.varlist, testgroups.groups);
            this.tests[tname] = ntest;
        }
        return;
    }

}