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

    function Pagination( viewport , context )
    {
        if( !(this instanceof  Pagination) )
            return new Pagination( viewport , context );
        return SkinComponent.call(this,viewport , context);
    }
    Pagination.prototype= new SkinComponent();
    Pagination.prototype.constructor = Pagination;
    Pagination.prototype.componentProfile='pagination';
    Pagination.prototype.initializeMethod=['display'];


    /**
     * @private
     */
    Pagination.prototype.__options__={
        'links':7,
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
        template:{
            'firstPage':'<a data-pages="{firstPage}" <?if(currentPage==firstPage && require){?>disable<? } ?> >第一页</a>',
            'prevPage' :'<a data-pages="{prevPage}" <?if(currentPage==prevPage && require){?>disable<? } ?> >上一页</a>',
            'buttons'  :'<? foreach(buttons as key value){ ?><a class="link" data-pages="{value}" <?if(currentPage==value){?>current <? } ?> >{value}</a><?}?>',
            'nextPage' :'<a data-pages="{nextPage}" <?if(currentPage==nextPage && require){?>disable<? } ?> >下一页</a>',
            'lastPage' :'<a data-pages="{lastPage}" <?if(currentPage==lastPage && require){?>disable<? } ?> >最后页</a>',
            'hiddenLeft':'<? if(buttons[0]>1){ ?><span>...</span><?}?>',
            'hiddenRight':'<? if(buttons[buttons.length-1]<totalPage){ ?><span>...</span><?}?>',
            'goto':'<input /><button>跳转到</button>'
        },
        style:{
            'a,span':{ style:{'width':'auto','height':'22px','line-height':'22px','padding':'3px 8px',margin:'0px 2px',cursor:'pointer','color':'#333333','backgroundColor':'#ffffff','textDecoration':'none'} },
            'a.link':{'border':'solid 1px #333333'},
            'a[current]':{'backgroundColor':'#444444','color':'#ffffff'},
            'input':{'width':'40px','height':'22px','line-height':'22px',margin:'0px 2px'},
            'button':{'width':'auto','height':'22px','line-height':'22px',margin:'0px 2px','padding':'0px 2px'},
            'a[disable]':{'color':'#999999','cursor':'auto'}
        },
        'themeSkin':'{firstPage}{prevPage}{buttons}{nextPage}{lastPage}{goto}',
        'require':true
    };

    /**
     * 设置获取分页模板
     * @param options
     * @returns {*}
     */
    Pagination.prototype.options=function( options )
    {
        if( typeof options !== "undefined" )
        {
            this.__options__=Utils.extend(true,this.__options__,options);
            return this;
        }
        return this.__options__;
    }

    /**
     * @private
     */
    Pagination.prototype.__dataSource__=null;

    /**
     * @param dataSource
     * @returns {DataSource|Pagination}
     */
    Pagination.prototype.dataSource=function( dataSource )
    {
        if( typeof dataSource !== "undefined" )
        {
            if( !(dataSource instanceof DataSource) )
              throw new Error('invalid dataSource');

            this.__dataSource__ = dataSource;
            dataSource.addEventListener(DataSourceEvent.SELECT,function(evnet)
            {
                this.display( Math.ceil( dataSource.predicts() / dataSource.rows() ) , dataSource.currentPages() );

            },false,100,this);
            return this;
        }
        return this.__dataSource__;
    }

    /**
     * @private
     */
    Pagination.prototype.__template__=null;

    /**
     * @returns {*|Template}
     */
    Pagination.prototype.template=function()
    {
        if( this.__template__===null )
        {
            this.__template__ = new Template();
            this.__template__.addEventListener( TemplateEvent.REFRESH ,  function(event)
            {
                var viewport= event.viewport;
                var options = this.options();
                for( var name in options.action )
                {
                    var item = options.action[ name ]
                    Breeze( name , viewport).not('[disable]').addEventListener( item.eventType,(function(self,item)
                    {
                        return function(event){
                            item.callback.call(self,this,event)
                        }

                    })(this,item));
                }
                for( var selector in options.style )Breeze( selector, viewport).style( options.style[selector] )

            },false,0, this);
        }
        return  this.__template__;
    }


    /**
     * 显示分页视图
     * @param number totalPages  总页数
     * @param number currentPages 当前页数
     * @returns {*}
     */
    Pagination.prototype.display=function(totalPages, currentPages )
    {
        var options =  this.options();
        var links = options.links;
        var offset =  Math.max( currentPages - Math.ceil( links / 2 ), 0);
        offset = offset+links > totalPages ? offset-(offset+links - totalPages) : offset;
        var buttons =[];
        for( var b=1 ; b <= links; b++ )
        {
            buttons.push( offset+b );
        }

        var skin = options.themeSkin.replace(/\{(\w+)\}/g,function(all,name){
            return options.template[name] || '';
        })

        var tpl=this.template().viewport( this.skinGroup() );
        tpl.variable('totalPage', totalPages );
        tpl.variable('firstPage', 1 );
        tpl.variable('prevPage', Math.max( currentPages-1, 1) );
        tpl.variable('nextPage', Math.min( currentPages+1, totalPages) );
        tpl.variable('lastPage', totalPages );
        tpl.variable('currentPage', currentPages );
        tpl.variable('buttons', buttons );
        tpl.variable('require',options.require);
        return tpl.render( skin );
    }

    /**
     * 获取默认皮肤
     * @returns {SkinObject}
     * @protected
     */
    Pagination.prototype.defaultSkinObject=function()
    {
        var skinObject=new SkinObject('',{
            'firstPage':'',
            'prevPage' :'',
            'buttons'  :'',
            'nextPage' :'',
            'lastPage' :''
        });
        return skinObject;
    }

    window.Pagination= Pagination;

})( window )
