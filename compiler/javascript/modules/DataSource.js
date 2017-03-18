/*
* BreezeJS DataSource class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require System,Object,Array,DataArray,EventDispatcher,Http,HttpEvent,DataSourceEvent,Math,DataGrep;
*/
function DataSource()
{
    if( !System.instanceOf(this,DataSource) )return new DataSource();
    EventDispatcher.call(this);
    this.__options__={
        'method': Http.METHOD.GET,
        'dataType':Http.TYPE.JSON,
        'param':{},
        'url':null,
        //服务器响应后的json对象
        'responseProfile':{
            'data':'data',     //数据集
            'total':'total',   //数据总数
            'code': 'code',    //状态码
            'error': 'error',  //错误消息
            "successCode" : 0  //成功时的状态码
        },
        //向服务器请求时需要添加的参数
        'requestProfile':{
            'offset':'offset', //数据偏移量
            'rows'  :'rows'    //每次获取取多少行数据
        },
    };
    this.__items__=new Array();
    this.__cached__={'queues':new Array(),'lastSegments':null,"loadSegments":new Array() };
}
System.DataSource=DataSource;
DataSource.prototype = Object.create( EventDispatcher.prototype );

//@private
DataSource.prototype.__isRemote__=false;
DataSource.prototype.__cached__={};
DataSource.prototype.__items__=[];

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
 * 获取或者设置数据选项
 * @param object options
 * @returns {*}
 */
DataSource.prototype.options=function options( opt )
{
    if( System.isObject(opt) )this.__options__ = Object.merge(true,this.__options__, opt);
    return this;
};

/**
 * @private
 */
DataSource.prototype.__source__=null;

/**
 * 设置获取数据源
 * 允许是一个数据数组或者是一个远程请求源
 * @param Array source | String url | Http httpObject
 * @returns {DataSource}
 */
DataSource.prototype.source=function source( resource )
{
    if( this.__source__ === resource || typeof resource === "undefined" )return this;

    //清空数据源
    if( resource === null )
    {
        this.__items__.splice(0, this.__items__.length);
        this.__cached__.lastSegments=null;
        this.__cached__.loadSegments=new Array();
        this.__nowNotification__=false;
        //移除加载远程数据侦听事件
        if (this.__source__ instanceof Http)this.__source__.removeEventListener(HttpEvent.SUCCESS,success);
        return this;
    }

    //本地数据源数组
    if( System.instanceOf(resource, Array) )
    {
        Array.prototype.splice.apply(this.__items__,[0, this.count()].concat( resource.slice(0) ) );
        this.__source__=resource;
    }
    //远程数据源
    else
    {
        var options = this.__options__;
        if( typeof resource === 'string' )
        {
            options.url = resource;
            resource = new Http( options );
        }
        if ( resource instanceof Http )
        {
            this.__source__=resource;
            this.__isRemote__=true;
            //请求远程数据源侦听器
            resource.addEventListener( HttpEvent.SUCCESS, success , false,0, this);
        }
    }
    return this;
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
        return this;
    }
    return this.__rows__;
};


/**
 * @private
 */
DataSource.prototype.__segments__ = 1;

/**
 * 获取设置当前分页数
 * @param num
 * @returns {*}
 */
DataSource.prototype.segments=function segments()
{
    return this.__segments__;
};

/**
 * 总分页数
 * @return number
 */
DataSource.prototype.totalSegment=function totalSegment()
{
    return this.count() >0 ? Math.max( Math.ceil( this.count() / this.rows() ) , 1) : NaN ;
};

/**
 * @private
 */
DataSource.prototype.__bufferSegment__= 3;

/**
 * 最大缓冲几个分页数据。有效值为1-10
 * @param Number num
 * @returns {DataSource}
 */
DataSource.prototype.bufferSegment=function bufferSegment( num )
{
    if( num > 0 )
    {
        this.__bufferSegment__ = Math.min(10, Math.max(num, 1) );
        return this;
    }
    return this.__bufferSegment__;
};


/**
 * @private
 */
DataSource.prototype.__count__= 0;

/**
 * 获取数据源的总数
 * @param number num
 * @returns {DataSource}
 */
DataSource.prototype.count=function count()
{
    return Math.max(this.__count__ , this.__items__.length );
};

/**
 * @private
 */
DataSource.prototype.__grep__=null;

/**
 * 获取检索对象
 * @returns {*|DataGrep}
 */
DataSource.prototype.grep=function grep()
{
    return this.__grep__ || ( this.__grep__=new DataGrep( this.__items__ ) );
};

