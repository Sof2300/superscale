 
class MyListComponent extends ComponentNode{
	constructor(parent,id,islinklist){
		super(parent,id+"container");
		this.id=id;		 
		this.tag="span";
		this.valuecomps=[];
		this.link=islinklist;
		this.updateElement();			 
	}
	setValueList(vallist,linklist){
		// create the inexisting fields	// or remove the extra ones
		while(vallist.length<this.valuecomps.length) {
			if(this.valuecomps.length>1) this.element.removeChild(this.valuecomps[this.valuecomps.length-1].element.previousElementSibling);
			this.valuecomps[this.valuecomps.length-1].selfRemove();
			this.valuecomps.splice(this.valuecomps.length-1,1);
			}
		while(vallist.length>this.valuecomps.length) {
			if(this.valuecomps.length>0) new SimpleText(this,"",", ");
			var comp;
			if(this.link) comp=new Link(this, this.id+this.valuecomps.length);
			else comp=new Span(this, this.id+this.valuecomps.length);
			if(comp) this.valuecomps.push(comp);
			}
		// update all field
		for(var k in this.valuecomps) {
			var ut=this.valuecomps[k];
			if(!this.link) ut.setText(vallist[k]);
			else ut.setText(vallist[k],linklist[k]);
		}
	}
	
	
	getArguments(){
		var ret={},conc="";
		for(var k in this.valuecomps) {
			if(conc.length>0) conc+=",";
			conc+=this.valuecomps[k].text;
		}
		ret[this.id]=conc;
		return ret;
	}
	
	getChildrenIds(){
		var ids=[];
		for(var k in this.valuecomps) if(this.valuecomps[k].id && this.valuecomps[k].id.length>0) ids.push(this.valuecomps[k].id);
		return ids;
	}
}



/**********************************************/
class MyComponent extends ComponentNode {
	constructor(parent,id, notitle){
		super(parent,id+"container");
		this.id2=id;		 
		this.tag="span";
		this.updateElement();
		if(!notitle) {
			this.titlecomp=new SimpleText(this,id+"title");	
			//this.titlecomp.setCopyParentStyle(true);	
		}	 

	}
	swapSubItems(a,b){
		var ta=this.subitems[a];
		this.subitems[a]=this.subitems[b];
		this.subitems[b]=ta;
		
		var ea=this.subitems[a].element,eb=this.subitems[b].element;
		var et=eb.nextSibling;
		this.element.insertBefore(ea, eb);
		this.element.insertBefore(et, ea);
		/*this.subitems[a].readd=1;
		this.subitems[b].readd=1;
		this.rebuild=1;
		this.updateElement();*/
	}
	getValueComponent(){return this.valuecomp;}
	setType(type, text, addln, link){
		this.type=type;
		if(type=="button") this.valuecomp=new Button(this, this.id2);
		if(type=="checkbox") this.valuecomp=new CheckBox(this, this.id2);
		if(type=="dropdown") this.valuecomp=new DropDown(this, this.id2);
		if(type=="link") this.valuecomp=new Link(this, this.id2);
		if(type=="span") this.valuecomp=new Span(this, this.id2);
		if(type=="input") this.valuecomp=new Input(this, this.id2);
		if(type=="table") this.valuecomp=new Table(this, this.id2);
		if(this.valuecomp) {
			//this.valuecomp.setCopyParentStyle(true);
	//		this.valuecomp.setStyle("margin","5px");	
			if(addln) this.valuecomp.lncomp=new SimpleBR(this, this.id2+"br");
			//else this.valuecomp.addendln=true;
		}
		if(text && this.valuecomp) {
			this.valuecomp.setText(text,link);
		}
		return this.valuecomp;	
	} 
 
	getSubComponent(i){
		return this.subitems[i];
	}
	updateHtml(){
		this.html="<"+this.tag+this.getStyleHtml()+this.getAttributesHtml()+" id="+this.id+">";
		if(this.subitems[0]) this.html+=this.subitems[0].getHtml();
		this.html+=" : ";
		if(this.subitems[1]) this.html+=this.subitems[1].getHtml();		
		this.html+="</"+this.tag+">";
	}
}













/**********************************************/

class MyFlexibleComponent extends ComponentNode {
	constructor(parent,id, notitle, expandable){
		super(parent,id);
		this.id2=id;		 
	//	this.setTag("div");
		if(!notitle) {
			var ncomp=new SimpleText(this,id+"title");
			this.subitems.push(ncomp);	
			ncomp.setCopyParentStyle(true);			 
		}
		this.container=new ComponentNode(this,this.id+"container");
		this.container.setTag("span");
		this.expandable=expandable;
		if(expandable) {
			this.plusbutton=new Button(this,id+"plus");
			this.plusbutton.setStyle("font-weight","bold");
			this.plusbutton.setStyle("margin","3px");
//			this.plusbutton.setStyle("border-radius","40%");
			this.plusbutton.setText("+");
			this.plusbutton.setCallback(this.plusPressed.bind(this));
  		} 
		this.rowdata=[];
		this.idnum=0;
		this.rows=0;
		this.rowcomps=[];
		//this.rowcomps[0]=[];
	}
	
