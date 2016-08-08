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
            obj = obj[ path[deep] ] || (obj[ path[deep] ]={});
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
        if( typeof this.__uniqid__ !== "undefined")return this.__uniqid__;
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
                return typeof this[name] !=="undefined" ? this[name] : obj[name];
            }
            typeof this[name] !=="undefined" ? this[name]=value : obj[name]=value;
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


