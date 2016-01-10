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
        this.fetch();
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
     * @returns {*|Window.Template}
     */
    DataRender.prototype.template=function()
    {
        if( this.__template__=== null )
        {
            var self = this;
            this.__template__=new Template();
            this.__template__.addEventListener(TemplateEvent.REFRESH,function(event)
            {
                var dataSource=self.dataSource();
                Breeze('[data-bind]', event.viewport).forEach(function(elem,index){

                    var name  = this.property('data-bind');
                    var index = dataSource.offsetIndex( index );
                    if( typeof dataSource[index] !== "undefined" )
                    {
                        var binder = this.data('dataBinder');
                        if ( !(binder instanceof Bindable) ) {
                            binder = new Bindable()
                            this.data('dataBinder', binder);
                        }
                        binder.bind(dataSource[index], name);
                    }

                }).addEventListener(PropertyEvent.CHANGE,function(event)
                {
                    var newValue= this.property('value');
                    var property= this.property('data-bind');
                    var binder = this.data('dataBinder');
                    if( binder instanceof  Bindable )
                    {
                        var result = binder.property(property,newValue);
                        var index = dataSource.offsetIndex( this.property('data-index') );

                        if(result && !isNaN(index) && dataSource.hasEventListener( DataSourceEvent.ALTER ) && typeof dataSource[ index ] !== "undefined" )
                        {
                            var ev = new DataSourceEvent(DataSourceEvent.ALTER);
                            ev.originalEvent=event;
                            ev.item= dataSource[ index ];
                            ev.index = index;
                            dataSource.dispatchEvent( ev );
                        }
                    }
                })
            })
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