/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */


(function(window,undefined){


    // 为每行绑定动作行为
    var bindAction=function( target )
    {
        var dataRender = this;
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


    /**
     * 数据渲染器
     * @param template
     * @returns {DataRender}
     * @constructor
     */

    function DataRender( viewport )
    {
        if( !(this instanceof DataRender) )
        {
            return new DataRender( viewport );
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
            this.template().viewport( viewport );
            return this;
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
        var _tpl=null;

        /**
         * 返回模板编译器
         * @returns {*|Window.Template}
         */
        this.template=function()
        {
            return _tpl || ( _tpl=new Template() );
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
                _dataSource=new DataSource();
                var tpl=this.template();
                _dataSource.addEventListener(DataSourceEvent.FETCH_DATA,function(event){

                    tpl.variable('data', event.data ).render( _view );

                }).addEventListener(DataRenderEvent.ITEM_ADD,function(event){

                    if( !isNaN(event.index) )
                    {
                        var target = template.target();
                        var list = Breeze('[data-row]:gt('+event.index+')', target )
                        Breeze('[data-row="'+event.index+'"]',target).removeElement();
                        list.each(function(elem){
                            var val= this.property('data-row');
                            this.property('data-row', val-1 );
                            Breeze('[data-index]', elem ).property('data-index',  val-1 )
                        })
                    }
                });

            }
            return _dataSource || ( _dataSource=new DataSource() );
        }
        this.viewport( viewport );
    }

    DataRender.prototype = new EventDispatcher()
    DataRender.prototype.constructor=DataRender;

    window.DataRender=DataRender;
    window.DataRenderEvent=DataSourceEvent;

})(window)