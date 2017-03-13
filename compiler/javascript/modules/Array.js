/**
* 数组构造器
* @returns {Array}
* @constructor
* @require System;
* @require Object,Math;
*/
function Array(length)
{
    if ( !System.instanceOf(this, Array) )
    {
        return $Array.apply( new Array(), Array.prototype.slice.call(arguments, 0));
    }
    this.length=0;
    if( arguments.length > 0 )
    {
        if( typeof length === 'number' && arguments.length===1 )
        {
            this.length = length >> 0;
            return $Array.call(this, this.length );
        }
        return Array.prototype.splice.apply(this, [0,0].concat( Array.prototype.slice.call(arguments,0)));
    }
    return $Array.call(this);
};
System.Array = Array;
Array.prototype = Object.create( Object.prototype );
Array.prototype.constructor = Array;
Array.prototype.length = 0;
Array.prototype.slice = $Array.prototype.slice;
Array.prototype.splice = $Array.prototype.splice;
Array.prototype.concat = $Array.prototype.concat;
Array.prototype.join = $Array.prototype.join;
Array.prototype.pop = $Array.prototype.pop;
Array.prototype.push = $Array.prototype.push;
Array.prototype.shift = $Array.prototype.shift;
Array.prototype.unshift = $Array.prototype.unshift;
Array.prototype.sort = $Array.prototype.sort;
Array.prototype.reverse = $Array.prototype.reverse;
Array.prototype.toString = $Array.prototype.toString;
Array.prototype.valueOf = $Array.prototype.valueOf;
Array.prototype.indexOf = $Array.prototype.indexOf;
Array.prototype.map = $Array.prototype.map;

/**
 * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
 * @param callback 一个回调函数。
 * 参数中的第一个为属性值，第二个为属性名。
 * 如果返回 false 则退出循环
 * @returns {Object}
 */
Array.prototype.forEach = function forEach(callback, thisArg)
{
    if (!System.isFunction(callback))Internal.throwError('type', callback + " is not a function");
    if (this==null)Internal.throwError('reference','this is null or not defined');
    var obj = System.Object(this);
    var len = obj.length >> 0;
    var k = 0;
    thisArg = thisArg || this;
    while (k<len)if (k in obj)callback.call(thisArg, obj[k++], k, obj);
    return this;
}

/**
 * 方法使用指定的函数测试所有元素，并创建一个包含所有通过测试的元素的新数组。
 * @param callback
 * @param thisArg
 * @returns {Array}
 */
Array.prototype.filter = function filter(callback, thisArg)
{
    if (typeof callback !== 'function')Internal.throwError('type', 'callback must be a function');
    if (this==null)Internal.throwError('reference','this is null or not defined');
    var items = new System.Array();
    var obj = System.Object(this);
    var len = obj.length >> 0;
    var k = 0;
    thisArg = thisArg || this;
    while (k<len)if( k in obj && callback.call(thisArg, obj[k++], k, obj) )items.push(obj[k]);
    return items;
}

/**
 * 返回一个唯一元素的数组
 * @returns {Array}
 */
Array.prototype.unique = function unique()
{
    if (this==null)Internal.throwError('reference','this is null or not defined');
    var obj = System.Object(this);
    var arr = Array.prototype.slice.call(obj,0);
    var i=0;
    var b;
    var len = arr.length >> 0;
    for(;i<len;i++)
    {
        b = i+1;
        for (;b<len;b++)if(arr[i]===arr[b])arr.splice(b, 1);
    }
    return arr;
};

/**
 * 将一个数组的所有元素从开始索引填充到具有静态值的结束索引
 * @param value
 * @param start
 * @param end
 * @returns {Object}
 */
Array.prototype.fill = function fill(value, start, end)
{
    if (this==null)Internal.throwError('reference','this is null or not defined');
    if (!(System.is(this, System.Array) || System.isArray(this)))Internal.throwError('reference','this is not Array');
    var len = this.length >> 0;
    var relativeStart = start >> 0;
    var k = relativeStart < 0 ? System.Math.max(len + relativeStart, 0) : System.Math.min(relativeStart, len);
    var relativeEnd = end == null ? len : end >> 0;
    var final = relativeEnd < 0 ? System.Math.max(len + relativeEnd, 0) : System.Math.min(relativeEnd, len);
    while (k < final) {
        this[k] = value;
        k++;
    }
    return this;
};

/**
 * 返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。
 * @param callback
 * @param thisArg
 * @returns {*}
 */
Array.prototype.find = function find(callback, thisArg)
{
    if (typeof callback !== 'function')Internal.throwError('type', 'callback must be a function');
    if (this==null)Internal.throwError('reference','this is null or not defined');
    var obj = System.Object(this);
    var len = obj.length >> 0;
    var k = 0;
    thisArg = thisArg || this;
    while (k<len)if( k in obj)
    {
        if( callback.call(thisArg, obj[k++], k, obj) )
        {
            return obj[k];
        }
    }
    return;
};