/**
 *  事件对象,处理指定类型的事件分发。
 * @param type
 * @param bubbles
 * @param cancelable
 * @returns {Event}
 * @constructor
 * @require System,Object
 */
function Event( type, bubbles, cancelable )
{
    if ( !System.instanceOf(this,Event) )return new Event(  type, bubbles,cancelable );
    if( type && typeof type !=="string" )Internal.throwError('type','event type is not string');
    this.type = type;
    this.bubbles = !(bubbles===false);
    this.cancelable = !(cancelable===false);
};
System.Event = Event;
/**
 * 一组事件名的常量
 * @type {string}
 */
Event.SUBMIT='submit';
Event.RESIZE='resize';
Event.SELECT='fetch';
Event.UNLOAD='unload';
Event.LOAD='load';
Event.RESET='reset';
Event.FOCUS='focus';
Event.BLUR='blur';
Event.ERROR='error';
Event.COPY='copy';
Event.BEFORECOPY='beforecopy';
Event.CUT='cut';
Event.BEFORECUT='beforecut';
Event.PASTE='paste';
Event.BEFOREPASTE='beforepaste';
Event.SELECTSTART='selectstart';
Event.READY='ready';
Event.SCROLL='scroll';

/**
 * 事件原型
 * @type {Object}
 */
Event.prototype = Object.create( Object.prototype );
Event.prototype.constructor = Event;
//true 只触发冒泡阶段的事件 , false 只触发捕获阶段的事件
Event.prototype.bubbles = true;
//是否可以取消浏览器默认关联的事件
Event.prototype.cancelable = true;
Event.prototype.currentTarget = null;
Event.prototype.defaultPrevented = false;
Event.prototype.originalEvent = null;
Event.prototype.type = null;
Event.prototype.propagationStopped = false;
Event.prototype.immediatePropagationStopped = false;
Event.prototype.altkey = false;
Event.prototype.button = false;
Event.prototype.ctrlKey = false;
Event.prototype.shiftKey = false;
Event.prototype.metaKey = false;
Event.prototype.toString=function toString(){
    return '[object Event]';
}
Event.prototype.valueOf=function valueOf(){
    return '[object Event]';
}

/**
 * 阻止事件的默认行为
 */
Event.prototype.preventDefault = function preventDefault()
{
    if( this.cancelable===true )
    {
        this.defaultPrevented = true;
        if ( this.originalEvent )this.originalEvent.preventDefault ? this.originalEvent.preventDefault() : this.originalEvent.returnValue = false
    }
};

/**
 * 阻止向上冒泡事件
 */
Event.prototype.stopPropagation = function stopPropagation()
{
    if( this.originalEvent )
    {
        this.originalEvent.stopPropagation ? this.originalEvent.stopPropagation() :  this.originalEvent.cancelBubble=true;
    }
    this.propagationStopped = true;
}

/**
 *  阻止向上冒泡事件，并停止执行当前事件类型的所有侦听器
 */
Event.prototype.stopImmediatePropagation = function stopImmediatePropagation()
{
    if( this.originalEvent && this.originalEvent.stopImmediatePropagation )this.originalEvent.stopImmediatePropagation();
    this.stopPropagation();
    this.immediatePropagationStopped = true;
}

/**
 * map event name
 * @internal Event.fix;
 */
Event.fix    =   {
    map:{},
    hooks:{},
    prefix:'',
    eventname:{
        'webkitAnimationEnd':true,
        'webkitAnimationIteration':true,
        'DOMContentLoaded':true
    }
};
Event.fix.map[ Event.READY ]='DOMContentLoaded';

/**
 * 获取统一的事件名
 * @param type
 * @param flag
 * @returns {*}
 * @internal Event.type;
 */
Event.type = function type( eventType, flag )
{
    if( typeof eventType !== "string" )return eventType;
    if( flag===true )
    {
        eventType= Event.fix.prefix==='on' ? eventType.replace(/^on/i,'') : eventType;
        var lower =  eventType.toLowerCase();
        for(var prop in Event.fix.map)
        {
            if( Event.fix.map[prop].toLowerCase() === lower )
            {
                return prop;
            }
        }
        return eventType;
    }
    if( Event.fix.eventname[ eventType ]===true )return eventType;
    return Event.fix.map[ eventType ] ? Event.fix.map[ eventType ] : Event.fix.prefix+eventType.toLowerCase();
};

var eventModules=[];

//@internal Event.registerEvent;
Event.registerEvent = function registerEvent( callback )
{
    eventModules.push( callback );
}

/*
 * 根据原型事件创建一个Event
 * @param event
 * @returns {Event}
 * @internal Event.create;
 */
Event.create = function create( originalEvent )
{
    originalEvent=originalEvent ? originalEvent : (typeof window === "object" ? window.event : null);
    var event=null;
    var i=0;
    if( !originalEvent )Internal.throwError('type','Invalid event');
    var type = originalEvent.type;
    var target = originalEvent.srcElement || originalEvent.target;
    target = target && target.nodeType===3 ? target.parentNode : target;
    var currentTarget =  originalEvent.currentTarget || target;
    if( typeof type !== "string" )Internal.throwError('type','Invalid event type');
    type = Event.type( type, true );
    while ( i<eventModules.length && !(event=eventModules[i++]( type, target, originalEvent )));
    if( !(event instanceof Event) )event = new Event( type );
    event.type=type;
    event.target=target;
    event.currentTarget = currentTarget;
    event.bubbles = !!originalEvent.bubbles;
    event.cancelable = !!originalEvent.cancelable;
    event.originalEvent = originalEvent;
    event.timeStamp = originalEvent.timeStamp;
    event.relatedTarget= originalEvent.relatedTarget;
    event.altkey= !!originalEvent.altkey;
    event.button= originalEvent.button;
    event.ctrlKey= !!originalEvent.ctrlKey;
    event.shiftKey= !!originalEvent.shiftKey;
    event.metaKey= !!originalEvent.metaKey;
    return event;
};


