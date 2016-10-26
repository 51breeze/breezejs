/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */


(function(factory){

    if( typeof define === "function" )
    {
        define( [] , factory );

    }else if (typeof exports === 'object')
    {
        module.exports = factory;

    }else
    {
        factory();
    }

})(function( undefined )
{
    "use strict";

    var Utils= {};


    /**
     * 一组代表某个浏览器的常量
     * @type {string}
     */
   Breeze.BROWSER_IE='IE';
   Breeze.BROWSER_FIREFOX='FIREFOX';
   Breeze.BROWSER_CHROME='CHROME';
   Breeze.BROWSER_OPERA='OPERA';
   Breeze.BROWSER_SAFARI='SAFARI';
   Breeze.BROWSER_MOZILLA='MOZILLA';

    /**
     * @private;
     */
    var _client;

    /**
     * 判断是否为指定的浏览器
     * @param type
     * @returns {string|null}
     */
   Breeze.isBrowser=function(type, version, expr )
    {
        expr = expr || '<';
        if( typeof _client === 'undefined' )
        {
            _client = {};
            var ua = navigator.userAgent.toLowerCase();
            var s;
            (s = ua.match(/msie ([\d.]+)/))             ? _client[Breeze.BROWSER_IE]       = parseFloat(s[1]) :
                (s = ua.match(/firefox\/([\d.]+)/))         ? _client[Breeze.BROWSER_FIREFOX]  = parseFloat(s[1]) :
                    (s = ua.match(/chrome\/([\d.]+)/))          ? _client[Breeze.BROWSER_CHROME]   = parseFloat(s[1]) :
                        (s = ua.match(/opera.([\d.]+)/))            ? _client[Breeze.BROWSER_OPERA]    = parseFloat(s[1]) :
                            (s = ua.match(/version\/([\d.]+).*safari/)) ? _client[Breeze.BROWSER_SAFARI]   = parseFloat(s[1]) :
                                (s = ua.match(/^mozilla\/([\d.]+)/))        ? _client[Breeze.BROWSER_MOZILLA]  = parseFloat(s[1]) : null ;
        }
        var result =_client[type];
        if( typeof result !== "undefined" && typeof version !== 'undefined' )
        {
            version = parseFloat(version);
            if( isNaN(version) )return false;
            eval('result = result ' + expr.replace(/\s*/, '') + ' version;');
        }
        return result;
    };


    /**
     * 选择元素
     * @param mixed selector CSS3选择器
     * @param mixed context  上下文
     * @returns []
     */
    Breeze.querySelector=function(selector, context)
    {
        if( typeof Sizzle === "function" )
        {
            return Sizzle( selector, context);
        }

        //如果选择器不是一个字符串
        if( typeof selector !== "string" )
        {
            return selector && typeof selector.nodeName === "string" && selector.nodeType ?  [ selector ] : [];
        }

        var results;
        var has = false;

        //设置上下文
        if( context && typeof context.nodeName === "string" && context.nodeType && context.nodeType != 9 )
        {
            var id = context.getAttribute('id');
            if( !id || id =='')
            {
                has = true;
                id = 'q'+( new Date().getTime() );
                context.setAttribute('id', id);
            }
            selector = '#'+id+' '+selector;

        }else if( typeof context === "string" )
        {
            selector = context+' '+selector;
        }

        results = Array.prototype.slice.call( document.querySelectorAll(selector) );
        if(has)context.removeAttribute('id');
        return results;
    };

    /**
     * @type {RegExp}
     */
    var singleTagRegex=/^<(\w+)(.*?)\/\s*>$/
        ,tableChildRegex=/^\<(tr|td|th|thead|tbody|tfoot)/i;

    /**
     * 创建HTML元素
     * @param html 一个html字符串
     * @returns {Node}
     */
   Breeze.createElement=function( html )
    {
        if(Breeze.isString(html) )
        {
            html=Breeze.trim( html );
            if( html !== '' )
            {
                var match;
                if( html.charAt(0) !== "<" && html.charAt( html.length - 1 ) !== ">" && html.length >=2 )
                {
                    return document.createElement( html );

                }else if( html.charAt(0) === "<" && ( match=singleTagRegex.exec(html) ) )
                {
                    var elem = document.createElement( match[1] );
                    var attr =Breeze.matchAttr( html );
                    var isset = typeof elem.setAttribute === "function";
                    for(var prop in attr )
                    {
                        if( isset )
                        {
                            elem.setAttribute( prop, attr[prop] );
                        }else{
                            var attrNode = document.createAttribute( prop );
                            attrNode.nodeValue=attr[ prop ];
                            elem.setAttributeNode( attrNode )
                        }
                    }
                    return elem;

                }else if( tableChildRegex.exec(html) )
                {
                    html="<table>"+ html +"</table>";
                }

                var div = document.createElement( "div");
                div.innerHTML =  html;
                var len=div.childNodes.length;

                if(  len > 1 )
                {
                    var fragment= document.createDocumentFragment();
                    while( len > 0 )
                    {
                        --len;
                        fragment.appendChild( div.childNodes.item(0) );
                    }
                    return fragment;
                }
                div=div.childNodes.item(0);
                return div.parentNode.removeChild( div );
            }

        }else if (Breeze.isNodeElement(html) )
            return  html.parentNode ?Breeze.clone(html,true) : html;

        throw new Error('Uitls.createElement param invalid')
    };

    /**
     * 取得当前的时间戳
     * @returns {number}
     */
   Breeze.time=function()
    {
        return ( new Date() ).getTime();
    };

    /**
     * 将字符串的首字母转换为大写
     * @param str
     * @returns {string}
     */
   Breeze.ucfirst=function( str )
    {
        return typeof str === "string" ? str.charAt(0).toUpperCase()+str.substr(1) : str;
    };

    /**
     * 将字符串的首字母转换为小写
     * @param str
     * @returns {string}
     */
    Breeze.lcfirst=function( str )
    {
        return typeof str === "string" ? str.charAt(0).toLowerCase()+str.substr(1) : str;
    };


    /**
     * 把一个对象序列化为一个字符串
     * @param object 要序列化的对象
     * @param type   要序列化那种类型,可用值为：url 请求的查询串,style 样式字符串。 默认为 url 类型
     * @param group  是否要用分组，默认是分组（只限url 类型）
     * @return string
     */
   Breeze.serialize=function(object, type , group )
    {
        if( typeof object === "string" || !object )
            return object;
        var str=[],key,joint='&',separate='=',val='',prefix=Breeze.isBoolean(group) ? null : group;
        type = type || 'url';
        group = ( group !== false );
        if( type==='style' )
        {
            joint=';';
            separate=':';
            group=false;
        }else if(type === 'attr' )
        {
            separate='=';
            joint=' ';
            group=false;
        }
        if(Breeze.isObject(object,true) )for( key in object )
        {
            val=type === 'attr' ? '"' +object[key]+'"' : object[key];
            key=prefix ? prefix+'[' + key +']' : key;
            str=str.concat(  typeof val==='object' ?Breeze.serialize( val ,type , group ? key : false ) : key + separate + val  );
        }
        return str.join( joint );
    };

    /**
     * 将一个已序列化的字符串反序列化为一个对象
     * @param str
     * @returns {{}}
     */
   Breeze.unserialize=function( str )
    {
        var object={},index,joint='&',separate='=',val,ref,last,group=false;
        if( /[\w\-]+\s*\=.*?(?=\&|$)/.test( str ) )
        {
            str=str.replace(/^&|&$/,'');
            group=true;

        }else if( /[\w\-\_]+\s*\:.*?(?=\;|$)/.test( str ) )
        {
            joint=';';
            separate=':';
            str=str.replace(/^;|;$/,'')
        }

        str=str.split( joint );
        for( index in str )
        {
            val=str[index].split( separate );
            if( group &&  /\]\s*$/.test( val[0] ) )
            {
                ref=object,last;
                val[0].replace(/\w+/ig,function(key){
                    last=ref;
                    ref=!ref[ key ] ? ref[ key ]={} : ref[ key ];
                });
                last && ( last[ RegExp.lastMatch ]=val[1] );
            }else
            {
                object[ val[0] ]=val[1];
            }
        }
        return object;
    };

    var getAttrExp = /(\w+)(\s*=\s*([\"\'])([^\3]*?)[^\\]\3)?/g;
    var lrQuoteExp = /^[\'\"]|[\'\"]$/g;

    /**
     * 匹配字符串中的属性
     * @param strAttr
     * @return {}
     */
   Breeze.matchAttr=function(strAttr)
    {
        if( typeof strAttr === "string" && /[\S]*/.test(strAttr) )
        {
            var i=  strAttr.charAt(0)==='<' ? 1 : 0;
            var attr=strAttr.replace(/=\s*(\w+)/g,'="$1"').match( getAttrExp );
            strAttr={};
            if( attr && attr.length > 0 )
            {
                var item;
                while( item=attr[i++] )
                {
                    var val  =  item.split('=');
                    if( val.length > 0 )
                    {
                        var prop =Breeze.trim( val[0] );
                        strAttr[ prop ]='';
                        if( typeof val[1] === "string" )
                        {
                            strAttr[ prop ]=val[1].replace( lrQuoteExp ,'').replace(/\\([\'\"])/g,'$1');
                        }
                    }
                }
            }
            return strAttr;
        }
        return null;
    };

    /**
     * 克隆节点元素
     * @param nodeElement
     * @returns {Node}
     */
   Breeze.clone=function(nodeElement , deep )
    {
        if( !Breeze.isXMLDoc( nodeElement ) && nodeElement.cloneNode )
        {
            return nodeElement.cloneNode( !!deep );
        }
        if( typeof nodeElement.nodeName==='string' )
        {
            var node = document.createElement( nodeElement.nodeName  );
            if( node )Breeze.mergeAttributes(node,nodeElement);
            return node;
        }
        return null;
    };

    /**
     * 合并元素属性。
     * 将 refTarget 对象的属性合并到 target 元素
     * @param target 目标对象
     * @param oSource 引用对象
     * @returns {*}
     */
   Breeze.mergeAttributes=function(target, oSource)
    {
        var iselem=Breeze.isNodeElement( target );
        if(Breeze.isObject(oSource,true) )
        {
            for (var key in oSource)if (oSource[key] && oSource[key] != '')
            {
                iselem ? target.setAttribute(key, oSource[key]) : target[key] = oSource[key];
            }

        }else
        {
            var i=0, len=oSource.attributes.length,item;
            while( i<len )
            {
                item=oSource.attributes.item(i++);
                if( item.nodeValue && item.nodeValue !='' )
                {
                    iselem ? target.setAttribute(item.nodeName, item.nodeValue) : target[item.nodeName] = item.nodeValue;
                }
            }
        }
        return target;
    };

    /**
     * 判断元素是否有Style
     * @returns {boolean}
     */
   Breeze.hasStyle=function( elem )
    {
        return !( !elem || !elem.nodeType || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style );
    };

    /**
     * 获取元素所在的窗口对象
     * @param elem
     * @returns {window|null}
     */
   Breeze.getWindow=function( elem )
    {
        if( typeof elem !== "object" )return null;
        elem= elem.ownerDocument || elem ;
        return elem.window || elem.defaultView || elem.contentWindow || elem.parentWindow || window || null;
    };

    //form elements
    var formPatternReg=/select|input|textarea|button/i;

    /**
     * 判断是否为一个表单元素
     * @returns {boolean}
     */
   Breeze.isFormElement=function(elem, exclude )
    {
        if( elem && typeof elem.nodeName ==='string' )
        {
            var ret=formPatternReg.test( elem.nodeName );
            return ret && typeof exclude === 'string' ? exclude.toLowerCase() !== this.nodeName() : ret;
        }
        return false;
    };

    /**
     * 以小写的形式返回元素的节点名
     * @returns {string}
     */
   Breeze.nodeName=function( elem )
    {
        return elem && typeof elem.nodeName=== "string" && elem.nodeName!='' ? elem.nodeName.toLowerCase() : '';
    };

    /**
     * @private
     * @type {boolean}
     */
    var ishtmlobject = typeof HTMLElement==='object';

    /**
     * 判断是否为一个HtmlElement类型元素,document 不属性于 HtmlElement
     * @returns {boolean}
     */
   Breeze.isHTMLElement=function( elem )
    {
        if( typeof elem !== "object" )return false;
        return ishtmlobject ? elem instanceof HTMLElement : ( elem.nodeType === 1 && typeof elem.nodeName === "string" );
    };

    /**
     * 判断是否为一个节点类型元素
     * document window 不属于节点类型元素
     * @returns {boolean}
     */
   Breeze.isNodeElement=function( elem )
    {
        if( typeof elem !== "object" ) return false;
        return typeof Node !== "undefined" ? elem instanceof Node :
            !!( elem.nodeType && typeof elem.nodeName === "string" && (typeof elem.tagName === "string" || elem.nodeType===9) );
    };

    /**
     * 判断是否为一个html容器元素。
     * HTMLElement和document属于Html容器
     * @param element
     * @returns {boolean|*|boolean}
     */
   Breeze.isHTMLContainer=function( elem )
    {
        if( typeof elem !== "object" ) return false;
        return this.isHTMLElement() || this.isDocument();
    };

    /**
     * 判断是否为一个事件元素
     * @param element
     * @returns {boolean}
     */
   Breeze.isEventElement=function(elem)
    {
        return (elem && ( typeof elem.addEventListener === "function" || typeof elem.attachEvent=== "function" ) );
    };

    /**
     * 判断是否为窗口对象
     * @param obj
     * @returns {boolean}
     */
    Breeze.prototype.isWindow=function( elem )
    {
        return ( elem && elem === elem.window );
    };

    /**
     * 决断是否为文档对象
     * @returns {*|boolean}
     */
    Breeze.prototype.isDocument=function( elem )
    {
        return elem && elem.nodeType===9;
    };

    /**
     * 判断是否为一个框架元素
     * @returns {boolean}
     */
    Breeze.prototype.isFrame=function( elem )
    {
        var nodename =Breeze.nodeName(elem);
        return (nodename === 'iframe' || nodename==='frame');
    };




    /**
     * 判断变量是否已定义
     * @param val,...
     * @returns {boolean}
     */
   Breeze.isDefined=function()
    {
        var i=arguments.length;
        while( i>0 ) if( typeof arguments[ --i ] === 'undefined' )
            return false;
        return true;
    };

    /**
     * 判断是否为数组
     * @param val
     * @returns {boolean}
     */
   Breeze.isArray=function(val )
    {
        return val instanceof Array;
    };

    /**
     * 判断是否为函数
     * @param val
     * @returns {boolean}
     */
   Breeze.isFunction=function(val ){
        return typeof val === 'function';
    };

    /**
     * 判断是否为布尔类型
     * @param val
     * @returns {boolean}
     */
   Breeze.isBoolean=function(val ){
        return typeof val === 'boolean';
    };

    /**
     * 判断是否为字符串
     * @param val
     * @returns {boolean}
     */
   Breeze.isString=function(val )
    {
        return typeof val === 'string';
    };

    /**
     * 判断是否为一个标量
     * 只有对象类型或者Null不是标量
     * @param {boolean}
     */
   Breeze.isScalar=function(val )
    {
        var t=typeof val;
        return t==='string' || t==='number' || t==='float' || t==='boolean';
    };

    /**
     * 判断是否为数字类型
     * @param val
     * @returns {boolean}
     */
   Breeze.isNumber=function(val )
    {
        return typeof val === 'number';
    };

    /**
     * 判断是否为一个空值
     * @param val
     * @param flag 当有true时是否包含为0的值
     * @returns {boolean}
     */
   Breeze.isEmpty=function(val , flag )
    {
        if( val===null || val==='' || val===false || ( val==0 && !flag ) || typeof val === 'undefined' )
            return true;

        if(Breeze.isObject(val,true) )
        {
            var ret;
            for( ret in val )break;
            return ret===undefined;
        }
        return false;
    };

    /**
     * 判断是否为一个可遍历的对象
     * @param val
     * @param flag
     * @returns {boolean}
     */
   Breeze.isObject=function(val , flag )
    {
        return val && typeof val === "object" ? !!( val.constructor === Object || ( flag &&Breeze.isArray(val) ) ) : false;
    };


    /**
     * 查找指定的值是否在指定的对象中,如果存在返回对应的键名否则返回null。
     * @param object
     * @param val
     * @returns {*}
     */
   Breeze.inObject=function(object, val )
    {
        var key;
        if(Breeze.isObject(object,true) )for( key in object  ) if( object[ key ]===val )
            return key;
        return null;
    };


    /**
     * 返回一个对象的所有键名。
     * @param object
     * @returns {Array}
     */
   Breeze.toKeys=function(object )
    {
        var keys=[];
        if(Breeze.isObject( object ) )
            for(var i in object)keys.push(i);
        return keys;
    };

    /**
     * @type {RegExp}
     */
    var TRIM_LEFT = /^\s+/,TRIM_RIGHT = /\s+$/;

    /**
     * 去掉左右的空白
     * @param val
     * @returns {string}
     */
   Breeze.trim=function(val )
    {
        return typeof val==='string' ? val.replace( TRIM_LEFT, "" ).replace( TRIM_RIGHT, "" ) : '';
    };

    /**
     * 合并其它参数到指定的 target 对象中
     * 如果只有一个参数则只对 Breeze 本身进行扩展。
     * @returns Object
     */
   Breeze.extend=function(){

        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        if ( typeof target === "boolean" )
        {
            deep = target;
            target = arguments[1] || {};
            i++;
        }

        if ( length === i )
        {
            target = this;
            --i;

        }else if ( typeof target !== "object" &&  typeof target !== "function" )
        {
            target = {};
        }

        for ( ; i < length; i++ )
        {
            if ( (options = arguments[ i ]) != null )
            {
                for ( name in options )
                {
                    src = target[ name ];
                    copy = options[ name ];
                    if ( target === copy ) {
                        continue;
                    }
                    if ( deep && copy && (Breeze.isObject(copy) || (copyIsArray =Breeze.isArray(copy)) ) )
                    {
                        if ( copyIsArray ) {
                            copyIsArray = false;
                            clone = src &&Breeze.isArray(src) ? src : [];
                        } else {
                            clone = src &&Breeze.isObject(src) ? src : {};
                        }
                        target[ name ] =Breeze.extend( deep, clone, copy );
                    } else if ( copy !== undefined )
                    {
                        target[ name ] = copy;
                    }
                }
            }
        }
        return target;
    };

    /**
     * 格式化输出
     * @format
     * @param [...]
     * @returns {string}
     */
   Breeze.sprintf=function()
    {
        var str='',i= 1,len=arguments.length,param;
        if( len > 0 )
        {
            str=arguments[0];
            for( ; i< len ; i++ )
            {
                param=arguments[i];
                str=str.replace(/%(s|d|f)/,function(all,method)
                {
                    if( method==='d' ){
                        param=parseInt(param);
                        return isNaN(param) ? '' : param;
                    }else if(method==='f')
                    {
                        param=parseFloat(param);
                        return isNaN(param) ? '' : param;
                    }
                    return param;
                })
            }
            str.replace(/%(s|d|f)/g,'');
        }
        return str;
    };


    /**
     * 导入一个可执行的脚本文件。通常是 js,css 文件。
     * @param file 脚本的文件地址。
     * @param callback 成功时的回调函数。
     */
   Breeze.require=function(file , callback )
    {
        var script;
        if( typeof file !== 'string' )
        {
            script=file;
            file= file.src || file.href;
        }

        var type = file.match(/\.(css|js)(\?.*?)?$/i);
        if( !type )throw new Error('import script file format of invalid');

        file+=( !type[2] ? '?t=' : '&t=')+Breeze.time();

        type=type[1];
        type=type.toLowerCase() === 'css' ? 'link' : 'script';

        if( !script )
        {
            var head=document.getElementsByTagName('head')[0];
            var ref=Breeze.querySelector( type +':last,:last-child',head )[0];
            ref = ref ? ref.nextSibling : null;
            script=document.createElement( type );
            head.insertBefore(script,ref);
        }

        script.onload=script.onreadystatechange=function(event)
        {
            if( !script.readyState || /loaded|complete/.test( script.readyState ) )
            {
                script.onload=script.onreadystatechange=null;
                if( typeof callback ==='function' )
                    callback( event );
            }
        };

        if( type==='link' )
        {
            script.setAttribute('rel', 'stylesheet');
            script.setAttribute('type','text/css');
            script.setAttribute('href', file );
        }else
        {
            script.setAttribute('type','text/javascript');
            script.setAttribute('src', file );
        }
    };


    /**
     * 根据指定的参数值转成对应的布尔值
     * @param val
     * @returns {boolean}
     */
   Breeze.boolean=function(val )
    {
        return typeof val==='string' && /^\s*(0+|false|null)\s*$/.test(val) ? false : !!val;
    };

    /**
     * 将指定的标量转成数组
     * @param val
     * @returns {boolean}
     */
   Breeze.toArray=function(val , separator )
    {
        return val instanceof Array ? val : String(val).split(separator || ',');
    };


    /**
     * 返回一个从指定开始值到结束值的数组。
     * @param number startIndex 开始索引
     * @param number endIndex 结束索引
     * @param increment 增量值，默认为0
     * @returns {Array}
     */
   Breeze.range=function(startIndex, endIndex, increment )
    {
        increment = parseInt(increment) || 0;
        var arr =[];
        while( startIndex <= endIndex )
        {
            arr.push( startIndex+increment );
            startIndex++;
        }
        return arr;
    };

    /**
     * 复制字符串到指定的次数
     * @param string str
     * @param number num
     * @returns {string}
     */
   Breeze.repeat=function(str, num )
    {
        if( typeof str === "string" )
        {
            return new Array( (parseInt(num) || 0)+1 ).join(str);
        }
        return '';
    };



    /**
     * 比较两个两个字符串的值。
     * 如果 a > b 返回 1 a<b 返回 -1 否则返回 0
     * 比较的优先级数字优先于字符串。字母及汉字是按本地字符集排序。
     * @param a
     * @param b
     * @returns {*}
     */
    Breeze.compare=function(a, b)
    {
        var c = parseFloat( a ), d = parseFloat( b );
        if( isNaN(c) && isNaN(d) )
        {
            return a.localeCompare(b);

        }else if( !isNaN(c) && !isNaN(d) )
        {
            return c > d ? 1 : (c < d ? -1 : 0);
        }
        return isNaN(c) ? 1 : -1;
    };
    
    
    
    
    
    
    
    
    window.Breeze = Breeze;
    return Utils;

});
