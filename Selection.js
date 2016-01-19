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
     * 下拉选择框
     * @param selector
     * @param context
     * @returns {*}
     * @constructor
     */
    function Selection( selector , context )
    {
        if( !(this instanceof Selection) )
            return new Selection( selector , context);
        return SkinComponent.call(this,  selector , context );
    }

    Selection.prototype=new SkinComponent();
    Selection.prototype.constructor=Selection;
    SkinComponent.prototype.componentProfile='selection';
    SkinComponent.prototype.initializeMethod=[];

    /**
     * @private
     */
    Selection.prototype.__labelProfile__='label';

    /**
     * @param profile
     * @returns {*}
     */
    Selection.prototype.labelProfile=function( profile )
    {
        if( typeof profile === "string" )
        {
            this.__labelProfile__ = profile;
            return this;
        }
        return this.__labelProfile__;
    }

    /**
     * @private
     */
    Selection.prototype.__valueProfile__='id';

    /**
     * @param profile
     * @returns {*}
     */
    Selection.prototype.valueProfile=function( profile )
    {
        if( typeof profile === "string" )
        {
            this.__valueProfile__ = profile
            return this;
        }
        return this.__valueProfile__;
    }


    function bindEvent()
    {
        var skinGroup = this.skinGroup();
        var position = skinGroup.position()
        var left = position.left;
        var top  = position.top;
        var width =  skinGroup.width();
        var height =  skinGroup.height();
        var self  = this;

        EventDispatcher( skinGroup.getSkin('label') ).addEventListener(MouseEvent.CLICK,function(event){

            skinGroup.currentSkin('group')
            skinGroup.width( width );
            skinGroup.position(left, top + height)
            skinGroup.display(true);
            skinGroup.current(null);
            event.stopPropagation();

        });

        EventDispatcher( skinGroup.getSkin('group') ).addEventListener([MouseEvent.MOUSE_OVER,MouseEvent.MOUSE_OUT,MouseEvent.CLICK],function(event)
        {
            var current =  Utils.property( event.target, 'current');
            if( event.type === MouseEvent.MOUSE_OVER )
            {
                if( !current )Utils.style( event.target,'backgroundColor', '#ccc');

            }else if(event.type === MouseEvent.MOUSE_OUT)
            {
                if( !current )Utils.style( event.target,'background', 'none');

            }else
            {
                var index = Utils.property( event.target, 'data-index');
                self.selectedIndex( index );
                skinGroup.currentSkin('group').display(false);
                skinGroup.current(null);
            }
            event.stopPropagation();
        });

        EventDispatcher(document).addEventListener(MouseEvent.CLICK,function(event)
        {
            skinGroup.currentSkin('group');
            if(skinGroup.display() && (event.pageX < skinGroup.left() || event.pageY < skinGroup.top() ||
                event.pageX > skinGroup.left() + skinGroup.width() ||  event.pageY > skinGroup.top()+skinGroup.height()) )
            {
                skinGroup.display(false);
            }
            skinGroup.current(null);
        });
    }

    /**
     * @private
     */
    Selection.prototype.__dataRender__=null;

    /**
     * @param source
     * @param options
     * @returns {DataRender}
     */
    Selection.prototype.dataRender=function()
    {
        if( this.__dataRender__ === null )
        {
            var self = this;
            var dr = new DataRender();
            this.__dataRender__ = dr;

            dr.dataSource().addEventListener(DataSourceEvent.CHANGED,function(event)
            {
                self.display();

            },false,0,this);

            dr.addEventListener(TemplateEvent.REFRESH,function(event){
                bindEvent.call(this);
            },false,0,this);
        }
        return this.__dataRender__;
    }


    /**
     * @private
     * @param index
     */
    function commitSelectedIndex( index )
    {
        var skinGroup = this.skinGroup();
        var labelProfile =  this.labelProfile();
        if( this.__label__ === null && skinGroup.getSkin('label') )
        {
            this.__label__ = new Bindable( labelProfile );
            var profile = this.labelProfile();
            this.__label__.bind( skinGroup.getSkin('label'), labelProfile , function (property, item) {
                this.innerText = item[ profile ];
            });
        }
        if( this.__label__ )
        {
            var dataSource = this.dataRender().dataSource();
            if( typeof dataSource[index] === "undefined"  )
              throw new Error('invalid index');

            var skinObject = skinGroup.skinObject();
            skinGroup.find('[current]').property('current',null).style('background','none').revert()
                .current('[data-index='+index+']').property('current',true).style( skinObject.get('attr.current.style') )

            this.__label__.property(labelProfile , dataSource[index]);
            var event = new SelectionEvent(SelectionEvent.CHANGE);
            event.selectedIndex = index;
            event.selectedItem = dataSource[index];
            this.dispatchEvent(event);
        }
    }

    /**
     * @private
     */
    Selection.prototype.__index__=0;
    Selection.prototype.__label__=null;

    /**
     * @param value
     * @returns {*}
     */
    Selection.prototype.selectedIndex=function( index )
    {
        if( typeof index === "undefined" )
           return this.__index__;
        index=parseInt( index );
        if( isNaN(index) )
            throw new Error('invalid index');
        if( this.__index__ !== index  )
        {
            this.__index__ = index;
            commitSelectedIndex.call(this, index  );
        }
        return this;
    }

    /**
     * @returns {Selection}
     */
    Selection.prototype.display=function()
    {
        var dataRender = this.dataRender();
        var skinGroup= this.skinGroup();
        var skinObject = skinGroup.skinObject();

        if( skinObject.attached )
        {
            bindEvent.call(this);

        }else if( !dataRender.viewport() )
        {
            dataRender.viewport( skinGroup.getSkin('group') );
            var list = skinGroup.skinObject().get('part.list');
            if( list ) {
                dataRender.display( list );
            }
        }
        commitSelectedIndex.call(this, this.selectedIndex() );
        return this;
    }

    /**
     * @protected
     * @param skinGroup
     */
    Selection.prototype.skinInstalled=function( skinGroup )
    {
        if( !skinGroup.verification() )
        {
            skinGroup.skinObject( this.defaultSkinObject() );
        }
        skinGroup.createSkin();
        SkinComponent.prototype.skinInstalled.call(this,skinGroup);
    }

    /**
     * 获取默认皮肤
     * @returns {SkinObject}
     * @protected
     */
    Selection.prototype.defaultSkinObject=function()
    {
        var dataProfile= this.dataRender().dataProfile();
        var labelProfile =  this.labelProfile();
        var valueProfile = this.valueProfile();
        var skinObject=new SkinObject('<div>{part label+group}</div>',{
            input: '<input/>',
            label: '<div></div>',
            list: '<ul><?foreach('+dataProfile+' as key item){ ?><li {attr li} value="{item["'+valueProfile+'"]}">{item["'+labelProfile+'"]}</li><?}?></ul>',
            group: '<div></div>',
            searchbox:'<div><span>{part input}</span>{part group}</div>'
        },{
            searchbox:{'style':{'width':'100%',height:'300px'}},
            current:{'style':{'backgroundColor':'#9a9a9a'}},
            label:{ 'style':{'width':'100%',lineHeight:'35px','display':'block',cursor:'pointer'} },
            li:{ 'style':{'width':'100%',height:'25px',padding:"0px",margin:'0px',cursor:'pointer'},'data-index':'{key}'},
            list:{'style':'width:100%; height:auto;padding: 0px;list-style-type:none;-webkit-margin-before:0px;-webkit-margin-after:0px; text-indent: 0px;'},
            group:{ 'style':{display:'none',width:'100%',height:'auto',zIndex:999,position:'absolute',backgroundColor:'#ffffff',border:'solid #333333 1px',padding:'0px'}},
            container:{ 'style':{'width':'100%',height:'35px',border:'solid #999 1px','display':'block',backgroundColor:'#ffff00'},tabindex:"-1" }
        });
        return skinObject;
    }

    function SelectionEvent( type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    SelectionEvent.prototype=new BreezeEvent();
    SelectionEvent.prototype.constructor=SelectionEvent;
    SelectionEvent.prototype.selectedIndex=NaN;
    SelectionEvent.prototype.selectedItem=null;
    SelectionEvent.CHANGE='selectionChanged';

    window.SelectionEvent=SelectionEvent;
    window.Selection=Selection;

})( window )
