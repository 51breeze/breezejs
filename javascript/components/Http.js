/*
* BreezeJS Http class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require System,Object,EventDispatcher,JSON,HttpEvent,Math,Window,Event
*/

var isSupported=false;
var XHR=null;
var localUrl='';
var patternUrl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/;
var protocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/;
var patternHeaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg;
var localUrlParts=[];
var setting = {
    async: true
    , dataType: 'html'
    , method: 'GET'
    , timeout: 30
    , charset: 'UTF-8'
    , header: {
        'contentType': 'application/x-www-form-urlencoded'
        ,'Accept': "text/html"
        ,'X-Requested-With': 'XMLHttpRequest'
    }
};

if( typeof window !=="undefined" )
{
    XHR = window.XMLHttpRequest || window.ActiveXObject;
    isSupported= !!XHR;
    localUrl = window.location.href;
    localUrlParts = patternUrl.exec( localUrl.toLowerCase() ) || [];
}

/**
 * @private
 * 完成请求
 * @param event
 */
function done(event)
{
    var xhr = event.currentTarget;
    var options = this.__options__;
    if (xhr.readyState !== 4)return;
    var match, result = null, headers = {};
    if (xhr && xhr.__timeoutTimer__)
    {
        System.clearTimeout(xhr.__timeoutTimer__);
        xhr.__timeoutTimer__ = null;
    }
    //获取响应头信息
    if( typeof xhr.getAllResponseHeaders === "function" )
    {
        while ( ( match = patternHeaders.exec(xhr.getAllResponseHeaders()) ) )
        {
            headers[match[1].toLowerCase()] = match[2];
        }
    }
    this.__responseHeaders__=headers;
    if (xhr.status >= 200 && xhr.status < 300)
    {
        result = xhr.responseXML;
        if (options.dataType.toLowerCase() === Http.TYPE.JSON)
        {
            try {
                result = JSON.parse( xhr.responseText );
            } catch (e) {
                throw new Error('Invalid JSON the ajax response');
            }
        }
    }
    var d =  xhr.__event__;
    if( d )
    {
        d.removeEventListener(Event.LOAD, done);
        d.removeEventListener(Event.LOAD_START, loadStart);
        d.removeEventListener(Event.PROGRESS, progress);
        d.removeEventListener(Event.ERROR, error);
    }
    var e = new HttpEvent( HttpEvent.SUCCESS );
    e.originalEvent = event;
    e.data = result;
    e.status = xhr.status;
    e.url = xhr.__url__;
    this.dispatchEvent(e);
    xhr.__done__=true;
};

function loadStart(event)
{
    var e = new HttpEvent(HttpEvent.LOAD_START);
    var xhr = event.currentTarget;
    e.url = xhr.__url__;
    e.originalEvent = event;
    this.dispatchEvent(e);
}

function progress(event)
{
    var e = new HttpEvent(HttpEvent.PROGRESS);
    var xhr = event.currentTarget;
    e.url = xhr.__url__;
    e.originalEvent = event;
    e.loaded = event.loaded;
    e.total = event.total;
    this.dispatchEvent(e);
}

function error() {
    var e = new HttpEvent(HttpEvent.ERROR);
    var xhr = event.currentTarget;
    e.url = xhr.__url__;
    e.originalEvent = event;
    this.dispatchEvent(e);
}

/**
 * HTTP 请求类
 * @param options
 * @returns {Http}
 * @constructor
 */
function Http( options )
{
    if( !isSupported )throw new Error('Http the client does not support');
    if ( !(this instanceof Http) )return new Http(options);
    this.__options__=Object.merge(true, setting, options);
    EventDispatcher.call(this);
}
System.Http=Http;

/**
 * Difine constan Http accept type
 */
Http.ACCEPT = {
    XML: "application/xml,text/xml",
    HTML: "text/html",
    TEXT: "text/plain",
    JSON: "application/json, text/javascript",
    ALL: "*/*"
};

/**
 * Difine constan Http contentType data
 */
Http.FORMAT = {
    X_WWW_FORM_URLENCODED: "application/x-www-form-urlencoded",
    FORM_DATA: "multipart/form-data",
    PLAIN: "text/plain",
    JSON: "application/json"
};

