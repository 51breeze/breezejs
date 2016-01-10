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

        /**
         * @private
         */
        var _lableProfile='lable';

        /**
         * @param profile
         * @returns {*}
         */
        this.lableProfile=function( profile )
        {
            if( typeof profile === "string" )
            {
                _lableProfile = profile
                return this;
            }
            return _lableProfile;
        }

        /**
         * @private
         */
        var _valueProfile='id';

        /**
         * @param profile
         * @returns {*}
         */
        this.valueProfile=function( profile )
        {
            if( typeof profile === "string" )
            {
                _valueProfile = profile
                return this;
            }
            return _valueProfile;
        }


        /**
         * @private
         */
        var _dataRender=null;

        /**
         * @param source
         * @param options
         * @returns {*}
         */
        this.dataRender=function()
        {
            if( _dataRender === null )
            {
                _dataRender = new DataRender();
                var self = this;
                _dataRender.addEventListener(DataSourceEvent.FETCH,function(event){

                    var index = self.selectedIndex();
                    if( typeof index === "function" )
                        index=index.call(self);
                    var item = this[index] || this[0];
                    self.dataRender().template().variable('current', item['name'] || item );

                    console.log('====_dataRender===')

                },false,200);

                console.log('========9999999999=====')
                _dataRender.template().addEventListener(TemplateEvent.REFRESH,function(event){

                    var skinGroup = self.skinGroup();
                    var position = skinGroup.position()
                    var left = position.left;
                    var top  = position.top;
                    var width =  skinGroup.width();
                    var height =  skinGroup.height();

                    console.log('=============')

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

                })
            }

             console.log('++++++++++++++_dataRender++++++++++++')
            return _dataRender;
        }

        /**
         * @param source
         * @param options
         * @returns {Selection}
         */
        this.source=function(source,options)
        {
            if( typeof source === "undefined" )
                return this.dataRender().source();

            if( !this.hasEventListener(DataSourceEvent.FETCH) || !DataSource.prototype.source.call(this) )
            {
                this.addEventListener(DataSourceEvent.FETCH,function(event){
                    if( this.__view__ ) {
                        this.template().variable(this.dataProfile(), event.data).render( this.__view__ );
                    }
                });
            }
            this.dataRender().source( source , options )
            return this;
        }

        /**
         * @private
         */
        var _index=0;

        /**
         * @param value
         * @returns {*}
         */
        this.selectedIndex=function( index )
        {
            index=parseInt( index );
            if( !isNaN(index) )
            {
                if( _index !== index )
                {
                    _index = index;
                    var dataSource = this.dataSource();
                    if( dataSource.length > 0 && dataSource[ index ] )
                    {
                        var event = new SelectionEvent(SelectionEvent.CHANGE);
                        event.selectedIndex = index;
                        event.selectedItem = dataSource[ index ];
                        this.dispatchEvent( event );
                    }
                }
                return this;
            }
            return _index;
        }
    }

    Selection.prototype=new SkinComponent();
    Selection.prototype.constructor=Selection;

    /**
     * @returns {Selection}
     */
    Selection.prototype.display=function()
    {
        var skinGroup = this.skinGroup();
        var viewport, index=-1;
        if( skinGroup instanceof SkinGroup )
        {
            skinGroup.display(false);
            viewport = index = skinGroup.getSkin('container');
            if( Utils.nodeName(viewport) === 'select' )
            {
                var options=[]
                skinGroup.find('option').forEach(function(){

                    options.push({
                        'label': this.text(),
                        'value': this.value()
                    });
                })

                this.dataSource( options );
            }
            skinGroup=this.getDefaultSkin();
            viewport=Breeze( viewport.parentNode )

        }else
        {
            viewport = this.viewport();
        }

        index = this.selectedIndex();
        var dataSource = this.dataRender();



        var tpl = this.dataRender().template();
        var container = tpl.variable('current',dataSource[index].label).render(skinGroup.html.container, true );
        viewport.addChildAt(container , index );




        this.__skinGroup__=new SkinGroup( viewport.children() );
        this.viewport( Breeze('[skin=group]',viewport) );
        this.dataRender().display( skinGroup.html.list );
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
        var skinObject=SkinGroup.createSkinObject('<div>{html label+group}</div>',{
            input: '<input/>',
            label: '<div>{current}</div>',
            list: '<ul><?foreach('+dataProfile+' as key item){ ?><li {attr li}>{item["label"]}</li><?}?></ul>',
            group: '<div></div>',
            searchbox:'<div><span>{html input}</span>{html group}</div>'
        },{
            searchbox:{'style':{'width':'100%',height:'300px'}},
            label:{ 'style':{'width':'100%',lineHeight:'35px','display':'block',cursor:'pointer'} },
            li:{ 'style':{'width':'100%',height:'25px',padding:"0px",margin:'0px',cursor:'pointer'},'data-index':'{key}','value':'{item["value"]}'},
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
