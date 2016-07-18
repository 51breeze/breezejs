/*
 * BreezeJS Http class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */


define('Http',['EventDispatcher','events/HttpEvent'],function(EventDispatcher,HttpEvent)
{
    'use strict'

    var XHR=window.XMLHttpRequest || window.ActiveXObject
        ,localUrl = location.href
        ,patternUrl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/
        ,protocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/
        ,patternHeaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg
        ,localUrlParts = patternUrl.exec( localUrl.toLowerCase() ) || []
        ,setting={
            async:true
            ,dataType: 'html'
            ,method:'GET'
            ,timeout:30
            ,charset:'UTF-8'
            ,header:{
                'contentType': 'application/x-www-form-urlencoded'
                ,'Accept':"text/html"
                ,'X-Requested-With':'XMLHttpRequest'
            }
        }

    var dispatchEvent=function( type, data, status,xhr)
    {
        if( this.__xhrs__ && this.__xhrs__.length >0 )
        {
            var index = this.__xhrs__.indexOf( xhr );
            this.__xhrs__.splice(index,1);
        }
        if( this.hasEventListener( type ) )
        {
            var event = new HttpEvent( type );
            event.data = data || null
            event.status = status || 0;
            event.url=xhr.__url__ || null;
            this.dispatchEvent( event );
        }
        if(xhr && xhr.__timeoutTimer__ )
        {
            clearTimeout( xhr.__timeoutTimer__ );
            xhr.__timeoutTimer__= null;
        }
    }

    var done=function(event){

        var xhr = event.currentTarget;
        var options= this.__options__;
        if( xhr.readyState !==4 )return;
        var match,result=null,type =HttpEvent.ERROR,headers={};
        dispatchEvent.call( this, HttpEvent.DONE , null, 4, xhr);

        //获取响应头信息
        while( ( match = patternHeaders.exec( xhr.getAllResponseHeaders() ) ) )
        {
            headers[ match[1].toLowerCase() ] = match[ 2 ];
        }
        this.__responseHeaders__=headers;
        if( xhr.status >=200 && xhr.status < 300 )
        {
            result = xhr.responseXML;
            if(  options.dataType === Http.TYPE.JSON )
            {
                try{
                    result = eval("(" + xhr.responseText + ")");
                }catch(e){
                    result=null;
                };
            }
        }
        dispatchEvent.call(this, result!==null ? HttpEvent.SUCCESS : type , result, xhr.status ,xhr);
    }


    /**
     * HTTP 请求类
     * @param options
     * @returns {Http}
     * @constructor
     */
    function Http( options )
    {
        if( !(this instanceof Http) )
        {
            return new Http( options );
        }
        this.__options__ = Breeze.extend(true,setting,options);
        var dataType= this.__options__.dataType.toLowerCase();
        this.__options__.dataType= dataType;
        EventDispatcher.call(this);
    }

    /**
     * 继承事件类
     * @type {Object|Function}
     */
    Http.prototype = new EventDispatcher();
    Http.prototype.constructor= Http;

    /**
     * 取消请求
     * @returns {Boolean}
     */
    Http.prototype.abort=function()
    {
        var xhr =  this.__xhrs__;
        if ( xhr )
        {
            while( xhr.length >0 ){
                xhr.pop().abort();
            }
            dispatchEvent.call(this,HttpEvent.CANCELED,null,-1);
            return true;
        }
        return false;
    }

    /**
     * 当前Http 是否有正请求的任务
     * @returns {boolean}
     */
    Http.prototype.loading=function()
    {
       return (this.__xhrs__ && this.__xhrs__.length>0);
    }

    /**
     * 发送请求
     * @param data
     * @returns {boolean}
     */
    Http.prototype.send=function( url, data, method)
    {
        if( typeof url !== "string" )
          throw new Error('url must is string');

        var options= this.__options__;
        var async = !!options.async;
        var method = method || options.method;

        try{
            var xhr
            if( options.dataType === 'jsonp' )
            {
                xhr =new ScriptRequest();
                xhr.addEventListener([BreezeEvent.LOAD,HttpEvent.SUCCESS],function(event){
                    dispatchEvent.call(this,event.type,event.data || null,4,xhr);
                },false,0,this);

            }else{
                xhr = new XHR("Microsoft.XMLHTTP");
                EventDispatcher(xhr).addEventListener(BreezeEvent.LOAD,done,false,0,this);
            }

        }catch(e){
            throw new Error('Http the client does not support');
        }

        if( typeof method==='string' )
        {
            method=method.toUpperCase()
            if( !(method in Http.METHOD) )
            {
                throw new Error('invalid method for '+method);
            }
        }

        if( xhr instanceof ScriptRequest )
        {
            xhr.send(url,data,async);

        }else
        {
            data = Breeze.serialize( data ,'url') || null;
            if( method === Http.METHOD.GET && data)
            {
                if( data !='' )url+=/\?/.test(url) ? '&'+data : '?'+data;
                data=null;
            }
            xhr.open(method,url,async);

            //如果请求方法为post
            if( method === Http.METHOD.POST  )
            {
                options.header.contentType="application/x-www-form-urlencoded";
            }

            //设置请求头
            if( typeof xhr.setRequestHeader === 'function')
            {
                if( !/charset/i.test(options.header.contentType) )options.header.contentType +=';'+ options.charset;
                try {
                    var name
                    for ( name in options.header )
                    {
                        xhr.setRequestHeader( name, options.header[ name ] );
                    }
                } catch(e){}
            }

            //设置可以接收的内容类型
            if( xhr.overrideMimeType && options.header.Accept )
            {
                xhr.overrideMimeType( options.header.Accept )
            }
            xhr.send( data );
        }

        var self = this;
        var x = this.__xhrs__ || (this.__xhrs__=[]);
        x.push(xhr);

        xhr.__url__=url;

        //设置请求超时
        xhr.__timeoutTimer__=setTimeout( (function(xhr){
            return function(){
                xhr.abort();
                dispatchEvent.call(self,HttpEvent.TIMEOUT,null,0,xhr);
            }
        })(xhr), options.timeout * 1000 );
        return true;
    }

    /**
     * 设置Http请求头信息
     * @param name
     * @param value
     * @returns {Http}
     */
    Http.prototype.setRequestHeader=function( name, value )
    {
        var options =  this.__options__;
        if( typeof value !== "undefined" )
        {
            if ( !this.__sended__  )
            {
                options.header[ name ] = value;
            }
        }
        return this;
    }

    /**
     * 获取已经响应的头信息
     * @param name
     * @returns {null}
     */
    Http.prototype.getResponseHeader=function( name )
    {
        var responseHeaders = this.__responseHeaders__;
        return typeof name==='undefined' || !responseHeaders ? responseHeaders || '' : responseHeaders[ name.toLowerCase() ] || '';
    }


    /**
     * Difine constan Http accept type
     */
    Http.ACCEPT={
        XML:"application/xml,text/xml",
        HTML:"text/html",
        TEXT:"text/plain",
        JSON:"application/json, text/javascript",
        ALL:"*/*"
    };

    /**
     * Difine constan Http contentType data
     */
    Http.FORMAT={
        X_WWW_FORM_URLENCODED:"application/x-www-form-urlencoded",
        FORM_DATA:"multipart/form-data",
        PLAIN:"text/plain",
        JSON:"application/json"
    };

    /**
     * Difine constan Http dataType format
     */
    Http.TYPE={
        HTML:'html',
        XML:'xml',
        JSON:'json',
        JSONP:'jsonp'
    }

    /**
     * Difine Http method
     */
    Http.METHOD={
        GET:'GET',
        POST:'POST',
        PUT:'PUT'
    };

    var queues=[];
    
    /**
     * 通过脚本请求服务器
     * @returns {ScriptRequest}
     * @constructor
     */
    function ScriptRequest()
    {
        if( !(this instanceof ScriptRequest) )
        {
            return new ScriptRequest();
        }
        var target = document.createElement( 'script' );
        target.setAttribute('type','text/javascript');
        EventDispatcher.call(this, target );
        queues.push(this);
        this.__key__ = 's'+ queues.length;
        this.__target__ = target;
    }

    ScriptRequest.prototype = new EventDispatcher();
    ScriptRequest.prototype.constructor=ScriptRequest;
    ScriptRequest.prototype.__key__=null;

    /**
     * 编号
     * @returns {Number|*}
     */
    ScriptRequest.prototype.key=function()
    {
        return this.__key__;
    };

    /**
     * 开始请求数据
     * @param url
     * @param data
     * @param async
     */
    ScriptRequest.prototype.send=function( url, data, async )
    {
        if( this.__sended__ )
            return false;
        this.__sended__=true;

        if( typeof url !== 'string' /*|| !patternUrl.test(url)*/ )
        {
            throw new Error('invalid url.');
        }

        var param = [];
        !data || param.push( Breeze.serialize(data,'url') );
        param.push( 'k='+ this.key() );
        param=param.join('&');
        url+=!/\?/.test(url) ? '?'+param : '&'+param;

        var target = this.__target__;
        //if( async )target.setAttribute('async', 'async');

        target.setAttribute('src', url );
        if( !target.parentNode )
        {
            (document.head || document.getElementsByTagName( "head" )[0]).appendChild( target );
        }
    }

    /**
     * 终止请求
     */
    ScriptRequest.prototype.abort=function()
    {
        this.__canceled__=true;
        var target = this.__target__;
        if( target && target.parentNode )
        {
            target.parentNode.removeChild( target );
        }
        return true;
    }

    /**
     * 脚本请求后的响应回调函数
     * @param data 响应的数据集
     * @param key 向服务器请求时的 key。 此 key 是通知每个请求对象做出反应的唯一编号。
     */
    function callback(data, key )
    {
        var index = Math.max(queues.length-1,0);
        if( typeof key !== "undefined" ) while(index>0)
        {
            if( queues[index].key() == key  )break;
            index--;
        }

        if( queues[index] && queues[index].key() == key)
        {
            var target = queues.splice(index,1).pop();
            if( !target.__canceled__)
            {
                var event = new HttpEvent( HttpEvent.SUCCESS );
                event.data = data;
                event.status=200;
                target.dispatchEvent( event );
            }
        }
    }

    Http.JSONP = callback;
    return Http;

});
