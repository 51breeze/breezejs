/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{

    function Modality( skinGroup )
    {
        if( !(this instanceof Modality) )
            return new Modality(  skinGroup , type );

        /**
         * @private
         */
        var _theme={};
        _theme[ Modality.NORM ]= '<div>{elements head+body+footer}</div>';
        _theme[ Modality.TYPICAL ]= '<div>{elements head+body}</div>';
        _theme[ Modality.SIMPLE ]= '<div></div>';

        /**
         * @private
         */
        var _skinGroup=skinGroup ;

        /**
         * @param SkinGroup skinGroup
         * @returns {*}
         */
        this.skinGroup=function( skinGroup )
        {
            if( typeof skinGroup !== "undefined" )
            {
                _skinGroup=skinGroup;
                return this;
            }

            if( !(_skinGroup instanceof SkinGroup) )
            {
                var defaultSkin={
                    elements: {
                        head: '<div>{elements lable+close}</div>',
                        lable: '<lable></lable>',
                        close: '<span>关闭</span>',
                        body:  '<div></div>',
                        footer:'<div><button>取消</button><button>确认</button></div>'
                    } ,
                    attributes:{
                        head:{ 'style':{'width':'100%',height:'25px'}  },
                        lable:{ 'style':{'width':'auto',lineHeight:'25px','display':'block',cursor:'pointer'} },
                        close:{ 'style':{'width':'auto',height:'25px',padding:"0px",margin:'0px',cursor:'pointer'} },
                        body:{ 'style':{display:'none',zIndex:999,position:'absolute',backgroundColor:'#ffffff',border:'solid #333333 1px',padding:'0px'} },
                        container:{ 'style':{'width':'100%',height:'100%','display':'none', 'position':'absolute'}  },
                        footer:{ 'style':{'width':'100%',height:'35px',border:'solid #999 1px','display':'block',backgroundColor:'#ffff00'} }
                    }
                }
                _skinGroup=new SkinGroup( typeof _skinGroup === "string" ?  _skinGroup : defaultSkin , document.body , _theme[ _type ] );
            }
           return _skinGroup;
        }


        /**
         * @private
         */
        var _type= Modality.TYPICAL;

        /**
         * @param type
         * @returns {*}
         */
        this.type=function( type )
        {
            if( typeof type === "undefined" )
                return _type;
            if(  type.toUpperCase() in Modality  )
            {
                _type= type;
                return this;
            }
            throw new Error('undefined theme type in Modality.type');
        }
    }

    Modality.prototype=  new Breeze();
    Modality.prototype.constructor=Modality;
    Modality.NORM='norm';
    Modality.SIMPLE='simple';
    Modality.TYPICAL='typical';

    /**
     * @param skinName
     * @returns {Modality}
     */
    Modality.prototype.setCurrentSkin=function( skinName )
    {
        this.current( this.skinGroup().getSkin( skinName ) );
        return this;
    }

    /**
     * 显示模态框
     * @param flag
     * @returns {Modality}
     */
    Modality.prototype.display=function( flag )
    {
        this.setCurrentSkin('container')
        Breeze.prototype.display.call(this, !!flag );
        return this;
    }

    /**
     * 获取/设置宽度
     * @param value
     * @returns {*}
     */
    Modality.prototype.width=function(value)
    {
        this.setCurrentSkin('container')
        if( typeof value === "number" )
        {
            Breeze.prototype.width.call(this,value );
            return this;
        }
        return Breeze.prototype.width.call(this);
    }

    /**
     * 获取/设置高度
     * @param value
     * @returns {*}
     */
    Modality.prototype.height=function(value)
    {
        this.setCurrentSkin('container');
        if(  typeof value === "number" )
        {
            Breeze.prototype.height.call(this,  value );
            return this;
        }
        return Breeze.prototype.height.call(this);
    }

    /**
     * 设置获取标题头的高度
     * @param value
     * @returns {*}
     */
    Modality.prototype.headHeight=function( value )
    {
        this.setCurrentSkin('head');
        if( typeof value === "number" )
        {
            Breeze.prototype.height.call(this, value );
            return this;
        }
        return Breeze.prototype.height.call(this)
    }

    /**
     * 设置获取标题头的高度
     * @param value
     * @returns {*}
     */
    Modality.prototype.footerHeight=function( value )
    {
        this.setCurrentSkin('footer');
        if( typeof value === "number" )
        {
            Breeze.prototype.height.call(this,value);
           return this;
        }
        return Breeze.prototype.height.call(this);
    }

    window.Modality=Modality;

})( window )
