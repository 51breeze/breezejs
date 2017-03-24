/**
 * 类型错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Error,Object
 */
function TypeError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='TypeError';
};
System.TypeError=TypeError;
TypeError.prototype =Object.create( Error.prototype );
TypeError.prototype.constructor=TypeError;