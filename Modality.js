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
            return new Modality( skinGroup );

        Component.call(this, skinGroup );

        /**
         * @private
         */
        var _theme={};
        _theme[ Modality.NORM ]= '<div>{elements head+body+footer}</div>';
        _theme[ Modality.TYPICAL ]= '<div>{elements head+body}</div>';
        _theme[ Modality.SIMPLE ]= '<div></div>';

        /**
         * @param type
         * @param skin
         * @returns {*}
         */
        this.theme=function( type, skin )
        {
            if( typeof skin !== "undefined" )
            {
                if(  type.toUpperCase() in Modality )
                  _theme[ type ]= skin;
                return this;
            }
            return _theme[ type ] ? _theme[ type ] : _theme[ this.type() ] ;
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
        var _horizontal='center';

        /**
         * @param align
         * @returns {*}
         */
        this.horizontal=function( align )
        {
           if( typeof align !== "undefined" )
           {
               if( Modality['H'+align.toUpperCase()] )
                  _horizontal=align;
               return this;
           }
           return _horizontal;
        }


        /**
         * @private
         */
        var _vertical='middle';

        /**
         * @param align
         * @returns {*}
         */
        this.vertical=function( align )
        {
            if( typeof align !== "undefined" )
            {
                if( Modality['V'+align.toUpperCase()] )
                    _vertical=align;
                _vertical=align;
                return this;
            }
            return _vertical;
        }

    }

    Modality.prototype=  new Component();
    Modality.prototype.constructor=Modality;
    Modality.NORM='norm';
    Modality.SIMPLE='simple';
    Modality.TYPICAL='typical';
    Modality.HLEFT='left';
    Modality.HCENTER='center';
    Modality.HRIGHT='right';
    Modality.VTOP='top';
    Modality.VMIDDLE='middle';
    Modality.VBOTTOM='bottom';

    /**
     * @returns {SkinGroup}
     */
    Modality.prototype.getDefaultSkin=function( skinGroup )
    {
        var defaultSkin={
            elements: {
                head: '<div>{elements label+close}</div>',
                label: '<label>Title</label>',
                close: '<span>关闭</span>',
                body:  '<div></div>',
                cancel:'<button {attributes button}>取消</button>',
                submit:'<button {attributes button}>确认</button>',
                footer:'<div><div style="width: auto; height: auto; float: right;">{elements cancel+submit}</div></div>'
            } ,
            attributes:{
                head:{ 'style':{'width':'100%',height:'30px',lineHeight:'30px','display':'block',backgroundColor:'#3a3a3a',color:'#d6d6db','fontSize':'14px'}  },
                label:{ 'style':{'width':'auto','display':'block',cursor:'pointer','float':'left',margin:'0px 10px'} },
                close:{ 'style':{'width':'auto',height:'25px',padding:"0px",margin:'0px',cursor:'pointer','float':'right',margin:'0px 10px'} },
                body:{ 'style':{padding:'10px','width':'100%',height:'auto','display':'block',overflow:'auto',backgroundColor:'#ffffff'} },
                button:{ 'style':{margin:'0px 5px', width:'auto',height:'25px',padding:"0px 10px"} },
                container:{ 'style':{'width':'800px',height:'550px','display':'none',overflow:'hidden','position':'absolute',zIndex:999,backgroundColor:'#3a3a3a','shadow':'0px 0px 10px 2px #444444','radius':'5px'}},
                footer:{ 'style':{'width':'100%',height:'35px',lineHeight:'30px','display':'block',backgroundColor:'#d6d6db'}}
            }
        }
        return new SkinGroup( typeof skinGroup === "string" ?  skinGroup : defaultSkin , document.body , this.theme( this.type() ) );
    }

    /**
     * @param flag
     * @returns {Modality}
     */
    Modality.prototype.hidden=function()
    {
        if( _shade instanceof Modality && this !==_shade ){
            _shade.hidden();
        }
        this.skinGroup().currentSkin('container').display(false);
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
                _shade.skinGroup().currentSkin('container').style({'opacity':0.5,'backgroundColor':'#000000','radius':'0px','shadow':'none'})
                var layout = new Layout( _shade.skinGroup().getSkin('container') );
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

    /**
     * @param event
     * @returns {Modality}
     */
    Modality.prototype.reposition=function()
    {
        var type = this.type();
        if( type === Modality.SIMPLE )
            return;
        var skin = this.skinGroup();
        var containerHeight = skin.currentSkin('container').height();
        var containerWidth = skin.currentSkin('container').width();
        var headHeight = skin.currentSkin('head').height();
        skin.currentSkin('body');
        var top = parseInt( skin.style('paddingTop') ) || 0;
        var bottom= parseInt( skin.style('paddingBottom') ) || 0;
        var right = parseInt( skin.style('paddingRight') ) || 0;
        var left= parseInt( skin.style('paddingLeft') ) || 0;

        if( type===Modality.TYPICAL )
        {
            skin.currentSkin('body')
                .height(containerHeight - headHeight-top-bottom )
                .width( containerWidth-right-left);

        }else
        {
            var footerHeight = skin.currentSkin('footer').height();
            skin.currentSkin('body')
                .height( containerHeight - headHeight - footerHeight-top-bottom )
                .width( containerWidth-right-left);
        }
        skin.current(null);
        var halign=this.horizontal()
        ,valign=this.vertical()
        ,width = Utils.getSize(window,'width')
        ,height = Utils.getSize(window,'height')
        ,h=halign==='center' ? 0.5 : halign==='right' ? 1 : 0
        ,v=valign==='middle' ? 0.5 : valign==='bottom' ? 1 : 0
        ,xOffset, yOffset;
        xOffset = Math.floor( (width-containerWidth) * h );
        yOffset = Math.floor( (height-containerHeight) * v);
        this.moveTo(xOffset,yOffset);
        return this;
    }

    /**
     * @param skinGroup
     * @returns {Modality}
     */
    Modality.prototype.skinInstalled=function( skinGroup )
    {
        if( this.type() !== Modality.SIMPLE )
        {
            var selector=Utils.sprintf('[%s=head] > [%s=close],[%s=footer] button', SkinGroup.NAME,SkinGroup.NAME,SkinGroup.NAME );
            var self = this;

            skinGroup.find( selector ).addEventListener(MouseEvent.CLICK,function(event)
            {
                var type = this.property( SkinGroup.NAME );
                if( typeof type === "string" )
                {
                    var uptype=type.toUpperCase()
                    var event = new ModalityEvent( ModalityEvent[uptype] );
                    if( self.hasEventListener( ModalityEvent[uptype] ) && !self.dispatchEvent(event) )
                        return;
                }
                self.hidden();

            }).revert();

           skinGroup.addEventListener( PropertyEvent.PROPERTY_CHANGE ,function(event){

                if( event.property==='width' || event.property==='height' )
                   self.reposition()
            })
        }
        this.reposition();
        return this;
    }

    /**
     * @param skinGroup
     */
    Modality.prototype.skinUninstall=function( skinGroup )
    {
        skinGroup.removeEventListener( PropertyEvent.PROPERTY_CHANGE, this.reposition );
    }

    /**
     * @param label
     * @returns {*}
     */
    Modality.prototype.label=function(label)
    {
        this.skinGroup().currentSkin('label')
        if( typeof label === "undefined" )
            return this.skinGroup().text();
        this.skinGroup().text( label );
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
