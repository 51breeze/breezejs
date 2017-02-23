/**
 * 类型错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
function TypeError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='TypeError';
}
TypeError.prototype = new Error();
TypeError.prototype.constructor=TypeError;