//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// Component class
class Component {
	constructor(id="", text){
		this.styles={};
		this.id=id;
		this.text=text;
		this.tag="span";
		this.html="";
		this.attributes={};
	}
	updateHtml(){}
	removeStyle(k){delete this.styles[k];}
	setStyle(k,v){this.styles[k]=v;}
	getStyleHtml(){
		let first=true, style="";
		for(let p in this.styles){
			if(first) {style+=" style='";first=false;}
			style+=p+":"+this.styles[p]+";";
		}
		if(!first) style+="'";	
		return style;
	}
	getAttributesHtml(){
		let attr="";
		for(let p in this.attributes) attr+=" "+p+"="+this.attributes[p];
		return attr;
	}
	getHtml(){this.updateHtml();return this.html;}
	getComponentById(id){if(this.id===id) return this; else return;};
	findComponentById(id){return this.getComponentById(id);};
 	setContent(val){this.innercontent=val;}		// function not used, variable not used
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// ComponentNodeBase class
class ComponentNodeBase extends Component {
	constructor(id){
		super(id);
		this.tag="";			 
		this.subitems=[];		 
	}
	setTag(tag){this.tag=tag;};
	addSubItem(item){this.subitems.push(item);};
	updateHtml(){
		this.html="";
		if(this.tag) this.html+="<"+this.tag+this.getStyleHtml()+this.getAttributesHtml()+">";
		for(let p in this.subitems)	this.html+=this.subitems[p].getHtml();
		
		if(this.tag) this.html+="</"+this.tag+">";
	}
	findComponentById(id){return this.getComponentById(id);}
	getComponentById(id) {
	 	//console.log("examining :"+this.id);
		if(this.id===id) return this;
		for(let p in this.subitems) {
			let res=this.subitems[p].findComponentById(id);
			if(res) return res;	
		}
	};
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// ComponentNode class
class ComponentNode extends ComponentNodeBase { 
	// never need to update unless the object is frozen
	
	constructor(parent, id){
		super(id);
		this.parent=parent;
		if(parent) {
			parent.addSubItem(this);
			if(parent.element) this.updateElement();
		} else this.frozen=1;
	}

	getCurrentValue(){if(geid(this.id)) return geid(this.id).value;}

	setElement(elem){this.element=elem;};
	setAttribute(k,val){this.attributes[k]=val;if(!this.frozen) this.updateElement();}
	removeAttribute(k){delete this.attributes[k];if(!this.frozen) this.updateElement();}
	setStyle(k,val){
		if(typeof k =="object") {let sk=Object.keys(k)[0];val=k[sk];k=sk;}
		this.styles[k]=val;if(!this.frozen) this.updateElement();}
	removeStyle(k){super.removeStyle(k);if(this.element) this.element.style.removeProperty(k);}

	setTag(tag){this.tag=tag;this.rebuild=1;if(!this.frozen) this.updateElement();}
	setCopyParentStyle(b){this.copyparentstyle=b ;}
	freezeElement(){this.elementFrozen=true;}	//variable not used
	
	addListener(name,func){
	 	if(!this.listeners) this.listeners={};
		if(typeof this.listeners[name]=="undefined") this.listeners[name]=[func];
		else this.listeners[name].push(func);
		registerCallback(this.id, this.eventNotification.bind(this));
	//	let frozen=this.frozen;
	//	this.frozen=true;
		this.setAttribute(name, "callback(\""+this.id+"\",event)");
	//	this.frozen=frozen;
		 //this.setAttribute(name,this.eventNotification.bind(this));	// or else ?
	}
		
	removeListener(name,f){
		if(!this.listeners) return
		if(typeof this.listeners[name]=="undefined") return;
		let rem=[];
		for(let k in this.listeners[name]) if(this.listeners[name][k]===f) rem.push(k);
		if(rem.length>0) for(let i=rem[rem.length-1];i>=0;i++) rem.splice(i,1);
	}
	
	eventNotification(event){
		let e=event;
		if(e && e.type){
			let eventname="on"+e.type;
			if(this.listeners && this.listeners[eventname]) for(let k in this.listeners[eventname]) this.listeners[eventname][k](e);
		}
	}

	removeAllChildren(){
		while(0<this.subitems.length) this.removeChild(this.subitems[this.subitems.length-1]);
	}

	removeChild(c){
		if(this.subitems.indexOf(c)>-1) this.subitems.splice (this.subitems.indexOf(c), 1);
		if(c.element.parentNode) c.element.parentNode.removeChild(c.element);
//		if(c.element.parentNode) c.element.parentNode.removeChild(c.element);
//		else console.log("ComponentNode::removeChild no element parent node to remove from");	
	}
	
