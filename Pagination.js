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
     * @private
     * @param totalPages
     * @param currentPages
     */
    function update(totalPages , currentPages)
    {
        var options = this.options();
        var links = Math.min( options.links,totalPages);
        var offset =  Math.max( currentPages - Math.ceil( links / 2 ), 0 );
        offset = offset+links > totalPages ? offset-(offset+links - totalPages) : offset;
        links = Utils.range(1,links , offset);

        var info = options.profile.info.replace("{totalPage}", this.totalPages() )
            .replace("{totalRows}", this.totalRows() )
            .replace("{rows}", this.rows() )
            .replace("{currentPage}", currentPages );

        this.skinGroup().getSkinGroup('container > '+SkinGroup.skinName('info')).html( info )
        this.skinGroup().getSkinGroup('container > '+SkinGroup.skinName('link') ).display(true,'inline-block').current('.current').removeClass('current').current(null).forEach(function(elem,index){
            this.property('pageIndex',links[index]);
            this.text( links[index] );
            if( currentPages == links[index] )
            {
                this.addClass('current');
            }
        }).gt( links.length-1 ).display(false).revert();

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
     * 分页组件.
     * 此组件包含如下特性：
     * 皮肤元素：{info}{firstPage}{prevPage}{hiddenLeft}{links}{hiddenRight}{nextPage}{lastPage}{goto}
     * 动态变量：{totalPage}{totalRows}{rows}{currentPage} （仅限用于info皮肤下）
     *
     * 这些皮肤元素可以自由组合位置和删减以满足各种需求。
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
            'wheelTarget':null,
            'profile':{'info':'总共{totalRows}条记录','firstPage':'第一页','prevPage':'上一页','nextPage':'下一页','lastPage':'最后页','button':'跳转到'},
            'themeSkin':'{firstPage}{prevPage}{links}{nextPage}{lastPage}{goto}'
        }
        return SkinComponent.call(this,viewport , context);
    }

    Pagination.prototype= new SkinComponent();
    Pagination.prototype.constructor = Pagination;
    Pagination.prototype.componentProfile='pagination';
    Pagination.prototype.initializeMethod=['totalRow','currentPage','rows','display'];

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
            if( Utils.isObject(options) )this.__options__=Utils.extend(true,this.__options__,options);
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
            if( !(dataSource instanceof DataSource) )throw new Error('invalid dataSource');
            this.__dataSource__ = dataSource;
            dataSource.rows( this.rows() )
            var initialized = false;
            dataSource.addEventListener(DataSourceEvent.FETCH,function(event)
            {
                var totalPages = this.totalPages();
                var currentPages = this.currentPage();
                if( initialized === false )
                {
                    initialized = true;
                    var options =  this.options();
                    var skinGroup = this.skinGroup();
                    var skinObject = skinGroup.skinObject();

                    if( this.skinGroup().validateSkin() )
                    {
                        skinObject.skins.links= this.skinGroup().getSkinGroup('container > '+SkinGroup.skinName('link') ).length;
                        this.template().dispatchEvent( TemplateEvent.REFRESH );

                    }else
                    {
                        skinObject.skins.links = Utils.repeat(skinObject.skins.link,options.links );
                        var tpl = this.template().viewport(this.skinGroup());
                        var skin = options.themeSkin.replace(/\{(\w+)\}/g, function (all, name) { return skinObject.skins[name] || ''; });
                        tpl.render(skin);
                    }
                }
                update.call(this, totalPages , currentPages );

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
            this.__template__ = new Template().addEventListener( TemplateEvent.REFRESH ,function(event)
            {
                var self = this;
                var options =  this.options();
                var eventType = new DataArray( options.eventType );
                this.skinGroup().getSkinGroup('container > a,button').forEach(function(){
                    var prop = this.property(SkinGroup.NAME);
                    var profile = options.profile[ prop ];
                    if( profile )
                    {
                        this.text( profile );
                    }
                })

                if( eventType.indexOf(MouseEvent.CLICK) >=0 )
                {
                    this.skinGroup().getSkinGroup('container > a').addEventListener(MouseEvent.CLICK, function (event) {
                        var current = self.currentPage();
                        var page = parseInt(this.property('pageIndex')) || current;
                        switch (this.property(SkinGroup.NAME)) {
                            case 'firstPage':
                                page = 1;
                                break;
                            case 'prevPage' :
                                page = Math.max(current - 1, 1);
                                break;
                            case 'nextPage' :
                                page = Math.min(current + 1, self.totalPages());
                                break;
                            case 'lastPage' :
                                page = self.totalPages();
                                break;
                        }
                        if (page !== current) {
                            self.currentPage(page);
                        }
                    });
                }

                if( eventType.indexOf(MouseEvent.MOUSE_WHEEL)>=0 )
                {
                    EventDispatcher( options.wheelTarget || this.skinGroup()[0] ).addEventListener(MouseEvent.MOUSE_WHEEL,function(event){
                        event.preventDefault();
                        var current = self.currentPage();
                        self.currentPage( event.wheelDelta > 0 ? current-1 : current+1 );
                    });
                }

                this.skinGroup().getSkinGroup('container > button,input').addEventListener( [MouseEvent.CLICK,KeyboardEvent.KEYPRESS],function(event)
                {
                    if( event.type===MouseEvent.CLICK  || (KeyboardEvent.KEYPRESS===event.type && event.keycode==13 ) )
                    {
                        self.currentPage( this.current('input').property('value') );
                    }
                });
                update.call(this, self.totalPages() , self.currentPage() );

            },false,0, this);
        }
        return  this.__template__;
    }

    /**
     * 设置获取总分页数
     * @param number totalPages
     * @returns {*}
     */
    Pagination.prototype.totalPages=function()
    {
        var dataSource = this.dataSource();
        return dataSource ? dataSource.totalPages() : this.totalRows() >0 ? Math.ceil( this.totalRows() / this.rows() ) : 0;
    }

    /**
     * @private
     */
    Pagination.prototype.__totalRows__=0;

    /**
     * 设置获取总分页数
     * @param number totalPages
     * @returns {*}
     */
    Pagination.prototype.totalRows=function( totalRows )
    {
        var dataSource = this.dataSource();
        if( typeof totalRows === "undefined" )
        {
           return dataSource ? dataSource.predicts() : this.__totalRows__;
        }
        this.__totalRows__ = totalRows;
        return this;
    }

    /**
     * @private
     */
    Pagination.prototype.__rows__=20;

    /**
     * 每页显示多少行数据
     * @param number totalPages
     * @returns {*}
     */
    Pagination.prototype.rows=function( rows )
    {
        var dataSource = this.dataSource();
        if( typeof rows === "undefined" )
        {
            return dataSource ? dataSource.rows() : this.__rows__;
        }
        !dataSource || dataSource.rows( rows );
        this.__rows__ = rows;
        return this;
    }

    /**
     * @private
     */
    Pagination.prototype.__currentPage__=1;

    /**
     * 设置获取总分页数
     * @param number totalPages
     * @returns {*}
     */
    Pagination.prototype.currentPage=function( currentPage )
    {
        var dataSource = this.dataSource();
        if( typeof currentPage === "undefined" )
        {
            return dataSource ? dataSource.currentPage() : this.__currentPage__;
        }

        if( currentPage !== this.currentPage() )
        {
            this.__currentPage__ = currentPage;
            if( this.__display__ === true && this.totalPages() > 0 )
            {
                var event = new PaginationEvent(PaginationEvent.CHANGED);
                event.currentPage= currentPage;
                if( !this.dispatchEvent( event ) )
                  return this;
            }
            if( dataSource )
            {
                dataSource.currentPage( currentPage );
            }
        }
        return this;
    }

    /**
     * 显示分页视图
     * @returns {Pagination}
     */
    Pagination.prototype.display=function()
    {
        this.dataSource().fetch();
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
            'info':'<span></span>',
            'firstPage':'<a></a>',
            'prevPage' :'<a></a>',
            'link':'<a></a>',
            'nextPage' :'<a></a>',
            'lastPage' :'<a></a>',
            'hiddenLeft':'<span>...</span>',
            'hiddenRight':'<span>...</span>',
            'goto':'{skins input+button}',
            'input':'<input />',
            'button':'<button></button>'
        },{
            'container':{ 'width':'100%','height':'auto','textAlign':'center','userSelect':'none','marginTop':'10px'} ,
            'a':{'cursor':'pointer'},
            'a,span,input,button':{'display':'inline-block','height':'22px'},
            'input,button':{'line-height':'0px','margin':'0px 2px','padding':'0px 2px','fontSize':'10px'},
            'a,span':{ 'width':'auto','padding':'0px 8px','margin':'0px 2px','color':'#333333','backgroundColor':'#ffffff','textDecoration':'none'},
            'a.link':{ 'border':'solid 1px #333333'},
            'a.current':{'backgroundColor':'#444444','color':'#ffffff'},
            'input':{'width':'40px'},
            'button':{'width':'auto'},
            '.info':{'float':'left','color':'#666666'},
            'a.disabled':{'color':'#999999','cursor':'auto'}
        },{
            'link':{'class':'link'},
            'info':{'class':'info'}
        },['firstPage','prevPage','nextPage','lastPage']);
        return skinObject;
    }

    function PaginationEvent(type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    PaginationEvent.prototype=new BreezeEvent();
    PaginationEvent.prototype.constructor=PaginationEvent;
    PaginationEvent.prototype.currentPage=NaN;
    PaginationEvent.CHANGED='paginationChanged';

    window.Pagination= Pagination;
    window.PaginationEvent= PaginationEvent;

})( window )
