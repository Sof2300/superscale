function getCommand(l,extra=0){
    let s=l.indexOf(","), e=l.indexOf(",",s+1);
    while(extra>0){
        s=e;
        e=l.indexOf(",",s+1);
        extra--;
    }
    return l.substring(s+1,e).trim();
}
function getArgument(l,extra=0){
    let s=l.indexOf(","), e=l.indexOf(",",s+1);
    while(extra>0){
        s=e;
        e=l.indexOf(",",s+1);
        extra--;
    }
    return l.substring(e+1).trim();
}
function applyCancels(lines,extra=0){   //reversed
    //var lines=olines.slice(),
    var removed=[];
    for(let l=0;l<lines.length;l++){
        let comm=getCommand(lines[l],extra);
        let arg=this.getArgument(lines[l],extra);
        if(comm=="cancel"){
            arg=arg.toLowerCase();
            if(arg) {  //find next martching argument to cancel
                let found=-1;
                for(let j=l+1;j<lines.length;j++) if(getCommand(lines[j],extra)==arg) {found=j;break;}
                if(found>=0) {
                    let r=lines.splice(found,1);
                    //l--;
                    removed=removed.concat(lines.splice(l,1));
                    l--;
                    removed=removed.concat(r);
                } else {
                    console.log();
                    removed=removed.concat(lines.splice(l,1));
                    l--;
                }
            } else {
                if(l+1<lines.length) {  // supposedly
                    let r=lines.splice(l+1,1);
                    //l--;
                    removed=removed.concat(lines.splice(l,1));
                    l--;
                    removed=removed.concat(r)
                } else {
                    console.log();
                }
            }
        }
    }
    return removed;
}

class ScaleUI{
    constructor(data,parentcomp){
        this.create(data,parentcomp);
    }

    create(data,parentcomp){
        this.comp=new DivItem(parentcomp);
        this.comp.setStyle("width","225");
        this.titlecomp=new SimpleText(this.comp,"scaleui_title");
        this.titlecomp.setText("Weight:");
        this.titlecomp.setStyle("fontStyle","italic");
        this.titlecomp.setStyle("margin-right","5px");

        this.valuecomp=new SimpleText(this.comp, "scaleui_value");
        this.valuecomp.setStyle("font-weight","bold");
        this.valuecomp.setStyle("font-size","120%");
        if("weight" in data["scale"]) this.valuecomp.setText(data["scale"].weight+" g");
      //  this.lncomp=new SimpleBR(this.comp, this.id2+"br");

        this.tarecomp=new Button(this.comp,"tare_button");
        this.tarecomp.setStyle("font-size","80%");
        this.tarecomp.setStyle("float","right");
        this.tarecomp.setText("Tare |");
        this.tarecomp.setCallback(this.tare);
    }

    tare(){
        console.log("tare pressed");
        disenableload("/tare",[]);
    }

    update(data){
        if("weight" in data["scale"]) {
            var weight=data["scale"]["weight"]
            if(this.valuecomp.text!=weight) this.valuecomp.setText(weight+" g");
        }
    }
};



//////////////////
class BlockInfoUI {


    constructor(data,parentcomp){
        this.names={"blockdate":"inoc.date", "blockbe":"block BE","totalharvest":"total harvest","avgspecies":"avg.","flushnumber":"flushes","totalsubstrate":"total substrate"};

        this.create(data,parentcomp);
    }
    create(data,parentcomp) {
        this.data=data;
        this.currentspecies=data["blockinfo"]["species"] || "";
     //   this.lncomp = new SimpleBR(parentcomp)

        this.comp = new DivItem(parentcomp);
        createTitle(this.comp, "Info");
      //  this.comp.setStyle("font-size","90%");

        //this.comp.setStyle("margin-left","25px");
       // this.comp.setStyle("width","400px");
      //  this.lncomp2 = new SimpleBR(this.comp);

        var tablecontent={};
        tablecontent.rows=[];
        tablecontent.styles=[];
        this.order = ["id", "species", "blockdate", "formula", "totalharvest","avgspecies", "flushnumber", "totalsubstrate","blockbe", "history"];
        this.subcomps=[];
        for (var o in this.order) {
            var key=this.order[o];
            var val=data["blockinfo"][key];
            if(key=="avgspecies") val=0;
            var titlestyle=this.getTitleStyle(key), valstyle=this.getValueStyle(key);
            var nval=""+val;
            if(nval.length>0) nval=this.getValue(key,val);
            tablecontent.styles.push( [ titlestyle, valstyle ] );
            tablecontent.rows.push( [ this.getTitle(key), nval ] );
        }
        this.table=new Table(this.comp,"blockinfo_table");
        this.table.setTableContent(tablecontent);
        this.table.setStyle("border","none");
        this.table.setStyle("font-size","100%");
        this.table.setStyle("margin-left","25px");
        const blockDateCell=this.table.cellindex[this.order.indexOf("blockdate")+1][1];
        this.setBlockDateValue(blockDateCell,data["blockinfo"]["blockdate"]);
    }

