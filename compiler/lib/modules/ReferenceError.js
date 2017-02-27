/**
 * 引用错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
var ReferenceError = function ReferenceError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='ReferenceError';
};
ReferenceError.prototype = new Error();
ReferenceError.prototype.constructor=ReferenceError;