/**
 * 事件调度器，所有需要实现事件调度的类都必须继承此类。
 * @param HTMLElement|EventDispatcher target 需要代理事件的目标对象
 * @returns {EventDispatcher}
 * @constructor
 */
function EventDispatcher( target )
{
    if( !(this instanceof EventDispatcher) )return new EventDispatcher( target );
    if( target )
    {
        if( typeof target !=='object' || !(  System.typeOf( target.addEventListener ) === "function" || System.typeOf( target.attachEvent )=== "function" ) )
        {
            throwError('type', 'target is not "EventDispatcher"');
        }
        Object.defineProperty(this,'target', {value:target});
    }
}
EventDispatcher.prototype=new Object();
EventDispatcher.prototype.constructor=EventDispatcher;
EventDispatcher.prototype.target=null;
/**
 * 判断是否有指定类型的侦听器
 * @param type
 * @returns {boolean}
 */
EventDispatcher.prototype.hasEventListener=function( type  )
{
    var target = $get(this,'target') || this;
    var events;
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0)
        {
            events = $get( target[len--],'__events__');
            if( events && Object.prototype.hasOwnProperty.call(events,type) )
            {
                events =$get(events,type)
                return events && events.length > 0;
            }
        }
        return false;
    }
    events = $get( target,'__events__');
    if( events && Object.prototype.hasOwnProperty.call(events,type) )
    {
        events =$get(events,type)
        return events && events.length > 0;
    }
    return false;
};

(function(){

/**
 * 添加侦听器
 * @param type
 * @param listener
 * @param priority
 * @returns {EventDispatcher}
 */
EventDispatcher.prototype.addEventListener=function(type,callback,useCapture,priority,reference)
{
    if( typeof type !== 'string' )throwError('type','Invalid event type.')
    if( typeof callback !== 'function' )throwError('type','Invalid callback function.')
    var listener=new Listener(type,callback,useCapture,priority,reference,this);
    var target = $get(this,"target") || this;
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0)addEventListener(target[--len], listener);
        return this;
    }
    addEventListener(target, listener);
    return this;
};

/**
 * 移除指定类型的侦听器
 * @param type
 * @param listener
 * @returns {boolean}
 */
EventDispatcher.prototype.removeEventListener=function(type,listener)
{
    var target= $get(this,"target") || this;
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0)removeEventListener( target[--len], type, listener, this);
        return true;
    }
    return removeEventListener(target,type,listener,this);
};

/**
 * 调度指定事件
 * @param event
 * @returns {boolean}
 */
EventDispatcher.prototype.dispatchEvent=function( event )
{
    if( !(event instanceof Event) )throwError('type','invalid event.');
    var target = $get(this,"target") || this;
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0)
        {
            event.target = event.currentTarget = target[--len];
            dispatchEvent(event);
        }
        return !event.immediatePropagationStopped;
    }
    event.target = event.currentTarget=target;
    return dispatchEvent( event );
};

/**
 * 添加侦听器到元素中
 * @param listener
 * @param handle
 * @returns {boolean}
 */
function addEventListener(target, listener )
{
    //获取事件数据集
    var type = listener.type;
    var events = $get( target, '__events__');

    //如果没有则定义
    if( !events )
    {
        events = {};
        Object.defineProperty(target,'__events__',{value:events});
    }

    //获取指定事件类型的引用
    events = events[ type ] || ( events[ type ]=[] );

    //如果不是 EventDispatcher 则在第一个事件中添加事件代理。
    if( events.length===0 && !System.instanceOf(target, EventDispatcher) )
    {
        type= Event.type( type );
        target.addEventListener ? target.addEventListener(type,dispatchEvent,listener.useCapture) : target.attachEvent(type,dispatchEvent);
    }

    //添加到元素
    events.push( listener );

    //按权重排序，值大的在前面
    if( events.length > 1 ) events.sort(function(a,b)
    {
        return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
    });
    return true;
};


/**
 * 添加侦听器到元素中
 * @param string type 事件类型, 如果是一个'*'则表示删除所有的事件
 * @param function listener 可选，如果指定则只删除此侦听器
 * @param EventDispatcher eventDispatcher 可选，如果指定则只删除本对象中的元素事件
 * @returns {boolean}
 */
function removeEventListener(target, type, listener , dispatcher )
{
    //获取事件数据集
    var events = $get(target,'__events__');
    if( !Object.prototype.hasOwnProperty.call(events,type) )
    {
        return false;
    }
    events = events[type];
    var length= events.length;
    var ret = length;
    var is = typeof listener === "function";
    while (length > 0)
    {
        --length;
        //如果有指定侦听器则删除指定的侦听器
        if ( (!is || events[length].callback === listener) && events[length].dispatcher === dispatcher )
        {
            events.splice(length, 1);
        }
    }

    //如果是元素并且也没有侦听器就删除
    if( events.length < 1 && !(target instanceof EventDispatcher)  )
    {
        var eventType= Event.type( type );
        if( target.removeEventListener )
        {
            target.removeEventListener(eventType,dispatchEvent,false);
            target.removeEventListener(eventType,dispatchEvent,true);
        }else if( target.detachEvent )
        {
            target.detachEvent(eventType,dispatchEvent);
        }
    }
    return events.length !== ret;
};

/**
 * 调度指定侦听项
 * @param event
 * @param listeners
 * @returns {boolean}
 */
function dispatchEvent( e )
{
    if( !(e instanceof Event) )e = Event.create( e );
    if( !e || !e.currentTarget )throw new Error('invalid event target')
    var target = e.currentTarget;
    var events = $get(target ,'__events__')
    if( !Object.prototype.hasOwnProperty.call(events, e.type) )return true;
    events = $get( events, e.type ).slice(0);
    var length= 0,listener,thisArg;
    while( length < events.length )
    {
        listener = events[ length++ ];
        thisArg = listener.reference || listener.dispatcher;
        //调度侦听项
        listener.callback.call( thisArg , e );
        if( e.immediatePropagationStopped===true )
           return false;
    }
    return true;
};



/**
 * 事件侦听器
 * @param type
 * @param callback
 * @param priority
 * @param capture
 * @param currentTarget
 * @param target
 * @constructor
 */
function Listener(type,callback,useCapture,priority,reference,dispatcher)
{
    this.type=type;
    this.callback=callback;
    this.useCapture=!!useCapture;
    this.priority=parseInt(priority) || 0;
    this.reference=reference || null;
    this.dispatcher=dispatcher;
};
Listener.prototype.constructor= Listener;
Listener.prototype.useCapture=false;
Listener.prototype.dispatcher=null;
Listener.prototype.reference=null;
Listener.prototype.priority=0;
Listener.prototype.callback=null;
Listener.prototype.currentTarget=null;
Listener.prototype.type=null;
}());