/**
 * 从指定条件中查询
 * @param condition
 */
DataSource.prototype.where=function where( filter )
{
    if( typeof filter === "string" )
    {
        this.grep().filter( filter );
    }
    return this;
};

/**
 * @private
 */
DataSource.prototype.__orderBy__={};

/**
 * 对数据进行排序。只有数据源全部加载完成的情况下调用此方法才有效（本地数据源除外）。
 * @param column 数据字段
 * @param type   排序类型
 */
DataSource.prototype.orderBy=function(column,type)
{
    var t = typeof column;
    if( t === "object" )
    {
        this.__orderBy__= column;

    }else if( t === "string" )
    {
        this.__orderBy__[ column ] = type || DataArray.ASC;
    }else{
        return this.__orderBy__;
    }
    return this;
};

/**
 * 当前页的索引值在当前数据源的位置
 * @param index 位于当前页的索引值
 * @returns {number}
 */
DataSource.prototype.offsetAt=function( index )
{
    var index = index>>0;
    if( isNaN(index) )return index;
    return ( this.segments()-1 ) * this.rows() + index;
};

/**
 * 添加数据项到指定的索引位置
 * @param item
 * @param index
 * @returns {DataSource}
 */
DataSource.prototype.append=function(item,index)
{
    var e = new DataSourceEvent( DataSourceEvent.APPEND );
    index = typeof index === 'number' ? index : this.count();
    index = index < 0 ? index + this.count()+1 : index;
    index = System.Math.min( this.count(), System.Math.max( index, 0 ) );
    e.index = index;
    e.newValue = item;
    if( this.dispatchEvent( e ) )
    {
        var callback = e.invoke || function(){return true;}
        if( callback(item, index) )
        {
            Array.prototype.splice.call(this.__items__, index,0,item)
            e = new DataSourceEvent( DataSourceEvent.CHANGED );
            e.index = index;
            e.newValue=item;
            this.dispatchEvent( e );
        }
        return true;
    }
    return false;
};

/**
 * 移除指定索引下的数据项
 * @param filter
 * @returns {boolean}
 */
DataSource.prototype.remove=function()
{
    var index;
    var result = this.grep().execute();
    var e = new DataSourceEvent( DataSourceEvent.REMOVE );
    e.data=result;
    if( this.dispatchEvent( e ) )
    {
        var callback = e.invoke || function(){return true;}
        for (var i = 0; i < result.length; i++)
        {
            index = Array.prototype.indexOf.call(result,result[i]);
            if (index >= 0)
            {
                if( callback(result[i], index, i ) )
                {
                    Array.prototype.splice.call(this.__items__,index, 1);
                    e = new DataSourceEvent( DataSourceEvent.CHANGED );
                    e.index = index;
                    e.oldValue=result[i];
                    this.dispatchEvent( e );
                }
            }
        }
        return true;
    }
    return false;
};

/**
 * 修改数据
 * @param values 数据列对象 {'column':'newValue'}
 * @returns {boolean}
 */
DataSource.prototype.update=function update( value )
{
    var result = this.grep().execute(filter);
    var e = new DataSourceEvent( DataSourceEvent.UPDATE );
    var oldValue;
    e.data=result;
    e.newValue=value;
    if( this.dispatchEvent( e ) )
    {
        var callback = e.invoke || function(item, newValue)
        {
            var flag = false;
            for(var c in newValue)
            {
                if ( typeof item[c] !== "undefined" && item[c] != newValue[c] )
                {
                    flag=true;
                    item[c] = newValue[c];
                }
            }
            return flag;
        }
        for (var i = 0; i < result.length; i++)
        {
            oldValue = Object.merge({}, result[i] );
            if( callback( result[i], value, i ) )
            {
                e = new DataSourceEvent( DataSourceEvent.CHANGED );
                e.data   = result[i];
                e.newValue=value;
                e.oldValue=oldValue;
                this.dispatchEvent( e );
            }
        }
        return true;
    }
    return false;
};

DataSource.prototype.__loading__=false;
DataSource.prototype.__end__=false;
DataSource.prototype.__nowNotification__=false;

/**
 * 选择数据集
 * @returns {DataSource}
 */
