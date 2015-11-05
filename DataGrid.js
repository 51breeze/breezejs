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
    function makeTemplate(columns, options,plus_data )
    {
        if( options.needmake===false )
        {
            return options.skin;
        }

        var props=['attr','style','className'];
        var type=['thead','tbody','wrap','skin']
        var replace={'style':'style="{value}"','className':'class="{value}"'};
        for(var b in props )
        {
            var item = options[ props[b] ];
            for( var t in type )
            {
                if( item[ type[t] ] )
                {
                    if ( (props[b] === 'attr' || props[b] === 'style') && Breeze.isObject(item[type[t]],true) )
                    {
                        item[type[t]] = Breeze.serialize(item[type[t]], props[b] === 'style' ? props[b] : 'url');
                    }

                }else
                {
                    item[ type[t] ]='';
                }
                item[ type[t] ] = typeof replace[ props[b] ] === "string" && item[ type[t] ] !=='' ? replace[ props[b] ].replace('{value}', item[ type[t] ] ) : item[ type[t] ];
                options[ type[t] ]=options[ type[t] ].replace('{'+props[b]+'}', item[ type[t] ] );
            }
        }

        var thead = options.thead;
        var tbody = options.tbody;
        var wrap  = options.wrap;

        if( Breeze.isObject(columns,true) )
        {
            options.thead='';
            options.tbody='';

            for( var i in  columns )
            {
                var field = columns[i];
                i = i.replace(/\s+/,'');

                var tb=tbody,th=thead;
                if( plus_data['tbody'].template[ i ] )
                {
                    tb = tbody.replace('{value}', plus_data['tbody'].template[ i ].join('\r\n') );
                }

                if( plus_data['thead'].template[ i ] )
                {
                    th = thead.replace('{value}', plus_data['thead'].template[ i ].join('\r\n') );
                }

                if( w )
                {
                    th=th.replace(/<(.*?)>/, "<\$1 width='"+ w +"'>" );
                    tb=tb.replace(/<(.*?)>/, "<\$1 width='"+ w +"'>" );
                }

                options.thead += th.replace(/\{column\}/g, i).replace(/\{value\}/g, field );
                options.tbody += tb.replace(/\{column\}/g, i).replace(/\{value\}/g, '{item.'+ i +'}');
                var w= options.columnWidth[i] || options.columnWidth['*'] || null;

            }
            options.thead = wrap.replace('{value}', options.thead);
            options.tbody = wrap.replace('{value}', options.tbody ).replace(/(\<\s*(\w+))/i,function(){
                return RegExp.$1+' data-row="{key}"';
            });
            options.tbody='<? foreach(data as key item){ ?>'+options.tbody+'<? } ?>';
        }
        options.needmake=false;
        options.skin =  options.skin.replace('{thead}', options.thead ).replace('{tbody}',options.tbody );
        return options.skin;
    }

    function DataGrid()
    {
        var template={
           'thead':'<th {style} {attr} {className} >{value}</th>',
           'tbody':'<td {style} {attr} {className} >{value}</td>',
           'wrap' :'<tr {style} {attr} {className} >{value}</tr>',
           'columnWidth':{'*':'auto'},
           'style':{
               skin:{'width':'100%','height':'auto'},
               thead:{},
               tbody:{},
               wrap :{},
           },
           'attr':{
                skin:null,
                thead:{'height':'30px'},
                tbody:{'height':'25px'},
                wrap :null
            },
           'className':{skin:'grid'},
           'needmake':true,
           'skin':"<table {style} {attr} {className}>\r\n<thead>{thead}</thead>\r\n<tbody>{tbody}</tbody>\r\n</table>"
        };

        var plus_data={};

        this.plus=function(action,column,defualt,option,category)
        {
            category = category || 'tbody';
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
                return RegExp.$1+( category === 'tbody' ? ' data-index="{key}" ': ' data-column="{column}"' )+' data-action="'+action+'" '+attr.join(' ');
            });

            var data = plus_data[ category ] || ( plus_data[ category ]={'template':{},'option':{}} );
            if( !data.template[ column ] )
            {
                data.template[ column ]=[];
            }
            data.template[ column ].push( option.template );
            data.option[ action ]= option;
        }

        /**
         * 设置获取配置选项
         * @param options
         * @returns {*}
         */
        this.options=function( options )
        {
            if( typeof options !== "undefined")
            {
                var e = ['tbody','thead','wrap'];
                for(var i in e )
                {
                    if( typeof options[ e[i] ] !== "undefined" )
                    {
                        options[ e[i] ]=tagAttr( options[ e[i] ] );
                    }
                }
                template = Breeze.extend(true, template, options );
                if( typeof options['skin'] !== "undefined" )
                {
                    template.needmake=false;
                }
                return this;
            }
            return template;
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
                'style':{'cursor':'pointer'}
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
                'style':{'cursor':'pointer'}
            },option);
            return this;
        }

        /**
         * @private
         */
        var _columns={};

        /**
         * 设置指定的列名
         * @param columns
         * @returns {DataGrid}
         */
        this.columns=function( columns )
        {
            if( typeof columns === 'undefined' )
            {
                return _columns;
            }
            _columns = columns;
            if ( Breeze.isString(columns) )
            {
                _columns = columns.split(',')
            }
            return this;
        }

        /**
         * @type {{}}
         */
        var orderType={};

        /**
         * 排序
         * @param column
         * @param option
         * @returns {DataGrid}
         */
        this.orderBy=function(column,option)
        {
            this.plus('orderBy',column,{
                'template':'<span>{value}</span>',
                'callback':function(index,render){
                    var column = this.property('data-column');
                    orderType[column] === 'asc' ? orderType[column]='desc' : orderType[column]='asc';
                    render.dataSource().orderBy(column,  orderType[column] );
                },
                'eventType':MouseEvent.CLICK,
                'style':{'cursor':'default','display':'block'}
            },option,'thead');
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
            var pagination =  this.pagination();
            this.dataRender().source( data , option )
            this.dataRender().display(  makeTemplate( this.columns(), this.options(), plus_data ) );
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
                _viewport=true;
                var self= this;
                this.dataRender().viewport( viewport );
                this.dataRender().template().addEventListener(TemplateEvent.REFRESH, function (event)
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
                                this.addEventListener(option.eventType, function (event)
                                {
                                    if (typeof option.callback === 'function')
                                    {
                                        var index = self.dataRender().dataSource().offsetIndex( this.property('data-index') );
                                        option.callback.call(this, index, self.dataRender(), event);
                                    }
                                })
                            }
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
        this.pagination=function( pageContaine )
        {
            if( typeof pageContaine === "undefined" )
            {
                return this.dataRender().pagination();
            }
           return this.dataRender().pagination( pageContaine );
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
            if( _dataRender===null )
            {
                _dataRender=new DataRender();
            }
            return _dataRender;
        }
    }

   window.DataGrid= DataGrid;

})( window )