    update(data){
        this.data=data;
        this.currentspecies=data["blockinfo"]["species"] || "";
        for (var o in this.order) {
            var oi=Number(o);
            var key=this.order[oi];
            var val=""+data["blockinfo"][key];     //            var keycompo=this.table.cellindex[o][0];// table should have some rows/column access/update not too barbaric
            if(key=="species") this.currentspecies=val;
            var valcompo=this.table.cellindex[oi+1][1];  //strange it start at 1 not 0
            if(key=="blockdate") {
                this.setBlockDateValue(valcompo,val);
                continue;
            }
            if(val.length>0) val=this.getValue(key,val);
            if(val!=valcompo.text) valcompo.setText(val);
        }
     }
    updatePrices(pricetab){
        this.prices=pricetab;
        this.update(this.data);
    }
      updateFile(filedata){
         this.filedata=filedata.split("\n").map(line=>line.split(","));
         this.harvestBlocks=this.buildHarvestBlocks(this.filedata);
         this.update(this.data);
     }

    getTitle(name){
     //   var names={"blockdate":"inoc.date", "blockbe":"block BE","totalharvest":"total harvest"};
        if(name in this.names) name=this.names[name];
        return name+":";
    }

    getPriceForWeight(species,val) {
        if(!this.prices) return 0;
        return getPrice(this.prices,species,val);
    }

    setBlockDateValue(cell,blockdate) {
        const date=String(blockdate || "");
        const ageWeeks=this.getBlockAgeWeeks(date);
        const display=ageWeeks===null ? date : date+" ("+ageWeeks+" weeks)";
        if(cell.text!==display) cell.setText(display);
        if(!cell.element || cell.element.querySelector(".block-date-age")) return;

        while(cell.element.firstChild) cell.element.removeChild(cell.element.firstChild);
        cell.element.appendChild(document.createTextNode(date));
        if(ageWeeks!==null) {
            const age=document.createElement("span");
            age.className="block-date-age";
            age.style.fontWeight="normal";
            age.textContent=" ("+ageWeeks+" weeks)";
            cell.element.appendChild(age);
        }
    }

    buildHarvestBlocks(rows) {
        const eventsByBlock = new Map();
        rows.forEach(fields=>{
            if(fields.length < 4 || !fields[1]) return;
            const id=fields[1].trim();
            if(!eventsByBlock.has(id)) eventsByBlock.set(id, []);
            eventsByBlock.get(id).push({
                command:(fields[2] || "").trim().toLowerCase(),
                argument:fields.slice(3).join(",").trim()
            });
        });

        const blocks=[];
        eventsByBlock.forEach(events=>{
            const cancelled=new Set();
            const newestFirst=events.slice().reverse();
            for(let i=0;i<newestFirst.length;i++) {
                if(newestFirst[i].command !== "cancel") continue;
                const target=newestFirst[i].argument.toLowerCase();
                cancelled.add(i);
                if(target === "all") {
                    for(let older=i+1;older<newestFirst.length;older++) cancelled.add(older);
                    break;
                }
                if(target && target !== "0") {
                    for(let older=i+1;older<newestFirst.length;older++) {
                        if(!cancelled.has(older) && newestFirst[older].command === target) {
                            cancelled.add(older);
                            break;
                        }
                    }
                } else if(i+1<newestFirst.length) {
                    cancelled.add(i+1);
                }
            }

            const block={species:"",formula:"",harvest:0,substrate:0,hasSubstrate:false};
            events.forEach((event,index)=>{
                if(cancelled.has(events.length-1-index)) return;
                const value=event.argument;
                if(event.command === "species") block.species=value;
                else if(event.command === "formula") block.formula=value;
                else if(event.command === "harvest") {
                    const harvest=Number(value);
                    if(Number.isFinite(harvest)) block.harvest+=harvest;
                } else if(event.command.indexOf("substrate") >= 0) {
                    block.hasSubstrate=true;
                    block.substrate+=parseInt(value,10) || 0;
                }
            });

            if(!block.hasSubstrate && this.hasFormula(block.formula)) {
                const multiplierPattern=/x(\d+(?:\.\d+)?)/ig;
                let match,multiplier=0;
                while((match=multiplierPattern.exec(block.formula)) !== null) multiplier=Number(match[1]);
                if(multiplier>0) block.substrate=parseInt(multiplier*265,10);
            }
            if(block.harvest>1) blocks.push(block);
        });
        return blocks;
    }

    hasFormula(formula) {
        const normalized=String(formula || "").trim();
        return normalized !== "" && normalized !== "0";
    }

    extractFormulaSignature(formula) {
        const match=String(formula || "").match(/(?:^|[^a-z])([a-z]+)\s*\d*\s*x\s*(\d+(?:\.\d+)?)(?=$|[^0-9.])/i);
        if(!match) return null;
        const base=match[1].toLowerCase();
        return {
            base:base==="pp" ? "pn" : base,
            multiplier:Number(match[2])
        };
    }

    isSimilarFormula(first,second) {
        const firstSignature=this.extractFormulaSignature(first);
        const secondSignature=this.extractFormulaSignature(second);
        return firstSignature!==null &&
            secondSignature!==null &&
            firstSignature.base===secondSignature.base &&
            firstSignature.multiplier===secondSignature.multiplier;
    }