	plusPressed(){
		console.log("+");this.duplicateRow();this.userchanged=true;}// must go to applicaiton layer ?
	minusPressed(n){if(this.rows<=1) return;this.userchanged=true; this.removeRow(n);} // cannot should even disable the button

	getChildrenIds(){
		var ids=[];
		for(var k in this.container.subitems) if(this.container.subitems[k].id && this.container.subitems[k].id.length>0)ids.push(this.container.subitems[k].id);
		return ids;
	}

	getArguments(){
		var arg={};
		for(var s=0;s+1<this.valuecomp.length;s+=2) {
			if(this.valuecomp[s].tag!="input" && this.valuecomp[s].tag!="select") continue;	// skip buttons
			var k=this.valuecomp[s].getCurrentValue();
			arg[k]=this.valuecomp[s+1].getCurrentValue();
			if(arg[k]==undefined) arg[k]="";
			};
		return arg;
	}
			
	isUserChanged(){
		if(this.userchanged) return true;
		for(var j in this.valuecomp) { if(this.valuecomp[j].isUserModified()) return true;}
		return false;
	};
			/*	var v=this.valuecomp[j].element.value, t=this.valuecomp[j].text, s=this.valuecomp[j].selected;
				if(t==undefined) t=""; if(s==undefined) s="";
				if(this.valuecomp[j].tag=="select" && this.valuecomp[j].options.length>0 
					&& this.valuecomp[j].options.indexOf(s)==-1) s=this.valuecomp[j].options[0];
				if(v!=t && v!=s) return true;*/	
/*
	isUserChanged(values){
		if(values.length!=this.rows) return;
		for(var i in values){
			var key=theKey(values[i]), val=theVal(values[i]);
			for(var j in this.valcomp){
				if(this.valcomp[k].id==key) return val== this.valcomp[k].element.value;
			}
		}
	};
	*/
	updateFields(values, frontview){
		function theKey(v){return Object.keys(v)[0];}
		function theVal(v){return v[theKey(v)];}
		
		function getKeyComp(r){
			var ki=0; while (r[ki].class!="DropDown" && ki<r.length) ki++;
			return r[ki];
		}
		function getValComp(r){
			var ki=0; while (r[ki].class!="DropDown" && ki<r.length) ki++;
			var vi=ki+1; while (r[vi].class!="DropDown" && vi<r.length) vi++;
			return r[vi];
		}
		
	//	if(this.userchanged) return;
		if(frontview){
			while(values.length>this.rows) this.duplicateRow(); // create few more lines
			while(values.length<this.rows) this.removeLastRow(); // create few more lines
		} else {
			if(values.length<this.rows) 
				for(var i=values.length;i<this.rows;i++) {
					var row=this.rowcomps[i];
					for(var c in this.rowcomps[i]){if(this.rowcomps[i][c].setToRemove) this.rowcomps[i][c].setToRemove(true);}	
				}	
		}
		// reorder values to match current rows
		var v2=values;values=[];
		for(var v in this.rowcomps){	// for each row of values
			var keycomp=getKeyComp(this.rowcomps[v]);//, valcomp=getValComp(this.rowcomps[v]);
			for(var k in v2) {
				var key=theKey(v2[k]);
				if(key==keycomp.text) {values[v]=v2[k];break;}	
			}
		}
		if(v2.length!=values.length){ // here we should add anything left in v2
			for(var v in v2) {
				var found=false;
				for(var k in values) if(values[k]==v2[v]) {found=true;break;}
				if(!found) values.push(v2[v]);
			}
			
			// but also a good opportunity to remove empty left, 
					//but is it a good idea since if we just add, we are in this same situation, 
							// can we use the save button press and remove the extra line only on the update after pressing save ? 
			
		}		
		for(var v in values){	// for each row of values
			var key=theKey(values[v]), val=theVal(values[v]);
			var keycomp=getKeyComp(this.rowcomps[v]), valcomp=getValComp(this.rowcomps[v]);
//			var ki=0; while (this.rowcomps[v][ki].class!="DropDown" && ki<this.rowcomps[v].length) ki++;
//			var vi=ki+1; while (this.rowcomps[v][vi].class!="DropDown" && vi<this.rowcomps[v].length) vi++;
			keycomp.toremove=0;
			keycomp.updateText(key, !frontview);
			valcomp.toremove=0;	
			valcomp.updateText(val,!frontview);
		} 	
		
		// if only the extra row empty row remove it
	}
	
	removeLastRow(){this.removeRow(this.rows-1);}

	removeRow(n){
		for(var t in this.rowcomps[n]) {
			var it=this.rowcomps[n][t];
			var p=this.valuecomp.indexOf(it);
			if(p>-1) this.valuecomp.splice(p,1);			 
			it.selfRemove();
		}
		this.rowcomps.splice(n,1);
		this.rowdata.splice(n,1);
//		this.valuecomp
		this.rows--;		
	}

