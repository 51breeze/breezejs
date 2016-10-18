(function(){
var packages={};
var object={};
var __g__={
    module:function(name, value)
    {
        var path = name.replace(/\s+/g,'').split('.');
        var deep=0;
        var obj=packages;
        var last = path.pop();
        var len =path.length;
        while(deep < len )
        {
            obj = packages[ path[deep] ] || (packages[ path[deep] ]={});
            deep++;
        }
        return typeof value !== "undefined" ? obj[last]=value : obj[last];

    },instanceof:function(module)
    {
        return this instanceof __g__.module(module).constructor;

    },super:function(module, name)
    {
        var module =  __g__.module(module);
        if( typeof  module !== "object")throw new Error('Not found the '+module+' class');
        if( typeof module[name] !== "function" )throw new Error('Not found the '+module+' function');
        return module[name].apply(this, [].slice.call(arguments,2) );

    },getInstance:function(module)
    {
        module = __g__.module(module).constructor;
        if( typeof module !== "function")throw new Error('Not found the '+module+' class');
        return new module();

    },uniqid:function()
    {
        var id;
        do{
            id=new Date().getTime() + '' + Math.random() * 10000000000;
        }while( object[id] );
        return id;

    },prop:function(name, value)
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
                return this.hasOwnProperty(name) ? this[name] : obj[name];
            }
            this.hasOwnProperty(name) ? this[name]=value : obj[name]=value;
            return true;
        }

    },merge:function()
    {
        var target = arguments[0];
        var len = arguments.length;
        for(var i=1; i<len; i++ )
        {
            var item = arguments[i];
            for( var p in item )
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
};


+(function(){;
var B=function(){
console.log(' this is B')
this.__uniqid__=__g__.uniqid();
__g__.prop.call(this,{},{},{},{});
return this;
};
var map={dynamic:{avg:function(){
}},
static:{}};
var module={constructor:B,package:'',dynamic:{function:{protected:{},internal:{}},variable:{protected:{},internal:{}}},static:{function:{protected:{},internal:{}},variable:{protected:{},internal:{}}}};
var proto = module.constructor.prototype;
proto.constructor = module.constructor;
Object.defineProperties(proto,{names:function(){
return __g__.prop.call(this,"names")
}});
proto.avg=map.dynamic.avg;
__g__.module("B", module);
})()
+(function(){;
var B=__g__.module("B.constructor");
var test=function(){
var c = new B()
console.log('=====')
var param=[].slice.call(arguments);
param.unshift('constructor');
param.unshift('B');
__g__.super.apply(this,param);
this.__uniqid__=__g__.uniqid();
__g__.prop.call(this,{},{tttt:'tyuuu'},{ccc:'236666',__style__:'pppp'},{});
return this;
};
var map={dynamic:{onResize:function(kkkss,lll,bb){
__g__.prop.call(this,"kkk",23)
},position:function(event){
return true;
}},
static:{bbbb:function(){
},name:123,uuu:'pppp'}};


var module={constructor:test,package:'',dynamic:{function:{protected:{},internal:{}},variable:{protected:{tttt:"'tyuuu'"},internal:{}}},static:{function:{protected:{},internal:{}},variable:{protected:{},internal:{}}}};
__g__.merge(map.dynamic,__g__.module("B.dynamic.function.protected"));
__g__.merge(module.dynamic.function.protected,__g__.module("B.dynamic.function.protected"));
__g__.merge(map.static,__g__.module("B.static.function.protected"));
__g__.merge(module.static.function.protected,__g__.module("B.static.function.protected"));
module.constructor.prototype = __g__.getInstance("B");
var proto = module.constructor.prototype;
proto.constructor = module.constructor;
Object.defineProperties(proto,{names:function(names){
__g__.prop.call(this,"name", names)
},style:function(){
return __g__.prop.call(this,"__style__")
}});
test.bbbb=map.static.bbbb;
test.name=map.static.name;
proto.onResize=map.dynamic.onResize;
__g__.module("test", module);
})()
return __g__.getInstance("test");

})()