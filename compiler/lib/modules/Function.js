/**
 * 函数构造器
 * @returns {*}
 * @constructor
 */
var Function = function Function() {
    return $Function.apply(this, Array.prototype.slice.call(arguments,0) );
};
Function.prototype = new $Function();
Function.prototype.apply = $Function.prototype.apply;
Function.prototype.call = $Function.prototype.call;
