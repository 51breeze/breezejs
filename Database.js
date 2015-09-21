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
            var event = new StorageEvent(type)
            event.item=item;
            event.index = index;
            this.dispatchEvent( event );
        }
    }

    function Database()
    {
        if( !(this instanceof Database) )
        {
            return new Database();
        }
        EventDispatcher.call(this);

        var httpRequest=null;
        var pageRows= 20;
        var totalRows = NaN;
        var pageIndex = 1;

        /**
         * 每页显示数据行数
         * @param number rows
         * @returns {Database}
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
         * @returns {Database}
         */
        this.page=function()
        {
            return pageIndex || 1;
        }

        /**
         * 获取数据
         * @returns {Database}
         */
        this.fetch=function( num )
        {
            if( this.__changed__ || (num > 0 && pageIndex !== num) )
            {
                pageIndex = num;
                var rows=this.length,start=0;

                //如果有开启分页功能
                if( this.pageEnable() )
                {
                    var page = max( pageIndex, 1 )-1;
                    rows = this.rows();
                    start = page * rows;

                    //预加载 1 个分页的数据
                    if( !this.__changed__ && this.length - start <= rows*1 && this.hasEventListener( StorageEvent.LOAD_START ) )
                    {
                        var  event = new StorageEvent( DataRenderEvent.LOAD_START);
                        event.beforehand = (this.length > start+rows);
                        !event.beforehand && (this.__changed__=true);

                        this.dispatchEvent( new StorageEvent( event ) );

                        //如果不是预加载数据，等待数据加载完成才能渲染
                        if( !event.beforehand )
                        {
                            return this;
                        }
                    }
                }

                //需要分页的数据
                var event = new StorageEvent( DataRenderEvent.PAGE_CHANGED )
                event.data =  this.slice( start, start+rows );
                this.dispatchEvent( event );
            }
            this.__changed__=false;
            return this;
        }

        this.limit=function(rows,offset)
        {

        }



        /**
         * 数据总计
         * @param number num
         * @returns {Database}
         */
        this.total=function( num )
        {
            if( num >= 0 ) {
                totalRows = num;
                return this;
            }
            return totalRows || this.length;
        }

        var pageEnable = false;

        /**
         * 启用分页开关
         * @param val
         * @returns {Database}
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
         * 远程请求对象
         * @returns {*|window.HttpRequest}
         */
        this.http=function()
        {
            return httpRequest || ( httpRequest = new HttpRequest() );
        }

    }

    Database.prototype = new EventDispatcher()
    Database.prototype.constructor=Database;

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
    Database.prototype.source=function( source , option )
    {
        if( typeof source==='string' && /^https?:\/\/[\w\.]+$/.test( source ) )
        {
            option = option ? Breeze.extend(true,{},defaultOption, option) : option;
            var http = this.http();
            var rows = Math.max(option.response.rowsProfile, this.rows() );
            var beforehand = false;
            var load = function (event)
            {
                beforehand = !!event.beforehand;
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
                        self.total( data[ totalProfile ] );
                    }
                }

                //没有可加载的数据，直接删除事件侦听
                if( data instanceof Array && data.length<rows )
                {
                    self.removeEventListener( StorageEvent.LOAD_START );
                }

                data = typeof dataProfile === 'string' && typeof data[ dataProfile ] !== 'undefined' ? data[ dataProfile ] : data;
                var len = self.length;
                self.splice(len,0,data);

                //如果不是预加载数据
                if( !beforehand ) {
                    dispatch.call(self, data, StorageEvent.ITEM_CHANGED, len);
                }

                if( self.__changed__ )self.fetch();
            })

            this.addEventListener( StorageEvent.LOAD_START, load );
            load();

        }else if( Breeze.isObject(source,true) )
        {
            var len = this.length;
            this.splice(0,len,source);
            dispatch.call(this,source,StorageEvent.ITEM_CHANGED,len);
        }
        return this;
    }

    /**
     * 添加数据项到指定的索引位置
     * @param item
     * @param index
     * @returns {Database}
     */
    Database.prototype.addItem=function(item,index)
    {
        if( item )
        {
            index = typeof index === 'number' ? index : this.length;
            index = index < 0 ? index + this.length+1 : index;
            index = Math.min( this.length, Math.max( index, 0 ) )
            this.splice(index,0,item);
            dispatch.call(this,item,StorageEvent.ITEM_ADD,index);
            dispatch.call(this,item,StorageEvent.ITEM_CHANGED,index);
        }
        return this;
    }

    /**
     * 移除指定索引下的数据项
     * @param index
     * @returns {boolean}
     */
    Database.prototype.removeItem=function( index )
    {
        index = index < 0 ? index+this.length : index;
        if( index < this.length )
        {
            var item=this.splice(index,1);
            dispatch.call(this,item,StorageEvent.ITEM_REMOVE,index);
            dispatch.call(this,item,StorageEvent.ITEM_CHANGED,index);
            return true;
        }
        return false;
    }


    function StorageEvent( src, props ){ BreezeEvent.call(this, src, props);}
    StorageEvent.prototype=new BreezeEvent();
    StorageEvent.prototype.item=null;
    StorageEvent.prototype.index=NaN;
    StorageEvent.prototype.beforehand=false;
    StorageEvent.prototype.data=null;

    StorageEvent.prototype.constructor=DataRenderEvent;
    StorageEvent.ITEM_ADD='itemAdd';
    StorageEvent.ITEM_REMOVE='itemRemove';
    StorageEvent.ITEM_CHANGED='itemChanged';
    StorageEvent.LOAD_START='loadStart';
    StorageEvent.LOAD_COMPLETE='loadComplete';
    StorageEvent.PAGE_CHANGED='pageChanged';

    window.Storage=Database
    window.StorageEvent=StorageEvent



})(window)