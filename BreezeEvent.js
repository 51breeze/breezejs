/*
 * BreezeJS BreezeEvent class.
 * version: 1.0 Bete
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined){

    /**
     * BreezeEvent Class
     * 事件对象,处理指定类型的事件分发。
     * @param src
     * @param props
     * @constructor
     */
    function BreezeEvent( type, bubbles,cancelable )
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
            if ( Utils.isObject(bubbles) )
            {
                for(var i in bubbles)this[i]=bubbles[i];

            }else
            {
                this.bubbles = !(bubbles===false);
                this.cancelable = !(cancelable===false);
            }
        }
    };

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
     * @private
     */
    var mapeventname,onPrefix='',agreed=new RegExp( 'webkitAnimationEnd|webkitAnimationIteration|DOMContentLoaded|DOMMouseScroll','i');

    /**
     * 统一事件名
     * @param type
     * @param flag
     * @returns {*}
     */
    BreezeEvent.eventType=function(type,flag)
    {
        if( typeof type !== "string" )
           return null;

        if( !mapeventname )
        {
            mapeventname={};
            mapeventname[ PropertyEvent.CHANGE ] = 'input';
            mapeventname[ BreezeEvent.READY ] = 'readystatechange';
            mapeventname[ BreezeEvent.LOAD ] = 'DOMContentLoaded';
            if( Utils.isBrowser(Utils.BROWSER_FIREFOX) )
            {
                mapeventname[ MouseEvent.MOUSE_WHEEL ] = 'DOMMouseScroll';
            }

            if( Utils.isBrowser(Utils.BROWSER_IE,9,'<') )
            {
                onPrefix='on';
            }
        }

        if( flag===true )
        {
            type= onPrefix==='on' ? type.replace(/^on/i,'') : type;
            for(var prop in mapeventname)if( mapeventname[prop].toLowerCase() === type.toLowerCase() )return prop
            return type;
        }

        type = mapeventname[ type ] || type;
        type= !agreed.test( type ) ? type.toLowerCase() : type;
        return onPrefix+type;
    }

    /**
     * @private
     */
    var __eventClassName__=/^([A-Z]?[a-z]+)(?=[A-Z])/;

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
        var target = event.target || event.srcElement || event.currentTarget || window;

        //阻止浏览浏览器的事件冒泡
        if ( event )
        {
            !event.stopImmediatePropagation || event.stopImmediatePropagation();
            !event.stopPropagation ? event.cancelBubble=true : event.stopPropagation();
        }

        var breezeEvent={},currentTarget=event.currentTarget || target;
        var type = BreezeEvent.eventType(event.type,true);
        if( type === null )
           return null

       var className = !agreed.test(type) ? type.match( __eventClassName__ ) : null;
       if( className && className[1] )
       {
           className=Utils.ucfirst( className[1] )+'Event';
           if( window[className] )
           {
               breezeEvent=new window[className]( event )
           }
           if( breezeEvent instanceof PropertyEvent )
           {
               breezeEvent.property= Utils.isFormElement(target) ? 'value' : 'innerHTML';
               breezeEvent.newValue=target[ breezeEvent.property ];
           }

       }else if( /^mouse|click$/i.test(type) )
       {
            breezeEvent=new MouseEvent( event );
            breezeEvent.pageX= event.x || event.clientX || event.pageX;
            breezeEvent.pageY= event.y || event.clientY || event.pageY;
            if( typeof event.offsetX==='undefined' && target )
            {
                var offset=Utils.getBoundingRect( target );
                event.offsetX=breezeEvent.pageX-offset.left;
                event.offsetY=breezeEvent.pageY-offset.top;
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
        breezeEvent.type=type;
        breezeEvent.target=target || this;
        breezeEvent.currentTarget=currentTarget || this;
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
    BreezeEvent.READY_STATE_CHANGE='readystatechange';
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

    /**
     * ElementEvent
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function ElementEvent( type, bubbles,cancelable ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    ElementEvent.prototype=new BreezeEvent();
    ElementEvent.prototype.parent=null;
    ElementEvent.prototype.child=null;
    ElementEvent.prototype.constructor=ElementEvent;
    ElementEvent.CHILD_ADD='elementChildAdd';
    ElementEvent.CHILD_REMOVE='elementChildRemove';
    ElementEvent.BEFORE_CHILD_ADD='elementBeforeChildAdd';
    ElementEvent.BEFORE_CHILD_REMOVE='elementBeforeChildRemove';

    /**
     * PropertyEvent
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function PropertyEvent( type, bubbles,cancelable ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    PropertyEvent.prototype=new BreezeEvent();
    PropertyEvent.prototype.property=null;
    PropertyEvent.prototype.newValue=null;
    PropertyEvent.prototype.oldValue=null;
    PropertyEvent.prototype.constructor=PropertyEvent;
    PropertyEvent.CHANGE='propertyChange';
    PropertyEvent.COMMIT='propertyCommit';

    /**
     * StyleEvent
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function StyleEvent( type, bubbles,cancelable ){ PropertyEvent.call(this, type, bubbles,cancelable );}
    StyleEvent.prototype=new PropertyEvent();
    StyleEvent.prototype.constructor=StyleEvent;
    StyleEvent.CHANGE='styleChange';

    /**
     * MouseEvent
     * @param src
     * @param props
     * @constructor
     */
    function MouseEvent( type, bubbles,cancelable  ){ BreezeEvent.call(this,  type, bubbles,cancelable );}
    MouseEvent.prototype=new BreezeEvent();
    MouseEvent.prototype.constructor=MouseEvent;
    MouseEvent.prototype.pageX= NaN
    MouseEvent.prototype.pageY= NaN
    MouseEvent.prototype.offsetX=NaN
    MouseEvent.prototype.offsetY=NaN;
    MouseEvent.prototype.screenX= NaN;
    MouseEvent.prototype.screenY= NaN;
    MouseEvent.MOUSE_DOWN='mousedown';
    MouseEvent.MOUSE_UP='mouseup';
    MouseEvent.MOUSE_OVER='mouseover';
    MouseEvent.MOUSE_OUT='mouseout';
    MouseEvent.MOUSE_OUTSIDE='mouseoutside';
    MouseEvent.MOUSE_MOVE='mousemove';
    MouseEvent.MOUSE_WHEEL='mousewheel';
    MouseEvent.CLICK='click';
    MouseEvent.DBLCLICK='dblclick';


    function HttpEvent( type, bubbles,cancelable ){ BreezeEvent.call(this,  type, bubbles,cancelable );}
    HttpEvent.prototype=new BreezeEvent();
    HttpEvent.prototype.data=null;
    HttpEvent.SUCCESS = 'httpSuccess';
    HttpEvent.ERROR   = 'httpError';
    HttpEvent.CANCEL  = 'httpCancel';
    HttpEvent.TIMEOUT = 'httpTimeout';
    HttpEvent.OPEN    = 'httpOpen';
    HttpEvent.DONE    = 'done';


    function KeyboardEvent( type, bubbles,cancelable  ){ BreezeEvent.call(this,  type, bubbles,cancelable );}
    KeyboardEvent.prototype=new BreezeEvent();
    KeyboardEvent.prototype.constructor=KeyboardEvent;
    KeyboardEvent.KEYPRESS='keypress';
    KeyboardEvent.KEY_UP='keyup';
    KeyboardEvent.KEY_DOWN='keydown';


    window.KeyboardEvent=KeyboardEvent;
    window.HttpEvent=HttpEvent;
    window.BreezeEvent=BreezeEvent;
    window.ElementEvent=ElementEvent;
    window.PropertyEvent=PropertyEvent;
    window.StyleEvent=StyleEvent;
    window.MouseEvent=MouseEvent;

})(window)