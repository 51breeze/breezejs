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
        'timeout':30,
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
            'rows'  :'rows' //每次获取取多少行数据
        }
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

    //本地数据源数组
    if( System.instanceOf(resource, Array) )
    {
        this.__items__ =  resource.slice(0);
        this.__source__=  resource;
        this.__isRemote__=false;
    }
    //远程数据源
    else if( resource )
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

    //清空数据源
    if( resource === null )
    {
        this.__items__.splice(0, this.__items__.length);
        this.__cached__.lastSegments=null;
        this.__cached__.loadSegments=new Array();
        this.__nowNotify__=false;
        return this;
    }

    //移除加载远程数据侦听事件
    if ( !this.__isRemote__ && System.is(this.__source__,Http) ){
        this.__source__.removeEventListener(HttpEvent.SUCCESS,success);
    }
    return this;
};

/**
 * @private
 */
DataSource.prototype.__pageSize__= 20;

/**
 * 每页需要显示数据的行数
 * @param number rows
 * @returns {DataSource}
 */
DataSource.prototype.pageSize=function pageSize( size )
{
    if( size >= 0 )
    {
        this.__pageSize__ = size;
        return this;
    }
    return this.__pageSize__;
};


/**
 * @private
 */
DataSource.prototype.__current__ = 1;

/**
 * 获取当前分页数
 * @param num
 * @returns {*}
 */
DataSource.prototype.current=function current()
{
    return this.__current__;
};

/**
 * 获取总分页数。
 * 如果是一个远程数据源需要等到请求响应后才能得到正确的结果,否则返回 NaN
 * @return number
 */
DataSource.prototype.totalPage=function totalPage()
{
    return this.totalSize() > 0 ? Math.max( Math.ceil( this.totalSize() / this.pageSize() ) , 1) : NaN;
};

/**
 * @private
 */
DataSource.prototype.__buffer__= 3;

/**
 * 最大缓冲几个分页数据。有效值为1-10
 * @param Number num
 * @returns {DataSource}
 */
DataSource.prototype.maxBuffer=function maxBuffer(num )
{
    if( num > 0 )
    {
        this.__buffer__ = Math.min(10, num);
        return this;
    }
    return this.__buffer__;
};

/**
 * 获取实际数据源的总数
 * 如果是一个远程数据源，每请求成功后都会更新这个值。
 * 是否需要向远程数据源加载数据这个值非常关键。 if( 分段数 * 行数 < 总数 )do load...
 * @param number num
 * @returns {DataSource}
 */
DataSource.prototype.realSize=function realSize()
{
    return this.__items__.length;
};

/**
 * @private
 */
DataSource.prototype.__totalSize__= 0;

/**
 * 预计数据源的总数
 * 如果是一个远程数据源，每请求成功后都会更新这个值。
 * 是否需要向远程数据源加载数据这个值非常关键。 if( 分段数 * 行数 < 预计总数 )do load...
 * @param number num
 * @returns {DataSource}
 */
DataSource.prototype.totalSize=function totalSize()
{
    return Math.max( this.__totalSize__ , this.realSize() );
}


/**
 * @private
 */
DataSource.prototype.__grep__=null;

/**
 * 获取数据检索对象
 * @returns {*|DataGrep}
 */
DataSource.prototype.grep=function grep()
{
    return this.__grep__ || ( this.__grep__=new DataGrep( this.__items__ ) );
};

/**
 * 设置筛选数据的条件
 * @param condition
 * @returns {DataSource}
 */
DataSource.prototype.filter=function filter( condition )
{
    if( typeof condition === "string" )
    {
        this.grep().filter( condition );
    }
    return this;
};

/**
 * @private
 */
DataSource.prototype.__orderBy__={};

/**
 * 对数据进行排序。
 * 只有数据源全部加载完成的情况下调用此方法才有效（本地数据源除外）。
 * @param column 数据字段
 * @param type   排序类型
 */
