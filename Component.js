/*
 * BreezeJS Component class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{
    "use strict";

    /**
     * 所有组件的基类
     * 组件的开发采用皮肤分离的设计方式，只有继承此组件的子类才会具有组件的特性。
     * 在引用皮肤或者更改皮肤时此组件会自动调度 skinInstalled / skinUninstall 所以这两个方法无需手动调手，只需在子类中覆写方可。
     * initialized 这个方法是组件内部操作，当文档准备就绪后并触发 Component.initialize() 并把所扩展的方法初始化完毕后组件会自动调用此方法无需手动调手，
     * 只需在子类中覆写方可。此方法的功用是当所有的扩展方法初始化完成后您可以在此方法中处理一些自己的业务逻辑以便达到更好的效果。
     * 注意：initialized 这个方法只会在HTML标记为组件并触发了 Component.initialize() 下才会调用，否则组件不会调用。
     *
     * @returns {Component}
     * @constructor
     */
    function Component( viewport )
    {
        if( !(this instanceof Component) )
            return new Component( viewport );
        if( viewport )
        {
            this.viewport( viewport );
        }
        EventDispatcher.call(this);
    }

    /**
     * 获取实例对象
     * @returns {Component}
     */
    Component.getInstance=function(element,subClass)
    {
        if( typeof subClass === "function" && subClass.prototype && subClass.prototype.componentProfile )
        {
            return Utils.storage( element, subClass.prototype.componentProfile );
        }
        return null;
    }

    Component.prototype=new EventDispatcher();
    Component.prototype.constructor=Component;
    Component.prototype.componentProfile='component';
    Component.prototype.initializeMethod=[];
    Component.prototype.initializeCompleted=false;
    Component.prototype.__viewportChanged__=true;
    Component.prototype.__viewport__=null;
    Component.NAME='component';


    /**
     * overwrite method
     * initialized 组件中的方法初始完成
     * @protected
     */
    Component.prototype.initialized=function(){}

    /**
     * overwrite method
     * initializing 组件中的方法初始进行中
     * @protected
     */
    Component.prototype.initializing=function(){}


    /**
     * @param viewport
     * @returns {Component|Breeze}
     * @public
     */
    Component.prototype.viewport=function( viewport , context )
    {
        if( typeof viewport === "undefined" )
        {
            if( this.__viewportChanged__ && this.__viewport__ !==null )
            {
                this.__viewportChanged__=false;
                this.viewportChange( this.__viewport__ );
            }
            return this.__viewport__;
        }

        if( viewport === this.__viewport__ )
        {
            return this;
        }

        if( !(viewport instanceof Breeze) )
        {
            viewport = Breeze( viewport , context );
        }
        if( viewport.length > 0 )
        {
            this.__viewport__=viewport;
            EventDispatcher.call(this,viewport[0]);
            this.__viewportChanged__=true;
            return this;
        }
        throw new Error('invalid viewport');
    }

    /**
     * @protected
     * @param Breeze newViewport
     */
    Component.prototype.viewportChange=function( newViewport ){}

    /**
     * @private
     * @returns {Breeze}
     */
    Component.prototype.getAndCheckViewport=function()
    {
        var viewport = this.viewport();
        if( !viewport )throw new Error('invalid viewport');
        return viewport;
    }


    /**
     * @param name
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.style=function(name,value )
    {
        var result = this.getAndCheckViewport().style(name,value);
        return result===viewport ? this : result;
    }

    /**
     * @param name
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.property=function(name,value )
    {
        var viewport = this.getAndCheckViewport();
        if( typeof value !== "undefined" )
        {
            viewport.property( name,value  );
            return this;
        }
        return viewport.property(name);
    }

    /**
     * @param name
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.data=function(name,value )
    {
        var viewport = this.getAndCheckViewport();
        if( typeof value !== "undefined" )
        {
            viewport.data( name,value  );
            return this;
        }
        return viewport.data(name);
    }

    /**
     * @param name
     * @param value
     * @returns {Breeze|Manager|HTMLElement}
     * @public
     */
    Component.prototype.current=function( element )
    {
        var viewport = this.getAndCheckViewport();
        if( typeof element !== "undefined" )
        {
            viewport.current( element );
            return this;
        }
        return viewport.current();
    }

    /**
     * 获取/设置宽度
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.width=function(value)
    {
        var viewport = this.getAndCheckViewport();
        if( typeof value === "number" )
        {
            viewport.width( value );
            return this;
        }
        return viewport.width();
    }

    /**
     * 获取/设置高度
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.height=function(value)
    {
        var viewport = this.getAndCheckViewport();
        if(  typeof value === "number" )
        {
            viewport.height( value );
            return this;
        }
        return viewport.height();
    }

    /**
     * @param x
     * @param y
     * @returns {Modality}
     * @public
     */
    Component.prototype.moveTo=function(x,y)
    {
        this.getAndCheckViewport().left(x).top(y);
        return this;
    }

    /**
     * @param flag
     * @returns {Component}
     * @public
     */
    Component.prototype.display=function( flag )
    {
        this.getAndCheckViewport().display( flag )
        return this;
    }
    /**
     * @param type
     * @param listener
     * @param useCapture
     * @param priority
     * @param reference
     * @returns {Component|Breeze|EventDispatcher}
     * @public
     */
    Component.prototype.addEventListener=function(type,listener,useCapture,priority,reference)
    {
        this.getAndCheckViewport().addEventListener(type,listener,useCapture,priority,reference);
        return this;
    }

    /**
     *
     * @param type
     * @param useCapture
     * @returns {boolean}
     */
    Component.prototype.hasEventListener=function( type, useCapture)
    {
       return this.getAndCheckViewport().hasEventListener( type, useCapture);
    }

    /**
     *
     * @param type·
     * @param listener
     * @param useCapture
     * @returns {boolean}
     * @public
     */
    Component.prototype.removeEventListener=function(type,listener,useCapture)
    {
        return this.getAndCheckViewport().removeEventListener(type,listener,useCapture);
    }

    /**
     * @param event
     * @returns {boolean}
     * @public
     */
    Component.prototype.dispatchEvent=function( event )
    {
        return this.getAndCheckViewport().dispatchEvent( event );
    }

    /**
     * @private
     */
    var __initialize__=false;

    /**
     * 初始化组件
     * 当文档加载完成后调用此方法来初始所有的组件
     */
    Component.initialize=function()
    {
        if( __initialize__ ===true )
          return ;

        __initialize__=true;
        Breeze.rootEvent().dispatchEvent( new BreezeEvent( Component.INITIALIZE_START ) );
        Breeze('['+Component.NAME+']').forEach(function(element){

            var className= this.property( Component.NAME );
            className=window[ className ] ||  window[ Utils.ucfirst(className) ];
            if( className )
            {
                var instance = Component.getInstance(element, className );
                if( !(instance instanceof className) )
                {
                    instance = new className(new SkinGroup(element));
                }

                //初始化视图中的脚本
                for( var b=0; b<element.childNodes.length; b++)
                {
                    var child = element.childNodes.item(b);
                    if( Utils.nodeName(child)==='noscript' )
                    {
                        element.removeChild(child);
                        new Function( Sizzle.getText(child) ).call( instance );
                    }
                }

                instance.initializing();
                var index=0;
                for( ; index < instance.initializeMethod.length; index++)
                {
                    var method = instance.initializeMethod[ index ];
                    var value = instance.property(method);
                    if( method && value !==null && typeof instance[ method ] === "function" )
                    {
                        instance[ method ]( value );
                    }
                }
                instance.initialized();
                instance.initializeCompleted=true;
            }
        })
        Breeze.rootEvent().dispatchEvent( new ComponentEvent( ComponentEvent.INITIALIZE_COMPLETED ) )
    }

    //初始化组件
    Breeze.rootEvent().addEventListener( BreezeEvent.READY,function(){Component.initialize();},false,100);

    function ComponentEvent( type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    ComponentEvent.prototype=new BreezeEvent();
    ComponentEvent.prototype.constructor=ComponentEvent;
    ComponentEvent.INITIALIZE_COMPLETED='ComponentInitializeCompleted';
    ComponentEvent.INITIALIZE_START='ComponentInitializeStart';

    window.Component=Component;
    window.ComponentEvent=ComponentEvent;

})( window )
