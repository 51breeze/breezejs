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
     * @private
     * @param object
     * @param option
     */
    function setting(object,option)
    {
        if( Utils.isObject(option) )
        {
            for( var prop in option ) if( typeof object[prop] === "function" )
            {
                object[prop]( option[prop] );
            }
        }
    }

    /**
     * @private
     * @type {{Popup}}
     */
    var popupInstance={};


    /**
     * 弹框组件
     * @param type
     * @returns {*}
     * @constructor
     */
    function Popup( type )
    {
        type = type || Popup.NORM;
        if( !!popupInstance[ type ] )
           return popupInstance[ type ];

        if( !(this instanceof Popup) )
            return new Popup( type );

        this.__type__ = type;
        this.__horizontal__=Popup.HCENTER;
        this.__vertical__=Popup.VMIDDLE;
        this.__title__='提示信息';
        this.__anchor__=null;
        this.__callback__=null;
        popupInstance[ type ]=this;
        return SkinComponent.call(this, new SkinGroup('<div class="popup" />','body') );
    }

    //弹出风格
    Popup.NORM='norm';
    Popup.SIMPLE='simple';
    Popup.TYPICAL='typical';

    //水平垂直对齐常量
    Popup.HLEFT='left';
    Popup.HCENTER='center';
    Popup.HRIGHT='right';
    Popup.VTOP='top';
    Popup.VMIDDLE='middle';
    Popup.VBOTTOM='bottom';

    //提示框
    Popup.info=function( message , option )
    {
        return Popup( Popup.SIMPLE ).show( message , option);
    }

    //警告框
    Popup.alert=function( message , option )
    {
        return  Popup( Popup.NORM ).show( message , option);
    }

    //确认框
    Popup.confirm=function( message , option )
    {
        if( typeof option === "function" )
            option={callback:option};
        option =  Utils.extend({width:400,autoHidden:false}, option || {});
        return  Popup( Popup.TYPICAL ).show( message , option);
    }

    Popup.prototype=  new SkinComponent();
    Popup.prototype.constructor=Popup;
    Popup.prototype.__type__=Popup.NORM;
    Popup.prototype.__vertical__=Popup.VMIDDLE;
    Popup.prototype.__horizontal__=Popup.HCENTER;
    Popup.prototype.componentProfile='popup';
    Popup.prototype.initializeMethod=[];

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

        if( containerHeight < 1 || containerWidth < 1 )
           return this;

        var halign=this.horizontal()
            ,valign=this.vertical()
            ,h=halign==='center' ? 0.5 : halign==='right' ? 1 : 0
            ,v=valign==='middle' ? 0.5 : valign==='bottom' ? 1 : 0
            ,xOffset, yOffset;

        var width = Utils.getSize(window,'width');
        var height = Utils.getSize(window,'height');


       var anchor = this.anchor();
       if( anchor )
       {
           Utils.position( anchor );
       }

        xOffset = Math.floor( (width-containerWidth) * h );
        yOffset = Math.floor( (height-containerHeight) * v);
        skin.position(xOffset,  yOffset);
        return this;
    }

    /**
     * @private
     */
    Popup.prototype.__anchor__=null;

    /**
     * 指定锚点目标对象
     * @param HTMLEment
     * @returns {Popup}
     */
    Popup.prototype.anchor=function( target )
    {
        if( Utils.isNodeElement(target) )
        {
            this.__anchor__ = target;
            return this;
        }
        return this.__anchor__;
    }

    /**
     * @private
     */
    Popup.prototype.__callback__=null;

    /**
     * 点击取消或者确认按扭后的回调函数
     * @param function callback
     * @returns {Popup|function}
     */
    Popup.prototype.callback=function( callback )
    {
        if( typeof callback === "function" )
        {
            this.__callback__ = callback;
            return this;
        }
        return this.__callback__;
    }

    /**
     * 设置提示框是否自动隐藏
     * @param flag
     * @returns {Popup}
     */
    Popup.prototype.autoHidden=function( flag )
    {
        this.skinGroup().current(null);
        if( !!flag === false )
        {
            this.skinGroup().removeEventListener(MouseEvent.MOUSE_OUTSIDE);

        }else if( !this.skinGroup().hasEventListener(MouseEvent.MOUSE_OUTSIDE) )
        {
            this.skinGroup().addEventListener(MouseEvent.MOUSE_OUTSIDE,function(event){
                this.hidden();
            },true,0,this);
        }
        return this;
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
    Popup.prototype.type=function( type )
    {
        if( typeof type === "string" )
        {
            type in Popup && (this.__type__ = type);
            return this;
        }
        return this.__type__;
    }

    /**
     * 设置获取模态窗口的水平位置,默认中间
     * @param string align [center,left,right]
     * @returns {Popup|string}
     * @public
     */
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
     * @private
     */
    Popup.prototype.__title__='提示信息';

    /**
     * 隐藏此弹框
     * @returns {Popup}
     * @public
     */
    Popup.prototype.title=function( title )
    {
        if( typeof title !== "undefined" )
        {
            this.__title__=title;
            return this;
        }
        return this.__title__;
    }

    /**
     * @private
     */
    var __mask__=null;

    /**
     * 庶罩层
     * @returns {*}
     */
    Popup.prototype.mask=function()
    {
        if( __mask__ === null )
        {
            __mask__ = Breeze('<div name="mask" />', 'body').style('cssText',"background-color:#000000;opacity:0;width:100%;height:100%;position:fixed;z-index:998;top:0px;left:0px;display:none;" );
            var callback = function(event){this.height( Utils.getSize(window,'height'));}
            Breeze.rootEvent().addEventListener(BreezeEvent.RESIZE,callback,true,0,__mask__);
            callback.call(__mask__);
            var skinGroup =  this.skinGroup()
            __mask__.addEventListener( MouseEvent.MOUSE_DOWN,function(event){

                var tl=  new Timeline( skinGroup[0] )
                tl.timingFunction('Elastic.easeInOut');

                tl.enable(false)
                tl.reverse(true)
                tl.strict(true)
                tl.fps(60)

                var size = 300;
                var duration =1;
                var pos =  Utils.position(skinGroup[0]);

                console.log( 150 % 150 )

                var frame = new KeyFrame( 50 );
                  frame.motions( new Motions(skinGroup[0])
                      .set('left', pos.left, pos.left+size )
                  )
                  tl.addKeyFrame( frame );

                  var frame1 = new KeyFrame( 50 );
                  frame1.motions( new Motions(skinGroup[0])
                      .set('left', pos.left+size , pos.left )
                  )
                  tl.addKeyFrame( frame1 );


                var frame2 = new KeyFrame( 50 );
                frame2.motions( new Motions(skinGroup[0])
                      .set('top', pos.top, pos.top+200  )
                  )
                tl.addKeyFrame( frame2 );

              // console.log( tl.calculateDuration() )

                tl.play();

              //  console.log( tl.getKeyFrame() )





                var interval = 20;
                var runtime = 500;
                var counter  = 1;
                var lentime = 1000;
                var len = 50;



               // console.log(   ( lentime - runtime ) / ( len - counter )  )


            })
        }
        return __mask__;
    }

    /**
     * @type {null}
     */
    var showing = {};

    /**
     * 隐藏此弹框
     * @returns {Popup}
     * @public
     */
    Popup.prototype.hidden=function()
    {
        showing[ this.type() ] = false;
        this.mask().display(false);
        this.current(null).display(false);
        return this;
    }

    /**
     * 显示弹框
     * @param string type 弹框类型norm | simple
     * @returns {Popup}
     * @public
     */
    Popup.prototype.show=function( content, option )
    {
        var type =  this.type();
        if( showing[ type ] )
           return this;

        showing[ type ] = true;
        content = content || '';

        option =  Utils.extend({autoHidden:true,zIndex:999}, option || {});
        option.zIndex = parseInt( option.zIndex ) || 999;
        setting(this, option);

        var skinGroup = this.skinGroup();
        if( skinGroup.getSkin('label') )
            skinGroup.currentSkin('label').text( this.title() );
        var body = skinGroup.getSkin('body') || skinGroup.getSkin('container');
        skinGroup.current( body ).html( content );
        skinGroup.current( null ).style('zIndex',option.zIndex).display(true);

        this.mask().display(true).style('zIndex', option.zIndex-1 );
        setPositionAndSize.call(this);
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

        skinGroup.current(null).addEventListener(PropertyEvent.CHANGE,function(event) {
            if( event.property==='width' || event.property==='height' )setPositionAndSize.call(this);
        },false,0,this);

        if( skinGroup.getSkin('close') )
        {
            skinGroup.currentSkin('close').addEventListener(MouseEvent.CLICK,function(event)
            {
                if( this.hasEventListener( PopupEvent.CLOSE ) || !this.dispatchEvent( new PopupEvent( PopupEvent.CLOSE ) ) )
                    return;
                this.hidden();

            },false,0,this);
            skinGroup.current(null);
        }

        if( skinGroup.getSkin('footer') )
        {
            skinGroup.getSkinGroup('footer > button').addEventListener(MouseEvent.CLICK,function(event)
            {
                var name =  Utils.property(event.currentTarget ,  SkinGroup.NAME ) || '';
                var type  = name.toUpperCase();
                if( this.hasEventListener( PopupEvent[type] ) && !this.dispatchEvent( new PopupEvent( PopupEvent[type]  ) ) )
                    return;
                var callback =  this.callback();
                if( callback && callback( PopupEvent.SUBMIT === PopupEvent[type] ) === false )
                    return;
                this.hidden();

            },false,0,this);
        }

        Breeze.rootEvent().addEventListener(BreezeEvent.RESIZE,function(event){
            setPositionAndSize.call(this);
        },true,0,this);
        return this;
    }


    /**
     * 获取模态框的默认皮肤
     * @returns {SkinObject}
     * @protected
     */
    Popup.prototype.defaultSkinObject=function()
    {
        var theme = {}
        theme[ Popup.NORM ] = '{part head+body}';
        theme[ Popup.TYPICAL ] = '{part head+body+footer}';
        return new SkinObject( theme[this.type()] || '' ,{
            head: '<div>{part label+close}</div>',
            label: '<label>Title</label>',
            close: '<span>关闭</span>',
            body:  '<div></div>',
            cancel:'<button {attr button} class="btn btn-default">取消</button>',
            submit:'<button {attr button} class="btn btn-default">确定</button>',
            footer:'<div><div style="width: auto; height:inherit;float: right;">{part cancel+submit}</div></div>',
            body:  '<div></div>'
        },{
            container:{"style":"boxShadow:0px 0px 8px 0px rgba(0,0,0,.4);borderRadius:3px;zIndex:999;position:fixed;width:auto;height:auto;display:none;border:solid #b3b3b3 1px;backgroundColor:#ffffff"},
            head:{'style':"width:100%;height:35px;lineHeight:35px;display:block;color:#333333;borderBottom:solid 1px #cccccc" },
            label:{ 'style':"width:auto;display:block;float:left;margin:0px 10px" },
            close:{ 'style':"width:auto;height:25px;padding:0px;margin:0px;cursor:pointer;float:right;margin:0px 10px" },
            body:{ 'style':"padding:10px;width:100%;height:auto;display:block;overflow:auto;backgroundColor:#ffffff" },
            button:{ 'style':{ width:'auto',height:'25px',lineHeight:'25px',padding:"0px 10px", margin:'3px',display:'inline-block'} },
            footer:{ 'style':{'width':'100%',height:'auto','display':'block','borderTop':'solid 1px #cccccc',padding:'0px'}}
        });
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

    //取消事件触发时调度
    PopupEvent.CANCEL='popupCancel';
    //模态框关闭时调度
    PopupEvent.CLOSE='popupClose';
    //提交事件触发时调度
    PopupEvent.SUBMIT='popupSubmit';

    window.Popup=Popup;
    window.PopupEvent=PopupEvent;

})( window )