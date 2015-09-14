/**
 * Created by Administrator on 15-7-26.
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

    function DataGrid( target )
    {

        var theadTemplate='';
        var tbodyTemplate='';
        var dataRender = null;
        var thead="<th>{value}</th>";
        var tbody="<td>{value}</td>";
        var container="<tr>{value}</tr>";
        var template="<table style='width: 100%'>\r\n<thead>{theadTemplate}</thead>\r\n<tbody>{tbodyTemplate}</tbody>\r\n</table>";
        var columnItem={};
        var plus_data={
            'template':{},
            'option':{}
        }



        // 为每行绑定动作行为
        var bindAction=function( target )
        {

            target.find('[data-action]').each(function(elem,index){

                var action = this.property('data-action');
                if( plus_data.option[ action ] )
                {
                    var option = plus_data.option[ action ];
                    if( option.cursor )
                        this.style('cursor', option.cursor );

                    this.addEventListener( option.eventType , function(event)
                    {
                        var index =  this.property('data-index');
                        if( typeof option.callback ==='function' )
                        {
                            option.callback.call(this,index, dataRender, event );
                        }
                    })
                }
            })

            target.find('[data-bind]').each(function(elem){

                var index = this.property('data-index');
                var name = this.property('data-bind');
                var item = dataRender[index];
                var bind = new Bindable()
                this.data('__binder__', bind );
                bind.bind(item,name);

                this.addEventListener(BreezeEvent.BLUR,function(event)
                {
                    var name =  this.property('data-bind');
                    var value = this.property('value');
                    var binder =  this.data('__binder__');
                    if( binder ){
                        binder.property(name,value)
                    }
                })
            })
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
        this.dataProfile=function(data)
        {
            this.makeTemplate(columnItem, thead, tbody);
            templateContent =  template.replace('{theadTemplate}', theadTemplate ).replace('{tbodyTemplate}',tbodyTemplate );
            this.dataRender().source( data );
            return this;
        }

        var templateContent;
        var tpl = new Template( target );

        /**
         * 获取数据渲染项
         * @returns {DataRender}
         */
        this.dataRender=function()
        {
            if( !dataRender )
            {
                dataRender=new DataRender();
                dataRender.addEventListener(DataRenderEvent.ITEM_ADD,function(event){

                    if( !isNaN(event.index) )
                    {
                        var list = Breeze('[data-row]:gt('+event.index+')', target )
                        Breeze('[data-row="'+event.index+'"]',target).removeElement();
                        list.each(function(elem){
                            var val= this.property('data-row');
                            this.property('data-row', val-1 );
                            Breeze('[data-index]', elem ).property('data-index',  val-1 )
                        })

                    }else
                    {

                        tpl.assign('data', dataRender.toArray() )
                        tpl.render( templateContent )
                        bindAction( target );
                    }
                });
            }
            return dataRender
        }

    }

   window.DataGrid= DataGrid;

})( window )
