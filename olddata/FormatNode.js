
function isLeaf(obj){
	if((typeof obj=="object") && (typeof obj.c=="string")) return true;
	if(typeof obj=="string") return true;
	return false;
}

function hasOneLeaf(node){
	for(var k in node.c) if(isLeaf(node.c[k])) return true;
	return false;
}
function hasOnlyLeafs(node){
	for(var k in node.c) if(!isLeaf(node.c[k])) return false;
	return true;
}

function mergeObjects(a,b){
		var c={};
		for(var k in a) c[k]=a[k]; 
		for(var k in b) if(!c[k]) c[k]=b[k]; 
		return c;
}

function mergeObjList (tab){
		var obj={};
		for(var k in tab) obj=mergeObjects(obj,tab[k]);
		return obj;
	}
	function mergeArrayList (tab){
		var obj=[];
		for(var k in tab) obj=obj.concat(obj,tab[k]);
		return obj;
	}

function parseListToObjectArray(listtext){
		var vtab=listtext.split(";"), ret=[];
		for(var k in vtab){
			var vstab=vtab[k].split(":"), val="", key=vstab[0].trim();
			if(vstab[1]) val=vstab[1].trim();
			var obj ={}; obj[key]=val
			ret.push(obj);
		}
		return ret;
	}

class FormatNode {
	
	
	
	constructor(formatobj, parent){
		if(!formatobj) this.formatobj=jsonformat;
		else this.formatobj=formatobj;				
		this.processFormat(this.formatobj);
		this.parent=parent;
	}
	
	getProperty(p){
		if(this.formatobj.p) return this.formatobj.p[p];
		return undefined;
	}
	
	processFormat(fnode){
		// iterate untill found ... what does mean found ? found what 		
		this.properties={}
		this.tags=[];
		
		this.isleaf=isLeaf(fnode);
		this.isbranch=!this.isleaf;
		if(this.isleaf) {
			if(typeof fnode=="string") this.text=fnode;
			if(typeof fnode.c=="string") this.text=fnode.c;
		}
		this.hasonlyleafs=hasOnlyLeafs(fnode);
		if(fnode.p) this.properties=mergeObjList([this.properties,fnode.p]);	//update with ancestor
		if(fnode.t) this.tags=mergeArrayList([this.tags,fnode.t]);	//update with ancestor
		
	}
	
	getChildrenList(){		// maybe should save the stuff when created and give it each time ? 	
		var folist=this.formatobj.c;
		var ret=[];
		for(var sub in folist) {
			ret.push(new FormatNode(folist[sub],this));
		}
		return ret;
	}
	
	ancestorsProperties(proptofind){
		var props={};
		function ascend(item){
			if(proptofind && item.getProperty(proptofind)) return item.getProperty(proptofind);
			if(Object.keys(item.properties).length > 0) props=mergeObjList([props,item.properties]);
			if(item.parent) return ascend(item.parent);					
			return undefined;
		}
		var b=ascend(this);
		if(proptofind) return b;	
		return props;
	}
	ancestorsTags(tagtofind){
		var tags=[];
		function ascend(item){
			if(tagtofind && item.hasTag(tagtofind)) return true;
			if(item.tags.length > 0) tags=mergeArrayList([tags,item.tags]);
			if(item.parent) return ascend(item.parent);					
			return undefined;
		}
		var b=ascend(this);
		if(tagtofind) return b;	
		return tags;
	}
	getDescendentTextByTag(tagtofind, level){
		// we need to ge the text from the items have a rw in their tree
		var ret=[];
		if(!this.formatobj.c) return ;
		function descend(list, pre){
			for(var k in list){
				var child=list[k];
				var lpre=false;
				if(pre) lpre=pre[pre.length-1];
				if(tagtofind && child.t && child.t.includes(tagtofind) )lpre=true;
				if(lpre && typeof(child.c)=="string") ret.push(child.c);
				if(lpre && typeof(child)=="string") ret.push(child);
				 
				if(child.c && Array.isArray(child.c)) {
					level--;
					if(level>=0) {
						pre.push(lpre);
						descend(child,pre);
						pre.pop();
					} 
					level++;
				}
			}		 
		}
		var sub=false;
		if(this.tags && this.tags.includes(tagtofind)) sub=true;
		descend(this.formatobj.c, [sub]);
		return ret;	
	}

	getDescendentByProperty(propertytofind, level){
		if(!this.formatobj.p) return ;
		var ret=[];
		function descend(list){
			for(var k in list){
				var child=list[k];
				if(child.p) {
					if(propertytofind && child.p[propertytofind]) ret.push(child.c);
				}
				if(child.c && Array.isArray(child.c)) {
					level--;
					if(level>=0) if(descend(child)) return true;
					level++;
				}
			}
			return false;
		}
		if(this.properties !=undefined && this.properties[propertytofind] ) return true;
		var b=descend(this.formatobj.c);
		return ret;	
	}

	hasDescendentProperty(propertytofind, level){
		if(!this.formatobj.p) return ;
		function descend(list){
			for(var k in list){
				var child=list[k];
				if(child.p) {
					if(propertytofind && child.p[propertytofind]) return true;
				}
				if(child.c && Array.isArray(child.c)) {
					level--;
					if(level>=0) if(descend(child)) return true;
					level++;
				}
			}
			return false;
		}
		if(this.properties !=undefined && this.properties[propertytofind] ) return true;
		var b=descend(this.formatobj.c);
		return b;	
	}

	
	hasDescendentTag(tagtofind, level){
		if(!this.formatobj.c) return ;
		function descend(list){
			for(var k in list){
				var child=list[k];
				if(child.t) {
					if(tagtofind && child.t.includes(tagtofind)) return true;
				}
				if(child.c && Array.isArray(child.c)) {
					level--;
					if(level>=0) if(descend(child)) return true;
					level++;
				}
			}
			return false;
		}
		if(this.tags !=undefined && this.tags.includes(tagtofind)) return true;
		var b=descend(this.formatobj.c);
		return b;	
	}
	
	getDescendentTags(tagtofind, level){
		var ret=[];
		if(!this.formatobj.c) return ;
		function descend(list){
			for(var k in list){
				var child=list[k];
				if(child.t) ret = mergeArrayList([ret,child.t]);
				
				if(child.c && Array.isArray(child.c)) {
					level--;
					if(level>=0) descend(child);
					level++;
				}
			}
		}
		if(this.tags) ret = mergeArrayList([ret,this.tags]);
		if(this.tags !=undefined && this.tags.includes(tagtofind)) return true;
		descend(this.formatobj.c);
		return ret;
	}
	
	getFormatNode(key){
		if(!this.formatobj.c) return ;
		if(this.formatobj.c == key) return this.formatobj;

		function descend(list){
			for(var k in list){
				var child=list[k];
				if(child.text==key) return child;
				var l=child.getChildrenList();
				if(l) {
					var ret=descend(l);
					if(ret) return ret;
				}
			}
			return ;
		}
		return descend(this.getChildrenList());
	}
	
	getFormattedValue(key, nvalue){
		var fn=this.getFormatNode(key);
			
		var value=""+nvalue;
 		if(fn && fn.properties["prefix"]) value=fn.properties["prefix"]+value;
 		if(fn && fn.properties["suffix"]) value+=fn.properties["suffix"];
		if(fn && fn.tags && fn.tags.includes("link") && value.length>0) {value=value;}
		return value;
	};
	

	
};