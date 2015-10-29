/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{
    function Pagination( dataSource )
    {
        if( !(this instanceof  Pagination) )
        {
            return new Pagination( dataSource );
        }

        if( typeof dataSource !=="undefined" && !(dataSource instanceof DataSource) )
        {
            throw new Error('invalid param dataSource');
        }

        /**
         * @private
         */
        var setting={
            'links':6,
            'template':{
                'firstPage':'<a data-pages="{firstPage}" <?if(currentPage==firstPage && require){?>disable<? } ?> >第一页</a>',
                'prevPage' :'<a data-pages="{prevPage}" <?if(currentPage==prevPage && require){?>disable<? } ?> >上一页</a>',
                'buttons'  :'<? foreach(buttons as key value){ ?><a class="link" data-pages="{value}" <?if(currentPage==value){?>current<? } ?> >{value}</a><?}?>',
                'nextPage' :'<a data-pages="{nextPage}" <?if(currentPage==nextPage && require){?>disable<? } ?> >下一页</a>',
                'lastPage' :'<a data-pages="{lastPage}" <?if(currentPage==lastPage && require){?>disable<? } ?> >最后页</a>',
                'hiddenLeft':'<? if(buttons[0]>1){ ?><span>...</span><?}?>',
                'hiddenRight':'<? if(buttons[buttons.length-1]<totalPage){ ?><span>...</span><?}?>',
                'goto':'<span><input /><button>跳转到</button></span>'
            },
            'action':{
                'a':{'eventType':MouseEvent.CLICK,'callback':function(crrentTarget,event){
                    var dataSource = this.dataSource();
                    if( typeof dataSource !=='undefined'  )
                    {
                        dataSource.currentPages( crrentTarget.property('data-pages') )
                    }
                }},
                'button,input':{'eventType':[MouseEvent.CLICK,KeyboardEvent.KEYPRESS],'callback':function(crrentTarget,event)
                {
                    if( event.type===MouseEvent.CLICK || (KeyboardEvent.KEYPRESS===event.type && event.keycode==13 ) )
                    {
                        var dataSource = this.dataSource();
                        var viewport = this.viewport();
                        if (typeof dataSource !== 'undefined') {
                            var index = parseInt(Breeze('input', viewport).property('value'));
                            dataSource.currentPages(Math.min(Math.max(index, 1), dataSource.totalPages()));
                        }
                    }
                }}
            },
            'style':{
                'a,span':{'width':'auto','height':'22px','line-height':'22px','padding':'0px 8px',display:'block;',float:'left;',margin:'0px 2px;',cursor:'pointer;'},
                'a[current]':{'backgroundColor':'#444444','color':'#ffffff'},
                'a.link':{'border':'solid 1px #333333'},
                'input':{'width':'40px','height':'16px','line-height':'16px'},
                'a[disable]':{'color':'#cccccc','cursor':'auto'}
            },
            //'skin':'{firstPage}{prevPage}{hiddenLeft}{buttons}{hiddenRight}{nextPage}{lastPage}{goto}',
            'skin':'{firstPage}{prevPage}{buttons}{nextPage}{lastPage}{goto}',
            'require':true
        }

        /**
         * @type {Pagination}
         */
        var self= this;

        /**
         * @private
         */
        if( dataSource instanceof DataSource )
        {
            dataSource.addEventListener(DataSourceEvent.FETCH,function(evnet)
            {
                self.display( Math.ceil( this.predicts() / this.rows() ) , this.currentPages() );

            },true,100);
        }

        /**
         * @private
         */
        var _changed=true;

        /**
         * 设置获取分页模板
         * @param options
         * @returns {*}
         */
        this.options=function( options )
        {
            if( typeof options !== "undefined" )
            {
                setting=Breeze.extend(true,setting,options);
                _changed=true;
                return this;
            }

            if( _changed )
            {
                _changed=false;
                for (var k in setting.template )
                {
                    var tpl = setting.template[k];
                    setting.skin = setting.skin.replace('{' + k + '}', tpl);
                }
            }
            return setting;
        }

        /**
         * @private
         */
        this.viewport=function( viewport )
        {
            if( typeof  viewport === "undefined" )
               return this.template().viewport();
            this.template().viewport( viewport );
            return this;
        }

        /**
         * @private
         */
        var _dataSource=dataSource;

        /**
         * @param dataSource
         * @returns {*}
         */
        this.dataSource=function()
        {
            return _dataSource;
        }

        /**
         * @private
         * @param event
         */
        var action=function(event)
        {
            var viewport= event.viewport;
            for( var name in setting.action )
            {
                var item = setting.action[ name ]
                Breeze( name , viewport).not('[disable]').addEventListener( item.eventType,(function(self,item)
                {
                    return function(event){
                        item.callback.call(self,this,event)
                    }

                })(self,item))
            }

            for( var name in setting.style )
            {
                var item = setting.style[ name ]
                Breeze( name , viewport).style( item );
            }
        }

        /**
         * @private
         */
        var _tpl=null;

        /**
         * @param tpl
         * @returns {*|Template}
         */
        this.template=function( tpl )
        {
            if( tpl && tpl instanceof Template )
            {
                _tpl=tpl;

            }else if( _tpl===null )
            {
                _tpl = new Template();
            }
            _tpl.removeEventListener( TemplateEvent.REFRESH , action );
            _tpl.addEventListener( TemplateEvent.REFRESH ,  action );
            return _tpl;
        }

        /**
         * @private
         */
        var _undisplay=false;

        /**
         * @param flag
         * @returns {boolean}
         */
        this.undisplay=function( flag )
        {
            if( typeof  flag !== "undefined" )
            {
                _undisplay = flag;
                this.viewport().html('');
            }
            return _undisplay;
        }

        /**
         * 获取数据渲染项
         * @returns {DataRender}
         */
        this.display=function(totalPages, currentPages )
        {
            if( this.undisplay() )
               return false;

            var options =  this.options();
            var links = options.links;
            var offset =  Math.max( currentPages - Math.ceil( links / 2 ), 0);
            offset = offset+links > totalPages ? offset-(offset+links - totalPages) : offset;
            var buttons =[];
            for( var b=1 ; b <= links; b++ )
            {
                buttons.push( offset+b );
            }

            var tpl=this.template();
            tpl.variable('totalPage', totalPages );
            tpl.variable('firstPage', 1 );
            tpl.variable('prevPage', Math.max( currentPages-1, 1) );
            tpl.variable('nextPage', Math.min( currentPages+1, totalPages) );
            tpl.variable('lastPage', totalPages );
            tpl.variable('currentPage', currentPages );
            tpl.variable('buttons', buttons );
            tpl.variable('require',options.require);
            return tpl.render( options.skin );
        }
    }

    window.Pagination= Pagination;

})( window )