    getAverageInfo(blocks) {
        if(blocks.length===0) return {count:0,harvest:0,price:0,be:0};
        let harvest=0,price=0,be=0;
        blocks.forEach(block=>{
            harvest+=block.harvest;
            price+=this.getPriceForWeight(block.species,block.harvest);
            be+=100*block.harvest/block.substrate;
        });
        return {
            count:blocks.length,
            harvest:harvest/blocks.length,
            price:price/blocks.length,
            be:be/blocks.length
        };
    }

    formatAverage(label,blocks,includeBE) {
        const average=this.getAverageInfo(blocks);
        if(average.count===0) return includeBE ? label+" x0: no data" : label+": x0, no data";
        if(includeBE) {
            return label+" x"+average.count+": "+average.harvest.toFixed(0)+"g ("+average.price.toFixed(2)+"€) - "+average.be.toFixed(0)+"% BE";
        }
        let result=label+": x"+average.count+", "+average.harvest.toFixed(0)+"g ("+average.price.toFixed(2)+"€)";
        return result;
    }

    getBlockAgeWeeks(blockdate) {
        const match=String(blockdate || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
        if(!match) return null;
        const day=Number(match[1]), month=Number(match[2]);
        let year=Number(match[3]);
        if(match[3].length===2) year=year>50 ? 1900+year : 2000+year;
        const blockDate=Date.UTC(year,month-1,day);
        const parsedDate=new Date(blockDate);
        if(parsedDate.getUTCFullYear()!==year || parsedDate.getUTCMonth()!==month-1 || parsedDate.getUTCDate()!==day) return null;
        const now=new Date();
        const today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
        return ((today-blockDate)/(7*24*60*60*1000)).toFixed(1);
    }

    getValue(name, val){
        if(name=="avgspecies"){
            const blockinfo=this.data && this.data.blockinfo || {};
            const species=String(blockinfo.species || "");
            const formula=String(blockinfo.formula || "").trim();
            const substrate=Number(blockinfo.totalsubstrate);
            const blocks=this.harvestBlocks || [];
            const sameSpecies=blocks.filter(block=>block.species===species);
            const lines=[
                this.formatAverage("All species",blocks,false),
                this.formatAverage(species || "Same species",sameSpecies,false)
            ];

            const hasSubstrate=Number.isFinite(substrate) && substrate>0;
            if(hasSubstrate) {
                const sameSubstrate=blocks.filter(block=>
                    block.species===species &&
                    this.hasFormula(block.formula) &&
                    block.substrate===substrate
                );
                lines.push(this.formatAverage(species+" /"+substrate,sameSubstrate,true));
                if(this.hasFormula(formula)) {
                    const similarRecipe=sameSubstrate.filter(block=>this.isSimilarFormula(formula,block.formula));
                    lines.push(this.formatAverage(species+" ~"+formula,similarRecipe,true));
                }
            }
            return lines.join("\n");
        }
        if(name=="totalharvest") {
        if(!this.filedata) val+=" g";
        else {
//            let avg=this.getAverage(this.currentspecies);
//            val+="g / "+this.getPriceForWeight(this.currentspecies,val).toFixed(2)+"€ \n(avg: "+avg.toFixed(0)+"g/"+this.getPriceForWeight(this.currentspecies,avg).toFixed(2)+"€)";
              val+="g ("+this.getPriceForWeight(this.currentspecies,val).toFixed(2)+"€)";
        }
        }
        if(name=="blockbe") val+=" %";
        if(name=="totalsubstrate") val+=" g";
        if(name=="history") val=this.improveHistory(val)
        return val;
    }

    improveHistory(value){
        var lines=String(value || "").split(/\r?\n/).filter(line=>line.trim()!=="");

        for(let l in lines){
            let s=lines[l].indexOf(","), e=lines[l].indexOf(",",s+1);
            lines[l]=lines[l].substring(0,s)+lines[l].substring(e);
        }
        lines.reverse();////reverse order
        var removed=applyCancels(lines);
        if(removed.length>0) lines=lines.concat(["cancelled:"]).concat(removed);
        value=lines.join("\n");
        value=value.replaceAll(","," ");    //replace , by space
        return value;
    }





    getTitleStyle(name){
        var titlestyle={"font-size":"75%","text-align":"right","vertical-align": "top"};
        return titlestyle;
    }
    getValueStyle(name){
        var valstyle={"font-weight":"bold"};
        if(name=="id") valstyle["font-size"]="150%";
        if(name=="species") valstyle["font-size"]="150%";
        if(name=="blockdate") valstyle["font-size"]="110%";
        if(name=="formula") valstyle["font-size"]="90%";
        if(name=="totalharvest") valstyle["font-size"]="120%";
        if(name=="avgspecies") {valstyle["font-size"]="85%";valstyle["font-weight"]="normal";valstyle["white-space"]="pre-line";}
        if(name=="blockbe") valstyle["font-size"]="90%";
        if(name=="totalsubstrate") valstyle["font-size"]="80%";
        if(name=="history") {valstyle["font-size"]="80%";delete valstyle["font-weight"];}
        return valstyle;
    }

    createEntry(name,value){
        var names=this.names;//{"blockdate":"inoc.date", "blockbe":"block BE","totalharvest":"total harvest","avgspecies":"Avg. strain","flushnumber":"Flushes","totalsubstrate":"total substrate"};

        var subcomp=new ComponentNode(this.comp);
        subcomp.titlecomp=new SimpleText(this.comp,"blockinfoui_title_"+name);

        subcomp.titlecomp.setStyle("fontStyle","italic");
        subcomp.titlecomp.setStyle("margin-right","5px");
        subcomp.titlecomp.setStyle("font-size","75%");
        if(name=="history") subcomp.lncomp2=new SimpleBR(this.comp);
        subcomp.valuecomp=new SimpleText(this.comp, "blockinfoui_value_"+name);
        if(value !==undefined) {
            if(name=="blockbe" && value[value.length-1]!="%") value+="%"
            subcomp.valuecomp.setText(value);
        }
        if(name=="id") subcomp.valuecomp.setStyle("font-size","120%");
        if(name=="history") {
            subcomp.valuecomp.setStyle("font-size","60%");
            subcomp.valuecomp.setStyle("margin-left","25px");
            subcomp.valuecomp.setStyle("vertical-align","top");
        }
        else {
            subcomp.valuecomp.setStyle("font-weight","bold");
            subcomp.valuecomp.setStyle("margin-left","5px");
        //    subcomp.valuecomp.setStyle("float","right");

        }

        if(name!="id" && name!="species" && name!="blockdate" && name!=history) subcomp.valuecomp.setStyle("font-size","80%");

        var nname=name;
        if(nname in names) nname=names[nname];
        subcomp.titlecomp.setText(nname+":");

        subcomp.lncomp=new SimpleBR(this.comp);
    }
};










function makeRequest(target, fieldnames, elemids){
    var args={},textargs="";
    for(var k in elemids){
        var val=geid(elemids[k]).value;
        var keyname=fieldnames[k];
        if(!textargs) textargs="?"; else textargs+="&";
        textargs+=keyname+"="+val;
    }
   return target+ textargs;
};




/////////////
class WifiUI{
    constructor(data,parentcomp){
        this.create(data,parentcomp);
    }

