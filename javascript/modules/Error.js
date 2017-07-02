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
    message = message ||"";
    var msg = [];
    if( filename )msg.push( filename );
    if( line )msg.push( line );
    if( msg.length > 0 )
    {
        message+='('+ msg.join(':') +')';
    }
    this.message = this.name+": "+message;
    this.line=line;
    this.filename =filename;
};
System.Error=Error;
Error.prototype =Object.create( Object.prototype );
Error.prototype.constructor=Error;
Error.prototype.line=null;
Error.prototype.name='Error';
Error.prototype.message=null;
Error.prototype.filename=null;
Error.prototype.toString=function ()
{
    return this.message;
}