/**
 * Difine constan Http dataType format
 */
Http.TYPE = {
    HTML: 'html',
    XML: 'xml',
    JSON: 'json',
    JSONP: 'jsonp'
};

/**
 * Difine Http method
 */
Http.METHOD = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT'
};

/**
 * 继承事件类
 * @type {Object|Function}
 */
Http.prototype = Object.create( EventDispatcher.prototype );
Http.prototype.constructor = Http;
Http.prototype.__options__={};
Http.prototype.__xhr__=null;

//ajax 实例对象池
var pool=[];

/**
 * 取消请求
 * @returns {Boolean}
 */
Http.prototype.abort = function abort()
{
    var xhr;
    for(var i in pool )if( pool[i].__target__=== this )xhr = pool[i];
    if (xhr) {
        if( typeof xhr === "function" )xhr.abort();
        var event = new HttpEvent(HttpEvent.CANCELED);
        event.data = null;
        event.status = -1;
        event.url = xhr.__url__;
        this.dispatchEvent(event);
        xhr.__done__=true;
        return true;
    }
    return false;
};

/**
 * 获取一个ajax实例对象
 * @param target
 * @returns {*}
 */
function getInstance( target )
{
    var obj=null;
    var index=0;
    do{
        obj = pool[index];
        if( !obj )
        {
            obj=new XHR("Microsoft.XMLHTTP");
            obj.__done__=true;
            obj.__event__ = EventDispatcher(obj);
            pool[index]=obj;
        }
        index++;
    }while( !(obj && obj.__done__) && index < 10 );
    obj.__target__ = target;
    var d =  obj.__event__;
    d.addEventListener(Event.LOAD,done,false,0,target);
    if( target.hasEventListener(HttpEvent.LOAD_START) )d.addEventListener(Event.LOAD_START, loadStart, false, 0, target);
    if( target.hasEventListener(HttpEvent.PROGRESS) )d.addEventListener(Event.PROGRESS,progress, false, 0, target);
    if( target.hasEventListener(HttpEvent.ERROR) )d.addEventListener(Event.ERROR,error, false, 0, target);
    return obj;
}

/**
 * 发送请求
 * @param data
 * @returns {boolean}
 */
Http.prototype.load = function load(url, data, method)
{
    if (typeof url !== "string")Internal.throwError('error','Invalid url');
    var options = this.__options__;
    var async = !!options.async;
    var method = method || options.method;
    var xhr;
    if (typeof method === 'string')
    {
        method = method.toUpperCase();
        if (!(method in Http.METHOD))throw new Error('Invalid method for ' + method);
    }

    try{
        if (options.dataType.toLowerCase() === 'jsonp')
        {
            xhr = new ScriptRequest( async );
            xhr.addEventListener(HttpEvent.SUCCESS, function (event) {
                if (xhr.__timeoutTimer__)
                {
                    System.clearTimeout(xhr.__timeoutTimer__);
                    xhr.__timeoutTimer__ = null;
                }
                this.dispatchEvent(event);
            }, false, 0, this);
            xhr.__url__ = url;
            xhr.send(url, data, method);

        } else
        {
            xhr = getInstance(this);
            data = data != null ? System.serialize(data, 'url') : null;
            if (method === Http.METHOD.GET && data) {
                if (data != '')url += /\?/.test(url) ? '&' + data : '?' + data;
                data = null;
            }
            xhr.open(method, url, async);

            //设置请求头
            if (typeof xhr.setRequestHeader === 'function')
            {
                //如果请求方法为post
                if (method === Http.METHOD.POST)
                {
                    options.header.contentType = "application/x-www-form-urlencoded";
                }
                if (!/charset/i.test(options.header.contentType))options.header.contentType += ';' + options.charset;
                try {
                    var name;
                    for (name in options.header) {
                        xhr.setRequestHeader(name, options.header[name]);
                    }
                } catch (e) {
                }
            }

            //设置可以接收的内容类型
            if (xhr.overrideMimeType && options.header.Accept)
            {
                xhr.overrideMimeType(options.header.Accept);
            }
            xhr.__done__=false;
            xhr.__url__ = url;
            xhr.send(data);
        }

    } catch (e)
    {
        throw new Error('Http the client does not support');
    }

    //设置请求超时
    xhr.__timeoutTimer__ = System.setTimeout((function (xhr,url,self) {
        return function () {
            xhr.abort();
            if(self.hasEventListener(HttpEvent.TIMEOUT))
            {
                var event = new HttpEvent(HttpEvent.TIMEOUT);
                event.data =null;
                event.status = 408;
                event.url = url
                self.dispatchEvent(event);
            }
            if (xhr.__timeoutTimer__)
            {
                System.clearTimeout(xhr.__timeoutTimer__);
                xhr.__timeoutTimer__ = null;
            }
        }
    })(xhr,url,this), options.timeout * 1000);
    return true;
};

