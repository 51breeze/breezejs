/*
 * BreezeJS : EventDispatcher class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

package lib
{

    import com.B;

    public class EventDispatcher extends Object
    {

        private var getProxyTarget:Function = null;
        private var storage:Function = null;
        private var forEachCurrentItem;
        private var length;

        static var Listener:Class=B;
        static var SpecialEvent:Class=B;

        /**
         * EventDispatcher Class
         * 事件调度器，所有需要实现事件调度的类都必须继承此类。
         * @param HTMLElement|Array target 元素目标对象,允许一个元素或者一组元素
         * @returns {EventDispatcher}
         * @constructor
         */
        public function EventDispatcher( target )
        {
            this['getProxyTarget' || this.length ];
            this.getProxyTarget = target && 1 ?
                function () {
                    return target.length > 0 ? target : [this];
                }:
                function () {
                    return this.forEachCurrentItem ? [this.forEachCurrentItem] : ( this.length > 0 ? this : [this] );
                };
        }

        public function hasEventListener( type )
        {
            var target= this.getProxyTarget()
                ,index=0;
            while( index < target )
            {
                var events = this.storage.call( target[ index ] );
                if( events && events[type] )
                {
                    return true;
                }
                index++;
            }
            System.log( this instanceof EventDispatcher , '====is even ====');
            return false;
        };

        /**
         * 添加侦听器
         * @param type
         * @param listener
         * @param priority
         * @returns {EventDispatcher}
         */
        function addEventListener(type,callback,useCapture,priority,reference):lib.EventDispatcher
        {
            var len=type.length;

            //指定一组事件
            if( type instanceof Array )
            {
                while( len > 0 )this.addEventListener( type[--len],callback,useCapture,priority,reference);
                return this;
            }

            if( typeof type !== 'string' )
            {
                throw new Error('invalid event type.');
            }

            var target= this.getProxyTarget()
                ,index=0;
            var listener=new EventDispatcher.Listener(callback,useCapture,priority,reference);
            var bindBeforeProxy;

            while(  index < target.length )
            {
                listener.dispatcher=this;
                listener.currentTarget=target[index];
                listener.type=type;
                if( !(bindBeforeProxy[type] instanceof EventDispatcher.SpecialEvent) ||
                    !bindBeforeProxy[type].callback.call(this,listener)  )
                {

                }
                index++;
            }

            return this;
        }


        /**
         * 移除指定类型的侦听器
         * @param type
         * @param listener
         * @returns {boolean}
         */
        function removeEventListener(type,listener)
        {
            var target= this.getProxyTarget();
            var b=0;
            var removeEventListener:Function;
            while( b < target.length )
            {
                removeEventListener.call(target[b],type,listener,this);
                b++;
            }

            return true;
        };

        /**
         * 调度指定事件
         * @param event
         * @returns {boolean}
         */
        function dispatchEvent( event )
        {
            var BreezeEvent;
            var dispatchEvent;
            if( !(event instanceof BreezeEvent) )
                throw new Error('invalid event.');
            var target = this['getProxyTarget'];
            var targets = this['getProxyTargets'](998);
            var i=0;
            var element;
            target();
            while( i < target.length && !event.propagationStopped )
            {
                element =  target[i] ;
                event.currentTarget=element;
                event.target = event.target || element;
                dispatchEvent( event );
                i++;
            }
            return !event.propagationStopped;
        };
    }
}