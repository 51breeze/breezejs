/**
 *  事件对象,处理指定类型的事件分发。
 * @param type
 * @param bubbles
 * @param cancelable
 * @returns {Event}
 * @constructor
 */
function Event(type, bubbles, cancelable )
{
    if ( !(this instanceof Event) )
        return new Event(  type, bubbles,cancelable );

    this.type = type;
    if ( type && type.type )
    {
        this.originalEvent = type;
        this.type = type.type;
        this.bubbles=!(type.bubbles===false);
        this.cancelable=!(type.cancelable===false);
        this.defaultPrevented = type.defaultPrevented || type.returnValue === false ? true : false;

    }else
    {
        if ( bubbles && typeof bubbles === "object" )
        {
            for(var i in bubbles)this[i]=bubbles[i];
        }else
        {
            this.bubbles = !(bubbles===false);
            this.cancelable = !(cancelable===false);
        }
    }
}
/**
 * event property
 * @public
 */
Event.prototype = {
    __proxyTarget__:null,
    bubbles:true, // true 只触发冒泡阶段的事件 , false 只触发捕获阶段的事件
    cancelable:true, // 是否可以取消浏览器默认关联的事件
    currentTarget:null,
    defaultPrevented: false,
    originalEvent:null,
    type:null,
    propagationStopped: false,
    immediatePropagationStopped: false,
    altkey:false,
    button:false,
    ctrlKey:false,
    shiftKey:false,
    metaKey:false,
    preventDefault: function()
    {
        var e = this.originalEvent;
        if( this.cancelable===true )
        {
            this.defaultPrevented = true;
            if ( e )e.preventDefault ? e.preventDefault() : e.returnValue = false
        }
    },
    stopPropagation: function()
    {
        if( this.originalEvent && this.originalEvent.stopPropagation )this.originalEvent.stopPropagation();
        this.propagationStopped = true;
    }
    ,stopImmediatePropagation:function()
    {
        if( this.originalEvent && this.originalEvent.stopImmediatePropagation )this.originalEvent.stopImmediatePropagation();
        this.stopPropagation();
        this.immediatePropagationStopped = true;
    }
};


/**
 * map event name
 * @private
 */
var fix=Event.fix={
    map:{},
    onPrefix:'',
    hooks:{},
    eventname:{
        'webkitAnimationEnd':true,
        'webkitAnimationIteration':true,
        'DOMContentLoaded':true
    }
};

if( system.Env.platform() === 'IE' && System.Env.version(9) )
{
    fix.onPrefix='on';
    fix.map[ Event.READY ] = 'readystatechange';
}

/**
 * 统一事件名
 * @param type
 * @param flag
 * @returns {*}
 */
Event.eventType=function( type, flag )
{
    if( typeof type !== "string" )return null;
    if( flag===true )
    {
        type= fix.onPrefix==='on' ? type.replace(/^on/i,'') : type;
        var lowre =  type.toLowerCase();
        for(var prop in fix.map)if( prop.toLowerCase() === lowre )
        {
            return fix.map[prop];
        }
        return type;
    }
    return fix.eventname[ type ]===true ? type : fix.onPrefix+type.toLowerCase();
};

/**
 * 根据原型事件创建一个Breeze Event
 * @param event
 * @returns {Event}
 */
Event.create=function( event )
{
    if( event instanceof Event )return event;
    event=event || window.event;
    var target = event.__proxyTarget__ || event.srcElement || event.currentTarget;
    var currentTarget =  event.currentTarget || target;
    target = target && target.nodeType===3 ? target.parentNode : target;

    //阻止浏览浏览器的事件冒泡
    if ( event )
    {
        //!event.stopImmediatePropagation || event.stopImmediatePropagation();
        //!event.stopPropagation ? event.cancelBubble=true : event.stopPropagation();
    }

    var Event=null;
   // var type = Event.eventType(event.type || event,true);
    var type = event.type || event;
    if( typeof type !== "string" )
    {
       throw new Error('invalid event type')
    }

    //鼠标事件
   if( /^mouse|click$/i.test(type) )
   {
        Event=new MouseEvent( event );
        Event.pageX= event.x || event.clientX || event.pageX;
        Event.pageY= event.y || event.clientY || event.pageY;
        if( typeof event.offsetX==='undefined' && target )
        {
            event.offsetX=Event.pageX-target.offsetLeft;
            event.offsetY=Event.pageY-target.offsetTop;
        }

        Event.offsetX = event.offsetX;
        Event.offsetY = event.offsetY;
        Event.screenX= event.screenX;
        Event.screenY= event.screenY;

        if( type === MouseEvent.MOUSE_WHEEL )
        {
           Event.wheelDelta=event.wheelDelta || ( event.detail > 0 ? -event.detail :Math.abs( event.detail ) );
        }
    }
    //键盘事件
    else if(KeyboardEvent.KEY_PRESS===type || KeyboardEvent.KEY_UP===type || KeyboardEvent.KEY_DOWN===type)
    {
        Event=new KeyboardEvent( event );
        Event.keycode = event.keyCode || event.keycode;

    }
    //属性事件
    else if( typeof PropertyEvent !== "undefined" && (PropertyEvent.CHANGE === type || PropertyEvent.COMMIT === type) )
    {
       Event=new PropertyEvent( event );
       if( typeof Event.originalEvent.propertyName === "string" )
       {
           Event.property = Event.originalEvent.propertyName;
           Event.newValue = target[ Event.property ];
       }
    }
    //标准事件
    else
    {
        Event = typeof fix.hooks[type] === "function" ? fix.hooks[type]( event ) : new Event( event );
    }

    Event.type=type;
    Event.__proxyTarget__=target;
    Event.currentTarget = currentTarget;
    Event.timeStamp = event.timeStamp;
    Event.relatedTarget= event.relatedTarget;
    Event.altkey= !!event.altkey;
    Event.button= event.button;
    Event.ctrlKey= !!event.ctrlKey;
    Event.shiftKey= !!event.shiftKey;
    Event.metaKey= !!event.metaKey;
    return Event;
};

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
fix.map[ Event.READY ]='DOMContentLoaded';