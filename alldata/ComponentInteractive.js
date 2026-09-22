
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var activebgcoloroutline="f48a00";
var activebgcolorborder="fcb605";
var activebgcolor="fffee2";


class InteractiveItem extends ComponentItem {
	constructor(parent, id) {
		super(parent, id);
		this.autobg=1;
		this.autosize=0;
		this.addListener("onkeyup", this.updateFromUser.bind(this));
		this.activebgcolor=activebgcolor;
		this.activebgcolorborder=activebgcolorborder;
		this.activebgcoloroutline=activebgcoloroutline;
	}
	getUserInput(){return this.userinput;}

	updateFromUser(){
//		console.log("updateFromUser -1 :"+this.element.value);
		if(this.ubusy) {this.urequestupdate=true;return;}
		this.ubusy=true;this.urequestupdate=false;
		var mod=this.isUserModified();
//		console.log("updateFromUser 0 :"+this.element.value);
		if(mod) {
			if(this.userinput!=this.element.value){
				if(this.remotevalue===undefined) this.remotevalue=this.text;
				this.userinput=this.element.value;
//				console.log("updateFromUser 1 :"+this.element.value);
				this.text=this.userinput;		//			if(this.autosize && this.updateSize) this.updateSize();
			}
//			console.log("updateFromUser 1.5 :"+this.element.value);
		} else {
			this.text=this.element.value;
//			console.log("updateFromUser 2 :"+this.element.value);
			this.userinput=undefined;
			this.remotevalue=undefined;
		}
		if(this.autobg) this.updateBG();
		if(this.autosize && this.updateSize) this.updateSize();
		this.ubusy=false;
		if(this.urequestupdate && !this.extraupdate) {this.extraupdate=true;this.updateFromUser();}
		this.extraupdate=false;
	}

	updateBG(){	// should we save the value of the user input in this object ?
		if(this.busy) return;
		this.busy=true;
		var mod=this.isUserModified();		//if(mod) {this.userinput=this.element.value;this.text=this.uservalue;}
		if(mod || this.toremove) {
			this.updateFromUser();
			this.setStyle("background-color",this.activebgcolor);
			this.setStyle("border","2px #"+this.activebgcolorborder);
			this.setStyle("border-style","solid");
			this.setStyle("border-radius","5px");
			this.setStyle("outline-color","#"+this.activebgcoloroutline);
		} else {
			this.setStyle("background-color","");
			this.setStyle("border",null);
			this.setStyle("border-style",null);
			this.setStyle("border-radius",null);
			this.setStyle("outline-color",null);
		}
		this.busy=false;
	}

	setToRemove(b){this.toremove=b;this.updateBG();}	// means this item does not exist anymore in remote model, happens when user changed it
	isUserModified(){
		//if(this.userinput) return true;
		//	if(!this.text) this.element=geid(this.element.id);
		if(this.remotevalue!==undefined && this.element.value!==this.remotevalue) return true;	// if user modified not in sync with remote value
		var t=this.text;
		if(t===undefined) t="";
		if(this.remotevalue===undefined && this.element.value!==t) return true;	// if user modified not in sync with initial value
		return false;
	}
	updateText(v, storeonly){	// this does not show the update if user modified the input or if told
		if(!storeonly && !this.isUserModified()) {this.setText(v);this.remotevalue=undefined;}	// if not usermodified
		else {this.remotevalue=v;this.updateBG();}	// or else update but without showing up

	}
}






////////////////// Input class
// TODO : separate into an interactive part and a normal part
class Input extends InteractiveItem{
	constructor(parent, id){
		super(parent, id);
		this.setTag("input");
		this.autosize=1;
		this.addListener("onkeyup", this.updateFromUser.bind(this));
		this.addListener("onkeydown", this.updateFromUser.bind(this));
		this.addListener("onchange", this.updateFromUser.bind(this));
	}
	setText(v){
		if(this.text!==v) {
			this.userinput=undefined;
			this.remotevalue=undefined;
			this.text=v;
			//this.attributes["value"]=v;
			this.element.value=v;
			this.updateElement();
		}
	}
	updateHtml() {this.html+="<input id="+this.id+" "+this.getStyleHtml()+this.getAttributesHtml();
		if(this.text) this.html+=" value="+this.text+">";
		this.html+="</input>";
	}
	/*	setAutoSize(turnon){	//should be on update too, onchange
            if(turnon) {
        //		this.addListener("onkeyup", this.autoSize.bind(this));
                this.addListener("onchange", this.autoSize.bind(this));
            }
            else {
        //		this.removeListener("onkeyup", this.autoSize.bind(this));
                this.removeListener("onchange", this.autoSize.bind(this));
            }
        }*/

