/*
 * BreezeJS : EventDispatcher class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(window,undefined)
{
    "use strict";

    var

    /**
     * 特定的一些事件类型。
     * 这些事件类型在设备上不被支持，只有通过其它的事件来模拟这些事件的实现。
     * @type {}
     */
    bindBeforeProxy={}

    /**
     * EventDispatcher Class
     * 事件调度器，所有需要实现事件调度的类都必须继承此类。
     * @param HTMLElement|Array target 元素目标对象,允许一个元素或者一组元素
     * @returns {EventDispatcher}
     * @constructor
     */
    function EventDispatcher( target )
    {
        if( !(this instanceof EventDispatcher) )
            return new EventDispatcher(target);
        target=Utils.isEventElement( target ) ? [ target ] : ( target instanceof Array ? target : [this] );
        this.target=function()
        {
            if( this instanceof Breeze )
            {
                return this.forEachCurrentItem ? [ this.forEachCurrentItem ] : ( this.length > 0 ? this : [this] );
            }
            return target;
        }
    };

    //Constructor
    EventDispatcher.prototype.constructor=EventDispatcher;

    /**
     * 判断是否有指定类型的侦听器
     * @param type
     * @returns {boolean}
     */
    EventDispatcher.prototype.hasEventListener=function( type  )
    {
        var target= this.target()
            ,index=0;
        while( index < target.length )
        {
            var events = Utils.storage( target[ index ], 'events' );
            if( events && events[type] )
            {
                return true;
            }
            index++;
        }
        return false;
    }

    /**
     * 添加侦听器
     * @param type
     * @param listener
     * @param priority
     * @returns {EventDispatcher}
     */
    EventDispatcher.prototype.addEventListener=function(type,listener,useCapture,priority,reference)
    {
        //指定一组事件
        if( type instanceof Array )
        {
            var len=type.length;
            while( len > 0 )this.addEventListener( type[--len],listener,useCapture,priority,reference);
            return this;
        }

       if( typeof type !== 'string' )
       {
          throw new Error('invalid event type.')
       }
        var target= this.target()
            ,index=0;

        while(  index < target.length )
        {
            var listenerEvent=new EventDispatcher.Listener(listener,useCapture,priority,reference);
            listenerEvent.dispatcher=this;
            if( !(bindBeforeProxy[type] instanceof EventDispatcher.SpecialEvent) ||
                !bindBeforeProxy[type].callback.call(this,target[index],listenerEvent,type)  )
            {
                EventDispatcher.addEventListener.call(target[index], type, listenerEvent );
            }
            index++;
        };
        return this;
    }

    /**
     * 移除指定类型的侦听器
     * @param type
     * @param listener
     * @returns {boolean}
     */
    EventDispatcher.prototype.removeEventListener=function(type,listener)
    {
        var target= this.target();
        var b=0;
        while( b < target.length )
        {
             EventDispatcher.removeEventListener.call(target[b],type,listener,this);
             b++;
        }
        return true;
    }

    /**
     * 调度指定事件
     * @param event
     * @returns {boolean}
     */
    EventDispatcher.prototype.dispatchEvent=function( event )
    {
        if( !(event instanceof BreezeEvent) )
            throw new Error('invalid event.')

        var target = this.target();
        var i=0;
        var element;
        while( i < target.length && !event.propagationStopped )
        {
            element =  target[i] ;
            event.currentTarget=element;
            event.target = event.target || element;
            EventDispatcher.dispatchEvent( event );
            i++;
        };
        return !event.propagationStopped;
    }

    /**
     * 添加侦听器到元素中
     * @param listener
     * @param handle
     * @returns {boolean}
     */
    EventDispatcher.addEventListener=function( type, listener, handle )
    {
        //是否为侦听对象
        if( !(listener instanceof  EventDispatcher.Listener) )
        {
            throw new Error('listener invalid, must is EventDispatcher.Listener');
        }

        if( !Utils.isEventElement( this ) )
            return false;

        //是否有指定的目标对象
        listener.currentTarget || (listener.currentTarget = this);

        //获取事件数据集
        var events = Utils.storage( this,'events') || {};

        if( !events[ type ]  )
        {
            Utils.storage( this,'events',events);
            events[ type ]={'listener':[],'handle':handle || EventDispatcher.dispatchEvent};
            events = events[ type ];

        }else
        {
            events = events[ type ];
        }

        //如果不是 EventDispatcher 则在第一个事件中添加事件代理。
        if( events['listener'].length===0 && !(this instanceof EventDispatcher) )
        {
            var eventType= BreezeEvent.eventType(type);
            document.addEventListener ? this.addEventListener(eventType,handle,listener.useCapture) : this.attachEvent(eventType,handle);
        }

        //添加到元素
        events['listener'].push( listener );

        //按权重排序，值大的在前面
        if( events['listener'].length > 1 ) events['listener'].sort(function(a,b)
        {
            return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
        })
        return true;
    }


    /**
     * 添加侦听器到元素中
     * @param string type 事件类型, 如果是一个'*'则表示删除所有的事件
     * @param function listener 可选，如果指定则只删除此侦听器
     * @param EventDispatcher eventDispatcher 可选，如果指定则只删除本对象中的元素事件
     * @returns {boolean}
     */
    EventDispatcher.removeEventListener=function(type, listener, eventDispatcher )
    {
        //获取事件数据集
        var events = Utils.storage(this,'events') || {};
        var old = events;

        if( type ==='*')
        {
            for(var t in events )
            {
                EventDispatcher.removeEventListener.call(this,t,listener,eventDispatcher);
            }
            return true;
        }

        if( !events[type] )
        {
            return false;
        }

        events = events[type];
        var length= events.listener.length,dispatcher;
        var haslistener = typeof listener === "undefined";
        var hasdispatcher = typeof eventDispatcher === "undefined";
        while( length > 0 )
        {
            --length;
            dispatcher=events.listener[ length ].dispatcher;

            //如果有指定侦听器则删除指定的侦听器
            if(  ( haslistener || events.listener[ length ].callback===listener ) &&
                 ( hasdispatcher || eventDispatcher === dispatcher) )
            {
                 events.listener.splice(length,1);
            }
        }

        //如果是元素并且也没有侦听器就删除
        if( events.listener.length < 1 )
        {
            if( !(this instanceof EventDispatcher) )
            {
                var eventType= BreezeEvent.eventType(type);
                if( document.removeEventListener )
                {
                    this.removeEventListener(eventType,events.handle,false);
                    this.removeEventListener(eventType,events.handle,true);

                }else
                {
                    this.detachEvent(eventType,events.handle);
                }
                return true;
            }
            delete old[ type ];
        }
        return true;
    }

    /**
     * 调度指定侦听项
     * @param event
     * @param listeners
     * @returns {boolean}
     */
    EventDispatcher.dispatchEvent=function( event )
    {
        //初始化一个全局事件
        event= BreezeEvent.create( event );
        if( event === null)return false;

        var element = event.currentTarget,
            events= Utils.storage( element ,'events.'+ event.type );

        events =events ? events.listener.slice(0) : [];
        var length= 0,listener;
        while(  length < events.length )
        {
            listener = events[ length++ ];
            var reference = listener.reference || listener.dispatcher;
            var is=false;

            if( event.currentTarget !== listener.currentTarget )
                continue;

            //设置 Breeze 的当前元素对象
            if( reference && reference instanceof Breeze && reference.indexOf( event.currentTarget ) >=0 )
            {
                reference.current( event.currentTarget );
                is=true;
            }
            //调度侦听项
            listener.callback.call( reference , event );

            //清除 Breeze 的当前元素对象
            if( is )reference.current( null );

            if( event.propagationStopped===true )
               return false;
        }
        return true;
    }

    /**
     * 判断元素是不注册了指定类型的事件
     * @param type
     * @returns {*}
     */
    EventDispatcher.hasEventListener=function( type )
    {
        if( typeof type  !== "string" )
          return false;
        var events = Utils.storage( this, 'events' ) || {}
        return !!events[ type ];
    }

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
    EventDispatcher.Listener=function(callback,useCapture,priority,reference)
    {
        if( typeof callback !=='function' )
            throw new Error('callback not is function in EventDispatcher.Listener')
        this.callback=callback;
        this.useCapture=!!useCapture;
        this.priority=parseInt(priority) || 0;
        this.reference=reference || null;
        this.dispatcher=null;
        this.currentTarget=null;
    }
    EventDispatcher.Listener.prototype.constructor= EventDispatcher.Listener;
    EventDispatcher.Listener.prototype.useCapture=false;
    EventDispatcher.Listener.prototype.dispatcher=null;
    EventDispatcher.Listener.prototype.reference=null;
    EventDispatcher.Listener.prototype.priority=0;
    EventDispatcher.Listener.prototype.callback=null;
    EventDispatcher.Listener.prototype.currentTarget=null;

    /**
     * 特定事件扩展器
     * @param type
     * @param callback
     * @param handle
     * @returns {EventDispatcher.SpecialEvent}
     * @constructor
     */
    EventDispatcher.SpecialEvent=function(type,callback)
    {
        if( !(this instanceof  EventDispatcher.SpecialEvent) )
        {
            return new EventDispatcher.SpecialEvent(type,callback);
        }

        var __callback__;
        var __type__;

        /**
         * 绑定元素之前的回调
         * @param element
         * @param item
         * @param type
         * @param useCapture
         * @returns {*}
         */
        this.callback=function(element,listener,type,useCapture,dispatcher)
        {
            if( typeof __callback__ ==='function' )
            {
                return __callback__.call(this,element,listener,type,useCapture,dispatcher);
            }
            return false;
        }

        /**
         * 获取类型
         * @returns {*}
         */
        this.getType=function()
        {
            return __type__;
        }

        /**
         * 设置特定事件在绑定元素之前所需要执行的函数
         * @param callback
         * @returns {EventDispatcher.SpecialEvent}
         */
        this.setCallback=function(callback)
        {
            if( typeof callback !== 'function' )
            {
                throw new Error('callback not is function');
            }
            __callback__=callback;
            return this;
        }

        /**
         * 设置特定事件的类型，可以是一个数组。
         * @param type
         * @returns {EventDispatcher.SpecialEvent}
         */
        this.setType=function(type)
        {
            if( type instanceof Array )for(var i in type)
            {
                this.setType(type[i]);
            }else
            {
                bindBeforeProxy[type]=this;
                __type__ = type;
            }
            return this;
        }

        if( callback )
            this.setCallback(callback);

        if( type )
            this.setType(type);
    }
    EventDispatcher.SpecialEvent.prototype.constructor=EventDispatcher.SpecialEvent;

    /**
     * 监测加载对象上的就绪状态
     * @param event
     * @param type
     */
    var readyState=function( event , type )
    {
        var target=  event.srcElement || event.target;
        var nodeName=  Utils.nodeName( target );
        var readyState=target.readyState;
        var eventType= event.type || null;

        if( Utils.isBrowser(Utils.BROWSER_IE,9) )
        {
            //iframe
            if( nodeName==='iframe' )
            {
                readyState=target.contentWindow.document.readyState;
            }//window
            else if( target.window && target.document )
            {
                readyState=target.document.readyState;
            }
        }
        //ie9以下用 readyState来判断，其它浏览器都使用 load or DOMContentLoaded
        if( ( eventType && /load/i.test(eventType) )  || ( readyState && /loaded|complete|4/.test( readyState ) ) )
        {
            event.type = type;
            EventDispatcher.dispatchEvent( event );
            EventDispatcher.removeEventListener.call(target, type  );
        }
    }

    //定义 load 事件
    EventDispatcher.SpecialEvent(BreezeEvent.LOAD,
        function(element,listener,type)
        {
            var handle=function(event)
            {
                event= BreezeEvent.create( event );
                if( event )
                {
                    event.currentTarget= element;
                    event.target=element;
                    readyState.call(this,event,BreezeEvent.LOAD );
                }
            };

            //HTMLIFrameElement
            if( element.contentWindow )
            {
                this.addEventListener( BreezeEvent.READY, listener ,true, 10000 );
            }
            else
            {
                EventDispatcher.addEventListener.call(element, BreezeEvent.READY ,listener, handle );
                EventDispatcher.addEventListener.call(element, type,listener,handle );
            }
            return true;
        });

    // 定义ready事件
    EventDispatcher.SpecialEvent(BreezeEvent.READY,
        function(element,listener,type)
    {
        var doc = element.contentWindow ?  element.contentWindow.document : element.ownerDocument || element.document || element,
            win= doc && doc.nodeType===9 ? doc.defaultView || doc.parentWindow : window;

        if( !win || !doc )return;
        var handle=function(event)
        {
            event= BreezeEvent.create( event )
            if( event )
            {
                event.currentTarget= doc;
                event.target=doc;
                readyState.call(this,event,BreezeEvent.READY);
            }
        }

        EventDispatcher.addEventListener.call(win,'DOMContentLoaded', listener, handle );
        EventDispatcher.addEventListener.call(doc, type , listener, handle );

        //ie9 以下，并且是一个顶级文档或者窗口对象
        if( Utils.isBrowser(Utils.BROWSER_IE,9) && !element.contentWindow )
        {
            var toplevel = false;
            try {
                toplevel = window.frameElement == null;
            } catch(e) {}

            if ( toplevel && document.documentElement.doScroll )
            {
                var doCheck=function()
                {
                    try {
                        document.documentElement.doScroll("left");
                    } catch(e) {
                        setTimeout( doCheck, 1 );
                        return;
                    }
                    handle( {'srcElement':doc,'type':type} );
                }
                doCheck();
            }
            handle({'srcElement':doc,'type':type});
        }
        return true;
    });

    window.EventDispatcher=EventDispatcher;

})(window)