    create(data,parentcomp) {
        this.lncomp = new SimpleBR(parentcomp);
        this.lncomp2 = new SimpleBR(parentcomp);
        this.paragraphtitle=createTitle(parentcomp, "Wifi");
        this.paragraphtitle.setStyle("font-size","80%");
        this.comp = new DivItem(parentcomp);
        this.comp.setStyle("margin-left","25px");
        this.comp.setStyle("font-size","70%");

        this.fields=[];this.fieldids=[];this.fieldnames=[];
        this.createEntry(this.fields, data, "mode");
        this.createField(this.fields, this.fieldids, data, "ssid");
        this.createField(this.fields, this.fieldids, data, "password");
        this.createField(this.fields, this.fieldids, data, "mdns");

        this.switchcomp=new Button(this.comp,"switch_button");
        this.switchcomp.id="switch_button";
        //this.tarecomp.setStyle("margin-left","125px");
        //   this.switchcomp.setStyle("float","right");
        this.switchcomp.setText("Switch mode");
        this.switchcomp.setCallback(this.switchWifi.bind(this));
        this.lncomp3= new SimpleBR(this.comp);
        this.createEntry(this.fields, data, "boottime");
        this.data=data;
    }

    switchWifi(){
        console.log("switchWifi pressed");
        let target="/switchToAP";
        let names=this.fieldnames.slice();
        if(this.data.config.mode=="AP") target="/switchToStation";
        else for(let i=0;i>names.size;i++) if(names[i]=="ssid" || names[i]=="password") names[i]="ap"+names[i]
        var req=makeRequest(target,this.fieldnames, this.fieldids);
        disenableload(req,this.fieldids.concat([this.switchcomp.id]));
    }

    update(data){
        for(var f in this.fields){
            var val=data["config"][this.fields[f].name];
    //        console.log("WifiUI::update:"+this.fields[f].valuecomp.getCurrentValue());
            if(val!==undefined  && val!=this.fields[f].valuecomp.text)
                if(!(this.fields[f].valuecomp.isUserModified)) this.fields[f].valuecomp.setText(val);
                else if(!(this.fields[f].valuecomp.isUserModified()) || val!=this.fields[f].valuecomp.remotevalue) this.fields[f].valuecomp.setText(val);
        }
        this.data=data;
    }

    createEntry(fds, data, name){
        var names={"boottime":"Boot Time"};
        var subcomp=new ComponentNode(this.comp);
        subcomp.titlecomp=new SimpleText(this.comp,"WifiUI_"+name+"_title");
        subcomp.name=name;
        var nname=name;if(nname in names) nname=names[nname];
        nname=nname[0].toUpperCase()+nname.substr(1);
        subcomp.titlecomp.setText(nname+":");
        subcomp.titlecomp.setStyle("fontStyle","italic");
        subcomp.titlecomp.setStyle("margin-right","5px");

        subcomp.valuecomp=new SimpleText(this.comp, "WifiUI_"+name+"_value");

        subcomp.valuecomp.setStyle("font-weight","bold");
        if(name in data["config"]) {
            subcomp.valuecomp.setText(data["config"][name]);
        }
        subcomp.lncomp=new SimpleBR(this.comp);
        fds.push(subcomp);
    }

