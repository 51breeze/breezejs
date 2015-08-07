/**
 * Created by Administrator on 15-7-26.
 */

(function(window,undefined )
{

    function makeData(data,template,forIndex)
    {

        var html=[];
        var tpl = template;
        if( Breeze.isObject(data,true)  && !Breeze.isEmpty(data) )
        {
            var flag=false;
            for(var i in data )
            {
               if( Breeze.isObject(data[i],true)  )
               {
                   var val = makeData(data[i],template,i);
                   if( val.length > 0 )
                   {
                       html.push( val ) ;
                   }
                   flag=true;

               }else
               {
                    tpl = tpl.replace(new RegExp('{'+ i.replace(/\s+/,'')+'}','ig'),data[i]);
               }
            }
            if( !flag  )
            {
                tpl=tpl.replace(/\{forIndex\}/ig,forIndex);
                tpl=tpl.replace(/\{.*?\}/,'');
                html.push( tpl )
            }
        }
        return html;
    }

    function merge_option(target,column,option)
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
                opt=Breeze.isObject(option);
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
        var makeHtml=[];
        var dataRender = null;
        var header="<th>{value}</th>";
        var body="<td>{value}</td>";
        var container="<table style='width: 100%'>\r\n<thead>{columns}</thead>\r\n<tbody>{contents}</tbody>\r\n</table>";
        var columnItem={};

        var plus_config_item={
            'edit':{
                'enabled':true,
                'template':'<a>编辑</a>',
                'callback':null,
                'eventType':MouseEvent.CLICK,
                'cursor':'pointer',
                'column':''
            },
            'remove':{
                'enabled':true,
                'template':'<a>删除</a>',
                'callback':null,
                'eventType':MouseEvent.CLICK,
                'cursor':'pointer',
                'column':''
            }
        }
        var plus_template={}

        /**
         * 根据数据项编译成html
         */
        var doMake=function()
        {
            if( dataRender )
            {
                if( target instanceof Breeze )
                {
                    var html=  container.replace('{columns}', theadTemplate )
                    html = html.replace('{contents}', makeData(dataRender.getData(),tbodyTemplate).join("\r\n") );
                    html = Breeze( html );
                    target.html( html )

                    // 为每行绑定动作行为
                    html.find('[data-action]').each(function(elem,index){

                        var key = this.property('data-action');
                        if( plus_config_item[key] && plus_config_item[key].enabled )
                        {
                            var option = plus_config_item[key];
                            this.style('cursor',option.cursor );
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

                }
            }
        }

        /**
         * 编译一个显示列名行的模板
         * @param columns
         * @param header
         * @param body
         * @returns {DataGrid}
         */
        this.makeTemplate= function(columns,header,body)
        {
            if( Breeze.isObject(columns,true) && theadTemplate==='' )
            {
                //附加一些定义的内容
                for( var j in plus_config_item )
                {
                    var column = plus_config_item[j]['column'];
                    if( plus_config_item[j].enabled && !Breeze.isEmpty( column ) && plus_config_item[j].template )
                    {
                        plus_config_item[j].template=plus_config_item[j].template.replace(/(\<\s*\w+)/ig,'$1 data-index="{forIndex}" data-action="'+j+'"');
                        if( !plus_template[ column ] )
                        {
                            plus_template[ column ]=[];
                        }
                        plus_template[ column ].push( plus_config_item[j].template );
                    }
                }

                theadTemplate='<tr>';
                tbodyTemplate='<tr>';
                for( var i in  columns )
                {
                    var field = columns[i];
                    if( Breeze.isObject( field ) && ( item.icon || item.label ) )
                    {
                        field='<i class="'+( item.icon || '' )+'"></i>';
                        field+='<span>'+( item.label || '' )+'</span>';
                    }

                   theadTemplate += header.replace('{value}', field )
                   if( plus_template[ i ] )
                   {
                       tbodyTemplate += body.replace('{value}', plus_template[ i ].join('\r\n') );
                   }else
                   {
                       tbodyTemplate += body.replace('{value}', '{'+ i.replace(/\s+/,'')+'}' );
                   }
                }
                theadTemplate+="</tr>";
                tbodyTemplate+="</tr>";
            }
            return this;
        }

        /**
         * 指定一个自定义列名行的模板
         * @param template
         * @returns {DataGrid}
         */
        this.theadTemplate=function( template )
        {
            theadTemplate = template;
            return this;
        }

        /**
         * 指定一个自定义内容行的模板
         * @param template
         * @returns {DataGrid}
         */
        this.tbodyTemplate=function( template )
        {
            tbodyTemplate = template;
            return this;
        }

        /**
         * 在模板中添加需要编辑的操作
         * @param column
         * @param option
         */
        this.edit=function(column,option)
        {
            plus_config_item['edit'] = merge_option( plus_config_item['edit'],column,option);
            return this;
        }

        /**
         * 在模板中添加需要移除的操作
         * @param column
         * @param option
         */
        this.remove=function(column,option)
        {
            plus_config_item['remove'] = merge_option( plus_config_item['remove'],column,option);
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
         * 设置数据属性
         * @param data
         * @returns {DataGrid}
         */
        this.dataProfile=function(data)
        {
            this.makeTemplate(columnItem, header, body);
            if( !dataRender )
            {
                dataRender=new DataRender( data );
                dataRender.addEventListener(DataRenderEvent.ITEM_CHANGED,doMake);
                doMake();
            }
            return this;
        }

        /**
         * 获取数据渲染项
         * @returns {DataRender}
         */
        this.getDataRender=function()
        {
            return dataRender
        }

    }

   window.DataGrid= DataGrid;

})( window )
