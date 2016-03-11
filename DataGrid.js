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

    function mergeOption(target,column,option)
    {
        var opt={}
        if( typeof column === 'string' )
        {
            if( Utils.isFunction(option) )
            {
                opt.column=column;
                opt.callback=option;

            }else if( Utils.isObject(option) )
            {
                opt=option;
            }

        }else if( Utils.isObject(column) )
        {
            opt=column;
        }
        return Utils.extend( target, opt  );
    }

    var tagReg = /<?(\w+)(\s+[^>])\/?>?/;
    var tagAttr=function( tag )
    {
        var match =  tag.match( tagReg );
        return '<'+match[1]+match[2]+'>{value}</'+match[1]+'>';
    }


    /**
     * 编译一个显示列名行的模板
     * @param columns
     * @param thead
     * @param tbody
     * @returns {DataGrid}
     */
    function makeTemplate(columns, options,plus )
    {
        var thead = options.thead;
        var tbody = options.tbody;
        var wrap  = options.wrap;
        var attr = {
           'thead' :{'style':{'border':'solid 1px '+ options.themeColor, 'backgroundColor':options.themeColor} },
           'tbody' :{'style':{'border':'solid 1px '+ options.themeColor } }
        };
        options.attr = Utils.extend(true, attr, options.attr );
        options.attr.thead.style = Utils.serialize( options.attr.thead.style ,'style' );
        options.attr.tbody.style = Utils.serialize( options.attr.tbody.style ,'style' );

        thead=thead.replace(/<(.*?)>/, "<\$1 "+Utils.serialize( options.attr.thead ,'attr' )+">" );
        tbody=tbody.replace(/<(.*?)>/, "<\$1 "+Utils.serialize( options.attr.tbody ,'attr' )+">" );

        if( Utils.isObject(columns,true) )
        {
            options.thead='';
            options.tbody='';

            for( var i in  columns )
            {
                var field = columns[i];
                i = i.replace(/\s+/,'');

                var tb=tbody,th=thead;
                if( plus['tbody'].template[ i ] )
                {
                    tb = tbody.replace('{value}', plus['tbody'].template[ i ].join('\r\n') );
                }

                if( plus['thead'] && plus['thead'].template[ i ] )
                {
                    th = thead.replace('{value}', plus['thead'].template[ i ].join('\r\n') );
                }

                var w= options.columnWidth[i] || options.columnWidth['*'] || 'auto';
                th=th.replace(/<(.*?)>/, "<\$1 width='"+ w +"' height='"+(options.headHeight || 35)+"'>" );
                tb=tb.replace(/<(.*?)>/, "<\$1 width='"+ w +"' height='"+(options.rowHeight || 30)+"'>" );

                options.thead += th.replace(/\{column\}/g, i).replace(/\{value\}/g, field );
                options.tbody += tb.replace(/\{column\}/g, i).replace(/\{value\}/g, '{item.'+ i +'}');
            }
        }

        options.thead = wrap.replace('{value}', options.thead);
        options.tbody = '<? foreach(data as key item){ ?>' + wrap.replace('{value}',options.tbody)+'<? } ?>';
        return options;
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
        if( arguments.length > 0 )
        {
            category = category || 'tbody';
            option = mergeOption(defualt, column, option || {});
            option.template = option.template.replace(/(\<\s*(\w+))/ig, function (a, b, c) {

                var attr = [];
                var tag = c.toLowerCase();
                if (option.bindable) {
                    attr.push('data-bind="{column}"');
                }
                if (tag === 'input') {
                    attr.push('value="{value}" name="{column}"');

                } else if (tag === 'select' || tag === 'textarea') {
                    attr.push('name="{column}"');
                }
                return b + ( category === 'tbody' ? ' data-index="{key}" ' : ' data-column="{column}"' ) + ' data-action="' + action + '" ' + attr.join(' ');
            });
            var data = this.__plus__[category] || ( this.__plus__[category] = {'template': {}, 'option': {}} );
            if (!data.template[column]) {
                data.template[column] = [];
            }
            data.template[column].push(option.template);
            data.option[action] = option;
            return this;
        }
        return this.__plus__;
    }

    /**
     * @private
     */
    DataGrid.prototype.__options__={
        'thead':'<th>{value}</th>',
        'tbody':'<td>{value}</td>',
        'tfoot':'<div>{value}</div>',
        'wrap' :'<tr>{value}</tr>',
        'themeColor':'#cccccc',
        'attr':{
            thead:{align:'center'},
            tbody:{align:'center'}
        },
        'headHeight':35,
        'rowHeight' :30,
        columnWidth:{}
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
            var e = ['tbody','thead','wrap','tfoot'];
            for(var i in e )  if( typeof options[ e[i] ] !== "undefined" )
            {
               options[ e[i] ]=tagAttr( options[ e[i] ] );
            }
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
        this.plus('remove',column,{
            'template':'<a style="cursor:pointer;">删除</a>',
            'callback':null,
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
        this.plus('orderBy',column,{
            'template':'<span style="cursor:default;display:block;">{value}</span>',
            'callback':function(breeze,event){
                var column = breeze.property('data-column');
                this.__orderType__[column] === 'asc' ? this.__orderType__[column]='desc' : this.__orderType__[column]='asc';
                this.dataRender().dataSource().orderBy(column,  this.__orderType__[column] );
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
            'editable':true,
            'bindable':false
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
     * @param data
     * @param option
     * @returns {DataGrid}
     */
    DataGrid.prototype.dataSource=function( source , option )
    {
        if( typeof source === "undefined" )
            return  this.dataRender().dataSource();
        this.dataRender().dataSource().source( source , option);
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
            var skin = makeTemplate( this.columns(), this.options(), this.plus() );
            skinGroup.currentSkin('thead').html( skin.thead );
            skinGroup.current( null );
            dataRender.viewport( skinGroup.getSkin('tbody') );
            dataRender.display( skin.tbody );
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
            viewport="<div class='pagination'></div>";
            context = this.skinGroup().current(null);
        }
        this.dataRender().pagination( viewport , context );
        return this;
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
            var plus_data = this.__plus__;
            this.__dataRender__.addEventListener(TemplateEvent.REFRESH, function (event)
            {

                Breeze('[data-action]', this).forEach(function () {

                    var action = this.property('data-action');
                    for(var i in plus_data )
                    {
                        var item = plus_data[ i ];
                        if ( item.option[action] )
                        {
                            var option = item.option[action];
                            if (option.style)this.style(option.style);

                            if( !this.hasEventListener(option.eventType) )
                                this.addEventListener(option.eventType, function (event)
                                {
                                    if (typeof option.callback === 'function')
                                    {
                                        option.callback.call(self,this, event );
                                    }
                                })
                        }
                    }

                    if( this.hasEventListener(DataGridEvent.PLUS_INITIALIZED) )
                    {
                        this.dispatchEvent( DataGridEvent.PLUS_INITIALIZED );
                    }
                })
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
        var skinObject=new SkinObject('<table>{part thead+tbody}</table>',{
            'thead':'<thead></thead>',
            'tbody':'<tbody></tbody>'
        },{
            'container':{style:"borderCollapse:collapse;",cellspacing:'0',cellpadding:'0',border:0}
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