    createField(fds,fieldids, data, name){
        this.fieldnames.push(name);
        var subcomp=new ComponentNode(this.comp);
        subcomp.titlecomp=new SimpleText(this.comp,"WifiUI_"+name+"_title");
        subcomp.name=name;
        var nname=name;
        nname=nname[0].toUpperCase()+nname.substr(1);
        subcomp.titlecomp.setText(nname);
        subcomp.titlecomp.setStyle("fontStyle","italic");
        subcomp.titlecomp.setStyle("margin-right","5px");
        //subcomp.titlecomp.setStyle("margin-left","15px");

        subcomp.valuecomp=new Input(subcomp, "WifiUI_"+name);
        fieldids.push("WifiUI_"+name);
        var value=data["config"][name];
        subcomp.valuecomp.setText(value);
        subcomp.valuecomp.setStyle("margin-right","15px");
        subcomp.valuecomp.updateSize();



        fds.push(subcomp);
    }


};




/////////////
class DiskUI{
    constructor(data,parentcomp){
        this.create(data,parentcomp);
    }

    create(data,parentcomp) {
  //      this.lncomp = new SimpleBR(parentcomp);
  //      this.lncomp2 = new SimpleBR(parentcomp);
   //     this.paragraphtitle=createTitle(parentcomp, "Disk");
   //     this.paragraphtitle.setStyle("font-size","80%");
        this.comp = new DivItem(parentcomp);
        this.comp.setStyle("margin-left","25px");
        this.comp.setStyle("font-size","70%");

        this.fields=[];this.fieldids=[];this.fieldnames=[];
        this.createEntry(this.fields, data, "free-space");
   //     this.createEntry(this.fields, data, "mode");

    }


    update(data){

        for(var f in this.fields){
            var val=data["configstate"][this.fields[f].name];
            //        console.log("WifiUI::update:"+this.fields[f].valuecomp.getCurrentValue());
            if(val!==undefined  && val!=this.fields[f].valuecomp.text){
                    this.fields[f].valuecomp.setText(this.getValue(val));
                }
            }

    }

    getValue(val){
        var fspace=val;
        var percent=Number(fspace)*100/(3*1024*1024);
        if(percent<1) percent=Math.ceil(percent*100)/100;
        else percent=Math.ceil(percent);
        if(Number(fspace)>1024*10) fspace=Math.ceil(fspace/1024)+" kb";
        else fspace+=" bytes";
        var freespace=(fspace+" ("+percent+"%)");
        var LOWDISKSPACE=100000;
        var LIMITDISKSPACE=100;
        if(Number(val)<LIMITDISKSPACE) freespace+="- not enough disk space !";
        else if(Number(val)<LOWDISKSPACE) freespace+="- disk space is running low";
        return freespace;
    }

    createEntry(fds, data, name){
        var names={"boottime":"Boot Time", "free-space":"Free space"};
        var subcomp=new ComponentNode(this.comp);
        subcomp.titlecomp=new SimpleText(this.comp,"WifiUI_"+name+"_title");
        subcomp.name=name;
        var nname=name;if(nname in names) nname=names[nname];
        nname=nname[0].toUpperCase()+nname.substr(1);
        subcomp.titlecomp.setText(nname+":");
        subcomp.titlecomp.setStyle("fontStyle","italic");
        subcomp.titlecomp.setStyle("margin-right","5px");

        subcomp.valuecomp=new SimpleText(this.comp, "WifiUI_"+name+"_value");

        subcomp.valuecomp.setStyle("font-weight","bold");
        if(name in data["configstate"]) {
            var fspace=data["configstate"][name];

            subcomp.valuecomp.setText( this.getValue(fspace));
        }
        subcomp.lncomp=new SimpleBR(this.comp);
        fds.push(subcomp);
    }

