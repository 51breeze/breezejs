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
                command.push( '!!this[' + i + '].value.filter().call(this[' + i + '].value,arguments[0])' );

            }else if( type === "function" )
            {
                command.push( 'this[' + i + '].value.call(this,arguments[0])' );

            }else if( item.operational=='index' || item.operational=='notindex')
            {
                var index= "arguments[1]";
                var flag = item.operational === 'notindex' ? '!' : '';
                value = value.split(',');
                command.push( flag+"("+value[0]+" >= "+index+" && "+value[1]+" <= "+index+")" );

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

                }else if( item.operational=='range' || item.operational=='notrange')
                {
                    var flag = item.operational === 'notrange' ? '!' : '';
                    value = value.split(',');
                    command.push( flag+"("+value[0]+" >= "+refvalue+" && "+value[1]+" <= "+refvalue+")" );

                }else
                {
                    command.push( refvalue + item.operational + value);
                }
            }
        }
        if( command.length === 0 )
        {
            return null;
        }
        return new Function('return ( '+command.join(' ')+' )' );
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


    Grep.prototype.__filter__=null;

    /**
     * 获取设置过滤器
     * @param filter
     * @returns {*}
     */
    Grep.prototype.filter=function( filter )
    {
        if( typeof filter === "undefined" )
        {
            this.__filter__ = createFilter.call(this);

        }else if ( typeof filter === 'string' && filter!='' )
        {

            var old = filter;
            filter = filter.replace(/(\w+)\s*([\>\<\=\!])/g,function(a,b,c)
            {
                c = c.length==1 && c=='=' ? '==' : c;
                return "arguments[0]['"+b+"']" + c;

            }).replace(/(not[\s]*)?(index)\(([\d\,\s]+)\)/ig,function(a,b,c,d)
            {
                var value = d.split(',');
                var start = parseInt( value[0] ) || 0;
                var end = parseInt( value[1] ) || start+1;
                var flag = typeof b=== "undefined" ? '' : '!';
                return flag+"( arguments[1] >= "+start+" && arguments[1] < "+end+") ";

            }).replace(/(\w+)\s+(not[\s]*)?(like|range|in)\(([^\)]*?)\)/ig,function(a,b,c,d,e)
            {
                var flag = typeof c=== "undefined" ? '' : '!';
                var refvalue = "arguments[0]['"+b+"']";
                if( /like/i.test(d) )
                {
                    e= e.replace(/(%)?([^%]*?)(%)?/,function(a,b,c,d){
                        return typeof b==='undefined' ? '^'+c : typeof d==='undefined' ? c+'$' : c;
                    });
                    e = flag+"new RegExp('"+e+"').test("+refvalue+")";

                }else if( /in/i.test(d) )
                {
                    e = flag+"( ["+e+"].indexOf("+refvalue+") >=0 )";

                }else
                {
                    var value = e.split(',');
                    e = flag+"("+refvalue+" >= "+value[0]+" && "+refvalue+" < "+value[1]+")";
                }
                return e;

            }).replace(/\s+(or|and)\s+/gi,function(a,b)
            {
                return b.toLowerCase()=='or' ? ' || ' : ' && ';
            })
            console.log( filter )
            this.__filter__=new Function('try{ return !!('+filter+') }catch(e){ throw new Error("syntax error is in grep:'+old+'");}');

        }else if( filter === null )
        {
            this.__filter__=null;
        }
        return this.__filter__;
    }

    /**
     * @returns {Grep}
     */
    Grep.prototype.clean=function()
    {
        for(var i=0; i<this.length; i++)
        {
            delete this[i];
        }
        this.__filter__=null;
        this.length=0;
        return this;
    }

    /**
     * 查询数据
     * @param data
     * @param filter
     * @returns {*}
     */
    Grep.prototype.execute=function( filter )
    {
        var data=this.data();
        filter = this.filter( filter );
        if( !filter )return data;
        var result=null;
        if( data instanceof Array || data instanceof DataSource )
        {
            result=[];
            for(var i=0; i<data.length; i++ ) if( !!filter.call( this, data[i], i) )
            {
                result.push( data[i] );
            }

        }else if( !!filter.call( this,data ) )
        {
            result=data;
        }
        return result;
    }

    /**
     * 指定范围
     * @param column
     * @param start
     * @param end
     * @param logic
     * @returns {*}
     */
    Grep.prototype.range=function(column,start,end,logic)
    {
        if(  start >= 0 || end > 0 )
        {
            where.call(this,column,start+','+end,'range',logic);
            return this;
        }
    }


    /**
     * 指定数据索引范围
     * @param column
     * @param start
     * @param end
     * @param logic
     * @returns {*}
     */
    Grep.prototype.index=function(start,end,logic)
    {
        if(  start >= 0 || end > 0 )
        {
            end =  parseInt(end) || 1 ;
            start =  parseInt(start) || 0;
            where.call(this,'index',start+','+start+end,'index',logic);
            return this;
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