DataSource.prototype.orderBy=function(column,type)
{
    var t = typeof column;
    if( t === "undefined" )return this.__orderBy__;
    if( t === "object" )
    {
        this.__orderBy__= column;
    }else if( t === "string" )
    {
        this.__orderBy__[ column ] = type || DataArray.ASC;
    }
    DataArray.prototype.orderBy.call(this.__items__, this.__orderBy__);
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
    return ( this.current()-1 ) * this.pageSize() + index;
};

/**
 * 添加数据项到指定的索引位置
 * @param item
 * @param index
 * @returns {DataSource}
 */
DataSource.prototype.append=function(item,index)
{
    index = typeof index === 'number' ? index : this.realSize();
    index = index < 0 ? index + this.realSize()+1 : index;
    index = Math.min( this.realSize(), Math.max( index, 0 ) );
    item = System.instanceOf(item, Array) ? item : [item];
    var ret = [];
    var e;
    for(var i=0;i<item.length;i++)
    {
        e = new DataSourceEvent( DataSourceEvent.CHANGED );
        e.index = index+i;
        e.newValue=item[i];
        if( this.dispatchEvent( e ) )
        {
            Array.prototype.splice.call(this.__items__, index+i, 0, item[i]);
            ret.push( item[i] );
        }
    }
    e = new DataSourceEvent( DataSourceEvent.APPEND );
    e.index = index;
    e.data  = ret;
    this.dispatchEvent( e );
    return ret.length;
};

/**
 * 移除指定索引下的数据项
 * @param condition
 * @returns {boolean}
 */
DataSource.prototype.remove=function( condition )
{
    var index;
    var result = this.grep().execute( condition );
    var e;
    var data=[];
    for (var i = 0; i < result.length; i++)
    {
        index = Array.prototype.indexOf.call(result,result[i]);
        if (index >= 0)
        {
            e = new DataSourceEvent( DataSourceEvent.CHANGED );
            e.index = index;
            e.oldValue=result[i];
            if( this.dispatchEvent( e ) )
            {
                data.push( Array.prototype.splice.call(this.__items__, index, 1) );
            }
        }
    }
    if( data.length > 0 )
    {
        e = new DataSourceEvent(DataSourceEvent.REMOVE);
        e.condition = condition;
        e.data = data;
        this.dispatchEvent(e);
    }
    return data.length;
};

/**
 * 修改数据
 * @param value 数据列对象 {'column':'newValue'}
 * @param condition
 * @returns {boolean}
 */
DataSource.prototype.update=function update( value, condition)
{
    var result = this.grep().execute( condition );
    var data=[];
    var flag=false;
    var e;
    for (var i = 0; i < result.length; i++)
    {
        flag=false;
        var newValue = Object.merge({}, result[i] );
        for(var c in value)
        {
            if ( typeof newValue[c] !== "undefined" && newValue[c] != value[c] )
            {
                newValue[c] = value[c];
                flag=true;
            }
        }
        if( flag )
        {
            e = new DataSourceEvent(DataSourceEvent.CHANGED);
            e.newValue = newValue;
            e.oldValue = result[i];
            if( this.dispatchEvent(e) )
            {
                Object.merge(result[i], newValue);
                data.push( result[i] );
            }
        }
    }
    e = new DataSourceEvent( DataSourceEvent.UPDATE );
    e.data=data;
    e.condition = condition;
    e.newValue=value;
    this.dispatchEvent( e );
    return data.length;
};

/**
 * 获取指定索引的元素
 * @param index
 * @returns {*}
 */
DataSource.prototype.itemByIndex=function itemByIndex( index )
{
    if( typeof index !== 'number' || index < 0 || index >= this.realSize() )return null;
    return this.__items__[index] || null;
}

/**
 * 获取指定元素的索引
 * 如果不存在则返回 -1
 * @param item
 * @returns {Object}
 */
DataSource.prototype.indexByItem=function indexByItem( item )
{
    return this.__items__.indexOf(item);
}

/**
 * 获取指定索引范围的元素
 * @param start 开始索引
 * @param end   结束索引
 * @returns {Array}
 */
DataSource.prototype.range=function range( start, end )
{
    return this.__items__.slice(start, end);
}