    createField(fds,fieldids, data, name){
        this.fieldnames.push(name);
        var subcomp=new ComponentNode(this.comp);
        subcomp.titlecomp=new SimpleText(this.comp,"WifiUI_"+name+"_title");
        subcomp.name=name;
        var nname=name;
        nname=nname[0].toUpperCase()+nname.substr(1);
        subcomp.titlecomp.setText(nname);
        subcomp.titlecomp.setStyle("fontStyle","italic");
        subcomp.titlecomp.setStyle("margin-right","5px");
        //subcomp.titlecomp.setStyle("margin-left","15px");

        subcomp.valuecomp=new Input(subcomp, "WifiUI_"+name);
        fieldids.push("WifiUI_"+name);
        var value=data["config"][name];
        subcomp.valuecomp.setText(value);
        subcomp.valuecomp.setStyle("margin-right","15px");
        subcomp.valuecomp.updateSize();



        fds.push(subcomp);
    }


};







function getPrice(prices, species, qty){
    /*  this.prices=[
          {
              "title":"Gray/Elm Oyster",
              "price":10.0,
              "names":["POm","HU"]
          },{
              "title":"King/Golden/Pink Oyster",
              "price":12.9,
              "names":["PTc","PEtun19","PCg","PCk","PSg"]
          },{
              "title":"Shiitake/Hericium",
              "price":15.9,
              "names":["LEm","HEg", "AAli"]
          }
      ];*/
    if(prices.length==0) return 0;
    let found=false, min=-1;
    for(let product of prices){
        if(min<0 || min>product.price) min=product.price;
        if(product.names.indexOf(species)<0) continue;
        found=product;
    }
    let fprice=0;
    if(found) fprice= found.price*qty/1000;
    else if(min>=0) fprice=min*qty/1000;
    else fprice=0;
    return fprice;
}


class ChronoStatUI{
    constructor(parentcomp,data){
        this.paragraphtitle=createTitle(parentcomp, "Per day");
        this.paragraphtitle.setStyle("font-size","80%");
        this.paragraphtitle.setStyle("font-weight","normal");
        this.paragraphtitle.setStyle("margin-left","5px");
        this.comp=new DivItem(parentcomp,"chronostatui");
     //   <textarea id="tarea" readOnly rows=10 style = "margin:5px;width:100%;white-space: pre;font-size:70%" >
      //  this.comp.setText("hello");
        this.comp.setStyle("margin","5px");
        this.comp.setStyle("font-size","70%");
        this.prices=[];
    /*    let chrono=this;
        this.data=data;
        loadRemote("prices.json",function(){
            chrono.prices=JSON.parse(this.responseText);
            chrono.update(chrono.data);

        });*/
    }
    createTextComp(){
        this.textcomp=new SimpleText(this.comp,"chronotext", "");
        this.textcomp.setTag("textarea");
        this.textcomp.setAttribute("readOnly","1");
        this.textcomp.setAttribute("rows","15");
        this.textcomp.setAttribute("wrap","hard");
    //    this.textcomp.setAttribute("cols","80");
        this.textcomp.setStyle("width","100%");
        this.paragraphtitle.setStyle("color","black");

    }

    update(data){
        if(data==undefined) return;
        this.data=data;
  //      console.log(this.dataobj);
        // var removed=
        let splitted=this.data.split("\n");
        splitted.reverse();
        applyCancels(splitted,1);
        //   if(removed.length>0) lines=lines.concat(["\ncancelled:"]).concat(removed);

        this.dataobj=this.parse(splitted.join("\n"));
        this.makeChronoData(this.dataobj);
        let text=this.getStringDetail();
  //      this.comp.removeAllChildren();
        if(!this.textcomp) this.createTextComp();
        let overall=this.getOverallString();
        //this.textcomp.setText(" >> "+overall+" << \n"+text);
        this.textcomp.setText(text);
        this.paragraphtitle.setText(overall);
        this.paragraphtitle.element.innerHTML=overall;

    }



