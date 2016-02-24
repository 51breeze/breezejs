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

        var resize = function()
        {

            skinGroup.current(null);
            var position = skinGroup.position()
            var left = position.left;
            var top  = position.top;
            var width =  skinGroup.width();
            var height =  skinGroup.height();

            skinGroup.currentSkin('group');
            if( !skinGroup.display() )
              return;

            skinGroup.width( width );
            skinGroup.position(left, top + height + 3 );

            var windowWidth = Utils.getSize(window,'width');
            var windowHeight = Utils.getSize(window,'height');
            var inputHeight =  skinGroup.getSkinGroup('group > input').height();
            var maxHeight = windowHeight - ( top + height + 3 + inputHeight + 5 );
            skinGroup.currentSkin('list').style('maxHeight',maxHeight);
            skinGroup.current(null);
        }

        Breeze.rootEvent().addEventListener(BreezeEvent.RESIZE,resize);

        //点击显示下拉列表
        EventDispatcher( skinGroup.getSkin('button') ).addEventListener(MouseEvent.CLICK,function(event){
            skinGroup.currentSkin('group').display(true);
            resize();
            event.stopPropagation();
        });

        //搜索框
        if( this.searchable() )
        {
            Breeze('input', skinGroup.getSkin('group') ).property('placeholder', this.placeholder() ).display(true)
            .addEventListener(PropertyEvent.CHANGE,function(event){
                if( event.property==='value')
                {
                    var selector = event.newValue && event.newValue !='' ? ":contains('" + event.newValue + "')" : null;
                    skinGroup.getSkinGroup('list > *').forEach(function(){
                        this.display( selector ? this.has( selector ) : true );
                    });
                }
            });
        }

        //点击下拉列表外隐藏列表
        EventDispatcher( skinGroup.getSkin('group') ).addEventListener( MouseEvent.MOUSE_OUTSIDE , function(event){

            if( !Utils.contains( skinGroup[0],  event.target ) )
               Utils.style(event.currentTarget,'display','none');
        });
    }

    /**
     * 根据事件的Ctrl或者Shift键来获取选择的索引是追加还是删除
     * @param viewIndex
     * @param selectedIndexs
     * @param event
     * @returns {*}
     */
    function getSelectedIndexByViewIndex(viewIndex, event )
    {
        viewIndex = parseInt( viewIndex );
        if( isNaN( viewIndex ) || viewIndex < 0 )throw new Error('invalid viewIndex');
        var selectedIndexs = this.__selectedIndex__;
        var key = DataArray.prototype.indexOf.call(selectedIndexs,viewIndex);
        if( event.ctrlKey )
        {
            selectedIndexs=selectedIndexs.slice(0);

            //存在，减去
            if( event.shiftKey )
            {
                if( key >=0  )
                {
                    selectedIndexs.splice(key,1);
                    return selectedIndexs;
                }
            }
            //不存在，添加
            else if( key < 0 )
            {
                if( this.multiple() || selectedIndexs.length < 1 )
                {
                    selectedIndexs.push(viewIndex);
                    return selectedIndexs;
                }
                return viewIndex;
            }
            return this.__selectedIndex__;
        }
        return viewIndex;
    }

    /**
     * @private
     * @param selectedIndex
     */
    function commitSelectedIndex( selectedIndex )
    {
        var event = new SelectionEvent(SelectionEvent.CHANGE);
        var selectedItems = indexToItems( this.dataRender().dataSource() , selectedIndex );
        event.selectedIndex = this.multiple() ? selectedIndex : selectedIndex[0];
        event.selectedItem = this.multiple() ? selectedItems : selectedItems[0];
        if( !this.hasEventListener(SelectionEvent.CHANGE) || this.dispatchEvent(event) )
        {
            this.skinGroup().getSkinGroup('list > *').forEach(function (elem, index)
            {
                this.removeClass('active');
                if ( DataArray.prototype.indexOf.call(selectedIndex, index) >= 0 )
                {
                    this.addClass('active');
                }
            });
            this.bindable().commitProperty( this.labelProfile() , selectedItems );
        }
    }

    /**
     * 根据索引获取数据源项
     * @private
     * @param dataSource
     * @param index
     * @returns {Array}
     */
    function indexToItems( dataSource, index )
    {
        var result = [];
        if( index instanceof Array )
        {
            for (var i = 0; i < index.length; i++)
            {
                if ( dataSource[index[i]] )
                result.push(dataSource[index[i]]);
            }

        }else if( dataSource[index] )
        {
            result.push( dataSource[index] )
        }
        return result;
    }


    /**
     * 下拉选择框组件
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
    SkinComponent.prototype.initializeMethod=['labelProfile','valueProfile','defaultLabel','selectedIndex','searchable','multiple','placeholder','dataSource','display'];

    /**
     * @private
     */
    Selection.prototype.__labelProfile__='label';

    /**
     * @private
     */
    Selection.prototype.__valueProfile__='id';

    /**
     * @private
     */
    Selection.prototype.__dataRender__=null;

    /**
     * 数据项数据显示字段
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
     * 数据项数据值字段
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
     * 获取数据渲染器
     * @returns {DataRender}
     */
    Selection.prototype.dataRender=function()
    {
        if( this.__dataRender__ === null )
        {
            var self = this;
            this.__dataRender__= new DataRender().addEventListener(TemplateEvent.REFRESH,function(){

                //下拉列表选项
                var list = self.skinGroup().getSkinGroup('list > *', true);
                list.hasEventListener(MouseEvent.CLICK) ||  list.addEventListener(MouseEvent.CLICK,function(event)
                {
                    if( !this.has('[disabled]') )
                    {
                        self.selectedIndex( getSelectedIndexByViewIndex.call(self, this.getElementIndex( event.currentTarget ) , event ) );
                    }
                    if (!event.ctrlKey)
                        self.skinGroup().currentSkin('group').display(false);
                });

                //如果是一个完整皮肤，则把皮肤列表中的项转换成项数据。
                if( self.skinGroup().validateSkin() )
                {
                    var dataSource = self.dataRender().dataSource();
                    var labelProfile = self.labelProfile();
                    var valueProfile = self.valueProfile();
                    var dataItems = []
                    list.forEach(function()
                    {
                        if (!this.hasProperty( valueProfile ))
                            throw new Error('miss value property is list option skin');
                        var item = {};
                        item[labelProfile] = this.text();
                        item[valueProfile] = this.property( valueProfile );
                        dataItems.push( item );
                    });
                    dataSource.source( dataItems );
                }
            });
            this.__dataRender__.dataSource().addEventListener(DataSourceEvent.CHANGED,this.display,false,0,this);
        }
        return this.__dataRender__;
    }

    /**
     * 获取设置数据源
     * @public
     * @returns {DataRender}
     */
    Selection.prototype.dataSource=function( source )
    {
        if( typeof source !== "undefined" )
        {
            this.dataRender().source( source );
            return this;
        }
        return this.dataRender().source();
    }

    /**
     * @private
     */
    Selection.prototype.__bindable__=null;

    /**
     * 数据绑定器
     * @returns {Bindable}
     */
    Selection.prototype.bindable=function()
    {
        if( this.__bindable__ === null )
        {
            var labelProfile =  this.labelProfile();
            var defaultLabel = this.defaultLabel();
            this.__bindable__ = new Bindable().bind(this.skinGroup().getSkinAndValidate('label') , labelProfile ,function (property, item)
            {
                var label=[];
                if( item instanceof Array && item.length > 0 )
                {
                    for(var i=0; i<item.length; i++)label.push( item[i][labelProfile] );
                }else
                {
                    label.push( typeof item ==="string" ? item : defaultLabel );
                }
                typeof this.innerText === "string" ? this.innerText = label.join(',') : this.textContent = label.join(',')
            });
        }
        return this.__bindable__;
    }

    /**
     * @private
     */
    Selection.prototype.__defaultLabel__='请选择';

    /**
     * 默认标签
     * @public
     * @param label
     * @returns {*}
     */
    Selection.prototype.defaultLabel=function( label )
    {
        if( typeof label === "string" ) {
            this.__defaultLabel__ = label;
            return this;
        }
        return this.__defaultLabel__;
    }

    /**
     * @private
     */
    Selection.prototype.__selectedIndex__= [];

    /**
     * @param viod index 当前需要选择的索引值，可以是一个数字或者是字符串。多个可以传一个数组或者以','隔开。
     * @returns {Array|Selection}
     * @public
     */
    Selection.prototype.selectedIndex=function( index )
    {
        if( typeof index === "undefined" )
        {
            return this.multiple() ? this.__selectedIndex__.slice(0) : this.__selectedIndex__[0] || NaN;
        }

        if( !(index instanceof Array) )
        {
            index=String( index ).split(',');
        }

        var has= this.__selectedIndex__.length !== index.length;
        if(!has)for( var i in index )if( DataArray.prototype.indexOf.call( this.__selectedIndex__, index[i] ) < 0 )
        {
           has=true;
           break;
        }
        if( has )
        {
            this.__selectedIndex__ = index;
            if (this.__display__) {
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

    /**
     * @private
     */
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

        bindEvent.call(this);
        if( skinGroup.validateSkin() )
        {
            dataRender.dispatchEvent( new TemplateEvent( TemplateEvent.REFRESH ) );

        }else
        {
            dataRender.viewport( skinGroup.getSkin('list') );
            var list = skinGroup.skinObject().get('part.option');
            if( !list )throw new Error('not found view for option');
            dataRender.display( list );
        }
        commitSelectedIndex.call(this, this.__selectedIndex__ );
        return true;
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
        var skinObject=new SkinObject('{part button+group}',{
            button:'<button type="button" class="btn btn-default">{part label+caret}</button>',
            label: '<span class="text-overflow" style="float: left; width: 96%"></span>',
            caret:'<span class="pull-right"><i class="caretdown"></i><span>',
            option: '<?foreach('+dataProfile+' as key item){ ?><li '+valueProfile+'="{item["'+valueProfile+'"]}" data-index="{key}">{item["'+labelProfile+'"]}</li><?}?>',
            list:'<ul class="list-state"></ul>',
            group:'<div class="group"><input class="searchbox" style="display: none" />{part list}</div>'
        },{
            'container':{'class':'selection text-unselect'}
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
