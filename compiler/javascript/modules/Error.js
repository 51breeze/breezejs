/**
 * 错误消息构造函数
 * @param message
 * @param line
 * @param filename
 * @constructor
 * @require Object
 */
function Error( message , line, filename )
{
    this.message = message;
    this.line=line;
    this.filename = filename;
    this.type='Error';
};
System.Error=Error;
Error.prototype =Object.create( Object.prototype );
Error.prototype.constructor=Error;
Error.prototype.line=null;
Error.prototype.type='Error';
Error.prototype.message=null;
Error.prototype.filename=null;
Error.prototype.toString=function ()
{
    return this.message;
}