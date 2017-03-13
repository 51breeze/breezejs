/*
* BreezeJS DataSource class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require System,Object,Array,DataArray,EventDispatcher,Http,HttpEvent,DataSourceEvent,Math;
*/
function DataSource( options )
{
    if( !(this instanceof DataSource) )return new DataSource(options);
    DataArray.call(this);
    this.__options__={
        'method': Http.METHOD.GET,
        'dataType':Http.TYPE.JSON,
        'param':{},
        'primary':'id',
        'synch':{
            'enable':false,
            'asynch':false,
            'param':{},
            'method': Http.METHOD.POST,
            'actionProfile':'action',
            'url':null
        },
        'url':null,
        //服务器响应后的json对象
        'responseProfile':{
            'data':'data',     //数据集
            'total':'total',   //数据总数
            'code': 'code',     //状态码
            'error': 'error'    //错误消息
        },
        //向服务器请求时需要添加的参数
        'requestProfile':{
            'offset':'offset', //数据偏移量
            'rows'  :'rows'  //每次获取取多少行数据
        },
        "successCode" : 0 //成功时的状态值
    };
    this.options( options );
    this.__cached__={'queues':[],'lastSegments':null,'loadSegmented':new DataArray() };
}
System.DataSource=DataSource;
DataSource.prototype = Object.create( DataArray.prototype );
//合并EventDispatcher原型的方法和属性
Object.merge(DataSource.prototype, EventDispatcher.prototype);
//@private
DataSource.prototype.__isRemote__=false;
DataSource.prototype.__cached__={};

/**
 * 是否为一个远程数据源
 * @returns {boolean}
 */
DataSource.prototype.isRemote=function isRemote()
{
    return this.__isRemote__;
};

/**
 * 配置选项
 * @private
 */
DataSource.prototype.__options__={};

/**
 * 设置数据选项
 * @param object options
 * @returns {*}
 */
DataSource.prototype.options=function options( options )
{
    if( typeof options !== "undefined" )
    {
        if( System.isObject(options) )
        {
            this.__options__ = Object.merge(true,this.__options__, options);
        }
        return this;
    }
    return this.__options__;
};

/**
 * @private
 */
DataSource.prototype.__source__=null;

/**
 * 设置获取数据源
 * 允许是一个数据数组或者是一个远程请求源
 * @param Array source | String url | Http httpObject
 * @returns {DataSource|Http}
 */
DataSource.prototype.source=function( source )
{
    if(  typeof source === "undefined"  )return this.__source__;
    if( this.__source__ === source )return this;

    //清空数据源
    if( source === null )
    {
        this.splice(0, this.length);
        //移除数据加载侦听事件
        this.removeEventListener( DataSourceEvent.LOAD_START );
        //移除加载远程数据侦听事件
        if (this.__source__ instanceof Http)this.__source__.removeEventListener(HttpEvent.SUCCESS);
        return this;
    }

    //本地数据源数组
    if( System.isArray(source) )
    {
        this.splice(0, this.length);
        meregItems(this,source);
        this.__source__=source;
        doOrderBy.call(this);
    }
    //远程数据源
    else
    {
        var options = this.options();
        if( typeof source === 'string' )
        {
            options.url = source;
            source = new Http(options);
        }
        if ( source instanceof Http )
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
                    Internal.throwError('error','Loading data failed');
                }

                var data = event.data;
                if( ( dataProfile && typeof data[ dataProfile ] === 'undefined' ) || ( totalProfile && data[totalProfile] === 'undefined') )
                {
                    Internal.throwError('error','Response data fields is not correct.');
                }

                data = dataProfile ? data[dataProfile] : data;

                if( data )
                {
                    var total = totalProfile ? data[totalProfile] >> 0 : data.length >>0;
                    if ( total > 0 )this.predicts( total );
                    var lastSegments = cached.lastSegments;
                    cached.loadSegmented.push( lastSegments );
                    cached.loadSegmented=cached.loadSegmented.sort(function(a,b){return a-b});
                    var offset = cached.loadSegmented.indexOf( lastSegments ) * this.preloadRows();
                    meregItems(this,data);
                    doOrderBy.call(this);
                    //没有可加载的数据，直接删除事件侦听
                    if ( !(data instanceof Array) || this.length >= this.predicts() )
                    {
                        this.__loadcomplete__=true;
                        this.removeEventListener(DataSourceEvent.LOAD_START);
                    }
                    //更新视图的数据
                    if( this.__fetched__ && this.__fetchCalled__ )
                    {
                        this.select();
                    }
                }

                //调度完成事件
                dispatch.call(this,DataSourceEvent.LOAD_COMPLETE,data, offset, event);

                //预加载数据
                preloadData.call(this);

            }, false,0,this);
        }
    }
    return this;
};

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
};

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
};

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
};

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
    return Math.max(this.__predicts__ ,this.length);
};

