/*
* BreezeJS : JavaScript framework
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/

function DataArray()
{
    if( !(this instanceof DataArray) )
    {
        var d = new DataArray();
        return d.concat.apply(d, arguments);
    }
    Array.call(this);
    this.length = 0;
    this.concat.apply(this,arguments);
}

DataArray.prototype=new Array();
DataArray.prototype.constructor = DataArray;



/**
 * 根据指定的列进行排序
 * @param column
 * @param type
 * @returns {DataArray}
 */
DataArray.prototype.orderBy=function(column,type)
{
    var orderGroup=column,orderby=['var a=arguments[0],b=arguments[1],s=0;'];
    if( typeof column !== "object" )
    {
        orderGroup={};
        orderGroup[ column ] = type;
    }
    for(var c in orderGroup )
    {
         type = DataArray.DESC === orderGroup[c].toLowerCase() ?  DataArray.DESC :  DataArray.ASC;
         orderby.push( type===DataArray.DESC ? "Breeze.compare(b['"+c+"'],a['"+c+"']):s;" : "Breeze.compare(a['"+c+"'],b['"+c+"']):s;");
    }
    orderby = orderby.join("\r\ns=s==0?");
    orderby+="\r\n  return s;";
    var fn = new Function( orderby );
    var s = DataArray.prototype.sort.call(this, fn);
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
    var index = 0, len=this.length;
    for( ; index < len ; index++ )
    {
        result+=callback.call( this ,this[index] ) || 0;
    }
    return result;
};

DataArray.DESC='desc';
DataArray.ASC='asc';

