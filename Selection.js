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

        if( typeof skinGroup !== "undefined" && !(skinGroup instanceof SkinGroup) )
        {
            skinGroup=new SkinGroup( skinGroup )
        }

        if( skinGroup instanceof SkinGroup )
        {
            var continer = skinGroup.getSkin('container') || {};
            this.viewport( continer.parentNode )
        }
        Component.call(this, skinGroup );

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
                _dataRender.dataProfile('dataGroup');
                var self = this;
                _dataRender.dataSource().addEventListener(DataSourceEvent.FETCH,function(event){

                    var index = self.selectedIndex();
                    if( typeof index === "function" )
                        index=index.call(self);
                    var item = this[index] || this[0];
                    self.dataRender().template().variable('current', item['name'] || item );

                },false,200);

                _dataRender.template().addEventListener(TemplateEvent.REFRESH,function(event){

                    var skinGroup =  event.viewport;
                    if( !(skinGroup instanceof SkinGroup) )
                    {
                        self.__skinGroup__= new SkinGroup( skinGroup.children()[0] );
                        skinGroup.reverse();
                        skinGroup=self.skinGroup();
                    }

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

                })
            }
            return _dataRender;
        }

        /**
         * @param source
         * @param options
         * @returns {Selection}
         */
        this.dataSource=function(source,options)
        {
            if( typeof source === "undefined" )
                return  this.dataRender().dataSource();
            this.dataRender().dataSource( source , options )
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
            if( typeof index === "number" )
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

    Selection.prototype=new Component();
    Selection.prototype.constructor=Selection;

    /**
     * @returns {Selection}
     */
    Selection.prototype.display=function()
    {
        this.skinGroup();
        return this;
    }

    /**
     * @param viewport
     * @returns {*}
     */
    Selection.prototype.viewport=function( viewport )
    {
        if( typeof viewport === "undefined" )
            return this.dataRender().viewport();
        this.dataRender().viewport( viewport );
        return this;
    }

    /**
     * 皮肤安装完成
     * @param skinGroup
     * @returns {Modality}
     * @protected
     */
    Selection.prototype.skinInstalled=function( skinGroup )
    {
        var template=skinGroup;
        if( skinGroup instanceof SkinGroup )
        {
           var container = skinGroup.getSkin('container');
           if( Utils.nodeName(container) === 'noscript' )
           {
               template = container.content();
               if( !this.viewport() )
               {
                   this.viewport( container.parentNode );
               }

           }else
           {
               template=null;
               this.viewport( skinGroup );
           }
        }

        //如果是一个html皮肤
        if( typeof template === "string" )
        {
           this.dataRender().display( template );
        }
        //是一个dom元素皮肤
        else
        {
            var event = new TemplateEvent(TemplateEvent.REFRESH);
            event.viewport= this.viewport();
            //this.dataRender().template().dispatchEvent( event );
        }
        return this;
    }

    /**
     * 获取默认皮肤
     * @returns {SkinGroup}
     * @protected
     */
    Selection.prototype.getDefaultSkin=function()
    {
        var defaultSkin={
            'elements':{
                input: '<input/>',
                label: '<div>{current}</div>',
                list: '<ul style="width:100%; height:auto;padding: 0px;list-style-type:none;-webkit-margin-before:0px;-webkit-margin-after:0px; text-indent: 0px;"><?foreach(dataGroup as index item){ ?><li {attributes li}>{item["name"]}</li><?}?></ul>',
                container:'<div>{elements label+group}</div>',
                group: '<div>{elements list}</div>',
                searchbox:'<div><span>{elements input}</span>{elements group}</div>'
            },
            'attributes':{
                searchbox:{'style':{'width':'100%',height:'300px'}},
                label:{ 'style':{'width':'100%',lineHeight:'35px','display':'block',cursor:'pointer'} },
                li:{ 'style':{'width':'100%',height:'25px',padding:"0px",margin:'0px',cursor:'pointer'},'data-index':'{index}'},
                group:{ 'style':{display:'none',width:'100%',height:'auto',zIndex:999,position:'absolute',backgroundColor:'#ffffff',border:'solid #333333 1px',padding:'0px'}},
                container:{ 'style':{'width':'100%',height:'35px',border:'solid #999 1px','display':'block',backgroundColor:'#ffff00'},tabindex:"-1" }
            }
        };
        return SkinGroup.toString( defaultSkin.elements.container , defaultSkin);
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
