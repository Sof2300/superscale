

 	

function getFontSize(priority){
	var fontsize="";
	if(priority==1) fontsize="120%";
	if(priority==2) fontsize="100%";
	if(priority==3) fontsize="90%";
	if(priority==4) fontsize="75%";
	if(priority==5) fontsize="65%";
	return fontsize;		
};

// format grabbing should be done separately
// format grabbing for leafs -> properties, tags
// format grabbing for non leaf  

//var componentrootnode; // will store the graph of components


class MyComponentManager {
	/**
   * @memberOf MyComponentManager
   */
	constructor(cnp, text, t,p){
		if(p["onefield"]) this.cn=new MyFlexibleComponent(cnp, text, t.includes("notitles"), p["expandable"]);
		else this.cn=new MyComponent(cnp, text, (t.includes("notitles") || p["notitles"]));
		
//		this.cn.setStyle("margin-leftt","5px");
		this.cn.freezeElement();
		this.t=t;this.p=p;	
	}
	setFont(v){this.cn.setStyle("font-size",v);}
	hide(){this.cn.setStyle("display","none");}
	
	updateElement(){this.cn.updateElement();}
	
	setTitle(t){
		if(!this.p.checkbox) t+=" :"; 
		this.cn.titlecomp.setText(t);
		this.cn.titlecomp.setStyle("fontStyle","italic");
	//	if(this.p["priority"]) this.cn.titlecomp.setStyle("font-size", getFontSize(this.p["priority"]));
		this.cn.titlecomp.setStyle("margin-right","5px");	
	}
	
	setTypeRO(value){	
				var t=this.t;				
				if(t.includes("link") && value.length>0) {
					var link;
					if(this.p.linkprefix) link=this.p.linkprefix
					this.cn.setType("link",value, this.p.postln, link);}
				else this.cn.setType("span",value, this.p.postln);
				if(!t.includes("notitles")) this.cn.valuecomp.setStyle("font-weight","bold");
			}
	
	setTypeButton(value,r){		
				this.cn.setType("button",value, this.p.postln, this.p.action);
				if(this.p.button) this.cn.valuecomp.setTarget(this.p.button,[],r.remoteServerCall.bind(r));	
			}
	
	hasTag(tn){if(this.t.includes(tn) || this.p[tn]) return true; else return false;};
	
	setTypeCheckBox(value, r){
		this.cn.setType("checkbox",value, this.p.postln);
		var comp=this.cn.valuecomp, renderer=this.renderer, target=this.p.target, cn=this.cn;
		if(target) this.cn.valuecomp.addListener("onchange",function(e){
			var current="0";
			if(comp.element.checked) current="1";
			if((comp.remotevalue==undefined && current!=comp.text && comp.text!=undefined) || (comp.remotevalue!=undefined && current!=comp.remotevalue) ) {
				renderer.remoteServerCall(target, [comp.id]);
			}
		});
		if(!this.hasTag("notitles")) this.cn.swapSubItems(0,1); 
		this.cn.valuecomp.updateElement();
	}
	
	setTypeRW(value){var t=this.t;		
		this.cn.setType("input",value, this.p.postln); 
		this.cn.valuecomp.setAttribute("size",value.length+5);
		this.cn.valuecomp.updateElement();
	}

	setTypeDropDown(value){var p=this.p;var t=this.t;	
				this.cn.setType("dropdown",value, p.postln);
		//		this.cn.valuecomp.setStyle("margin-right","5px");// I am not supposed to do that here, it should get it from the parent
				var subcomp=this.cn.getValueComponent();
				var list=p["choicelist"].split(",");
				for(var i in list) list[i]=list[i].trim();				
				subcomp.setOptions(value,list);
		 				
			 }
		
/*	parseVal(n,value){
		var vtab=value.split(";");
		for(var k in vtab){
			
		}
	}*/
	
	setTypeTable(value){
		var t=this.t;		
//		value="<b style=\"font-size:120%\">"+value;
//		value=value.replace("(","</b><br>")
		var s0=value.indexOf(":",6), s1=value.indexOf(";");
		var par=value.substring(s0+1,s1), val=value.substring(0,s0)+value.substring(s1);
		this.cn.setType("table",val, this.p.postln); 
		this.cn.valuecomp.setSubCaption(par);
		this.cn.valuecomp.setStyle("font-size","100%");
		this.cn.valuecomp.setAttribute("border","1");
		this.cn.valuecomp.updateElement();
				}
	
