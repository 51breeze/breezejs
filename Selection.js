/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{
    function Selection(skinGroup)
    {
        if( !(this instanceof Selection) )
            return new Selection(skinGroup);
        SkinComponent.call(this, skinGroup );
    }

    Selection.prototype=new SkinComponent();
    Selection.prototype.constructor=Selection;

    /**
     * @private
     */
    Selection.prototype.__lableProfile__='lable';

    /**
     * @param profile
     * @returns {*}
     */
    Selection.prototype.lableProfile=function( profile )
    {
        if( typeof profile === "string" )
        {
            this.__lableProfile__ = profile;
            return this;
        }
        return this.__lableProfile__;
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
            dr.addEventListener(DataSourceEvent.SELECT,function(event){

                var index = this.selectedIndex();
                if( typeof index === "function" )
                    index=index.call(this);
                var item = event.data[index] || event.data[0];
                this.dataRender().template().variable('current', item['name'] || item );

            },false,200,this);

            dr.template().addEventListener(TemplateEvent.REFRESH,function(event){

                var skinGroup = this.skinGroup();
                var position = skinGroup.position()
                var left = position.left;
                var top  = position.top;
                var width =  skinGroup.width();
                var height =  skinGroup.height();

                EventDispatcher( skinGroup.getSkin('label') ).addEventListener(MouseEvent.CLICK,function(event){

                    skinGroup.currentSkin('group')
                    skinGroup.width( width );
                    skinGroup.position(left, top + height)
                    skinGroup.display(true);

                    if( !skinGroup.hasEventListener( MouseEvent.CLICK ) )
                    {
                        skinGroup.addEventListener([MouseEvent.MOUSE_OVER,MouseEvent.MOUSE_OUT,MouseEvent.CLICK],function(event){

                            this.current( event.target );
                            if( event.type === MouseEvent.MOUSE_OVER )
                            {
                                this.style('backgroundColor', '#ccc');

                            }else if(event.type === MouseEvent.MOUSE_OUT)
                            {
                                this.style('background', 'none');
                            }else
                            {
                                var index = this.property('data-index');
                                self.selectedIndex( index );
                                skinGroup.currentSkin('group')
                                skinGroup.display(false);
                            }
                            skinGroup.current(null);
                            event.stopPropagation();
                        })
                    }
                    skinGroup.current(null);
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

            },false,0,this);
        }
        return this.__dataRender__;
    }


    /**
     * @param source
     * @param options
     * @returns {Selection}
     */
    Selection.prototype.source=function(source,options)
    {
        if( typeof source === "undefined" )
            return this.dataRender().source();

        if( !this.hasEventListener(DataSourceEvent.SELECT) || !DataSource.prototype.source.call(this) )
        {
            this.addEventListener(DataSourceEvent.SELECT,function(event){
                if( this.__view__ ) {
                    this.template().variable(this.dataProfile(), event.data).render( this.__view__ );
                }
            });
        }
        this.dataRender().source( source , options )
        return this;
    }

    function commitSelectedIndex( index )
    {
        if( this.__label__ === null && this.getSkin('label') )
        {
            this.__label__ = new Bindable('label');
            var profile = this.lableProfile();
            this.__label__.bind( this.getSkin('label'), 'label', function (property, item) {
                this.innerText = item[ profile ];
            });
        }
        if( this.__label__ )
        {
            var dataSource = this.dataRender();
            if( dataSource.length > 0 && dataSource[index] )
            {
                this.__label__.property('label', dataSource[index]);
                var event = new SelectionEvent(SelectionEvent.CHANGE);
                event.selectedIndex = index;
                event.selectedItem = dataSource[index];
                this.dispatchEvent(event);
            }
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
        var skinGroup = this.skinGroup();
        var index=-1;
        var self= this;
        if( skinGroup instanceof SkinGroup )
        {
            skinGroup.display(false);
            var viewport = index = skinGroup.getSkin('container');
            if( Utils.nodeName(viewport) === 'select' )
            {
                var dataSource=[];
                skinGroup.find('option').forEach(function(elem){
                    var item=Utils.mergeAttributes({}, elem );
                    item[ self.valueProfile() ]=  this.value();
                    item[ self.lableProfile() ]=  this.text();
                    dataSource.push( item );
                });
                this.source( dataSource );
                if( !this.__viewport__ )
                {
                    this.viewport(viewport.parentNode);
                }
                skinGroup=this.getDefaultSkin();
            }
        }

        if( SkinGroup.isSkinObject( skinGroup ) )
        {
            var viewport = this.viewport();
            var dataRender = this.dataRender();
            var tpl = dataRender.template();
            viewport.addChildAt( skinGroup.html.container , index );
            this.skinGroup( new SkinGroup(viewport) );
            tpl.viewport( this.getSkin('group') );
            dataRender.display( skinGroup.html.list );
        }
        commitSelectedIndex.call(this, this.selectedIndex() );
        return this;
    }

    /**
     * 获取默认皮肤
     * @returns {SkinGroup}
     * @protected
     */
    Selection.prototype.getDefaultSkin=function()
    {
        var dataProfile= this.dataRender().dataProfile();
        var labelProfile =  this.lableProfile();
        var valueProfile = this.valueProfile();
        var skinObject=SkinGroup.createSkinObject('<div>{html label+group}</div>',{
            input: '<input/>',
            label: '<div></div>',
            list: '<ul><?foreach('+dataProfile+' as key item){ ?><li {attr li} value="{item["'+valueProfile+'"]}">{item["'+labelProfile+'"]}</li><?}?></ul>',
            group: '<div></div>',
            searchbox:'<div><span>{html input}</span>{html group}</div>'
        },{
            searchbox:{'style':{'width':'100%',height:'300px'}},
            label:{ 'style':{'width':'100%',lineHeight:'35px','display':'block',cursor:'pointer'} },
            li:{ 'style':{'width':'100%',height:'25px',padding:"0px",margin:'0px',cursor:'pointer'},'data-index':'{key}'},
            list:{'style':'width:100%; height:auto;padding: 0px;list-style-type:none;-webkit-margin-before:0px;-webkit-margin-after:0px; text-indent: 0px;'},
            group:{ 'style':{display:'none',width:'100%',height:'auto',zIndex:999,position:'absolute',backgroundColor:'#ffffff',border:'solid #333333 1px',padding:'0px'}},
            container:{ 'style':{'width':'100%',height:'35px',border:'solid #999 1px','display':'block',backgroundColor:'#ffff00'},tabindex:"-1" }
        });
        SkinGroup.toString( skinObject );
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