	updateSize(){
		if(this.busy) return;
		var minsize=7;
		if(this.element.getAttribute("size")) minsize=parseInt(this.element.getAttribute("size"));
		var content=this.element.value;
		//	if(this.isUserModified()) {if(!this.remotevalue)this.remotevalue=this.text;this.text=content;}//this.updateBG();//this.text=content;
		this.busy=true;
		this.frozen=true;
		if(content.length >minsize){
			this.setStyle("width", (content.length +2) + "ch");
		} else this.setStyle("width", (minsize +2) + "ch");
		this.updateElement();//this.frozen=false;
		this.busy=false;
	}
}


////////////////// Input class
var activebgcolorfilter="hue-rotate(207deg) brightness(1.9) drop-shadow(2px 2px 1px #ffd772)";
class CheckBox extends InteractiveItem{
	constructor(parent, id){
		super(parent, id);
		this.setTag("input");
		this.setAttribute("type","checkbox");
		//this.addListener("onkeyup", this.updateBG.bind(this));
		this.addListener("onchange", this.updateBG.bind(this));

	}

	updateBG(){	// should we save the value of the user input in this object ?
		if(this.busy) return;
		this.busy=1;
		var mod=this.isUserModified();
		if(mod) this.userinput=this.element.value;
		if(mod || this.toremove) this.setStyle("filter",activebgcolorfilter);
		else this.setStyle("filter",null);
		this.busy=0;
	}

	check(v){
		this.text=v;
		this.element.checked=v;
	}

	getArguments(){var k=0,o={};if(this.element.checked) k=1;o[this.id]=k;return o;}
	getChildrenIds(){return [this.id];}
	isUserModified(){
		var v=false, r=false;
		if(this.text===1) v=true;
		if(this.remotevalue===1) r=true;
		if(this.remotevalue!==undefined && r!==this.element.checked) return true;
		if(this.remotevalue===undefined && this.element.checked!==v) return true;
		return false;
	}
	/*	callback(){
	//	console.log("callback function "+this.target+" "+this.param);
		if(this.onclick) this.onclick(this.target,this.param)
		//setValue(fields,target);	// this should be a clean callback to the application layer
	}
	setCallback(func,t,param){
	//	if(t) {
			this.target=t;this.param=param;this.onclick=func;
			registerCallback(this.id, this.callback.bind(this));
			this.setAttribute("onclick", "callback(\""+this.id+"\")");
//			this.setAttribute("onclick", this.callback.bind(this));

	//	}
	}
	setTarget(t,param, func){	//this one should be removed
	//	if(t) {
			this.target=t;this.param=param;this.onclick=func;
			registerCallback(this.id, this.callback.bind(this));
			this.setAttribute("onclick", "callback(\""+this.id+"\")");
	//	}
	}*/

	setText(v){
		if(v===true) v=1;
		if(this.text!==v) {
			this.text=v;
			//	this.attributes["value"]=v;
			this.element.checked=(v===1);
			this.updateElement();
		}
	}
	updateHtml() {this.html+="<input id="+this.id+" "+this.getStyleHtml()+this.getAttributesHtml();
		if(this.text) this.html+=" value="+this.text+">";
		this.html+="</input>";}
}