/**
 * @private
 */
DataSource.prototype.__grep__=null;

/**
 * 获取检索对象
 * @returns {*|DataGrep}
 */
DataSource.prototype.grep=function()
{
    return this.__grep__ || ( this.__grep__=new DataGrep( this ) );
};

/**
 * 从指定条件中查询
 * @param condition
 */
DataSource.prototype.where=function( filter )
{
    if( typeof filter === "string" )
    {
        this.grep().filter( filter )
    }
    return this;
};

/**
 * @private
 */
DataSource.prototype.__currentPage__ = 1;

/**
 * 获取设置当前分页数
 * @param num
 * @returns {*}
 */
DataSource.prototype.currentPage=function( num )
{
    if( typeof num !== 'undefined' )
    {
        if( num > 0 )
        {
            if( this.__currentPage__ !== num && !this.__fetched__)
            {
                this.__currentPage__ = num;
                this.select();
            }
        }
        return this;
    }
    var c =  Math.max(this.__currentPage__,1);
    return Math.min( c  , this.totalPages() || c  );
};

/**
 * 根据当前加载的页码，计算当前向服务器请求的段数
 * @returns {number}
 */
DataSource.prototype.segments=function( page )
{
    page = Math.max( (page || this.__currentPage__) , 1 );
    page = Math.min( page, this.totalPages() || page);
    return Math.floor( (page-1) * this.rows() / this.preloadRows() );
};

/**
 * 总分页数
 * @return number
 */
DataSource.prototype.totalPages=function()
{
    return this.predicts() >0 ? Math.max( Math.ceil( this.predicts() / this.rows() ) , 1) : NaN ;
};

/**
 * @private
 */
DataSource.prototype.__orderBy__={};

/**
 * 对数据进行排序。只有数据源全部加载完成的情况下调用此方法才有效（本地数据源除外）。
 * @param column 数据字段
 * @param type   排序类型
 * @param flag   是否清空之前排序的字段
 */
DataSource.prototype.orderBy=function(column,type,flag)
{
    if( typeof type === "undefined" )
    {
        return  typeof column === "undefined" ? this.__orderBy__ : this.__orderBy__[column] || null;

    }else if( typeof column === "string" )
    {
        type = type || DataArray.ASC;

        if(flag)this.__orderBy__={};
        if( this.__orderBy__[ column ] !==type )
        {
            this.__orderBy__[ column ]=type;
            if( this.length > 0 && this.length < this.predicts() )
            {
                this.splice(0,this.length);
                this.__cached__.loadSegmented.splice(0,this.__cached__.loadSegmented.length);
                this.__cached__.lastSegments=null;

            }else
            {
                doOrderBy.call(this);
            }
            !this.__fetchCalled__ || this.select();
        }
    }
    return this;
};

/**
 * 当前页的索引值在当前数据源的位置
 * @param index 位于当前页的索引值
 * @returns {number}
 */
DataSource.prototype.offsetAt=function(index)
{
    var index = index>>0;
    if( isNaN(index) )return index;
    var start=( this.currentPage()-1 ) * this.rows();
    var offset = this.__cached__.loadSegmented.indexOf( this.segments() );
    if( offset>=0 )
    {
        var preloadRows=this.preloadRows();
        index += ( start % preloadRows );
        return offset * preloadRows + index;
    }
    return NaN;
};

