/*
 * BreezeJS Grep class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(window,undefined){

    /**
     * 筛选条件组合
     * @param column
     * @param value
     * @param operational
     * @param logic
     * @returns {Grep}
     */
    var where=function( column , value, operational, logic ,type )
    {
        logic = logic==='or' ? '||' : '&&';
        this[ this.length ]= {'logic':logic,'column':column,'value':value,'operational':operational,'type':type};
        this.length++;
        return this;
    }

    /**
     * 根据据指定的条件生成筛选器
     * @returns {Function|*}
     */
    var createFilter = function()
    {
        var i=0, item,type,value,refvalue,command=[];
        for( ; i < this.length ; i++ )
        {
            item =  this[i];
            command.length===0 || command.push(item.logic);
            type = typeof item.value;
            value = 'this[' + i + '].value';

            if( item.value instanceof Grep )
            {
                command.push( 'this[' + i + '].value.exec(arguments[0])' );

            }else if( type === "function" )
            {
                command.push( 'this[' + i + '].value.call(this,arguments[0])' );

            }else
            {
                refvalue= "arguments[0][\"" + item.column + "\"]";
                if( item.operational==='like' || item.operational==='notlike' )
                {
                    var flag = item.operational === 'notlike' ? '!' : '';
                    if( item.type === 'right' )
                    {
                        command.push(flag+"new RegExp('^'+"+value+" ).test("+refvalue+")");
                    }else if( item.type === 'left' )
                    {
                        command.push(flag+"new RegExp("+value+"+'$' ).test("+refvalue+")");
                    }else
                    {
                        command.push(flag+"new RegExp( "+value+" ).test("+refvalue+")");
                    }

                }else
                {
                    command.push( refvalue + item.operational + value);
                }
            }
        }
        filter=command.length === 0 ? function(){return true} : new Function('return ( '+command.join(' ')+' )' );
        return filter;
    }


    /**
     * @returns {Grep}
     * @constructor
     */
    function Grep( data )
    {
        if( !(this instanceof Grep) )
            return new Grep( data );

        if( !(data instanceof Array) && typeof data !== 'object' )
        {
            throw new Error('invalid param.');
        }

        var _filter=null;

        /**
         * 获取设置过滤器
         * @param filter
         * @returns {*}
         */
        this.filter=function(filter)
        {
            if( typeof filter === "undefined" )
            {
                return _filter || ( _filter=createFilter.call(this) );
            }

            if( typeof filter === 'string' )
            {
                filter = filter.replace(/(\w+)\s*(?=[\=\!\<\>]+)/g,function(a,b){
                    return "arguments[0]['"+b+"']";
                }).replace(/(\w+)\s+(notlike|like)\s+([\'\"])([^\3]*)\3/g,function(a,b,c,d,e){

                    e= e.replace(/(%)?([^%]*)(%)?/,function(a,b,c,d){
                        return typeof b==='undefined' ? '^'+c : typeof d==='undefined' ? c+'$' : c;
                    });
                    return "new RegExp('"+e+"').test(arguments[0]['"+b+"'])";
                }).replace(/\s+(or|and)\s+/gi,function(a,b){
                    return b.toLowerCase()=='or' ? ' || ' : ' && ';
                }).replace(/([\!\>\<]?[\=]+)/g,function(a,b){
                    return b.length === 1 ? '==' : b;
                });
                filter=new Function('return !!('+filter+')');
            }

            _filter=filter;
            return this;
        }

        /**
         * @returns {*}
         */
        this.data=function(){return data;}

    }

    /**
     * constructor.
     * @type {Grep}
     */
    Grep.prototype.constructor=Grep;

    /**
     * @type {number}
     */
    Grep.prototype.length=0;

    /**
     * 执行筛选操作
     * @param data
     * @param filter
     * @returns {boolean}
     */
    Grep.prototype.exec=function( item )
    {
        return !!this.filter().call(this,item);
    }

    /**
     * 查询数据
     * @param data
     * @param filter
     * @returns {*}
     */
    Grep.prototype.query=function( filter )
    {
        if( typeof filter !== "undefined" )
        {
           this.filter( filter );
        }

        var data=this.data();
        if( data instanceof Array )
        {
            var result=[];
            for(var i in data ) if( this.exec( data[i] ) )
            {
                result.push( data[i] );
            }
            return result;

        }else if( this.exec( data ) )
        {
            return data;
        }
        return null;
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
        where.call(this,column,value,'==',logic);
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
        where.call(this,column,value,'!=',logic);
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
        where.call(this,column,value,'>',logic);
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
        where.call(this,column,value,'<',logic);
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
        where.call(this,column,value,'>=',logic);
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
        where.call(this,column,value,'<=',logic);
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
        where.call(this,column,value,'like',logic,type);
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
        where.call(this,column,value,'notlike',logic,type);
        return this;
    }

    Grep.LIKE_LEFT='left';
    Grep.LIKE_RIGHT='right';
    Grep.LIKE_BOTH='both';

    window.Grep = Grep;

})(window)