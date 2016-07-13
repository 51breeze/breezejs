/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

define([],function(){

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
    DataArray.prototype.length=0;
    DataArray.prototype.constructor = DataArray;

    /**
     * 获取指定开始和结束位置的元素
     * @param start
     * @param end
     * @returns {Array}
     */
    DataArray.prototype.slice=function(start,end)
    {
        start=start || 0;
        start = start < 0 ? this.length+start : start;
        end= typeof end ==='number' ? end : this.length;
        var index=start,items=[];
        for( ; index < end ; index++ )
        {
            if( typeof this[index] !=='undefined' )
              items.push( this[ index ] );
        }
        return items;
    }

    /**
     * 将元素数据转换成数组并返回
     * @returns {Array}
     */
    DataArray.prototype.toArray=function()
    {
        return this.slice();
    }

    /**
     * 删除替换压入操作
     * @param {Number} [start]
     * @param {Number} [deleteCount]
     * @param {...*} [items]
     * @return {Array}
     */
    DataArray.prototype.splice=function()
    {
        var arg=[arguments[0],arguments[1]];
        for(var i=2; i<arguments.length; i++) if(typeof arguments[i] !== 'undefined' )
        {
            arg=arg.concat( arguments[i] );
        }
        return Array.prototype.splice.apply(this, arg );
    }

    /**
     * 合并元素到对象中
     * @returns {DataArray}
     */
    DataArray.prototype.concat=function()
    {
        var items = Array.prototype.concat.apply( [] , arguments );
        var index = 0;
        var len =  items.length;
        for( ; index<len; index++ )if( typeof items[ index ] !== 'undefined' )
        {
            this[ this.length ] = items[ index ];
            this.length++;
        }
        return this;
    }

    /**
     * 返回指定元素的索引位置
     * @param searchElement
     * @returns {number}
     */
    DataArray.prototype.indexOf=Array.prototype.indexOf || function(searchElement)
    {
        var i=0;
        for( ; i<this.length; i++ )if( this[i]===searchElement )
            return i;
        return -1;
    }

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
        orderby = orderby.join("\r\ns=s==0?")
        orderby+="\r\n  return s;";
        var fn = new Function( orderby );
        var s = DataArray.prototype.sort.call(this, fn);
        return this;
    }

    /**
     * 过滤数组
     * @param function callback
     */
    DataArray.prototype.filter=Array.prototype.filter || function( callback )
    {
         if( typeof callback !== "function" )
         {
             callback=function( item ){ return !!item; }
         }
         var index = 0;
         while( index < this.length )
         {
             if( !callback( this[index] ) )
             {
                 this.splice(index,1);

             }else
             {
                 index++;
             }
         }
         return this;
    }

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
    }


    /**
     * 遍历元素
     * @param callback
     * @param refObject
     * @returns {*}
     */
    DataArray.prototype.forEach=Array.prototype.forEach || function( callback )
    {
        var items=DataArray.prototype.slice.call(this,0),
            index = 0,
            len=items.length;
        for( ; index < len ; index++ )
        {
            result=callback.call( this ,items[index],index);
            if( result !== undefined )
                break;
        }
        return this;
    }

    /**
     * 去掉重复的元素
     * @returns {DataArray}
     */
    DataArray.prototype.unique=function()
    {
        var arr= this.slice(0);
        for (var i = 0; i<arr.length; i++)
        {
           for(var b=i+1; b<arr.length; b++ )
           {
               if( arr[i]===arr[b] )
               {
                   arr.splice(b,1);
               }
           }
        }
        this.splice(0,this.length, arr);
        return this;
    }

    DataArray.DESC='desc';
    DataArray.ASC='asc';
    return DataArray;
})