/**
 * 迭代构造器
 * @param target
 * @constructor
 */
function Iterator( target )
{
    if( system.is(target,Iterator) )return target;
    if( !(this instanceof Iterator) ) return new Iterator(target);
    this.items = getEnumerableProperties.call(target);
    return this;
}
Iterator.current=null;
Iterator.prototype = new Object();
Iterator.prototype.items = null;
Iterator.prototype.cursor = -1;
Iterator.prototype.constructor = Iterator;

/**
 * 将指针向前移动一个位置并返回当前元素
 * @returns {*}
 */
Iterator.prototype.seek= function seek()
{
    if( this.items.length <= this.cursor+1 )return false;
    return this.items[ ++this.cursor ];
}

/**
 * 返回当前指针位置的元素
 * @returns {*}
 */
Iterator.prototype.current=function current()
{
    if(this.cursor<0)this.cursor=0;
    return this.items[ this.cursor ];
}

/**
 * 返回上一个指针位置的元素
 * 如果当前指针位置在第一个则返回false
 * @returns {*}
 */
Iterator.prototype.prev=function prev()
{
    if( this.cursor < 1 )return false;
    return this.items[ this.cursor-1 ];
}

/**
 * 返回下一个指针位置的元素。
 * 如果当前指针位置在最后一个则返回false
 * @returns {*}
 */
Iterator.prototype.next=function next()
{
    if( this.cursor >= this.items.length )return false;
    return this.items[ this.cursor+1 ];
}

/**
 * 将指针移到到指定的位置并返回当前位置的元素
 * @param cursor
 * @returns {*}
 */
Iterator.prototype.move=function move( cursor )
{
    cursor=cursor >> 0;
    if( cursor < 0 || cursor >= this.items.length )return false;
    this.cursor = cursor;
    return this.items[ this.cursor ];
}

/**
 * 重置指针
 * @returns {Iterator}
 */
Iterator.prototype.reset=function reset()
{
    this.cursor = -1;
    return this;
}