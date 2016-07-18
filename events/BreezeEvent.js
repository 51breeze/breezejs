/*
 * BreezeJS BreezeEvent class.
 * version: 1.0 Bete
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

define('events/BreezeEvent',[],function(undefined)
{
    'use strict';

    /**
     *  BreezeEvent Class
     *  事件对象,处理指定类型的事件分发。
     * @param type
     * @param bubbles
     * @param cancelable
     * @returns {BreezeEvent}
     * @constructor
     */
    function BreezeEvent(type, bubbles, cancelable )
    {
        if ( !(this instanceof BreezeEvent) )
            return new BreezeEvent(  type, bubbles,cancelable );

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
    BreezeEvent.prototype = {
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
    var fix=BreezeEvent.fix={
        map:{},
        onPrefix:'',
        hooks:{},
        eventname:{
            'webkitAnimationEnd':true,
            'webkitAnimationIteration':true,
            'DOMContentLoaded':true
        }
    }
    if( navigator.userAgent.match(/msie ([\d.]+)/i) && RegExp.$1 < 9 )
    {
        fix.onPrefix='on';
        fix.map[ BreezeEvent.READY ] = 'readystatechange';
    }

    /**
     * 统一事件名
     * @param type
     * @param flag
     * @returns {*}
     */
    BreezeEvent.eventType=function( type, flag )
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
    }

    /**
     * 根据原型事件创建一个Breeze BreezeEvent
     * @param event
     * @returns {BreezeEvent}
     */
    BreezeEvent.create=function( event )
    {
        if( event instanceof BreezeEvent )
            return event;

        event=event || window.event;
        var target = event.target || event.srcElement || event.currentTarget;
        target = target && target.nodeType===3 ? target.parentNode : target;

        //阻止浏览浏览器的事件冒泡
        if ( event )
        {
            //!event.stopImmediatePropagation || event.stopImmediatePropagation();
            //!event.stopPropagation ? event.cancelBubble=true : event.stopPropagation();
        }

        var breezeEvent;
       // var type = BreezeEvent.eventType(event.type || event,true);
        var type = event.type || event;
        if( type === null )return null;

        //鼠标事件
       if( /^mouse|click$/i.test(type) )
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

        }
        //键盘事件
        else if(KeyboardEvent.KEY_PRESS===type || KeyboardEvent.KEY_UP===type || KeyboardEvent.KEY_DOWN===type)
        {
            breezeEvent=new KeyboardEvent( event );
            breezeEvent.keycode = event.keyCode || event.keycode;

        }
        //属性事件
        else if( typeof PropertyEvent !== "undefined" && (PropertyEvent.CHANGE === type || PropertyEvent.COMMIT === type) )
        {
           breezeEvent=new PropertyEvent( event );
           if( typeof breezeEvent.originalEvent.propertyName === "string" )
           {
               breezeEvent.property = breezeEvent.originalEvent.propertyName;
               breezeEvent.newValue = target[ breezeEvent.property ];
           }
        }
        //标准事件
        else
        {
            breezeEvent = typeof fix.hooks[type] === "function" ? fix.hooks[type]( event ) : new BreezeEvent( event );
        }

        breezeEvent.type=type;
        breezeEvent.target=target;
        breezeEvent.currentTarget= event.currentTarget || target;
        breezeEvent.timeStamp = event.timeStamp;
        breezeEvent.relatedTarget= event.relatedTarget;
        breezeEvent.altkey= !!event.altkey;
        breezeEvent.button= event.button;
        breezeEvent.ctrlKey= !!event.ctrlKey;
        breezeEvent.shiftKey= !!event.shiftKey;
        breezeEvent.metaKey= !!event.metaKey;
        return breezeEvent;
    }

    BreezeEvent.SUBMIT='submit';
    BreezeEvent.RESIZE='resize';
    BreezeEvent.FETCH='fetch';
    BreezeEvent.UNLOAD='unload';
    BreezeEvent.LOAD='load';
    BreezeEvent.RESET='reset';
    BreezeEvent.FOCUS='focus';
    BreezeEvent.BLUR='blur';
    BreezeEvent.ERROR='error';
    BreezeEvent.COPY='copy';
    BreezeEvent.BEFORECOPY='beforecopy';
    BreezeEvent.CUT='cut';
    BreezeEvent.BEFORECUT='beforecut';
    BreezeEvent.PASTE='paste';
    BreezeEvent.BEFOREPASTE='beforepaste';
    BreezeEvent.SELECTSTART='selectstart';
    BreezeEvent.READY='ready';
    BreezeEvent.SCROLL='scroll';

    fix.map[ BreezeEvent.READY ]='DOMContentLoaded';

    return BreezeEvent;

})