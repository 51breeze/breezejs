/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */


(function(window,undefined )
{
    var popupInstance={};
    function Popup( type )
    {
        type = type || Popup.NORM;
        if( !!popupInstance[ type ] )
           return popupInstance[ type ];

        if( !(this instanceof Popup) )
            return new Popup( type );

        this.__type__ = type || Popup.NORM;
        popupInstance[ this.__type__ ]=this;

        var skin = new SkinGroup('body');
        skin.splice(0, skin.length, skin.addChildSkin('div','container') );
        return SkinComponent.call(this, skin );
    }

    //弹出风格
    Popup.NORM='norm';
    Popup.SIMPLE='simple';

    //水平垂直对齐常量
    Popup.HLEFT='left';
    Popup.HCENTER='center';
    Popup.HRIGHT='right';
    Popup.VTOP='top';
    Popup.VMIDDLE='middle';
    Popup.VBOTTOM='bottom';

    Popup.prototype=  new SkinComponent();
    Popup.prototype.constructor=Popup;
    Popup.prototype.__type__=Popup.NORM;
    Popup.prototype.componentProfile='Popup';
    Popup.prototype.initializeMethod=['show','hidden','label','headHeight','footerHeight','type','vertical','horizontal']

    /**
     * @param event
     * @private
     */
    Popup.prototype.__propertyChanged__=function(event)
    {
        event.stopPropagation();
        if( event.property==='width' || event.property==='height' )setPositionAndSize.call(this);
    }

    /**
     * 设置此模态框的位置和大小
     * @returns {Popup}
     * @protected
     */
    function setPositionAndSize()
    {
        var skin = this.skinGroup().current(null);
        var containerHeight = skin.height();
        var containerWidth = skin.width();

        var halign=this.horizontal()
            ,valign=this.vertical()
            ,width = Utils.getSize(window,'width')
            ,height = Utils.getSize(window,'height')
            ,h=halign==='center' ? 0.5 : halign==='right' ? 1 : 0
            ,v=valign==='middle' ? 0.5 : valign==='bottom' ? 1 : 0
            ,xOffset, yOffset;
        xOffset = Math.floor( (width-containerWidth) * h );
        yOffset = Math.floor( (height-containerHeight) * v);
        this.moveTo(xOffset,yOffset)
        return this;
    }

    /**
     * 皮肤安装完成
     * @param skinGroup
     * @returns {Popup}
     * @protected
     */
    Popup.prototype.skinInstalled=function( skinGroup )
    {
        SkinComponent.prototype.skinInstalled.call(this,skinGroup);
        skinGroup[0] = skinGroup.getSkinAndValidate('container');

        if( skinGroup.getSkin('close') )
        {
            skinGroup.currentSkin('close').addEventListener(MouseEvent.CLICK,function(event)
            {
                event.stopPropagation();
                if( this.hasEventListener( PopupEvent.CLOSE ) || !this.dispatchEvent( new PopupEvent( PopupEvent.CLOSE ) ) )
                   return;
                this.hidden();

            },false,0,this);
        }

        Breeze.rootEvent().addEventListener(BreezeEvent.RESIZE,function(event){
            setPositionAndSize.call(this);
        },true,0,this);

        setPositionAndSize.call(this);
        return this;
    }

    /**
     * 获取模态框的默认皮肤
     * @returns {SkinObject}
     * @protected
     */
    Popup.prototype.defaultSkinObject=function()
    {
        return new SkinObject( this.type() === Popup.NORM ? '{part head+body}' : '', {
            head: '<div>{part label+close}</div>',
            label: '<label>Title</label>',
            close: '<span>关闭</span>',
            body:  '<div></div>'
        },{
            head:{ 'style':{'width':'100%','height':'30px','lineHeight':'30px','display':'block','backgroundColor':'#3a3a3a','color':'#d6d6db','fontSize':'14px'}  },
            label:{ 'style':{'width':'auto','display':'block','float':'left','margin':'0px 10px'} },
            close:{ 'style':{'width':'auto','height':'25px','padding':"0px",'margin':'0px','cursor':'pointer','float':'right','margin':'0px 10px'} },
            body:{ 'style':{'padding':'10px','width':'100%','height':'auto','display':'block','overflow':'auto','backgroundColor':'#ffffff'} }
        });
    }

    /**
     * 设置获取标题头的高度
     * @param number value
     * @returns {number|Modality}
     * @public
     */
    Popup.prototype.headHeight=function( value )
    {
        var headSkin =  this.skinGroup().getSkin('head');
        if( typeof value === "number" )
        {
            if( headSkin )this.skinGroup().current( headSkin ).height( value );
            this.current(null);
            return this;
        }
        var val =  headSkin ? this.skinGroup().current( headSkin ).height() : 0;
        this.current(null);
        return val;
    }

    /**
     * 设置获取模态窗口的类型,默认标准
     * @param string type [norm,simple,typical]
     * @returns {Popup|string}
     * @public
     */
    Popup.prototype.type=function()
    {
        return  this.__type__;
    }

    /**
     * 设置获取模态窗口的水平位置,默认中间
     * @param string align [center,left,right]
     * @returns {Popup|string}
     * @public
     */
    Popup.prototype.__horizontal__=Popup.HCENTER;
    Popup.prototype.horizontal=function( align )
    {
        if( typeof align !== "undefined" )
        {
            if( Popup['H'+align.toUpperCase()] )
                __horizontal__=align;
            return this;
        }
        return this.__horizontal__;
    }

    /**
     * 设置获取模态窗口的垂直位置,默认中间
     * @param string align [middle,top,bottom]
     * @returns {Popup|string}
     * @public
     */
    Popup.prototype.__vertical__=Popup.VMIDDLE;
    Popup.prototype.vertical=function( align )
    {
        if( typeof align !== "undefined" )
        {
            if( Popup['V'+align.toUpperCase()] )
                this.__vertical__=align;
            return this;
        }
        return this.__vertical__;
    }

    /**
     * 隐藏此弹框
     * @returns {Popup}
     * @public
     */
    Popup.prototype.hidden=function()
    {
        this.current(null).display(false);
        return this;
    }

    /**
     * @private
     */
    Popup.prototype.__currentPopup__=null;

    /**
     * 显示弹框
     * @param string type 弹框类型norm | simple
     * @returns {Popup}
     * @public
     */
    Popup.prototype.show=function( content, label )
    {
        if( this.__currentPopup__ !==null )
            this.__currentPopup__.hidden();
        this.__currentPopup__= this;

        var zIndex = 999;
        var skinGroup = this.skinGroup();
        label = label || '提示信息';
        content = content || '';
        if( skinGroup.getSkin('label') )
        {
            skinGroup.currentSkin('label').text( label );
        }

        var body = skinGroup.getSkin('body') || skinGroup.getSkin('container');
        skinGroup.current( body ).html( content );
        skinGroup.current(null).style({'zIndex':zIndex,'position':'absolute'}).display(true);
        return this;
    }

    /**
     * 模态框事件
     * @param src
     * @param props
     * @constructor
     */
    function PopupEvent(type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    PopupEvent.prototype=new BreezeEvent();
    PopupEvent.prototype.constructor=PopupEvent;

    //模态框关闭时调度
    PopupEvent.CLOSE='PopupClose';

    window.Popup=Popup;
    window.PopupEvent=PopupEvent;

})( window )