	selfRemove(){// this should be done by the parent
		this.parent.removeChild(this);
	}
	
	hasOwnElement(){if(this.element) return this.element!==this.parent.element;};
	createElements(replace){
		try {
			this.element = document.createElement(this.tag);
		} catch (error) {
			console.log();
			console.error(error);
			// expected output: ReferenceError: nonExistentFunction is not defined
			// Note - error messages will vary depending on browser
		}
												// create element
			this.applyProperties();									// initialize innerText
	
			if(!replace) this.parent.element.appendChild(this.element);		// this  should be done through a parent call
			else this.parent.element.replaceChild(this.element, replace);
			this.readd=0;
			this.rebuild=0; 								
	};
	
	updateCreatedElements(){	//	console.log();
		this.applyProperties();		
	};
	
	applyProperties(){
		if(this.id && this.element.attributes.id!==this.id) this.element.setAttribute("id",this.id);
		for(let s in this.attributes) if(this.attributes[s] !== this.element.attributes[s]) this.element.setAttribute(s,this.attributes[s]);
		for(let s in this.styles) if(this.styles[s] !== this.element.style[s]) this.element.style[s]=this.styles[s];
		if (this.copyparentstyle) for(let style in this.parent.styles) this.element.style[style]=this.parent.styles[style];
		if(this.element.innerText!==this.text && typeof this.text!="undefined") this.element.innerText=this.text;
		if(this.element.value!==this.text && this.text!==undefined) this.element.value=this.text;	//attribute does not change the variable
	}
	
