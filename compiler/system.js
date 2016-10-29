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



