/**
 * 绑定一个对象到返回的函数中
 * 返回一个函数
 * @type {bind}
 */
Function.prototype.bind = $Function.prototype.bind;
if( !$Function.prototype.bind )
{
    Function.prototype.bind = function bind(thisArg)
    {
        if (typeof this !== "function")throwError('type', "Function.prototype.bind - what is trying to be bound is not callable");
        var args = Array.prototype.slice.call(arguments, 1),
            fn = this,
            Nop = function () {
            },
            Bound = function () {
                return fn.apply(this instanceof Nop ? this : thisArg || this, args.concat(Array.prototype.slice.call(arguments)));
            };
        Nop.prototype = this.prototype;
        Bound.prototype = new Nop();
        return Bound;
    };
}