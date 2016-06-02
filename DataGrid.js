/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{
    "use strict";

    /**
     * 编译一个显示列名行的模板
     * @param columns
     * @param thead
     * @param tbody
     * @returns {DataGrid}
     */
    function makeTemplate(columns, options, plus )
    {
        var thead = options.th;
        var tbody = options.td;
        var wrap  = options.wrap;
        var skin= {head:'',body:'',foot:''};

        if( Utils.isObject(columns,true) )
        {
            var isset=false;
            for( var i in  columns )
            {
                var field = columns[i];
                i = i.replace(/\s+/,'');

                var td=tbody,th=thead;
                if( plus['tbody'].template[ i ] )
                {
                    td = tbody.replace('{value}', plus['tbody'].template[ i ].join('\r\n') );
                }

                if( plus['thead'] && plus['thead'].template[ i ] )
                {
                    th = thead.replace('{value}', plus['thead'].template[ i ].join('\r\n') );
                }

                var w= options.columnWidth[i] || options.columnWidth['*'] || 'auto';
                var rowAlign= options.tbodyAlign[i] || options.tbodyAlign['*'] || 'center';
                var headAlign= options.theadAlign[i] || options.theadAlign['*'] || 'center';

                if( !isset )
                {
                    isset= true;
                    th=th.replace(/<(.*?)>/, "<\$1 height='"+(options.headHeight || 35)+"'>" );
                    td=td.replace(/<(.*?)>/, "<\$1 height='"+(options.rowHeight || 30)+"'>" );
                }

                th=th.replace(/<(.*?)>/, "<\$1 align='"+headAlign+"' width='"+ w +"'>" );
                td=td.replace(/<(.*?)>/, "<\$1 align='"+rowAlign+"'>" );

                skin.head += th.replace(/\{column\}/g, i).replace(/\{value\}/g, field );
                skin.foot += td.replace(/\{column\}/g, i).replace(/\{value\}/g, field );
                skin.body += td.replace(/\{column\}/g, i).replace(/\{value\}/g, '{item.'+ i +'}');
            }
        }
        skin.head = wrap.replace('{value}', skin.head);
        skin.foot = wrap.replace('{value}', skin.foot);
        skin.body = '<? foreach(data as key item){ ?>' + wrap.replace('{value}',skin.body)+'<? } ?>';
        return skin;
    }

    /**
     *
     * @param selector
     * @param context
     * @returns {*}
     * @constructor
     */
    function DataGrid( selector , context )
    {
        if( !(this instanceof DataGrid) )
            return new DataGrid( selector , context);
        return SkinComponent.call(this,  selector , context );
    }

    DataGrid.prototype=new SkinComponent();
    DataGrid.prototype.constructor=DataGrid;
    DataGrid.prototype.componentProfile='dataGrid';
    DataGrid.prototype.initializeMethod=['headHeight','rowHeight','columns','dataProfile','dataSource','pagination','display'];

    /**
     * @private
     */
    DataGrid.prototype.__plus__={};

    /**
     * 设置一些指定的功能插件
     * @param string action 功能名称
     * @param string column 在指定列名中
     * @param object defualt 默认数据
     * @param object option 配置选项
     * @param string category 指定分类
     * @returns {*}
     */
    DataGrid.prototype.plus=function(action,column,defualt,option,category)
    {
        if( arguments.length > 0 && typeof column === "string" )
        {
            category = category || 'tbody';
            option = Utils.extend(defualt,option || {});
            if( typeof option.template !== "string" )
               throw new Error('invalid html template.')

            option.template = option.template.replace(/(\<\s*(\w+))/ig, function (a, b, c) {

                var attr = ['data-action="'+ action +'"','data-column="{column}"'];
                var tag = c.toLowerCase();
                if( category === 'tbody' )
                {
                    attr.push('data-index="{forIndex}"');
                }
                if (option.bindable)
                {
                    attr.push('data-bind="{column}"');
                }

                if (tag === 'input') {
                    attr.push('value="{value}"');
                } else if (tag === 'fetch' || tag === 'textarea') {
                    attr.push('name="{column}"');
                }
                return b +" "+attr.join(' ');
            });

            var data = this.__plus__[category] || ( this.__plus__[category] = {'template': {}, 'option': {}} );
            data.template[column] || ( data.template[column] = []);
            data.template[column].push(option.template);
            data.option[action] || (data.option[action]={});
            data.option[action][column] = option;
            return this;
        }
        return this.__plus__;
    }

    /**
     * @private
     */
    DataGrid.prototype.__options__={
        'headHeight':35,
        'rowHeight' :30,
        'theadAlign':{'*':'center'},
        'tbodyAlign':{'*':'center'},
        'columnWidth':{}
    };

    /**
     * 设置获取配置选项
     * @param options
     * @returns {*}
     */
    DataGrid.prototype.options=function( options )
    {
        if( typeof options !== "undefined")
        {
            this.__options__ = Utils.extend(true, this.__options__, options );
            return this;
        }
        return this.__options__;
    }


    /**
     * @param column
     * @param width
     * @returns {*}
     */
    DataGrid.prototype.columnWidth=function(column,width)
    {
        var options =  this.options();
        if(typeof width !== "undefined" )
        {
            options.columnWidth[column]=width;
            return this;
        }else if( typeof column === "string" )
        {
            return options.columnWidth[column];
        }
        return options.columnWidth;
    }

    /**
     * @param height
     * @returns {*}
     */
    DataGrid.prototype.headHeight=function(height)
    {
        var options = this.options();
        if( typeof height !== "undefined" )
        {
            options.headHeight=height;
            return this;
        }
        return options.headHeight;
    }

    /**
     * @param height
     * @returns {*}
     */
    DataGrid.prototype.rowHeight=function(height)
    {
        var options = this.options();
        if( typeof height !== "undefined" )
        {
            options.rowHeight=height;
            return this;
        }
        return options.rowHeight;
    }

    /**
     * 在模板中添加需要编辑的操作
     * @param column
     * @param option
     */
    DataGrid.prototype.edit=function(column,option)
    {
        typeof option !== "function" || (option={'callback':option});
        this.plus('edit',column,{
            'template':'<a style="cursor:pointer;">编辑</a>',
            'callback':null,
            'eventType':MouseEvent.CLICK
        }, option );
        return this;
    }

    /**
     * 在模板中添加需要移除的操作
     * @param column
     * @param option
     */
    DataGrid.prototype.remove=function(column,option)
    {
        typeof option !== "function" || (option={'callback':option});
        var dataSource=this.dataRender().dataSource();
        this.plus('remove',column,{
            'template':'<a style="cursor:pointer;">删除</a>',
            'callback':function(event,option){
                 var index =dataSource.viewIndex( this.property('data-index') );
                 dataSource.remove('index('+index+')');
            },
            'eventType':MouseEvent.CLICK
        },option);
        return this;
    }

    /**
     * 在模板中添加需要插入数据的操作
     * @param column
     * @param option
     */
    DataGrid.prototype.add=function(column,option)
    {
        typeof option !== "function" || (option={'callback':option});
        var dataSource=this.dataRender().dataSource();
        this.plus('add',column,{
            'template':'<a style="cursor:pointer;">增加</a>',
            'callback':function(event,option){
                 var index =dataSource.viewIndex( this.property('data-index') );
                 var item = dataSource[index];
                 item = Utils.extend({},item);
                 dataSource.append( item, index+1);
            },
            'eventType':MouseEvent.CLICK
        },option);
        return this;
    }

    /**
     * @private
     */
    DataGrid.prototype.__columns__={};

    /**
     * 设置指定的列名
     * @param columns
     * @returns {DataGrid}
     */
    DataGrid.prototype.columns=function( columns )
    {
        if( typeof columns === 'undefined' )
        {
            return this.__columns__;
        }
        this.__columns__ = columns;
        if ( Utils.isString(columns) )
        {
            this.__columns__ = columns.split(',')
        }
        return this;
    }

    /**
     * @type {{}}
     */
    DataGrid.prototype.__orderType__={};

    /**
     * 排序
     * @param column
     * @param option
     * @returns {DataGrid}
     */
    DataGrid.prototype.orderBy=function(column,option)
    {
        var dataSource=this.dataRender().dataSource();
        var type = typeof option === "string" && option.toLowerCase()===DataArray.DESC  ? 'desc' : 'asc';
        dataSource.orderBy(column, type);
        this.plus('orderby',column,{
            'template':'<span style="cursor:default;display:block;">{value}</span>',
            'type':type,
            'callback':function(event,option)
            {
                option['type'] = option['type'] === DataArray.ASC ? DataArray.DESC : DataArray.ASC;
                dataSource.orderBy(column,  option['type'] , true);
            },
            'eventType':MouseEvent.CLICK
        },option,'thead');
        return this;
    }

    /**
     * 设置指定列中需要设置的组件
     * @param column
     * @param option
     * @returns {DataGrid}
     */
    DataGrid.prototype.component=function(column,option)
    {
        this.plus('component',column,{
            'eventType':[MouseEvent.CLICK],
            'template':'<input />',
            'dataGroup':[],
            'property':{},
            'callback':null,
            'editable':true
        }, option );
        return this;
    }


    /**
     * 设置指定的列可以编辑
     * @param column
     * @param option
     * @returns {DataGrid}
     */
    DataGrid.prototype.editableByColumn=function(column,option)
    {
        var source= this.dataSource();
        this.plus('editable',column,{
            'eventType':[MouseEvent.DBLCLICK],
            'template':'<span>{value}</span>',
            'callback':function(event,option){

                var index =source.viewIndex( this.property('data-index') );
                var item = source[index];
                if( item )
                {
                    Popup.info('<input style="width: 100%;" value="'+item[column]+'" />',
                    {
                        'anchor':event.currentTarget.parentNode,
                        'vertical':'top',
                        'callback':function(flag){
                            var value =  this.skinGroup().current('input').value();
                            var d={};
                            d[column] = value;
                            source.alter(d,'index('+index+')');
                        },
                        'minHeight':38
                    });
                }
            }
        }, option );
        return this;
    }


    /**
     * 数据属性
     * @param data
     * @returns {DataGrid}
     */
    DataGrid.prototype.dataProfile=function( profile )
    {
        if( typeof profile === "string" )
        {
            this.dataRender().dataProfile(profile);
            return this;
        }
        return this.dataRender().dataProfile();
    }

    /**
     * 获取设置数据源对象
     * @param url|Array source
     * @returns {DataGrid}
     */
    DataGrid.prototype.dataSource=function( source )
    {
        if( typeof source === "undefined" )
            return  this.dataRender().dataSource();
        this.dataRender().dataSource().source( source );
        return this;
    }

    /**
     * 渲染显示组件
     * @returns {DataGrid}
     */
    DataGrid.prototype.display=function()
    {
        var skinGroup = this.skinGroup();
        var dataRender = this.dataRender();
        if( skinGroup.validateSkin() )
        {
            dataRender.dispatchEvent( new TemplateEvent( TemplateEvent.REFRESH ) );

        }else
        {
            var options = Utils.extend(skinGroup.skinObject().skins, this.options() );
            var skin = makeTemplate( this.columns(), options , this.plus() );
            skinGroup.currentSkin('thead').html( skin.head );
            var columnName =  Utils.toKeys(  this.columns() );
            skinGroup.children().children().forEach(function(elem,index){
                 var name = columnName[index];
                 this.style('textAlign',  options.theadAlign[name] || options.theadAlign['*'] );
            }).revert(2);

            skinGroup.current( null );
            dataRender.viewport( skinGroup.getSkin('tbody') );
            dataRender.display( skin.body );
        }

        var pt= dataRender.pagination();
        if( pt )
        {
            var opt = pt.options();
            if( !opt['wheelTarget'] )
            {
                opt['wheelTarget'] = [
                    skinGroup[0],
                    pt.skinGroup()[0]
                ];
            }
        }
        return this;
    }

    /**
     * @param selector|NodeElement viewport
     * @param selector|NodeElement context
     * @returns {boolean|DataGrid}
     */
    DataGrid.prototype.pagination=function( viewport , context)
    {
        if( typeof viewport === "undefined" )
            return this.dataRender().pagination();
        if( viewport === true )
        {
            viewport="<div></div>";
            context = this.skinGroup().getSkinAndValidate('container').parentNode;
        }
        this.dataRender().pagination( viewport , context );
        return this;
    }

    /**
     * @type {null}
     * @private
     */
    DataGrid.prototype.__resizeEnable__=false;

    /**
     * 允许调整行高和列宽
     * @param enable
     * @returns {*}
     */
    DataGrid.prototype.resizeEnable=function( enable )
    {
        if( typeof enable !== "undefined"  )
        {
            this.__resizeEnable__ = !!enable;
            return this;
        }
        return this.__resizeEnable__;
    }

    var resize = function()
    {
        var htarget = Element('thead > tr > th',this);
        var vtarget = Element('thead > tr > th:nth-child(1),tbody > tr > td:nth-child(1)',this);
        Element('td,th',this).addEventListener(MouseEvent.MOUSE_DOWN,function(event){

            var rect = this.getBoundingRect();
            var space = 2;
            var h = (rect.left+space > event.pageX && rect.left-space < event.pageX) || (rect.right+space > event.pageX && rect.right-space < event.pageX)
            var v = (rect.top+space > event.pageY && rect.top-space < event.pageY) || (rect.bottom+space > event.pageY && rect.bottom-space < event.pageY)

            if( h || v )
            {
                var downEvent=event;
                var index = -1
                if( h )
                {
                    this.current( event.currentTarget.parentNode );
                    index = this.getChildIndex( event.currentTarget );

                }else if( v )
                {
                    index = vtarget.getElementIndex( event.currentTarget.parentNode.firstChild );
                }

                var last = 0;
                var resize = function(event)
                {
                    var val=0;
                    if( h )
                    {
                        htarget.index( index );
                        val =  downEvent.pageX - event.pageX;
                        if( rect.left+space > downEvent.pageX && index > 0 )
                        {
                            htarget.style('width', '+='+(val-last) );
                            htarget.index(index-1).style('width', '-='+(val-last) );

                        }else if( rect.left-space < downEvent.pageX && index < htarget.length )
                        {
                            htarget.style('width', '-='+(val-last) );
                            htarget.index(index+1).style('width', '+='+(val-last) )

                        }

                    }else if( v )
                    {
                        vtarget.index( index );
                        val =  downEvent.pageY - event.pageY;
                        if( rect.top+space > downEvent.pageY && index > 0 )
                        {
                            vtarget.style('height', '+='+(val-last) );
                            vtarget.index(index-1).style('height', '-='+(val-last) );

                        }else if( rect.top-space < downEvent.pageY && index < vtarget.length )
                        {
                            vtarget.style('height', '-='+(val-last) );
                            vtarget.index(index+1).style('height', '+='+(val-last) )
                        }
                    }
                    last= val;
                }

                Utils.rootEvent()
                    .addEventListener(MouseEvent.MOUSE_MOVE,resize)
                    .addEventListener(MouseEvent.MOUSE_UP,function(event){
                        this.removeEventListener(MouseEvent.MOUSE_MOVE,resize);
                    });
            }
        })
    }

    /**
     * @type {null}
     * @private
     */
    DataGrid.prototype.__dataRender__=null;

    /**
     * 获取数据渲染项
     * @returns {DataRender}
     */
    DataGrid.prototype.dataRender=function()
    {
        if( this.__dataRender__===null )
        {
            this.__dataRender__=new DataRender();
            var plus = this.__plus__;
            var self = this;

            this.__dataRender__.addEventListener(TemplateEvent.REFRESH, function (event)
            {
                Element('[data-action]', this.viewport() ).forEach(function (){

                    var action = this.property('data-action');
                    var column = this.property('data-column');
                    for(var i in plus )
                    {
                        var item = plus[ i ];
                        if ( item.option[action] && item.option[action][column])
                        {
                            var option = item.option[action][column];
                            if (option.style)this.style(option.style);
                            if( !this.hasEventListener(option.eventType) && typeof option.callback === 'function' )
                            {
                                this.addEventListener(option.eventType,function (event){
                                      option.callback.call(this, event, option);
                                });
                            }
                        }
                    }
                })

                if( this.hasEventListener(DataGridEvent.PLUS_INITIALIZED) )
                {
                    this.dispatchEvent( DataGridEvent.PLUS_INITIALIZED );
                }

                if( self.resizeEnable() )
                {
                    resize.call(this);
                }

            });
        }
        return this.__dataRender__;
    }

    /**
     * 获取默认皮肤
     * @returns {SkinObject}
     * @protected
     */
    DataGrid.prototype.defaultSkinObject=function()
    {
        var skinObject=new SkinObject('<table>{skins thead+tbody}</table>',{
            'thead':'<thead></thead>',
            'tbody':'<tbody></tbody>',
            'tfoot':'<tfoot></tfoot>',
            'th':'<th>{value}</th>',
            'td':'<td>{value}</td>',
            'wrap' :'<tr>{value}</tr>'
        },{
            'container':{'borderCollapse':'collapse','borderSpacing':'0','userSelect':'none'},
            'th,td':{'border':'solid 1px #999999','padding':'0px 2px'},
            'th':{'backgroundColor':'#cccccc','textAlign':'center'}
        },{
            'container':{border:0,cellpadding:0,cellspacing:0}
        },['thead','tbody']);
        return skinObject;
    }

    function DataGridEvent( src, props ){ BreezeEvent.call(this, src, props);}
    DataGridEvent.prototype=new BreezeEvent();
    DataGridEvent.prototype.constructor=DataGridEvent;
    DataGridEvent.PLUS_INITIALIZED='dataGridPlusInitialized';
    DataGridEvent.REFRESH='dataGridRefresh';

    window.DataGridEvent=DataGridEvent;
    window.DataGrid= DataGrid;

})( window )
