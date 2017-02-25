//var o = new Console();
"use strict";

var _platform=['node',1.23];
var o={
    'env':{
        platform:function platform( name ) {
            if( name != null )return name == _platform[0];
            return _platform[0];
        } ,
        version:function version(value, expre)
        {
            var result = _platform[1];
            if( value==null )return result;
            value = parseFloat(value);
            switch ( expre )
            {
                case '=' :
                    return value == result;
                case '!=' :
                    return value != result;
                case '>' :
                    return value > result;
                case '>=' :
                    return value >= result;
                case '<' :
                    return value < result;
                default:
                    return value <= result;
            }
        }
    }
}



var a = new Date().getTime();

for(var i=0; i<1000000; i++ ){
    o.env.platform();
    o.env.version();
}

console.log( new Date().getTime() - a );