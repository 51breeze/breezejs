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
     * 绑定组件的相关事件
     */
    function bindEvent()
    {
        var skinGroup = this.skinGroup();
        var position = skinGroup.position()
        var left = position.left;
        var top  = position.top;
        var width =  skinGroup.width();
        var height =  skinGroup.height();
        var self  = this;

        //点击显示下拉列表
        EventDispatcher( skinGroup.getSkin('label') ).addEventListener(MouseEvent.CLICK,function(event){

            var dowWidth = Utils.getSize(document,'width');
            var dowHeight = Utils.getSize(document,'height');

            skinGroup.currentSkin('group');
            skinGroup.width( width );
            skinGroup.position(left, top + height);
            skinGroup.display(true);
            event.stopPropagation();

        });

        //选择每项数据
        var childSkin=Breeze( skinGroup.getSkin('list') ).children();
        childSkin.addEventListener(MouseEvent.CLICK,function(event)
        {
            self.selectedIndex( getSelectedIndexByViewIndex( this.property('data-index'), self.selectedIndex(), event)  );
            if( !event.ctrlKey )
                skinGroup.currentSkin('group').display(false);
        });

        //搜索框
        if( this.searchable() )
        {
            Breeze( skinGroup.getSkin('group') ).children('input').property('placeholder', this.placeholder() ).display(true)
                .addEventListener(PropertyEvent.CHANGE,function(event){
                    if( event.property==='value')
                    {
                        var selector = event.newValue && event.newValue !='' ? ":contains('" + event.newValue + "')" : null;
                        childSkin.forEach(function(){
                            this.display( selector ? this.has( selector ) : true );
                        });
                    }
                });
        }

        //点击下拉列表外隐藏列表
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
     * 根据事件的Ctrl或者Shift键来获取选择的索引是追加还是删除
     * @param viewIndex
     * @param selectedIndexs
     * @param event
     * @returns {*}
     */
    function getSelectedIndexByViewIndex(viewIndex, selectedIndexs, event )
    {
        viewIndex = parseInt( viewIndex );
        if( isNaN( viewIndex ) )throw new Error('invalid viewIndex');
        if( event.ctrlKey )
        {
            var key = DataArray.prototype.indexOf.call(selectedIndexs,viewIndex);
            if( event.shiftKey )
            {
                if( key >= 0 && selectedIndexs.length > 1 )
                {
                    selectedIndexs.splice(key,1);
                    selectedIndexs = selectedIndexs.slice(0);
                }

            }else if( key < 0 )
            {
                selectedIndexs.push( viewIndex );
                selectedIndexs = selectedIndexs.slice(0);
            }
            return selectedIndexs;
        }
        return viewIndex;
    }


    /**
     * @private
     * @param index
     */
    function commitSelectedIndex( index )
    {
        var skinGroup = this.skinGroup();
        var labelSkin = skinGroup.getSkin('label');
        if( labelSkin  )
        {
            var labelProfile =  this.labelProfile();
            this.bindable().bind(labelSkin , labelProfile ,function (property, item)
            {
                var label=[];
                for(var i=0; i<item.length; i++)
                    label.push( item[i][labelProfile] );
                var elem = Utils.sizzle('label',this)[0];
                if( elem ) {
                    typeof elem.innerText === "string" ? elem.innerText = label.join(',') : elem.textContent = label.join(',')
                }
            });
        }

        var dataSource = this.dataRender().dataSource();
        var selectedItems = indexToItems(dataSource, index );

        Breeze('.active', skinGroup.getSkin('list') ).removeClass('active');
        Breeze( skinGroup.getSkin('list') ).children().forEach(function(){

            var value = this.property('data-index');
            if( DataArray.prototype.indexOf.call(index,value) >=0  )
            {
                this.addClass('active');
            }
        });

        this.bindable().commitProperty(labelProfile , selectedItems );

        var event = new SelectionEvent(SelectionEvent.CHANGE);
        event.selectedIndex = index;
        event.selectedItem = selectedItems;
        this.dispatchEvent(event);
    }

    /**
     * 根据索引获取数据源项
     * @param dataSource
     * @param index
     * @returns {Array}
     */
    function indexToItems( dataSource, index )
    {
        var result = [];
        for (var i = 0; i < index.length; i++)
        {
            if (!dataSource[ index[i] ] )
                throw new Error('invalid index');
            result.push( dataSource[ index[i] ] );
        }
        return result;
    }


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
     * 数据绑定器
     * @returns {Bindable}
     */
    Selection.prototype.bindable=function()
    {
        if( this.__bindable__ === null )
        {
            this.__bindable__ = new Bindable( this.labelProfile() );
        }
        return this.__bindable__;
    }

    /**
     * @private
     */
    Selection.prototype.__bindable__=null;

    /**
     * @private
     */
    Selection.prototype.__index__=[0];

    /**
     * @param viod index 当前需要选择的索引值，可以是一个数字或者是字符串。多个可以传一个数组或者以','隔开。
     * @returns {Array|Selection}
     * @public
     */
    Selection.prototype.selectedIndex=function( index )
    {
        if( typeof index === "undefined" )
           return this.__index__;

        if( !(index instanceof Array) )
        {
            index=String( index ).split(',');
        }
        if( this.__index__ !==index  )
        {
            this.__index__ = index;
            if( this.__display__ ) {
                commitSelectedIndex.call(this, index);
            }
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

    Selection.prototype.__display__=false;

    /**
     * @returns {boolean}
     * @public
     */
    Selection.prototype.display=function()
    {
        if( this.__display__===true )
           return true;
        this.__display__=true;
        var dataRender = this.dataRender();
        var skinGroup= this.skinGroup();

        if( skinGroup.validateSkin() )
        {
            bindEvent.call(this);

        }else
        {
            dataRender.viewport( skinGroup.getSkin('list') );
            var list = skinGroup.skinObject().get('part.items');
            if( !list )throw new Error('not found view of items');
            dataRender.display( list );
        }
        commitSelectedIndex.call(this, this.selectedIndex() );
        return true;
    }

    /**
     * @protected
     * @param skinGroup
     */
    Selection.prototype.skinInstalled=function( skinGroup )
    {
        if( !skinGroup.validateSkin() )
        {
            skinGroup.skinObject( this.defaultSkinObject() );
            skinGroup.createSkin();
        }
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
        var skinObject=new SkinObject('{part label+group}',{
            label: '<button class="btn btn-default" type="button" tabindex="-1"><label></label><span class="caret"></span></button>',
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
