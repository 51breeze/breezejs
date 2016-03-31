/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(window,undefined){

    /**
     * 调度事件
     */
    var dispatch=function(type,data,index,event)
    {
        if( this.hasEventListener(type) )
        {
            var e = new DataSourceEvent(type)
            e.originalEvent=event || null;
            e.data=data || null;
            e.index = index || NaN;
            return this.dispatchEvent( e );
        }
        return true;
    }

    /**
     * 修改、插入、删除后是否需要刷新当前渲染的数据
     */
    var callfetch=function(flag, type, result, index )
    {
        if( flag && dispatch.call(this, type, result, index) && this.__fetchCalled__)
        {
            this.fetch();
        }
    }

    /**
     * 向远程服务器开始加载数据
     */
    var doload = function ( segments )
    {
        segments = typeof segments === "number" ? segments : this.segments();
        var cached = this.__cached__;
        if( cached.lastSegments == segments || cached.loadSegmented.indexOf( segments )>=0 || !this.isRemote() )
            return true;

        var source =this.source();
        if( source.loading() )
        {
            cached.queues.push(segments);
            return false;
        }

        var options = this.options();
        var rows = this.preloadRows();
        var offset = segments * rows;
        var pageParam = {};
        pageParam[ options.requestProfile.offset ]=offset;
        pageParam[ options.requestProfile.rows ]=rows;
        pageParam = Utils.serialize(pageParam,'url');
        var url = options.url+( /\?/.test( options.url ) ? '&'+pageParam : '?'+pageParam );
        var data=options.param;
        if(  options.method === HttpRequest.METHOD.GET && !Utils.isEmpty(options.param) )
        {
            var param = Utils.serialize(options.param,'url');
            url =url+'&'+param;
            data=null;
        }

        if( dispatch.call(this,DataSourceEvent.LOAD_START) )
        {
            cached.lastSegments = segments;
            source.open( url, options.method );
            source.send( data );
            return true;
        }
        return false;
    }

    /**
     * 预加载数据
     */
    var preloadData =function()
    {
        var cached = this.__cached__;
        var segments= this.segments();
        if( this.isRemote() && this.length <= this.predicts() )
        {
            var queue = cached.queues;
            var num = this.preloadPages();
            var c = this.currentPages();
            var p = 0;
            var indexOf = queue.indexOf || DataArray.prototype.indexOf;
            var t = Math.floor( this.predicts() / this.preloadRows() );
            cached.loadSegmented.indexOf(segments)>=0 || queue.push( segments );

            while( num > p )
            {
                ++p;
                var next = this.segments( c+p ) ;
                var prev = this.segments( c-p );
                if( next != cached.lastSegments && segments != next && next <= t && indexOf.call(queue,next) < 0  )
                {
                    queue.push( next );
                }
                if( prev != cached.lastSegments && segments != prev && prev >=0 && indexOf.call(queue,prev) < 0 )
                {
                    queue.push( prev );
                }
            }
            var flag=true;
            while( queue.length > 0 && flag )
            {
                flag = doload.call(this, queue.shift() );
            }
        }
    }

    /**
     * 数据源
     * @param options
     * @returns {DataSource}
     * @constructor
     */
    function DataSource( options )
    {
        if( !(this instanceof DataSource) )
        {
            return new DataSource(options);
        }
        EventDispatcher.call(this);
        this.__options__={
            'method': HttpRequest.METHOD.GET,
            'dataType':HttpRequest.TYPE.JSON,
            'param':{},
            'delimiter':'%',
            //服务器响应后的json 对象
            'responseProfile':{
                'data':'data',     //数据集
                'total':'total',   //数据总数
                'code': 'code'     //状态码
            },
            //向服务器请求时需要添加的参数
            'requestProfile':{
                'offset':'offset', //数据偏移量
                'rows'  : 'rows'  //每次获取取多少行数据
            },
            "successCode" : 0 //成功时的状态值
        };
        this.options( options );
        this.__cached__={'queues':[],'lastSegments':null,'loadSegmented':new DataArray() };
    }

    DataSource.prototype = new EventDispatcher();
    DataSource.prototype.constructor=DataSource;
    DataSource.prototype.length=0;
    DataSource.prototype.indexOf=DataArray.prototype.indexOf;
    DataSource.prototype.splice=DataArray.prototype.splice;
    DataSource.prototype.slice=DataArray.prototype.slice;
    DataSource.prototype.concat=DataArray.prototype.concat;
    DataSource.prototype.forEach=DataArray.prototype.forEach;
    DataSource.prototype.toArray=DataArray.prototype.toArray;
    DataSource.prototype.__isRemote__=false;
    DataSource.prototype.__cached__={};

    /**
     * @returns {boolean}
     */
    DataSource.prototype.isRemote=function()
    {
        return this.__isRemote__;
    }

    /**
     * @private
     */
    DataSource.prototype.__options__={};

    /**
     * @param object options
     * @returns {*}
     */
    DataSource.prototype.options=function( options )
    {
        if( typeof options !== "undefined" )
        {
            if( Utils.isObject(options) )
            {
                this.__options__ = Utils.extend(true,this.__options__, options);
            }
            return this;
        }
        return this.__options__;
    }

    /**
     * @private
     */
    DataSource.prototype.__source__=null;

    /**
     * 数据源
     * @returns {DataSource|window.HttpRequest}
     */
    DataSource.prototype.source=function( source )
    {
        if(  typeof source === "undefined"  )
            return  this.__source__;

        if( this.__source__ === source )
        {
            return this;
        }

        if( source === null )
        {
            this.splice(0, this.length);
            this.removeEventListener(DataSourceEvent.LOAD_START);
            if (this.__source__ instanceof HttpRequest)
                this.__source__.removeEventListener(HttpEvent.SUCCESS);
            return this;
        }

        //本地数据源
        if( Utils.isObject(source, true) )
        {
            var len = this.length;
            this.splice(0, len, source);
            this.__source__=source;

            //do order by
            var orderBy = this.orderBy();
            if(orderBy)for(var b in orderBy)
            {
                this.orderBy(b,orderBy[b], true);
            }
        }
        //远程数据源
        else
        {
            var options = this.options();
            if( typeof source === 'string' )
            {
                options.url = source;
                source = new HttpRequest(options);
            }

            if ( source instanceof HttpRequest )
            {
                this.__source__=source;
                this.__isRemote__=true;
                var cached = this.__cached__;

                //请求远程数据源侦听器
                source.addEventListener( HttpEvent.SUCCESS, function (event)
                {
                    var totalProfile = options.responseProfile.total;
                    var dataProfile = options.responseProfile.data;
                    var stateProfile = options.responseProfile.code;

                    if( event.data[ stateProfile ] != options.successCode)
                    {
                        throw new Error('加载数据失败');
                    }

                    var data = event.data;
                    var total = parseInt( data[totalProfile] ) || 0;
                    if ( total > 0 ) {
                        this.predicts( total );
                    }

                    data = typeof data[dataProfile] !== 'undefined' ? data[dataProfile] : data;
                    var lastSegments = cached.lastSegments;
                    cached.loadSegmented.push( lastSegments );
                    cached.loadSegmented=cached.loadSegmented.sort(function(a,b){return a-b});

                    var offset = cached.loadSegmented.indexOf( lastSegments ) * this.preloadRows();
                    this.splice( offset , 0, data);

                    //没有可加载的数据，直接删除事件侦听
                    if ( !(data instanceof Array) || this.length >= this.predicts() )
                    {
                        this.removeEventListener(DataSourceEvent.LOAD_START);
                    }

                    //更新视图的数据
                    if( this.__fetched__ && this.__fetchCalled__ )
                    {
                        this.fetch();
                    }

                    //调度完成事件
                    dispatch.call(this,DataSourceEvent.LOAD_COMPLETE,data, offset, event);

                    //预加载数据
                    preloadData.call(this);

                }, false,0,this);
            }
        }
        return this;
    }

    /**
     * @private
     */
    DataSource.prototype.__preloadPages__=1;

    /**
     * 预加载分页数
     * @param num
     * @returns {*}
     */
    DataSource.prototype.preloadPages=function(num)
    {
        if( num >= 0 ) {
            this.__preloadPages__ = num;
            return this;
        }
        return this.__preloadPages__;
    }

    /**
     * @private
     */
    DataSource.prototype.__rows__= 20;

    /**
     * 每页显示数据行数
     * @param number rows
     * @returns {DataSource}
     */
    DataSource.prototype.rows=function( rows )
    {
        if( rows >= 0 ) {
            this.__rows__ = rows;
            this.__preloadRows__ = Math.max(this.__preloadRows__,rows);
            return this;
        }
        return this.__rows__;
    }

    /**
     * @private
     */
    DataSource.prototype.__preloadRows__= 100;

    /**
     * 每页显示数据行数
     * @param number rows
     * @returns {DataSource}
     */
    DataSource.prototype.preloadRows=function( preloadRows )
    {
        if( preloadRows > 0 )
        {
            this.__preloadRows__ = Math.max(preloadRows, this.__rows__ );
            return this;
        }
        return this.__preloadRows__;
    }

    /**
     * @private
     */
    DataSource.prototype.__predicts__= 0;

    /**
     * 预计总数
     * @param number num
     * @returns {DataSource}
     */
    DataSource.prototype.predicts=function( num )
    {
        if( num >= 0 ) {
            this.__predicts__ = num;
            return this;
        }
        return this.__predicts__ || this.length;
    }


    /**
     * @private
     */
    DataSource.prototype.__grep__=null;

    /**
     * 获取检索对象
     * @returns {*|Grep}
     */
    DataSource.prototype.grep=function()
    {
        return this.__grep__ || ( this.__grep__=new Grep( this ) );
    }

    /**
     * 从指定条件中查询
     * @param condition
     */
    DataSource.prototype.where=function( filter )
    {
        if( typeof filter === "string" ) {
            this.grep().filter( filter )
        }
        return this;
    }

    /**
     * @private
     */
    DataSource.prototype.__currentPages__ = 1;

    /**
     * 获取设置当前分页数
     * @param num
     * @returns {*}
     */
    DataSource.prototype.currentPages=function( num )
    {
        if( typeof num !== 'undefined' )
        {
            if( num > 0 )
            {
                if( this.__currentPages__ !== num && !this.__fetched__)
                {
                    this.__currentPages__ = num;
                    this.fetch();
                }
            }
            return this;
        }
        var c =  Math.max(this.__currentPages__,1);
        return Math.min( c  , this.totalPages() || c  );
    }

    /**
     * 根据当前加载的页码，计算当前向服务器请求的段数
     * @returns {number}
     */
    DataSource.prototype.segments=function( page )
    {
        page = Math.max( (page || this.__currentPages__) , 1 );
        page = Math.min( page, this.totalPages() || page);
        return Math.floor( (page-1) * this.rows() / this.preloadRows() );
    }

    /**
     * 总分页数
     * @return number
     */
    DataSource.prototype.totalPages=function()
    {
        return this.predicts() >0 ? Math.max( Math.ceil( this.predicts() / this.rows() ) , 1) : NaN ;
    }

    /**
     * @private
     */
    DataSource.prototype.__orderBy__={};

    /**
     * @param column
     * @param type
     */
    DataSource.prototype.orderBy=function(column,type)
    {
        if( typeof type === "undefined" )
        {
            return  typeof column === "undefined" ? this.__orderBy__ : this.__orderBy__[column] || null;

        }else if( typeof column === "string" )
        {
            type = type || DataArray.ASC;
            if( this.__orderBy__[ column ] !==type )
            {
                this.__orderBy__[ column ]=type;
                this.__orderByChanged__=true;
                !this.__fetchCalled__ || this.fetch();
            }
        }
        return this;
    }

    /**
     * 通过视图索引返回对应数据源的索引位置
     * @param index
     * @returns {number}
     */
    DataSource.prototype.viewIndex=function( index )
    {
        var index = parseInt(index);
        if( isNaN(index) )return index;
        return ( this.currentPages()-1 ) * this.rows() + index;
    }

    /**
     * 根据视图索引返回数据项
     * @param index
     * @returns {number}
     */
    DataSource.prototype.getItemByViewIndex=function( index )
    {
        var index = this.viewIndex( index );
        if( !isNaN(index) ) {
            return this[index] || null;
        }
        return null;
    }

    /**
     * 添加数据项到指定的索引位置
     * @param item
     * @param index
     * @returns {DataSource}
     */
    DataSource.prototype.append=function(item,index)
    {
        if( item )
        {
            var oldlen= this.length;
            index = typeof index === 'number' ? index : this.length;
            index = index < 0 ? index + this.length+1 : index;
            index = Math.min( this.length, Math.max( index, 0 ) )
            this.splice(index,0,item);
            if( this.isRemote() && this.__predicts__>0 )
            {
                this.__predicts__+= this.length - oldlen;
            }
            callfetch.call(this,true,DataSourceEvent.APPEND,item,index);
        }
        return this;
    }

    /**
     * 移除指定索引下的数据项
     * @param index
     * @returns {boolean}
     */
    DataSource.prototype.remove=function( filter )
    {
        var index;
        var result = this.grep().execute( filter );
        for(var i=0; i<result.length ; i++)
        {
            index = this.indexOf( result[i] );
            if( index >=0 && index < this.length )
            {
                this.splice(index,1);
            }else
            {
                throw new Error('index invalid');
            }
        }
        callfetch.call(this,result.length > 0,DataSourceEvent.REMOVE,result);
        return this;
    }

    /**
     * 修改数据
     * @param index
     * @returns {boolean}
     */
    DataSource.prototype.alter=function( data, filter )
    {
        var result = this.grep().execute(filter);
        var flag=false;
        for(var i=0; i<result.length ; i++)
        {
            for( var c in data )
            {
                if( typeof result[i][c] !== "undefined" )
                {
                    result[i][c] = data[c];
                    flag=true;
                }else
                {
                    throw new Error('unknown column this '+c );
                }
            }
        }
        callfetch.call(this,flag, DataSourceEvent.ALTER, result )
        return flag;
    }


    /**
     * 选择数据集
     * @returns {DataSource}
     */
    DataSource.prototype.fetch=function( filter )
    {
        if( this.__orderByChanged__ )
        {
            this.__orderByChanged__=false;
            var orderby = this.orderBy();
            for(var column in orderby )
            {
                DataArray.prototype.orderBy.call(this,column, orderby[column] );
            }
        }

        this.__fetchCalled__=true;
        var page = this.currentPages();
        var rows=this.rows(),start=( page-1 ) * rows;
        var preloadRows=  this.preloadRows();
        var segments= this.segments();
        var cached = this.__cached__;
        var index = cached.loadSegmented.indexOf( segments );
        var offset  = index * preloadRows + (start % preloadRows);
        this.__fetched__ = true;
        var waiting = !this.isRemote() || offset < 0 || this.length<1 || (this.length < offset+rows && this.totalPages()>page);

        if( this.__lastWaiting__!= waiting && this.isRemote() && this.hasEventListener(DataSourceEvent.WAITING) )
        {
            this.__lastWaiting__= waiting;
            var event = new DataSourceEvent(DataSourceEvent.WAITING);
            event.waiting=waiting;
            this.dispatchEvent(event);
        }

        //发送数据
        if( !waiting && this.hasEventListener(DataSourceEvent.FETCH) )
        {
            var result = this.grep().execute( filter );
            this.__fetched__= false;
            var end = Math.min( offset+rows, this.length );
            var data = result.slice( offset, end );
            var event = new DataSourceEvent( DataSourceEvent.FETCH );
            event.data = data;
            this.dispatchEvent( event);
        }
        preloadData.call(this);
        return this;
    }

    function DataSourceEvent(type, bubbles,cancelable){ BreezeEvent.call(this, type, bubbles,cancelable);}
    DataSourceEvent.prototype=new BreezeEvent();
    DataSourceEvent.prototype.constructor=DataSourceEvent;
    DataSourceEvent.prototype.index=NaN;
    DataSourceEvent.prototype.data=null;
    DataSourceEvent.prototype.waiting=false;

    DataSourceEvent.APPEND='dataSourceItemAppend';
    DataSourceEvent.REMOVE='dataSourceItemrRemove';
    DataSourceEvent.ALTER='dataSourceItemAlter';
    DataSourceEvent.FETCH = 'dataSourceFetch';
    DataSourceEvent.LOAD_START='dataSourceLoadStart';
    DataSourceEvent.LOAD_COMPLETE='dataSourceLoadComplete';
    DataSourceEvent.WAITING='dataSourceWaiting';

    window.DataSource=DataSource;
    window.DataSourceEvent=DataSourceEvent;

})(window)