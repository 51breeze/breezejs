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

        Breeze( skinGroup.getSkin('list') ).children().addEventListener(MouseEvent.CLICK,function(event)
        {
            var index = this.property('data-index');
            self.selectedIndex( index );
            skinGroup.currentSkin('group').display(false).current(null);
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

    function getSelectedItems(dataSource, selectedIndex)
    {
          var result = [];
          for(var index=0; index < selectedIndex.length; index++)
          {
              if( typeof dataSource[ selectedIndex[index] ] === "undefined" )
                 throw new Error('invalid index');
              result[ selectedIndex[index] ]= dataSource[ selectedIndex[index] ];
          }
          return result;
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
            var selectedItems = getSelectedItems(dataSource, index );
            var labelname=[];
            Breeze('.active', skinGroup.getSkin('list') ).removeClass().forEach(function(){

                var index = this.property('data-index');
                if( selectedItems[index] )
                {
                    this.addClass('active');
                    labelname.push( selectedItems[index][labelProfile] );
                }
            });

            this.__label__.property(labelProfile , labelname.join(',') );
            var event = new SelectionEvent(SelectionEvent.CHANGE);
            event.selectedIndex = index;
            event.selectedItem = selectedItems;
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
     * @public
     */
    Selection.prototype.selectedIndex=function( index )
    {
        if( typeof index === "undefined" )
           return this.__index__;

        index = index instanceof Array ? index : [index];
        if( this.__index__ !== index.join(',')  )
        {
            this.__index__ = index;
            commitSelectedIndex.call(this, index  );
        }
        return this;
    }

    /**
     * @private
     */
    Selection.prototype.__searchable__=false;

    /**
     * @param boolean searchable
     * @public
     */
    Selection.prototype.searchable=function( searchable )
    {
        if( typeof searchable === "undefined" )
          return this.__searchable__;
        this.__searchable__ = !!searchable;
        return this;
    }


    /**
     * @private
     */
    Selection.prototype.__multiple__=false;

    /**
     * @param boolean multiple
     * @public
     */
    Selection.prototype.multiple=function( multiple )
    {
        if( typeof multiple === "undefined" )
          return this.__multiple__;
        this.__multiple__ = !!multiple;
        return this;
    }

    /**
     * @private
     */
    Selection.prototype.__placeholder__='请输入要搜索的内容';

    /**
     * @param boolean searchable
     * @public
     */
    Selection.prototype.placeholder=function( msg )
    {
        if( typeof msg === "undefined" )
            return this.__placeholder__;
        this.__placeholder__ = msg || this.__placeholder__;
        return this;
    }

    /**
     * @returns {Selection}
     * @public
     */
    Selection.prototype.display=function()
    {
        var dataRender = this.dataRender();
        var skinGroup= this.skinGroup();
        var skinObject = skinGroup.skinObject();

        if( skinObject.isElement )
        {
            bindEvent.call(this);

        }else if( !dataRender.viewport() )
        {
            dataRender.viewport( skinGroup.getSkin('list') );
            var children=null;
            if( this.searchable() )
            {
                Breeze(skinGroup.getSkin('group')).children('input').property('placeholder', this.placeholder() ).display(true)
                .addEventListener(PropertyEvent.CHANGE,function(event){
                    if( event.property==='value')
                    {
                        children!== null || ( children = Breeze( dataRender.viewport() ).children() );
                        var selector = event.newValue && event.newValue !='' ? ":contains('" + event.newValue + "')" : null;
                        children.forEach(function(){
                            this.display( selector ? this.has( selector ) : true );
                        });
                    }
                });
            }

            if( this.multiple() )
            {
               var down = false;
               var selectIndex=[];
               Breeze( skinGroup.getSkin('list') ).addEventListener([MouseEvent.MOUSE_DOWN,MouseEvent.MOUSE_UP,MouseEvent.MOUSE_MOVE],function(event){

                     if( event.type === MouseEvent.MOUSE_DOWN)
                     {
                         down = true;

                     }else if(event.type === MouseEvent.MOUSE_UP)
                     {
                         down= false;
                     }
                     if( down && event.type === MouseEvent.MOUSE_MOVE )
                     {
                         var index = this.property('data-index');
                         console.log( event.target )
                     }
                });
            }

            var list = skinGroup.skinObject().get('part.items');
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
        var skinObject=new SkinObject('<div class="selection text-unselect">{part label+group}</div>',{
            label: '<div class="label" tabindex="-1"></div>',
            items: '<?foreach('+dataProfile+' as key item){ ?><li value="{item["'+valueProfile+'"]}" data-index="{key}">{item["'+labelProfile+'"]}</li><?}?>',
            list: '<ul class="list-state"></ul>',
            group: '<div class="group"><input class="searchbox" style="display: none" />{part list}</div>'
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