	updateElement(){
		this.frozen=false;	// reset frozen state // maybe it should return with no update if frozen and wait for an unfreeze ?
		if(this.tag) {
				if(!this.hasOwnElement() || this.readd) this.createElements();	// createItem
				else if(this.rebuild) this.createElements(this.element); // create and replace previous
				else this.updateCreatedElements();	
		} else this.element=this.parent.element;
		for(let c in this.subitems) this.subitems[c].updateElement();// there is a problematic case, when parent had no element but child did, so need to insert between them
		//event={type:"change"};
		this.eventNotification({type:"change"});
	}; 	
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// Callback registration
var callbacklist={};
function callback(k,arg1,arg2){
	if(callbacklist[k]) callbacklist[k](arg1,arg2);
}
function registerCallback(k,func){
	callbacklist[k]=func;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// ComponentItem class
class ComponentItem extends ComponentNode {
	constructor(parent, id, text){
		super(parent, id);
		if(text) this.setText(text);
	}
	setText(v){if(this.text!==v) {this.text=v;this.updateElement();}}
	updateHtml(){this.html=this.text;}
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// SimpleText class
class SimpleBR extends ComponentItem{
	constructor(parent, id, text){
		super(parent, id, text);
		this.setTag("br");
	}
	updateHtml(){this.html=this.text;}
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// SimpleText class
class SimpleText extends ComponentItem{
	constructor(parent, id, text){
		super(parent, id, text);
		this.setTag("label");
	}

	updateHtml(){this.html=this.text;}
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// Link class
class Link extends ComponentItem{
	constructor(parent, id){
		super(parent, id);
		this.setTag("a");
	}
	setText(v,l){
		if(!l) l=v;
		if(this.text!==v) {
			this.text=v;
			this.attributes.href=l;
			this.updateElement();
		}
	}
	updateHtml(){this.html="<a href="+this.text+" "+this.getStyleHtml()+this.getAttributesHtml()+">"+this.text+"</a>";}
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// Span class
class Span extends ComponentItem{
	constructor(parent, id){
		super(parent, id);
		this.setTag("span");
	}
	setText(v){
		if(this.text!==v) {
			this.text=v;
			this.updateElement();
		}
	}
	updateHtml() {this.html+="<span id="+this.id+" "+this.getStyleHtml()+this.getAttributesHtml()+">"+this.text+"</span>";}
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// Span class
class DivItem extends ComponentItem{
	constructor(parent, id){
		super(parent, id);
		this.setTag("div");
	}
	setText(v){
		if(this.text!==v) {
			this.text=v;
			this.updateElement();
		}
	}
	updateHtml() {this.html+="<span id="+this.id+" "+this.getStyleHtml()+this.getAttributesHtml()+">"+this.text+"</span>";}
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////// Table, Row, and Cell class

class TableCell extends ComponentItem{
	constructor(parent, id){
		super(parent, id);
		this.setTag("td");
	}
	setText(v){
		if(this.text!==v) {
			this.text=v;
			this.updateElement();
		}
	}
}
/////////////////////////////////////////
class TableHeaderCell extends TableCell{
	constructor(parent, id){
		super(parent, id);
		this.setTag("th");
	}
}
////////////////////////////////////
class TableRow extends ComponentItem{
	constructor(parent, id){
		super(parent, id);
		this.setTag("tr");
	}
	setText(v){
		if(this.text!==v) {
			this.text=v;
			this.updateElement();
		}
	}
}
class MultiTable extends ComponentItem{
//public:
	constructor(parent, id){
		super(parent, id);
		this.setTag("div");
		this.subtables=[];
	}
//private:
	createSubTable(){return new Table(this);}

//public:
	setTableContent(contentobj){
		let count=0;
		for(let v in contentobj){
			if(!this.subtables[v]) this.subtables[v]=this.createSubTable();
			this.subtables[v].setTableContent(contentobj[v]);
			count =v;
		}
		if(this.subtables.length>count+1) {
			for(let i=count+1;i<this.subtables.length;i++) this.subtables[i].selfRemove();
			this.subtables=this.subtables.slice(0,count+1);
		}
	}

	findCellByProperty(prop,val){
		for(let v in this.subtables){
			let res=this.subtables[v].findCellByProperty(prop,val);
			if(res) return res;
		}
	}

	getHeaderRowComponents(){
		let rows=[];
		for(let v in this.subtables) rows.push(this.subtables[v].headerrow);
		return rows;
	}

	parseContent(v){	//should use create cell as well
		var tables=v.split("table:");
		for(var t in tables) this.subtables[t].parseContent(tables[t]);
		}
	};

////////////////////////////////////
class Table extends ComponentItem{
	constructor(parent, id){
		super(parent, id);
		this.cellindex=[];
		this.rows=[];
		this.setTag("table");
	//	this.updateElement();
	}
// getters/setters
	getHeaderRowComponent(){return this.headerrow;}

	findCellByProperty(p,t){for (let r in this.cellindex) for (let c in this.cellindex[r]) if(this.cellindex[r][c][p]==t) return this.cellindex[r][c];}
	setText(v){
		if(this.tablecontent!==v) {
			this.tablecontent=v;
			this.clear();
			this.parseContent(v);
			this.updateElement();
		}
	}
	setCaption(ncaption){
		if(this.captionitem) this.captionitem.selfRemove();
		this.captionitem=new ComponentNode(this, "tablecaption_"+this.id);
		this.captionitem.tag="caption";
		//this.captionitem.setStyle("","");
		this.captionitem.updateElement();

		if(this.maincaptionitem) this.maincaptionitem.selfRemove();
		this.maincaptionitem=new ComponentNode(this.captionitem, "tablemaincaption_"+this.id);
		this.maincaptionitem.tag="span";
		this.maincaptionitem.text=ncaption;
		this.maincaptionitem.setStyle("font-weight","bold");

	}
	setSubCaption(ncaption){
		if(this.captionitem) {
			this.subcaptionbr=new SimpleBR(this.captionitem, "tablesubcaptionbr_"+this.id);
			this.subcaptionitem=new ComponentNode(this.captionitem, "tablesubcaption_"+this.id);
			this.subcaptionitem.tag="span";
			this.subcaptionitem.text=ncaption;
			this.subcaptionitem.setStyle("font-size","90%");
			this.subcaptionitem.updateElement();
		}
	}
	clear(){
		while(this.subitems.length) {
			this.subitems.back().selfRemove();
		}
		this.cellindex=[];
		this.rows=[];
	}
	parseContent(table){	//should use create cell as well
		this.cellindex[t]=[];
		if(table.length===0) return;
		var lines=table.split(";"), first=true, headers=true;
		for(var l in lines) {
			this.cellindex[t][l]=[];
			if(first) {first=false;this.title=lines[l].trim();this.setCaption(this.title);continue;}
			else {
				var r=new TableRow(this, "tablerow_"+this.id);
				if(headers) {headers=false; r.setStyle("font-weight","bold");r.setStyle("text-align","center");r.setStyle("font-style","italic");}
				var items=lines[l].split(","), firstcol=true;

				for(var it in items) {
					var cell=new TableCell(r, "tablecell_"+this.id);
					//	this.cells.push(cell);
					this.cellindex[t][l][it]=cell;
					this.cellindex();
					if(firstcol) {firstcol=false;cell.setStyle("font-weight","bold");}
					cell.setText(items[it]);
				}
			}
		}

	}

	makeCellId(i,j,k){
		return "table_"+this.id+"_cell_"+i+"-"+j+"-"+k;
	};

	createCell(parent,value,row,column,tag){
		var cell ;
		if(tag==="th") cell= new TableHeaderCell(parent, this.makeCellId(test,row,column));
		else cell= new TableCell(parent, this.makeCellId(test,row,column));
		//	cell.coords={t:test,r:row,c:column};
		//this.cellindex[test][row][column]=cell;
		cell.setText(value);
		return cell
	}
	createRow(parent,row){
		return new TableRow(this, "tablerow_"+this.id+"-"+test+"_"+row);
	}
	setTableContent(contentobj){	// if has already content, just update it and create new rows and columns as required
		this.contentobj=contentobj;
		if(!this.cellindex) this.cellindex=[];

		let co=contentobj;
		if(co.caption) this.setCaption(co.caption);
		if(co.subcaption) this.setSubCaption(co.subcaption);
		if(!this.cellindex) this.cellindex=[];
		let rowid=0, cellid=0;
		if(co.headers) {
			if(!this.headerrow)	{
				//this.cellindex[0]=[];
				let r=this.createRow(this,0);
				this.headerrow=r;
				this.rows[0]=r;
				r.setStyle("font-weight","bold");r.setStyle("text-align","center");r.setStyle("font-style","italic");
			}
			if(!this.cellindex[0]) this.cellindex[0]=[];
			let headerrowcells=this.cellindex[0];
			let ds=0;
			for(let h in co.headers){	// update the cells from new data
				if(!headerrowcells[h]) headerrowcells[h]=this.createCell(this.headerrow,co.headers[h],0,h,"th");
				else headerrowcells[h].setText(co.headers[h]);
				ds=Number.parseInt(h);
			}
			if(ds+1<headerrowcells.length){
				for(let i=ds+1;i<headerrowcells.length;i++) headerrowcells[i].selfRemove();
				this.cellindex[0]=headerrowcells.slice(0,ds+1);
			}
		}
		let allrows=1;
		for(let o in co.rows){ o=Number(o);
			if(!this.cellindex[o+1]) {
				this.cellindex[o+1]=[];
				let r=this.createRow(this,o+1);
				this.rows[o+1]=r;
			}
			let cells=co.rows[o], firstcol=true;
			let rowcells=this.cellindex[o+1], ds=0;
			for(let h in cells){
				if(!rowcells[h]) {
					rowcells[h]=this.createCell(this.rows[o+1],cells[h],o+1,h);
					if(firstcol) {rowcells[h].setStyle("font-weight","bold");rowcells[h].setStyle("text-align","left");}
				} else rowcells[h].setText(cells[h]);
				if(firstcol) firstcol=false;
				ds=Number.parseInt(h);
			}
			if(ds+1<rowcells.length){
				for(let i=ds+1;i<rowcells.length;i++) rowcells[i].selfRemove();
				this.cellindex[o+1]=rowcells.slice(0,ds+1);
			}
			allrows=o+2;
		}
		if(allrows<this.cellindex.length){
			for(let i=allrows;i<this.cellindex.length;i++) {
				for(let j=0;j<this.cellindex[i].length;j++) this.cellindex[i][j].selfRemove();
			}
			this.cellindex=this.cellindex.slice(0,allrows);
			for(let i=allrows;i<this.rows.length;i++) this.rows[i].selfRemove();
			this.rows=this.rows.slice(0,allrows);
		}
		
	}
}






//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class SelectOption extends ComponentItem{
	constructor(parent,id) {
		super(parent,id);
		this.setTag("option");
	}
	setText(v){
		if(this.text!==v) {
			this.setAttribute("value",v);
			this.text=v;
			this.updateElement();
		}
	}

	select(){this.element.setAttribute("selected","1")}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Select extends ComponentItem {
	constructor(parent,id) {
		super(parent,id);
		this.setTag("select");
		this.options=[];
	}
	setOptions(options){
		let last=0;
		for(let o in options) {
			if(!this.options[o]) {this.options[o]=new SelectOption(this,this.id+"option"+o);}
			this.options[o].setText(options[o]);
			last=o+1;
		}
		if(last<this.options.length) while(last<this.options.length) this.options.pop().selfRemove();
	}

	select(name){
		for(let o of this.options) if(o.text==name) o.select();

	}

	getSelection(){
		let selected=[];
		for(let o of this.options) if(o.element.selected) selected.push(o);

		return selected;
	}
}