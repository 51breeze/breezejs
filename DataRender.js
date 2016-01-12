/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */


(function(window,undefined){

    /**
     * 数据渲染器
     * @param template
     * @returns {DataRender}
     * @constructor
     */
    function DataRender()
    {
        if( !(this instanceof DataRender) )
        {
            return new DataRender();
        }
        DataSource.call(this);
        this.addEventListener(DataSourceEvent.SELECT,function(event)
        {
            var data = event.data;
            var view = this.__view__;
            this.template().variable( this.dataProfile(), data ).render( view );
        })
    }

    DataRender.prototype = new DataSource();
    DataRender.prototype.constructor=DataRender;

    /**
     * 显示视图
     * @returns {DataRender}
     */
    DataRender.prototype.display=function( view )
    {
        this.__view__=view;
        this.select();
        return this;
    }

    /**
     * 视口元素
     * @param viewport
     * @returns {DataRender}
     */
    DataRender.prototype.viewport=function( viewport )
    {
        if( typeof viewport === "undefined")
            return this.template().viewport();
        this.template().viewport( viewport );
        return this;
    }

    /**
     * @private
     */
    DataRender.prototype.__template__=null;

    /**
     * 返回模板编译器
     * @param Template template
     * @returns {*|Template}
     */
    DataRender.prototype.template=function( template )
    {
        if( template instanceof Template )
        {
            this.__template__ = template;
        }
        if( this.__template__=== null )
        {
            this.__template__=new Template();
        }
        return this.__template__;
    }

    /**
     * @type {boolean}
     * @private
     */
    DataRender.prototype.__pagination__=null;

    /**
     * @param pageContaine
     * @returns {boolean}
     */
    DataRender.prototype.pagination=function( pageContaine )
    {
        if( typeof pageContaine === "string" || pageContaine instanceof Breeze )
        {
            this.__pagination__ = new Pagination( this );
            this.__pagination__.viewport( pageContaine );

        }else if( pageContaine === false )
        {
            if( this.__pagination__ instanceof Pagination )
                this.__pagination__.undisplay(true);
            this.__pagination__=null;
        }
        return this.__pagination__;
    }

    /**
     * @type {string}
     * @private
     */
    DataRender.prototype.__dataProfile__='data';

    /**
     * @param profile
     * @returns {*}
     */
    DataRender.prototype.dataProfile=function( profile )
    {
        if( typeof profile === "string" )
        {
            this.__dataProfile__ = profile;
            return this;
        }
        return this.__dataProfile__;
    }

    window.DataRender=DataRender;
    window.DataRenderEvent=DataSourceEvent;

})(window)