/**
 * JSON 对象构造器
 * @constructor
 * @require Object, Array
 */
function JSON(){ if(this instanceof JSON)Internal.throwError('JSON is not constructor.'); };
System.JSON=JSON;
var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
function escFunc(m) {return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1);};
JSON.parse = function (strJson) {return eval('(' + strJson + ')');}
JSON.stringify = function(value)
{
    if(value == null) return 'null';
    var type = typeof value;
    if (type ==='number')return System.isFinite(value) ? value.toString() : 'null';
    if (type ==='boolean')return value.toString();
    if (type ==='object')
    {
        var tmp = [];
        if (typeof value.toJSON === 'function') {
            return JSON.stringify( value.toJSON() );
        } else if ( System.instanceOf(value, Array) ){
            for (var i = 0; i < value.length; i++)tmp.push( JSON.stringify( value[i] ) );
            return '['+tmp.join(',')+']';
        }else if( System.isObject(value) )
        {
            for (var b in value )tmp.push( JSON.stringify(b)+':'+JSON.stringify(value[b]) );
            return '{'+tmp.join(',')+'}';
        }else {
            var items = Object.prototype.getEnumerableProperties.call(value);
            for( var i =0; i<items.length; i++ )tmp.push( JSON.stringify(items[i].key)+':'+JSON.stringify(items[i].value) );
            return '{' + tmp.join(', ') + '}';
        }
    }
    return '"' + value.toString().replace(escRE, escFunc) + '"';
};