if (typeof Object.create !== 'function' )
{
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
}

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



