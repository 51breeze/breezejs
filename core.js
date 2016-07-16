/**
 * Created by Administrator on 16-7-15.
 *
 *
 *
 */


var include,main;

(function(global){

    var location = window.location || window.document.location;
    if(typeof location === "undefined" )
    {
        throw new Error('Not support platform');
    }
    var queue=[];
    var config={
        host:location.host === '' ? location.pathname.replace(/^\/+|\/+$/g,'').replace(/\/[\.\w]+$/,'') : location.protocol+'//'+location.host,
        path:'/'
    };

    
    var reg=/((?:http|https|file):\/\/.*?\/[^:]+)(?::\d+)?:\d+/;
    var ie9=typeof document.querySelector !== "function";
    function currentScript()
    {
            if (document.currentScript){
                return document.currentScript.src;
            }

            var stack;
            try{
                throw new Error();
            }
            catch(e){
                stack = e.fileName || e.sourceURL || e.stack || e.stacktrace;
            }
        
            // IE10
            if (stack){
                var absPath = reg.exec(stack)[1];
                if (absPath){
                    return absPath;
                }
            }

            // IE5-9
            for(var scripts = document.scripts, i = scripts.length - 1, script; script = scripts[i--];)
            {
                if (  script.readyState === 'interactive')
                {
                    return ie9 ? script.getAttribute('src', 4) : script.src;
                }
            }
        
    }

  
    
    

    include= function(file)
    {
        queue.push( file );
    }

    include.config=function( options )
    {
       if( typeof options === "string"  )
       {
           var deep= options.split('.');
           var i= 0, obj=config;
           while( i<deep.length && ( obj = obj[ deep[i] ] ) )i++;
           return obj;
       }
       merge( config, options);
    }

    function merge( target, object )
    {
        for( var key in object )if( typeof target[ key ] !== "undefined"  )
        {
            if( typeof target[ key ] === "object" && typeof object[ key ] === "object" )
            {
                merge( target[ key ], object[ key ] );
            }else
            {
                target[ key ] = object[ key ];
            }
        }
        return target;
    }

    //./../.././aab/cc.js
    function parsePath( filepath )
    {




    }

    function load( file )
    {
        var script;
        if( typeof file !== 'string' )
        {
            script=file;
            file= file.src || file.href;
        }

        var type = file.match(/\.(css|js)(\?.*?)?$/i)
        if( !type )throw new Error('import script file format of invalid');

        file+=( !type[2] ? '?t=' : '&t=')+Breeze.time();

        type=type[1];
        type=type.toLowerCase() === 'css' ? 'link' : 'script';

        if( !script )
        {
            var head=document.getElementsByTagName('head')[0];
            var ref=Breeze.querySelector( type +':last,:last-child',head )[0];
            ref = ref ? ref.nextSibling : null;
            script=document.createElement( type );
            head.insertBefore(script,ref);
        }

        script.onload=script.onreadystatechange=function(event)
        {
            if( !script.readyState || /loaded|complete/.test( script.readyState ) )
            {
                script.onload=script.onreadystatechange=null;
                if( typeof callback ==='function' )
                    callback( event );
            }
        }

        if( type==='link' )
        {
            script.setAttribute('rel', 'stylesheet');
            script.setAttribute('type','text/css');
            script.setAttribute('href', file );
        }else
        {
            script.setAttribute('type','text/javascript');
            script.setAttribute('src', file );
        }
    }


})(this)


console.log( location )


include('./sizzle')

try{
   sss;
}catch( e )
{
  console.log( e.stack )
}