	setOneField(value){var NL=";";
				// if we have data and not multi, we simply make according to data
				// if we have no data or it is a multi, we make a preformatted field
				var p=this.p;var t=this.t, pref=0;
				if(value==undefined) value="";
				if(value.length==0 && p.prefill) {value=p.prefill;pref=1;}
				else if(p.multi>0){// multi keep a certain number of slots    // check if value too long or too short
					var n=1, i=value.indexOf(NL);
					while(i>=0) {n++;i=value.indexOf(";",i+1);}
					while(n>p.multi) {value=value.substring(0,value.lastIndexOf(NL));n--;}
					while(n<p.multi) {value+=NL+":";n++;}
				}
				if(this.p["priority"]) this.cn.container.setStyle("font-size", getFontSize(this.p["priority"]));
				
				var vtab=value.split(NL);
				for(var k in vtab){
					var vstab=vtab[k].split(":"), val="", key=vstab[0].trim();
					if(vstab[1]) val=vstab[1].trim();
					var type2="input";
					if(p.dependchoice) type2="dropdown";
					var comparray=this.cn.addRow([{type:"dropdown",text:key, addln:0},{type:type2,text:val, addln:0}]);
					var sc=comparray[0];			//need a different id
					if(pref) sc.toremove=1;
					var list=p["choicelist"].split(",");
					for(var i in list) sc.addOption(list[i].trim());
					sc.setSelected(key);
					//sc.updateElement();	
					var sc2=comparray[1]; 				//need a different id
					if(pref) sc2.toremove=1;
					if(type2=="input") sc2.setAttribute("size",val.length+5);
				//	sc2.setStyle("margin-left","3px");
					var that=this;		 

					function initcomps(array){
						var subcomp=array[0],subcomp2=array[1];			//need a different id
						if(p["dependchoice"]) {
							var v2=subcomp.element.value;
							var vcomp2=subcomp2.element.value;
							if(!vcomp2) vcomp2=val;
							list=that.getDependList(p["dependchoice"],v2);	 
							that.updateDependOptions.bind(this)(subcomp2,vcomp2,subcomp.id,list);
							subcomp.addListener("onchange",function(){
								var v=subcomp.element.value;
								var l=that.getDependList(p["dependchoice"],v);
								that.updateDependOptions.bind(this)(subcomp2,subcomp2.element.value,v,l); 
							 }.bind(this));
	 					}
					}
					initcomps(comparray);
					this.cn.onduplicate=initcomps
			 	}
	}
	getDependList(choice,depval){	//maybe parsing should happen in format
			var list=0, choices=choice.split(";");
			for(var i in choices){
				var field=choices[i].split(":");
				if(depval==field[0]) {list=field[1].split(",");break;}
			}	
			return list;
		}
		
	updateDependOptions(subcomp,value,depval,list){	
			if(list){ 
				subcomp.removeAttribute("size");
				subcomp.convertToDropDown();
				for(var i in list) list[i]=list[i].trim();				
				subcomp.setOptions(value,list);
				subcomp.updateElement();
			} else {
				subcomp.resetOptions();
				subcomp.convertToTextField();
				subcomp.setAttribute("size",value.length+5);
			}
				// we assume here that the trcked var exists at creation of this dependent link, or else we would have to keep a list and create it at later time (after end of creating ? at update ?) 				
		}
		
	setTypeDependingDropDown(value,tobj){
		var p=this.p;var t=this.t;
		var list,depval=p["depends"];
		if(p["dependchoice"]) {
			list=this.getDependList(p["dependchoice"],tobj[depval]);
			var valcomp=this.cn.setType("dropdown",value, !t.includes("nobr"));
			this.updateDependOptions.bind(this)(valcomp,value,p["depends"],list);
			var that=this;
			geid(depval).onchange=function(){
				var v=geid(depval).value;
				var l=that.getDependList(p["dependchoice"],v);
				that.updateDependOptions.bind(this)(this.cn.valuecomp,value,v,l); 
			 }.bind(this);
		/*	var depval= tobj[p["depends"]], choices=p["dependchoice"].split(";");
			if(list) {
				cn.setType("dropdown",value, !t.includes("nobr"));
				var subcomp=cn.getSubComponent(1);
				for(var i in list) subcomp.addOption(list[i].trim());
				subcomp.setSelected(value);
				geid(p["depends"]).onchange=function(){updateOptions();}	// we assume here that the trcked var exists at creation of this dependent link, or else we would have to keep a list and create it at later time (after end of creating ? at update ?) 
			}*/					
		}
	}
}