////////////////// DropDown class : select element
class DropDown extends InteractiveItem{
	constructor(parent, id){
		super(parent, id);
		this.setTag("select");
		this.options=[];
		this.class="DropDown";
		this.addListener("onkeyup", this.updateBG.bind(this));
		this.addListener("onchange", this.updateBG.bind(this));
	}
	isUserModified(){
		if(this.tag==="input") return InteractiveItem.prototype.isUserModified.call(this);
		var t=this.selected;
		if(t===undefined) t="";
		if(this.options.indexOf(t)<0) {this.selected=this.element.value;return false;}
		if(this.remotevalue!==undefined && this.remotevalue!==this.element.value) return true;
		if(this.remotevalue===undefined && this.element.value!==t) return true;
		return false;
	}
	updateText(v, storeonly){
		if(!storeonly && !this.isUserModified()) {this.setText(v);this.remotevalue=undefined;}	// if not usermodified
		else {this.remotevalue=v;}	// or else update but without showing up
		this.updateBG();
	}
	setText(v){
		if(this.text!==v) {
			this.text=v;
			this.attributes["value"]=v;
			//this.addOption(v);
			this.selected=v;
			if(!this.frozen) this.updateElement();
		}
	}
	updateOptions(val,list){	// this does not show the update if user modified the input
		var t=this.selected;
		if(t===undefined) t="";
		this.setOptions(val,list);
		if(this.element.value===t) this.updateElement();	// if not usermodified
		this.updateBG();
	}
	setOptions(val,list){
		var changed=false;
		if(this.options.length===list.length)
		{for(var l in list) if(list[l]!==this.options[l]) {changed=true;break;}
		} else changed=true;
		if(changed) {
			this.resetOptions();
			for(var k in list) this.addOption(list[k]);
		}
		this.setSelected(val);
	}
	resetOptions(){this.options=[];if(this.element && this.element.tagName.toLowerCase()===this.tag) this.element.innerHTML="";}
	addOption(o){
		if(this.options.includes(o)) return;
		this.options.push(o);
	}
	setSelected(sel){this.selected=sel;if(!this.frozen) this.updateElement();}

	convertToTextField(){this.setTag("input");if(!this.frozen) this.updateElement();}
	convertToDropDown(){this.setTag("select");if(!this.frozen) this.updateElement();}

	updateElement(){
		var f;

		ComponentNode.prototype.updateElement.call(this);	// call base class method
		if(this.tag==="select"){
			//this.element.innerHtml='';
			while ( this.element.lastChild) this.element.removeChild(this.element.lastChild);

			for(var o in this.options){
				var c=document.createElement("option");
				var t=this.options[o];
				this.element.appendChild(c);
				c.innerText=t;
				c.setAttribute("value",t);
				if(this.selected===t) c.setAttribute("selected","selected");
			}
//		event={type:"change"};
			this.eventNotification({type:"change"});
		}
//		if(f) {this.element.setAttribute("onchange",f);f({type:"change"});}
	};
}





var idnumber=0;

////////////////// Button class
class Button extends ComponentNode{
	constructor(parent, id){
		super(parent, id);
		this.setTag("button");
	}
	selfId(){
		this.id="button_"+idnumber;
		idnumber++;
	}
	setText(v){
		if(this.text!==v) {
			this.text=v;
			this.attributes["value"]=v;
			if(!this.frozen) this.updateElement();
		}
	}
	callback(){
		//	console.log("callback function "+this.target+" "+this.param);
		if(this.onclick) this.onclick(this.target,this.param)
		//setValue(fields,target);	// this should be a clean callback to the application layer
	}
	setCallback(func,t,param){
		//	if(t) {
		this.target=t;this.param=param;this.onclick=func;
		registerCallback(this.id, this.callback.bind(this));
		this.setAttribute("onclick", "callback(\""+this.id+"\")");
//			this.setAttribute("onclick", this.callback.bind(this));

		//	}
	}
	setTarget(t,param, func){	//this one should be removed
		//	if(t) {
		this.target=t;this.param=param;this.onclick=func;
		registerCallback(this.id, this.callback.bind(this));
		this.setAttribute("onclick", "callback(\""+this.id+"\")");
		//	}
	}
	/*	callback(target,fields){
            console.log("callback function "+target+" "+fields);
            setValue(fields,target);	// this should be a clean callback to the application layer
        }
        setTarget(t,names){
            if(t) {
                registerCallback(this.id, this.callback.bind(this));
                this.setAttribute("onclick", "callback(\""+this.id+"\",\""+t+"\","+JSON.stringify(names)+")");
            }
        }*/
}







/*
InteractionModel will encapsulate interaction models for highlight and select of components,
 - highlight is a model where state is activated by mouse entry(first mouse over) and disactivated by mouseout
 - select is a model where state is activated by mouse click and disactivated by another mouseclick or, if maxitem is one, by another selection
 The InteractionModel will keep track of what component is activated

 There is two ways of sharing the load: event to state change decision, state to style mapping, component style change
  - the interaction model take it all
 			 There will be a problem with multiple interaction models. For that case, a priority system could be thought (first active state applies)
  - the interaction model just keep track, or maybe use the event
 			there is no problem with multiple interaction models. For that case, the info from the is used with the previous ternary state

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// event to state change decision
// state to style mapping
// component style change
*/


