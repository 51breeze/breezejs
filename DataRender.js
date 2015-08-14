/**
 * Created by Administrator on 15-8-7.
 */


(function(window,undefined){

    function DataRender( data )
    {
        if( !(this instanceof DataRender) )
        {
            return new DataRender( data );
        }
        EventDispatcher.call(this);
        var items=[].concat( data || [] );
        this.length = items.length;

        var dispatch=function(item,type)
        {
            if( this.hasEventListener(type) )
            {
                var event = new DataRenderEvent(type)
                event.item=item;
                this.dispatchEvent( event );
            }
        }

        this.addItem=function(item,index)
        {
            if( item )
            {
                index = typeof index === 'number' ? index : items.length;
                index = index < 0 ? index + items.length+1 : index;
                index = Math.min( items.length, Math.max( index, 0 ) )
                items.splice(index,0,item);
                this.length = items.length;
                dispatch.call(this,item,DataRenderEvent.ITEM_ADD);
                dispatch.call(this,item,DataRenderEvent.ITEM_CHANGED);
            }
            return this;
        }

        this.removeItem=function( index )
        {
            index = index < 0 ? index+items.length : index;
            if( index < items.length )
            {
                var item=items.splice(index,1);
                this.length = items.length;
                dispatch.call(this,item,DataRenderEvent.ITEM_REMOVE);
                dispatch.call(this,item,DataRenderEvent.ITEM_CHANGED);
                return true;
            }
            return false;
        }

        this.indexToItem=function( index )
        {
            if( typeof index === 'number' )
            {
                index = index < 0 ? index+ items.length : index;
                index = Math.min( items.length-1, Math.max( index, 0 ) )
                return items[ index ];
            }
            return null;
        }

        this.itemToIndex=function( item )
        {
            return items.indexOf( item );
        }

        this.toArray=function()
        {
            return items.slice(0);
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
                items.concat( data );
                dispatch.call(this,data,DataRenderEvent.ITEM_CHANGED);
            }
        }
    }

    DataRender.prototype = new EventDispatcher()
    DataRender.prototype.constructor=DataRender;

    function DataRenderEvent( src, props ){ BreezeEvent.call(this, src, props);}
    DataRenderEvent.prototype=new BreezeEvent();
    DataRenderEvent.prototype.item=null;
    DataRenderEvent.prototype.constructor=DataRenderEvent;
    DataRenderEvent.ITEM_ADD='itemAdd';
    DataRenderEvent.ITEM_REMOVE='itemRemove';
    DataRenderEvent.ITEM_CHANGED='itemChanged';

    window.DataRender=DataRender
    window.DataRenderEvent=DataRenderEvent

})(window)