function applyFormat(compo,p){	 
 	if(p.priority) compo.setStyle("font-size",getFontSize(p.priority));
}


class ListContainer extends MyListComponent {
	constructor(text,tobj,node,parentcomp,tdesc){
		super(parentcomp,text,node.properties.link);
		var list;
		this.node=node;
		this.p=this.node.ancestorsProperties();
		this.t=this.node.ancestorsTags();
		this.setValues(tobj[text]);
		applyFormat(this,this.p);
		}
	setValues(val){
		this.val=val;
		if(val!=undefined){
			var linklist=[];
			var subitems=val.split(",");
			for(var o in subitems) {
				var sub=subitems[o].trim();//while(sub[0]==" ") sub=sub.substring(1,sub.length);	//trim	while(sub[sub.length]==" ") sub=sub.substring(0,sub.length-1);
				subitems[o]=sub;	 
				if(this.p.linkprefix) sub=this.p.linkprefix+sub;
				linklist.push(sub);
			}	
			this.setValueList(subitems,linklist);		
		}
	}
}







class Renderer {
	constructor(elem){
		this.element=elem;
		this.ptobj={};
	//	gcid=this.componentrootnode.getComponentById;
	}
	
 	remoteServerCall(target, components){
		var args={},ids=[];
		for(var k in components){
			 var comp=this.componentrootnode.getComponentById(components[k]);
			 if(comp && comp.getArguments) {args=Object.assign(args, comp.getArguments());ids=ids.concat(comp.getChildrenIds());} 
			 else {args[components[k]]=geid(components[k]).value;ids.push(components[k]);}			
		}
		console.log("setValue");
		var req="";
		if(!target) target="/setValue";
		var textargs="",fields=args;
		for(var k in args) {
			if(!textargs) textargs="?";
			else textargs+="&";
			textargs+=k+"="+args[k];
		}
		console.log("setValue requesting :"+target+ textargs);
		disenableload(target+ textargs,ids);
		//	disenableload("/setLimit?limit="+geid("limit").value,["limit"]);
	};
		
