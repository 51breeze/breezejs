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
            return new Modality(  skinGroup );

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
        var _skinChanged=true;

        /**
         * @param SkinGroup skinGroup
         * @returns {*}
         */
        this.skinGroup=function( skinGroup )
        {
            if( typeof skinGroup !== "undefined" )
            {
                _skinGroup=skinGroup;
                _skinChanged=true;
                return this;
            }

            if( !(_skinGroup instanceof SkinGroup) )
            {
                var defaultSkin={
                    elements: {
                        head: '<div>{elements lable+close}</div>',
                        lable: '<lable>Title</lable>',
                        close: '<span>关闭</span>',
                        body:  '<div></div>',
                        cancel:'<button {attributes button}>取消</button>',
                        submit:'<button {attributes button}>确认</button>',
                        footer:'<div><div style="width: auto; height: auto; float: right;">{elements cancel+submit}</div></div>'
                    } ,
                    attributes:{
                        head:{ 'style':{'width':'100%',height:'35px',lineHeight:'30px','display':'block',backgroundColor:'#118dc2'}  },
                        lable:{ 'style':{'width':'auto','display':'block',cursor:'pointer','float':'left',margin:'0px 5px'} },
                        close:{ 'style':{'width':'auto',height:'25px',padding:"0px",margin:'0px',cursor:'pointer','float':'right',margin:'0px 5px'} },
                        body:{ 'style':{padding:'0px','width':'100%',height:'auto','display':'block',overflow:'auto'} },
                        button:{ 'style':{margin:'0px 5px', width:'80px',height:'25px'} },
                        container:{ 'style':{'width':'800px',height:'550px','display':'none',overflow:'hidden','position':'absolute',zIndex:999,backgroundColor:'#ffffff','shadow':'0px 0px 10px 2px #444444','radius':'5px'}},
                        footer:{ 'style':{'width':'100%',height:'35px',lineHeight:'30px','display':'block',backgroundColor:'#c0c1c2'}}
                    }
                }
                _skinGroup=new SkinGroup( typeof _skinGroup === "string" ?  _skinGroup : defaultSkin , document.body , _theme[ this.type() ] );
                updatePosition.call(this)
            }
            if( _skinChanged && this.type() !== Modality.SIMPLE )
            {
                var self = this;
                _skinGroup.find('[data-skin=head] > [data-skin=close],[data-skin=footer] button').addEventListener(MouseEvent.CLICK,function(event)
                {
                    var type = this.property('data-skin');
                    if( typeof type === "string" )
                    {
                        var uptype=type.toUpperCase()
                        var event = new ModalityEvent( ModalityEvent[uptype] );
                        this.current( event.target )
                        if( self.hasEventListener( ModalityEvent[uptype] ) && !self.dispatchEvent(event) )
                           return;
                    }
                    self.hidden();
                }).revert();
                _skinChanged=false;
            }
            return _skinGroup;
        }

        /**
         * @private
         */
        var _type= Modality.NORM;

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
        var _layout=null;

        /**
         * @returns {Layout}
         */
        this.layout=function()
        {
            if( _layout===null )
            {
                _layout = new Layout( this.skinGroup().getSkin('container') )
            }
            return _layout;
        }
    }

    Modality.prototype=  new Breeze();
    Modality.prototype.constructor=Modality;
    Modality.NORM='norm';
    Modality.SIMPLE='simple';
    Modality.TYPICAL='typical';

    /**
     * @param flag
     * @returns {Modality}
     */
    Modality.prototype.hidden=function()
    {
        this.skinGroup().currentSkin('container')
        if( _shade instanceof Modality && this !==_shade )_shade.hidden();
        this.skinGroup().display(false);
        return this;
    }

    var _shade=null;

    /**
     * 显示模态框
     * @param flag
     * @returns {Modality}
     */
    Modality.prototype.show=function( shade ,zIndex )
    {
        zIndex = zIndex || 999;
        this.skinGroup().currentSkin('container')
        if( shade===true )
        {
            if( _shade === null )
            {
                _shade = new Modality()
                _shade.type(Modality.SIMPLE);
                _shade.skinGroup().currentSkin('container').style({'opacity':0.5,'backgroundColor':'#000000'})
                var layout = _shade.layout();
                layout.left(0);
                layout.top(0);
                layout.right(0);
                layout.bottom(0);
                layout.updateDisplayList();
            }
            _shade.show(false,zIndex-1);
        }

        this.skinGroup().style({'zIndex':zIndex,'position':'absolute'}).display(true);
        return this;
    }

    var updatePosition=function()
    {
        var type = this.type()
        if( type === Modality.SIMPLE )
            return;
        var skin = this.skinGroup();
        var containerHeight = skin.currentSkin('container').height();
        var headHeight = skin.currentSkin('head').height();
        if( type===Modality.TYPICAL )
        {
            skin.currentSkin('body').height(containerHeight - headHeight);

        }else
        {
            var footerHeight = skin.currentSkin('footer').height();
            skin.currentSkin('body').height(containerHeight - headHeight - footerHeight);
        }
    }

    /**
     * @param lable
     * @returns {*}
     */
    Modality.prototype.lable=function(lable)
    {
        this.skinGroup().currentSkin('lable')
        if( typeof lable === "undefined" )
            return this.skinGroup().text();
        this.skinGroup().text( lable );
        return this;
    }

    /**
     * @param content
     * @returns {*}
     */
    Modality.prototype.content=function( content )
    {
        this.skinGroup().currentSkin('body')
        if( typeof content === "undefined" )
            return this.skinGroup().html();
        this.skinGroup().html( content );
        return this;
    }

    /**
     * 获取/设置宽度
     * @param value
     * @returns {*}
     */
    Modality.prototype.width=function(value)
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
    Modality.prototype.height=function(value)
    {
        this.skinGroup().currentSkin('container')
        if(  typeof value === "number" )
        {
            this.skinGroup().height( value );
            updatePosition.call(this)
            return this;
        }
        return this.skinGroup().height();
    }

    /**
     * @param x
     * @param y
     * @returns {Modality}
     */
    Modality.prototype.moveTo=function(x,y)
    {
        this.skinGroup().currentSkin('container');
        this.skinGroup().left( x );
        this.skinGroup().top( y );
        return this;
    }

    /**
     * 设置获取标题头的高度
     * @param value
     * @returns {*}
     */
    Modality.prototype.headHeight=function( value )
    {
        this.skinGroup().currentSkin('head');
        if( typeof value === "number" )
        {
            this.skinGroup().height( value );
            updatePosition.call(this)
            return this;
        }
        return this.skinGroup().height();
    }

    /**
     * 设置获取标题头的高度
     * @param value
     * @returns {*}
     */
    Modality.prototype.footerHeight=function( value )
    {
        this.skinGroup().currentSkin('footer');
        if( typeof value === "number" )
        {
            this.skinGroup().height(value);
            updatePosition.call(this)
            return this;
        }
        return this.skinGroup().height(this);
    }

    function ModalityEvent( src, props ){ BreezeEvent.call(this, src, props);}
    ModalityEvent.prototype=new BreezeEvent();
    ModalityEvent.prototype.constructor=ModalityEvent;
    ModalityEvent.CANCEL='modalityCancel';
    ModalityEvent.CLOSE='modalityClose';
    ModalityEvent.SUBMIT='modalitySubmit';

    window.Modality=Modality;
    window.ModalityEvent=ModalityEvent;

})( window )