    getStringDetail(){
        let ttext="", firstloop=true;
       // let limit=3;
        this.perdayarray=[];

        for(let d in this.chronodata){
            if(!firstloop) ttext+="\n";
            else firstloop=false;
            let tab=this.chronodata[d];
            let datetext=d+" - ", ctext="", first=true, lsum=0, lprice=0;
            let speciestable={};
            for(let k in tab){
                if(first) first=0; else ctext+=";- ";
                let pr=getPrice(this.prices,k,tab[k].sum);
                ctext+=k+": "+tab[k].sum+"g = "+pr.toFixed(2)+"€ [";//("+tab[k].count+") :
                let key=k.substring(0,2);
                if(k=="other") key=k;

                if(speciestable[key]==undefined) speciestable[key]={sum:0,price:0};
                speciestable[key].sum+=tab[k].sum;
                speciestable[key].price+=pr;

                let f2=1;
                for(let id in tab[k].ids)  {
                    if(f2) f2=0 ; else ctext+=", ";
                    ctext+=id;
                }
                ctext+="]";
                lsum+=tab[k].sum;
                lprice+=pr;
            }
            let extratext= "";
            for(let s in speciestable) {
                if(extratext.length>0) extratext+="| ";
                extratext+=s+":"+speciestable[s].sum+"g"+"/"+speciestable[s].price.toFixed(2)+"€";
            }
            ttext+="- " +datetext+lsum+"g = "+lprice.toFixed(2)+"€ ("+extratext+")";//"#{-"+ctext+"}";
            this.perdayarray[d]=[lsum,lprice];
        //    limit--;
        //    if(limit==0) break;

        }
        ttext=ttext.split("\n").join("\n\n");   // reverse order
        ttext=ttext.replace(/#/g,"\n");
        this.makeOverallString();
        return ttext;
    }
    makeOverallString(){
        this.overall="";
        const millisecondsPerDay=24*60*60*1000;
        const datedHarvests=[];
        for(let k in this.perdayarray) {
            const parts=k.split("/").map(Number);
            if(parts.length!==3 || parts.some(part=>!Number.isInteger(part))) continue;
            let [day,month,year]=parts;
            if(year<100) year+=year>50 ? 1900 : 2000;
            const date=new Date(Date.UTC(year,month-1,day));
            if(date.getUTCFullYear()!==year || date.getUTCMonth()!==month-1 || date.getUTCDate()!==day) continue;
            datedHarvests.push({
                dateNumber:Math.floor(date.getTime()/millisecondsPerDay),
                key:k
            });
        }
        const latestDate=datedHarvests.reduce((latest,entry)=>Math.max(latest,entry.dateNumber),-Infinity);
        const weekStart=latestDate-6, monthStart=latestDate-29;
        let weekWeight=0, weekMoney=0, monthWeight=0, monthMoney=0;

        for(const entry of datedHarvests) {
            if(entry.dateNumber<monthStart || entry.dateNumber>latestDate) continue;
            const [weight,money]=this.perdayarray[entry.key];
            monthWeight+=weight;
            monthMoney+=money;
            if(entry.dateNumber>=weekStart) {
                weekWeight+=weight;
                weekMoney+=money;
            }
        }

        this.overallstring=
            "<strong>"+(weekWeight/7/1000).toFixed(1)+"kg</strong> avg per day ("+(weekMoney/7).toFixed(2)+"€), "+
            "over <strong>"+(weekWeight/1000).toFixed(1)+"kg</strong> last 7 days ("+weekMoney.toFixed(2)+"€). "+
            "<strong>"+(monthWeight/1000).toFixed(1)+"kg</strong> last 30 days ("+monthMoney.toFixed(2)+"€)";
    }
    getOverallString(){return  this.overallstring;}

    getForId(sid, scommand, dataobj) {
        for (let i = dataobj.length - 1; i >= 0; i--) {
            let line = dataobj[i];
            let date = line[0], id = line[1], command = line[2], argument = line[3];
            if (sid == id && scommand == command) return argument;
        }
    }
    makeChronoData(data){

        this.chronodata={};

        for(let line of data){
            let date=line[0], id=line[1], command=line[2],argument=line[3];
            if(command=="harvest"){
                if(!(date in this.chronodata)) this.chronodata[date]={};
                let species=this.getForId(id,"species",data);
                if(!species) species="other";
                if(this.chronodata[date][species]===undefined) this.chronodata[date][species]={count:0, sum:0, ids:{}};
                this.chronodata[date][species].sum+=Number(argument);
                if(!(id in this.chronodata[date][species].ids)){
                    this.chronodata[date][species].ids[id]=1;
                    this.chronodata[date][species].count++;
                }
            }
        }
    }

    parse(data){
     //   console.log(data);
        var lines=data.split("\n"), obj=[];
        for(var line of lines) {
            obj.push(line.split(","));
        }
        return obj;
    }
}


class HarvestGraphUI{
    constructor(parentcomp){
        this.comp=new DivItem(parentcomp,"harvestgraphui");
        this.comp.setStyle("margin","5px");
        this.comp.setStyle("width","100%");
        this.comp.setStyle("max-width","100%");
        this.comp.setStyle("overflow","hidden");
        this.graph=null;
        // Read from config.json, default to 1
        this.dayGranularity=(typeof appConfig !== 'undefined' && appConfig.graphdays) ? appConfig.graphdays : 1;
        this.currentData=null;
        // Read start/end dates from config.json
        this.startDate=(typeof appConfig !== 'undefined' && appConfig.graphstart) ? appConfig.graphstart : null;
        this.endDate=(typeof appConfig !== 'undefined' && appConfig.graphend) ? appConfig.graphend : null;

        // Add control panel
        this.controls=new DivItem(this.comp,"harvestgraphui_controls");
        this.controls.setStyle("margin-bottom","5px");
        this.controls.setStyle("font-size","70%");

        var startDateValue=this.startDate ? this.startDate : '';
        var endDateValue=this.endDate ? this.endDate : '';
        this.controls.element.innerHTML="Average every <input type='number' id='granularityInput' value='"+this.dayGranularity+"' min='1' style='width:50px;margin-left:5px;font-size:inherit'> days &nbsp;|&nbsp; From: <input type='text' id='startDateInput' value='"+startDateValue+"' placeholder='DD/MM/YY' style='width:80px;margin-left:5px;font-size:inherit'> &nbsp; To: <input type='text' id='endDateInput' value='"+endDateValue+"' placeholder='DD/MM/YY' style='width:80px;margin-left:5px;font-size:inherit'> &nbsp;|&nbsp; <span id='priceDisplay' style='color:#666'></span>";

        // Add canvas container
        this.canvasContainer=new DivItem(this.comp,"harvestgraphui_canvascontainer");
        this.canvasContainer.setStyle("width","100%");
        this.canvasContainer.setStyle("height","300px");

        var self=this;
        document.getElementById('granularityInput').addEventListener('change',function(e){
            var val=parseInt(e.target.value);
            if(val>=1){
                self.dayGranularity=val;
                if(self.graph && self.currentData){
                    var priceInfo=self.graph.updateFromData(self.currentData, self.dayGranularity, self.startDate, self.endDate);
                    if(priceInfo){
                        var priceDisplay=document.getElementById('priceDisplay');
                        if(priceDisplay){
                            priceDisplay.textContent='Avg price: €'+priceInfo.avgPrice.toFixed(2)+'/kg (Total: '+(priceInfo.totalQuantity/1000).toFixed(1)+'kg, €'+(priceInfo.totalValue/1000).toFixed(0)+')';
                        }
                    }
                }
            }
        });

        document.getElementById('startDateInput').addEventListener('change',function(e){
            self.startDate=e.target.value.trim() || null;
            if(self.graph && self.currentData){
                var priceInfo=self.graph.updateFromData(self.currentData, self.dayGranularity, self.startDate, self.endDate);
                if(priceInfo){
                    var priceDisplay=document.getElementById('priceDisplay');
                    if(priceDisplay){
                        priceDisplay.textContent='Avg price: €'+priceInfo.avgPrice.toFixed(2)+'/kg (Total: '+(priceInfo.totalQuantity/1000).toFixed(1)+'kg, €'+(priceInfo.totalValue/1000).toFixed(0)+')';
                    }
                }
            }
        });

        document.getElementById('endDateInput').addEventListener('change',function(e){
            self.endDate=e.target.value.trim() || null;
            if(self.graph && self.currentData){
                var priceInfo=self.graph.updateFromData(self.currentData, self.dayGranularity, self.startDate, self.endDate);
                if(priceInfo){
                    var priceDisplay=document.getElementById('priceDisplay');
                    if(priceDisplay){
                        priceDisplay.textContent='Avg price: €'+priceInfo.avgPrice.toFixed(2)+'/kg (Total: '+(priceInfo.totalQuantity/1000).toFixed(1)+'kg, €'+(priceInfo.totalValue/1000).toFixed(0)+')';
                    }
                }
            }
        });
    }

