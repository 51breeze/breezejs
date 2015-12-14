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
     * @param SkinGroup skinGroup
     * @returns {Component}
     * @constructor
     */
    function Component(skinGroup)
    {
        if( !(this instanceof Component) )
            return new Component(skinGroup);

        if(  skinGroup instanceof SkinGroup )
        {
            this.__skinGroup__=skinGroup;
        }
    }

    Component.prototype=  new EventDispatcher();
    Component.prototype.constructor=Component;
    Component.prototype.componentProfile='component';
    Component.prototype.initializeMethod=[];
    Component.prototype.__skinGroup__=null ;
    Component.prototype.__skinChanged__=true;
    Component.NAME='component';

    /**
     * overwrite method
     * Installe / Uninstall skinGroup
     * @param skinGroup
     * @protected
     */
    Component.prototype.skinInstalled=function( skinGroup ){}
    Component.prototype.skinUninstall=function( skinGroup ){}

    /**
     * overwrite method
     * initialized component.
     * @protected
     */
    Component.prototype.initialized=function(){}

    /**
     * @param string selector
     * @returns {SkinGroup}
     * @protected
     */
    Component.prototype.getDefaultSkin=function()
    {
        return new SkinGroup('<div></div>', {}, document.body );
    }

    /**
     * @param SkinGroup skinGroup
     * @returns {Breeze|Component|EventDispatcher}
     * @public
     */
    Component.prototype.skinGroup=function( skinGroup )
    {
        if( typeof skinGroup !== "undefined" )
        {
            if( this.__skinGroup__ instanceof  SkinGroup ){
                this.skinUninstall(this.__skinGroup__);
                this.__skinGroup__.data( this.componentProfile, null );
            }
            this.__skinGroup__=skinGroup;
            this.__skinChanged__=true;
            return this;
        }

        if( !(this.__skinGroup__ instanceof SkinGroup) )
        {
            this.__skinGroup__ = this.getDefaultSkin()
            this.__skinChanged__=true;
        }

        if( this.__skinChanged__ )
        {
            this.__skinChanged__=false;
            this.__skinGroup__.data( this.componentProfile, this )
            this.skinInstalled( this.__skinGroup__ );
        }
        return this.__skinGroup__.current(null);
    }

    /**
     * @param string skinName
     * @returns {HTMLElemet}
     * @public
     */
    Component.prototype.getSkin=function(skinName)
    {
       return this.skinGroup().getSkin( skinName );
    }

    /**
     * @param skinName
     * @returns {*|SkinGroup}
     * @public
     */
    Component.prototype.currentSkin=function(skinName)
    {
        return this.skinGroup().currentSkin( skinName );
    }

    /**
     * @param name
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.style=function(name,value )
    {
        var skin = this.skinGroup();
        var result = skin.style(name,value);
        return result===skin ? this : result;
    }

    /**
     * @param name
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.property=function(name,value )
    {
        if( typeof value !== "undefined" )
        {
            this.skinGroup().property( name,value  );
            return this;
        }
        return this.skinGroup().property(name);
    }

    /**
     * @param name
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.data=function(name,value )
    {
        if( typeof value !== "undefined" )
        {
            this.skinGroup().data( name,value  );
            return this;
        }
        return this.skinGroup().data(name);
    }

    /**
     * @param name
     * @param value
     * @returns {Breeze|Manager|HTMLElement}
     * @public
     */
    Component.prototype.current=function( element )
    {
        if( typeof element !== "undefined" )
        {
            this.skinGroup().current( element );
            return this;
        }
        return this.skinGroup().current();
    }

    /**
     * 获取/设置宽度
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.width=function(value)
    {
        if( typeof value === "number" )
        {
            this.skinGroup().width( value );
            return this;
        }
        return this.skinGroup().width();
    }

    /**
     * 获取/设置高度
     * @param value
     * @returns {*}
     * @public
     */
    Component.prototype.height=function(value)
    {
        if(  typeof value === "number" )
        {
            this.skinGroup().height( value );
            return this;
        }
        return this.skinGroup().height();
    }

    /**
     * @param x
     * @param y
     * @returns {Modality}
     * @public
     */
    Component.prototype.moveTo=function(x,y)
    {
        this.skinGroup().left(x).top(y);
        return this;
    }

    /**
     * @param flag
     * @returns {Component}
     * @public
     */
    Component.prototype.display=function( flag )
    {
        this.skinGroup().display( flag )
        return this;
    }

    /**
     * @param type
     * @param listener
     * @param useCapture
     * @param priority
     * @param reference
     * @returns {Component|Breeze}
     * @public
     */
    Component.prototype.addEventListener=function(type,listener,useCapture,priority,reference)
    {
        this.skinGroup().addEventListener(type,listener,useCapture,priority,reference);
        return this;
    }

    /**
     *
     * @param type
     * @param listener
     * @param useCapture
     * @returns {boolean}
     * @public
     */
    Component.prototype.removeEventListener=function(type,listener,useCapture)
    {
        return this.skinGroup().removeEventListener(type,listener,useCapture);
    }

    /**
     * @param event
     * @returns {boolean}
     * @public
     */
    Component.prototype.dispatchEvent=function( event )
    {
        return this.skinGroup().dispatchEvent( event );
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
        Breeze('['+Component.NAME+']').forEach(function(element){

            var className= this.property( Component.NAME )
            className=window[ className ] ||  window[ Utils.ucfirst(className) ];
            if( className )
            {
                var instance = new className( new SkinGroup(element) );
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

                var index = 0;
                for( index=0; index < instance.initializeMethod.length; index++)
                {
                    var method = instance.initializeMethod[ index ];
                    var value = instance.property(method);
                    if( method && value !==null && typeof instance[ method ] === "function" )
                    {
                        instance[ method ]( value );
                    }
                }
                instance.initialized();
            }
        })
        Breeze.rootEvent().dispatchEvent( new BreezeEvent( Component.INITIALIZE_COMPLETED ) )
    }

    //初始化组件
    Breeze.ready(function(){Component.initialize();});
    Component.INITIALIZE_COMPLETED='initializeCompleted';
    window.Component=Component;

})( window )