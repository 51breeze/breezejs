(function(){



/*if (typeof Object.create !== 'function' )
{*/
    Object.create = (function() {
        var fn = function(){}
        var has = Object.prototype.hasOwnProperty;
        return function (proto,props) {
            if( typeof proto != 'object' )throw TypeError('Object prototype may only be an Object or null');
            fn.prototype = proto;
            var obj = new fn();
            fn.prototype = null;
            if ( props )
            {
                props = Object( props );
                for (var p in props)if( has.call(props, p) )
                {
                   obj[p] = props[p];
                }
            }
            return obj;
        };
    })();
//}

if (typeof Object.defineProperty !== 'function' )
{
    var has = Object.prototype.hasOwnProperty;
    Object.defineProperty=function (obj, prop, desc)
    {
        if( !obj || typeof obj !== 'object' )throw TypeError('Invalid object');
        if( !prop || typeof prop === 'object' )throw TypeError('Invalid prop name');
        if( !desc || typeof desc !== 'object' )throw TypeError('Property description must be an object');
        var d = {};
        if( has.call(desc, "enumerable") )d.enumerable = !!desc.enumerable;
        if (has.call(desc, "configurable"))d.configurable = !!desc.configurable;
        if (has.call(desc, "value"))d.value = desc.value;
        if (has.call(desc, "writable"))d.writable = !!desc.writable;
        if (has.call(desc, "get"))
        {
            if ( typeof desc.get !== "function" )throw new TypeError("Invalid getter");
            d.get = desc.get;
        }
        if( has.call(desc, "set") )
        {
            if ( typeof desc.set !== "function" )throw new TypeError("Invalid setter");
            d.set = desc.set;
        }
        if (("get" in d || "set" in d) && ("value" in d || "writable" in d))throw new TypeError("identity-confused descriptor");
        obj[ prop ]= d;
        return obj;
    }
}

if (typeof Object.defineProperties !== 'function' )
{
    var has = Object.prototype.hasOwnProperty;
    Object.defineProperties = function(obj, props)
    {
        if ( obj !== Object(props) )throw new TypeError("Invalid props");
        for( var p in props )if( has.call(props, p ) )Object.defineProperty(obj, p, props[p] );
        return obj;
    }
}



var packages={};
var object={};

function module(name, value)
{
    var path = name.replace(/\s+/g,'').split('.');
    var deep=0;
    var obj=packages;
    var last = path.pop();
    var len =path.length;
    while(deep < len )
    {
        obj = obj[ path[deep] ] || (obj[ path[deep] ]={});
        deep++;
    }
    return typeof value !== "undefined" ? obj[last]=value : obj[last];
}

function uniqid()
{
    if( typeof this.__uniqid__ !== "undefined")return this.__uniqid__;
    var id;
    do{
        id=new Date().getTime() + '' + Math.random() * 10000000000;
    }while( object[id] );
    return id;
}

function prop(name, value)
{
    var id = this.__uniqid__;
    var obj = object[id] || (object[id]={});

    //初始化变量
    if( typeof name === "object" )
    {
        __g__.merge(this, name );
       for(var i=1; i<arguments.length; i++)
       {
           __g__.merge(obj, arguments[i] );
       }

    }else if( typeof name === "string" )
    {
        if( typeof value === "undefined" )
        {
            return typeof this[name] !=="undefined" ? this[name] : obj[name];
        }
        typeof this[name] !=="undefined" ? this[name]=value : obj[name]=value;
        return true;
    }
}

function merge()
{
    var target = arguments[0];
    var len = arguments.length;
    for(var i=1; i<len; i++ )
    {
        var item = arguments[i];
        if(item)for( var p in item )
        {
            if( typeof item[p] === 'object' && typeof target[p] === 'object' )
            {
                merge(target[p],  item[p] );
            }else{
                target[p] = item[p];
            }
        }
    }
    return target;
}



module("com.D",(function(){
var D=function (jj){jj=typeof jj=== "undefined" ?'123':jj;
if( typeof jj !== "string" )throw new TypeError("Specify the type of mismatch");
if( !(this instanceof D) )throw new SyntaxError("Please use the new operation to build instances.");
this["1479816715403"]={"_names":'999'};
 var cc=66;this.name='9999';};
D.prototype=Object.create(null,{
name:'3',
age:'3',
createName:function (){return this;},
address:{get:function (){return '66666';},set:function (add){if( typeof add !== "string" )throw new TypeError("Specify the type of mismatch");
}},
test:function (){return 'the fun createname';},
names:{get:function (){console.log('get names ');return this["1479816715403"]._names;},set:function (bbs){if( typeof bbs !== "string" )throw new TypeError("Specify the type of mismatch");
console.log('set names = ',bbs);this["1479816715403"]._names=bbs;}}
});
D.prototype.constructor=D;
return D;
})());
module("lib.EventDispatcher",(function(){
var B=module("com.B");
var EventDispatcher=function (target){if( !(this instanceof EventDispatcher) )throw new SyntaxError("Please use the new operation to build instances.");
Object.call(this);
this["1480850691523"]={"getProxyTarget":null,"storage":null,"forEachCurrentItem":undefined,"length":undefined};
this['getProxyTarget'||this["1480850691523"].length];this["1480850691523"].getProxyTarget=target?function (){return target.length>0?target:[this];}:function (){return this["1480850691523"].forEachCurrentItem?[this["1480850691523"].forEachCurrentItem]:(this["1480850691523"].length>0?this:[this]);};};
EventDispatcher.prototype=Object.create(Object.prototype,{
hasEventListener:function (type){ var target=this["1480850691523"].getProxyTarget(),index=0; while (index<target){ var events=this["1480850691523"].storage.call(target[index]); if (events&&events[type]){ return true;}index++;}return false;},
addEventListener:function (type,callback,useCapture,priority,reference){ var len=type.length; if (type instanceof Array){ while (len>0)this.addEventListener(type[--len],callback,useCapture,priority,reference);return this;} if ( typeof type!=='string'){ throw new Error('invalid event type.');} var target=this["1480850691523"].getProxyTarget(),index=0; var listener=new EventDispatcher.Listener(callback,useCapture,priority,reference); var bindBeforeProxy; while (index<target.length){listener.dispatcher=this;listener.currentTarget=target[index];listener.type=type; if (!(bindBeforeProxy[type] instanceof EventDispatcher.SpecialEvent)||!bindBeforeProxy[type].callback.call(this,listener)){}index++;}return this;},
removeEventListener:function (type,listener){ var target=this["1480850691523"].getProxyTarget(); var b=0; var removeEventListener; while (b<target.length){removeEventListener.call(target[b],type,listener,this);b++;}return true;},
dispatchEvent:function (event){ 
    var BreezeEvent; 
    var dispatchEvent;
    if (!(event instanceof BreezeEvent)){ throw new Error('invalid event.');} 
    var target=this['getProxyTarget']; 
    var targets=this['getProxyTargets'](998); 
    var i=0; 
    var element;
    target(); 
    while (i<target.length&&!event.propagationStopped)
    {
        element=target[i];
        event.currentTarget=element;
        event.target=event.target||element;
        dispatchEvent(event);i++;
    }
    return !event.propagationStopped;
}
});
merge(EventDispatcher,{
Listener:B,
SpecialEvent:B
});
EventDispatcher.prototype.constructor=EventDispatcher;
return EventDispatcher;
})());
module("com.B",(function(){
var D=module("com.D");
var EventDispatcher=module("lib.EventDispatcher");
var B=function (jj){if( !(this instanceof B) )throw new SyntaxError("Please use the new operation to build instances.");
D.call(this);
this["1480739633453"]={"_names":'999'};
 var cc=66;this.name='9999'; var d=new D();d.name;};
B.prototype=Object.create(D.prototype,{
name:'3',
dispatcher:null,
age:'3',
createName:function (){return 'the fun createname';},
cre:function (){console.log('call cre');},
names:{get:function (){console.log('get names ');return this["1480739633453"]._names;},set:function (val){if( typeof val !== "string" )throw new TypeError("Specify the type of mismatch");
console.log('get names ');}}
});
merge(B,{
name:'3999 yyy fsss 666',
address:'shu line 6666',
classname:{get:function (){return '===';}}
});
B.prototype.constructor=B;
return B;
})());
module("Main",(function(){
var B=module("com.B");
var EventDispatcher=module("lib.EventDispatcher");
var Main=function (jj){if( !(this instanceof Main) )throw new SyntaxError("Please use the new operation to build instances.");
 var ii={name:{},age:1}; var bb=null;bb(); var b,c='uuuu',d=6; var name=null;B.call(this,jj);console.log(B.classname.get());console.log(this.names);};
Main.prototype=Object.create(B.prototype,{
names:'3'
});
merge(Main,{
name:5
});
Main.prototype.constructor=Main;
return Main;
})());
var main=module("Main");
new main();
})();