// An idea of possible evolution for interaction model
// event -> map to item group activation/disactivation -> itemgroup get activated style or loose it (should use css class)
// [] -> map event (+condition function) to state -> style applied on comp group
// evolution toward state machine, how to make a compatible model (from the point of view of the interacter)

class InteractionModel {
		constructor(maxitem) {	// if undefined, there is no limit
			if(maxitem===undefined) maxitem=1;
			this.maxitem=maxitem;
			this.actives=[];
		}
		setEventMap(eventmap){this.eventmap=eventmap;}
		setStyleMap(map){this.stylemap=map;}
		isActive(comp){return (this.actives.find(it =>it==comp)!=undefined);}
		getActives(){return this.actives;}
		activate(item) {this.actives.push(item);this.applyStyle(item);}
		clear(){this.actives=[];}
		processEvent(ev,item){	// return true if any state change
			if(!this.eventmap) return;
			if(!(ev in this.eventmap)) return this.isActive(item);
			let state=this.eventmap[ev];
			if(ev=="mouseclick"){
				console.log();
			}
			let active=this.isActive(item);
			if(active) active=1; else active=0;
			if(typeof state=="object") state=state[active];
			if(state && !active) {
				if(this.actives.length>=this.maxitem) {
					let po=this.actives.pop();
					//this.applyStyle(po);
					po.interacter.applyStyle();
					if(this.changeListener) this.changeListener(po,0);
				}
				this.actives.push(item);
				this.applyStyle(item);
				if(this.changeListener) this.changeListener(item,1);
			}
			else if(!state && active) {
				this.actives=this.actives.filter(e=>e!=item);
				this.applyStyle(item);
				if(this.changeListener) this.changeListener(item,0);
			}
			return state;
		}
		applyStyle(itemcomp){
			let active=this.isActive(itemcomp);
			if(active) active=1; else active=0;
			let style=this.stylemap[active];
			itemcomp.setStyle(style);
		}
}

