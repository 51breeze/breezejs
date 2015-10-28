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
        'param':'',
        'profile':{
            'data':'data',     //数据集
            'total':'total',   //数据总数
            'offset':'%offset%', //数据偏移量
            'rows'  : '%rows%' , //每次摘取多少行数据
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
    var dispatch=function(item,type,index,event)
    {
        if( this.hasEventListener(type) )
        {
            var event = new DataSourceEvent(type)
            event.originalEvent=event;
            event.item=item;
            event.index = index;
            this.dispatchEvent( event );
        }
    }

    function DataSource(source,option)
    {
        if( !(this instanceof DataSource) )
        {
            return new DataSource(source,option);
        }
        EventDispatcher.call(this);

        /**
         * @private
         */
        var options;

        /**
         * @private
         */
        var _isRemote=false;

        /**
         * @returns {boolean}
         */
        this.isRemote=function()
        {
            return _isRemote;
        }

        /**
         * @private
         */
        var _source;

        /**
         * 数据源
         * @returns {DataSource|window.HttpRequest}
         */
        this.source=function( source , option )
        {
            if( typeof source !== "undefined" )
            {
                options = Breeze.extend(true, {}, defaultOption, option || options || {} );

                if( Breeze.isObject(source, true) )
                {
                    var len = this.length;
                    this.splice(0, len, source);
                    if( _source )
                    {
                        this.removeEventListener(DataSourceEvent.LOAD_START);
                    }
                    return this;
                }

                if( typeof source === 'string' )
                {
                    options.url = source;
                    if( _source )
                    {
                        _source.setting({'url':source});
                        source=_source;

                    }else {

                        source = new HttpRequest(options);
                    }
                }

                if ( source instanceof HttpRequest && _source !== source )
                {
                    _source=source;
                    _isRemote=true;
                    var rows = options.preloadRows;
                    var beforehand = false;
                    var loadNum = 0;
                    var self = this;

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
                        if (typeof self.__fetched__ === "number") {
                            self.fetch(self.__fetched__);
                        }

                    },true,0);

                    this.addEventListener(DataSourceEvent.LOAD_START, function (event)
                    {
                        beforehand = !!event.beforehand;
                        var offset = loadNum * rows;
                        var url =  options.url.replace(options.profile.offset, offset).replace(options.profile.rows, rows);
                        options.param = options.param.replace(options.profile.offset, offset).replace(options.profile.rows, rows);
                        source.open(url, options.method);
                        source.send(options.param);

                    });

                    return source;
                }
            }
            return this;
        }

        /**
         * @private
         */
        var _preloadPages=1;

        /**
         * 预加载分页数
         * @param num
         * @returns {*}
         */
        this.preloadPages=function(num)
        {
            if( num >= 0 ) {
                _preloadPages = num;
                return this;
            }
            return _preloadPages;
        }

        /**
         * @private
         */
        var _pageRows= 20;

        /**
         * 每页显示数据行数
         * @param number rows
         * @returns {DataSource}
         */
        this.rows=function( rows )
        {
            if( rows >= 0 ) {
                _pageRows = rows;
                return this;
            }
            return _pageRows;
        }

        /**
         * @private
         */
        var _predicts= 0;

        /**
         * 预计总数
         * @param number num
         * @returns {DataSource}
         */
        this.predicts=function( num )
        {
            if( num >= 0 ) {
                _predicts = num;
                return this;
            }
            return _predicts || this.length;
        }

        /**
         * @private
         */
        var _grep=null;

        /**
         * 获取检索对象
         * @returns {*|Grep}
         */
        this.grep=function()
        {
            return _grep || ( _grep=new Grep( this ) );
        }

        /**
         * 从指定条件中查询
         * @param condition
         */
        this.where=function( filter )
        {
            if( typeof filter === "string" ) {
                this.grep().filter( filter )
            }
            return this;
        }

        /**
         * @private
         */
        var _currentPages = 0;

        /**
         * 获取设置当前分页数
         * @param num
         * @returns {*}
         */
        this.currentPages=function( num )
        {
           if( num > 0 ) {

               if(  _currentPages !== num )
               {
                   _currentPages = num;
                   this.fetch();
               }
               return this;
           }
           return Math.min( Math.max(_currentPages,1) , this.totalPages() );
        }

        /**
         * 总分页数
         * @return number
         */
        this.totalPages=function()
        {
           return Math.ceil( this.predicts() / this.rows() );
        }

        /**
         * 初始化数据源
         */
        this.source( source, option );
    }

    DataSource.prototype = new EventDispatcher();
    DataSource.prototype.constructor=DataSource;

    /**
     * 添加数据项到指定的索引位置
     * @param item
     * @param index
     * @returns {DataSource}
     */
    DataSource.prototype.add=function(item,index)
    {
        if( item )
        {
            index = typeof index === 'number' ? index : this.length;
            index = index < 0 ? index + this.length+1 : index;
            index = Math.min( this.length, Math.max( index, 0 ) )
            this.splice(index,0,item);
            dispatch.call(this,item,DataSourceEvent.ADD,index);
            dispatch.call(this,item,DataSourceEvent.CHANGED,index);
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
        var index,item;
        var result = this.grep().execute( filter );
        for(var i=0; i<result.length ; i++)
        {
            index = this.indexOf( result[i] )
            if( index >=0 && index < this.length )
            {
                item=this.splice(index,1);
            }else
            {
                throw new Error('index invalid');
            }
        }

        if( result.length > 1  )
        {
            index = NaN;
        }

        dispatch.call(this,result,DataSourceEvent.REMOVE,index);
        dispatch.call(this,result,DataSourceEvent.CHANGED,index);
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
        if( flag )
        {
            var index = NaN;
            if (result.length === 1) {
                index = this.indexOf(result[0]);
            }
            dispatch.call(this, result, DataSourceEvent.ALTER, index);
            dispatch.call(this, result, DataSourceEvent.CHANGED, index);
        }
        return flag;
    }

    /**
     * 选择数据集
     * @returns {DataSource}
     */
    DataSource.prototype.fetch=function( filter )
    {
        var page = this.currentPages();
        var rows=this.rows(),start=( page-1 ) * rows;
        this.__fetched__ = page;

        if( ( start+rows < this.length || this.isRemote() !==true || !this.hasEventListener(DataSourceEvent.LOAD_START) ) &&
            this.hasEventListener(DataSourceEvent.FETCH) )
        {
            this.__fetched__=null;
            var offset  =  start;
            var end     = Math.min( start+rows, this.length );
            var result = this.grep().execute( filter );
            var data = result.slice( offset, end );
            this.dispatchEvent( new DataSourceEvent( DataSourceEvent.FETCH, {'data': data} ) );
        }

        //预加载数据
        if( this.isRemote() === true && (this.length - start) <= rows*this.preloadPages() && this.hasEventListener( DataSourceEvent.LOAD_START ) )
        {
            var  event = new DataSourceEvent( DataRenderEvent.LOAD_START );
            event.beforehand = ( this.length > start+rows );
            this.dispatchEvent( new DataSourceEvent( event ) );
        }
        return this;
    }

    function DataSourceEvent( src, props ){ BreezeEvent.call(this, src, props);}
    DataSourceEvent.prototype=new BreezeEvent();
    DataSourceEvent.prototype.constructor=DataSourceEvent;
    DataSourceEvent.prototype.item=null;
    DataSourceEvent.prototype.index=NaN;
    DataSourceEvent.prototype.beforehand=false;
    DataSourceEvent.prototype.data=null;

    DataSourceEvent.ADD='dataSourceItemAdd';
    DataSourceEvent.REMOVE='dataSourceItemRemove';
    DataSourceEvent.CHANGED='dataSourceItemChanged';
    DataSourceEvent.ALTER='dataSourceItemAlter';
    DataSourceEvent.FETCH = 'dataSourceFetch';
    DataSourceEvent.LOAD_START='dataSourceLoadStart';
    DataSourceEvent.LOAD_COMPLETE='dataSourceLoadComplete';

    window.DataSource=DataSource;
    window.DataSourceEvent=DataSourceEvent;


})(window)