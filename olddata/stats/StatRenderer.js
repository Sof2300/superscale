////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function removeDuplicates(array){
	var copy=[];
	for(let i in array){
		let copytest=true;
		for(let j in copy) if(array[i]==copy[j]) {copytest=false;break;}
		if(copytest) copy.push(array[i]);
	}
	return copy;}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var knowncommands=["present", "solo"];	// to move in group definition parsing file
function checkFilterSyntax(text){
	if(!text.indexOf(":")) return "symbol not found ':'";
	let subs=text.split(";");
	for(let si in subs){ let su=subs[si];
		if(!su.indexOf(":")) return "line "+si+": symbol not found ':'";
		let tokens=su.split(":");
		if(tokens.length<2) return "line "+si+": tokens number too small";
		let command=tokens[0].trim(), args=tokens.slice(1), found=false;
		for(let i in args) args[i]=args[i].trim();
		for(let c of knowncommands) if(c==command) {found=true;break;}
		if(args.length<1) return "line "+si+": not enough arguments, 1 required, found only "+args.length;
		if(args[0].length==0) return "line "+si+": first argument required non void";
		if(!found) return "line "+si+": unknown command :"+command;
		// beyond that point we need to access to the group definition if we want to check more errors
	}
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class StatFilterView{
	constructor(rootcomp,rendererview) {
		this.rendererview=rendererview;
		this.basecomponent = new DivItem(rootcomp);
		this.basecomponent.setStyle("border","solid");
		this.basecomponent.setStyle("border-width","1px");
		this.basecomponent.setStyle("padding","8px");
		//	this.basecomponent.setStyle("margin-top","15px");
		this.basecomponent.setStyle("margin-bottom","15px");
		this.filtertitlecomp=new Span(this.basecomponent,"statfiltertitlecomp");
		this.filtertitlecomp.setStyle("font-size","80%");
		this.filtertitlecomp.setText("Filters:");
		this.filtervalcomp=new Input(this.basecomponent,"statfiltervalcomp");
		this.filtervalcomp.setStyle("size","fit-content");
		this.filtervalcomp.activebgcolorborder="E6E6FA";
		this.filtervalcomp.activebgcoloroutline="87CEFA";
		this.filtervalcomp.activebgcolor="F8FFF8";
		this.filtervalcomp.addListener("onkeyup",this.keyup.bind(this));

		this.filterbuttoncomp=new Button(this.basecomponent,"statfilterbuttoncomp");
		this.filterbuttoncomp.setText("set");

		this.filterbuttoncomp.setCallback(this.buttonpress.bind(this));
	//	this.filterbrcomp=new SimpleBR(this.basecomponent);

		this.filtermessagecomp=new DivItem(this.basecomponent,"statfiltermessagecomp");
		this.filtermessagecomp.setStyle("font-size","70%");
		this.filtermessagecomp.setStyle("font-style","italic");
		this.filtermessagecomp.setStyle("margin-left","1em");
		this.filtermessagecomp.setStyle("margin-top","0.55em");
		this.filtermessagecomp.setStyle("margin-bottom","0.35em");
		//this.filtermessagecomp.setStyle("float","right");
		this.filtermessagecomp.setText("no filters defined");
		//	this.br=new SimpleBR(this.basecomponent,"statfilterbr");
	}

	keyup(e){
		if(e.keyCode==13) this.buttonpress();
		else this.checkSyntax();
//		if(e.keyCode==13 && m) this.rendererview.updateFilters(this.filtervalcomp.element.value);
	}

	checkSyntax(){
		if(this.filtervalcomp.element.value.length==0) return;
		let m=checkFilterSyntax(this.filtervalcomp.element.value);
		if(m) {
			this.filtermessagecomp.setText(m);
			this.filtervalcomp.setStyle("color","tomato");
		} else {
			this.filtermessagecomp.setText("");
			this.filtervalcomp.setStyle("color","black");
		}
		return m;
	}

	buttonpress() {
		let m = this.checkSyntax();
		if (!m) {
			this.rendererview.updateFilters(this.filtervalcomp.element.value);
			this.filtervalcomp.remotevalue=this.filtervalcomp.element.value;
			this.filtervalcomp.updateBG();
		}
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class StatVarSelectView {
	constructor(rootcomp,callback, allvarnames) {
		this.callback=callback;
		this.basecomponent = new DivItem(rootcomp);
		this.basecomponent.setStyle("border","solid");
		this.basecomponent.setStyle("border-width","1px");
		this.basecomponent.setStyle("padding","10px");
		this.varselecttitlecomp=new Span(this.basecomponent,"statvarselecttitlecomp");
		this.varselecttitlecomp.setStyle("vertical-align"," top");
		this.varselecttitlecomp.setText("Select Variables:");
		this.varselecttitlecomp.setStyle("font-size","80%");
		this.varselectcomp=new Select(this.basecomponent,"statvarselectcomp");
//		this.varselectcomp.setStyle("size","fit-content");
		// /let varnames=["hello","my","friend"];
		//let varnames=["totalharvest","totalBE","firstflushharvest","firstflushBE"];
		this.allvarnames=allvarnames;
		this.varselectcomp.setOptions(allvarnames);
		this.varselectcomp.setAttribute("size",allvarnames.length);
		this.varselectcomp.setAttribute("multiple","1");
		this.varselectcomp.addListener("onchange",this.selected.bind(this));
	}
	selected(e){
		let names=[];
		let selection=this.varselectcomp.getSelection();
		for(let sel of selection) names.push(sel.text);
		if(names.length>0) this.callback(names);
	}

	setSelectedNames(names){
		for(let n of names) this.varselectcomp.select(n);
	};
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class StatRendererView{
	constructor(rootelem,classifier,allvarnames) {
		this.classifier=classifier;
		this.componentrootnode = new ComponentNode();
		this.componentrootnode.setElement(rootelem);

		this.linkdownload=new Link(this.componentrootnode);
		this.linkdownload.setText("download","data.txt");
		this.linkdownload.setAttribute("download","data");
		this.linkdownload.setStyle("float","right");
		this.linkdownload.setStyle("font-size","70%");
		this.linkdownload.setStyle("margin","5px");
		this.linkview=new Link(this.componentrootnode);
		this.linkview.setText("view","data.txt");
		this.linkview.setStyle("float","right");
		this.linkview.setStyle("font-size","70%");
		this.linkview.setStyle("margin","5px");
		this.linkview.setAttribute("target","_blank");//target="_blank"
		this.linkedit=new Link(this.componentrootnode);
		this.linkedit.setText("edit groups","edit.html?fileurl=testgroups.txt");
		this.linkedit.setStyle("float","right");
		this.linkedit.setStyle("font-size","70%");
		this.linkedit.setStyle("margin","5px");
		this.linkedit.setAttribute("target","_blank");//target="_blank"

		this.filterview=new StatFilterView(this.componentrootnode,this);
		this.varselectview=new StatVarSelectView(this.componentrootnode,this.setVarNames.bind(this),allvarnames);

		this.buildView();
		this.listview = new StatListView(this.componentrootnode, classifier);
		//this.listview.setVarNames(this.vars);
	}
	setVarNames(names) {this.vars=names;this.listview?.setVarNames(names);this.varselectview?.setSelectedNames(this.vars);this.updateData(this.data,this.classifierData);}
	updateFilters(filtertext){
		this.classifier.updateExtraFilters(filtertext);
		this.updateData(this.data,this.classifierData);
	}

	updateData(data,classifierData){
		if(!data) return;
		let changed=false;
		this.data=data;
		this.blockcollection =new BlockCollection(data);
		this.classifierData=classifierData;

		this.statresult=classifier.makeResult(this.blockcollection.blocklist,classifierData,this.vars);
		changed=true;
		this.updateDisplay();
		this.listview.updateDisplay();//this.listview.selectedanovaname, this.listview.selectedgroupname);
	}

	updateDisplay(){this.updateResult(this.statresult);};

	updateResult(data){
		this.statresult = data;
		let aSelected=this.tablecomp.getSelectModel().getActives(), sSelected=[];// save selected texts
		for(let a of aSelected) sSelected.push(a.text);
		this.tablecomp.clearInteractive();										// clear highlighted cells
		let tabledata=this.buildTableDataObj();									// update table
		this.tablecomp.setTableContent(tabledata);
		for(var t in tabledata){
			var l=0;
			for(var h in tabledata[t].hovergroups){this.tablecomp.makeInteractive(t,0,Number(h)+1);l=h;}	//+2 to skip the headers
			this.tablecomp.makeInteractive(t,0,Number(l)+2);	// make interactive all column
		}
//		var gn=0;
//		for(var i=1;i<(gn+2);i++) this.tablecomp.makeInteractive(0,0,i);
		for(let t of sSelected) {// save selected and select it again if possible or else select all
			let cell=this.tablecomp.findCellByProperty("text",t);
			if(!cell) cell=this.tablecomp.findCellByProperty("text","All");
			if(cell) this.tablecomp.selectCell(cell);
		}
	}

	selected(cell,state){
		this.listview.clearGroupSelection();
		if(!state) {this.listview.updateDisplay();return;}
		let anovaname=this.statresult[cell.coords.t].name;	// get the test name
		let grps=this.statresult[cell.coords.t].groups, gn=0, groupname, groupnumber=cell.coords.c-1; // get the group name
		for(let i in grps) {
			if(grps[i].included) {
				if(gn==groupnumber) {groupname=grps[i].name;break;}
				gn++;}
		}
		this.listview.updateDisplay(anovaname,groupname);
	}

	buildView() {
		this.tablecomp=new InteractiveMultiTable(this.componentrootnode,"stattable");
		this.tablecomp.setStyle("font-size","65%");
		this.tablecomp.setSelectListener(this.selected.bind(this));
	}

	buildTableDataObj(){
 		function findObjWithPropInList(val,propname,list){
			for (var i in list) if(val==list[i][propname]) return list[i];
			return undefined;
		}

		var alltabledata=[];
		for(var t in this.statresult){
			let dat=this.statresult[t], gh=this.getGroupHeadersWithCount(dat.groups);
			var tabledata={};
			tabledata.hovergroups={};
			tabledata.caption=dat.title;
			tabledata.subcaption=this.textListGroups(dat.groups);
			tabledata.headers=[""];
			tabledata.headers=tabledata.headers.concat(gh);
			tabledata.headers.push("All (n:"+dat.data[0].count+")","Sign.Diff","Ordered");
			//tabledata.headers.push("Sign.Diff");
			tabledata.rows=[];
			let vars = dat.data;
			for (var v in vars) {
				let line="", vobj=vars[v];
				line=[vobj.varname];
				var includedcount=0;
				for(var g in dat.groups) {
					let fobj=findObjWithPropInList(dat.groups[g].name,"name",vobj.ordered);
					if(fobj) line.push(fobj.average.toPrecision(2)+String.fromCharCode(97 +fobj.signifgroup));
					if(dat.groups[g].included) {tabledata.hovergroups[includedcount]=dat.groups[g];includedcount++;}
				}
				let alltext=vobj.average.toPrecision(2);//+" (n:"+vobj.count+")";
				line.push(alltext);
				let fdiff="",comp="<";
				if(vobj.signifdiff) {
					fdiff+= "YES";
					comp=">=";
				} else fdiff+="NO";
				fdiff+=" ("+vobj.testF.toPrecision(3)+comp+vobj.tableF.toPrecision(3)+")";
				line.push(fdiff);
				let ordtext="";
				for(var o in vobj.ordered){
					let go=vobj.ordered[o];
					let fobj=findObjWithPropInList(go.name,"name",dat.groups);
					if(fobj) {
						if(o>0) {if(go.signifgroup==vobj.ordered[o-1].signifgroup) ordtext+=" >= "; else ordtext+=" > ";}
						ordtext+=fobj.shorttitle;//+"("+go.average.toPrecision(2)+")";
					}
				}
				line.push(ordtext);
				tabledata.rows.push(line);
			}
			alltabledata.push(tabledata);
		}

		return alltabledata;
	};

	textListGroups(groups){
		var res="";
		for(var g in groups) {
			if(!groups[g].included) continue;
			if(res.length>0) res+=", "
			res+=groups[g].shorttitle+":"+groups[g].title;
		}
		var excluded="";
		for(var g in groups) {
			if(groups[g].included) continue;
			if(excluded.length>0) excluded+=", "
			excluded+=groups[g].shorttitle+":"+groups[g].n;
		}
		if(excluded.length>0) res+=" (excluded: "+excluded+")";
		return res;
	}

	getGroupHeadersWithCount(groups) {
		var res = [];
		for (var g in groups) {
			if (!groups[g].included) continue;
			res.push(groups[g].shorttitle+" (n:"+groups[g].n+")");
		}
		return res;
	}

	getGroupHeaders(groups) {
		var res = [];
		for (var g in groups) {
			if (!groups[g].included) continue;
			res.push(groups[g].shorttitle);
		}
		return res;
	}
};






/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class StatListView{
	constructor(rootcomp,classifier) {
		this.basecomponent = new ComponentNode(rootcomp);
		this.blockinfonames=["id","species","blockdate","substrate","totalharvest","totalBE"];
		//this.varnames=["totalharvest","firstflushharvest","totalBE","firstflushBE"];
		this.classifier=classifier;
		this.extramodel=new SelectModel(1,true);
		this.extramodel.changeListener=this.selectedCell.bind(this);
		let defbg="lightyellow", highlightbg="LightSkyBlue", selectedbg="LightSeaGreen" ;
		var selectstylemap={
			0:{"background-color":defbg},
			1:{"background-color":selectedbg}
		};
		this.extramodel.setStyleMap(selectstylemap);
	}

	selectedCell(e,v) {
		console.log(e);
		if(e.text==this.sortingcolumn) this.sortingcolumn=0;
		else {
			var found=this.headers.find(h=>h==e.text);
			if(found) this.sortingcolumn=e.text;
		}
		this.updateDisplay(this.selectedanovaname,this.selectedgroupname);
		// update and sort the data
		return;
	}

	selected(e,v){
		let comp=this.basecomponent.findComponentById(e.id);
		if(!comp) return;
		for(let b of this.datalist){
			if(b.id== comp.subitems[0].text) {
				this.selectedblock=b;
				if(!this.detailview) this.detailview = new StatBlockView(this.basecomponent);
				this.detailview.showBlock(b);
				break;
			}
		}
	}

	setVarNames(names) {this.varnames=names;if(this.data) this.updateData(this.data,this.classifierData);}
	clearGroupSelection(){this.selectedanovaname=0;this.selectedgroupname=0;};

	updateDisplay(anovaname,groupname){
		if(!anovaname && this.selectedanovaname) anovaname=this.selectedanovaname;
		if(!groupname && this.selectedgroupname) groupname=this.selectedgroupname	;
		if(this.tablecomp) this.tablecomp.clearRowInteracters();
		if(!anovaname) {this.showList(this.classifier.getAllBlockList(),"All tests - All groups");return;}	//with all blocks
		let anovadesc="", groupdesc="";
		this.selectedgroupname=groupname;
		this.selectedanovaname=anovaname;
		let blocklist=this.classifier.getBlockList(anovaname,groupname);
		if(groupname && blocklist.length>0)  {
			let anovadesc= this.classifier.tests[anovaname].description
			let groupobj= this.classifier.tests[anovaname].groups[groupname];
			let groupdesc=groupobj.shorttitle+": "+groupobj.description;
			let t=new Date().getTime();
			this.showList(blocklist,anovaname+":"+anovadesc+" - "+groupdesc);
			let t2=new Date().getTime();
			console.log("group change time:"+(t2-t));
		} else {
			let anovadesc= this.classifier.tests[anovaname].description
			let blocklist=this.classifier.getBlockList(anovaname);
			let t=new Date().getTime();
			this.showList(blocklist,anovaname+":"+anovadesc+" - All");
			let t2=new Date().getTime();
			console.log("group change time:"+(t2-t));
		}

		if(this.selectedblock){
			var cell=this.tablecomp.findCellByProperty("text",this.selectedblock.get("id"));
			if(cell) this.tablecomp.selectRow(cell.parent);
			//else this.selectedblock=0;
		}
	}

	buildView(){
		this.tablecomp=new InteractiveTable(this.basecomponent,"statlisttable");
		this.tablecomp.setStyle("font-size","65%");
		this.tablecomp.selectListener=this.selected.bind(this);
	}

	showList(data,title){
		this.datalistoriginal=data;
		for(let v in data) data[v].info["groups"]=this.classifier.getBlockGroups(data[v].getInfo("id"));
		if(this.sortingcolumn) this.datalist=this.sort(data,this.sortingcolumn);
		else this.datalist=data;
		if(!this.tablecomp) this.buildView();
		let tabledata= this.prepareData(this.datalist,title);

		this.tablecomp.setTableContent(tabledata);
		this.tablecomp.getHeaderRowComponent().setStyle("font-size","80%");
		this.tablecomp.makeInteractiveRows();

		for(var k in tabledata.headers) this.tablecomp.makeInteractive(0,Number(k),this.extramodel);
	}

	sort(data,columnname){
		var data2=[];
		for(var d in data) data2.push(data[d]);

		let bubbling=true;
		while(bubbling){
			bubbling=false;
			let toswap=-1;
			for(var i=0;i<data2.length;i++) if(i+1<data2.length){
					let b1= data2[i].getInfo(columnname),b2=data2[i+1].getInfo(columnname);
					if(b1==undefined) b1="";
					if(b2==undefined) b2="";
					let b=b1.toLowerCase()<b2.toLowerCase();
				//	console.log("i:"+i+" :"+b);
					if(b) {toswap=i;break;}
				}
			if(toswap>=0) {
				var elem=data2[toswap];
				data2.splice(toswap,1);
				data2.splice(toswap+1,0,elem);
				bubbling=true;
			}
		}
		return data2;

	}


	formatValue(val){
		if(val && typeof val=="number") {if((val-Math.floor(val)>0)) val=val.toPrecision(2);}
		if(val===undefined) val="-";
		return val;
	}

	prepareData(data,title){
		var res={};
		res.caption=title;
		this.headers=this.blockinfonames.concat(this.varnames);//[""].concat(this.blockinfonames);
		this.headers=removeDuplicates(this.headers);
		this.headers.push("groups");
		res.headers=this.headers;
		res.rows=[];
		for(let i in data) {
			let dv=data[i],line=[];
			for(let n in res.headers) {
				let val=dv.getInfo(res.headers[n]);
				if(!val) val=dv.getInfo(res.headers[n]);
				val=this.formatValue(val);
//				if(res.headers[n]=="group") line.push(this.classifier.getBlockGroups(dv.getInfo("id")));				else
				line.push(val);
			}

			res.rows.push(line);
		}
		return res;
	};
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class StatBlockView {
	constructor(rootcomp) {
		this.prebr=new SimpleBR(rootcomp,"statblockbr");
		this.basecomponent = new ComponentItem(rootcomp);
		this.basecomponent.setTag("div");
		this.basecomponent.setStyle("width","fit-content");
		this.basecomponent.setStyle("border","solid");
		this.basecomponent.setStyle("border-color","lightgray");
		this.basecomponent.setStyle("border-width","3px");
		this.viewcomps={};

		this.basecomponent.setStyle("text-align","center");
		this.viewcomps.id=new ComponentItem(this.basecomponent,"statblockid");
		this.viewcomps.id.setTag("h4");
		this.viewcomps.id.setStyle("font-size","110%");
		this.viewcomps.id.setStyle("margin",".5em");
		this.viewcomps.infos=new DivItem(this.basecomponent,"statblockinfos");
		//	this.viewcomps.infos.setStyle("text-align","center");
		this.viewcomps.infosspeciestitle=new Span(this.viewcomps.infos,"statblockinfosspeciestitle");
		this.viewcomps.infosspeciestitle.setStyle("font-size","70%");
		this.viewcomps.infosspeciestitle.setText("Species:");
		this.viewcomps.infosspecies=new Span(this.viewcomps.infos,"statblockinfosspecies");
		this.viewcomps.infosspecies.setStyle("font-weight","bold");

		this.viewcomps.infosdatetitle=new Span(this.viewcomps.infos,"statblockinfosdatetitle");
		this.viewcomps.infosdatetitle.setStyle("font-size","70%");
		this.viewcomps.infosdatetitle.setText(", Date:");
		this.viewcomps.infosdate=new Span(this.viewcomps.infos,"statblockinfosdate");

		this.viewcomps.br2=new SimpleBR(this.viewcomps.infos,"statblockbr2");
		this.viewcomps.br2b=new SimpleBR(this.viewcomps.infos,"statblockbr2b");

		this.viewcomps.infossubstratetitle=new Span(this.viewcomps.infos,"statinfossubstratetitle");
		this.viewcomps.infossubstratetitle.setStyle("font-size","70%");
		//	this.viewcomps.infossubstratetitle.setText("Substrate");
		this.viewcomps.infossubstrate=new Span(this.viewcomps.infos,"statinfossubstrate");
		this.viewcomps.infossubstrate.setStyle("font-size","70%");
		this.viewcomps.infossubstrate.setStyle("font-style","italic");

		this.viewcomps.br3=new SimpleBR(this.viewcomps.infos,"statblockbr3");
	//	this.viewcomps.br4=new SimpleBR(this.viewcomps.infos,"statblockbr4");

		this.viewcomps.calcs=new DivItem(this.basecomponent,"statblockcalcs");
		this.viewcomps.calcs.setStyle("margin","15px");
		this.viewcomps.calcstotalharvesttitle=new Span(this.viewcomps.calcs,"statcalcstotalharvesttitle");
		this.viewcomps.calcstotalharvesttitle.setStyle("font-size","65%");
		this.viewcomps.calcstotalharvesttitle.setStyle("font-style","italic");
		this.viewcomps.calcstotalharvesttitle.setStyle("margin","10px");
		this.viewcomps.calcstotalharvesttitle.setText("Total harvest:");
		this.viewcomps.calcstotalharvest=new Span(this.viewcomps.calcs,"statcalcstotalharvest");

		this.viewcomps.calcsflushestitle=new Span(this.viewcomps.calcs,"statcalcsflushestitle");
		this.viewcomps.calcsflushestitle.setStyle("font-size","65%");
		this.viewcomps.calcsflushestitle.setStyle("font-style","italic");
		this.viewcomps.calcsflushestitle.setText(", Flushes:");
		this.viewcomps.calcsflushes=new Span(this.viewcomps.calcs,"statcalcstotalharvest");
		new SimpleBR(this.viewcomps.calcs);

		this.viewcomps.calcstotalsubstratetitle=new Span(this.viewcomps.calcs,"statcalcstotalsubstratetitle");
		this.viewcomps.calcstotalsubstratetitle.setStyle("font-size","65%");
		this.viewcomps.calcstotalsubstratetitle.setStyle("font-style","italic");
		this.viewcomps.calcstotalsubstratetitle.setStyle("margin","10px");
		this.viewcomps.calcstotalsubstratetitle.setText("Total substrate:");
		this.viewcomps.calcstotalsubstrate=new Span(this.viewcomps.calcs,"statcalcstotalsubstrate");
		this.viewcomps.calcstotalsubstrate.setStyle("font-size","90%");

		this.viewcomps.calcstotalBEtitle=new Span(this.viewcomps.calcs,"statcalcstotalBEtitle");
		this.viewcomps.calcstotalBEtitle.setStyle("font-size","65%");
		this.viewcomps.calcstotalBEtitle.setStyle("font-style","italic");
		this.viewcomps.calcstotalBEtitle.setStyle("margin","10px");
		this.viewcomps.calcstotalBEtitle.setText(", Total BE:");
		this.viewcomps.calcstotalBE=new Span(this.viewcomps.calcs,"statcalcstotalBE");
		this.viewcomps.calcstotalBE.setStyle("font-size","90%");

		this.viewcomps.br5=new SimpleBR(this.viewcomps.calcs,"statblockbr5");



		this.viewcomps.calcsfirstflushtitle=new Span(this.viewcomps.calcs,"statcalcsfirstflushtitle");
		this.viewcomps.calcsfirstflushtitle.setStyle("font-size","55%");
		this.viewcomps.calcsfirstflushtitle.setStyle("font-style","italic");
		this.viewcomps.calcsfirstflushtitle.setText("1st flush :");
		this.viewcomps.calcsfirstflush=new Span(this.viewcomps.calcs,"statcalcsfirstflush");
		this.viewcomps.calcsfirstflush.setStyle("font-size","80%");
		this.viewcomps.calcsfirstflushBEtitle=new Span(this.viewcomps.calcs,"statcalcsfirstflushBEtitle");
		this.viewcomps.calcsfirstflushBEtitle.setStyle("font-size","55%");
		this.viewcomps.calcsfirstflushBEtitle.setText(", 1st flush BE :");
		this.viewcomps.calcsfirstflushBEtitle.setStyle("font-style","italic");
		this.viewcomps.calcsfirstflushBE=new Span(this.viewcomps.calcs,"statcalcsfirstflushBE");
		this.viewcomps.calcsfirstflushBE.setStyle("font-size","80%");
		this.viewcomps.history=new DivItem(this.basecomponent,"statblockhistory");
		this.viewcomps.history.setStyle("font-style","italic");
		this.viewcomps.history.setStyle("font-size","65%");
		this.viewcomps.history.setStyle("text-align","left");
		this.viewcomps.history.setStyle("margin","15px");

	}


	showBlock(block){
		function minusifnotfound(arg,unit){
			let tsub=block.get(arg);
			if(!tsub) tsub="-";
			else if(unit) tsub+=unit;
			return tsub;
		}

		console.log(block);
		this.viewcomps.id.setText(block.id)
		this.viewcomps.infosspecies.setText(minusifnotfound("species"));
		this.viewcomps.infosdate.setText(minusifnotfound("blockdate"));
		let sub=block.get("substratetext");
		if(!sub) sub="-";

		sub=sub.replaceAll(";","\n");
		this.viewcomps.infossubstrate.setText(sub);

		this.viewcomps.calcstotalharvest.setText(minusifnotfound("totalharvest","g"));
		this.viewcomps.calcstotalsubstrate.setText(minusifnotfound("totalsubstrate","g"));
		let tsub=minusifnotfound("totalBE");
		if(typeof tsub =="number") tsub=tsub.toPrecision(2)+"%";
		this.viewcomps.calcstotalBE.setText(tsub);

		this.viewcomps.calcsflushes.setText(block.get("flushes"));
		this.viewcomps.calcsfirstflush.setText(minusifnotfound("firstflushharvest","g"));
		let tsub2=minusifnotfound("firstflushharvest");
		if(typeof tsub2 =="number") tsub2=tsub2.toPrecision(2)+"%";
		this.viewcomps.calcsfirstflushBE.setText(tsub2);

		this.viewcomps.history.setText(block.getHistoryText());
	}

}











