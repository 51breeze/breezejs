/**
 * 数组构造器
 * @returns {Array}
 * @constructor
 */
function Array(length)
{
    if( !(this instanceof Array) )return $Array.apply(new Array(), Array.prototype.slice.call(arguments,0) );
    this.length=0;
    return $Array.apply(this,Array.prototype.slice.call(arguments,0));
}
Array.prototype = new Object();
Array.prototype.constructor = Array;
Array.prototype.length  =0;
Array.prototype.slice   = $Array.prototype.slice;
Array.prototype.splice  = $Array.prototype.splice;
Array.prototype.concat  = $Array.prototype.concat;
Array.prototype.join    = $Array.prototype.join;
Array.prototype.pop     = $Array.prototype.pop;
Array.prototype.push    = $Array.prototype.push;
Array.prototype.shift   = $Array.prototype.shift;
Array.prototype.unshift = $Array.prototype.unshift;
Array.prototype.sort    = $Array.prototype.sort;
Array.prototype.reverse = $Array.prototype.reverse;
Array.prototype.toString= $Array.prototype.toString;
Array.prototype.valueOf = $Array.prototype.valueOf;

/**
 * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
 * @param callback 一个回调函数。
 * 参数中的第一个为属性值，第二个为属性名。
 * 如果返回 false 则退出循环
 * @returns {Object}
 */
Array.prototype.forEach=function( callback, thisArg )
{
    if (!isFunction(callback))throwError('type',callback + " is not a function");
    var it = new Iterator(this);
    thisArg = thisArg || this;
    for(;it.seek();)
    {
        if( callback.call(thisArg,it.current().value, it.current().key , it.items)=== false)return this;
    }
    return this;
}

/**
 * 方法使用指定的函数测试所有元素，并创建一个包含所有通过测试的元素的新数组。
 * @param callback
 * @param thisArg
 * @returns {Array}
 */
Array.prototype.filter=function (callback, thisArg)
{
    if (typeof callback !== 'function')throwError('type','callback must be a function');
    var it = new Iterator(this);
    var len = it.items.length;
    var items = new Array();
    var i = 0;
    for (; i < len; i++)if ( callback.call(thisArg, it.items[i].value, it.items[i].key) )items.push( it.items[i].value );
    return items;
}

/**
 * 将一个数组的所有元素从开始索引填充到具有静态值的结束索引
 * @param value
 * @param start
 * @param end
 * @returns {Object}
 */
Array.prototype.fill = function fill(value, start, end)
{
    var obj = Object(this);
    if( !(obj instanceof Class) )
    {
        var o = obj.constructor instanceof Class ? obj[obj.constructor.token] : obj;
        var len = o.length >> 0;
        var relativeStart = start >> 0;
        var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
        var relativeEnd = end === undefined ? len : end >> 0;
        var final = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
        while (k < final) {
            o[k] = value;
            k++;
        }
    }
    return obj;
};

/**
 * 返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。
 * @param callback
 * @param thisArg
 * @returns {*}
 */
Array.prototype.find = function find(callback,thisArg)
{
    if (typeof callback !== 'function')throwError('type','callback must be a function');
    var it = new Iterator(this);
    var len = it.items.length;
    for (var i = 0; i < len; i++)if ( callback.call(thisArg, it.items[i].value, it.items[i].key) )
    {
        return it.items[i].value;
    }
    return undefined;
};