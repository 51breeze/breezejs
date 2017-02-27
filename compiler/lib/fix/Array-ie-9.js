/**
 * 返回一个数组
 * @type {Function}
 */
Array.prototype.map = $Array.prototype.map || function(callback, thisArg)
{
    var T, A, k;
    if (this == null)System.throwError('type',"this is null or not defined");
    if (!isFunction(callback))System.throwError('type',callback + " is not a function");
    var O =  isObject(this) ? this : [];
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
};