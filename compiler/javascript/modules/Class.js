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
    if( this.constructor instanceof Class )
    {
        return '[object '+this.classname+']';
    } else if( this instanceof Class )
    {
        return '[Class: '+this.classname+']';
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
    var obj = this instanceof System.Class ? this : this.constructor;
    if( obj instanceof System.Class )
    {
        return obj === this ? '[Class: '+obj.classname+']' : '[object '+obj.classname+']';
    }else if( obj instanceof System.Interface )
    {
        return '[Interface: '+obj.classname +']';
    }
    return $Object.prototype.toString.call( this );
}

System.Class = Class;