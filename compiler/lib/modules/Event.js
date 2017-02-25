/**
 *  事件对象,处理指定类型的事件分发。
 * @param type
 * @param bubbles
 * @param cancelable
 * @returns {Event}
 * @constructor
 */
function Event( type, bubbles, cancelable )
{
    if ( !(this instanceof Event) )
        return new Event(  type, bubbles,cancelable );
    if( typeof type1==="string" )throwError('type','event type is not string');
    this.type = type;
    this.bubbles = !(bubbles===false);
    this.cancelable = !(cancelable===false);
}

/**
 * 一组事件名的常量
 * @type {string}
 */
Event.SUBMIT='submit';
Event.RESIZE='resize';
Event.FETCH='fetch';
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
Event.prototype = new Object();
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
 * 停止在当前节点上调度此事件
 */
Event.prototype.stopPropagation = function stopPropagation()
{
    if( this.originalEvent && this.originalEvent.stopPropagation )this.originalEvent.stopPropagation();
    this.propagationStopped = true;
}

/**
 * 停止向其它节点上调度此事件
 */
Event.prototype.stopImmediatePropagation = function stopImmediatePropagation()
{
    if( this.originalEvent && this.originalEvent.stopImmediatePropagation )this.originalEvent.stopImmediatePropagation();
    this.stopPropagation();
    this.immediatePropagationStopped = true;
}

/**
 * map event name
 * @private
 */
Event.fix={
    map:{},
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
 */
Event.type = function(type, flag )
{
    if( typeof type !== "string" )return type;
    if( flag===true )
    {
        type= Event.fix.prefix==='on' ? type.replace(/^on/i,'') : type;
        var lower =  type.toLowerCase();
        for(var prop in Event.fix.map)
        {
            if( Event.fix.map[prop].toLowerCase() === lower )
            {
                return prop;
            }
        }
        return type;
    }
    if( Event.fix.eventname[ type ]===true )return type;
    return Event.fix.map[ type ] ? Event.fix.map[ type ] : Event.fix.prefix+type.toLowerCase();
};

(function () {

    var eventModules=[];
    Event.registerEvent = function registerEvent( callback )
    {
        eventModules.push( callback );
    }

    /**
     * 根据原型事件创建一个Breeze Event
     * @param event
     * @returns {Event}
     */
    Event.create = function create( originalEvent )
    {
        originalEvent=originalEvent || (typeof window === "object" ? window.event : null);
        var event=null;
        var i=0;
        if( !originalEvent )throwError('type','Invalid event');
        var type = originalEvent.type;
        var target = originalEvent.srcElement || originalEvent.target;
        target = target && target.nodeType===3 ? target.parentNode : target;
        var currentTarget =  originalEvent.currentTarget || target;
        if( typeof type !== "string" )throwError('type','Invalid event type');
        type = Event.type( type, true );
        while ( !event && i<eventModules.length )
        {
            event = eventModules[i]( type, target, originalEvent );
            i++;
        }
        if( !(event instanceof Event) )event = new Event( type );
        event.type= type;
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
}());