/**
 * 设置Http请求头信息
 * @param name
 * @param value
 * @returns {Http}
 */
Http.prototype.setRequestHeader = function setRequestHeader(name, value) {
    var options = this.__options__;
    if (typeof value !== "undefined" && !this.__xhr__ )
    {
        options.header[name] = value;
    }
    return this;
};

/**
 * 获取已经响应的头信息
 * @param name
 * @returns {null}
 */
Http.prototype.getResponseHeader = function getResponseHeader(name) {
    var responseHeaders = this.__responseHeaders__;
    if( !responseHeaders )return '';
    return typeof name === 'string' ? responseHeaders[ name.toLowerCase() ] || '' : responseHeaders;
};

//脚本请求队列
var queues = [];

/**
 * 通过脚本请求服务器
 * @returns {ScriptRequest}
 * @constructor
 */
function ScriptRequest( async )
{
    if (!(this instanceof ScriptRequest)) {
        return new ScriptRequest();
    }
    var target = document.createElement('script');
    target.setAttribute('type', 'text/javascript');
    EventDispatcher.call(this, target);
    queues.push(this);
    this.__key__ = 's'+queues.length+System.time();
    this.__target__ = target;
    this.__async__ = !!async;
}

ScriptRequest.prototype = new EventDispatcher();
ScriptRequest.prototype.constructor = ScriptRequest;
ScriptRequest.prototype.__key__ = null;
ScriptRequest.prototype.__target__ = null;
ScriptRequest.prototype.__async__ = null;
ScriptRequest.prototype.__sended__ = false;

/**
 * 开始请求数据
 * @param url
 * @param data
 * @param async
 */
ScriptRequest.prototype.send = function send(url, data)
{
    if (this.__sended__)return false;
    this.__sended__ = true;
    if (typeof url !== 'string')throw new Error('Invalid url.');
    var param = [];
    if(data!=null)param.push( System.serialize(data, 'url') );
    param.push('k=' + this.__key__ );
    param = param.join('&');
    url += !/\?/.test(url) ? '?' + param : '&' + param;
    var target = this.__target__;
    if( this.__async__ )target.setAttribute('async', 'async');
    target.setAttribute('src', url);
    if (!target.parentNode) {
        (document.head || document.getElementsByTagName("head")[0]).appendChild(target);
    }
};

/**
 * 终止请求
 */
ScriptRequest.prototype.abort = function ()
{
    this.__canceled__ = true;
    var target = this.__target__;
    if (target && target.parentNode) {
        target.parentNode.removeChild(target);
    }
    return true;
};

/**
 * 脚本请求后的响应回调函数
 * @param data 响应的数据集
 * @param key 向服务器请求时的 key。 此 key 是通知每个请求对象做出反应的唯一编号。
 * @public
 */
Http.JSONP_CALLBACK = function JSONP_CALLBACK(data, key)
{
    var index = Math.max(queues.length - 1, 0);
    if (typeof key !== "undefined") while (index > 0) {
        if (queues[index].__key__ == key)break;
        index--;
    }
    if (queues[index] && queues[index].__key__ == key)
    {
        var target = queues.splice(index, 1).pop();
        if (!target.__canceled__) {
            var event = new HttpEvent(HttpEvent.SUCCESS);
            event.data = data;
            event.status = 200;
            target.dispatchEvent(event);
        }
    }
}
if( typeof window !=="undefined" )
{
   window.JSONP_CALLBACK=Http.JSONP_CALLBACK;
}