DataSource.prototype.__loading__=false;
DataSource.prototype.__end__=false;
DataSource.prototype.__nowNotify__=false;

/**
 * 选择数据集
 * @param Number segments 选择数据的段数, 默认是1
 * @returns {DataSource}
 */
DataSource.prototype.select=function select( page )
{
    var total = this.totalPage();
    page = page > 0 ? page : this.current();
    page = Math.min( page , isNaN(total)?page:total );
    this.__current__ = page;
    var rows  = this.pageSize();
    var start=( page-1 ) * rows;
    var cached = this.__cached__;
    var index = !this.__end__ && this.isRemote() ? cached.loadSegments.indexOf(page) : page-1;

    //数据准备好后需要立即通知
    this.__nowNotify__ =  true;

    var waiting = index < 0 || ( this.__items__.length < (index*rows+rows) );

    //需要等待加载数据
    if( this.isRemote() && waiting && !this.__end__ )
    {
        var event = new DataSourceEvent( DataSourceEvent.SELECT );
        event.current = page;
        event.offset = start;
        event.data=null;
        event.waiting = true;
        this.dispatchEvent(event);

    }else
    {
        nowNotify.call(this,page,index*rows,rows);
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
    total = Math.max( total, len );

    //先标记为没有数据可加载了
    this.__end__=true;

    //标没有在加载
    this.__loading__=false;

    //预计总数据量
    this.__totalSize__ = total;
    var rows = this.pageSize();
    var cached = this.__cached__;
    //当前加载分页数的偏移量
    var offset = Array.prototype.indexOf.call(cached.loadSegments, cached.lastSegments) * rows;

    //合并数据项
    Array.prototype.splice.apply(this.__items__, [offset, 0].concat( data ) );

    //发送数据
    if(this.__nowNotify__ &&  Array.prototype.indexOf.call( cached.loadSegments, this.current() ) >=0 )
    {
        nowNotify.call(this,this.current(), offset, rows);
    }

    //还有数据需要加载
    if( this.__items__.length < total )
    {
        this.__end__=false;
        //继续载数据
        doload.call(this);
    }

}

function isload( cached, page )
{
    return cached.lastSegments != page && cached.loadSegments.indexOf(page) < 0 && cached.queues.indexOf(page) < 0;
}

/**
 * 向远程服务器开始加载数据
 */
function doload()
{
    if( !this.isRemote() || this.__end__)return;
    var page = this.current();
    var cached= this.__cached__;
    var queue = cached.queues;
    var rows = this.pageSize();
    var buffer = this.maxBuffer();
    if( isload( cached, page ) )
    {
        queue.unshift( page );

    }else if( queue.length === 0 )
    {
        var p = 1;
        var t = this.totalPage();
        while( buffer > p )
        {
            var next = page+p;
            var prev = page-p;
            if( next <= t && isload( cached, next ) )
            {
                queue.push( next );
            }
            if(  prev > 0 && isload( cached, prev ) )
            {
                queue.push( prev );
            }
            p++;
        }
    }

    if( !this.__loading__ && queue.length > 0 )
    {
        page = queue.shift();
        cached.lastSegments = page;
        cached.loadSegments.push(page);
        if (cached.loadSegments.length > 1)cached.loadSegments.sort(function (a, b) {
            return a - b;
        });
        var start = ( page - 1 ) * rows;
        var source = this.__source__;
        var options = this.__options__;
        var param = Object.merge({}, options.param);
        param[options.requestProfile.offset] = start;
        param[options.requestProfile.rows] = rows;
        source.load(options.url, param, options.method);
        this.__loading__ = true;
    }
};

/**
 * 发送数据通知
 * @private
 */
function nowNotify(current, start, rows )
{
    if( this.__nowNotify__!==true )return;
    var result = this.grep().execute();
    var end = Math.min(start + rows, this.realSize() );
    var data  = result.slice(start, end);
    var event = new DataSourceEvent(DataSourceEvent.SELECT);
    event.current = current;
    event.offset = start;
    event.data = data;
    event.waiting = false;
    this.__nowNotify__ = false;
    this.dispatchEvent(event);
}