/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */


(function(window,undefined){


    /**
     * 调度事件
     * @param item
     * @param type
     */
    var dispatch=function(item,type,index)
    {
        if( this.hasEventListener(type) )
        {
            var event = new DataRenderEvent(type)
            event.item=item;
            event.index = index;
            this.dispatchEvent( event );
        }
    }

    function DataRender( template )
    {
        if( !(this instanceof DataRender) )
        {
            return new DataRender( template );
        }

        if( !(template instanceof Template) )
        {
            throw new Error('template instance invalid');
            return this;
        }

        EventDispatcher.call(this);

        this.__changed__=false;

        this.addEventListener(DataRenderEvent.ITEM_ADD,function(event){

            if( !isNaN(event.index) )
            {
                var list = Breeze('[data-row]:gt('+event.index+')', target )
                Breeze('[data-row="'+event.index+'"]',target).removeElement();
                list.each(function(elem){
                    var val= this.property('data-row');
                    this.property('data-row', val-1 );
                    Breeze('[data-index]', elem ).property('data-index',  val-1 )
                })

            }else
            {
                tpl.assign('data', dataRender.toArray() );
                tpl.render( templateContent );
                tpl.addEventListener( TemplateEvent.ADD_TO_CONTAINER,function(event){
                    if( event.container ) {
                        bindAction(event.container);
                    }
                })
            }
        });

        var compiler;
        var storage;

        /**
         * 返回模板编译器
         * @returns {*|Window.Template}
         */
        this.compiler=function()
        {
            return ( compiler || ( compiler=new Template() ) );
        }

        this.storage=function()
        {
            return ( storage || ( storage=new Storage() ) );
        }
    }

    DataRender.prototype = new EventDispatcher()
    DataRender.prototype.constructor=DataRender;


    /**
     * 显示数据
     * @returns {DataRender}
     */
    DataRender.prototype.display=function()
    {
         this.storage().fetch()
    }



    function DataRenderEvent( src, props ){ BreezeEvent.call(this, src, props);}
    DataRenderEvent.prototype=new BreezeEvent();
    DataRenderEvent.prototype.item=null;
    DataRenderEvent.prototype.index=NaN;
    DataRenderEvent.prototype.constructor=DataRenderEvent;
    DataRenderEvent.ITEM_ADD='itemAdd';
    DataRenderEvent.ITEM_REMOVE='itemRemove';
    DataRenderEvent.ITEM_CHANGED='itemChanged';
    DataRenderEvent.LOAD_START='loadStart';
    DataRenderEvent.DATA_AFTER='dataAfter';
    DataRenderEvent.DATA_BEFORE='dataBefore';


    window.DataRender=DataRender
    window.DataRenderEvent=DataRenderEvent

})(window)