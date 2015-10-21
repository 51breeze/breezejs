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

    function DataRender( target )
    {
        if( !(this instanceof DataRender) )
        {
            return new DataRender( target );
        }

        DataSource.call(this);

        var _view=null;

        /**
         * 显示视图
         * @returns {DataRender}
         */
        this.display=function( view )
        {
            _view=view;
            this.fetch();
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
            if( _tpl === null )
            {
                _tpl=new Template( target );
                _tpl.addEventListener(TemplateEvent.ADD_TO_CONTAINER, function (event) {
                    if (event.container instanceof Breeze) {
                        bindAction.call(self, event.container);
                    }
                })
            }
            return _tpl ;
        }

        //选择数据
        this.addEventListener(DataSourceEvent.FETCH_DATA,function(event){

            this.template().variable('data', event.data ).render( _view );

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

    DataRender.prototype = new DataSource()
    DataRender.prototype.constructor=DataRender;

    window.DataRender=DataRender;
    window.DataRenderEvent=DataSourceEvent;

})(window)