DataSource.prototype.select=function select( segments )
{
    //如果有有未通知的数据则返回
    if( this.__nowNotification__ )return this;
    var total = this.totalSegment();
    segments = segments > 0 ? segments : this.segments();
    segments = Math.min( segments , isNaN(total)?segments:total );
    this.__segments__ = segments;
    var rows  = this.rows();
    var start=( segments-1 ) * rows;
    var cached = this.__cached__;
    var index = this.isRemote() ? cached.loadSegments.indexOf(segments) : segments-1;
    //数据准备好后需要立即通知
    this.__nowNotification__ =  true;
    //需要等待加载数据
    if( this.isRemote() && index < 0 )
    {
        var event = new DataSourceEvent( DataSourceEvent.SELECT );
        event.segments = segments;
        event.offset = start;
        event.data=null;
        event.waiting = true;
        this.dispatchEvent(event);

    }else
    {
        notification.call(this,segments,index*rows,rows);
    }
    //加载数据
    if( this.isRemote() )doload.call(this);
    return this;
};


/**
 * @private
 * 数据加载成功时的回调
 * @param event
 */
function success(event)
{
    var options = this.__options__;
    var totalProfile = options.responseProfile.total;
    var dataProfile = options.responseProfile.data;
    var stateProfile = options.responseProfile.code;
    if( event.data[ stateProfile ] != options.responseProfile.successCode )
    {
        Internal.throwError('error','Loading data failed '+event.data[ options.responseProfile.error ]);
    }
    var data = event.data;
    var total= 0;
    if( !System.isArray( data ) )
    {
        if(  ( dataProfile && typeof data[ dataProfile ] === 'undefined' ) || ( totalProfile && data[totalProfile] === 'undefined') )
        {
            Internal.throwError('error','Response data profile fields is not correct.');
        }
        total = totalProfile ? data[totalProfile] >> 0 : 0;
        data = data[dataProfile];
        if( total===0 )total = data.length >> 0;

    }else
    {
        total = data.length >>0;
    }

    //必须是返回一个数组
    if( !System.isArray(data) ) Internal.throwError('error','Response data set must be an array');

    //当前获取到数据的长度
    var len = data.length >> 0;

    //先标记为没有数据可加载了
    this.__end__=true;
    this.__loading__=false;

    //如果当前有数据返回
    if( len > 0 )
    {
        //总数据量
        this.__count__ = total;
        var rows = this.rows();
        var cached = this.__cached__;
        //当前加载分页数的偏移量
        var offset = Array.prototype.indexOf.call(cached.loadSegments, cached.lastSegments) * rows;
        //合并数据项
        Array.prototype.splice.apply(this.__items__, [offset, 0].concat( data ) );
        //发送数据
        if(this.__nowNotification__)notification.call(this, cached.lastSegments, offset, rows);
        //还有数据需要加载
        if( this.__items__.length < total && total > len )
        {
            this.__end__=false;
            //继续载数据
            doload.call(this);
        }
    }
}

/**
 * 向远程服务器开始加载数据
 */
function doload()
{
    if( !this.isRemote() || this.__end__ || this.__loading__)return;
    var page = this.segments();
    var cached= this.__cached__;
    var queue = cached.queues;
    var rows = this.rows();
    var buffer = this.bufferSegment();
    if( cached.loadSegments.indexOf(page) < 0 )
    {
        queue.unshift( page );

    }else if( queue.length === 0 )
    {
        var p = 1;
        var t = this.totalSegment();
        while( buffer > p )
        {
            var next = page+p;
            var prev = page-p;
            if( next != cached.lastSegments && cached.loadSegments.indexOf(next) < 0 && next <= t )
            {
                queue.push( next );
            }
            if( prev != cached.lastSegments && prev > 0 && cached.loadSegments.indexOf(prev) < 0 )
            {
                queue.push( prev );
            }
            p++;
        }
    }
    if( queue.length > 0 )
    {
        page = queue.shift();
        cached.lastSegments=page;
        cached.loadSegments.push( page );
        if( cached.loadSegments.length > 1)cached.loadSegments.sort(function (a,b) {return a-b;});
        var start = ( page - 1 ) * rows;
        var source = this.__source__;
        var options= this.__options__;
        var param = Object.merge({}, options.param, {orderby: this.orderBy()});
        param[options.requestProfile.offset] = start;
        param[options.requestProfile.rows] = rows;
        source.load(options.url, param, options.method);
        this.__loading__=true;
    }
};

/**
 * 发送数据通知
 * @private
 */
function notification(segments , start, rows )
{
    if( !this.__nowNotification__ )return;
    var result = this.grep().execute();
    var end = Math.min(start + rows, this.count() );
    var data  = result.slice(start, end);
    var event = new DataSourceEvent(DataSourceEvent.SELECT);
    event.segments = segments;
    event.offset = start;
    event.data = data;
    event.waiting = false;
    this.__nowNotification__ = false;
    this.dispatchEvent(event);
}