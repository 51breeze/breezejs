/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function( undefined )
{
    "use strict";
    var Utils= window.Utils || (window.Utils={})
        ,fix={
            attrMap:{
                'tabindex'       : 'tabIndex',
                'readonly'       : 'readOnly',
                'for'            : 'htmlFor',
                'maxlength'      : 'maxLength',
                'cellspacing'    : 'cellSpacing',
                'cellpadding'    : 'cellPadding',
                'rowspan'        : 'rowSpan',
                'colspan'        : 'colSpan',
                'usemap'         : 'useMap',
                'frameborder'    : 'frameBorder',
                'class'          : 'className',
                'contenteditable': 'contentEditable'
            }
            ,cssMap:{}
        }
        ,cssAalpha = /alpha\([^)]*\)/i
        ,cssOpacity = /opacity=([^)]*)/
        ,cssUpperProp = /([A-Z]|^ms)/g
        ,cssNum = /^[\-+]?(?:\d*\.)?\d+$/i
        ,cssNumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
        ,cssOperator = /^([\-+])=([\-+.\de]+)/
        ,cssExpand = [ "Top", "Right", "Bottom", "Left" ]
        ,cssDashAlpha = /-([a-z]|[0-9])/ig
        ,cssPrefix = /^-ms-/
        ,cssCamelCase = function( all, letter )
        {
            return ( letter + "" ).toUpperCase();
        }
        ,cssNumber={
            "fillOpacity": true,
            "fontWeight": true,
            "lineHeight": true,
            "opacity": true,
            "orphans": true,
            "widows": true,
            "zIndex": true,
            "zoom": true
        }
        ,cssHooks={}
        ,operatorValue=function ( value, increase,ret )
        {
            ret = ret ===undefined ? typeof value === "string" ?  cssOperator.exec( value ) : null : ret
            if ( ret && increase>0 )value = ( +( ret[1] + 1 ) * +ret[2] ) + increase;
            return value;
        }
        ,getOffsetPosition=function( elem ,local)
        {
            var top = 0,left = 0,width=0,height=0,stageWidth=0,stageHeight=0;
            if( Utils.isHTMLElement(elem) )
            {
                stageWidth=Utils.getSize(elem.ownerDocument,'width')
                stageHeight=Utils.getSize(elem.ownerDocument,'height');
                do{
                    top  += parseFloat( Utils.style(elem,'borderTopWidth') )  || 0;
                    left += parseFloat( Utils.style(elem,'borderLeftWidth') ) || 0;
                    top  +=elem.offsetTop;
                    left +=elem.offsetLeft;
                    elem=elem.offsetParent;
                }while( !local && elem )
            }
            return { 'top': top, 'left': left ,'right' : stageWidth-width-left,'bottom':stageHeight-height-top};
        };

      Utils.getSize=function( elem, name, border )
      {
            name=name.toLowerCase();
            var doc= elem.document || elem.ownerDocument || elem,
                docElem=doc.documentElement || {},
                val     = name === "width" ? elem.offsetWidth : elem.offsetHeight,
                i       = name === "width" ? 1 : 0,
                len     = 4;

            if( Utils.isDocument(elem) || Utils.isWindow(elem) || elem===docElem )
            {
                name=Utils.ucfirst( name );
                if( Utils.isWindow(elem) )
                {
                    val=Math.max(
                        elem[ "inner" + name ] || 0,
                        ( Utils.isBrowser(Utils.BROWSER_IE) || 9 ) < 9 ?  docElem[ "offset" + name ] : 0,
                        docElem[ "client" + name ] || 0
                    );

                }else
                {
                    val=Math.max(
                        document.body[ "scroll" + name ] || 0, document[ "scroll" + name ] || 0
                        ,document.body[ "offset" + name ] || 0, document[ "offset" + name ] || 0
                        ,docElem[ "client" + name ] || 0
                    );
                    val+=docElem['client'+cssExpand[ i+2 ]] || 0;
                }

            }else if ( val > 0 )
            {
                var margin=( Utils.isBrowser( Utils.BROWSER_IE) || 10 ) < 9  ;
                for ( ; i < len; i += 2 )
                {
                    //val -= parseFloat( Utils.style( elem, "padding" + cssExpand[ i ] ) ) || 0;
                    //如果没有指定带border 宽，默认不带边框的宽
                    if( border )
                        val -= parseFloat( Utils.style( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;

                    //ie9 以下 offsetWidth 会包括 margin 边距。
                    if( margin )
                        val -= parseFloat( Utils.style( elem, "margin" + cssExpand[ i ] + "Width" ) ) || 0;
                }

            }else
            {
                val= parseInt( Utils.style(elem,name) ) || 0;
                for ( ; i < len; i += 2 ) val += parseFloat( Utils.style( elem, "padding" + cssExpand[ i ] + "Width" ) ) || 0;
            }
            return val || 0;
      };

    /**
     * @param name
     * @returns {*}
     */
    Utils.attrMap=function( name )
    {
        return fix.attrMap[name] || name;
    }

    /**
     * 一组代表某个浏览器的常量
     * @type {string}
     */
    Utils.BROWSER_IE='IE';
    Utils.BROWSER_FIREFOX='FIREFOX';
    Utils.BROWSER_CHROME='CHROME';
    Utils.BROWSER_OPERA='OPERA';
    Utils.BROWSER_SAFARI='SAFARI';
    Utils.BROWSER_MOZILLA='MOZILLA';


    /**
     * @private;
     */
    var _client;

    /**
     * 判断是否为指定的浏览器
     * @param type
     * @returns {string|null}
     */
    Utils.isBrowser=function( type,version,expr ){
        version= version !==undefined ? parseFloat(version) : undefined;
        expr = expr || '<';
        if( typeof _client === 'undefined' )
        {
            _client = {};
            var ua = navigator.userAgent.toLowerCase();
            var s;
            (s = ua.match(/msie ([\d.]+)/))             ? _client[Utils.BROWSER_IE]       = Number(s[1]) :
                (s = ua.match(/firefox\/([\d.]+)/))         ? _client[Utils.BROWSER_FIREFOX]  = Number(s[1]) :
                    (s = ua.match(/chrome\/([\d.]+)/))          ? _client[Utils.BROWSER_CHROME]   = Number(s[1]) :
                        (s = ua.match(/opera.([\d.]+)/))            ? _client[Utils.BROWSER_OPERA]    = Number(s[1]) :
                            (s = ua.match(/version\/([\d.]+).*safari/)) ? _client[Utils.BROWSER_SAFARI]   = Number(s[1]) :
                                (s = ua.match(/^mozilla\/([\d.]+)/))        ? _client[Utils.BROWSER_MOZILLA]  = Number(s[1]) : null ;
        }
        var result = _client[type];
        if( result && version !== undefined )
            eval('result = result ' +expr.replace(/\s*/,'') +' version;' );
        return result;
    }

    /**
     * @private;
     */
    var getStyle;

    /**
     * 获取元素的样式
     * @param elem
     * @param name
     * @returns {*}
     */
    if( document.defaultView && document.defaultView.getComputedStyle )
    {
        //fix.cssMap['float']='cssFloat';
        getStyle= function( elem, name )
        {
            if( name === undefined || name==='cssText')
                return (elem.style || {} ).cssText || '';

            name=Utils.styleName( name );
            if( cssHooks[name] && cssHooks[name].get )return cssHooks[name].get.call(elem) || '';

            var ret='',computedStyle;
            if( name==='' )return '';

            computedStyle=document.defaultView.getComputedStyle( elem, null )
            if( computedStyle )
            {
                ret = computedStyle.getPropertyValue( name );
                ret = ret === "" && Utils.hasStyle(elem) ? elem.style[name] : ret;
            }
            return ret;
        };

    }else
    {
       // fix.cssMap['float']='styleFloat';
        fix.cssMap['alpha']='opacity';
        fix.attrMap['class']='className';

        getStyle=function( elem, name )
        {
            if( name === undefined || name==='cssText' )
                return (elem.style || elem.currentStyle || {} ).cssText || '';

            name=Utils.styleName( name );
            if( name==='' )return '';

            var left='', rsLeft,hook=cssHooks[name]
                ,style = elem.style && elem.style[ name ] ? elem.style : elem.currentStyle && elem.currentStyle || elem.style
                ,ret = style[ name ] || '';

            if( hook && hook.get )
                ret=hook.get.call(elem,style) || '';

            //在ie9 以下将百分比的值转成像素的值
            if( cssNumnonpx.test( ret ) )
            {
                left = elem.style.left;
                rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;
                if ( rsLeft )elem.runtimeStyle.left = elem.currentStyle.left;
                elem.style.left = name === "fontSize" ? "1em" : ret;
                ret = elem.style.pixelLeft + "px";
                elem.style.left = left;
                if ( rsLeft )elem.runtimeStyle.left = rsLeft;
            }
            return ret;
        };

        cssHooks.opacity={
            get: function( style )
            {
                return cssOpacity.test( style.filter || "" ) ? parseFloat( RegExp.$1 ) / 100 : 1;
            },
            set: function( style, value )
            {
                value=isNaN(value) ? 1 : Math.max( ( value > 1 ? ( Math.min(value,100) / 100 ) : value ) , 0 )
                var opacity = "alpha(opacity=" + (value* 100) + ")", filter = style.filter || "";
                style.zoom = 1;
                style.filter = Utils.trim( filter.replace(cssAalpha,'') + " " + opacity );
                return true;
            }
        };
    }

    /**
     * 设置元素的样式
     * @param elem
     * @param name|cssText|object 当前name的参数是 cssText|object 时会忽略value 参数
     * @param value 需要设置的值
     */
    Utils.style=function( elem, name, value )
    {
        if ( !Utils.hasStyle(elem) )
            return false;

        //清空样式
        if( typeof name === 'string' &&  /^(\s*[\w\-]+\s*\:[\w\-\s]+;)+$/.test(name)  )
        {
            value=name;
            name='cssText';

        }else if( Utils.isObject(name) )
        {
            value=name;
        }
        if( Utils.isObject(value) )
        {
            var newvalue=Utils.serialize(value,'style') ;
            value=getStyle( elem ).replace(/;\s*$/,'');
            value =  value =='' ? newvalue : value+';'+newvalue;
            name='cssText';
        }
        name = Utils.styleName( name );
        if( !Utils.isScalar( value ) )
        {
            return getStyle(elem,name);
        }

        var style=elem.style;
        var type = typeof value,ret,
            hook=cssHooks[name];
        if ( type === "number" && isNaN( value ) )return false;
        if ( type === "string" && (ret=cssOperator.exec( value )) )
        {
            value =operatorValue(value, parseFloat( getStyle( elem, name ) ) , ret );
            type = "number";
        }
        if ( value == null )return false;
        if ( type === "number" && !cssNumber[ name ] )
            value += "px";
        if( hook && hook.set && hook.set.call(elem,style,value)===true )return true;
        try{
            style[name]=value;
        }catch( e ){}
        return true;
    }

    /**
     * 获取或者设置滚动条的位置
     * @param element
     * @param prop
     * @param val
     * @returns {number|void}
     */
    Utils.scroll=function(element,prop,val)
    {
        var is=Utils.isWindow( element );
        if( Utils.isHTMLContainer( element) || is  )
        {
            var win= is ? element : element.nodeType===9 ? elem.defaultView || elem.parentWindow : null;
            var p= /left/i.test(prop) ? 'pageXOffset' : 'pageYOffset'
            if( val===undefined )
            {
                return win ? p in win ? win[ p ] : win.document.documentElement[ prop ] :  element[ prop ];
            }
            if( win ){
                win.scrollTo( p==='pageXOffset' ? val : Utils.scroll(element,'scrollLeft'),
                              p==='pageYOffset' ? val : Utils.scroll(element,'scrollTop') );
            }else{
                element[ prop ] = val;
            }
            return true;
        }
        return false;
    }

    /**
     * @type {null}
     */
    var getPosition=null;

    /**
     * 获取元素相对舞台坐标位置
     * @param elem
     * @returns {object}
     */
    if ( "getBoundingClientRect" in document.documentElement )
    {
        getPosition = function( elem,local )
        {
            if( local )return getOffsetPosition(elem,true);
            var value={ 'top': 0, 'left': 0 ,'right' : 0,'bottom':0}
                ,box
                ,doc=elem.ownerDocument
                ,docElem= doc && doc.documentElement;

            try {
                box = elem.getBoundingClientRect();
            } catch(e) {
                box=value;
            }

            if ( !docElem || !Utils.contains( docElem, elem ) )
                return value;

            var body = doc.body,
            win = Utils.getWindow( doc ),
            clientTop  = docElem.clientTop  || body.clientTop  || 0,
            clientLeft = docElem.clientLeft || body.clientLeft || 0,
            scrollTop  = win.pageYOffset ||  docElem.scrollTop  || body.scrollTop,
            scrollLeft = win.pageXOffset ||  docElem.scrollLeft || body.scrollLeft;
            value.top  = box.top  + scrollTop  - clientTop
            value.left = box.left + scrollLeft - clientLeft
            value.right = box.right - scrollLeft + clientLeft
            value.bottom = box.bottom - scrollTop + clientTop
            return value;
        };
    }
    else
    {
        getPosition=function( elem ,local)
        {
            var top = 0,left = 0,width=0,height=0,stageWidth=0,stageHeight=0;
            if( Utils.isHTMLElement(elem) )
            {
                stageWidth=Utils.getSize(elem.ownerDocument,'width')
                stageHeight=Utils.getSize(elem.ownerDocument,'height');
                do{
                    top  += parseFloat( Utils.style(elem,'borderTopWidth') )  || 0;
                    left += parseFloat( Utils.style(elem,'borderLeftWidth') ) || 0;
                    top  +=elem.offsetTop;
                    left +=elem.offsetLeft;
                    elem=elem.offsetParent;
                }while( !local && elem )
            }
            return { 'top': top, 'left': left ,'right' : stageWidth-width-left,'bottom':stageHeight-height-top};
        };
    }

    /**
     * 设置元素相对舞台坐标位置
     * @param elem
     * @param property left|top|right|bottom
     * @param value 需要设置的值。如果是一个布尔值则获取相对本地的位置
     * @returns {object}
     */
    Utils.position=function( elem, property, value )
    {
        if( !Utils.hasStyle( elem ) )
            return { 'top': 0, 'left': 0 ,'right' : 0,'bottom':0};

        var options=property;
        var position=getPosition(elem,value);
        if( !Utils.isObject(property) )
        {
            if( !Utils.isString(property) )
                return position;
            if( !Utils.isScalar(value) || typeof value ==='boolean')
                return position[ property ];
            options={};
            options[property]=value;
        }

        if ( Utils.style( elem, "position") === "static" )
            Utils.style(elem,'position','relative');

        for( var i in options )
        {
            var ret=cssOperator.exec( options[i] )
            options[i]= ret ? operatorValue( options[i] , position[i] || 0 , ret ) : parseFloat( options[i] ) || 0;
            Utils.style(elem,i,options[i]);
        }
        return true;
    }

    /**
     * 统一规范的样式名
     * @param name
     * @returns {string}
     */
    Utils.styleName=function( name )
    {
        if( typeof name !=='string' )
          return name;
        if( name === 'cssText')
            return name;

        name=name.replace( cssPrefix, "ms-" ).replace( cssDashAlpha, cssCamelCase );
        name = name.replace( cssUpperProp, "-$1" ).toLowerCase();
        return fix.cssMap[name] || name;
    }

    /**
     * 把颜色的值转成16进制形式 #ffffff
     * @param color
     * @returns {string}
     */
    Utils.toHexColor = function( color )
    {
        var colorArr,strHex = "#", i,hex;
        if( /^\s*RGB/i.test( color ) )
        {
            colorArr = color.replace(/(?:[\(\)\s]|RGB)*/gi,"").split(",")
            for( i=0; i< colorArr.length && strHex.length <= 7 ; i++ )
            {
                hex = Number( colorArr[i] ).toString( 16 );
                if( hex === "0" )hex += hex;
                strHex += hex;
            }

        }else
        {
            colorArr = color.replace(/^\s*#/,"").split("");
            for( i=0; i<colorArr.length && strHex.length <= 7 ; i++)
            {
                strHex += ( colorArr[i]+colorArr[i] );
            }
        }
        return strHex;
    };

    /**
     * 把颜色的值转成RGB形式 rgb(255,255,255)
     * @param color
     * @returns {string}
     */
    Utils.toRgbColor = function( color )
    {
        if( color )
        {
            color=Utils.toHEX( color );
            var colorArr = [],i=1;
            for( ; i<7; i+=2 )colorArr.push( parseInt( "0x"+color.slice(i,i+2) ) );
            return "RGB(" + colorArr.join(",") + ")";
        }
        return color;
    };

    /**
     * 判断元素是否有Style
     * @param elem
     * @returns {boolean}
     */
    Utils.hasStyle=function( elem )
    {
        return !( !elem || !elem.nodeType || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style );
    }

    /**
     * 取得当前的时间戳
     * @returns {number}
     */
    Utils.time=function()
    {
        return ( new Date() ).getTime();
    }

    /**
     * 将字符串的首字母转换为大写
     * @param str
     * @returns {string}
     */
    Utils.ucfirst=function( str )
    {
        return str.charAt(0).toUpperCase()+str.substr(1);
    }

    /**
     * 获取元素所在的窗口对象
     * @param elem
     * @returns {window|null}
     */
    Utils.getWindow=function ( elem )
    {
        elem=Utils.isHTMLElement(elem) ? elem.ownerDocument : elem ;
        return Utils.isWindow( elem ) ? elem : elem.nodeType === 9 ? elem.defaultView || elem.contentWindow || elem.parentWindow : null;
    }

    /**
     * 把一个对象序列化为一个字符串
     * @param object 要序列化的对象
     * @param type   要序列化那种类型,可用值为：url 请求的查询串,style 样式字符串。 默认为 url 类型
     * @param group  是否要用分组，默认是分组（只限url 类型）
     * @return string
     */
    Utils.serialize=function( object, type ,group )
    {
        var str=[],key,joint='&',separate='=',val='',prefix=Utils.isBoolean(group) ? null : group;
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
        for( key in object )
        {
            val=type === 'attr' ? '"' +object[key]+'"' : object[key];
            key=type==='style' ? Utils.styleName(key) : key;
            key=prefix ? prefix+'[' + key +']' : key;
            str=str.concat(  typeof val==='object' ? Utils.serialize( val ,type , group ? key : false ) : key + separate + val  );
        }
        return str.join( joint );
    }

    /**
     * 将一个已序列化的字符串反序列化为一个对象
     * @param str
     * @returns {{}}
     */
    Utils.unserialize=function( str )
    {
         var object={},index,joint='&',separate='=',val,ref,last,group=false;
         if( /\w+[\-\_]\s*\=.*?(?=\&|$)/.test( str ) )
         {
             str=str.replace(/^&|&$/,'')
             group=true;

         }else if( /\w+[\-\_]\s*\:.*?(?=\;|$)/.test( str ) )
         {
             joint=';';
             separate=':';
             str=str.replace(/^;|;$/,'')
         }
        str=str.split( joint )
        for( index in str )
        {
            val=str[index].split( separate )
            if( group &&  /\]\s*$/.test( val[0] ) )
            {
                ref=object,last;
                val[0].replace(/\w+/ig,function(key){
                    last=ref;
                    ref=!ref[ key ] ? ref[ key ]={} : ref[ key ];
                })
                last && ( last[ RegExp.lastMatch ]=val[1] );
            }else
            {
               object[ val[0] ]=val[1];
            }
        }
        return object;
    }

    var getAttrExp = /(\w+)(\s*=\s*([\"\'])([^\3]*?)[^\\]\3)?/g;
    var lrQuoteExp = /^[\'\"]|[\'\"]$/g;

    /**
     * 匹配字符串中的属性
     * @param strAttr
     * @return {}
     */
    Utils.matchAttr=function(strAttr)
    {
        if( typeof strAttr === "string" && /[\S]*/.test(strAttr) )
        {
            var attr=strAttr.replace(/=\s*(\w+)/g,'="$1"').match( getAttrExp );
            strAttr={};
            if( attr && attr.length > 0 )
            {
                var i= 0, item;
                while( item=attr[i++] )
                {
                    var val  =  item.split('=');
                    if( val.length > 0 )
                    {
                        var prop = Utils.trim( val[0] );
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
    }


    /**
     * 克隆节点元素
     * @param nodeElement
     * @returns {Node}
     */
    Utils.clone=function( nodeElement ,deep )
    {
        if( !Utils.isXMLDoc( nodeElement ) && nodeElement.cloneNode )
        {
            return nodeElement.cloneNode( !!deep );
        }
        if( typeof nodeElement.nodeName==='string' )
        {
            var node = document.createElement( nodeElement.nodeName  );
            if( node )Utils.mergeAttributes(node,nodeElement);
            return node;
        }
        return null;
    }

    /**
     * 合并元素属性。
     * 将 refTarget 对象的属性合并到 target 元素
     * @param target 目标对象
     * @param refTarget 引用对象
     * @returns {*}
     */
    Utils.mergeAttributes=function(target,refTarget)
    {
        if( typeof target.mergeAttributes === "function" )
        {
            target.mergeAttributes(refTarget);
            return target;
        }

        var flag=  (typeof target.setAttribute === "function") ;
        if( refTarget.attributes )
        {
            var i=0, item;
            while( item = refTarget.attributes.item(i++) )
            {
               flag ? target.setAttribute(item.nodeName, item.nodeValue) : target[item.nodeName]=item.nodeValue;
            }

        }else if( Utils.isObject(refTarget,true) ) for( var key in refTarget )
        {
            flag ?  target.setAttribute(key, refTarget[key] ) : target[key]=refTarget[key];
        }
        return target;
    }

    /**
     * 判断元素是否有指定的属性名
     * @param element
     * @param name
     * @returns {boolean}
     */
    Utils.hasAttribute=function(element,name)
    {
       return typeof element.hasAttributes === 'function' ? element.hasAttributes( name ) : !!element[name];
    }

    /**
     * 判断变量是否已定义
     * @param val,...
     * @returns {boolean}
     */
    Utils.isDefined=function()
    {
        var i=arguments.length;
        while( i>0 ) if( typeof arguments[ --i ] === 'undefined' )
            return false;
        return true;
    }

    /**
     * 判断是否为数组
     * @param val
     * @returns {boolean}
     */
    Utils.isArray=function( val )
    {
        return val instanceof Array;
    }

    /**
     * 判断是否为函数
     * @param val
     * @returns {boolean}
     */
    Utils.isFunction=function( val ){
        return typeof val === 'function';
    }

    /**
     * 判断是否为布尔类型
     * @param val
     * @returns {boolean}
     */
    Utils.isBoolean=function( val ){
        return typeof val === 'boolean';
    }

    /**
     * 判断是否为字符串
     * @param val
     * @returns {boolean}
     */
    Utils.isString=function( val )
    {
        return typeof val === 'string';
    }

    /**
     * 判断是否为一个标量
     * 只有对象类型或者Null不是标量
     * @param {boolean}
     */
    Utils.isScalar=function( val )
    {
        var t=typeof val;
        return t==='string' || t==='number' || t==='float' || t==='boolean';
    }

    /**
     * 判断是否为数字类型
     * @param val
     * @returns {boolean}
     */
    Utils.isNumber=function( val )
    {
        return typeof val === 'number';
    }

    /**
     * 判断是否为一个空值
     * @param val
     * @param flag 当有true时是否包含为0的值
     * @returns {boolean}
     */
    Utils.isEmpty=function( val , flag )
    {
        if( val===null || val==='' || val===false || ( val==0 && !flag ) || typeof val === 'undefined' )
            return true;

        if( Utils.isObject(val,true) )
        {
            var ret;
            for( ret in val )break;
            return ret===undefined;
        }
        return false;
    }

    /**
     * 判断是否为一个可遍历的对象
     * @param val
     * @param flag
     * @returns {boolean}
     */
    Utils.isObject=function( val , flag )
    {
        if( !val || val.nodeType || Utils.isWindow(val) || val===null )
           return false;
        return ( flag===true && Utils.isArray(val) ) || typeof val === 'object';
    }

    /**
     * 判断在指定的父元素中是否包含指定的子元素
     * @param parent
     * @param child
     * @returns {boolean}
     */
    Utils.contains=function( parent, child )
    {
        if( Utils.isHTMLElement(parent) && Utils.isHTMLElement(child) )
            return Sizzle.contains(parent,child);
        return false;
    }

    var formPatternReg=/select|input|textarea|button/i;

    /**
     * 判断是否为一个表单元素
     * @param element
     * @returns {boolean}
     */
    Utils.isFormElement=function(element,exclude)
    {
        if( element && typeof element.nodeName ==='string' )
        {
            var ret=formPatternReg.test( element.nodeName );
            return ret && exclude !== undefined ? exclude !== Utils.nodeName( element )  : ret;
        }
        return false;
    }

    /**
     * 以小写的形式返回元素的节点名
     * @param element
     * @returns {string}
     */
    Utils.nodeName=function( element )
    {
        return  element && typeof element.nodeName=== "string" && element.nodeName!='' ? element.nodeName.toLowerCase() : '';
    }

    /**
     * 判断在父节点中是否可以添加移除子节点
     * @param parentNode
     * @param childNode
     */
    Utils.isAddRemoveChildNode=function(parentNode,childNode)
    {
        var nodename=Utils.nodeName( parentNode );
        if( nodename=='input' || nodename=='button' || Utils.isEmpty(nodename) || parentNode===childNode || Utils.contains(childNode,parentNode) )
            return false;
        if( nodename=='select' )
            return Utils.nodeName( childNode )==='option';
        else if( nodename=='textarea' )
            return childNode && childNode.nodeType===3;
        return true;
    }

    /**
     * 判断是否为一个HtmlElement类型元素,document 不属性于 HtmlElement
     * @param element
     * @returns {boolean}
     */
    Utils.isHTMLElement=function( element )
    {
        return typeof HTMLElement==='object' ? element instanceof HTMLElement : element && element.nodeType === 1;
    }

    /**
     * 判断是否为一个html容器元素。
     * @param element
     * @returns {boolean|*|boolean}
     */
    Utils.isHTMLContainer=function( element )
    {
       return Utils.isHTMLElement( element ) || Utils.isDocument(element);
    }

    /**
     * 判断是否为一个事件元素
     * @param element
     * @returns {boolean}
     */
    Utils.isEventElement=function( element )
    {
        return element ? !!(element.addEventListener || element.attachEvent) : false;
    }

    /**
     * 判断是否为窗口对象
     * @param obj
     * @returns {boolean}
     */
    Utils.isWindow=function( obj ) {
        return obj != null && obj == obj.window;
    }

    /**
     * 决断是否为文档对象
     * @param obj
     * @returns {*|boolean}
     */
    Utils.isDocument=function( obj )
    {
        return obj && obj.nodeType===9;
    }

    /**
     * 查找指定的值是否在指定的对象中,如果存在返回对应的键名否则返回null。
     * @param object
     * @param val
     * @returns {*}
     */
    Utils.inObject=function( object, val )
    {
        var key;
        if( Utils.isObject(object,true) )for( key in object  ) if( object[ key ]===val )
            return key;
        return null;
    }

    var TRIM_LEFT = /^\s+/,TRIM_RIGHT = /\s+$/;

    /**
     * 去掉左右的空白
     * @param val
     * @returns {string}
     */
    Utils.trim=function( val )
    {
        return typeof val==='string' ? val.replace( TRIM_LEFT, "" ).replace( TRIM_RIGHT, "" ) : '';
    }

    /**
     * 合并其它参数到指定的 target 对象中
     * 如果只有一个参数则只对 Utils 本身进行扩展。
     * @returns Object
     */
    Utils.extend=function(){

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

        for ( ; i < length; i++ ) {
            // Only deal with non-null/undefined values
            if ( (options = arguments[ i ]) != null ) {
                // Extend the base object
                for ( name in options ) {
                    src = target[ name ];
                    copy = options[ name ];

                    // Prevent never-ending loop
                    if ( target === copy ) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if ( deep && copy && ( Utils.isObject(copy) || (copyIsArray = Utils.isArray(copy)) ) )
                    {
                        if ( copyIsArray ) {
                            copyIsArray = false;
                            clone = src && Utils.isArray(src) ? src : [];
                        } else {
                            clone = src && Utils.isObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[ name ] = Utils.extend( deep, clone, copy );

                        // Don't bring in undefined values
                    } else if ( copy !== undefined )
                    {
                        target[ name ] = copy;
                    }
                }
            }
        }
        return target;
    }

    /**
     * @type {RegExp}
     */
    var singleTagExp=/^<(\w+)(.*?)\/\s*>$/;

    /**
     * 创建HTML元素
     * @param html 一个html字符串
     * @returns {Node}
     */
    Utils.createElement=function( html )
    {
        if( Utils.isString(html) )
        {
            html=Utils.trim( html );
            var match;
            if( html.charAt(0) !== "<" && html.charAt( html.length - 1 ) !== ">" )
            {
                return document.createElement( html );

            }else if( html.length >= 3 && ( match=singleTagExp.exec(html) ) )
            {
                var elem = document.createElement(match[1]);
                var attr;
                if( match[2] && match[2] !="" && (attr=match[2].replace(/=\s*(\w+)/g,'="$1"').match( getAttrExp )) )
                {
                    var i= 0,item;
                    while( item=attr[i++] )
                    {
                        var val  =  item.split('=');
                        if( val.length > 0 )
                        {
                            var attrNode = document.createAttribute( Utils.trim( val[0] ) );
                            if( typeof val[1] === "string" )
                            {
                                attrNode.nodeValue=val[1].replace( lr ,'').replace(/\\([\'\"])/g,'$1');
                            }
                            elem.setAttributeNode( attrNode )
                        }
                    }
                }
                return elem;
            }

            var div = document.createElement( "div")
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

        }else if ( Utils.isHTMLElement(html) && html.parentNode )
           return Utils.clone(html,true);
        throw new Error('Uitls.createElement param invalid')
    }

    /**
     * 格式化输出
     * @format
     * @param [...]
     * @returns {string}
     */
    Utils.sprintf=function()
    {
        var str='',i= 1,len=arguments.length,param
        if( len > 0 )
        {
           str=arguments[0];
           for( ; i< len ; i++ )
           {
                param=arguments[i];
                str=str.replace(/%(s|d|f)/,function(all,method)
                {
                    return param;
                })
           }
           str.replace(/%(s|d|f)/,'');
        }
        return str;
    }

    var crc32Table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 " +
        "E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D " +
        "6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 " +
        "3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 " +
        "ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 " +
        "CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 " +
        "01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 " +
        "7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 " +
        "F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE " +
        "A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 " +
        "33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F " +
        "5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C " +
        "74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D " +
        "0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 " +
        "89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 " +
        "D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF " +
        "4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 " +
        "2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 " +
        "EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 " +
        "86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA " +
        "11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 " +
        "4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C " +
        "CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 " +
        "B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";

    Utils.crc32 = function(  str, crc )
    {
        if( crc === undefined ) crc = 0;
        var n = 0; //a number between 0 and 255
        var x = 0; //an hex number
        crc = crc ^ (-1);
        for( var i = 0, iTop = str.length; i < iTop; i++ )
        {
            n = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
            x = "0x" + crc32Table.substr( n * 9, 8 );
            crc = ( crc >>> 8 ) ^ x;
        }
        return Math.abs( crc ^ (-1) );
    };

    /**
     * 导入一个可执行的脚本文件。通常是 js,css 文件。
     * @param file 脚本的文件地址。
     * @param callback 成功时的回调函数。
     */
    Utils.require=function( file , callback )
    {
        var script;
        if( typeof file !== 'string' )
        {
            script=file;
            file= file.src || file.href;
        }

        var type = file.match(/\.(css|js)(\?.*?)?$/i)
        if( !type )throw new Error('import script file format of invalid');

        file+=( !type[2] ? '?t=' : '&t=')+Utils.time();

        type=type[1];
        type=type.toLowerCase() === 'css' ? 'link' : 'script';

        if( !script )
        {
            var head=document.getElementsByTagName('head')[0];
            var ref=Sizzle( type +':last,:last-child',head )[0];
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
        }

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
    }

    /**
     * 判断是否为一个框架元素
     * @param element
     * @returns {boolean}
     */
    Utils.isFrame=function( element )
    {
        if( element && typeof element.nodeName ==='string' )
        {
            var nodename = element.nodeName.toLowerCase()
            if( nodename === 'iframe' || nodename==='frame' )
               return true;
        }
        return false;
    };


    /**
     * 在指定的元素对象上设置数据
     * @param target 目标对象
     * @param name  属性名
     * @param value 数据
     * @type {*}
     */
    Utils.storage=function(target,name,value)
    {
        target = target.storage || (target.storage={});
        if( typeof name === 'string' )
        {
            if( value === null )
            {
                if( typeof target[ name ] !== 'undefined' )
                    delete target[ name ];
                return true;
            }
            if(  typeof value === 'undefined' )
                return target[ name ] || null;
            target[ name ] = value;
            return true;
        }
        return target;
    }

})();
