/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{

    function Popup( skinGroup )
    {
        if( !(this instanceof Modality) )
            return new Modality( skinGroup );

        if( !(skinGroup instanceof SkinGroup) )
        {
            throw new Error('invalid skinGroup');
        }

        this.elements={
            head: '<div>{elements lable+close}</div>',
            lable: '<lable></lable>',
            close: '<span>关闭</span>',
            body:  '<div></div>',
            footer:'<div><button>取消</button><button>确认</button></div>'
        };

        this.attributes={
            head:{ 'style':{'width':'100%',height:'25px'}  },
            lable:{ 'style':{'width':'auto',lineHeight:'25px','display':'block',cursor:'pointer'} },
            close:{ 'style':{'width':'auto',height:'25px',padding:"0px",margin:'0px',cursor:'pointer'} },
            body:{ 'style':{display:'none',zIndex:999,position:'absolute',backgroundColor:'#ffffff',border:'solid #333333 1px',padding:'0px'} },
            container:{ 'style':{'width':'100%',height:'100%','display':'block', 'position':'absolute'}  },
            footer:{ 'style':{'width':'100%',height:'35px',border:'solid #999 1px','display':'block',backgroundColor:'#ffff00'} }
        };

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


        /**
         * @private
         */
        var _theme={};
        _theme[ Modality.NORM ]= '<div>{elements head+body+footer}</div>';
        _theme[ Modality.TYPICAL ]= '<div>{elements head+body}</div>';
        _theme[ Modality.SIMPLE ]= '<div></div>';


        /**
         * @param string type
         * @param string theme
         * @returns {*}
         */
        this.theme=function( type, theme )
        {
            if( typeof type === "string" && _theme[ type ] )
            {
                if( typeof theme === "string" )
                {
                    _theme[type] = theme;
                    return this;
                }
                return _theme[type];
            }
            throw new Error('undefined theme type in Modality.theme');
        }

        this.skinGroup=function()
        {
            return skinGroup;
        }
    }

    Modality.prototype=  new Breeze();
    Modality.prototype.constructor=Modality;
    Modality.NORM='norm';
    Modality.SIMPLE='simple';
    Modality.TYPICAL='typical';




    /**
     * 显示模态框
     * @param flag
     * @returns {Modality}
     */
    Modality.prototype.display=function( flag )
    {
        this.container( this.theme( this.type() ) );
        this.render();
        Breeze.prototype.display.call(this, flag );
        return this;
    }


    /**
     * 获取/设置宽度
     * @param value
     * @returns {*}
     */
    Modality.prototype.width=function(value)
    {
        if( typeof value === "undefined")
            return Breeze.prototype.width.call(this );
        Breeze.prototype.width.call(this, value );
        return this;
    }

    /**
     * 获取/设置高度
     * @param value
     * @returns {*}
     */
    Modality.prototype.height=function(value)
    {
        if( typeof value === "undefined")
            return Breeze.prototype.height.call(this );
        Breeze.prototype.height.call(this, value );
        return this;
    }

    window.Modality=Modality;


})( window );
