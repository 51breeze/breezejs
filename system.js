var packages={};
var object={};
var __g__={
    module:function(name, value)
    {
        var path = name.replace(/\s+/g,'').split('.');
        var deep=0;
        var obj=packages;
        var is=typeof value !== "undefined";
        var len =path.length;
        while(deep < len )
        {
            name = path[deep];
            if( is && len === deep+1 )
            {
                obj[ name ] = value;
                return true;
            }else
            {
                obj = packages[ name ] || (packages[ name ]={});
            }
            deep++;
        }
        return obj;

    },getInstance:function(name){

        var c =  __g__.package(name).constructor;
        return new c();

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
}


