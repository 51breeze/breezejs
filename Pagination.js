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
                if( event.type===MouseEvent.CLICK  || (KeyboardEvent.KEYPRESS===event.type && event.keycode==13 ) )
                {
                    var dataSource = this.dataSource();
                    var viewport = this.template().viewport();
                    if (typeof dataSource !== 'undefined') {
                        var index = parseInt(Breeze('input', viewport).property('value') );
                        dataSource.currentPages(Math.min(Math.max(index, 1), dataSource.totalPages()));
                    }
                }
            }}
        },
        style:{
            'a,span':{'width':'auto','height':'22px','line-height':'22px','padding':'3px 8px',margin:'0px 2px',cursor:'pointer','color':'#333333','backgroundColor':'#ffffff','textDecoration':'none'},
            'a.link':{'border':'solid 1px #333333'},
            'a.current':{'backgroundColor':'#444444','color':'#ffffff'},
            'input':{'width':'40px','height':'22px','line-height':'22px',margin:'0px 2px'},
            'button':{'width':'auto','height':'22px','line-height':'22px',margin:'0px 2px','padding':'0px 2px'},
            'a.disabled':{'color':'#999999','cursor':'auto'}
        },
        'themeSkin':'{firstPage}{prevPage}{links}{nextPage}{lastPage}{goto}',
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
            dataSource.addEventListener(DataSourceEvent.SELECT,this.display,false,100,this);
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
            this.__template__ = new Template().addEventListener( TemplateEvent.REFRESH ,function(event)
            {
                var dataSource = this.dataSource();
                var self = this;
                var totalPages = this.totalPages();
                this.skinGroup().getSkinGroup('container > a').addEventListener( MouseEvent.CLICK,function(event){
                    var current = self.currentPages();
                    var page = parseInt( this.property('pageIndex') ) || current;
                    switch( this.property(SkinGroup.NAME) )
                    {
                        case 'firstPage': page = 1 ; break;
                        case 'prevPage' : page = Math.max(current-1, 1) ; break;
                        case 'nextPage' : page =Math.min(current+1, totalPages) ; break;
                        case 'lastPage' : page = totalPages ; break;
                    }
                    if( page !== current )
                    {
                        self.currentPages( page );
                    }
                });
                update.call(this, totalPages , self.currentPages() );
            },false,0, this);
        }
        return  this.__template__;
    }

    function update(totalPages , currentPages)
    {
        var options = this.options();
        var links = options.links;
        var offset =  Math.max( currentPages - Math.ceil( links / 2 ), 0);
        offset = offset+links > totalPages ? offset-(offset+links - totalPages) : offset;
        links = Utils.range(1, options.links, offset);

        this.skinGroup().getSkinGroup('container > '+SkinGroup.skinName('link') ).current('.current').removeClass('current').current(null).forEach(function(elem,index){
            this.property('pageIndex',links[index]);
            this.text( links[index] );
            if( currentPages == links[index] )
            {
                this.addClass('current');
            }
        });

        var left =  this.skinGroup().getSkinGroup('container > '+SkinGroup.skinName('firstPage') +','+SkinGroup.skinName('prevPage'));
        var right = this.skinGroup().getSkinGroup('container > '+SkinGroup.skinName('nextPage') +','+SkinGroup.skinName('lastPage') );
        left.removeClass('disabled');
        right.removeClass('disabled');
        if( currentPages == 1 )
        {
            left.addClass('disabled');

        }else  if(currentPages===totalPages)
        {
            right.addClass('disabled');
        }
    }

    /**
     * @private
     */
    Pagination.prototype.__totalPages__=0;

    /**
     * 设置获取总分页数
     * @param number totalPages
     * @returns {*}
     */
    Pagination.prototype.totalPages=function( totalPages )
    {
        var dataSource = this.dataSource();
        if( typeof totalPages === "undefined" )
        {
           return dataSource ? dataSource.totalPages() : this.__totalPages__;
        }
        this.__totalPages__ = dataSource ? dataSource.totalPages() : totalPages;
        return this;
    }

    /**
     * @private
     */
    Pagination.prototype.__currentPages__=1;

    /**
     * 设置获取总分页数
     * @param number totalPages
     * @returns {*}
     */
    Pagination.prototype.currentPages=function( currentPages )
    {
        var dataSource = this.dataSource();
        if( typeof currentPages === "undefined" )
        {
            return dataSource ? dataSource.currentPages() : this.__currentPages__;
        }
        !dataSource || dataSource.currentPages( currentPages );
        this.__currentPages__ = currentPages;
        return this;
    }

    Pagination.prototype.__display__=false;

    /**
     * 显示分页视图
     * @param number totalPages  总页数
     * @param number currentPages 当前页数
     * @returns {*}
     */
    Pagination.prototype.display=function(totalPages, currentPages )
    {
        if( typeof totalPages === "number" )
            this.totalPages( totalPages );

        if( typeof currentPages === "number" )
           this.currentPages( currentPages );

        totalPages =  this.totalPages();
        currentPages =  this.currentPages();

        var options =  this.options();
        var skinGroup = this.skinGroup();
        var skinObject = skinGroup.skinObject();

        if( this.__display__ !== true )
        {
            this.__display__ = true;
            skinObject.part.links = Utils.repeat(skinObject.part.link, options.links);
            var tpl = this.template().viewport(this.skinGroup());
            var skin = options.themeSkin.replace(/\{(\w+)\}/g, function (all, name) {
                return skinObject.part[name] || '';
            })
            tpl.render(skin);

        }else
        {
            update.call(this, totalPages , currentPages );
        }
        return this;
    }

    /**
     * 获取默认皮肤
     * @returns {SkinObject}
     * @protected
     */
    Pagination.prototype.defaultSkinObject=function()
    {
        var skinObject=new SkinObject('',{
            'firstPage':'<a>第一页</a>',
            'prevPage' :'<a>上一页</a>',
            'link':'<a></a>',
            'nextPage' :'<a>下一页</a>',
            'lastPage' :'<a>最后页</a>',
            'hiddenLeft':'<span>...</span>',
            'hiddenRight':'<span>...</span>',
            'goto':'{part input+button}',
            'input':'<input />',
            'button':'<button>跳转到</button>'
        },{
            'container':{ style:{'width':'100%','height':'auto',textAlign:'center'} },
            'a,span,input,button':{style:{display:'inline-block','height':'22px','line-height':'22px'}},
            'a,span':{ style:{'width':'auto','padding':'0px 8px',margin:'0px 2px',cursor:'pointer','color':'#333333','backgroundColor':'#ffffff','textDecoration':'none'} },
            'a.link':{ style:{'border':'solid 1px #333333'}},
            'a.current':{ style:{ 'backgroundColor':'#444444','color':'#ffffff' , 'border':'solid 1px #333333' }},
            'input':{style:{'width':'40px',margin:'0px 2px'}},
            'button':{style:{'width':'auto',margin:'0px 2px','padding':'0px 2px'}},
            'a.disabled':{style:{'color':'#999999','cursor':'auto'}}
        },['firstPage','prevPage','nextPage','lastPage'],'.pagination');
        return skinObject;
    }

    window.Pagination= Pagination;

})( window )
