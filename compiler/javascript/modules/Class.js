/**
 * 类对象构造器
 * @returns {Class}
 * @constructor
 * @require System,Object;
 */
function Class(){};
Class.prototype = new Object();
Class.prototype.constructor = Class;
Class.prototype.valueOf=function()
{
    if(this==null)return this===null ? 'null' : 'undefined';
    if( this instanceof Class )
    {
        if( this.constructor.prototype === this )
        {
            return '[Class: '+this.classname+']';
        }
        return '[object '+this.classname+']';
    }
    return Object.prototype.valueOf.call( this );
}

/**
 * 返回指定对象的字符串表示形式。
 * @returns {String}
 */
Class.prototype.toString=function()
{
    if(this==null)return this===null ? 'null' : 'undefined';
    if( this instanceof Class )
    {
        if( this.constructor.prototype === this )
        {
            return '[Class: '+this.classname+']';
        }
        return '[object '+this.classname+']';
    }
    return Object.prototype.toString.call( this );
}
System.Class = Class;