/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{
    function mergeOption(target,column,option)
    {
        var opt={}
        if( typeof column === 'string' )
        {
            if( Breeze.isFunction(option) )
            {
                opt.column=column;
                opt.callback=option;

            }else if( Breeze.isObject(option) )
            {
                opt=option;
            }

        }else if( Breeze.isObject(column) )
        {
            opt=column;
        }
        return Breeze.extend( target, opt  );
    }

    function DataGrid()
    {
        var theadTemplate='';
        var tbodyTemplate='';
        var thead="<th>{value}</th>";
        var tbody="<td>{value}</td>";
        var container="<tr>{value}</tr>";
        var template="<table style='width: 100%'>\r\n<thead>{theadTemplate}</thead>\r\n<tbody>{tbodyTemplate}</tbody>\r\n</table>";
        var columnItem={};
        var plus_data={
            'template':{},
            'option':{}
        }

        this.plus=function(action,column,defualt,option)
        {
            option = mergeOption(defualt,column,option || {} );
            option.template=option.template.replace(/(\<\s*(\w+))/ig,function(){

                var attr = [];
                var tag = RegExp.$2.toLowerCase();
                if( option.bindable )
                {
                    attr.push('data-bind="{column}"');
                }
                if( tag==='input' )
                {
                    attr.push('value="{value}" name="{column}"');

                }else if( tag==='select' || tag==='textarea' )
                {
                    attr.push('name="{column}"');
                }
                return RegExp.$1+' data-index="{key}" data-action="'+action+'" '+attr.join(' ');
            });

            if( !plus_data.template[ column ] )
            {
                plus_data.template[ column ]=[];
            }
            plus_data.template[ column ].push( option.template );
            plus_data.option[ action ]= option;
        }

        /**
         * 编译一个显示列名行的模板
         * @param columns
         * @param thead
         * @param tbody
         * @returns {DataGrid}
         */
        this.makeTemplate= function(columns,thead,tbody)
        {
            if( Breeze.isObject(columns,true) && ( theadTemplate==='' || tbodyTemplate==='' ) )
            {
                theadTemplate='';
                tbodyTemplate='';

                for( var i in  columns )
                {
                    var field = columns[i];
                    i = i.replace(/\s+/,'');

                    if( Breeze.isObject( field ) && ( item.icon || item.label ) )
                    {
                        field='<i class="'+( item.icon || '' )+'"></i>';
                        field+='<span>'+( item.label || '' )+'</span>';
                    }

                   var tb=tbody;
                   if( plus_data.template[ i ] )
                   {
                       tb = tbody.replace('{value}', plus_data.template[ i ].join('\r\n') );
                   }

                   tb = tb.replace('{value}', '{item.'+ i.replace(/\s+/,'')+'}' );
                   tbodyTemplate += tb.replace(/\{column\}/g, i );
                   theadTemplate += thead.replace('{value}', field ).replace(/\{column\}/g, i );
                }

                theadTemplate = container.replace('{value}', theadTemplate );
                tbodyTemplate = container.replace('{value}', tbodyTemplate );
                tbodyTemplate = tbodyTemplate.replace(/(\<\s*(\w+))/i,function(){
                    return RegExp.$1+' data-row="{key}"';
                });
                tbodyTemplate='<? foreach(data as key item){ ?>'+tbodyTemplate+'<? } ?>';
            }
            return this;
        }

        /**
         * 指定一个自定义列名行的模板
         * @param template
         * @returns {DataGrid}
         */
        this.theadTag=function( tag )
        {
            var match =  tag.match(/<?(\w+)(\s+[^>])\/?>?/);
            thead = '<'+match[1]+match[2]+'>{value}</'+match[1]+'>';
            return this;
        }

        /**
         * 指定一个自定义内容行的模板
         * @param template
         * @returns {DataGrid}
         */
        this.tbodyTag=function( tag )
        {
            var match =  tag.match(/<?(\w+)(\s+[^>])\/?>?/);
            tbody = '<'+match[1]+match[2]+'>{value}</'+match[1]+'>';
            return this;
        }

        /**
         * 在模板中添加需要编辑的操作
         * @param column
         * @param option
         */
        this.edit=function(column,option)
        {
            this.plus('edit',column,{
                'template':'<a>编辑</a>',
                'callback':null,
                'eventType':MouseEvent.CLICK,
                'cursor':'pointer'
            }, option );
            return this;
        }

        /**
         * 在模板中添加需要移除的操作
         * @param column
         * @param option
         */
        this.remove=function(column,option)
        {
            this.plus('remove',column,{
                'template':'<a>删除</a>',
                'callback':null,
                'eventType':MouseEvent.CLICK,
                'cursor':'pointer'
            },option);
            return this;
        }

        /**
         * 设置指定的列名
         * @param columns
         * @returns {DataGrid}
         */
        this.columns=function( columns )
        {
            columnItem = columns;
            if ( Breeze.isString(columns) )
            {
                columnItem = columns.split(',')
            }
            return this;
        }

        /**
         * 设置指定列中需要设置的组件
         * @param column
         * @param option
         * @returns {DataGrid}
         */
        this.component=function(column,option)
        {
            this.plus('component',column,{
                'eventType':[MouseEvent.CLICK],
                'template':'<input />',
                'dataGroup':[],
                'property':{},
                'callback':null,
                'bindable':false
            }, option );
            return this;
        }


        /**
         * 设置数据属性
         * @param data
         * @returns {DataGrid}
         */
        this.dataProfile=function( data,option )
        {
            this.makeTemplate(columnItem, thead, tbody);
            var templateContent =  template.replace('{theadTemplate}', theadTemplate ).replace('{tbodyTemplate}',tbodyTemplate );
            this.dataRender().source( data , option )
            this.dataRender().display( templateContent );
            return this;
        }

        /**
         * @private
         */
        var _viewport=false;

        /**
         * @private
         */
        this.viewport=function( viewport )
        {
            if( typeof viewport === "undefined")
                return  this.dataRender().viewport();

            if( _viewport === false )
            {
                this.dataRender().viewport( viewport );
                _viewport=true;
                this.dataRender().viewport().addEventListener(ElementEvent.ADDED, function (event)
                {
                    Breeze('[data-action]', this).each(function (elem, index) {

                        var action = this.property('data-action');
                        if (plus_data.option[action]) {
                            var option = plus_data.option[action];
                            if (option.cursor)
                                this.style('cursor', option.cursor);

                            this.addEventListener(option.eventType, function (event) {
                                var index = this.property('data-index');
                                if (typeof option.callback === 'function') {
                                    option.callback.call(this, index, dataRender, event);
                                }
                            })
                        }
                    })
                })
            }
            return this;
        }


        /**
         * @param pageContaine
         * @returns {boolean|DataGrid}
         */
        this.pageEnable=function( pageContaine )
        {
            if( typeof pageContaine === "undefined" ){
                return this.dataRender().pageEnable();
            }
            this.dataRender().pageEnable( pageContaine );
            return this;
        }


        /**
         * @type {null}
         * @private
         */
        var _dataRender=null;

        /**
         * 获取数据渲染项
         * @returns {DataRender}
         */
        this.dataRender=function()
        {
            if( !_dataRender )
            {
                _dataRender=new DataRender();
            }
            return _dataRender;
        }
    }

   window.DataGrid= DataGrid;

})( window )