	duplicateRow(n){
		function replaceAll(bstring, search, replace) {return bstring.split(search).join(replace);}
		if(!n) n=this.rows-1;
		this.rowdata[n].array[1].addedln=0;
		var r=this.addRow(this.rowdata[n].array);
		//console.log(r);
		var i=0;
		for(var k in r) {
			var text=this.rowcomps[n][i].text;while(this.rowcomps[n][i].tag=="br") i++;
			if(this.rowcomps[n][i].element.value) text=this.rowcomps[n][i].element.value;
			if(this.rowcomps[n][i].tag!=r[k].tag){
				if(this.rowcomps[n][i].tag=="input") r[k].convertToTextField();
				else if(this.rowcomps[n][i].tag=="select") r[k].convertToDropDown();
			}
			if(r[k].tag=="select"){
				if(this.rowcomps[n][i].element.value) {text=this.rowcomps[n][i].element.value;r[k].element.setAttribute("value",text);}
				r[k].options=this.rowcomps[n][i].options.slice();
				r[k].selected=this.rowcomps[n][i].selected;
			} 
			r[k].styles=Object.assign({}, this.rowcomps[n][i].styles);
			for(var a in this.rowcomps[n][i].attributes) {var att=this.rowcomps[n][i].attributes[a];
				if(typeof(att)=="string") att=replaceAll(att,this.rowcomps[n][i].id, r[k].id); 	
				r[k].attributes[a]=att;
			}
//			r[k].attributes=Object.assign({}, this.rowcomps[n][i].attributes);
			r[k].setText(text);
			r[k].remotevalue="";
			r[k].updateElement();					
			i++;
		}
		if(this.onduplicate) this.onduplicate(r);
	}
	
 	addMinusButton(row){
			if(row<1) return;
			if(!this.minusbutton) this.minusbutton=[];
			var b=new Button(this.container,this.id2+"minus"+row);
			this.rowcomps[this.rows].push(b);
			b.setStyle("font-weight","bold");
			b.setStyle("margin","5px");
//			b.setStyle("border-radius","40%");
			b.setText("-");
			b.setCallback(this.minusPressed.bind(this,row));
			b.addendln=false;
			this.minusbutton[row]=b;
		//	new SimpleBR(this.container);
	};
	
	addRow(contarray){
		var ret=[];
		this.rowcomps[this.rows]=[];
		if(this.container.subitems.length) this.rowcomps[this.rows].push(new SimpleBR(this.container));
		this.rowdata.push({index:this.container.subitems.length,array:contarray});
		for(var k in contarray){
			var it=contarray[k];
			ret.push(this.addField(it.type, it.text, it.addln));
		}
		if(this.expandable) this.addMinusButton(this.rows);
		this.rows++;//this.rowcomps[this.rows]=[];
		return ret;
	} 
	

	
	addField(type, text, addln){
		this.type=type;
		var nitem, index=this.idnum++;
		if(type=="dropdown") nitem=new DropDown(this.container, this.id2+index);
		if(type=="link") nitem=new Link(this.container, this.id2+index);
		if(type=="span") nitem=new Span(this.container, this.id2+index);
		if(type=="input") {nitem=new DropDown(this.container, this.id2+index);nitem.convertToTextField();}
		if(nitem) {
			if(!this.valuecomp) this.valuecomp=[];
			this.valuecomp.push(nitem);this.rowcomps[this.rows].push(nitem);
			nitem.setCopyParentStyle(true);	
		//	nitem.addListener("onchange",function(){this.userchanged=true;}.bind(this));
			if(addln) {nitem.lncomp=new SimpleBR(this.container, this.id2+"br");this.rowcomps[this.rows].push(nitem.lncomp);}
		}
		if(text && nitem) nitem.setText(text);
		return nitem;
	} 
	/*	createElement(){
			if(this.tag) {
				this.element = document.createElement(this.tag);
				if(this.text) this.element.textContent=this.text;
				//this.element.innerHTML=this.text;	 	 
				this.parent.element.appendChild(this.element);			
			} else this.element=this.parent.element;
		}; */
	getSubComponent(i){
		return this.subitems[i];
	}
	
	updateElement(){
	//	if(this.container && this.container.subitems.length>0 && this.container.subitems[this.container.subitems.length-1].tag=="br") this.container.subitems[this.container.subitems.length-1].selfRmove();
		ComponentNode.prototype.updateElement.call(this);	// call base class method
	//	if(this.plusbutton) this.plusbutton.updateElement();
	}
		 
	
	
	
/*	updateHtml(){	// is deprecated
		this.html="<"+this.tag+this.getStyleHtml()+this.getAttributesHtml()+" id="+this.id+">";
		if(this.subitems[0]) this.html+=this.subitems[0].getHtml();
		this.html+=" : ";
		if(this.subitems[1]) this.html+=this.subitems[1].getHtml();		
		this.html+="</"+this.tag+">";
	}*/
}