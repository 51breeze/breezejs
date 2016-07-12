/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function( window, undefined  )
{
    "use strict";

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
            if ( Breeze.isWindow(this) )
            {
                return Math.max(
                    this['inner'+prop] || 0,
                    this['offset'+prop] || 0,
                    this['client'+prop] || 0,
                    this.document.documentElement['client'+prop] || 0
                );

            } else if (Breeze.isDocument(this))
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
    function access(callback, name, newValue)
    {
        var write= typeof newValue !== 'undefined';
        if( !write && this.length < 1 )return null;
        var getter = this['__'+callback+'__'].get;
        var setter = this['__'+callback+'__'].set;
        if( fix.fnHooks[callback] )
        {
            getter = typeof fix.fnHooks[callback].get === "function" ? fix.fnHooks[callback].get : getter ;
            setter = typeof fix.fnHooks[callback].set === "function" ? fix.fnHooks[callback].set : setter ;
        }
        if( !write )
        {
            return getter.call(this.current(),name,this);
        }

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
                if( event instanceof PropertyEvent && this.hasEventListener( event.type ) )
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
    function getChildNodes(element,selector,flag)
    {
        var ret=[],isfn=Breeze.isFunction(selector);
        if( element.hasChildNodes() )
        {
            var len=element.childNodes.length,index= 0,node;
            while( index < len )
            {
                node=element.childNodes.item(index);
                if( ( isfn && selector.call(this,node,index) ) || ( !isfn && (selector==='*' || node.nodeType===1) )  )
                    ret.push( node )
                if( flag===true && ret.length >0 )break;
                ++index;
            }
        }
        return ret;
    };

    /**
     * @private
     */
    function dispatchElementEvent(parent, child , type )
    {
        if( this instanceof EventDispatcher && this.hasEventListener( type )  )
        {
            var event=new ElementEvent( type )
            event.parent=parent;
            event.child=child
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
        var s = typeof strainer === "string" ? function(){return Breeze.querySelector(strainer, null , null, [this]).length > 0 } :
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
        })
        return ret;
    }

    

    /**
     * Breeze class
     * @param selector
     * @param context
     * @returns {Breeze}
     * @constructor
     */
    function Breeze(selector, context)
    {
        if(typeof selector === "function" )
        {
            return Breeze.ready(selector);
        }

        if( !(this instanceof Breeze) )
        {
            return new Breeze( selector, context );
        }

        this.context=context;
        var result=[];
        if( selector instanceof Array )
        {
            result = DataArray( selector).filter(function(elem){
                return Breeze.isNodeElement( elem ) || Breeze.isWindow(elem);
            }).toArray();

        }else if( selector instanceof Breeze )
        {
            result = selector.toArray();
        }else
        {
            result = Breeze.querySelector(selector, context);
        }

        DataArray.prototype.concat.apply(this,  result);
        EventDispatcher.call(this);
        this.forEachCurrentItem=null;
        this.forEachCurrentIndex=NaN;
    };

    Breeze.prototype= new EventDispatcher();
    Breeze.prototype.constructor = Breeze;
    Breeze.prototype.context = undefined;
    Breeze.prototype.forEachCurrentItem=undefined;
    Breeze.prototype.forEachCurrentIndex=NaN;
    Breeze.prototype.length=0;
    Breeze.prototype.slice= DataArray.prototype.slice;
    Breeze.prototype.concat=DataArray.prototype.concat;
    Breeze.prototype.indexOf= DataArray.prototype.indexOf;
    Breeze.prototype.splice= DataArray.prototype.splice;
    Breeze.prototype.toArray= DataArray.prototype.slice;

    /**
     * 遍历元素
     * @param function callback
     * @param object refObject
     * @returns {*}
     */
    Breeze.prototype.forEach=function(callback , refObject )
    {
        var result;
        refObject=refObject || this;

        if( this.forEachCurrentItem  )
        {
            result=callback.call( refObject ,this.forEachCurrentItem,this.forEachCurrentIndex);

        }else
        {
            var items=this.slice(0),
                index = 0,
                len=items.length;
            for( ; index < len ; index++ )
            {
                this.forEachCurrentItem=items[ index ];
                this.forEachCurrentIndex=index;
                result=callback.call( refObject ,this.forEachCurrentItem,index);
                if( result !== undefined )
                    break;
            }
            this.forEachCurrentItem = null;
            this.forEachCurrentIndex= NaN;
        }
        return typeof result === 'undefined' ? this : result;
    }

    /**
     * 设置获取当前游标位置的元素
     * @param selector|HTMLElement element
     * @returns {*}
     */
    Breeze.prototype.current=function( element )
    {
        if( typeof element !== "undefined" )
        {
            if( typeof element=== "string" )
            {
                element=Breeze.querySelector(element, this.context || document );
                this.forEachCurrentItem = element && element.length > 0 ? element[0] : null;
                this.forEachCurrentIndex = NaN;

            }else if(  Breeze.isNodeElement( element ) || Breeze.isWindow(element) )
            {
                 this.forEachCurrentItem = element ;
                 this.forEachCurrentIndex = NaN;

            }else
            {
                this.forEachCurrentItem =  null;
                this.forEachCurrentIndex = NaN;
            }
            return this;
        }
        return this.forEachCurrentItem || this[0];
    }

    /**
     * @private
     */
    Breeze.prototype.__property__= {
        get:function(name){
            return ( fix.attrtrue[name] || typeof this.getAttribute !== "function"  ? this[name] : this.getAttribute(name) ) || null; }
        ,set:function(name,newValue){
             newValue === null ?
             ( fix.attrtrue[name] || typeof this.removeAttribute !== "function"  ? delete this[name] : this.removeAttribute(name) ) :
             ( fix.attrtrue[name] || typeof this.setAttribute !== "function"  ? this[name] = newValue : this.setAttribute(name, newValue) );
             return PropertyEvent.CHANGE;
        }
    }

    /**
     * 为每一个元素设置属性值
     * @param name
     * @param value
     * @returns {Breeze}
     */
    Breeze.prototype.property=function(name, value )
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
            throw new Error('the style property names only use style method to operate in property');
        }
        return access.call(this,'property',name,value);
    }

    /**
     * 判断当前匹配元素是否有指定的属性名
     * @param prop
     * @returns {boolean}
     */
    Breeze.prototype.hasProperty=function( prop )
    {
        var elem = this.current();
        return typeof elem.hasAttributes === 'function' ? elem.hasAttributes( prop ) : !!elem[prop];
    }


    /**
     * 获取设置数据对象,支持带'.'操作
     * @param name
     * @param value
     * @returns {*}
     */
    Breeze.prototype.data=function(name, value )
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
                    return target[ name ] || null ;
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
    }


    /**
     * @private
     */
    Breeze.prototype.__style__= {

        get:function(name){
            var getter = fix.cssHooks[name] && typeof fix.cssHooks[name].get === "function" ? fix.cssHooks[name].get : null;
            var currentStyle = Breeze.hasStyle(this) ? (document.defaultView && document.defaultView.getComputedStyle ?
                document.defaultView.getComputedStyle(this, null) : this.currentStyle || this.style) : {};
            return getter ? getter.call(this, currentStyle, name) : currentStyle[name];
        }
        ,set:function(name,value, obj ){

            var type =/^\d+$/.test( Breeze.trim(value) ) ? 'number' : typeof value;
            if( !this || !this.style || ( type === "number" && isNaN( value ) ) )return;
            var increment = type === "string" ? /^([\-+])=([\-+.\de]+)/.exec( value ) : null;

            //增量值
            if (increment) {
                var inc = obj.style(name);
                inc = parseFloat(inc) || 0;
                value = ( +( increment[1] + 1 ) * +increment[2] ) + inc;
                type = "number";
            }

            //添加单位
            if (type === "number" && !fix.cssNumber[name])
                value += "px";

            //解析 cssText 样式名
            if (name === 'cssText')
            {
                var elem = this;
                value = value.replace(/([\w\-]+)\s*\:([^\;]*)/g, function (all, name, value) {
                    if (fix.cssHooks[name] && typeof fix.cssHooks[name].set === "function") {
                        var obj = {}
                        fix.cssHooks[name].set.call(elem, obj, value);
                        return Breeze.serialize(obj, 'style');
                    }
                    return Breeze.styleName(name) + ':' + value;
                });
            }

            try {

                var orgname = Breeze.styleName(name);
                if ( !fix.cssHooks[name] || typeof fix.cssHooks[name].set !== "function"
                    || !fix.cssHooks[name].set.call(this, this.style, value, orgname) )
                {
                    this.style[ orgname ] = value;
                }

            } catch (e) {
            }
            return StyleEvent.CHANGE;
        }
    }

    /**
     * 设置所有匹配元素的样式
     * @param name
     * @param value
     * @returns {Breeze}
     */
    Breeze.prototype.style=function(name, value )
    {
        if( typeof name === 'string' && /^(\s*[\w\-]+\s*\:[\w\-\s]+;)+$/.test(name)  )
        {
            value=name;
            name='cssText';
        }
        else if( Breeze.isObject(name) )
        {
            value=Breeze.serialize( name,'style');
            name='cssText';
        }
        return access.call(this,'style',name,value);
    }

    /**
     * 显示元素
     * @returns {Breeze}
     */
    Breeze.prototype.show=function()
    {
        return this.forEach(function(){
            var type = this.data('display') || 'block';
            this.style('display', type );
        })
    }

    /**
     * 隐藏当前元素
     * @returns {Breeze}
     */
    Breeze.prototype.hide=function()
    {
        return this.forEach(function(){
            var d = this.style('display');
            this.data('display', Breeze.isEmpty( d ) ? 'block' : d );
            this.style('display', 'none' )
        })
    }


    /**
     * @private
     */
    Breeze.prototype.__text__= {
        get:function(){  return typeof this.textContent === "string" ? this.textContent : this.innerText; }
        ,set:function(newValue){
            typeof this.textContent === "string" ? this.textContent=newValue : this.innerText=newValue;
            return PropertyEvent.CHANGE;
        }
    }


    /**
     * 获取设置当前元素的文本内容。
     * @returns {string|Breeze}
     */
    Breeze.prototype.text=function( value )
    {
        return access.call(this,'text','text',value);
    }

    /**
     * @private
     */
    Breeze.prototype.__value__= {
        get:function(){ return this.hasAttribute('value') ? this.value : null }
        ,set:function(name,newValue){
            this.hasAttribute('value') ? this.value=newValue : null ;
            return PropertyEvent.CHANGE;
        }
    }


    /**
     * 获取设置表单元素的值。此方法只会对表单元素有用。
     * @returns {string|Breeze}
     */
    Breeze.prototype.value=function( value )
    {
        return access.call(this,'value','value',value);
    }


    /**
     * 判断是否有指定的类名
     * @param className
     * @returns {boolean}
     */
    Breeze.prototype.hasClass=function( className )
    {
        var elem = this.current();
        var value=elem['className'] || '';
        return value === '' || !value ? false : typeof className==='string' ? new RegExp('(\\s|^)' + className + '(\\s|$)').test( value ) : true ;
    }


    /**
     * 添加指定的类名
     * @param className
     * @returns {Breeze}
     */
    Breeze.prototype.addClass=function( className )
    {
        if( typeof className !== "string" )
            throw new Error('invaild class name');
        className = Breeze.trim( className );
        this.forEach(function(elem){

            if( !this.hasClass( className ) )
            {
                var oldClass=Breeze.trim( elem['className'] );
                var old = oldClass;
                oldClass= [ Breeze.trim( oldClass ) ];
                oldClass.push( className );
                var newValue = Breeze.trim( oldClass.join(' ') );
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
    }

    /**
     * 移除指定的类名或者清除所有的类名。
     * @param className
     * @returns {Breeze}
     */
    Breeze.prototype.removeClass=function( className )
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
            newValue === '' ? elem.removeAttribute('class') : elem['className'] = Breeze.trim(newValue);
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
    }

    /**
     * 获取设置元素宽度
     * @param value
     * @returns {int|Breeze}
     */
    Breeze.prototype.width=function( value )
    {
        return access.call(this,'style','width',value);
    }

    /**
     * 获取设置元素高度
     * @param value
     * @returns {int|Breeze}
     */
    Breeze.prototype.height=function( value )
    {
        return access.call(this,'style','height',value);
    }

    /**
     * @private
     */
    Breeze.prototype.__scroll__={
        get:function(prop){
            var e = this.defaultView || this.parentWindow || this;
            var p= 'scroll'+prop;
            return Breeze.isWindow( e ) ? e[ prop.toLowerCase()==='top'?'pageYOffset':'pageXOffset'] || e.document.documentElement[p] || e.document.body[p] : e[p] ;
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
    }

    /**
     * 获取设置滚动条顶部的位置
     * @param value
     */
    Breeze.prototype.scrollTop=function(value)
    {
        return access.call(this,'scroll','Top',value);
    }

    /**
     * 获取设置滚动条左部的位置
     * @param value
     */
    Breeze.prototype.scrollLeft=function(value)
    {
        return access.call(this,'scroll','Left',value);
    }

    /**
     * 获取滚动条的宽度
     * @param value
     */
    Breeze.prototype.scrollWidth=function()
    {
        return access.call(this,'scroll','Width');
    }

    /**
     * 获取滚动条的高度
     * @param value
     */
    Breeze.prototype.scrollHeight=function()
    {
        return access.call(this,'scroll','Height');
    }

    /**
     * 获取元素相对文档页面边界的矩形坐标。
     * 如果元素的 position = fixed 或者 force=== true 则相对浏览器窗口的位置
     * @param NodeElement elem
     * @param boolean force
     * @returns {left,top,right,bottom,width,height}
     */
    Breeze.prototype.getBoundingRect=function( force )
    {
        var value={ 'top': 0, 'left': 0 ,'right' : 0,'bottom':0,'width':0,'height':0};
        var elem= this.current();
        if( Breeze.isWindow(elem) )
        {
            value.left = elem.screenLeft || elem.screenX;
            value.top = elem.screenTop || elem.screenY;
            value.width = this.width();
            value.height = this.height();
            value.right = value.width + value.left;
            value.bottom = value.height + value.top;
            return value;
        }

        if( !Breeze.isNodeElement(elem) )
            throw new Error('invalid elem. elem not is NodeElement');

         var doc =  elem.ownerDocument || elem, docElem=doc.documentElement;
         this.current( Breeze.getWindow(doc) )
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
    }

    /**
     * @private
     */
    Breeze.prototype.__position__={
        get:function(prop,obj){
            return obj.getBoundingRect()[ prop ];
        },
        set:function(prop,newValue,obj){
            if( obj.style('position')==='static' )obj.style('position','relative');
            return obj.style(prop,parseInt(newValue) || 0 );
        }
    }


    /**
     * 获取或者设置相对于父元素的左边位置
     * @param number val
     * @returns {number|Breeze}
     */
    Breeze.prototype.left=function( val )
    {
        return access.call(this,'position','left',val)
    }

    /**
     * 获取或者设置相对于父元素的顶边位置
     * @param number val
     * @returns {number|Breeze}
     */
    Breeze.prototype.top=function(val )
    {
        return access.call(this,'position','top',val)
    }

    /**
     * 获取或者设置相对于父元素的右边位置
     * @param number val
     * @returns {number|Breeze}
     */
    Breeze.prototype.right=function(val )
    {
        return access.call(this,'position','right',val)
    }

    /**
     * 获取或者设置相对于父元素的底端位置
     * @param number val
     * @returns {number|Breeze}
     */
    Breeze.prototype.bottom=function( val )
    {
        return access.call(this,'position','bottom',val)
    }

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
    Breeze.prototype.localToGlobal=function(left, top)
    {
       return point.call(this,left, top, true);
    }

    /**
     *  将视图的全局点转成相对本地坐标点
     *  @param left
     *  @param top
     *  @returns {object}  left top
     */
    Breeze.prototype.globalToLocal=function(left, top )
    {
        return point.call(this,left, top);
    }



    //============================================元素选择===================================

    /**
     * 回撒到指定步骤的选择器所匹配的元素,不包含初始化的步骤。
     * @param step
     * @returns {Breeze}
     */
    Breeze.prototype.revert=function( step )
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
    }

    /**
     * 查找当前匹配的第一个元素下的指定选择器的元素
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.find=function( selector )
    {
        var ret=[];
        this.forEach(function(elem){
            ret = ret.concat.apply(ret,Breeze.querySelector(selector, elem ) );
        })
        return doMake.call( this, ret );
    }

    /**
     * 查找所有匹配元素的父级元素或者指定selector的父级元素（不包括祖辈元素）
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.parent=function( selector )
    {
        return doMake.call( this, DataArray( doRecursion.call(this,'parentNode',selector ) ).unique().toArray() );
    }

    /**
     * 查找所有匹配元素的祖辈元素或者指定 selector 的祖辈元素。
     * 如果指定了 selector 则返回最近的祖辈元素
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.parents=function( selector )
    {
        return doMake.call( this, DataArray( doRecursion.call(this,'parentNode',selector, true ) ).unique().toArray() );
    }

    /**
     * 获取所有匹配元素向上的所有同辈元素,或者指定selector的同辈元素
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.prevAll=function( selector )
    {
        return doMake.call( this, doRecursion.call(this,'previousSibling', selector, true ) );
    }

    /**
     * 获取所有匹配元素紧邻的上一个同辈元素,或者指定selector的同辈元素
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.prev=function( selector )
    {
        return doMake.call( this, doRecursion.call(this,'previousSibling', selector ) );
    }

    /**
     * 获取所有匹配元素向下的所有同辈元素或者指定selector的同辈元素
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.nextAll=function( selector )
    {
        return doMake.call( this, doRecursion.call(this,'nextSibling', selector , true ) );
    }

    /**
     * 获取每一个匹配元素紧邻的下一个同辈元素或者指定selector的同辈元素
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.next=function( selector )
    {
        return doMake.call( this, doRecursion.call(this,'nextSibling', selector ) );
    }

    /**
     * 获取每一个匹配元素的所有同辈元素
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.siblings=function( selector )
    {
        var results=[].concat( doRecursion.call(this,'previousSibling',selector,true) , doRecursion.call(this,'nextSibling',selector, true) );
        return doMake.call( this, results );
    }

    /**
     * 查找所有匹配元素的所有子级元素，不包括孙元素
     * @param selector 如果是 * 返回包括文本节点的所有元素。不指定返回所有HTMLElement元素。
     * @returns {Breeze}
     */
    Breeze.prototype.children=function( selector )
    {
        if( typeof selector === 'undefined' )
        {
            selector= function(item){ return item.nodeType===1 };
        }
        var is=typeof selector === "function";
        var results=[];
        this.forEach(function(element)
        {
            if( !Breeze.isFrame( element ) && element.hasChildNodes() )
            {
                var child = this.slice.call( element.childNodes );
                results =  is ? this.concat.call( results, DataArray( child ).filter( selector ) ) :
                                this.concat.call( results, Breeze.querySelector(selector,element,null,child) );
            }
        });
        return doMake.call( this, DataArray(results).unique().toArray() );
    }



    //========================操作元素===========================

    /**
     * 用指定的元素来包裹当前所有匹配到的元素
     * @param element
     * @returns {Breeze}
     */
    Breeze.prototype.wrap=function( element )
    {
        var is=Breeze.isFunction( element );
        return this.forEach(function(elem)
        {
            var wrap=Breeze.createElement( is ? element.call(this,elem) : element );
            this.current( elem.parentNode ).addChildAt( wrap , elem );
            this.current( wrap ).addChildAt( elem ,-1);
        });
    }

    /**
     * 取消当前所有匹配元素的父级元素。不指定选择器则默认为父级元素，否则为指定选择器的祖辈元素。
     * 父级或者祖辈元素只能是body的子元素。
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.unwrap=function( selector )
    {
        var is= typeof selector === "undefined";
        return this.forEach(function(elem)
        {
            var parent= is ?  elem.parentNode : doRecursion.call(this,'parentNode',selector )[0];
            if( parent && parent.ownerDocument && Breeze.contains( parent.ownerDocument.body, parent ) )
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
    }


    /**
     * 获取或者设置 html
     * @param html
     * @returns {string | Breeze}
     */
    Breeze.prototype.html=function( html )
    {
        var outer = html === true;
        var write= !outer && typeof html !== "undefined";
        if( !write && this.length < 1 ) return '';
        return this.forEach(function(elem)
        {
            if( !write )
            {
                html=elem.innerHTML;
                if( outer )
                {
                    if( typeof elem.outerHTML==='string' )
                    {
                        html=elem.outerHTML;
                    }else
                    {
                        var cloneElem=Breeze.clone( elem, true)
                        if( cloneElem )
                        {
                            html=document.createElement( 'div' ).appendChild( cloneElem ).innerHTML;
                        }
                    }
                }
                return html;
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

            if( typeof html === "string" )
            {
                html = Breeze.trim( html );
                try{
                    elem.innerHTML = html;
                    dispatchElementEvent.call(this,elem,html,ElementEvent.ADD)
                }catch(e)
                {
                    var nodename = Breeze.nodeName( elem );
                    if( !new RegExp("^<"+nodename).exec(html) )
                    {
                        html= Breeze.sprintf('<%s>%s</%s>',nodename,html,nodename);
                    }
                    var child= Breeze.createElement( html );
                    var deep =  nodename === 'tr' ? 2 : 1,d=0;
                    while( d < deep && child.firstChild )
                    {
                        d++;
                        child=child.firstChild;
                    }
                    Breeze.mergeAttributes(child, elem);
                    elem.parentNode.replaceChild(child,  elem );
                    dispatchElementEvent.call(this,elem.parentNode,child,ElementEvent.ADD);
                }

            }else
            {
                this.addChild(html);
                return true;
            }
        });
    }


    /**
     * 添加子级元素（所有已匹配的元素）
     * @param childElemnet
     * @returns {Breeze}
     */
    Breeze.prototype.addChild=function( childElemnet )
    {
        return this.addChildAt( childElemnet,-1);
    }

    /**
     * 在指定位置加子级元素（所有已匹配的元素）。
     * 如果 childElemnet 是一个已存在的元素，那么会先删除后再添加到当前匹配的元素中后返回，后续匹配的元素不会再添加此元素。
     * @param childElemnet 要添加的子级元素
     * @param index | refChild | fn(node,index,parent)  要添加到的索引位置
     * @returns {Breeze}
     */
    Breeze.prototype.addChildAt=function( childElemnet, index)
    {
        if( childElemnet instanceof Breeze )
        {
            childElemnet=childElemnet.toArray();
            for( var c=0; c<childElemnet.length; c++)
            {
                this.addChildAt( childElemnet[c], index );
            }
            return this;
        }

        if( index===undefined )
            throw new Error('Invalid param the index');

        var isElement= childElemnet && childElemnet.nodeType && typeof childElemnet.nodeName === 'string';

        //如果没有父级元素则设置上下文为父级元素
        if( this.length === 0 && !this.current() )
        {
            var context = this.context;
            this.current( context === document ? document.body : context );
        }

        return this.forEach(function(parent)
        {
            if( !Breeze.isHTMLElement( parent ) )
            {
                throw new Error('invalid parent HTMLElement.');
            }

            try{
                var child=isElement ? childElemnet : Breeze.createElement( childElemnet );
            }catch(e){
                throw new Error('The childElemnet not is HTMLElement');
            }

            if( child.parentNode !== parent  )
            {
                if( child.parentNode )
                {
                    this.removeChildAt( child );
                }
                this.current(parent);
                var refChild=index && index.parentNode && index.parentNode===parent ? index : null;
                !refChild && ( refChild=this.getChildAt( typeof index==='number' ? index : index ) );
                refChild && (refChild=index.nextSibling);
                parent.insertBefore( child , refChild || null );
                dispatchElementEvent.call(this,parent,child,ElementEvent.ADD )
            }
            if( isElement ) return this;
        })
    }

    /**
     * 返回指定索引位置的子级元素( 匹配选择器的第一个元素 )
     * 此方法只会计算节点类型为1的元素。
     * @param index | refChild | fn(node,index,parent)
     * @returns {Node|null}
     */
    Breeze.prototype.getChildAt=function( index )
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
    }

    /**
     * 返回子级元素的索引位置( 匹配选择器的第一个元素 )
     * @param childElemnet | selector
     * @returns {Number}
     */
    Breeze.prototype.getChildIndex=function(childElemnet )
    {
        if( typeof childElemnet==='string' )
        {
            childElemnet= Breeze.querySelector( childElemnet, null, null, this.toArray() )[0];
            if( !childElemnet )return -1;
            this.current( childElemnet.parentNode );
        }
        var parent = this.current();
        if( childElemnet.parentNode===parent )
        {
            return this.indexOf.call( getChildNodes(parent), childElemnet );
        }
        return -1;
    }


    /**
     * 移除指定的子级元素
     * @param childElemnet|selector
     * @returns {Breeze}
     */
    Breeze.prototype.removeChild=function( childElemnet )
    {
        if( typeof childElemnet==='string' )
        {
            this.forEach(function(elem)
            {
                var children=Breeze.querySelector(childElemnet,elem), b=0,len=children.length;
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
    }

    /**
     * 移除子级元素
     * @param childElemnet|index|fn  允许是一个节点元素或者是相对于节点列表中的索引位置（不包括文本节点）。
     *        也可以是一个回调函数过滤要删除的子节点元素。
     * @returns {Breeze}
     */
    Breeze.prototype.removeChildAt=function( index )
    {
        var is=false;
        if(  index && index.parentNode ){
            this.current( index.parentNode )
            is=true;

        }else if( !Breeze.isNumber( index ) )
            throw new Error('Invalid param the index. in removeChildAt');

        return this.forEach(function(parent)
        {
            var child= is ? index : this.getChildAt( index );
            if(  removeChild.call(this,parent,child) && is )
               return this;
        });
    }





     //========================================= 静态方法 ============================================

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
    }

    /**
     * @private
     */
    var __root__=null;

    /**
     * 全局事件
     * @returns {EventDispatcher}
     */
    Breeze.root=function()
    {
        if( __root__ === null ) {
            __root__ = Breeze(window);
        }
        return __root__;
    }

    /**
     * 文档加载就绪事件
     * @param callback
     * @returns {EventDispatcher}
     */
    Breeze.ready=function( callback )
    {
        if( typeof callback === "function" )
        {
            return Breeze.root().addEventListener( BreezeEvent.READY ,callback);
        }
    }

    /**
     * 选择元素
     * @param mixed selector CSS3选择器
     * @param mixed context  上下文
     * @returns []
     */
    Breeze.querySelector=function(selector, context, results, seed )
    {
        if( typeof Sizzle === "function" )
        {
            return Sizzle( selector, context, results, seed);
        }

        if( !(results instanceof Array) )
        {
            //如果选择器不是一个字符串
            if (typeof selector !== "string")
            {
                results = Breeze.isNodeElement(selector) || Breeze.isWindow(selector) ? [selector] : [];

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

        if( seed instanceof Array )
        {
            var i=0;
            var ret=[];
            while( i<seed.length )
            {
                if( Breeze.prototype.indexOf.call(results,seed[i]) >=0 )
                {
                    ret.push( seed[i] )
                }
                i++;
            }
            return ret;
        }
        return results;
    }

    /**
     * 指定的选择器是否为当前作用域的子级
     * @param parent
     * @param child
     * @returns {boolean}
     */
    Breeze.contains=function(parent, child )
    {
        if( Breeze.isNodeElement(child) )
        {
            if('contains' in parent) {
                return parent.contains( child ) && parent !== child;
            }
            else {
                return !!(parent.compareDocumentPosition(child) & 16) && parent !== child ;
            }
        }
        return Breeze.querySelector( child, parent ).length > 0;
    }


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
                if( html.charAt(0) !== "<" && html.charAt( html.length - 1 ) !== ">" && html.length >=1 )
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
            }

        }else if (Breeze.isNodeElement(html) )
            return  html.parentNode ?Breeze.clone(html,true) : html;

        throw new Error('Uitls.createElement param invalid')
    }

    /**
     * 取得当前的时间戳
     * @returns {number}
     */
    Breeze.time=function()
    {
        return ( new Date() ).getTime();
    }

    /**
     * 将字符串的首字母转换为大写
     * @param str
     * @returns {string}
     */
    Breeze.ucfirst=function( str )
    {
        return typeof str === "string" ? str.charAt(0).toUpperCase()+str.substr(1) : str;
    }

    /**
     * 将字符串的首字母转换为小写
     * @param str
     * @returns {string}
     */
    Breeze.lcfirst=function( str )
    {
        return typeof str === "string" ? str.charAt(0).toLowerCase()+str.substr(1) : str;
    }


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
    }

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
            str=str.replace(/^&|&$/,'')
            group=true;

        }else if( /[\w\-\_]+\s*\:.*?(?=\;|$)/.test( str ) )
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
    }

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
    }

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
    }

    /**
     * 判断元素是否有Style
     * @returns {boolean}
     */
    Breeze.hasStyle=function( elem )
    {
        return !( !elem || !elem.nodeType || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style );
    }

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
    }

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
    }

    /**
     * 以小写的形式返回元素的节点名
     * @returns {string}
     */
    Breeze.nodeName=function( elem )
    {
        return elem && typeof elem.nodeName=== "string" && elem.nodeName!='' ? elem.nodeName.toLowerCase() : '';
    }

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
    }

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
    }

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
    }

    /**
     * 判断是否为一个事件元素
     * @param element
     * @returns {boolean}
     */
    Breeze.isEventElement=function(elem)
    {
        return (elem && ( typeof elem.addEventListener === "function" || typeof elem.attachEvent=== "function" ) );
    }

    /**
     * 判断是否为窗口对象
     * @param obj
     * @returns {boolean}
     */
    Breeze.isWindow=function( elem )
    {
        return ( elem && elem === elem.window );
    }

    /**
     * 决断是否为文档对象
     * @returns {*|boolean}
     */
    Breeze.isDocument=function( elem )
    {
        return elem && elem.nodeType===9;
    }

    /**
     * 判断是否为一个框架元素
     * @returns {boolean}
     */
    Breeze.isFrame=function( elem )
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
    }

    /**
     * 判断是否为数组
     * @param val
     * @returns {boolean}
     */
    Breeze.isArray=function(val )
    {
        return val instanceof Array;
    }

    /**
     * 判断是否为函数
     * @param val
     * @returns {boolean}
     */
    Breeze.isFunction=function(val ){
        return typeof val === 'function';
    }

    /**
     * 判断是否为布尔类型
     * @param val
     * @returns {boolean}
     */
    Breeze.isBoolean=function(val ){
        return typeof val === 'boolean';
    }

    /**
     * 判断是否为字符串
     * @param val
     * @returns {boolean}
     */
    Breeze.isString=function(val )
    {
        return typeof val === 'string';
    }

    /**
     * 判断是否为一个标量
     * 只有对象类型或者Null不是标量
     * @param {boolean}
     */
    Breeze.isScalar=function(val )
    {
        var t=typeof val;
        return t==='string' || t==='number' || t==='float' || t==='boolean';
    }

    /**
     * 判断是否为数字类型
     * @param val
     * @returns {boolean}
     */
    Breeze.isNumber=function(val )
    {
        return typeof val === 'number';
    }

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
    }

    /**
     * 判断是否为一个可遍历的对象
     * @param val
     * @param flag
     * @returns {boolean}
     */
    Breeze.isObject=function(val , flag )
    {
        return val && typeof val === "object" ? !!( val.constructor === Object || ( flag &&Breeze.isArray(val) ) ) : false;
    }


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
    }


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
    }

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
    }

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
    }

    /**
     * 格式化输出
     * @format
     * @param [...]
     * @returns {string}
     */
    Breeze.sprintf=function()
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
    }


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

        var type = file.match(/\.(css|js)(\?.*?)?$/i)
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
     * 根据指定的参数值转成对应的布尔值
     * @param val
     * @returns {boolean}
     */
    Breeze.boolean=function(val )
    {
        return typeof val==='string' && /^\s*(0+|false|null)\s*$/.test(val) ? false : !!val;
    }

    /**
     * 将指定的标量转成数组
     * @param val
     * @returns {boolean}
     */
    Breeze.toArray=function(val , separator )
    {
        return val instanceof Array ? val : String(val).split(separator || ',');
    }


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
    }

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
    }


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
    Breeze.isSelector=function(selector )
    {
        return typeof selector === "string" ? selectorExpr.test( selector ) : false;
    }

    /**
     * 统一规范的样式名
     * @param name
     * @returns {string}
     */
    Breeze.styleName=function( name )
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
    }


    /**
     * @private
     */
    var animationSupport=null;

    /**
     * 判断是否支持css3动画
     * @returns {boolean}
     */
    Breeze.isAnimationSupport=function()
    {
        if( animationSupport === null )
        {
            var prefix = fix.cssPrefixName;
            var div =Breeze.createElement('div');
            var prop = prefix+'animation-play-state';
            div.style[prop] = 'paused';
            animationSupport = div.style[prop] === 'paused';
        }
        return animationSupport;
    }


    /**
     * @private
     */
    var createdAnimationStyle={};

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
    Breeze.CSS3Animation=function(properties, options )
    {
        if( !Breeze.isAnimationSupport() )
            return false;

        options =Breeze.extend(defaultOptions,options || {})
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
        var stylename = 'A'+Breeze.crc32( css.join('') ) ;
        if( createdAnimationStyle[ stylename ] !==true )
        {
            createdAnimationStyle[ stylename ]=true;
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
            }
            for( var p in  param )
            {
                css.push(prefix+'animation-'+p+':'+param[p]+';');
            }
            css.push('}');
            css = css.join("\r\n");
            var head = document.getElementsByTagName('head')[0];
            var style = document.createElement('style');
            style.setAttribute('id',stylename);
            style.innerHTML= css;
            head.appendChild( style );
        }
        return stylename;
    }

    /**
     * @private
     */
    var headStyle =null;

    /**
     * @param string style
     */
    Breeze.appendStyle=function(styleName, styleObject )
    {
        if( headStyle=== null )
        {
            var head = document.getElementsByTagName('head')[0];
            headStyle = document.createElement('style');
            document.getElementsByTagName('head')[0].appendChild( headStyle );
        }

        if(Breeze.isObject(styleObject) )
        {
            styleObject=Breeze.serialize( styleObject, 'style' );
        }

        if( typeof styleObject === "string" )
        {
            if(Breeze.isBrowser(Breeze.BROWSER_IE,9,'<') )
            {
                var styleName = styleName.split(',');
                styleObject = styleObject.replace(/^\{/,'').replace(/\}$/,'');
                for(var i=0; i<styleName.length; i++ )
                {
                    headStyle.styleSheet.addRule(styleName[i], styleObject, -1);
                }

            }else
            {
                if (styleObject.charAt(0) !== '{')
                {
                    styleObject = '{' + styleObject + '}';
                }
                headStyle.appendChild(document.createTextNode(styleName + styleObject));
            }
            return true;
        }
        return false;
    }


    // fix style name add prefix
    if( Breeze.isBrowser(Breeze.BROWSER_FIREFOX,4,'<=') )
    {
        fix.cssPrefixName='-moz-';

    }else if( Breeze.isBrowser(Breeze.BROWSER_SAFARI) || Breeze.isBrowser(Breeze.BROWSER_CHROME) )
    {
        fix.cssPrefixName='-webkit-';

    }else if(Breeze.isBrowser(Breeze.BROWSER_OPERA))
    {
        fix.cssPrefixName='-o-';

    }else if(Breeze.isBrowser(Breeze.BROWSER_IE,9,'>='))
    {
        fix.cssPrefixName='-ms-';
    }

    //set hooks for userSelect style
    fix.cssHooks.userSelect={

        get: function( style )
        {
            return style[ Breeze.styleName('userSelect') ] || '';
        },
        set: function( style, value )
        {
            style[ Breeze.styleName('userSelect') ] = value;
            style['-moz-user-fetch'] = value;
            style['-webkit-touch-callout'] = value;
            style['-khtml-user-fetch'] = value;
            return true;
        }
    }

    //set hooks for radialGradient and linearGradient style
    fix.cssHooks.radialGradient=fix.cssHooks.linearGradient={

        get: function( style, name )
        {
            return  Breeze.storage(this,name) || '';
        },
        set: function( style, value, name )
        {
            value = Breeze.trim(value);
            Breeze.storage(this,name,value);
            if( Breeze.isBrowser(Breeze.BROWSER_SAFARI,5.1,'<') || Breeze.isBrowser(Breeze.BROWSER_CHROME,10,'<') )
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
                        deg = deg[1]
                        value.splice(0,1);
                    }
                    deg=parseFloat(deg) || 0;
                }
                var color = [];
                for(var i=0; i<value.length; i++)
                {
                    var item = Breeze.trim(value[i]).split(/\s+/,2);
                    if( i===0 )color.push("from("+item[0]+")");
                    if( !(i===0 || i===value.length-1 ) || typeof item[1] !== "undefined"  )
                    {
                        var num = (parseFloat(item[1]) || 0) / 100;
                        color.push( "color-stop("+num+","+item[0]+")" );
                    }
                    if( i===value.length-1 )
                        color.push("to("+item[0]+")");
                }

                var width= Breeze.getSize(this,'width');
                var height=  Breeze.getSize(this,'height');
                if(name==='radialGradient')
                {
                    position = position.split(/\,/,2)
                    var point = Breeze.trim(position[0]).split(/\s+/,2);
                    if(point.length===1)point.push('50%');
                    var point = point.join(' ');
                    position=point+',0, '+point+', '+width/2;
                    value=Breeze.sprintf("%s,%s,%s",'radial',position,color.join(',') );

                }else{

                    var x1=Math.cos(  deg*(Math.PI/180) );
                    var y1=Math.sin(  deg*(Math.PI/180) );
                    value=Breeze.sprintf("%s,0% 0%,%s %s,%s",'linear',Math.round(x1*width),Math.round(y1*height),color.join(',') );
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
            if(  Breeze.isBrowser(Breeze.BROWSER_IE,10,'<') )
            {
                value=value.split(',')
                var deg = value.splice(0,1).toString();
                deg = parseFloat( deg ) || 0;
                var color=[];
                for(var i=0; i<value.length; i++)
                {
                    var item = Breeze.trim(value[i]).split(/\s+/,2);
                    color.push( i%1===1 ? "startColorstr='"+item[0]+"'" :  "endColorstr='"+item[0]+"'" );
                }
                var type = deg % 90===0 ? '1' : '0';
                var linear = name==='linearGradient' ? '1' : '2';
                value = 'alpha(opacity=100 style='+linear+' startx=0,starty=5,finishx=90,finishy=60);';
                value= style.filter || '';
                value += Breeze.sprintf(";progid:DXImageTransform.Microsoft.gradient(%s, GradientType=%s);",color.join(','), type );
                value += "progid:DXImageTransform.Microsoft.gradient(enabled = false);";
                prop='filter';

            }else
            {
                value= Breeze.sprintf('%s(%s)', Breeze.styleName( name ) , value ) ;
            }
            style[ prop ] = value ;
            return true;
        }
    }

    //add get width hooks
    fix.cssHooks.width= {
        get:function(style){ return parseInt( fix.getsizeval.call(this,'Width') || style['width'] ) || 0 }
    }

    //add get height hooks
    fix.cssHooks.height={
        get:function (style){return parseInt( fix.getsizeval.call(this,'Height') || style['height'] ) || 0;}
    }


    //在指定的目标元素外按下鼠标
    EventDispatcher.SpecialEvent(MouseEvent.MOUSE_OUTSIDE, function(listener, dispatch, add, remove)
    {
        Breeze.root().addEventListener(MouseEvent.MOUSE_DOWN,function(event)
        {
            var elem= Breeze( listener.currentTarget );
            if( elem.style('display') === 'none' ||  elem.style('visibility') ==='hidden' )return;
            var pos = elem.getBoundingRect();
            var width =  elem.width();
            var height = elem.height();
            if( event.pageX < pos.left || event.pageY < pos.top || event.pageX > pos.left + width ||  event.pageY > pos.top+height )
            {
                event = BreezeEvent.create( event );
                event.type = MouseEvent.MOUSE_OUTSIDE;
                this.dispatchEvent( event );
            }

        },false,0, this);
        return false;
    });

    //defined global variable
    if( typeof window.document !== "undefined" )window.Breeze=Breeze;

}(window));
