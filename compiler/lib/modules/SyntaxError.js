/**
 * 语法错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
function SyntaxError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='SyntaxError';
}
SyntaxError.prototype = new Error();
SyntaxError.prototype.constructor=SyntaxError;