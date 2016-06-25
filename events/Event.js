/*
 * BreezeJS BreezeEvent class.
 * version: 1.0 Bete
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(factory){

    if( typeof define === "function" )
    {
        define( [] , factory );

    }else if (typeof exports === 'object')
    {
        module.exports = factory;

    }else
    {
        factory();
    }

})(function(undefined)
{
    'use strict';

    /**
     *  BreezeEvent Class
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

        this.type = type ? type : null;
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
    };

    /**
     * event property
     * @public
     */
    Event.prototype = {
        target:null,
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
    var mapeventname={},onPrefix='',s;
    mapeventname[ PropertyEvent.CHANGE ] = 'input';
    mapeventname[ Event.READY ] = 'DOMContentLoaded';
    mapeventname['webkitAnimationEnd'] = 'webkitAnimationEnd';
    mapeventname['webkitAnimationIteration'] = 'webkitAnimationIteration';
    mapeventname['DOMContentLoaded'] = 'DOMContentLoaded';
    if( navigator.userAgent.match(/firefox\/([\d.]+)/i) )
    {
        mapeventname[ MouseEvent.MOUSE_WHEEL ] = 'DOMMouseScroll';

    }else if( (s = navigator.userAgent.match(/msie ([\d.]+)/i)) && s[1] < 9 )
    {
        onPrefix='on';
        mapeventname[ Event.READY ] = 'readystatechange';
    }


    /**
     * 统一事件名
     * @param type
     * @param flag
     * @returns {*}
     */
    Event.eventType=function(type, flag)
    {
        if( typeof type !== "string" )
           return null;

        if( flag===true )
        {
            type= onPrefix==='on' ? type.replace(/^on/i,'') : type;
            for(var prop in mapeventname)if( mapeventname[prop].toLowerCase() === type.toLowerCase() )return prop
            return type;
        }

        if( typeof mapeventname[ type ] !== "undefined" )
        {
            type = mapeventname[ type ];

        }else
        {
            type=type.toLowerCase();
        }
        return onPrefix+type;
    }

    /**
     * @private
     */
    var __eventClassName__=/^([A-Z]?[a-z]+)(?=[A-Z])/;

    /**
     * 根据原型事件创建一个Breeze BreezeEvent
     * @param event
     * @returns {Event}
     */
    Event.create=function(event )
    {
        if( event instanceof Event )
            return event;

        event=event || window.event;
        var target = event.target || event.srcElement || event.currentTarget;
        if( !target )return null;

        //阻止浏览浏览器的事件冒泡
        if ( event )
        {
            //!event.stopImmediatePropagation || event.stopImmediatePropagation();
            //!event.stopPropagation ? event.cancelBubble=true : event.stopPropagation();
        }

        var breezeEvent={};
        var type = Event.eventType(event.type,true);
        if( type === null )
           return null

       var className = !agreed.test(type) ? type.match( __eventClassName__ ) : null;
       if( className && className[1] )
       {
           className=className[1].charAt(0).toUpperCase()+className[1].substr(1)+'Event';
           if( window[className] )
           {
               breezeEvent=new window[className]( event )
           }
           if( breezeEvent instanceof PropertyEvent && breezeEvent.originalEvent )
           {
               if( typeof breezeEvent.originalEvent.propertyName === "string" )
               {
                   breezeEvent.property = breezeEvent.originalEvent.propertyName;
                   breezeEvent.newValue = target[ breezeEvent.property ];
               }
           }

       }else if( /^mouse|click$/i.test(type) )
       {
            breezeEvent=new MouseEvent( event );
            breezeEvent.pageX= event.x || event.clientX || event.pageX;
            breezeEvent.pageY= event.y || event.clientY || event.pageY;
            if( typeof event.offsetX==='undefined' && target )
            {
                event.offsetX=breezeEvent.pageX-target.offsetLeft;
                event.offsetY=breezeEvent.pageY-target.offsetTop;
            }

            breezeEvent.offsetX = event.offsetX;
            breezeEvent.offsetY = event.offsetY;
            breezeEvent.screenX= event.screenX;
            breezeEvent.screenY= event.screenY;

            if( type === MouseEvent.MOUSE_WHEEL )
            {
               breezeEvent.wheelDelta=event.wheelDelta || ( event.detail > 0 ? -event.detail :Math.abs( event.detail ) );
            }

        }else if(KeyboardEvent.KEYPRESS===type || KeyboardEvent.KEY_UP===type || KeyboardEvent.KEY_DOWN===type)
        {
            breezeEvent=new KeyboardEvent( event );
            breezeEvent.keycode = event.keyCode || event.keycode;
        }

        var currentTarget = event.currentTarget || target;
        if( currentTarget == currentTarget.window || currentTarget.documentElement )
        {
            breezeEvent.currentTarget=currentTarget;
        }

        breezeEvent.type=type;
        breezeEvent.target=target;
        breezeEvent.currentTarget= breezeEvent.currentTarget || target;
        breezeEvent.timeStamp = event.timeStamp;
        breezeEvent.relatedTarget= event.relatedTarget;
        breezeEvent.altkey= !!event.altkey;
        breezeEvent.button= event.button;
        breezeEvent.ctrlKey= !!event.ctrlKey;
        breezeEvent.shiftKey= !!event.shiftKey;
        breezeEvent.metaKey= !!event.metaKey;
        return breezeEvent;
    }

    Event.SUBMIT='submit';
    Event.RESIZE='resizeEnable';
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

    if( typeof window !== "undefined" )window.Event = Event;
    return Event

})