/**
 * Created by Administrator on 15-8-7.
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

        var httpRequest=null;
        var pageRows= 20;
        var totalRows = NaN;
        var pageIndex = 1;

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


        var pageEnable = false;

        /**
         * 启用分页开关
         * @param val
         * @returns {DataRender}
         */
        this.pageEnable=function(val)
        {
            if( val !== undefined )
            {
                pageEnable = !!val;
                return this;
            }
            return pageEnable;
        }


        /**
         * 每页显示数据行数
         * @param number rows
         * @returns {DataRender}
         */
        this.rows=function( rows )
        {
            if( rows >= 0 ) {
                pageRows = rows;
                return this;
            }
            return pageRows;
        }

        /**
         * 显示第几页的数据
         * @param number num
         * @returns {DataRender}
         */
        this.page=function( num )
        {
            if( num > 0 && pageIndex !== num )
            {
                pageIndex = num;
                var event = new DataRenderEvent( DataRenderEvent.DATA_DISPLAY );
                this.dispatchEvent( event );
                return this;
            }
            return pageIndex;
        }

        /**
         * 数据总计
         * @param number num
         * @returns {DataRender}
         */
        this.total=function( num )
        {
            if( num >= 0 ) {
                totalRows = num;
                return this;
            }
            return totalRows || this.length;
        }

        this.http=function()
        {
            return httpRequest || ( httpRequest = new HttpRequest() );
        }
    }

    DataRender.prototype = new EventDispatcher()
    DataRender.prototype.constructor=DataRender;


    var defaultOption={
        'method': HttpRequest.METHOD.GET,
        'dataType':HttpRequest.TYPE.JSON,
        'callback':null,
        'param':'',
        'response':{  //响应的数据包字段
            'dataProfile':'data',  //主体数据
            'totalProfile':'total', //请求条件的数据总数
            'rowsProfile':100       //每批限制拉取的数据量
        }
    };

    /**
     * 请求加载数据源
     * @param source
     * @param option
     * @returns {DataRender}
     */
    DataRender.prototype.source=function( source , option )
    {
        if( typeof source==='string' && /^https?:\/\/[\w\.]+$/.test( source ) )
        {
            option = option ? Breeze.extend(true,{},defaultOption, option) : option;
            var http = this.http();
            var load = function (event)
            {
                var rows = Math.max(option.response.rowsProfile, this.rows() );
                var url = source.replace('%page%', this.page() ).replace('%rows%', rows);
                option.param = option.param.replace('%page%', this.page()).replace('%rows%', rows);
                http.open(url, option.method);
                http.send(option.param);
            }

            http.addEventListener(HttpEvent.SUCCESS, function (event)
            {
                var data = null;
                if (typeof option.callback === 'function') {
                    data = option.callback.call(self, event);
                } else {
                    data = event.data;
                }
                if( data && isNaN(totalRows) )
                {
                    var totalProfile = option['response']['totalProfile'];
                    var dataProfile = option['response']['dataProfile'];
                    if( typeof data[ totalProfile ] === 'number')
                    {
                        totalRows = data[ totalProfile ];
                    }
                }
                data = typeof dataProfile === 'string' && typeof data[ dataProfile ] !== 'undefined' ? data[ dataProfile ] : data;
                var len = self.length;
                self.splice(len,0,data);
                dispatch.call(self,data,DataRenderEvent.ITEM_CHANGED,len);
            })

            this.addEventListener( DataRenderEvent.LOAD_START, load );
            load();

        }else if( Breeze.isObject(source,true) )
        {
            var len = this.length;
            this.splice(0,len,source);
            dispatch.call(this,source,DataRenderEvent.ITEM_CHANGED,len);
        }
        return this;
    }


    /**
     * 显示数据
     * @returns {DataRender}
     */
    DataRender.prototype.display=function()
    {
        var data;
        if( this.pageEnable() )
        {
            var page = this.page()-1;
            var rows = this.rows();
            var start = page * rows;

            //预加载 1 个分页的数据
            if( this.length - start * 1 <= rows && this.hasEventListener( DataRenderEvent.LOAD_START ) )
            {
                this.dispatchEvent( new DataRenderEvent(DataRenderEvent.LOAD_START) );
            }
            data = this.slice( start,rows );

        }else
        {
            data = this.slice( start,  this.length )
        }
        return this;
    }

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
    DataRenderEvent.LOAD_START='loadStart';
    DataRenderEvent.DATA_AFTER='dataAfter';
    DataRenderEvent.DATA_BEFORE='dataBefore';


    window.DataRender=DataRender
    window.DataRenderEvent=DataRenderEvent

})(window)