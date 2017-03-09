/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 * @require System,Object,Array,EventDispatcher,Document,Window,StyleEvent,PropertyEvent,ElementEvent,Math
 */
var fix={
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
    ,attrtrue:{
        'className':true,
        'innerHTML':true,
        'value'    :true
    }
    ,cssPrefixName:''
    ,cssPrefix:{
        'box-shadow':true,
        'border-radius':true,
        'border-top-left-radius':true,
        'border-top-right-radius':true,
        'border-bottom-left-radius':true,
        'border-bottom-right-radius':true,
        'focus-ring-color':true,
        'user-select':true,
        'radial-gradient':true,
        'linear-gradient':true,
        'animation-name':true,
        'animation-duration':true,
        'animation-iteration-count':true,
        'animation-delay':true,
        'animation-fill-mode':true,
        'animation-direction':true,
        'animation-timing-function':true,
        'animation-play-state':true
    }
    ,cssUpperRegex:/([A-Z]|^ms)/g
    ,cssCamelRegex:/-([a-z]|[0-9])/ig
    ,cssCamelCase:function( all, letter )
    {
        return ( letter + "" ).toUpperCase();
    }
    ,cssNumber:{
        "fillOpacity": true,
        "fontWeight": true,
        "lineHeight": true,
        "opacity": true,
        "orphans": true,
        "widows": true,
        "zIndex": true,
        "zoom": true
    }
    ,cssHooks:{}
    ,cssMap:{}
    ,fnHooks:{}
    ,getsizeval:function( prop )
    {
        if ( Element.prototype.isWindow.call(this) )
        {
            return Math.max(
                this['inner'+prop] || 0,
                this['offset'+prop] || 0,
                this['client'+prop] || 0,
                this.document.documentElement['client'+prop] || 0
            );

        } else if (Element.prototype.isDocument.call(this) )
        {
            return Math.max(
                    this.body['scroll'+prop] || 0,
                    this.documentElement['scroll'+prop] || 0,
                    this.body['offset'+prop] || 0,
                    this['offset'+prop] || 0,
                    this.body['client'+prop] || 0,
                    this['client'+prop] || 0
                )+(this.documentElement[ prop==='Height'? 'clientTop' : 'clientLeft' ] || 0);
        }
        return this['offset'+prop] || 0;
    }
};

/**
 * @private
 */
var accessor={};

/**
 * @private
 */
function access(callback, name, newValue)
{
    var write= typeof newValue !== 'undefined';
    if( !write && this.length < 1 )return null;
    var getter = accessor[callback].get;
    var setter = accessor[callback].set;
    if( fix.fnHooks[callback] )
    {
        getter = typeof fix.fnHooks[callback].get === "function" ? fix.fnHooks[callback].get : getter ;
        setter = typeof fix.fnHooks[callback].set === "function" ? fix.fnHooks[callback].set : setter ;
    }
    if( !write )return getter.call(this.current(),name,this);
    return this.forEach(function(elem)
    {
        var oldValue= getter.call(elem,name,this);
        if( oldValue !== newValue )
        {
            var event = setter.call(elem,name,newValue,this);
            if( typeof event === "string" )
            {
                event = event===StyleEvent.CHANGE ?  new StyleEvent( StyleEvent.CHANGE ) :  new PropertyEvent( PropertyEvent.CHANGE );
                event.property = name;
            }
            if( event instanceof PropertyEvent )
            {
                event.property = event.property || name;
                event.newValue = event.newValue || newValue;
                event.oldValue = event.oldValue || oldValue;
                this.dispatchEvent( event );
            }
        }

    });
}

/**
 * @private
 */
function removeChild(parent,child, flag )
{
    if( child && parent.hasChildNodes() && child.parentNode === parent )
    {
        var result=parent.removeChild( child );
        flag===false || dispatchElementEvent.call(this,parent,child,ElementEvent.REMOVE);
        return !!result;
    }
    return false;
}

/**
 * @private
 */
function getChildNodes(elem, selector, flag)
{
    var ret=[],isfn=System.isFunction(selector);
    if( elem.hasChildNodes() )
    {
        var len=elem.childNodes.length,index= 0,node;
        while( index < len )
        {
            node=elem.childNodes.item(index);
            if( ( isfn && selector.call(this,node,index) ) || ( !isfn && (selector==='*' || node.nodeType===1) )  )
                ret.push( node );
            if( flag===true && ret.length >0 )break;
            ++index;
        }
    }
    return ret;
}
/**
 * @private
 */
function dispatchElementEvent(parent, child , type )
{
    if( this instanceof EventDispatcher && this.hasEventListener( type )  )
    {
        var event=new ElementEvent( type );
        event.parent=parent;
        event.child=child;
        return this.dispatchEvent( event );
    }
    return true;
}

/**
 *  @private
 */
function doMake( elems )
{
    var r = this.__reverts__ || (this.__reverts__ = []);
    r.push( this.splice(0,this.length, elems ) );
    this.current(null);
    return this;
}

/**
 *  @private
 */
function doRecursion(propName,strainer, deep )
{
    var currentItem,ret=[];
    var s = typeof strainer === "string" ? function(){return querySelector(strainer, null , null, [this]).length > 0 } :
        typeof strainer === "undefined" ? function(){return this.nodeType===1} : strainer ;

    this.forEach(function(elem)
    {
        if( elem && elem.nodeType )
        {
            currentItem=elem;
            do{
                currentItem = currentItem[propName];
                if( currentItem && s.call(currentItem) )ret = ret.concat( currentItem );
            } while (deep && currentItem)
        }
    });
    return ret;
}



/**
 * @private
 * @type {RegExp}
 */
