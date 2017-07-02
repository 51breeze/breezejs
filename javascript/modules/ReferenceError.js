/**
 * 引用错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error,Object;
 */
function ReferenceError( message , line, filename )
{
    this.name='ReferenceError';
    Error.call(this, message , line, filename);
};
System.ReferenceError =ReferenceError;
ReferenceError.prototype = Object.create( Error.prototype );
ReferenceError.prototype.constructor=ReferenceError;