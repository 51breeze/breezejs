/**
 * 函数构造器
 * @returns {*}
 * @constructor
 */
function Function() {
    return $Function.apply(this, Array.prototype.slice.call(arguments,0) );
}
Function.prototype = new Object();
Function.prototype.apply = $Function.prototype.apply;
Function.prototype.call = $Function.prototype.call;