	createMyComponent(tobj,tdesc, cnp, text,p,t, val, adesc){	
			var mcm=new MyComponentManager(cnp,text,t,p);
			mcm.renderer=this;		
			if(p["priority"]) mcm.setFont(getFontSize(p["priority"]));
			if(tobj[text]==undefined && val==undefined && !t.includes["RW"] && p["RW"]==undefined && !p.button) mcm.hide();// cn.setStyle("display","none");

			var value="";
			if(val!=undefined) value=val;
			else if(tobj[text]!=undefined) value=""+tobj[text];
			if(value.length>0) {	// do not apply suffix & prefix to ""
				if(p["suffix"]) value+=p["suffix"];
				if(p["prefix"]) value=p["prefix"]+value;		  
	//			if(value.length==0 && p && p.default ) value=p.default; 				
			}
	
			var desc;
			if(adesc) desc=adesc;
			else desc=tdesc[text];
			if(!desc) desc=text;
			if(!t.includes("notitles") && !p["notitles"]) mcm.setTitle(desc);
			if(p["onefield"]) mcm.setOneField(value,tobj);
			else if(p["table"]) mcm.setTypeTable(value,tobj);
			else if(p["button"]) mcm.setTypeButton(desc,this);
			else if(p["checkbox"]) mcm.setTypeCheckBox(value,this);
			else if(p["dependchoice"]) mcm.setTypeDependingDropDown(value,tobj);
			else if(p["choicelist"]) mcm.setTypeDropDown(value); 
			else if(t.includes("RW") || p["RW"]) mcm.setTypeRW(value);
			else mcm.setTypeRO(value); 
			mcm.updateElement();
			
			return mcm.cn;
		};

	
	create(tobj,tformat, tdesc){
		
		function createTitle(cn,node){
			var	cn2=new SimpleBR(cn);
			//var	cn2=new ComponentNode(cn);
			//cn2.setTag("br");
			
			var title=new SimpleText(cn);
/*		  	if(node.properties["priority"]) {	// maybe the title should not be depnding on priority but fixed size ?
				title.setStyle("font-size",getFontSize(node.properties["priority"]));
				cn2.setStyle("font-size",getFontSize(node.properties["priority"]));
			} 
*/			title.setStyle("font-weight","bold");
			title.setStyle("color","lightgray");
			title.setText(node.properties["title"]);
			cn=new ComponentNode(cn);
			cn.setStyle("margin-left","5%");
			cn.setTag("div");	
			return cn;	
		}
		function createIndent(cn,node,indent){
			cn=new ComponentNode(cn);	// do we really need to create a new ?
			var v=5;
			if(indent) v=v*indent;
			cn.setStyle("margin-left",""+v+"%");
			cn.setTag("div");	
			return cn;	
		}	
		
		function createButton(cn,node){
			var et;
			if(cn.subitems ){
				et=cn.subitems[cn.subitems.length-1].element;
				var lastitem=cn.subitems[cn.subitems.length-1];
				var lastlast=lastitem.subitems[lastitem.subitems.length-1];
				if(lastlast.tag=="br") lastlast.selfRemove();			
			}
			/*var space=new SimpleText(cn);
			space.setStyle("padding-left",".5em");
			space.setText("");*/
			var button=new Button(cn,0);//,this.setValue.bind(this));
	//		button.setStyle("margin","5px");
			button.selfId();
			button.onclick=this.remoteServerCall.bind(this);
			var action;
			action=node.getProperty("action");
			if(node.properties["priority"]) button.setStyle("font-size",getFontSize(node.properties["priority"]));
			
			if(!action) action="/set";
			if(action && tdesc[action]) button.setText(tdesc[action]);
			else button.setText("set");
			var names= node.getDescendentTextByTag("RW");
			names=names.concat(node.getDescendentByProperty("RW"));
			if(node.hasDescendentProperty("onefield")) names=names.concat(node.getDescendentByProperty("onefield",1));	
	//		if(node.hasDescendentProperty("checkbox")) popo;
			button.setTarget(action, names,this.remoteServerCall.bind(this));
			if(node.hasDescendentProperty("checkbox"))	// switch button with previous
				cn.element.insertBefore(button.element,et);
		}
	
		function recurse2(parentcomp, node){
			if(!node) node=new FormatNode(tformat);  
			
			if(node.isleaf)	{
				if(node.tags.includes("list")){
					var cont=new ListContainer(node.text, tobj,node,parentcomp,tdesc);
				} else this.createMyComponent(tobj,tdesc, parentcomp,node.text,node.ancestorsProperties(),node.ancestorsTags());	
			}	
			else {
				var cn=new ComponentNode(parentcomp);
				if(node.hasonlyleafs) cn.setTag("div");	//					if(node.properties["priority"]) cn.setStyle("font-size",getFontSize(node.properties["priority"]-1)); //maybe proprties should be inherited and ancestor properties applied
				
				if(node.properties["title"]) cn=createTitle(cn,node);	 
				if(node.properties["indent"]) cn=createIndent(cn,node,node.properties["indent"]);
				if(node.properties["float"]) cn.setStyle("float",node.properties["float"]);
				
				var subs=node.getChildrenList();
				for(var subi in subs) {
					var subnode=subs[subi];
					var cn2=cn;
					if(!node.hasonlyleafs && subnode.isleaf) {
						cn2=new ComponentNode(cn);
						cn2.setTag("p"); 
					}
					recurse2.bind(this)(cn, subnode);
				}	   		
				if(node.hasonlyleafs && (node.hasDescendentTag("RW",1)|| node.hasDescendentProperty("RW",1))) {
				//	if(cn.element.lastElementChild.tagName=="BR") cn.element.removeChild(cn.element.lastElementChild);	// remove last <br>
//					if(cn.subitems && cn.subitems[cn.subitems.length-1].tag=="br") cn.subitems[cn.subitems.length-1].selfRemove(); 
					createButton.bind(this)(cn,node);
				}    
				console.log();
			}	
			
		};
		
		this.componentrootnode=new ComponentNode();
		this.componentrootnode.setElement(this.element);
		recurse2.bind(this)(this.componentrootnode);
	
		this.ptobj=Object.assign({}, tobj);;
	
	};


	getValueFromFormat(key, val, format){
		var fn=new FormatNode(format);
		return fn.getFormattedValue(key, val);
	}
	
	getFormat(key, format){
		var fn=new FormatNode(format);
		return fn.getFormatNode(key);
	}
 
