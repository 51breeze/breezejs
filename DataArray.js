/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(window,undefined){

    function DataArray()
    {
        if( !(this instanceof DataArray) )
           return new DataArray();
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
        for(var i=2; i<arguments.length; i++)
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
        var len = this.length + items.length;
        for( var i=0; this.length<len; this.length++, i++ )if( typeof items[ i ] !== 'undefined' )
        {
            this[ this.length ] = items[ i ];
        }
        return this;
    }

    /**
     * 返回指定元素的索引位置
     * @param searchElement
     * @returns {number}
     */
    DataArray.prototype.indexOf=function(searchElement)
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
        type =type && DataArray.DESC === type.toLowerCase() ?  DataArray.DESC :  DataArray.ASC;
        this.sort(function(a,b){
            if( typeof a[ column ] === "undefined" )
               return 0;
           return type === DataArray.ASC ? a[ column ].localeCompare( b[ column ] ):b[ column ].localeCompare( a[ column ] );
        })
        return this;
    }

    DataArray.DESC='desc';
    DataArray.ASC='asc';


    window.DataArray=DataArray;

})(window)