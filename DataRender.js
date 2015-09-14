/**
 * Created by Administrator on 15-8-7.
 */


(function(window,undefined){

    function DataRender(data)
    {
        if( !(this instanceof DataRender) )
        {
            return new DataRender(data);
        }
        EventDispatcher.call(this,data);

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

        var httpRequest=null;
        var defaultOption={
            'method': HttpRequest.METHOD.GET,
            'dataType':HttpRequest.TYPE.JSON,
            'callback':null,
            'param':''
        };

        this.source=function( data , option )
        {
            if( typeof data==='string' )
            {
                var self=this;
                option= Breeze.extend({},defaultOption,option);
                httpRequest= new HttpRequest()
                httpRequest.open(data,option.method )
                httpRequest.send( option.param )
                httpRequest.addEventListener(HttpEvent.SUCCESS,function(event){

                    var data=null;
                    if( typeof option.callback === 'function' )
                    {
                        data=option.callback.call(self,event);
                    }else
                    {
                        data = event.data;
                    }
                    self.source( data );
                })

            }else
            {
                this.splice(0,0,data);
                dispatch.call(this,this,DataRenderEvent.ITEM_ADD,NaN);
                dispatch.call(this,this,DataRenderEvent.ITEM_CHANGED,NaN);
            }
        }
    }

    DataRender.prototype = new EventDispatcher()
    DataRender.prototype.constructor=DataRender;


    /**
     * 添加数据项到指定的索引位置
     * @param item
     * @param index
     * @returns {DataRender}
     */
    DataRender.prototype.addItem=function(item,index)
    {
        if( item )
        {
            index = typeof index === 'number' ? index : this.length;
            index = index < 0 ? index + this.length+1 : index;
            index = Math.min( this.length, Math.max( index, 0 ) )
            this.splice(index,0,item);
            dispatch.call(this,item,DataRenderEvent.ITEM_ADD,index);
            dispatch.call(this,item,DataRenderEvent.ITEM_CHANGED,index);
        }
        return this;
    }

    /**
     * 移除指定索引下的数据项
     * @param index
     * @returns {boolean}
     */
    DataRender.prototype.removeItem=function( index )
    {
        index = index < 0 ? index+this.length : index;
        if( index < this.length )
        {
            var item=this.splice(index,1);
            dispatch.call(this,item,DataRenderEvent.ITEM_REMOVE,index);
            dispatch.call(this,item,DataRenderEvent.ITEM_CHANGED,index);
            return true;
        }
        return false;
    }



    function DataRenderEvent( src, props ){ BreezeEvent.call(this, src, props);}
    DataRenderEvent.prototype=new BreezeEvent();
    DataRenderEvent.prototype.item=null;
    DataRenderEvent.prototype.index=NaN;
    DataRenderEvent.prototype.constructor=DataRenderEvent;
    DataRenderEvent.ITEM_ADD='itemAdd';
    DataRenderEvent.ITEM_REMOVE='itemRemove';
    DataRenderEvent.ITEM_CHANGED='itemChanged';

    window.DataRender=DataRender
    window.DataRenderEvent=DataRenderEvent

})(window)