var selectorExpr = /^(?:#([\w-]+)|\:?(\w+.*?)|\.([\w-]+)|(\[[\w-]+.*?\]))$/;

/**
 * 判断是否为一个有效的选择器
 * @param selector
 * @returns {boolean}
 */
function isSelector( selector )
{
    return typeof selector === "string" ? selectorExpr.test( selector ) : false;
};

/**
 * 统一规范的样式名
 * @param name
 * @returns {string}
 */
function getStyleName( name )
{
    if( typeof name !=='string' )
        return name;
    if( name === 'cssText')
        return name;
    name=fix.cssMap[name] || name;
    name=name.replace( /^-ms-/, "ms-" ).replace( fix.cssCamelRegex, fix.cssCamelCase );
    name = name.replace( fix.cssUpperRegex, "-$1" ).toLowerCase();
    if( fix.cssPrefix[name] === true )
        return fix.cssPrefix+name;
    return name;
};

/**
 * 选择元素
 * @param mixed selector CSS3选择器
 * @param mixed context  上下文
 * @returns []
 */
var querySelector = typeof Sizzle === "function" ?  function querySelector(selector, context, results, seed) {
    return Sizzle( selector, context, results, seed);
} : function querySelector(selector, context, results, seed )
{
    if( !(results instanceof Array) )
    {
        //如果选择器不是一个字符串
        if (typeof selector !== "string")
        {
            results = Element.prototype.isNodeElement.call(selector) || Element.prototype.isWindow(selector) ? [selector] : [];
        }else
        {
            var has = false;
            //设置上下文
            if (context && typeof context.nodeName === "string" && context.nodeType === 1) {
                var id = context.getAttribute('id');
                if (!id || id == '') {
                    has = true;
                    id = 'sq_' + Math.ceil( Math.random() * 1000000);
                    context.setAttribute('id', id);
                }
                selector = '#' + id + ' ' + selector;
            } else if (typeof context === "string") {
                selector = context + ' ' + selector;
            }
            results = document.querySelectorAll(selector);
            if(has)context.removeAttribute('id');
        }
    }

    if( isArray(seed) )
    {
        var i=0;
        var ret=[];
        while( i<seed.length )if( Array.prototype.indexOf.call(results, seed[i]) >=0 )
        {
            ret.push( seed[i] )
            i++;
        }
        return ret;
    }
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
function createElement(html )
{
    if(System.isString(html) )
    {
        html=System.trim( html );
        if( html !== '' )
        {
            var match;
            if( html.charAt(0) !== "<" && html.charAt( html.length - 1 ) !== ">" && html.length >=1 )
            {
                return document.createElement( html );

            }else if( html.charAt(0) === "<" && ( match=singleTagRegex.exec(html) ) )
            {
                var elem = document.createElement( match[1] );
                var attr =matchAttr( html );
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

    }else if (Element.prototype.isNodeElement.call(html) )
        return  html.parentNode ?cloneNode(html,true) : html;
    throw new Error('createElement param invalid')
};

var getAttrExp = /(\w+)(\s*=\s*([\"\'])([^\3]*?)[^\\]\3)?/g;
var lrQuoteExp = /^[\'\"]|[\'\"]$/g;

/**
 * 匹配字符串中的属性
 * @param strAttr
 * @return {}
 */
function matchAttr(strAttr)
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
                    var prop =System.trim( val[0] );
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
 * 以小写的形式返回元素的节点名
 * @returns {string}
 */
function getNodeName(elem )
{
    return elem && typeof elem.nodeName=== "string" && elem.nodeName!='' ? elem.nodeName.toLowerCase() : '';
};


/**
 * 合并元素属性。
 * 将 refTarget 对象的属性合并到 target 元素
 * @param target 目标对象
 * @param oSource 引用对象
 * @returns {*}
 */
function mergeAttributes(target, oSource)
{
    var iselem=Element.prototype.isNodeElement.call( target );
    if( System.isObject(oSource,true) )
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
function hasStyle(elem )
{
    return !( !elem || !elem.nodeType || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style );
};


/**
 * 克隆节点元素
 * @param nodeElement
 * @returns {Node}
 */
function cloneNode(nodeElement , deep )
{
    if( nodeElement.cloneNode )
    {
        return nodeElement.cloneNode( !!deep );
    }
    //nodeElement.nodeName
    if( typeof nodeElement.nodeName==='string' )
    {
        var node = document.createElement( nodeElement.nodeName  );
        if( node )mergeAttributes(node,nodeElement);
        return node;
    }
    return null;
};

/**
 * Element class
 * @param selector
 * @param context
 * @returns {Element}
 * @constructor
 */
function Element(selector, context)
{
    if( !(this instanceof Element) )
    {
        return new Element( selector, context );
    }
    if( context )
    {
        this.context = context;
    }
    var result=[];
    if( selector )
    {
        if (System.isArray(selector))
        {
            result = Array.prototype.filter.call(selector, function (elem) {
                return Element.prototype.isNodeElement.call(elem) || Element.prototype.isWindow.call(elem);
            });

        } else if (selector instanceof Element) {
            result = selector.slice(0);

        } else if (typeof selector === "string") {
            result = selector.charAt(0) === '<' && selector.charAt(selector.length - 1) === '>' ? createElement(selector) : querySelector(selector, context);
        }
        else if (Element.prototype.isNodeElement.call(selector)) {
            result = selector;
        }
    }
    Array.prototype.splice.apply(this,[0,0].concat(result) );
    EventDispatcher.call(this);
    this.forEachCurrentItem = null;
    this.forEachCurrentIndex = NaN;
}
Element.prototype= new EventDispatcher();
Element.prototype.constructor = Element;
Element.prototype.context = undefined;
//@private Element.prototype.forEachCurrentItem
Element.prototype.forEachCurrentItem=undefined;
//@private Element.prototype.forEachCurrentIndex
Element.prototype.forEachCurrentIndex=NaN;
Element.prototype.length=0;
Element.prototype.slice= Array.prototype.slice;
Element.prototype.concat=Array.prototype.concat;
Element.prototype.indexOf= Array.prototype.indexOf;
Element.prototype.splice= Array.prototype.splice;

/**
 * 遍历元素
 * @param function callback
 * @param object refObject
 * @returns {*}
 */
Element.prototype.forEach=function forEach(callback , refObject )
{
    var result;
    refObject=refObject || this;
    var current = this.forEachCurrentItem;
    if( current  )
    {
        result=callback.call( refObject ,current,this.forEachCurrentIndex );
    }else
    {
        var items=this.slice(0),
            index = 0,
            len=items.length;
        for( ; index < len ; index++ )
        {
            current = items[ index ];
           this.forEachCurrentItem=current;
           this.forEachCurrentIndex=index;
            result=callback.call( refObject ,current,index);
            if( result !== undefined )
                break;
        }
        this.forEachCurrentItem=null;
        this.forEachCurrentIndex=NaN;
    }
    return typeof result === 'undefined' ? this : result;
};

/**
 * 设置获取当前操作的元素
 * 此操作不会改变原有元素结果集，只是对当前操作的设置和一个引用的元素
 * 如果在调用这个方法之前调用了this.forEach且没有结束遍历，则返回的是forEach当前游标位置的元素，否则为0的游标元素
 * @param selector|HTMLElement element
 * @returns {*}
 */
Element.prototype.current=function current( elem )
{
    if( elem == null )return this.forEachCurrentItem || this[0];
    if( typeof elem=== "string" )
    {
        elem=querySelector(elem, this.context || document );
        this.forEachCurrentItem=(elem && elem.length > 0 ? elem[0] : null);
        this.forEachCurrentIndex=NaN;

    }else if(  Element.prototype.isNodeElement.call(elem) || Element.prototype.isWindow.call(elem) )
    {
       this.forEachCurrentItem=elem;
       this.forEachCurrentIndex=NaN;

    }else
    {
        this.forEachCurrentItem=null;
        this.forEachCurrentIndex=NaN;
    }
    return this;
};

/**
 * @private
 */
accessor['property']={
    get:function(name){
        return ( fix.attrtrue[name] || typeof this.getAttribute !== "function"  ? this[name] : this.getAttribute(name) ) || null; }
    ,set:function(name,newValue){
        newValue === null ?
            ( fix.attrtrue[name] || typeof this.removeAttribute !== "function"  ? delete this[name] : this.removeAttribute(name) ) :
            ( fix.attrtrue[name] || typeof this.setAttribute !== "function"  ? this[name] = newValue : this.setAttribute(name, newValue) );
        return PropertyEvent.CHANGE;
    }
};

/**
 * 为每一个元素设置属性值
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.property=function property(name, value )
{
    name =  fix.attrMap[name] || name;
    var lower=name.toLowerCase();
    if( lower==='innerhtml' || lower==='html' )
    {
        return this.html(value);

    }else if( lower==='value' || lower==='text' )
    {
        return this[lower]( value );

    }else if( lower === 'classname' && typeof value === "string" )
    {
        this.addClass(value);

    }else if( lower === 'style' )
    {
        System.throwError('error', 'the style property names only use style method to operate in property');
    }
    return access.call(this,'property',name,value);
};

/**
 * 判断当前匹配元素是否有指定的属性名
 * @param prop
 * @returns {boolean}
 */
Element.prototype.hasProperty=function hasProperty(prop )
{
    var elem = this.current();
    if( !elem )return false;
    return typeof elem.hasAttributes === 'function' ? elem.hasAttributes( prop ) : !!elem[prop];
};


/**
 * 获取设置数据对象,支持带'.'操作
 * @param name
 * @param value
 * @returns {*}
 */
Element.prototype.data=function data(name, value )
{
    var write = typeof value !== "undefined";
    var type =  typeof name;
    return this.forEach(function(target)
    {
        if( type === "object" )
        {
            target.__data__ = name;

        }else if( type === 'string' )
        {
            target = target.__data__ || (target.__data__={});
            var namespace = name.split('.');
            var i = 0, len = namespace.length-1;
            while( i<len )
            {
                name = namespace[i++];
                target= target[ name ] || (target[ name ] = {});
            }
            name = namespace[ len++ ];
            if( !write )
            {
                return target[ name ] || null;
            }

            if( value !== null )
            {
                target[name] = value;

            }else if(  typeof target[ name ] !== 'undefined' )
            {
                delete target[ name ];
            }
        }
    })
};

var rgbregex = /\s*rgba\(\s*(\d+)\,\s*(\d+)\,\s*(\d+)/i;
var rgbToHex = function (value)
{
      var ret = value.match(rgbregex);
      if( ret )
      {
          return [
              '#',
              ("0" + System.Number(ret[1] >> 0).toString(16) ).slice(-2),
              ("0" + System.Number(ret[2] >> 0).toString(16) ).slice(-2),
              ("0" + System.Number(ret[3] >> 0).toString(16) ).slice(-2),
          ].join('');
      }
      return value;
}

/**
 * @private
 */
accessor['style']= {
    get:function(name){
        var getter = fix.cssHooks[name] && typeof fix.cssHooks[name].get === "function" ? fix.cssHooks[name].get : null;
        var currentStyle = hasStyle(this) ? (document.defaultView && document.defaultView.getComputedStyle ?
            document.defaultView.getComputedStyle(this, null) : this.currentStyle || this.style) : {};
        return getter ? getter.call(this, currentStyle, name) : currentStyle[name];
    }
    ,set:function(name,value, obj ){
        var type = typeof value;
        if( type === "string" ){
            value = System.trim(value);
            type = /^\d+$/.test( value ) ? 'number' : type;
        }
        if( !this || !this.style || ( type === "number" && System.isNaN( value ) ) )return;
        var increment = type === "string" ? /^([\-+])=([\-+.\de]+)/.exec( value ) : null;

        //增量值
        if (increment) {
            var inc = obj.style(name);
            inc = System.parseFloat(inc) || 0;
            value = ( +( increment[1] + 1 ) * +increment[2] ) + inc;
            type = "number";
        }else if(type==='string' && !fix.cssPrefixName && value.substr(0,5) === "rgba(" )
        {
            value = rgbToHex( value );
        }

        //添加单位
        if (type === "number" && !fix.cssNumber[name])
            value += "px";

        //解析 cssText 样式名
        if (name === 'cssText')
        {
            var elem = this;
            value = value.replace(/([\w\-]+)\s*\:([^\;]*)/g, function (all, name, value) {
                if( !fix.cssPrefixName && value.substr(0,5) === "rgba(" )
                {
                    value = rgbToHex( value );
                }
                if (fix.cssHooks[name] && typeof fix.cssHooks[name].set === "function") {
                    var obj = {};
                    fix.cssHooks[name].set.call(elem, obj, value);
                    return System.serialize(obj, 'style');
                }
                return getStyleName(name) + ':' + value;
            });
        }

        try {
            var orgname = getStyleName(name);
            if ( !fix.cssHooks[name] || typeof fix.cssHooks[name].set !== "function"
                || !fix.cssHooks[name].set.call(this, this.style, value, orgname) )
            {
                this.style[ orgname ] = value;
            }
        } catch (e) {}
        return StyleEvent.CHANGE;
    }
};

/**
 * 设置所有匹配元素的样式
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.style=function style(name, value )
{
    if( typeof name === 'string' && /^(\s*[\w\-]+\s*\:[\w\-\s]+;)+$/.test(name)  )
    {
        value=name;
        name='cssText';
    }
    else if( System.isObject(name) )
    {
        value=System.serialize( name,'style');
        name='cssText';
    }
    return access.call(this,'style',name,value);
};

/**
 * 显示元素
 * @returns {Element}
 */
Element.prototype.show=function show()
{
    return this.forEach(function(){
        var type = this.data('display') || 'block';
        this.style('display', type );
    })
};

/**
 * 隐藏当前元素
 * @returns {Element}
 */
Element.prototype.hide=function hide()
{
    return this.forEach(function(){
        var d = this.style('display');
        this.data('display', System.isEmpty( d ) ? 'block' : d );
        this.style('display', 'none' )
    })
};


/**
 * @private
 */
accessor['text']= {
    get:function(){  return typeof this.textContent === "string" ? this.textContent : this.innerText; }
    ,set:function(newValue){
        typeof this.textContent === "string" ? this.textContent=newValue : this.innerText=newValue;
        return PropertyEvent.CHANGE;
    }
};


/**
 * 获取设置当前元素的文本内容。
 * @returns {string|Element}
 */
Element.prototype.text=function text( value )
{
    return access.call(this,'text','text',value);
};

/**
 * @private
 */
accessor['value']= {
    get:function(){ return this.hasAttribute('value') ? this.value : null }
    ,set:function(name,newValue){
        this.hasAttribute('value') ? this.value=newValue : null ;
        return PropertyEvent.CHANGE;
    }
};


/**
 * 获取设置表单元素的值。此方法只会对表单元素有用。
 * @returns {string|Element}
 */
Element.prototype.value=function value( val )
{
    return access.call(this,'value','value',val);
};


/**
 * 判断是否有指定的类名
 * @param className
 * @returns {boolean}
 */
Element.prototype.hasClass=function hasClass(className )
{
    var elem = this.current();
    if( !elem )return false;
    var value=elem['className'] || '';
    return value === '' || !value ? false : typeof className==='string' ? new RegExp('(\\s|^)' + className + '(\\s|$)').test( value ) : true ;
};


/**
 * 添加指定的类名
 * @param className
 * @returns {Element}
 */
Element.prototype.addClass=function addClass(className )
{
    if( typeof className !== "string" )
        throw new Error('invaild class name');
    className = System.trim( className );
    this.forEach(function(elem){

        if( !this.hasClass( className ) )
        {
            var oldClass=System.trim( elem['className'] );
            var old = oldClass;
            oldClass= [ System.trim( oldClass ) ];
            oldClass.push( className );
            var newValue = System.trim( oldClass.join(' ') );
            elem['className'] = newValue;

            if( this.hasEventListener(StyleEvent.CHANGE) )
            {
                var event = new StyleEvent( StyleEvent.CHANGE );
                event.property = 'class';
                event.newValue = newValue;
                event.oldValue = old;
                return event
            }
        }
    });
    return this;
};

/**
 * 移除指定的类名或者清除所有的类名。
 * @param className
 * @returns {Element}
 */
Element.prototype.removeClass=function removeClass(className )
{
    var all = typeof className !== 'string';
    return this.forEach(function(elem){
        var newValue='';
        var old=elem['className'] || '';
        if( !all )
        {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            newValue=old.replace(reg, '');
        }
        newValue === '' ? elem.removeAttribute('class') : elem['className'] = System.trim(newValue);
        try {
            elem.offsetWidth = elem.offsetWidth;
            if( this.hasEventListener(StyleEvent.CHANGE) )
            {
                var event = new StyleEvent( StyleEvent.CHANGE );
                event.property = 'class';
                event.newValue = old;
                event.oldValue = newValue;
                return event
            }
        }catch(e){}
    })
};

/**
 * 获取设置元素宽度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.width=function width(value )
{
    return access.call(this,'style','width',value);
};

/**
 * 获取设置元素高度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.height=function height(value )
{
    return access.call(this,'style','height',value);
};

/**
 * @private
 */
accessor['scroll']={
    get:function(prop){
        var e = this.defaultView || this.parentWindow || this;
        var p= 'scroll'+prop;
        return Element.prototype.isWindow.call( e ) ? e[ prop.toLowerCase()==='top'?'pageYOffset':'pageXOffset'] || e.document.documentElement[p] || e.document.body[p] : e[p] ;
    },
    set:function(prop,newValue,obj){
        var e = this.defaultView || this.parentWindow || this;
        if( obj.style('position')==='static' )obj.style('position','relative');
        if(typeof e.scrollTo === "function")
        {
            var param = [newValue,NaN];
            if( prop.toLowerCase()==='top' )param = param.reverse();
            e.scrollTo.apply(e, param );
        } else
        {
            e['scroll'+prop] = newValue;
        }

        if( this.hasEventListener( ScrollEvent.CHANGE ) ){

            var event = new ScrollEvent( ScrollEvent.CHANGE );
            event.property = prop.toLowerCase();
            return event;
        }
    }
};

/**
 * 获取设置滚动条顶部的位置
 * @param value
 */
Element.prototype.scrollTop=function scrollTop(value)
{
    return access.call(this,'scroll','Top',value);
};

/**
 * 获取设置滚动条左部的位置
 * @param value
 */
Element.prototype.scrollLeft=function scrollLeft(value)
{
    return access.call(this,'scroll','Left',value);
};

/**
 * 获取滚动条的宽度
 * @param value
 */
Element.prototype.scrollWidth=function scrollWidth()
{
    return access.call(this,'scroll','Width');
};

/**
 * 获取滚动条的高度
 * @param value
 */
Element.prototype.scrollHeight=function scrollHeight()
{
    return access.call(this,'scroll','Height');
};

/**
 * 获取元素相对文档页面边界的矩形坐标。
 * 如果元素的 position = fixed 或者 force=== true 则相对浏览器窗口的位置
 * @param NodeElement elem
 * @param boolean force
 * @returns {left,top,right,bottom,width,height}
 */
Element.prototype.getBoundingRect=function getBoundingRect( force )
{
    var value={ 'top': 0, 'left': 0 ,'right' : 0,'bottom':0,'width':0,'height':0};
    var elem= this.current();
    if( this.isWindow() )
    {
        value.left = elem.screenLeft || elem.screenX;
        value.top = elem.screenTop || elem.screenY;
        value.width = this.width();
        value.height = this.height();
        value.right = value.width + value.left;
        value.bottom = value.height + value.top;
        return value;
    }

    if( !this.isNodeElement() )
        throw new Error('invalid elem. elem not is NodeElement');

    var doc =  elem.ownerDocument || elem, docElem=doc.documentElement;
    this.current( Element.prototype.getWindow.call(doc) );
    var scrollTop = this.scrollTop();
    var scrollLeft = this.scrollLeft();
    this.current( elem );

    if( "getBoundingClientRect" in document.documentElement )
    {
        var box = elem.getBoundingClientRect();
        var clientTop = docElem.clientTop || doc.body.clientTop || 0,
            clientLeft = docElem.clientLeft || doc.body.clientLeft || 0;

        value.top = box.top + scrollTop - clientTop;
        value.left = box.left + scrollLeft - clientLeft;
        value.right = box.right + scrollLeft - clientLeft;
        value.bottom = box.bottom + scrollTop - clientTop;
        value.width = box.width || box.right-box.left;
        value.height = box.height || box.bottom-box.top;

    }else
    {
        value.width = this.width();
        value.height= this.height();
        do {
            value.top += elem.offsetTop;
            value.left += elem.offsetLeft;
            elem = elem.offsetParent;
        } while (elem);
        value.right = value.width+value.left;
        value.bottom = value.height+value.top;
    }

    //始终相对浏览器窗口的位置
    if( this.style('position') === 'fixed' || force===true )
    {
        value.top -= scrollTop;
        value.left -= scrollLeft;
        value.right -= scrollLeft;
        value.bottom -= scrollTop;
    }
    return value;
};

/**
 * @private
 */
accessor['position']={
    get:function(prop,obj){
        return obj.getBoundingRect()[ prop ];
    },
    set:function(prop,newValue,obj){

       /* var elem = obj.current();
        if( elem.parentNode )
        {
            obj.current( elem.parentNode )
            if( obj.style('position')==='static' ){
                obj.style('position','relative');
            }
            obj.current( elem );
        }*/
        if( obj.style('position')==='static' )
        {
            obj.style('position','absolute');
        }
        return obj.style(prop,newValue>>0);
    }
};


/**
 * 获取或者设置相对于父元素的左边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.left=function left(val )
{
    return access.call(this,'position','left',val)
};

/**
 * 获取或者设置相对于父元素的顶边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.top=function top(val )
{
    return access.call(this,'position','top',val)
};

/**
 * 获取或者设置相对于父元素的右边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.right=function right(val )
{
    return access.call(this,'position','right',val)
};

/**
 * 获取或者设置相对于父元素的底端位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.bottom=function bottom(val )
{
    return access.call(this,'position','bottom',val)
};

/**
 * @private
 */
function point(left, top, local )
{
    var old = this.forEachCurrentItem;
    var target = this.current();
    this.current( target.parentNode );
    var offset=this.getBoundingRect();
    this.current( old );
    left = left || 0;
    top = top || 0;
    return local===true ? {left:offset.left+left,top:offset.top+top} : {left:left-offset.left, top:top-offset.top};
}

/**
 *  将本地坐标点转成相对视图的全局点
 *  @param left
 *  @param top
 *  @returns {object} left top
 */
Element.prototype.localToGlobal=function localToGlobal(left, top)
{
    return point.call(this,left, top, true);
};

/**
 *  将视图的全局点转成相对本地坐标点
 *  @param left
 *  @param top
 *  @returns {object}  left top
 */
Element.prototype.globalToLocal=function globalToLocal(left, top )
{
    return point.call(this,left, top);
};

//============================================元素选择===================================

/**
 * 回撒到指定步骤的选择器所匹配的元素,不包含初始化的步骤。
 * @param step
 * @returns {Element}
 */
Element.prototype.revert=function revert(step)
{
    var reverts= this.__reverts__;
    if( reverts && reverts.length > 0 )
    {
        var len=reverts.length;
        step = step || -1;
        step= step < 0 ? step+len : step;
        step=step >= len ? 0 : step;
        this.splice(0,this.length, reverts.splice(step, len-step).shift() );
    }
    return this;
};

/**
 * 查找当前匹配的第一个元素下的指定选择器的元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.find=function find(selector )
{
    var ret=[];
    this.forEach(function(elem){
        ret = ret.concat.apply(ret,querySelector(selector, elem ) );
    });
    return doMake.call( this, ret );
};

/**
 * 查找所有匹配元素的父级元素或者指定selector的父级元素（不包括祖辈元素）
 * @param selector
 * @returns {Element}
 */
Element.prototype.parent=function parent(selector )
{
    return doMake.call( this, Array.prototype.unique.call( doRecursion.call(this,'parentNode',selector ) ) );
};

/**
 * 查找所有匹配元素的祖辈元素或者指定 selector 的祖辈元素。
 * 如果指定了 selector 则返回最近的祖辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.parents=function parents(selector )
{
    return doMake.call( this, Array.prototype.unique.call( doRecursion.call(this,'parentNode',selector, true ) ) );
};

/**
 * 获取所有匹配元素向上的所有同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prevAll=function prevAll(selector )
{
    return doMake.call( this, doRecursion.call(this,'previousSibling', selector, true ) );
};

/**
 * 获取所有匹配元素紧邻的上一个同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prev=function prev(selector )
{
    return doMake.call( this, doRecursion.call(this,'previousSibling', selector ) );
};

/**
 * 获取所有匹配元素向下的所有同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.nextAll=function nextAll(selector )
{
    return doMake.call( this, doRecursion.call(this,'nextSibling', selector , true ) );
};

/**
 * 获取每一个匹配元素紧邻的下一个同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.next=function next(selector )
{
    return doMake.call( this, doRecursion.call(this,'nextSibling', selector ) );
};

/**
 * 获取每一个匹配元素的所有同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.siblings=function siblings(selector )
{
    var results=[].concat( doRecursion.call(this,'previousSibling',selector,true) , doRecursion.call(this,'nextSibling',selector, true) );
    return doMake.call( this, results );
};

/**
 * 查找所有匹配元素的所有子级元素，不包括孙元素
 * @param selector 如果是 * 返回包括文本节点的所有元素。不指定返回所有HTMLElement元素。
 * @returns {Element}
 */
Element.prototype.children=function children(selector )
{
    if( typeof selector === 'undefined' )
    {
        selector= function(item){ return item.nodeType===1 };
    }
    var is=typeof selector === "function";
    var results=[];
    this.forEach(function(element)
    {
        if( !this.isFrame() && element.hasChildNodes() )
        {
            var child = this.slice.call( element.childNodes );
            results =  is ? this.concat.call( results, Array.prototype.filter.call(child, selector ) ) :
                this.concat.call( results, querySelector(selector,element,null,child) );
        }
    });
    return doMake.call( this, Array.prototype.unique.call(results) );
};

//========================操作元素===========================

/**
 * 用指定的元素来包裹当前所有匹配到的元素
 * @param element
 * @returns {Element}
 */
Element.prototype.wrap=function wrap(element )
{
    var is=System.isFunction( element );
    return this.forEach(function(elem)
    {
        var wrap=createElement( is ? element.call(this,elem) : element );
        this.current( elem.parentNode ).addChildAt( wrap , elem );
        this.current( wrap ).addChildAt( elem ,-1);
    });
};

/**
 * 取消当前所有匹配元素的父级元素。不指定选择器则默认为父级元素，否则为指定选择器的祖辈元素。
 * 父级或者祖辈元素只能是body的子元素。
 * @param selector
 * @returns {Element}
 */
Element.prototype.unwrap=function unwrap(selector )
{
    var is= typeof selector === "undefined";
    return this.forEach(function(elem)
    {
        var parent= is ?  elem.parentNode : doRecursion.call(this,'parentNode',selector )[0];
        if( parent && parent.ownerDocument && Element.prototype.contains.call( parent.ownerDocument.body, parent ) )
        {
            var children=parent.hasChildNodes() ? parent.childNodes : [];
            if( parent.parentNode )
            {
                this.current( parent.parentNode );
                var len=children.length,i=0;
                while( i<len ){
                    if( children[i] )this.addChildAt( children[ i ], parent );
                    i++;
                }
                this.removeChildAt( parent );
            }
        }
    });
};


/**
 * 获取或者设置 html
 * @param htmlObject
 * @returns {string | Element}
 */
Element.prototype.html=function html( htmlObject )
{
    var outer = htmlObject === true;
    var write= !outer && typeof htmlObject !== "undefined";
    if( !write && this.length < 1 ) return '';
    return this.forEach(function(elem)
    {
        if( !write )
        {
            htmlObject=elem.innerHTML;
            if( outer )
            {
                if( typeof elem.outerHTML==='string' )
                {
                    htmlObject=elem.outerHTML;
                }else
                {
                    var cloneElem=cloneNode( elem, true);
                    if( cloneElem )
                    {
                        htmlObject=document.createElement( 'div' ).appendChild( cloneElem ).innerHTML;
                    }
                }
            }
            return htmlObject;
        }

        if( elem.hasChildNodes() )
        {
            var nodes=elem.childNodes;
            var len=nodes.length,b=0;
            for( ; b < len ; b++ ) if( nodes[b] )
            {
                removeChild.call(this,elem, nodes[b] , false );
            }
        }

        if( typeof htmlObject === "string" )
        {
            htmlObject = System.trim( htmlObject );
            try{
                elem.innerHTML = htmlObject;
                dispatchElementEvent.call(this,elem,htmlObject,ElementEvent.ADD)
            }catch(e)
            {
                var nodename = getNodeName( elem );
                if( !new RegExp("^<"+nodename).exec(htmlObject) )
                {
                    htmlObject= System.sprintf('<%s>%s</%s>',nodename,htmlObject,nodename);
                }
                var child= createElement( htmlObject );
                var deep =  nodename === 'tr' ? 2 : 1,d=0;
                while( d < deep && child.firstChild )
                {
                    d++;
                    child=child.firstChild;
                }
                mergeAttributes(child, elem);
                elem.parentNode.replaceChild(child,  elem );
                dispatchElementEvent.call(this,elem.parentNode,child,ElementEvent.ADD);
            }

        }else
        {
            this.addChild(htmlObject);
            return true;
        }
    });
};


/**
 * 添加子级元素（所有已匹配的元素）
 * @param childElemnet
 * @returns {Element}
 */
Element.prototype.addChild=function addChild(childElemnet )
{
    return this.addChildAt( childElemnet,-1);
};

/**
 * 在指定位置加子级元素（所有已匹配的元素）。
 * 如果 childElemnet 是一个已存在的元素，那么会先删除后再添加到当前匹配的元素中后返回，后续匹配的元素不会再添加此元素。
 * @param childElemnet 要添加的子级元素
 * @param index | refChild | fn(node,index,parent)  要添加到的索引位置
 * @returns {Element}
 */
Element.prototype.addChildAt=function addChildAt(childElemnet, index)
{
    if( childElemnet instanceof Element )
    {
        childElemnet=childElemnet.slice(0);
        for( var c=0; c<childElemnet.length; c++)
        {
            this.addChildAt( childElemnet[c], index );
        }
        return this;
    }

    if( index===undefined )
        System.throwError('error','Invalid param the index');

    var isElement= childElemnet && childElemnet.nodeType && typeof childElemnet.nodeName === 'string';

    //如果没有父级元素则设置上下文为父级元素
    if( this.length === 0 && !this.current() )
    {
        var context = $get(this,"context");
        this.current( context === document ? document.body : context );
    }

    return this.forEach(function(parent)
    {
        if( !this.isHTMLElement() )
        {
            System.throwError('error','invalid parent HTMLElement.');
        }
        try{
            var child=isElement ? childElemnet : createElement( childElemnet );
        }catch(e){
            System.throwError('error','The childElemnet not is HTMLElement');
        }
        if( child.parentNode !== parent  )
        {
            if( child.parentNode )this.removeChildAt( child );
            this.current(parent);
            var refChild=index && index.parentNode && index.parentNode===parent ? index : null;
            !refChild && ( refChild=this.getChildAt( typeof index==='number' ? index : index ) );
            refChild && (refChild=index.nextSibling);
            parent.insertBefore( child , refChild || null );
            dispatchElementEvent.call(this,parent,child,ElementEvent.ADD )
        }
        if( isElement ) return this;
    })
};

/**
 * 返回指定索引位置的子级元素( 匹配选择器的第一个元素 )
 * 此方法只会计算节点类型为1的元素。
 * @param index | refChild | fn(node,index,parent)
 * @returns {Node|null}
 */
Element.prototype.getChildAt=function getChildAt( index )
{
    return this.forEach(function(parent)
    {
        var childNodes,child=null;
        if( parent.hasChildNodes() )
        {
            if( typeof index === 'function' )
            {
                child=getChildNodes.call(this, parent ,index ,true)[0];

            }else if( typeof index === 'number' )
            {
                childNodes=getChildNodes.call(this,parent);
                index=index < 0 ? index+childNodes.length : index;
                child=index >= 0 && index < childNodes.length ? childNodes[index] : null;
            }
        }
        return child;
    })
};

/**
 * 返回子级元素的索引位置( 匹配选择器的第一个元素 )
 * @param childElemnet | selector
 * @returns {Number}
 */
Element.prototype.getChildIndex=function getChildIndex( childElemnet )
{
    if( typeof childElemnet==='string' )
    {
        childElemnet= querySelector( childElemnet, null, null, this.slice(0) )[0];
        if( !childElemnet )return -1;
        this.current( childElemnet.parentNode );
    }
    var parent = this.current();
    if( childElemnet.parentNode===parent )
    {
        return this.indexOf.call( getChildNodes(parent), childElemnet );
    }
    return -1;
};


/**
 * 移除指定的子级元素
 * @param childElemnet|selector
 * @returns {Element}
 */
Element.prototype.removeChild=function removeChild( childElemnet )
{
    if( typeof childElemnet==='string' )
    {
        this.forEach(function(elem)
        {
            var children=querySelector(childElemnet,elem), b=0,len=children.length;
            for( ; b<len ; b++)if( children[b] && children[b].nodeType===1 && children[b].parentNode )
            {
                this.removeChildAt( children[b] );
            }
        })
    }else
    {
        this.removeChildAt( childElemnet );
    }
    return this;
};

/**
 * 移除子级元素
 * @param childElemnet|index|fn  允许是一个节点元素或者是相对于节点列表中的索引位置（不包括文本节点）。
 *        也可以是一个回调函数过滤要删除的子节点元素。
 * @returns {Element}
 */
Element.prototype.removeChildAt=function removeChildAt(index)
{
    var is=false;
    if( typeof index === "object" && index.parentNode )
    {
        this.current( index.parentNode );
        is=true;
    }else if( !System.isNumber( index ) )
        throw new Error('Invalid param the index. in removeChildAt');
    return this.forEach(function(parent)
    {
        var child= is ? index : this.getChildAt( index );
        if( child.parentNode === parent )parent.removeChild(child);
        if( is )return this;
    });
};

/**
 * 测试指定的元素（或者是一个选择器）是否为当前元素的子级
 * @param child
 * @returns {boolean}
 */
Element.prototype.contains=function contains( child )
{
    var parent = this instanceof Element ? this.current() : this;
    if( isNodeElement(child) )
    {
        if('contains' in parent)return parent.contains( child ) && parent !== child;
        return !!(parent.compareDocumentPosition(child) & 16) && parent !== child ;
    }
    return querySelector( child, parent ).length > 0;
}

/**
 * 获取元素所在的窗口对象
 * @param elem
 * @returns {window|null}
 */
Element.prototype.getWindow=function getWindow()
{
    var elem = this instanceof Element ? this.current() : this;
    var ret = null;
    if( elem ) {
        elem = elem.ownerDocument || elem;
        ret = elem.window || elem.defaultView || elem.contentWindow || elem.parentWindow;
    }
    return ret ? ret : window || null;
}

//form elements
var formPatternReg=/select|input|textarea|button/i;

/**
 * 判断是否为一个表单元素
 * @returns {boolean}
 */
Element.prototype.isForm=function isForm(exclude)
{
    var elem  = this instanceof Element ? this.current() : this;
    if( elem && typeof elem.nodeName ==='string' )
    {
        var ret=formPatternReg.test( elem.nodeName );
        return ret && typeof exclude === 'string' ? exclude.toLowerCase() !== this.nodeName() : ret;
    }
    return false;
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
Element.prototype.isHTMLElement=function isHTMLElement()
{
    var elem  = this instanceof Element ? this.current() : this;
    if( typeof elem !== "object" )return false;
    return ishtmlobject ? elem instanceof HTMLElement : ( elem.nodeType === 1 && typeof elem.nodeName === "string" );
};

/**
 * 判断是否为一个节点类型元素
 * document window 不属于节点类型元素
 * @returns {boolean}
 */
Element.prototype.isNodeElement=function isNodeElement()
{
    var elem  = this instanceof Element ? this.current() : this;
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
Element.prototype.isHTMLContainer=function isHTMLContainer()
{
    var elem  = this instanceof Element ? this.current() : this;
    if( typeof elem !== "object" ) return false;
    return Element.prototype.isHTMLElement.call(elem) || Element.prototype.isDocument.call(elem);
};

/**
 * 判断是否为一个事件元素
 * @param element
 * @returns {boolean}
 */
Element.prototype.isEventElement=function isEventElement()
{
    var elem  = this instanceof Element ? this.current() : this;
    return (elem && ( typeof elem.addEventListener === "function" || typeof elem.attachEvent=== "function" ) );
};

/**
 * 判断是否为窗口对象
 * @param obj
 * @returns {boolean}
 */
Element.prototype.isWindow=function isWindow()
{
    var elem  = this instanceof Element ? this.current() : this;
    return ( elem && elem === Element.prototype.getWindow.call(elem) );
};

/**
 * 决断是否为文档对象
 * @returns {*|boolean}
 */
Element.prototype.isDocument=function isDocument()
{
    var elem  = this instanceof Element ? this.current() : this;
    return elem && elem.nodeType===9;
};

/**
 * 判断是否为一个框架元素
 * @returns {boolean}
 */
Element.prototype.isFrame=function isFrame()
{
    var elem  = this instanceof Element ? this.current() : this;
    var nodename =getNodeName(elem);
    return (nodename === 'iframe' || nodename==='frame');
};


// fix style name add prefix
if( System.env.platform( System.env.BROWSER_FIREFOX ) && System.env.version(4) )
{
    fix.cssPrefixName='-moz-';

}else if( System.env.platform( System.env.BROWSER_SAFARI )  || System.env.platform( System.env.BROWSER_CHROME ) )
{
    fix.cssPrefixName='-webkit-';

}else if( System.env.platform(System.env.BROWSER_OPERA) )
{
    fix.cssPrefixName='-o-';

}else if( System.env.platform(System.env.BROWSER_IE) && System.env.version(9,'>=') )
{
    fix.cssPrefixName='-ms-';
}

//set hooks for userSelect style
fix.cssHooks.userSelect={

    get: function( style )
    {
        return style[ getStyleName('userSelect') ] || '';
    },
    set: function( style, value )
    {
        style[ getStyleName('userSelect') ] = value;
        style['-moz-user-fetch'] = value;
        style['-webkit-touch-callout'] = value;
        style['-khtml-user-fetch'] = value;
        return true;
    }
};

//set hooks for radialGradient and linearGradient style
fix.cssHooks.radialGradient=fix.cssHooks.linearGradient={

    get: function( style, name )
    {
        return  Element.storage(this,name) || '';
    },
    set: function( style, value, name )
    {
        value = System.trim(value);
        //Element.storage(this,name,value);
        if( ( System.env.platform(System.env.BROWSER_SAFARI) && System.env.version(5.1,'<') )  ||
            ( System.env.platform(System.env.BROWSER_CHROME) && System.env.version(10,'<') ) )
        {
            var position='';
            var deg= 0;
            if(name==='radialGradient')
            {
                position=value.match(/([^\#]*)/);
                if( position ){
                    position = position[1].replace(/\,\s*$/,'');
                    value=value.replace(/([^\#]*)/,'')
                }
                value = value.split(',');
            }else
            {
                var deg = value.match(/^(\d+)deg/);
                value = value.split(',');
                if( deg )
                {
                    deg = deg[1];
                    value.splice(0,1);
                }
                deg=System.parseFloat(deg) || 0;
            }
            var color = [];
            for(var i=0; i<value.length; i++)
            {
                var item = System.trim(value[i]).split(/\s+/,2);
                if( i===0 )color.push("from("+item[0]+")");
                if( !(i===0 || i===value.length-1 ) || typeof item[1] !== "undefined"  )
                {
                    var num = (item[1]>>0) / 100;
                    color.push( "color-stop("+num+","+item[0]+")" );
                }
                if( i===value.length-1 )
                    color.push("to("+item[0]+")");
            }

            var width= Element.getSize(this,'width');
            var height=  Element.getSize(this,'height');
            if(name==='radialGradient')
            {
                position = position.split(/\,/,2);
                var point = System.trim(position[0]).split(/\s+/,2);
                if(point.length===1)point.push('50%');
                var point = point.join(' ');
                position=point+',0, '+point+', '+width/2;
                value=System.sprintf("%s,%s,%s",'radial',position,color.join(',') );

            }else{

                var x1=Math.cos(  deg*(Math.PI/180) );
                var y1=Math.sin(  deg*(Math.PI/180) );
                value=System.sprintf("%s,0% 0%,%s %s,%s",'linear',Math.round(x1*width),Math.round(y1*height),color.join(',') );
            }
            name='gradient';

        }else if( !value.match(/^(left|top|right|bottom|\d+)/) && name==='linearGradient' )
        {
            value= '0deg,'+value;

        }else if( name==='linearGradient' )
        {
            value= value.replace(/^(\d+)(deg)?/,'$1deg')
        }

        var prop = 'background-image';
        if( System.env.platform(System.env.BROWSER_IE) && System.env.version(10,'<') )
        {
            value=value.split(',');
            var deg = value.splice(0,1).toString();
            deg = parseFloat( deg ) || 0;
            var color=[];
            for(var i=0; i<value.length; i++)
            {
                var item = System.trim(value[i]).split(/\s+/,2);
                color.push( i%1===1 ? "startColorstr='"+item[0]+"'" :  "endColorstr='"+item[0]+"'" );
            }
            var type = deg % 90===0 ? '1' : '0';
            var linear = name==='linearGradient' ? '1' : '2';
            value = 'alpha(opacity=100 style='+linear+' startx=0,starty=5,finishx=90,finishy=60);';
            value= style.filter || '';
            value += System.sprintf(";progid:DXImageTransform.Microsoft.gradient(%s, GradientType=%s);",color.join(','), type );
            value += "progid:DXImageTransform.Microsoft.gradient(enabled = false);";
            prop='filter';

        }else
        {
            value= System.sprintf('%s(%s)', getStyleName( name ) , value ) ;
        }
        style[ prop ] = value ;
        return true;
    }
};

//add get width hooks
fix.cssHooks.width= {
    get:function(style){ return ( fix.getsizeval.call(this,'Width') || style['width'] ) >> 0; }
};

//add get height hooks
fix.cssHooks.height={
    get:function (style){return ( fix.getsizeval.call(this,'Height') || style['height'] ) >> 0;}
};


var Stylesheet = {};

/**
 * @private
 */
var animationSupport=null;

/**
 * 判断是否支持css3动画
 * @returns {boolean}
 */
function isAnimationSupport()
{
    if( animationSupport === null )
    {
        var prefix = fix.cssPrefixName;
        var div =createElement('div');
        var prop = prefix+'animation-play-state';
        div.style[prop] = 'paused';
        animationSupport = div.style[prop] === 'paused';
    }
    return animationSupport;
};

/**
 * @private
 */
var defaultOptions= {
    'duration':'1s',
    'repeats':'1',
    'reverse':'normal',
    'delay':'0s',
    'timing':'ease',
    'state':'running',
    'mode':'forwards'
};

/**
 * 生成css3样式动画
 * properties={
*    '0%':'left:10px;',
*    '100%':'left:100px;'
* }
 */
Stylesheet.createAnimationStyleSheet=function(stylename, properties, options )
{
    if( !isAnimationSupport() )return false;
    options =Object.merge(defaultOptions,options || {});
    var  css=[];
    for( var i in properties )
    {
        if( typeof  properties[i] === "string" )
        {
            css.push( i + ' {');
            css.push( properties[i] );
            css.push( '}' );
        }
    }

    var prefix = fix.cssPrefixName;
    css.unshift('@'+prefix+'keyframes ' + stylename + '{');
    css.push('}');
    css.push( '.'+stylename+'{' );

    var repeats = options.repeats < 0 ? 'infinite' : options.repeats;
    var timing=options.timing.replace(/([A-Z])/,function(all,a){
        return '-'+a.toLowerCase();
    });

    var param = {
        'name':stylename,
        'duration':options.duration,
        'iteration-count': repeats,  //infinite
        'delay':options.delay,
        'fill-mode':options.mode,  //both backwards none forwards
        'direction': options.reverse,  // alternate-reverse  reverse alternate normal
        'timing-function': timing,  //ease  ease-in  ease-out  cubic-bezier  linear
        'play-state':options.state //paused running
    };
    for( var p in  param )
    {
        css.push(prefix+'animation-'+p+':'+param[p]+';');
    }
    css.push('}');
    return css.join("\r\n");
};

/**
 * @private
 */
var headStyle =null;

/**
 * @param string style
 */
Stylesheet.addStyleSheet=function(styleName, styleSheetObject )
{
    if( headStyle=== null )
    {
        var head = document.getElementsByTagName('head')[0];
        headStyle = document.createElement('style');
        document.getElementsByTagName('head')[0].appendChild( headStyle );
    }

    if(System.isObject(styleSheetObject) )
    {
        styleSheetObject=System.serialize( styleSheetObject, 'style' );
    }

    if( typeof styleSheetObject === "string" )
    {
        if( System.env.platform( System.env.BROWSER_IE ) && System.env.version(9,'<') )
        {
            var styleName = styleName.split(',');
            styleSheetObject = styleSheetObject.replace(/^\{/,'').replace(/\}$/,'');
            for(var i=0; i<styleName.length; i++ )
            {
                headStyle.styleSheet.addRule(styleName[i], styleSheetObject, -1);
            }
        }else
        {
            if (styleSheetObject.charAt(0) !== '{')
            {
                styleSheetObject = '{' + styleSheetObject + '}';
            }
            headStyle.appendChild(document.createTextNode(styleName + styleSheetObject));
        }
        return true;
    }
    return false;
};
System.StyleSheel = Stylesheet;
System.Element = Element;