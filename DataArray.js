/*
* BreezeJS : JavaScript framework
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require System,Array,Object
*/

function DataArray()
{
    if( !System.instanceOf(this,DataArray) )
    {
        return Array.apply( new DataArray(), Array.prototype.slice.call(arguments,0) );
    }
    return Array.apply(this, Array.prototype.slice.call(arguments,0) );
}
System.DataArray=DataArray;
DataArray.DESC='desc';
DataArray.ASC='asc';
DataArray.prototype= Object.create( Array.prototype );
DataArray.prototype.constructor = DataArray;

/**
 * 根据指定的列进行排序
 * @param column
 * @param type
 * @returns {DataArray}
 */
DataArray.prototype.orderBy=function(column,type)
{
    var field=column,orderby=['var a=arguments[0],b=arguments[1],s=0;'];
    if( typeof column !== "object" )
    {
        field={};
        field[ column ] = type;
    }
    for(var c in field )
    {
         type = DataArray.DESC === field[c].toLowerCase() ?  DataArray.DESC :  DataArray.ASC;
         orderby.push( type===DataArray.DESC ? "System.compare(b['"+c+"'],a['"+c+"']):s;" : "System.compare(a['"+c+"'],b['"+c+"']):s;");
    }
    orderby = orderby.join("s=s==0?");
    orderby+="return s;";
    Array.prototype.sort.call(this, new Function( orderby ) );
    return this;
};

/**
 * 统计数组中所有值的和
 * @param function callback 回调函数，返回每个项的值。
 * @returns {number}
 * @public
 */
DataArray.prototype.sum=function( callback )
{
    var result = 0;
    if( typeof callback !== "function" )
    {
        callback = function( value )
        {
            value = typeof value === "string" ? parseInt(  value ) || 0 : value;
            return typeof value === "number"  ?  value : 0;
        }
    }
    var index=0,len=this.length;
    for(;index<len;index++)
    {
        result+=callback.call(this,this[index]) || 0;
    }
    return result;
};