	update(tobj, tformat, tdesc	){		// this part should be done through component and not directly like that
		//	tobj=jsondata;
		tformat=jsonformat;
		var that=this;
		
		function showItem(n,v){
			// get format of current object
			// is type is dropdown, make special update:1. check if the same and selection did not change2. if changed recontruct							
			var item=geid(n);
			if(!item) {console.log("Renderer::update showItem n invalid id");return;}	// should we display an error ?
			var item2=geid(n+"title");
			if(!item2) {console.log("Renderer::update showItem v invalid id");return;}
			if(v && item.style["display"]=="none") {item.style["display"]="";item2.style["display"]="";}	//+title
			if(!v && item.style["display"]!="none") {item.style["display"]="none";item2.style["display"]="none";}	//+title
		}
		
		function updatedropdown(id, value, format, sub){
			var comp=that.componentrootnode.findComponentById(id);
			if(!comp) return;
			var list=format.choicelist.split(",");
			for(var i in list) list[i]=list[i].trim();
			comp.updateOptions(value,list);
			return comp;
		}
		/*
		function updateList(id,value, node){
			// find existing components representing the var
			var i=0;  
			var it=this.componentrootnode.getComponentById(id+i), fit=it;
			while(it) {i++;it=this.componentrootnode.getComponentById(id+i);}
			// break variable into field
			var fieldtab=value.split(",");
			for(var k in fieldtab) fieldtab[k]=fieldtab[k].trim();

			// create the inexisting fields	// or remove the extra ones
			while(fieldtab.length<i) {this.componentrootnode.getComponentById(id+(i-1)).selfRemove();i--;}
			while(fieldtab.length>i) {
				createMyComponent(tobj,tdesc,fit.parent,id+i,node.ancestorsProperties(),node.ancestorsTags(),fieldtab[i],tdesc[node.text]+" "+i);
				i++;
				}
			// update all field
			for(var k in fieldtab) {
				var ut=this.componentrootnode.getComponentById(id+k);
				ut.setText(fieldtab[k]);
			}
		}
		*/
		function up(id,value){
			var NL=";";
			var ft=this.getFormat(id, jsonformat);
			//console.log(ft);
			if(ft && ft.tags.includes("list")) {
				var comp=this.componentrootnode.getComponentById(id);
				if(comp) comp.setValues(value);
				return;}
			
			var mycomp=this.componentrootnode.getComponentById(id);
			if(ft && ft.properties && ft.properties.onefield){
					var p=ft.properties;
					if(p.multi>0){// multi keep a certain number of slots    // check if value too long or too short
						var n=1, i=value.indexOf(NL);
						while(i>=0) {n++;i=value.indexOf(";",i+1);}
						while(n>p.multi) {value=value.substring(0,value.lastIndexOf(NL));n--;}
						while(n<p.multi) {value+=NL+":";n++;}
					}
					mycomp.updateFields(parseListToObjectArray(value), !mycomp.isUserChanged());// we could instead compare old data and new data to see if there is a change
				return;
			}
			if(ft &&  ft.ancestorsProperties("table")) {
				var s0=value.indexOf(":",6), s1=value.indexOf(";");
				var par=value.substring(s0+1,s1), val=value.substring(0,s0)+value.substring(s1);
				mycomp.setText(val);
				mycomp.setSubCaption(par);
				return;
			}
			if(ft) if("choicelist" in ft.properties) {updatedropdown.bind(this)(id,value,ft.properties);}
			else if(mycomp){
				//showItem(id, true);
				if(mycomp.updateText) mycomp.updateText(value);
				else mycomp.setText(value);	
			}
			//var item=geid(id);
/*			if(item.value!=undefined) {	if(ptobj[id]==undefined || item.value==ptobj[id]) item.value=value;	//only if user didnt change it
			}
			else item.innerText=value;*/
		}
		for(var k in tobj){
			var val=this.getValueFromFormat(k,tobj[k], jsonformat);
			if(tobj[k]!=ptobj[k]) up.bind(this)(k,val);	// shouln't we use component ?'or not ?	 to improve, we could fetch the ComponentNode and use its methods to update (maybe my component could act as a whole capture the keyword and update its two subcomponents)
		}
		for(var k in ptobj)	if(tobj[k]==undefined) showItem(k, false);
		
		ptobj=tobj;
	}
}
