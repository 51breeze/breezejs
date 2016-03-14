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
     * 分页组件.
     * 此组件包含如下皮肤元素：
     * {totalPage}{firstPage}{prevPage}{hiddenLeft}{links}{hiddenRight}{nextPage}{lastPage}{goto}
     * 这些皮肤元素可以自由组合位置和删减以满足各种需求。
     *
     * 此组件支持鼠标单击和鼠标滚动事件，默认为鼠标单击事件
     * 如果同时需要支持两种事件 只需要在 options.eventType 中设置 [MouseEvent.CLICK,MouseEvent.MOUSE_WHEEL] 即可。
     * @param viewport
     * @param context
     * @returns {*}
     * @constructor
     */
    function Pagination( viewport , context )
    {
        if( !(this instanceof  Pagination) )
            return new Pagination( viewport , context );



        this.__options__={
            'links':7,
            'eventType':[MouseEvent.CLICK,MouseEvent.MOUSE_WHEEL],
            'wheelTarget':document,
            'themeSkin':'{firstPage}{prevPage}{links}{nextPage}{lastPage}'
        }
        return SkinComponent.call(this,viewport , context);
    }

    Pagination.prototype= new SkinComponent();
    Pagination.prototype.constructor = Pagination;
    Pagination.prototype.componentProfile='pagination';
    Pagination.prototype.initializeMethod=['display'];


    /**
     * @private
     */
    Pagination.prototype.__options__={};

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
                var self = this;
                var totalPages = this.totalPages();
                var options =  this.options();
                var eventType = new DataArray( options.eventType );

                if( eventType.indexOf(MouseEvent.CLICK) >=0 )
                {
                    this.skinGroup().getSkinGroup('container > a').addEventListener(MouseEvent.CLICK, function (event) {
                        var current = self.currentPages();
                        var page = parseInt(this.property('pageIndex')) || current;
                        switch (this.property(SkinGroup.NAME)) {
                            case 'firstPage':
                                page = 1;
                                break;
                            case 'prevPage' :
                                page = Math.max(current - 1, 1);
                                break;
                            case 'nextPage' :
                                page = Math.min(current + 1, totalPages);
                                break;
                            case 'lastPage' :
                                page = totalPages;
                                break;
                        }
                        if (page !== current) {
                            self.currentPages(page);
                        }
                    });
                }

                if( eventType.indexOf(MouseEvent.MOUSE_WHEEL) )
                {
                    EventDispatcher( options.wheelTarget || document ).addEventListener(MouseEvent.MOUSE_WHEEL,function(event){
                        var current = self.currentPages();
                        self.currentPages( event.wheelDelta > 0 ? current-1 : current+1 );
                    })
                }

                this.skinGroup().getSkinGroup('container > button').addEventListener( MouseEvent.CLICK,function(event){
                    if( event.type===MouseEvent.CLICK  || (KeyboardEvent.KEYPRESS===event.type && event.keycode==13 ) )
                    {
                        self.currentPages( this.current('input').property('value')  );
                    }
                });

                update.call(this, totalPages , self.currentPages() );

            },false,0, this);
        }
        return  this.__template__;
    }

    /**
     * @private
     * @param totalPages
     * @param currentPages
     */
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

        var hiddenLeft = this.skinGroup().getSkinGroup('container > '+SkinGroup.skinName('hiddenLeft') );
        var hiddenRight = this.skinGroup().getSkinGroup('container > '+SkinGroup.skinName('hiddenRight') );
        hiddenLeft.display( links[0] > 1, 'inline-block' )
        hiddenRight.display( links[ links.length-1 ] < totalPages , 'inline-block');
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
        currentPages= Math.min( Math.max(currentPages, 1), this.totalPages() );
        if( this.__display__ === true )
        {
            var event = new PaginationEvent(PaginationEvent.GOTO);
            event.index= currentPages;
            if( !this.dispatchEvent( event ) )
              return this;
        }
        if( dataSource )
        {
           dataSource.currentPages(currentPages);
        }
        this.__currentPages__ = currentPages;
        return this;
    }

    /**
     * @private
     */
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

        totalPages = this.totalPages();
        currentPages = this.currentPages();

        var options =  this.options();
        var skinGroup = this.skinGroup();
        var skinObject = skinGroup.skinObject();

        if( this.__display__ !== true )
        {
            this.__display__ = true;
            if( skinGroup.validateSkin() )
            {
                this.template().dispatchEvent( new TemplateEvent( TemplateEvent.REFRESH ) );
            }else
            {
                skinObject.skins.links = Utils.repeat(skinObject.skins.link, options.links);
                var tpl = this.template().viewport(this.skinGroup());
                if( skinObject.skins['totalPage'] )
                {
                    skinObject.skins['totalPage']=skinObject.skins['totalPage'].replace('{total}', totalPages);
                }
                var skin = options.themeSkin.replace(/\{(\w+)\}/g, function (all, name) { return skinObject.skins[name] || ''; });
                tpl.render(skin);
            }

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
            'totalPage':'<span>总共{total}页</span>',
            'firstPage':'<a>第一页</a>',
            'prevPage' :'<a>上一页</a>',
            'link':'<a></a>',
            'nextPage' :'<a>下一页</a>',
            'lastPage' :'<a>最后页</a>',
            'hiddenLeft':'<span>...</span>',
            'hiddenRight':'<span>...</span>',
            'goto':'{skins input+button}',
            'input':'<input />',
            'button':'<button>跳转到</button>'
        },{
            'container':{ 'width':'100%','height':'auto',textAlign:'center','userSelect':'none'} ,
            'a':{cursor:'pointer'},
            'a,span,input,button,.totalPage':{display:'inline-block','height':'22px','line-height':'22px'},
            'a,span':{ 'width':'auto','padding':'0px 8px',margin:'0px 2px','color':'#333333','backgroundColor':'#ffffff','textDecoration':'none'},
            'a.link':{ 'border':'solid 1px #333333'},
            'a.current':{'backgroundColor':'#444444','color':'#ffffff' , 'border':'solid 1px #333333'},
            'input':{'width':'40px',margin:'0px 2px','padding':'0px'},
            'button':{'width':'auto',margin:'0px 2px','padding':'0px 2px'},
            '.totalPage':{float:'left','color':'#666666'},
            'a.disabled':{'color':'#999999','cursor':'auto'}
        },{
            'link':{'class':'link'},
            'totalPage':{'class':'totalPage'}
        },['firstPage','prevPage','nextPage','lastPage']);
        return skinObject;
    }

    function PaginationEvent(type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    PaginationEvent.prototype=new BreezeEvent();
    PaginationEvent.prototype.constructor=PaginationEvent;
    PaginationEvent.prototype.index=NaN;
    PaginationEvent.GOTO='paginationGoto';

    window.Pagination= Pagination;
    window.PaginationEvent= PaginationEvent;

})( window )
