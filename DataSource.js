/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(window,undefined){


    var defaultOption={
        'method': HttpRequest.METHOD.GET,
        'dataType':HttpRequest.TYPE.JSON,
        'param':{},
        'delimiter':'%',
        'profile':{
            'data':'data',     //数据集
            'total':'total',   //数据总数
            'offset':'offset', //数据偏移量
            'rows'  : 'rows' , //每次摘取多少行数据
            'status': 'code'  //请求状态
        },
        'successStatus' : 0 , //成功时的状态值
        'preloadRows':100     //每次拉取的数据量
    };

    /**
     * 调度事件
     * @param item
     * @param type
     */
    var dispatch=function(data,type,index,event)
    {
        if( this.hasEventListener(type) )
        {
            var e = new DataSourceEvent(type)
            e.originalEvent=event;
            e.data=data;
            e.index = index;
            this.dispatchEvent( e );
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
        this.__options__ = Utils.extend(true, {}, defaultOption, options || {} );
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
    DataSource.prototype.__options__=null;

    /**
     * @returns {*}
     */
    DataSource.prototype.options=function()
    {
        return this.__options__ || defaultOption;
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

        var changed = this.__source__ !== null;

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
            this.removeEventListener(DataSourceEvent.LOAD_START);
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
                var rows = options.preloadRows;
                var beforehand = false;
                var loadNum = 0;
                var self = this;

                //请求远程数据源侦听器
                source.addEventListener( HttpEvent.SUCCESS, function (event)
                {
                    if (event.data[options.profile.status] != options.successStatus) {
                        throw new Error('加载数据失败');
                    }

                    loadNum++;
                    var data = event.data;
                    var totalProfile = options.profile.total;
                    var dataProfile = options.profile.data;
                    var total = parseInt( data[totalProfile] ) || 0;
                    if ( total > 0 ) {
                        self.predicts( total );
                    }

                    data = typeof data[dataProfile] !== 'undefined' ? data[dataProfile] : data;

                    //没有可加载的数据，直接删除事件侦听
                    if (!(data instanceof Array) || data.length < rows) {
                        self.removeEventListener(DataSourceEvent.LOAD_START);
                    }

                    var len = self.length;
                    self.splice(len, 0, data);

                    dispatch.call(self, data, DataSourceEvent.LOAD_COMPLETE, len, event);

                    //do order by
                    var orderBy = self.orderBy();
                    if(orderBy)for(var b in orderBy)
                    {
                        self.orderBy(b,orderBy[b], true);
                    }

                    if ( self.__fetched__ === true )
                    {
                        self.select();
                    }

                });

                //向远程服务器开始加载数据
                this.hasEventListener(DataSourceEvent.LOAD_START) || this.addEventListener(DataSourceEvent.LOAD_START, function (event)
                {
                    beforehand = !!event.beforehand;
                    var offset = loadNum * rows;
                    options.param[ options.profile.offset ]=offset;
                    options.param[ options.profile.rows ]=rows;
                    var data=options.param;

                    if(  options.method === HttpRequest.METHOD.GET )
                    {
                        var param = Utils.serialize(options.param,'url');
                        options.url += /\?/.test( options.url ) ? '&'+param : '?'+param;
                        data=null;
                    }

                    source.open( options.url, options.method );
                    source.send( data );
                });
            }
        }

        if( changed && this.hasEventListener(DataSourceEvent.CHANGED) )
        {
            this.dispatchEvent( new DataSourceEvent(DataSourceEvent.CHANGED) );
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
    DataSource.prototype.__pageRows__= 20;

    /**
     * 每页显示数据行数
     * @param number rows
     * @returns {DataSource}
     */
    DataSource.prototype.rows=function( rows )
    {
        if( rows >= 0 ) {
            this.__pageRows__ = rows;
            return this;
        }
        return this.__pageRows__;
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
    DataSource.prototype.__currentPages__ = 0;

    /**
     * 获取设置当前分页数
     * @param num
     * @returns {*}
     */
    DataSource.prototype.currentPages=function( num )
    {
        if( num > 0 ) {

            if(  this.__currentPages__ !== num )
            {
                this.__currentPages__ = num;
                this.select();
            }
            return this;
        }
        return Math.min( Math.max(this.__currentPages__,1) , this.totalPages() );
    }

    /**
     * 总分页数
     * @return number
     */
    DataSource.prototype.totalPages=function()
    {
        return Math.ceil( this.predicts() / this.rows() );
    }


    /**
     * @private
     */
    DataSource.prototype.__orderBy__={};

    /**
     * @param column
     * @param type
     */
    DataSource.prototype.orderBy=function(column,type,flag)
    {
        if( typeof type === "undefined" )
        {
            return  typeof column === "undefined" || !this.__orderBy__ ? this.__orderBy__ : this.__orderBy__[column];
        }
        if( typeof column === "string" )
        {
            this.__orderBy__ || ( this.__orderBy__={} );
            if( this.__orderBy__[ column ] !==type || flag===true )
            {
                this.__orderBy__[ column ]=type;
                this.orderBy(column,type);
                this.select();
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
    DataSource.prototype.insert=function(item,index)
    {
        if( item )
        {
            index = typeof index === 'number' ? index : this.length;
            index = index < 0 ? index + this.length+1 : index;
            index = Math.min( this.length, Math.max( index, 0 ) )
            this.splice(index,0,item);
            dispatch.call(this,item,DataSourceEvent.INSERT,index);
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
        if( result.length > 1  )
        {
            index = NaN;
        }
        dispatch.call(this,result,DataSourceEvent.DELETE,index);
        return this;
    }

    /**
     * 修改数据
     * @param index
     * @returns {boolean}
     */
    DataSource.prototype.update=function( data, filter )
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
        if( flag )
        {
            var index = NaN;
            if (result.length === 1) {
                index = this.indexOf(result[0]);
            }
            dispatch.call(this, result, DataSourceEvent.UPDATE, index);
        }
        return flag;
    }

    /**
     * 选择数据集
     * @returns {DataSource}
     */
    DataSource.prototype.select=function( filter )
    {
        var page = this.currentPages();
        var rows=this.rows(),start=( page-1 ) * rows;
        this.__fetched__ = true;

        //本地数据源
        if( ( start+rows < this.length || this.isRemote() !==true || !this.hasEventListener(DataSourceEvent.LOAD_START) ) &&
            this.hasEventListener(DataSourceEvent.SELECT) )
        {
            this.__fetched__= false;
            var offset  =  start;
            var end     = Math.min( start+rows, this.length );
            var result = this.grep().execute( filter );
            var data = result.slice( offset, end );
            var event = new DataSourceEvent( DataSourceEvent.SELECT )
            event.data = data;
            this.dispatchEvent( event );
        }

        //预加载数据,远程数据源
        if( this.isRemote() === true && (this.length - start) <= rows*this.preloadPages() && this.hasEventListener( DataSourceEvent.LOAD_START ) )
        {
            var  event = new DataSourceEvent( DataSourceEvent.LOAD_START );
            event.beforehand = ( this.length > start+rows );
            this.dispatchEvent( new DataSourceEvent( event ) );
        }
        return this;
    }

    function DataSourceEvent( src, props ){ BreezeEvent.call(this, src, props);}
    DataSourceEvent.prototype=new BreezeEvent();
    DataSourceEvent.prototype.constructor=DataSourceEvent;
    DataSourceEvent.prototype.index=NaN;
    DataSourceEvent.prototype.beforehand=false;
    DataSourceEvent.prototype.data=null;

    DataSourceEvent.INSERT='dataSourceItemInsert';
    DataSourceEvent.DELETE='dataSourceItemDelete';
    DataSourceEvent.UPDATE='dataSourceItemUpdate';
    DataSourceEvent.SELECT = 'dataSourceSelect';
    DataSourceEvent.LOAD_START='dataSourceLoadStart';
    DataSourceEvent.LOAD_COMPLETE='dataSourceLoadComplete';
    DataSourceEvent.CHANGED='dataSourceChanged';

    window.DataSource=DataSource;
    window.DataSourceEvent=DataSourceEvent;


})(window)