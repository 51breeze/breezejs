/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(window,undefined){

    function Grep()
    {
        if( !(this instanceof Grep) )
            return new Grep();

        this.length=0;
        var filter=null;
        var changed=true;
        var getFilter = function()
        {
            if( filter!==null && changed === false )
                return filter;

            var i=0, item,type,value,command=[];
            for( ; i < this.length ; i++ )
            {
                item =  this[i];
                command.length===0 || command.push(item.logic);
                type = typeof item.value;
                value = type === "string" ? '"'+item.value+'"' : ( type === "function" ? 'this[' + i + '].value.call(item)' : 'this[' + i + '].value' );
                if( item.operational==='like' || item.operational==='notlike' )
                {
                    var flag = item.operational === 'notlike' ? '!' : '';
                    if( item.type === 'left' )
                    {
                        command.push(flag+"new RegExp('^'+this[" + i + "].value ).test( item[\"" + item.column + "\"] )");
                    }else if( item.type === 'right' )
                    {
                        command.push(flag+"new RegExp( this[" + i + "].value+'$' ).test( item[\"" + item.column + "\"] )");
                    }else
                    {
                        command.push(flag+"new RegExp( this[" + i + "].value ).test( item[\"" + item.column + "\"] )");
                    }
                }else
                {
                   command.push('item["' + item.column + '"] ' + item.operational + value);
                }
            }
            if( command.length === 0 )
              return null;
            filter = new Function( 'var item=arguments[0];\n if( '+command.join(' ')+' ){return true;}else{return false;}' );
            console.log( filter )
            changed=false;
            return filter;
        }

        /**
         * 筛选条件组合
         * @param column
         * @param value
         * @param operational
         * @param logic
         * @returns {Grep}
         */
        this.where=function( column , value, operational, logic ,type )
        {
            logic = logic==='or' ? '||' : '&&';
            this[ this.length ]={'logic':logic || '&&','column':column,'value': ( value instanceof Grep ? value.exec : value ) ,'operational':operational,'type':type};
            this.length++;
            return this;
        }

        /**
         * 执行筛选操作
         * @param data
         * @param filter
         * @returns {*}
         */
        this.exec=function( data ,filter )
        {
            if( typeof filter !=="function" )
            {
                filter = getFilter.call(this);
                if( !filter )return null;
            }

            if( data instanceof Array )
            {
                var result=[];
                for(var i in data ) if( filter.call(this,data[i]) )
                {
                    result.push( data[i] );
                }
                return result;

            }else if( filter.call(this,data) )
            {
                return data;
            }
            return null;
        }
    }


    /**
     * 筛选等于指定列的值
     * @param column
     * @param value
     * @param logic
     * @returns {Grep}
     */
    Grep.prototype.eq=function(column,value,logic)
    {
        this.where(column,value,'==',logic);
        return this;
    }

    /**
     * 筛选不等于指定列的值
     * @param column
     * @param value
     * @param logic
     * @returns {Grep}
     */
    Grep.prototype.not=function(column,value,logic)
    {
        this.where(column,value,'!=',logic);
        return this;
    }

    /**
     * 筛选大于列的值
     * @param column
     * @param value
     * @param logic
     * @returns {Grep}
     */
    Grep.prototype.gt=function(column,value,logic)
    {
        this.where(column,value,'>',logic);
        return this;
    }

    /**
     * 筛选小于列的值
     * @param column
     * @param value
     * @param logic
     * @returns {Grep}
     */
    Grep.prototype.lt=function(column,value,logic)
    {
        this.where(column,value,'<',logic);
        return this;
    }

    /**
     * 筛选大于等于列的值
     * @param column
     * @param value
     * @param logic
     * @returns {Grep}
     */
    Grep.prototype.gteq=function(column,value,logic)
    {
        this.where(column,value,'>=',logic);
        return this;
    }

    /**
     * 筛选小于等于列的值
     * @param column
     * @param value
     * @param logic
     * @returns {Grep}
     */
    Grep.prototype.lteq=function(column,value,logic)
    {
        this.where(column,value,'<=',logic);
        return this;
    }

    /**
     * 筛选模糊匹配列的值
     * @param column
     * @param value
     * @param logic
     * @returns {Grep}
     */
    Grep.prototype.like=function(column,value,type,logic)
    {
        this.where(column,value,'like',logic,type);
        return this;
    }

    /**
     * 筛选排除模糊匹配列的值
     * @param column
     * @param value
     * @param logic
     * @returns {Grep}
     */
    Grep.prototype.notLike=function(column,value,type,logic)
    {
        this.where(column,value,'notlike',logic,type);
        return this;
    }

    Grep.LIKE_LEFT='left';
    Grep.LIKE_RIGHT='right';
    Grep.LIKE_BOTH='both';

    window.Grep = Grep;

})(window)