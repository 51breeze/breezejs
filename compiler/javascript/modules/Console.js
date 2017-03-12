
/**
 * 控制台
 * @require System,Object
 */
function Console(){ if(this instanceof Console)Internal.throwError('syntax','is not constructor')};

/**
 * @private
 * @param items
 * @returns {string}
 */
function toString(items)
{
    var str=[];
    for(var i=0; i<items.length; i++)if(items[i]!=null)str.push( Object.prototype.valueOf.call(items[i]) );
    return str.join(' ');
}
if( !$console )
{
    $console={};
    $console.trace=$console.warn=$console.error= $console.dir=$console.assert=$console.time=$console.timeEnd=$console.info=$console.log=function(){};
}
Console.log=function log(){
    $console.log( toString(arguments) );
};
Console.info =function info(){
    $console.info( toString(arguments) );
};
Console.trace = function trace(){
    $console.trace( toString(arguments) );
};
Console.warn = function warn(){
    $console.warn( toString(arguments) );
};
Console.error = function error(){
    $console.error( toString(arguments)  );
};
Console.dir = function dir(){
    $console.dir( toString(arguments) );
};
Console.assert = function assert(){
    $console.assert();
}
Console.time = function time(){
    $console.time();
}
Console.timeEnd = function timeEnd(){
    $console.timeEnd();
}
System.Console = Console;
System.log =Console.log;
System.info=Console.info;
System.trace =Console.trace;
System.warn=Console.warn;
System.error =Console.error;
System.dir=Console.dir;
System.assert =Console.assert;
System.time=Console.time;
System.timeEnd =Console.timeEnd;
