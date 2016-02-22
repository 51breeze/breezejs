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
    function SkinComponent( viewport , context )
    {
        if( !(this instanceof SkinComponent) )
            return new SkinComponent(viewport, context);

        if( typeof viewport !== "undefined" )
        {
            viewport = viewport instanceof SkinGroup ? viewport : new SkinGroup(viewport, context);
            this.__skinGroup__= viewport;
        }
        return Component.call(this, viewport);
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
    SkinComponent.prototype.skinInstalled=function( skinGroup ){
        if( !skinGroup.skinObject() )skinGroup.skinObject( this.defaultSkinObject() );
        skinGroup.createSkin();
    }

    /**
     * @returns {SkinObject}
     * @protected
     */
    SkinComponent.prototype.defaultSkinObject=function(){  return new SkinObject('<div></div>') }

    /**
     * 获取视口对象
     * @returns {Breeze|SkinGroup}
     * @public
     */
    Component.prototype.viewport=function()
    {
        var viewport = this.skinGroup().current(null);
        if( viewport.length !==1 )
        {
            throw new Error('invalid viewport');
        }
        return viewport;
    }


    /**
     * 获取设置皮肤组
     * @returns {SkinGroup|SkinComponent}
     * @public
     */
    SkinComponent.prototype.skinGroup=function( skinGroup )
    {
        if( typeof skinGroup !== "undefined"  )
        {
            if( !this.__skinGroup__ )
            {
                this.__skinGroup__   = skinGroup;
                this.__skinChanged__ = true;
            }
            return this;
        }

        if( this.__skinChanged__===true )
        {
            if( !( this.__skinGroup__ instanceof SkinGroup ) )
            {
                this.__skinGroup__ = new SkinGroup( this.__skinGroup__ );
            }
            this.__skinChanged__=false;
            this.skinInstalled( this.__skinGroup__ );
        }
        return this.__skinGroup__;
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
