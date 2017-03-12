/*
* BreezeJS Http class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require System,Object,EventDispatcher,JSON,HttpEvent,Math,Window
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
    isSupported= typeof XHR === "function";
    localUrl = window.location.href;
    localUrlParts = patternUrl.exec( localUrl.toLowerCase() ) || [];
}

/**
 * 调度相关事件
 * @param type
 * @param data
 * @param status
 * @param xhr
 */
function dispatchEvent(type, data, status, xhr)
{
    if (this.hasEventListener(type))
    {
        var event = new HttpEvent(type);
        event.data = data || null;
        event.status = status || 0;
        event.url = xhr.__url__ || null;
        this.dispatchEvent(event);
    }
    if (xhr && xhr.__timeoutTimer__)
    {
        clearTimeout(xhr.__timeoutTimer__);
        xhr.__timeoutTimer__ = null;
    }
};

/**
 * @private
 * 完成请求
 * @param event
 */
function done(event)
{
    var xhr = event.currentTarget;
    var options = $get(this,"__options__");
    if (xhr.readyState !== 4)return;
    var match, result = null, headers = {};
    dispatchEvent.call(this, HttpEvent.DONE, null, 4, xhr);

    //获取响应头信息
    if( typeof xhr.getAllResponseHeaders === "function" )
    {
        while ( ( match = patternHeaders.exec(xhr.getAllResponseHeaders()) ) )
        {
            headers[match[1].toLowerCase()] = match[2];
        }
    }
    Object.defineProperty(this,'__responseHeaders__',{value:headers});
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
    dispatchEvent.call(this,  HttpEvent.SUCCESS , result, xhr.status, xhr);
};

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
    Object.defineProperty(this,'__options__',{'value':Object.merge(true, setting, options)});
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

/**
 * 取消请求
 * @returns {Boolean}
 */
Http.prototype.abort = function abort()
{
    var xhr = this.__xhr__;
    if (xhr) {
        if( typeof xhr === "function" )xhr.abort();
        dispatchEvent.call(this, HttpEvent.CANCELED, null, -1);
        return true;
    }
    return false;
};

/**
 * 发送请求
 * @param data
 * @returns {boolean}
 */
Http.prototype.send = function send(url, data, method)
{
    if (typeof url !== "string")Internal.throwError('error','Invalid url');
    if ( this.__xhr__ )return true;
    var options = this.__options__;
    var async = !!options.async;
    var method = method || options.method;
    var self = this;
    if (typeof method === 'string')
    {
        method = method.toUpperCase();
        if (!(method in Http.METHOD)) {
            throw new Error('Invalid method for ' + method);
        }
    }

    try {
        var xhr;
        if (options.dataType.toLowerCase() === 'jsonp')
        {
            xhr = new ScriptRequest( async );
            xhr.addEventListener(HttpEvent.SUCCESS, function (event) {
                dispatchEvent.call(this, event.type, event.data || null, 4, xhr);
            }, false, 0, this);
            xhr.send(url, data, method);

        } else
        {
            xhr = new XHR("Microsoft.XMLHTTP");
            EventDispatcher(xhr).addEventListener(Event.LOAD, done, false, 0, this);
            data = System.serialize(data, 'url') || null;
            if (method === Http.METHOD.GET && data)
            {
                if (data != '')url += /\?/.test(url) ? '&' + data : '?' + data;
                data = null;
            }
            xhr.open(method, url, async);

            //如果请求方法为post
            if (method === Http.METHOD.POST)
            {
                options.header.contentType = "application/x-www-form-urlencoded";
            }

            //设置请求头
            if (typeof xhr.setRequestHeader === 'function')
            {
                if (!/charset/i.test(options.header.contentType))options.header.contentType += ';' + options.charset;
                try {
                    var name;
                    for (name in options.header)
                    {
                        xhr.setRequestHeader(name, options.header[name]);
                    }
                } catch (e){}
            }

            //设置可以接收的内容类型
            if (xhr.overrideMimeType && options.header.Accept)
            {
                xhr.overrideMimeType(options.header.Accept)
            }
            xhr.send(data);
        }

    } catch (e) {
        throw new Error('Http the client does not support');
    }

    this.__xhr__={value: xhr};
    xhr.__url__ = url;

    //设置请求超时
    xhr.__timeoutTimer__ = setTimeout((function (xhr) {
        return function () {
            xhr.abort();
            dispatchEvent.call(self, HttpEvent.TIMEOUT, null, 0, xhr);
        }
    })(xhr), options.timeout * 1000);
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

/**
 * 开始请求数据
 * @param url
 * @param data
 * @param async
 */
ScriptRequest.prototype.send = function send(url, data, method)
{
    if (this.__sended__)
        return false;

    this.__sended__ = true;
    if (typeof url !== 'string')
    {
        throw new Error('Invalid url.');
    }

    var param = [];
    !data || param.push( System.serialize(data, 'url') );
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
 * @public Http.JSONP_CALLBACK non-writable non-enumerable
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
