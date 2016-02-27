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
    function EventDispatcher( targets )
    {
        if( !(this instanceof EventDispatcher) )
            return new EventDispatcher(targets);

        this.__targets__=[];
        if( typeof Manager !== "undefined" && this instanceof Manager )
        {
            this.__targets__ = this;

        }else if( typeof targets !== "undefined" )
        {
            if(  targets instanceof Array )
            {
                this.__targets__=DataArray.prototype.filter.call(targets,function(item){
                   return Utils.isEventElement(item);
                });

            }else if( Utils.isEventElement(targets) )
            {
                this.__targets__=[ targets ];
            }
        }
    };

    //Constructor
    EventDispatcher.prototype.constructor=EventDispatcher;
    EventDispatcher.prototype.__targets__=[];

    /**
     * 获取代理事件的目标元素
     * @returns {array}
     */
    EventDispatcher.prototype.targets=function()
    {
        var result= this.__targets__;
        if( typeof result !== "undefined" && result instanceof Manager && result.forEachCurrentItem )
        {
            result= [ result.forEachCurrentItem ];
        }
        return result.length > 0 ? result : null;
    }

    /**
     * 判断是否有指定类型的侦听器
     * @param type
     * @returns {boolean}
     */
    EventDispatcher.prototype.hasEventListener=function( type, useCapture )
    {
        var target=  this.targets() || [this];
        var events = Utils.storage( target[0] , 'events' );
        if( !events || !events[type] )
            return false;

        if( typeof useCapture === "undefined" )
        {
            return !!(events[type][0] || events[type][1]);
        }
        useCapture = Number( useCapture || 0 );
        return !!events[type][useCapture];
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
        //如果不是侦听器对象
        if( !(listener instanceof EventDispatcher.Listener) )
        {
            listener=new EventDispatcher.Listener(listener,useCapture,priority,reference);
        }

        //指定一组事件
        if( type instanceof Array )
        {
            var len=type.length;
            while( len > 0 )this.addEventListener( type[--len],listener,useCapture,priority,reference);
            return this;
        }

       if( typeof type !== 'string' )
         return this;

        listener.dispatcher=this;
        var target= this.targets()
            ,element
            ,index=0;

        do{
            element= target ? target[ index++] : this;
            if( !element )continue;
            if( target && target[ index ] instanceof EventDispatcher )
            {
                target[ index ].addEventListener(type,listener,useCapture,priority);
            }else if(  !(bindBeforeProxy[type] instanceof EventDispatcher.SpecialEvent) ||
                !bindBeforeProxy[type].callback.call(this,element,listener,type,useCapture)  )
            {
                EventDispatcher.addEventListener.call(element, type, listener );
            }
        }while( target && index < target.length );
        return this;
    }

    /**
     * 移除指定类型的侦听器
     * @param type
     * @param listener
     * @returns {boolean}
     */
    EventDispatcher.prototype.removeEventListener=function(type,listener,useCapture)
    {
        var target= this.targets();
        var b=0;
        var element;
        do{
             element = target ? target[b++] : this;
             if( target && target[b] instanceof EventDispatcher )
             {
                 target[b].removeEventListener(type,listener,useCapture)

             }else
             {
                EventDispatcher.removeEventListener.call(element,type,listener,useCapture, this );
             }
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
            element = target && target.length>0 ? target[i++] : this;
            if( event.propagationStopped===true ||
                ( target && target[i] instanceof EventDispatcher && !target[i].dispatchEvent(event) ) )
            {
                return false;
            }
            event.currentTarget=element;
            event.target = event.target || element;
            EventDispatcher.dispatchEvent( event );
        }while( target && i < target.length );
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

        if( !Utils.isEventElement( this ) && !(this instanceof EventDispatcher) )
            return false;

        //是否有指定的目标对象
        listener.target || (listener.target = this);

        //获取事件数据集
        var events = Utils.storage( this,'events') || {};
        var capture= Number( listener.useCapture );

        if( !events[ type ]  )
        {
            Utils.storage( this,'events',events);
            events[ type ]=[]
            events=events[ type ][ capture ]={'listener':[],'handle':null};

        }else
        {
            events = events[ type ][ capture ] || ( events[ type ][ capture ]={'listener':[],'handle':null} );
        }

        //如果不是 EventDispatcher 则在第一个事件中添加事件代理。
        if( events['listener'].length===0 && !(this instanceof EventDispatcher) )
        {
            var handle = handle || EventDispatcher.dispatchEvent;
            var eventType= BreezeEvent.eventType(type);
            events.handle=handle;
            document.addEventListener ? this.addEventListener(eventType,handle,false) : this.attachEvent(eventType,handle);
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
     * @param listener
     * @param handle
     * @returns {boolean}
     */
    EventDispatcher.removeEventListener=function( type, listener, useCapture, target )
    {
        //删除捕获阶段和冒泡阶段的事件
        if( typeof useCapture === "undefined" )
        {
            if( EventDispatcher.removeEventListener.call(this,type, listener, false , target) &&
                EventDispatcher.removeEventListener.call(this,type, listener, true, target ) )
                return true;
            return false;
        }

        //获取事件数据集
        var events = Utils.storage(this,'events') || {};
        var old = events;
        useCapture= Number( useCapture ) || 0;
        if( type ==='*')
        {
            for(var t in events )
            {
                EventDispatcher.removeEventListener.call(this,t,listener,useCapture,target);
            }
            return true;
        }

        if( !events[type] || !events[type][useCapture] || !events[type][useCapture]['listener']
            || events[type][useCapture]['listener'].length < 1 )
        {
             delete events[type];
             return true;
        }

        events = events[type][useCapture];
        var length= events.listener.length,dispatcher;
        while( length > 0 )
        {
            --length;
            dispatcher=events.listener[ length ].dispatcher;
            //如果有指定侦听器则删除指定的侦听器
            if(  ( !listener || events.listener[ length ].callback===listener ) && ( !target || target === dispatcher) )
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
                document.removeEventListener ? this.removeEventListener(eventType,events.handle,false) : this.detachEvent(eventType,events.handle)
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
        if( event === null || !event.currentTarget )
            return false;
        var targets = [[],[]];
        var is= event.currentTarget instanceof EventDispatcher;

        //是否只是触发捕获阶段的事件
        var useCapture= event.bubbles === false;
        var element = event.currentTarget,data=null;

        //只有dom 元素的事件才支持捕获和冒泡事件，否则只有目标事件
        do{
            data = Utils.storage( element ,'events');
            if( data && data[ event.type ] )
            {
                //捕获阶段
                if( data[ event.type ][1]   )
                   targets[1].push( element );

                //冒泡阶段, ready 事件加进来
                if( (!useCapture || event.type === BreezeEvent.READY ) && data[ event.type ][0] )
                    targets[0].push( element );
            }

            //如果不是浏览器发出的事件无需冒泡节点
            element=is || !event.originalEvent ? null : element.parentNode;

        }while( element );

        //捕获阶段的事件先从根触发
        if( targets[1].length > 1 )
           targets[1]=targets[1].reverse();
        var step=targets.length,index= 0,category;
        while(  step > 0 )
        {
            //先触发捕获阶段事件，如果有
            category = targets[ --step ];
            index = 0;
            while( index < category.length && category.length > 0 )
            {
                //获取事件数据集
                var target = category[ index++ ];
                var events = Utils.storage( target ,'events') || {};
                events = events[ event.type ] && events[ event.type ][ step ] ? events[ event.type ][ step ]['listener'] : null;
                if( !events || events.length < 1 )
                    continue;
                var length= 0,listener;

                while(  length < events.length )
                {
                    listener = events[ length++ ];
                    var reference = listener.reference || listener.dispatcher;
                    var ismanager=false;

                    //设置 Manager 的当前元素对象
                    if( reference && reference instanceof Manager && reference.indexOf(target) >=0 )
                    {
                        reference.current( target );
                        ismanager=true;
                    }

                    //调度侦听项
                    listener.callback.call( reference , event );

                    //清除 Manager 的当前元素对象
                    if( ismanager )reference.current( null );
                }
                if( event && event.propagationStopped===true )
                    return false
            }
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
        this.target = null;
        this.dispatcher=null;
    }
    EventDispatcher.Listener.prototype.constructor= EventDispatcher.Listener;
    EventDispatcher.Listener.prototype.useCapture=false;
    EventDispatcher.Listener.prototype.dispatcher=null;
    EventDispatcher.Listener.prototype.reference=null;
    EventDispatcher.Listener.prototype.priority=0;
    EventDispatcher.Listener.prototype.callback=null;
    EventDispatcher.Listener.prototype.target=null;

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
        if( ( eventType && /load/i.test(eventType) )  || ( readyState && /loaded|complete/.test( readyState ) ) )
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


    //在指定的目标元素外按下鼠标
    EventDispatcher.SpecialEvent(MouseEvent.MOUSE_OUTSIDE, function(element,listener,type)
    {
        Breeze.rootEvent().addEventListener(MouseEvent.MOUSE_DOWN,function(event)
        {
             if( Utils.style(element,'display') === 'none' ||  Utils.style(element,'visibility') ==='hidden' )
                return;
             var pos = Utils.position(element);
             var width = Utils.getSize( element,'width' );
             var height = Utils.getSize( element,'height' );
             if( event.pageX < pos.left || event.pageY < pos.top || event.pageX > pos.left + width ||  event.pageY > pos.top+height )
             {
                 event = BreezeEvent.create( event );
                 event.type = MouseEvent.MOUSE_OUTSIDE;
                 this.dispatchEvent( event );
             }

        },false,0, this);
        return false;
    });

    window.EventDispatcher=EventDispatcher;

})(window)