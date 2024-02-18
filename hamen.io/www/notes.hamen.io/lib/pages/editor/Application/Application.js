class State{constructor(initialValue){this._wrappedValue=initialValue;this._listeners=[];};setValue(nV){this._listeners.forEach(c=>c(nV,this._wrappedValue));this._wrappedValue=nV;};getValue(){return this._wrappedValue;};addListener(onChange){this._listeners.push(onChange);};removeListener(onChange){this._listeners=this._listeners.filter(l=>l!=onChange);};};class RegistryList{constructor(){this._values=[];}
register(_){this._values.push(_)}
unregister(_){this._values.filter(c=>c!=_);}
get values(){return this._values}}
class SubscriptionList{constructor(){this._actions=[];};subscribe(callback){this._actions.push(callback)};unsubscribe(callback){this._actions=this._actions.filter(c=>c!=callback);};trigger(...args){this._actions.forEach(c=>c(...args));};};class Identifiable{constructor(){this.ID=UUID();};};class Directory{constructor(dirName,{isProtected=false,parentDirectory=undefined,overridePath=undefined}){this._dirName=new State(dirName);this.parentDirectory=parentDirectory;this._isProtected=isProtected;this._dirContent=[];this.overridePath=overridePath;};createFile(file){this._dirContent.push(file);};createDirectory(directory){this._dirContent.push(directory);};removeFile(file){this._dirContent.push(file);};removeDirectory(directory){this._dirContent.push(directory);};getContents(){return this._dirContent;};get isProtected(){return this._isProtected;};getPath(){return this.overridePath||this.parentDirectory.getPath();};};class File{constructor(fileName,{isProtected=false,parentDirectory=undefined}){this._fileName=new State(fileName);this.parentDirectory=parentDirectory;this._isProtected=isProtected;};getPath(){return this.parentDirectory.getPath();};renameFile(fileName){this._fileName.setValue(fileName);};get fileName(){return this._fileName.getValue();};};class Group extends Identifiable{constructor({groupName,groupItems=[]}){this.groupName=groupName;this.groupItems=groupItems;};};class Item extends Identifiable{constructor({itemName,itemCaption=""}){this.itemName=itemName;this.itemCaption=itemCaption;};};class Menu extends Identifiable{constructor(){this._items=[];};};const Application={Modules:new Registry(),Events:{},Common:{UUID(){return"10000000-1000-4000-8000-100000000000".replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));},parseHTML(HTMLString){const div=document.createElement("div");div.innerHTML=HTMLString;if(div.children.length!==1)throw"Cannot parse multiple elements as single elements; wrap your `innerHTML` string in a div or another element.";return Array.from(div.children)[0]}},UI:{Elements:{Icon(iconName){const icon=document.createElement("i");icon.innerText=iconName;icon.setAttribute("icon","");return icon;},},Regions:{Menus:{FileMenu:new FileMenu.Menu()}},UIDependencies:new SubscriptionList(),refreshUI(){}},FileSystem:new Directory("/",{isProtected:true,overridePath:["/"],parentDirectory:"/"}),Document:{newDocument(){},openDocument(){},activeDocument:new State(undefined)},Notification:{createAlert({message,title}){return new Promise((resolve,reject)=>{resolve(true);})},createDialog({title,content}){}},Types:{FileSystem:{File:File,Directory:Directory},FileMenu:{Item:Item,Menu:Menu,Group:Group},Identifiable:Identifiable}};