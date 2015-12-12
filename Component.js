/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{

    /**
     * 所有组件的基类
     * @param skinGroup
     * @returns {Component}
     * @constructor
     */
    function Component( skinGroup )
    {
        if( !(this instanceof Component) )
            return new Component(  skinGroup );

        EventDispatcher.call(this);

        /**
         * @private
         */
        var _skinGroup=skinGroup ;
        var _skinChanged=true;

        /**
         * @param SkinGroup skinGroup
         * @returns {*}
         */
        this.skinGroup=function( skinGroup )
        {
            if( typeof skinGroup !== "undefined" )
            {
                if( _skinGroup instanceof  SkinGroup )this.skinUninstall(_skinGroup);
                _skinGroup=skinGroup;
                _skinChanged=true;
                return this;
            }

            if( !(_skinGroup instanceof SkinGroup) )
            {
                _skinGroup = this.getDefaultSkin( _skinGroup )
                _skinChanged=true;
            }

            if( _skinChanged )
            {
                _skinChanged=false;
                _skinGroup.currentSkin('container').property( Component.NAME, this.componentProfile )
                this.skinInstalled( _skinGroup );
            }
            return _skinGroup;
        }
    }

    Component.prototype=  new EventDispatcher();
    Component.prototype.constructor=Component;
    Component.prototype.componentProfile='component';
    Component.prototype.initializeMethod=[];
    Component.NAME='component';
    Component.AUTO=true;

    /**
     * overwrite method
     * Installe / Uninstall skinGroup
     * @param skinGroup
     */
    Component.prototype.skinInstalled=function( skinGroup ){}
    Component.prototype.skinUninstall=function( skinGroup ){}

    /**
     * overwrite method
     * initialized component.
     * @param skinGroup
     */
    Component.prototype.initialized=function(){}

    /**
     * @returns {SkinGroup}
     */
    Component.prototype.getDefaultSkin=function( skinGroup ){
        return new SkinGroup( {} , document.body , '<div></div>' );
    }

    /**
     * 获取/设置宽度
     * @param value
     * @returns {*}
     */
    Component.prototype.width=function(value)
    {
        this.skinGroup().currentSkin('container')
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
     */
    Component.prototype.height=function(value)
    {
        this.skinGroup().currentSkin('container')
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
     */
    Component.prototype.moveTo=function(x,y)
    {
        var elem = this.skinGroup().getSkin('container');
        Utils.style(elem,'left',x)
        Utils.style(elem,'top',y)
        return this;
    }

    /**
     * 初始化组件
     * 当文档加载完成后调用此方法来初始所有的组件
     */
    Component.initialize=function()
    {

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
                    var value = this.property(method);
                    if( method && value !==null && typeof instance[ method ] === "function" )
                    {
                        instance[ method ]( value );
                    }
                }
                instance.initialized();
            }
        })
    }

    window.Component=Component;

})( window )