DataSource.prototype.__increment__=0;

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
        var primary = this.options().primary;
        var increment= this.__increment__;
        if( primary  )
        {
            if( (!this.isRemote() || !this.__loadcomplete__) || increment==0 )
            {
                this.forEach(function(item){
                    if( typeof item[primary] === "undefined" )
                        throw new Error('primary field not exists.');
                    increment=Math.max(item[primary],increment);
                });
            }

            if( item instanceof Array )
            {
                for(var i=0; i<item.length; i++)
                {
                    increment++;
                    item[i][primary] = increment;
                }
                this.__increment__=increment;
            }else
            {
                increment++;
                item[primary] = increment;
                this.__increment__=increment;
            }
        }

        var oldlen= this.length;
        index = typeof index === 'number' ? index : this.length;
        index = index < 0 ? index + this.length+1 : index;
        index = Math.min( this.length, Math.max( index, 0 ) );
        this.splice(index,0,item);
        if( this.isRemote() && this.__predicts__>0 )
        {
            this.__predicts__ +=(this.length - oldlen);
        }
        doupdate.call(this,true,DataSourceEvent.APPEND,item,index);
    }
    return this;
};

/**
 * 移除指定索引下的数据项
 * @param index
 * @returns {boolean}
 */
DataSource.prototype.remove=function( filter )
{
    var index;
    var result = this.grep().execute( filter );
    var synch = this.synchronize();
    var primary = synch.primary;
    var d = [];
    for(var i=0; i<result.length ; i++)
    {
        index = this.indexOf( result[i] );
        if( index >=0 && index < this.length )
        {
            if( typeof result[i][primary] === "undefined" )
            {
                throw new Error('data primary not exists. '+primary)
            }
            d.push( result[i][primary] );
            this.splice(index,1);

        }else
        {
            throw new Error('index invalid');
        }
    }
    result={};
    result[primary] = d.join(',');
    doupdate.call(this,d.length > 0,DataSourceEvent.REMOVE,result);
    return this;
};

/**
 * 修改数据
 * @param index
 * @returns {boolean}
 */
DataSource.prototype.update=function update(data, filter )
{
    var result = this.grep().execute(filter);
    var flag=false;
    var updateData=[];
    for(var i=0; i<result.length ; i++)
    {
        var d={};
        updateData.push( d );
        for( var c in data )
        {
            if( typeof result[i][c] !== "undefined" )
            {
                if( result[i][c] != data[c] )
                {
                    result[i][c] = data[c];
                    d[c] = data[c];
                    flag=true;
                }
            }else
            {
                throw new Error('unknown column this '+c );
            }
        }
    }
    doupdate.call(this,flag, DataSourceEvent.UPDATE,  updateData.length >1 ? {'data':updateData} : updateData[0] );
    return flag;
};

/**
 * 选择数据集
 * @returns {DataSource}
 */
DataSource.prototype.select=function( filter )
{
    var page = this.currentPage();
    var rows=this.rows(),start=( page-1 ) * rows;
    var preloadRows=  this.preloadRows();
    var segments= this.segments();
    var cached = this.__cached__;
    var index = cached.loadSegmented.indexOf( segments );
    var offset  = index * preloadRows + (start % preloadRows);
    this.__fetched__ = true;
    this.__fetchCalled__=true;
    var waiting = !this.isRemote() || offset < 0 || (this.length<1 && !this.__loadcomplete__) ||
        (this.length < offset+rows && this.totalPages()>page);
    if( this.__lastWaiting__!= waiting && this.isRemote()
        && this.hasEventListener(DataSourceEvent.WAITING) )
    {
        this.__lastWaiting__= waiting;
        var event = new DataSourceEvent(DataSourceEvent.WAITING);
        event.waiting=waiting;
        this.dispatchEvent(event);
    }

    //发送数据
    if( !waiting && this.hasEventListener(DataSourceEvent.SELECT) )
    {
        var result = this.grep().execute( filter );
        this.__fetched__= false;
        var end = Math.min( offset+rows, this.length );
        var data = result.slice( offset, end );
        var event = new DataSourceEvent( DataSourceEvent.SELECT );
        event.data = data;
        this.dispatchEvent( event);
    }
    preloadData.call(this);
    return this;
};


