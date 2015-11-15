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
     * @param object
     * @returns {EventDispatcher}
     * @constructor
     */
    function EventDispatcher( proxyTarget )
    {
        if( !(this instanceof EventDispatcher) )
            return new EventDispatcher(proxyTarget);

        var _targets=proxyTarget || null;

        /**
         * 获取代理事件的元素目标
         * @returns {array}
         */
        this.targets=function()
        {
            if( this instanceof Manager )
            {
               return this.forEachCurrentItem ? [ this.forEachCurrentItem ] : this;
            }else if( _targets )
            {
               return !(_targets instanceof Array) ? [ _targets ] : _targets;
            }
            return null;
        }
    };

    //Constructor
    EventDispatcher.prototype=new DataArray();
    EventDispatcher.prototype.bindCounter={}
    EventDispatcher.prototype.constructor=EventDispatcher;

    /**
     * 判断是否有指定类型的侦听器
     * @param type
     * @returns {boolean}
     */
    EventDispatcher.prototype.hasEventListener=function( type )
    {
        return this.bindCounter[type] > 0;
    }

    /**
     * 添加侦听器
     * @param type
     * @param listener
     * @param priority
     * @returns {Breeze}
     */
    EventDispatcher.prototype.addEventListener=function(type,listener,useCapture,priority)
    {
        //如果不是侦听器对象
        if( !(listener instanceof EventDispatcher.Listener) )
        {
            listener=new EventDispatcher.Listener(listener,useCapture,priority,this);
        }

        //指定一组事件
        if( type instanceof Array )
        {
            var len=type.length;
            while( len > 0 )this.addEventListener( type[--len],listener,useCapture,priority );
            return this;
        }

       if( typeof type !== 'string' )
         return this;

        var target= this.targets()
            ,element
            ,index=0;

        do{
            element= target ? target[ index++] : this;
            if( !element )continue;
            if( target && target[ index ] instanceof EventDispatcher )
            {
                target[ index ].addEventListener(type,listener,useCapture,priority);
            }else if(  !(bindBeforeProxy[type] instanceof EventDispatcher.SpecialEvent) || !bindBeforeProxy[type].callback.call(this,element,listener,type,useCapture)  )
            {
                EventDispatcher.addEventListener.call(element, type, listener );
            }
        }while( target && index < target.length );
        this.bindCounter[type] ? this.bindCounter[type]++ : this.bindCounter[type]=1;
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
        if( type=='*' )
        {
            for( var t in this.__bindType__ )
                this.removeEventListener(t,listener);
            return true;
        }

        var target= this.targets();
        var b=0;
        var element;
        do{
             element = target ? target[b++] : this;
             target && target[b] instanceof EventDispatcher ? target[b].removeEventListener(type,listener) :
             EventDispatcher.removeEventListener.call(element,type,listener);
        }while( target && b < target.length )
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
        var target = this.targets();
        var i=0;
        var element;
        do{
            element = target ? target[i++] : this;
            if( event.propagationStopped===true ||
                ( target && target[i] instanceof EventDispatcher && !target[i].dispatchEvent(event) ) )
            {
                return false;
            }
            event.currentTarget=element;
            event.target=element;
            EventDispatcher.dispatchEvent( event );
        }while( target && i < target.length )
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

        //获取事件数据集
        var events = Utils.storage(this,'events') || {};
        var capture= Number( listener.useCapture );
        if( !events[ type ]  )
        {
            Utils.storage(this,'events',events);
            events[ type ]=[]
            events=events[ type ][ capture ]={'listener':[],'handle':null};

        }else
        {
            events = events[ type ][ capture ] || ( events[ type ][ capture ]={'listener':[],'handle':null} );
        }

        //是否有指定的目标对象
        !listener.target && (listener.target = this);

        //添加到元素
        events['listener'].push( listener );

        //如果不是 EventDispatcher 则在第一个事件中添加事件代理。
        if( events['listener'].length===1 && !(this instanceof EventDispatcher) )
        {
            var handle = handle || EventDispatcher.dispatchEvent;
            var eventType= BreezeEvent.eventType(type);
            events.handle=handle;
            document.addEventListener ? this.addEventListener(eventType,handle,false) : this.attachEvent(eventType,handle);
        }

        //按权重排序，值大的在前面
        if( events['listener'].length > 1 ) events['listener'].sort(function(a,b)
        {
            return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
        })
        return true;
    }


    /**
     * 添加侦听器到元素中
     * @param listener
     * @param handle
     * @returns {boolean}
     */
    EventDispatcher.removeEventListener=function( type, listener, useCapture )
    {
        //删除捕获阶段和冒泡阶段的事件
        if( typeof useCapture === "undefined" )
        {
            if( EventDispatcher.removeEventListener.call(this,type, listener, false ) &&
                EventDispatcher.removeEventListener.call(this,type, listener, true ) )
                return true;
            return false;
        }

        //获取事件数据集
        var events = Utils.storage(this,'events') || {};
        useCapture= Number( useCapture ) || 0;
        events = events[ type ] || {};
        events = events[useCapture];

        if( !events || !events['listener'] || events['listener'].length < 1  )
            return true;

        var length= events.listener.length,dispatcher;
        while( length > 0 )
        {
            --length;
            dispatcher=events.listener[ length ].dispatcher;
            //如果有指定侦听器则删除指定的侦听器
            if(  ( !listener || events.listener[ length ].callback===listener ) && dispatcher.bindCounter[type] > 0 )
            {
                --dispatcher.bindCounter[type];
                events.listener.splice(length,1);
            }
        }

        //如果是元素并且也没有侦听器就删除
        if( !(this instanceof EventDispatcher) && events.listener.length < 1 )
        {
            var win=  Utils.getWindow( this );
            if( (this.nodeType && this.nodeType===1) || this===win || (win && this===win.document) )
            {
                var eventType= BreezeEvent.eventType(type);
                document.removeEventListener ? this.removeEventListener(eventType,events.handle,false) : this.detachEvent(eventType,events.handle)
                return true;
            }
            return false;
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
        if( event === null )
            return false;
        var targets = [[]];
        if( !(event.currentTarget instanceof EventDispatcher) )
        {
            targets.push([]);

            //是否只是触发捕获阶段的事件
            var useCapture= event.bubbles === false;
            var element = event.currentTarget;
            do{
                var item = Utils.storage( element ,'events')
                if( item && item[ event.type ] )
                {
                    //捕获阶段
                    if( item[ event.type ][1] )
                       targets[1].push( element );

                    //冒泡阶段
                    if( !useCapture && item[ event.type ][0] )
                        targets[0].push( element );
                }
                element=element.parentNode;
            }while( element )

            //捕获阶段的事件先从根触发
            targets[1]=targets[1].reverse();

        }else
        {
            targets[ 0 ].push( event.currentTarget )
        }

        var step=targets.length,index= 0,category;
        while(  step > 0 )
        {
            category = targets[ --step ];
            index = 0;
            while( index < category.length )
            {
                //获取事件数据集
                var target = category[ index++ ];
                var events = Utils.storage( target ,'events') || {};
                events = events[ event.type ] ? events[ event.type ][ step ]['listener'] : null;
                if( !events || events.length < 1 )
                {
                    continue;
                }

                var length= 0,listener;
                while(  length < events.length )
                {
                    listener = events[ length++ ];

                    //设置 Manager 的当前元素对象
                    if( listener.dispatcher instanceof Manager )
                    {
                        listener.dispatcher.current( listener.target );
                    }

                    event.target = target;
                    //调度侦听项
                    listener.callback.call( listener.dispatcher , event );
                    if( event && event.propagationStopped===true )
                       return false
                }
            }
        }
        return true;
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
    EventDispatcher.Listener=function(callback,useCapture,priority,dispatcher,target)
    {
        if( typeof callback !=='function' )
            throw new Error('callback not is function in EventDispatcher.Listener')
        if(  !(dispatcher instanceof EventDispatcher) )
            throw new Error('dispatcher not is EventDispatcher in EventDispatcher.Listener');
        this.callback=callback;
        this.priority=parseInt(priority) || 0;
        this.useCapture=!!useCapture;
        this.dispatcher=dispatcher; //当前调度对象
        this.target=target || null; //html元素
    }
    EventDispatcher.Listener.prototype.constructor= EventDispatcher.Listener;

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
                bindBeforeProxy[ type[i] ]=this;
            }else
            {
                bindBeforeProxy[type]=this;
            }
            __type__ = type;
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
        if( ( eventType && /load/i.test(eventType) )  || ( readyState && /loaded|complete/.test( readyState ) ) )
        {
            event.type = type;
            EventDispatcher.dispatchEvent( event );
            EventDispatcher.removeEventListener.call(target, type );
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

            if( element.contentWindow )
            {
                this.addEventListener( BreezeEvent.READY, listener ,true, 10000 );

            }else
            {
                handle({'srcElement':element,'type':type});
                EventDispatcher.addEventListener.call(element, type,             listener,  handle );
                EventDispatcher.addEventListener.call(element, BreezeEvent.READY ,listener, handle );
            }
            return true;
        })

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

        EventDispatcher.addEventListener.call(win,'load', listener, handle );
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
        }
        handle({'srcElement':doc,'type':type});
        return true;
    });

    window.EventDispatcher=EventDispatcher;

})(window)