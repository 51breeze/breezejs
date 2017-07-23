/**
 * 返回一个数组
 * @type {Function}
 */
if( !Array.prototype.map )
{
    Array.prototype.map=function map(callback, thisArg)
    {
        var T, A, k;
        if (this == null)throw new TypeError("this is null or not defined");
        if (!System.isFunction(callback))throw new TypeError(callback + " is not a function");
        var O =  System.isObject(this) ? this : [];
        var len = O.length >>> 0;
        if (thisArg)T = thisArg;
        A = new Array(len);
        k = 0;
        var kValue, mappedValue;
        while(k < len) {
            if (k in O) {
                kValue = O[ k ];
                mappedValue = callback.call(T, kValue, k, O);
                A[ k ] = mappedValue;
            }
            k++;
        }
        return A;
    }
}
/**
 * 返回指定元素的索引位置
 * @param searchElement
 * @returns {number}
 */
if ( !Array.prototype.indexOf )
{
    Array.prototype.indexOf = function indexOf(searchElement) {
        var i = 0;
        for (; i < this.length; i++)if (this[i] === searchElement)
            return i;
        return -1;
    };
}