/**
 * 调度事件
 */
function dispatch(type,data,index,event)
{
    if( this.hasEventListener(type) )
    {
        var e = new DataSourceEvent(type);
        e.originalEvent=event || null;
        e.data=data || null;
        e.index = index || NaN;
        return this.dispatchEvent( e );
    }
    return true;
};

/**
 * 修改、插入、删除后是否需要刷新当前渲染的数据
 */
function doupdate(flag, type, result, index)
{
    if( flag && dispatch.call(this, type, result, index) )
    {
        var synch = this.options().synch;
        if( synch && synch.enable )dosynch.call(this, result, type,index,synch);
        !this.__fetchCalled__ || this.select();
    }
};

/**
 * 向远程服务器开始加载数据
 */
function doload( segments )
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
    var param = Breeze.extend({},options.param,{orderby:this.orderBy()});
    param[ options.requestProfile.offset ]=offset;
    param[ options.requestProfile.rows ]=rows;

    if( dispatch.call(this,DataSourceEvent.LOAD_START) )
    {
        cached.lastSegments = segments;
        source.send( options.url,param ,options.method );
        return true;
    }
    return false;
};

var lastSynch=null;

/**
 * 同步数据
 */
function dosynch( data, action, index, setting )
{
    var options = this.options();
    var primary = options.primary;
    var url = setting.url || this.options().url;
    action = action.match(/append|remove|alter/i)[0].toLowerCase();

    url = url[action] || url;
    if( typeof url !== "string" )
    {
        throw new Error('invalid url');
    }

    lastSynch = new Http();
    lastSynch.addEventListener( [HttpEvent.SUCCESS,HttpEvent.ERROR,HttpEvent.TIMEOUT] , function(event){

        var error='service error.';
        var status = 504;
        if( event.type === HttpEvent.SUCCESS)
        {
            var result = event.data;
            code = result[ options.responseProfile.code ];
            if( options.successCode == code )
            {
                result = result[ options.responseProfile.data ];
                if( action == 'append' && result && primary)
                {
                    data = data instanceof Array ? data : [data];
                    if( data.length<1 && ( typeof result === "string" || typeof result === "number" ) )
                    {
                        data[0][primary] = result;

                    }else if( Breeze.isObject(result) )
                    {
                        for(var i=0; i<data.length; i++) if( result[ data[i][primary] ] )
                        {
                            data[i][primary]=result[ data[i][primary] ];
                        }
                    }
                    dispatch.call(this, DataSourceEvent.SYNCH_SUCCESS,result,index,event);
                    !this.__fetchCalled__ || this.select();
                }
                return;
            }
            error = result[ options.responseProfile.error ];

        } else if( event.type === HttpEvent.TIMEOUT)
        {
            error='timeOut';
            status = 403;
        }
        var e = new DataSourceEvent( DataSourceEvent.SYNCH_FAILED );
        e.originalEvent=event;
        e.status =status;
        e.error= error;
        this.dispatchEvent( e );

    },false,0, this);

    var param  = setting.param || {};
    param[ setting.actionProfile ] = action;
    param = System.serialize(param,'url');
    url = /\?/.test(url) ? url+'&'+param : url+'?'+param;
    lastSynch.send( url, data , setting.method );
};

/**
 * 预加载数据
 */
function preloadData()
{
    var cached = this.__cached__;
    var segments= this.segments();
    if( this.isRemote() && this.length <= this.predicts() )
    {
        var queue = cached.queues;
        var num = this.preloadPages();
        var c = this.currentPage();
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
};

/**
 * 对数据进行排序
 */
function doOrderBy()
{
    if( this.length > 0 && this.length >= this.predicts() )
    {
        DataArray.prototype.orderBy.call(this,this.orderBy() );
        return true;
    }
    return false;
};



/**
 * 合并数据
 * @param target
 * @param dataSource
 */
function meregItems(target, dataSource )
{
    var i=0;
    var len = dataSource.length >> 0;
    var b=target.length>>0;
    for(;i<len;i++)
    {
        if( dataSource[i]!=null )
        {
            target[b++]=dataSource[i];
        }
    }
    target.length = b;
}