class SelectModel extends InteractionModel {
	constructor(maxitem, disableonreclick) {
		super(maxitem);
		let defbg="lightyellow", highlightbg="LightSkyBlue", selectedbg="lightgreen" ;
		let selecteventmap={mouseclick:{1:0,0:1}};
		if(!disableonreclick) selecteventmap.mouseclick=1;
		let selectstylemap={
			0:{"background-color":defbg},
			1:{"background-color":selectedbg}
		}
		this.setEventMap(selecteventmap);
		this.setStyleMap(selectstylemap);

	}
}
class HighlightModel extends InteractionModel {
	constructor(maxitem) {
		super(maxitem);
		let eventmap={mouseenter:1,	mouseexit:0};
		let defbg="lightyellow", highlightbg="LightSkyBlue", selectedbg="lightgreen" ;
		let stylemap={
			0:{"background-color":defbg},
			1:{"background-color":highlightbg}
		}
		this.setEventMap(eventmap);
		this.setStyleMap(stylemap);
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Interacter {
	constructor(comp){
		this.comp=comp;
		this.interactionmodels=[];
	}
	addModel(model){this.interactionmodels.push(model);};
	clearModels(){this.interactionmodels=[];}
	enable(val){
			if(this.enabled===undefined) this.init();
			this.enabled=val;
	}
	init(){
		for(let im in this.interactionmodels) this.interactionmodels[im].applyStyle(this.comp);
	}
	reset(){
		for(let im of this.interactionmodels) im.clear();
		this.init();
	}
	
	processEvent(e){
		if(!this.enabled) return;
		for(let im in this.interactionmodels){
			let b=this.interactionmodels[im].processEvent(e,this.comp);
			//this.interactionmodels[im].applyStyle(this.comp)
			if(b) break;
		}

	}
	applyStyle(){
		if(!this.enabled) return;
		for(let im in this.interactionmodels){
			let b=this.interactionmodels[im].isActive(this.comp);
			this.interactionmodels[im].applyStyle(this.comp)
			if(b) break;
		}

	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class InteractiveCell extends TableCell{
	constructor(parent,id,tag,mytable){
		super(parent,id);this.mytable=mytable;

		this.interacter=new Interacter(this);

		//this.interacter.init(this);
		if(tag) this.setTag(tag);	// to make it a 'th'
	}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class InteractiveRow extends TableRow{
	constructor(parent,id,mytable){
		super(parent,id);
		this.mytable=mytable;
		if(!this.mytable.selectedrows)  this.mytable.selectedrows={};
		this.interacter=new Interacter(this);
	}
}


/////////////////////////////////////////
class InteractiveMultiTable extends MultiTable {
	constructor(parent, id) {
		super(parent, id);
		this.selectmodel=new SelectModel(1,true);
		this.tables=[];

	}
	setSelectListener(listener){this.selectListener=listener;}
	createSubTable(){
		let table= new InteractiveTable(this,this.id+"subtable"+this.tables.length);
		table.tablenumber=this.tables.length;
		this.tables.push(table);
		table.setSelectModel(this.selectmodel);
		if(this.selectListener) table.setSelectListener(this.selectListener);
		return table;
	}
	getSelectModel(){ return this.selectmodel;}
	clearInteractive(){for(let table of this.subtables) table.clearInteractive();}
	makeInteractive(table,row,col){ this.subtables[table].makeInteractive(row,col);}
/*
 	selectListener (){}
	makeInteractiveRows(){}
	selectCell(){}
*/
}
/////////////////////////////////////////
class InteractiveTable extends Table {
	constructor(parent, id) {
		super(parent, id);
		this.highlightmodel=new HighlightModel();
		this.setSelectModel(new SelectModel(1,true));
		this.setStyle("font-size","inherit");
	}
// getters / setters
	getSelectModel(){return this.selectmodel;}
	setSelectModel(newmodel){
		this.selectmodel=newmodel;
		this.selectmodel.changeListener=function(e,v){if(this.selectListener) this.selectListener(e,v);}.bind(this);
	}
	setSelectListener(l){this.selectListener=l;}
	// inherited
	createCell(parent,value,row,column, tag){
		var cell = new InteractiveCell(parent, this.makeCellId(this.tablenumber,row,column), tag, this);
	//	if(row!=)
		cell.coords={t:this.tablenumber,r:row,c:column};
		//cell.mytable=this;
		this.cellindex[row][column]=cell;
		cell.setText(value);
		return cell
	}
	// inherited
	createRowComp(row){
		let r= new InteractiveRow(this, "tablerow_"+this.id+"_"+row,this);
		return r;
	}

	selectCell(cell){this.selectmodel.activate(cell);}
	selectRow(row){this.selectmodel.activate(row);}


	clearInteractive(){
		this.selectmodel.clear();
		this.highlightmodel.clear();
		for(var j in this.cellindex)
				for(var k in this.cellindex[j])	{
					let n=this.cellindex[j][k].interacter;
					if(n){
						n.init();
						n.comp.setStyle("background-color",null);
						n.enabled=undefined;
					}
				}
	}

	makeInteractive(row,column, otherselectmodel){	//table, row, column
		let i=this.cellindex[row][column].interacter;
		if(i) {
			i.clearModels();
			if(!otherselectmodel) i.addModel(this.selectmodel);
			else i.addModel(otherselectmodel);
			i.addModel(this.highlightmodel);
			i.enable(true);		}
	}

	makeInteractiveRows(start, finish) {
		if(finish===undefined) finish=this.rows.length;
		if(start===undefined) start=1;
		for(let i=start;i<this.rows.length && i<finish;i++) {
			let inter=this.rows[i].interacter;
			inter.clearModels();
			inter.addModel(this.selectmodel);
			inter.addModel(this.highlightmodel);
			inter.enable(true);
 		}
	}

	addListeners(){
			this.addListener("onclick",this.tableclicked.bind(this));
			this.addListener("onmouseover",this.tablehovered.bind(this));
			this.addListener("onmouseleave",this.tableexited.bind(this));
			this.defbg="white", this.hoverbg="lightblue", this.selectedbg="lightgreen" ;
			this.addlisteners=1;
	}

	setTableContent(contentobj){
		super.setTableContent(contentobj);
		if(!this.addlisteners) this.addListeners();
	}
	getCellComp(r,c){
		return this.cellindex[r][c];
	}
	tableclicked(e){
		if(e.target.tagName=="TD" || e.target.tagName=="TH"){
			var subcomp=this.findComponentById(e.target.id);
		 	if(this.selectedcell!=subcomp) subcomp.interacter.processEvent("mouseclick");
			var rowsubcomp=this.findComponentById(e.target.parentElement.id);
			if(this.selectedrow!=rowsubcomp) rowsubcomp.interacter.processEvent("mouseclick");
		}
	}
	tablehovered(e){
		if(e.target.tagName=="TD" || e.target.tagName=="TH") {
			let nhoveredtdcomp=this.findComponentById(e.target.id);
			let nhoveredtrcomp=this.findComponentById(e.target.parentElement.id);
			if(nhoveredtdcomp!=this.hoveredtdcomp) {	//simulate mouse exit for td
				if(this.hoveredtdcomp) this.hoveredtdcomp.interacter.processEvent("mouseexit");
				this.hoveredtdcomp=nhoveredtdcomp;
				this.hoveredtdcomp.interacter.processEvent("mouseenter");
			}
			if(nhoveredtrcomp!=this.hoveredtrcomp) {	//simulate mouse exit for tr
				if(this.hoveredtrcomp) this.hoveredtrcomp.interacter.processEvent("mouseexit");
				this.hoveredtrcomp=nhoveredtrcomp;
				this.hoveredtrcomp.interacter.processEvent("mouseenter");
			}
		}
	}
	tableexited(){
		if(this.hoveredtrcomp) this.hoveredtrcomp.interacter.processEvent("mouseexit");
		if(this.hoveredtdcomp) this.hoveredtdcomp.interacter.processEvent("mouseexit");
	}

	clearCellInteracters(){	// should trigger a selection off no ?
		for(var r in this.cellindex)	for(var c in this.cellindex[r])	this.cellindex[r][c].interacter.reset();
	}
	clearRowInteracters(){	// should trigger a selection off no ?
		for(var r of this.rows)	r.interacter.reset();
	}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class TableInteracter2 extends Interacter {
	constructor(comp, selectobj) {
		super();
		this.comp=comp;this.selectobj=selectobj;
		this.defbg="AliceBlue", this.highlightbg="lightblue", this.selectedbg="lightgreen" ;
		if(!this.comp.mytable[selectobj]) this.comp.mytable[selectobj]={};
		this.interacterreactions={
			default:{"background-color":this.defbg},
			highlighted:{"background-color":this.highlightbg},
			selected:{"background-color":this.selectedbg},
		}
		this.states=["default","highlighted","selected"];
		this.count=0;
		this.reset();
	}
	reset(){this.setState("default");}
	setState(targetstate){
		if(!this.states.find( e => e==targetstate) || this.state==targetstate) return;	//unknown or same target state
		if(!this.state) this.state=targetstate;
		let rs=this.interacterreactions[targetstate];
		for (let ir in rs) this.comp.setStyle(ir,rs[ir]);
		let saved;
		if(this.selectobj in this.comp.mytable) saved=this.comp.mytable[this.selectobj];
		let toprint=saved;
		if(toprint) toprint=saved.id;
		console.log("saved:"+saved);
		console.log("this.count:"+this.count);
		if(saved) {
//			console.log("saved.interacter==this:"+(saved.interacter==this)+" saved:"+toprint);
			console.log("this.comp.coords:");
			console.log(this.comp.coords);
			console.log("saved.coords:");
			console.log(saved.coords);
		}
		if(saved && saved.interacter!=this){// a new object change state make previous drop back
			if(saved.highlighted && saved.highlighted.interacter.state=="highlighted" && targetstate=="highlighted") {saved.highlighted.interacter.setState("default");this.comp.mytable[this.selectobj].highlighted.saved=0;}	// if previous was highlighted, drop it to default
			if(saved.selected && saved.selected.interacter.state=="selected" && targetstate=="selected") {saved.selected.interacter.setState("default");this.comp.mytable[this.selectobj].selected.saved=0;}// if previous was selected, drop it to default
		}
		/*		let cellindex=this.comp.mytable.cellindex;
                for(var k in cellindex) for (let r in cellindex[k]) for(let c in cellindex[k][r]) {
                    if(cellindex[k][r][c].interacter.state!="default" ) console.log("k:"+k+" r:"+r+" c:"+c+", cellindex[k][r][c].id:"+cellindex[k][r][c].id+", "+cellindex[k][r][c].interacter.state);
                }
        */		this.state=targetstate;
		this.count++;
		if(!(this.selectobj in this.comp.mytable)) {
			var o={"highlighted":0,"selected":0};
			this.comp.mytable[this.selectobj]=o;
		}
		if(targetstate!="default") this.comp.mytable[this.selectobj][targetstate]=this.comp;
	}
	select(){this.setState("selected");}
	highlight(on){this.setState("highlighted");}
}