    update(data){
        this.currentData=data;
        if(!this.graph && typeof HarvestGraph !== 'undefined'){
            this.graph=new HarvestGraph('#harvestgraphui_canvascontainer');
        }
        if(this.graph && data){
            var priceInfo=this.graph.updateFromData(data, this.dayGranularity, this.startDate, this.endDate);
            if(priceInfo){
                var priceDisplay=document.getElementById('priceDisplay');
                if(priceDisplay){
                    priceDisplay.textContent='Avg price: €'+priceInfo.avgPrice.toFixed(2)+'/kg (Total: '+(priceInfo.totalQuantity/1000).toFixed(1)+'kg, €'+(priceInfo.totalValue/1000).toFixed(0)+')';
                }
            }
        }
    }
}





/////////////
class PageUI{
    constructor(data,element){
        this.componentrootnode=new ComponentNode();
        this.componentrootnode.setElement(element);
        this.createPage(data);
    }

    updateDataFile(data){
        this.chronostat.update(data);
        this.blockinfoui.updateFile(data);
        this.commandui.updateFile(data);
        if(this.harvestgraphui) this.harvestgraphui.update(data);
    }

    createPage(data){
        // create scale ui
        this.scaleui=new ScaleUI(data,this.componentrootnode);
        // create command ui
        this.commandui=new CommandUI(data,this.componentrootnode);
        // create blockinfo ui
        this.blockinfoui=new BlockInfoUI(data,this.componentrootnode);
                    new SimpleBR(this.componentrootnode);

        // create harvest graph
        this.harvestgraphui=new HarvestGraphUI(this.componentrootnode);
        new SimpleBR(this.componentrootnode);

        this.chronostat=new ChronoStatUI(this.componentrootnode,data)
        new SimpleBR(this.componentrootnode);

        let pageui=this;
        this.data=data;
        loadRemote("prices.json",function(){
            pageui.chronostat.prices=JSON.parse(this.responseText);
            if(pageui.chronostat.data) pageui.chronostat.update(pageui.chronostat.data);
            pageui.blockinfoui.updatePrices(pageui.chronostat.prices);
        });

      /*  this.statlink=new Link(this.componentrootnode);
        this.statlink.setText("Stats page","stats/stats.html");
        this.statlink.setStyle("margin-top","25px");
        this.statlink.setStyle("font-size","75%");
        this.statlink.setStyle("font-weight","bold");*/
        // create wifi ui
        this.wifiui=new WifiUI(data,this.componentrootnode);
        this.diskui=new DiskUI(data,this.componentrootnode);

        console.log("PageUI::createPage");
      //  this.createTitle(this.componentrootnode,"text");
    };

    update(data){ //       console.log("PageUI::update");
        this.scaleui.update(data);
        this.commandui.update(data);
        this.blockinfoui.update(data);
        this.wifiui.update(data);
        this.diskui.update(data);
    }
};


function createTitle(cn,text)
{
    var cn2 = new SimpleBR(cn);
    var title = new SimpleText(cn);
    title.setStyle("font-weight", "bold");
    title.setStyle("color", "darkgray");
    title.setText(text);
    cn = new ComponentNode(cn);
    cn.setStyle("margin-left", "5%");
    cn.setTag("div");
    return title;
}