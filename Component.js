/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{

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
                this.skinInstalled( _skinGroup );
            }
            return _skinGroup;
        }
    }

    Component.prototype=  new EventDispatcher();
    Component.prototype.constructor=Component;

    /**
     * @param skinGroup
     */
    Component.prototype.skinInstalled=function( skinGroup ){}
    Component.prototype.skinUninstall=function( skinGroup ){}

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

    window.Component=Component;

})( window )
