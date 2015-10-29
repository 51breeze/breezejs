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

        /**
         * initializing parent class
         */
        EventDispatcher.call(this);

        /**
         * @private
         */
        var _view=null;

        /**
         * 显示视图
         * @returns {DataRender}
         */
        this.display=function( view )
        {
            _view=view;
            this.dataSource().fetch();
            return this;
        }

        /**
         * 视口元素
         * @param viewport
         * @returns {DataRender}
         */
        this.viewport=function( viewport )
        {
            if( typeof viewport === "undefined")
               return this.template().viewport();
            this.template().viewport( viewport );
            return this;
        }

        /**
         * @param num
         * @returns {DataRender}
         */
        this.currentPages=function(num)
        {
            if( num > 0 ) {
                this.dataSource().currentPages(num);
                return this;
            }
            return  this.dataSource().currentPages();
        }

        /**
         * @private
         */
        var _tpl=null;

        /**
         * 返回模板编译器
         * @returns {*|Window.Template}
         */
        this.template=function()
        {
            if( _tpl=== null )
            {
                var self = this;
                _tpl=new Template();
                _tpl.addEventListener(TemplateEvent.REFRESH,function(event)
                {
                    var dataSource=self.dataSource();
                    Breeze('[data-bind]', event.viewport).each(function(){

                        var name  = this.property('data-bind');
                        var index = dataSource.offsetIndex( this.property('data-index') );
                        if( typeof dataSource[index] !== "undefined" )
                        {
                            var binder = this.data('dataBinder');
                            if ( !(binder instanceof Bindable) ) {
                                binder = new Bindable()
                                this.data('dataBinder', binder);
                            }
                            binder.bind(dataSource[index], name);
                        }

                    }).addEventListener(PropertyEvent.PROPERTY_CHANGE,function(event)
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
            return _tpl;
        }


        /**
         * @type {boolean}
         * @private
         */
        var _pageEnable=null;

        /**
         * @param pageContaine
         * @returns {boolean}
         */
        this.pageEnable=function( pageContaine )
        {
            if( typeof pageContaine === "string" || pageContaine instanceof Breeze )
            {
                _pageEnable = new Pagination( this.dataSource() );
                _pageEnable.viewport( pageContaine );

            }else if( pageContaine === false && _pageEnable instanceof Pagination )
            {
                _pageEnable.undisplay(true);
                _pageEnable=false;
            }
            return !!_pageEnable;
        }

        /**
         * 设置数据源
         * @param source
         * @param option
         * @returns {DataRender}
         */
        this.source=function( source,option )
        {
            this.dataSource().source(source,option);
            return this;
        }

        /**
         * @private
         */
        var _dataSource=null;

        /**
         * 获取数据源对象
         * @returns {*|Window.DataSource}
         */
        this.dataSource=function()
        {
            if( _dataSource === null  )
            {
                var self = this;
                _dataSource=new DataSource();
                _dataSource.addEventListener(DataSourceEvent.FETCH,function(event){
                    if( _view ) {
                        self.template().variable('data', event.data).render( _view );
                    }
                });
            }
            return _dataSource;
        }
    }

    DataRender.prototype = new EventDispatcher()
    DataRender.prototype.constructor=DataRender;

    window.DataRender=DataRender;
    window.DataRenderEvent=DataSourceEvent;

})(window)