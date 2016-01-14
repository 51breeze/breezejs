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
     * 所有皮肤组件的基类。
     * 只有需要显示皮肤的组件才需要继承此类。此组件是 Component 的子类，具备 Component 的特性。
     * 有关SkinGroup的用法请查看SkinGroup的说明。
     * @param SkinGroup skinGroup
     * @returns {Component}
     * @constructor
     */
    function SkinComponent(skinGroup)
    {
        if( !(this instanceof SkinComponent) )
            return new SkinComponent(skinGroup);

        if( typeof skinGroup !== "undefined" )
        {
            this.skinGroup( skinGroup );
        }
        Component.call(this);
    }

    SkinComponent.prototype=  new Component();
    SkinComponent.prototype.constructor=SkinComponent;
    SkinComponent.prototype.componentProfile='skinComponent';
    SkinComponent.prototype.initializeMethod=[];
    SkinComponent.prototype.__skinGroup__=null ;
    SkinComponent.prototype.__skinChanged__=true;

    /**
     * overwrite method
     * @param skinGroup
     * @protected
     */
    SkinComponent.prototype.skinInstalled=function( skinGroup )
    {
        if( skinGroup instanceof Breeze )
           this.viewport( skinGroup );
    }

    /**
     * @returns {string|SkinGroup|Breeze}
     * @protected
     */
    SkinComponent.prototype.getDefaultSkin=function()
    {
        return this.viewport();
    }

    /**
     * 获取设置皮肤组
     * @returns {Breeze|SkinGroup|EventDispatcher|SkinComponent|string}
     * @public
     */
    SkinComponent.prototype.skinGroup=function( skinGroup )
    {
        if( typeof skinGroup !== "undefined" )
        {
            this.__skinGroup__=  skinGroup instanceof Breeze ? skinGroup : new SkinGroup(skinGroup);
            this.__skinChanged__=true;
            return this;
        }
        if( this.__skinGroup__ === null )
        {
            this.__skinGroup__ = this.getDefaultSkin();
            this.__skinChanged__=true;
        }
        if( this.__skinChanged__===true && this.__skinGroup__ !==null )
        {
            this.__skinChanged__=false;
            this.skinInstalled( this.__skinGroup__ );
        }
        return this.__skinGroup__;
    }

    /**
     * @protected
     * @param Breeze viewport
     */
    SkinComponent.prototype.viewportChange=function( viewport )
    {
       viewport.current(null).data( this.componentProfile, this );
    }

    /**
     * @param string skinName
     * @returns {HTMLElemet}
     * @public
     */
    SkinComponent.prototype.getSkin=function(skinName)
    {
       return this.skinGroup().getSkin( skinName );
    }

    /**
     * @param skinName
     * @returns {*|SkinGroup}
     * @public
     */
    SkinComponent.prototype.currentSkin=function(skinName)
    {
        return this.skinGroup().currentSkin( skinName );
    }

    window.SkinComponent=SkinComponent;

})( window )
