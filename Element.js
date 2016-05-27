/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function( module ,undefined )
{
    "use strict";

    /**
     * @private
     */
    var version='1.0.0'
    ,isSimple = /^.[^:#\[\.,]*$/
    ,breezeCounter=0
    ,getContext=function( context )
    {
        if( typeof context === 'undefined' )
            return document;
        if( context instanceof Element )return context.context;
        context = typeof context=== "string" ? Breeze.sizzle(context,document)[0] : context;
        if( Breeze.isFrame( context ) && context.contentWindow )
            return context.contentWindow.document;
        if( Breeze.isWindow(context) )context=context.document;
        return Breeze.isHTMLContainer( context ) ? context : document;
    }

    /**
     * 重新编译元素到Breeze对象上
     * @param target
     * @param elems
     * @param reverted
     * @returns {Element}
     */
    ,doMake=function( target, elems ,clear , reverted ,uniqueSort )
    {
        if( clear===true )
        {
            var revers=target.splice(0,target.length,elems);
            if( reverted !== true )
            {
                if( !target['__reverts__'] )
                    target['__reverts__']=[];
                target['__reverts__'].push( revers );
            }
        }
        if( uniqueSort && target.length > 1 )
        {
            var ret= DataArray.prototype.unique.call( target.toArray() );
            if( ret.length !== target.length ){
               return doMake(target,ret,true,true,false);
            }
        }
        target.current(null);
        return target;
    }

    ,doGrep=function( elements, strainer, invert )
    {
        if( !Breeze.isFunction(strainer) )
            return elements;
        var ret,matches = [],i = 0,length = elements.length,expect = !invert;
        for( ; i < length; i++ )
        {
            ret = !strainer( elements[ i ], i );
            if ( ret !== expect )matches.push( elements[ i ] );
        }
        return matches;
    }

    ,doFilter=function( elements, strainer, exclude )
    {
        //自定义过滤器
        if ( Breeze.isFunction( strainer ) )
        {
            return doGrep( elements, function( elem, i ){
                return !!strainer.call( elem, i) !== exclude;
            });
        }

        //是否为指定的元素
        if ( Breeze.isNodeElement( strainer ) )
        {
            return doGrep( elements, function( elem ) {
                return ( elem === strainer ) !== exclude;
            });
        }

        //保留指定匹配选择器的元素
        if ( typeof strainer === "string" )
        {
            if ( isSimple.test( strainer ) ) {
                return doFind( elements,strainer );
            }
            strainer = doFind( elements, strainer );
            if( !exclude )return strainer;
        }

        //排除匹配指定选择器的元素
        return doGrep( elements, function( elem ) {
            return ( Breeze.inObject( strainer, elem ) >= 0 ) !== exclude;
        });
    }

    ,doFind = function( elements, selector )
    {
        var ret=[];
        if( typeof selector === "function" )
        {
            ret=doGrep( elements, selector );

        }else if( typeof selector === "string" )
        {
            ret= Breeze.sizzle( selector, null, null, elements );
        }else
        {
            ret=doGrep( elements, function( elem ) { return elem.nodeType === 1; } );
        }
        return ret;
    }

    /**
     * 递归查找指定属性名的节点元素
     * @param propName
     * @param flag
     * @param strainer
     * @returns {Array}
     */
    ,doRecursion=function(propName,flag,strainer,notSort)
    {
        var target,len=!!this.forEachCurrentItem ? 1 : this.length,i= 0,currentItem,
            ret=[],hasStrainer=Breeze.isFunction( strainer);
        for( ; i< len ; i++)
        {
            target= currentItem=this.forEachCurrentItem || this[i];
            while( currentItem && ( currentItem=currentItem[ propName ] ) )
            {
                hasStrainer ? flag=strainer.call( target ,currentItem,ret ) :
                              currentItem.nodeType===1 && ( ret=ret.concat( currentItem ) );
                if( flag !== true )break;
            }
        }
        if( ret.length > 1 && !notSort )ret=DataArray.prototype.unique.call(ret);
        return ret;
    }

    ,dispatchEventAll=function(target,event)
    {
        if( target instanceof EventDispatcher &&  target.hasEventListener( event.type ) && !target.dispatchEvent( event ) )
          return false;
        return true;
    }
   ,dispatchElementEvent=function( target, parent, child , type )
    {
        var event=new ElementEvent( type )
        event.parent=parent;
        event.child=child
        event.dispatcher=target;
        return dispatchEventAll(target, event );
    }
    ,getChildNodes=function(element,selector,flag)
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
     * Element Class
     * @param selector
     * @param context
     * @constructor
     */
    function Element(selector,context)
    {
        if( selector instanceof Element )
        {
            selector=selector.toArray();
        }

        if( !(this instanceof Element) )
            return new Element( selector,context );

        this.length=0;
        if( typeof selector === 'undefined' &&  typeof context === "undefined" )return this;

        var result=selector;
        this.context = getContext( context );
        this.selector = selector;
        if( typeof selector === "string" )
        {
            selector=Breeze.trim(selector);
            if( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 )
            {
                selector =  Breeze.createElement(selector);

            }else if( selector==='body' || selector==='window' || selector==='document' )
            {
                var win = Breeze.getWindow( this.context ) || window;
                result= [  win[ selector ] || win.document[selector] || win ];
            }else
            {
                result= Breeze.sizzle( selector, this.context );
            }
        }

        if( Breeze.isWindow(selector) || Breeze.isDocument( selector ) )
        {
            result=[selector];

        }else if( Breeze.isNodeElement(selector) )
        {
            result=[selector];

            //新创建的元素直接添加到文档中
            if( !selector.parentNode || Breeze.nodeName(  selector.parentNode ) === '#document-fragment')
            {
                this.addChild( result[0] );
            }
        }

        this.forEachCurrentItem=undefined;
        this.forEachPrevItem=undefined;
        this.forEachNextItem=undefined;
        this.forEachCurrentIndex=NaN;
        this.splice.call(this,0,0,result);
        EventDispatcher.call(this);

        //统计实例对象数
        this.__COUNTER__=++breezeCounter;
    }

    //======================================================================================
    //  Extends module class
    //======================================================================================

    /**
     * Extends EventDispatcher Class
     * @type {EventDispatcher}
     */
    Element.prototype= new EventDispatcher()
    Element.prototype.slice= DataArray.prototype.slice;
    Element.prototype.concat= DataArray.prototype.concat;
    Element.prototype.indexOf= DataArray.prototype.indexOf;
    Element.prototype.splice= DataArray.prototype.splice;
    Element.prototype.toArray= DataArray.prototype.toArray;
    Element.prototype.forEachCurrentItem=undefined;
    Element.prototype.forEachPrevItem=undefined;
    Element.prototype.forEachNextItem=undefined;
    Element.prototype.forEachCurrentIndex=NaN;

    //============================================================
    //  Defined Instance Propertys
    //============================================================

    //Element 构造方法
    Element.prototype.constructor=Element;

    //每个Breeze对象的DOM元素的作用域
    Element.prototype.context=null;

    //使用的选择器
    Element.prototype.selector=null;

    //============================================================
    //  Defined Public Method
    //============================================================

    /**
     * 设置获取当前游标位置的元素
     * @param element
     * @returns {*}
     */
    Element.prototype.current=function( element )
    {
        if( typeof element !== "undefined" )
        {
            var index = element === null ? NaN : this.indexOf( element );
            if( index >= 0 )
            {
                this.forEachCurrentItem=element;
                this.forEachCurrentIndex= index;

            }else if( typeof element=== "string" )
            {
                element=Breeze.sizzle(element, this.context );
                this.forEachCurrentItem = element ? element[0] : undefined;
                this.forEachCurrentIndex = NaN;

            }else
            {
                this.forEachCurrentItem = element || undefined;
                this.forEachCurrentIndex = NaN;
            }
            return this;
        }
        return this.forEachCurrentItem || this[0];
    }

    /**
     * 设置获取当前元素的索引
     * @param index
     * @returns {*}
     */
    Element.prototype.index=function( index )
    {
        if( typeof index !== "undefined" )
        {
            if( index >= 0 && index < this.length && typeof this[index] !== "undefined" )
            {
                this.forEachCurrentItem= this[ index ];
                this.forEachCurrentIndex= index;
                return this;
            }
            throw new Error('Out range of index')
        }
        return this.forEachCurrentIndex;
    }

    /**
     * 遍历元素
     * @param callback
     * @param refObject
     * @returns {*}
     */
    Element.prototype.forEach=function(callback , refObject )
    {
        var  result;
        refObject=refObject || this;

        if( this.forEachCurrentItem !== undefined && this.forEachPrevItem !== this.forEachCurrentItem )
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
                this.forEachNextItem=items[ index+1 ] === 'undefined' ? undefined : items[ index+1 ] ;
                result=callback.call( refObject ,this.forEachCurrentItem,index);
                this.forEachPrevItem=this.forEachCurrentItem;
                if( result !== undefined )
                    break;
            }
            this.forEachCurrentItem = undefined;
            this.forEachNextItem    = undefined;
            this.forEachPrevItem    = undefined;
            this.forEachCurrentIndex= NaN;
        }
        return result === undefined ? this : result;
    }

    /**
     * 返回此对象名称
     * @returns {string}
     */
    Element.prototype.toString=function()
    {
        return 'breeze_'+this.__COUNTER__;
    }

    /**
     * 判断指定的选择器是否在当前匹配的项中。
     * @param selector
     * @returns {*}
     */
    Element.prototype.has=function( selector )
    {
        if( typeof selector === "undefined" )
            throw  new Error('invalid selector');
        var is = Breeze.isFunction(selector);
        var result=false;
        this.forEach(function(elem)
        {
            var ret = is ? !!selector.call( elem ) :  Breeze.sizzle( selector, document, null, [ elem ] ).length > 0;
            if( ret ) {
                result=true;
                return result;
            }
        });
        return result;
    }

    /**
     * 指定的选择器是否为当前作用域的子级
     * @param selector
     * @returns {boolean}
     */
    Element.prototype.contains=function( child, parent )
    {
        parent = parent || this.context;
        return Breeze.sizzle( selector, parent ).length > 0;
    }

    /**
     * 回撒到指定步骤的选择器所匹配的元素,不包含初始化的步骤。
     * @param step
     * @returns {Element}
     */
    Element.prototype.revert=function( step )
    {
        var reverts= this['__reverts__'];
        var len=reverts ? reverts.length : 0;
        if( len > 0 )
        {
            step = step || -1;
            step= step < 0 ? step+len : step;
            step=step >= len ? 0 : step;
            doMake( this, reverts.splice(step, len-step).shift() ,true , true );
        }
        return this;
    }

    //==================================================
    // 筛选匹配元素
    //==================================================

    /**
     * 筛选元素等于指定的索引
     * @param index
     * @returns {Element}
     */
    Element.prototype.eq=function( index )
    {
        if( typeof index !== "number" || typeof this[index] === "undefined")
           throw new Error('invalid index');
        return doMake( this,[ this[index] ],true);
    }

    /**
     * 筛选大于索引的元素
     * @param index
     * @returns {Element}
     */
    Element.prototype.gt=function( index )
    {
        return doMake( this, doGrep(this,function(elem,i){
            return i > index;
        }),true);
    }

    /**
     * 筛选小于索引的元素
     * @param index
     * @returns {Element}
     */
    Element.prototype.lt=function( index )
    {
        return doMake( this, doGrep(this,function(elem,i){
            return i < index;
        }),true);
    }

    /**
     * 筛选元素不等于指定筛选器的元素
     * @param index
     * @returns {Element}
     */
    Element.prototype.not=function( selector , returned )
    {
        if( !Breeze.isDefined(selector) )
            throw new Error('invalid selector')

        var results=this.toArray();
        if( Breeze.isNumber(selector) )
        {
            selector=[ this[ selector ] ];
        }

        if( Breeze.isSelector( selector ) )
        {
            selector= doFind(this, selector );
        }
        doGrep(selector,function(a){
            results=doGrep(results,function(b){
                return a !== b;
            })
        });
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 从元素集中来检索符合回调函数的元素
     * @param elems
     * @param callback
     * @param invert
     * @returns {Element}
     */
    Element.prototype.grep=function( strainer, invert , returned )
    {
        var results = doGrep(this,strainer,invert);
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 查找当前匹配的第一个元素下的指定选择器的元素
     * @param selector
     * @returns {Element}
     */
    Element.prototype.find=function( selector , returned )
    {
        if( !Breeze.isString(selector) )
         throw new Error('invalid selector')
        var results = Breez.sizzle( selector , this.context );
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 返回符合过滤器条件的元素集
     * @param strainer
     * @returns {Element}
     */
    Element.prototype.filter=function(strainer, returned )
    {
        var results = doFilter(this,strainer,false);
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 查找所有匹配元素的父级元素或者指定selector的父级元素（不包括祖辈元素）
     * @param selector
     * @returns {Element}
     */
    Element.prototype.parent=function(selector, returned )
    {
        var results=doRecursion.call(this,'parentNode',false);
        results=Breeze.isString(selector) ? doFind(results,selector) : results;
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 查找所有匹配元素的祖辈元素或者指定selector的祖辈元素。
     * @param selector
     * @returns {Element}
     */
    Element.prototype.parents=function( selector , returned )
    {
        var is = Breeze.isFunction(selector);
        var results=doRecursion.call(this,'parentNode',true, selector===undefined ? null : function(element,ret)
        {
            if(  ( is && ( element=selector.call(this,element) ) ) ||
                 ( element.nodeType===1 && Sizzle.matchesSelector( element, selector ) ) )
            {
                ret.push(element);
                return false;
            }
            return true;
        });
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 获取所有匹配元素向上的所有同辈元素,或者指定selector的同辈元素
     * @param name
     * @returns {Element}
     */
    Element.prototype.prevAll=function( selector, returned )
    {
        var results=doRecursion.call(this,'previousSibling',true);
        results=Breeze.isString(selector) ? doFind(results,selector) : results
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 获取所有匹配元素紧邻的上一个同辈元素,或者指定selector的同辈元素
     * @param name
     * @returns {Element}
     */
    Element.prototype.prev=function(selector,returned)
    {
        var results=doRecursion.call(this,'previousSibling',false);
        results=Breeze.isString(selector) ? doFind(results,selector) : results;
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 获取所有匹配元素向下的所有同辈元素或者指定selector的同辈元素
     * @param name
     * @returns {Element}
     */
    Element.prototype.nextAll=function( selector ,returned )
    {
        var results=doRecursion.call(this,'nextSibling',true);
        results=Breeze.isString(selector) ? doFind(results,selector) : results;
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 获取每一个匹配元素紧邻的下一个同辈元素或者指定selector的同辈元素
     * @param name
     * @returns {Element}
     */
    Element.prototype.next=function(selector, returned )
    {
        var results=doRecursion.call(this,'nextSibling',false);
        results=Breeze.isString(selector) ? doFind(results,selector) : results
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 获取每一个匹配元素的所有同辈元素
     * @param name
     * @returns {Element}
     */
    Element.prototype.siblings=function(selector,returned)
    {
        var results=[].concat( doRecursion.call(this,'previousSibling',true,null,true) , doRecursion.call(this,'nextSibling',true,null,true) )
        results=Sizzle.uniqueSort( results );
        if( Breeze.isString(selector) )results= doFind(results,selector);
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 查找所有匹配元素的所有子级元素，不包括孙元素
     * @param selector 如果是 * 返回包括文本节点的所有元素。不指定返回所有HTMLElement 元素。
     * @returns {Element}
     */
    Element.prototype.children=function( selector , returned )
    {
        var has=true;
        if( Breeze.isString( selector ) )
        {
            selector=Breeze.trim(selector);
            has = selector !== '*';
        };

        var results=[];
        this.forEach(function(element)
        {
           if( !Breeze.isFrame( element ) )
               results=results.concat( selector==='*' ?  Breeze.sizzle( '*' ,element) : DataArray.prototype.slice.call( element.childNodes,0 ) );
        })
        if( has )results=doFind(results,selector);
        return returned ? results : doMake( this, results ,true );
    }

    //=================================================
    // DOM Element 操作,这是一些破坏性的操作
    //=================================================

    // 外部操作
    /**
     * 为当前所匹配每个项的位置添加元素
     * @param element 要添加的元素
     * @param index 是否添加到元素的前面
     * @returns {Element}
     */
    Element.prototype.addElementAt=function( element,index )
    {
        var before = !!index;
        if( typeof index === 'number' )
        {
            this.index( index );
            before=false;
        }
        this.forEach(function(parent){
            this.current( parent.parentNode ).addChildAt( element, before ? parent : parent.nextSibling );
        })
        return this;
    }

    /**
     * 删除当前匹配的元素
     * @param index 删除指定位置的元素,如果不指定则会删除所有匹配的元素。
     * @returns {Element}
     */
    Element.prototype.removeElement=function( index )
    {
        if( typeof index==='number' )
            this.index( index );
        this.forEach(function(element){
            this.removeChildAt( element );
        })
        return this;
    }

    //内部操作

    /**
     * 移除指定的子级元素
     * @param childElemnet|selector
     * @returns {Element}
     */
    Element.prototype.removeChild=function( childElemnet )
    {
        if( typeof childElemnet==='string' )
        {
            this.forEach(function(elem)
            {
                var children=Sizzle(childElemnet,elem), b=0,len=children.length;
                for( ; b<len ; b++)if( children[i] && children[i].nodeType===1 && children[i].parentNode )
                {
                    this.removeChildAt( children[i] );
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
     * @returns {Element}
     */
    Element.prototype.removeChildAt=function( index )
    {
        var is=false;
        if(  index !== undefined && index.parentNode ){
            this.current( index.parentNode )
            is=true;
        }else if( !Breeze.isNumber( index ) )
            throw new Error('Invalid param the index. in removeChildAt');

        return this.forEach(function(parent)
        {
            var child= is ? index : this.getChildAt( index );
            if( removeChild(this,parent,child) && is )
              return this;
        });
    }

    var removeChild= function(target,parent,child)
    {
        if( child && parent.hasChildNodes() && child.parentNode === parent &&
            dispatchElementEvent(target,parent,child,ElementEvent.BEFORE_CHILD_REMOVE ) )
        {
            var result=parent.removeChild( child );
            dispatchElementEvent(target,parent,child,ElementEvent.CHILD_REMOVE );
            return !!result;
        }
        return false;
    }

    /**
     * 添加子级元素（所有已匹配的元素）
     * @param childElemnet
     * @returns {Element}
     */
    Element.prototype.addChild=function( childElemnet )
    {
        return this.addChildAt(childElemnet,-1);
    }

    /**
     * 在指定位置加子级元素（所有已匹配的元素）。
     * 如果 childElemnet 是一个已存在的元素，那么会先删除后再添加到当前匹配的元素中后返回，后续匹配的元素不会再添加此元素。
     * @param childElemnet 要添加的子级元素
     * @param index | refChild | fn(node,index,parent)  要添加到的索引位置
     * @returns {Element}
     */
    Element.prototype.addChildAt=function(childElemnet,index)
    {
        if( childElemnet instanceof Element )
        {
            childElemnet=childElemnet.toArray();
            for( var c=0; c<childElemnet.length; c++)
            {
                 this.addChildAt( childElemnet[c], index );
            }
            return this;
        }

        if( index===undefined )
            throw new Error('Invalid param the index. in addChildAt');

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
                throw new Error('The childElemnet not is HTMLElement. in addChildAt');
            }

            if( child.parentNode !== parent && dispatchElementEvent(this,parent,child,ElementEvent.BEFORE_CHILD_ADD ) )
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
                dispatchElementEvent(this,parent,child,ElementEvent.CHILD_ADD );
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
    Element.prototype.getChildAt=function( index )
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
    Element.prototype.getChildIndex=function( childElemnet )
    {
        if( typeof childElemnet==='string' )
        {
            childElemnet= Breeze.sizzle( childElemnet, null, null, this.toArray() )[0];
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
     * 返回指定的元素在当前匹配项中的位置
     * @param childElemnet | selector
     * @returns {Number}
     */
    Element.prototype.getElementIndex=function( elemnet )
    {
        var index = 0;
        for(; index< this.length ; index++) if( elemnet === this[index] )
        {
           return index;
        }
        return -1;
    }

    /**
     * 用指定的元素来包裹当前所有匹配到的元素
     * @param element
     * @returns {Element}
     */
    Element.prototype.wrap=function( element )
    {
       var is=Breeze.isFunction( element );
       return this.forEach(function(elem,index)
       {
            var wrap=Breeze.createElement( is ? element.call(this,elem,index) : element );
            this.current( elem.parentNode ).addChildAt( wrap , elem );
            this.current( wrap ).addChildAt( elem ,-1);
       });
    }

    /**
     * 取消当前所有匹配元素的父级元素。不指定选择器则默认为父级元素，否则为指定选择器的祖辈元素。
     * 父级或者祖辈元素只能是body的子元素。
     * @param selector
     * @returns {Element}
     */
    Element.prototype.unwrap=function( selector )
    {
        var is= typeof selector === "undefined";
        return this.forEach(function(elem)
        {
            var parent= is ?  elem.parentNode : this.parent( selector , true)[0];
            if( parent && parent.ownerDocument && Sizzle.contains( parent.ownerDocument.body, parent ) )
            {
               var children=this.current( parent ).children('*',true);
               if( parent.parentNode )
               {
                   this.current( parent.parentNode );
                   var len=children.length,i=0;
                   while( i<len ){
                      this.addChildAt( children[ i++ ], parent );
                   }
                   this.removeChildAt( parent );
               }
            }
        });
    }

    /**
     * 获取或者设置 html
     * @param html
     * @returns {string | Element}
     */
    Element.prototype.html=function( html , outer )
    {
        outer = !!outer;
        var write= typeof html !== "undefined";
        if( !write && this.length < 1 ) return '';
        return this.forEach(function(elem)
        {
            if( !write || Breeze.isBoolean(html) )
            {
                var html=element.innerHTML;
                if( html === true )
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
                   if( !removeChild( this, elem, nodes[b] ) )
                     return this;
                }
            }

            if( outer && elem.parentNode && elem.parentNode.ownerDocument && Breeze.contains(elem.parentNode.ownerDocument.body, elem.parentNode) )
            {
                this.current( elem.parentNode );
            }

            if( typeof html === "string" )
            {
                html = Breeze.trim( html );
                var target = this.current();

                try{
                    target.innerHTML = html;
                }catch(e)
                {
                    var nodename = Breeze.nodeName( target );
                    if( !new RegExp("^<"+nodename).exec(html) )
                    {
                        html= Breeze.sprintf('<%s>%s</%s>',nodename,html,nodename);
                    }
                    var child= Breeze.createElement( html );
                    var deep =  nodename === 'tr' ? 2 : 1,d=0;
                    while( d < deep && child.firstChild)
                    {
                        d++;
                        child=child.firstChild;
                    }
                    Breeze.mergeAttributes(child, target);
                    target.parentNode.replaceChild(child,  target );
                    this.splice( this.indexOf( target ), 1, child );
                }

            }else
            {
                this.addChild(html);
            }
        });
    }

    //访问和操作属性值
    function access(name,newValue,callback,dispatchEvent)
    {
        var write= typeof newValue !== 'undefined';
        if( !write && this.length < 1 )return null;

        return this.forEach(function(elem)
        {
            var oldValue= callback.get.call(elem,name,this);
            if( !write ) return oldValue;
            if( oldValue !== newValue )
            {
                callback.set.call(elem,name,newValue,this);
                if( dispatchEvent )
                {
                    var event = dispatchEvent===StyleEvent.CHANGE ?  new StyleEvent( StyleEvent.CHANGE ) :  new PropertyEvent( PropertyEvent.CHANGE );
                    event.property = name;
                    event.newValue = newValue;
                    event.oldValue = oldValue;
                    dispatchEventAll(this, event);
                }
            }
        });
    }

    /**
     * 设置所有匹配元素的样式
     * @param name
     * @param value
     * @returns {Element}
     */
    Element.prototype.style=function( name,value )
    {
        if( typeof name === 'string' &&  /^(\s*[\w\-]+\s*\:[\w\-\s]+;)+$/.test(name)  )
        {
            value=name;
            name='cssText';
        }
        else if( Breeze.isObject(name) )
        {
            value=name;
            name='cssText';
        }

        return access.call(this,name,value,{
            get:function( name )
            {
                var fix= Breeze.fix();
                var elem = this;
                if( document.defaultView && document.defaultView.getComputedStyle )
                {
                    if( typeof name === "undefined" ) return elem.style
                    if( name==='cssText' )return (elem.style || {} ).cssText || '';
                    var ret='',computedStyle;
                    if( name==='' )return '';
                    computedStyle=document.defaultView.getComputedStyle( elem, null );
                    if( fix.cssHooks[name] && typeof fix.cssHooks[name].get === "function" )return fix.cssHooks[name].get.call(elem,computedStyle,name) || '';
                    if( computedStyle )
                    {
                        name=Breeze.styleName( name );
                        ret = computedStyle.getPropertyValue( name );
                        ret = ret === "" ? elem.style[name] : ret;
                    }
                    return ret;
                }

                var left='', rsLeft,hook=fix.cssHooks[name]
                    ,style =  elem.currentStyle || elem.style || {};

                if( typeof name === "undefined" ) return style;
                if( name==='cssText' )return (style.style || {} ).cssText || '';

                name=Breeze.styleName( name );
                if( name==='' )return '';
                var ret = style[ name ] || '';
                if( hook && hook.get )ret=hook.get.call(elem,style,name) || '';

                //在ie9 以下将百分比的值转成像素的值
                if( /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i.test( ret ) )
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

            },
            set:function(name,value,obj){

                var fix= Breeze.fix();
                var style=this.style;
                var type = typeof value,ret,hook=fix.cssHooks[name];
                if ( type === "number" && isNaN( value ) )return false;

                //增量值
                if ( type === "string" && (ret=/^([\-+])=([\-+.\de]+)/.exec( value )) )
                {
                    var inc = name === 'width' || name ==='height' ? obj.size()[name] : obj.style( name );
                    value = ( +( ret[1] + 1 ) * +ret[2] ) + inc;
                    type = "number";
                }

                if ( value == null )return false;
                if ( type === "number" && !fix.cssNumber[ name ] )
                    value += "px";

                if( hook && hook.set && hook.set.call(elem,style,value) === true )
                {
                    return true;
                }

                if( name === 'cssText' )
                {
                    value=value.replace(/([\w\-]+)\s*\:([^\;]*)/g, function (all, name,value) {

                        if( fix.cssHooks[name] && typeof fix.cssHooks[name].set ==="function" )
                        {
                            var obj={}
                            fix.cssHooks[name].set(obj, value );
                            return Breeze.serialize( obj,'style');
                        }
                        return Breeze.styleName( name ) +':'+ value;
                    });

                }else
                {
                    name= Breeze.styleName( name )
                }
                try{
                    style[name]=value;
                }catch( e ){}
                return true;
            }

        }, StyleEvent.CHANGE ) || '';
    }

    /**
     * 为当前每个元素设置数据缓存
     * @param name
     * @param value
     * @returns {Element}
     */
    Element.prototype.data=function(name,value)
    {
        return access.call(this,name,value,{
            get:function(prop){
                return Breeze.storage(this,prop);
            },
            set:function(prop,newValue){
                Breeze.storage(this,prop,newValue);
            }
        });
    }

    /**
     * 为每一个元素设置属性值
     * @param name
     * @param value
     * @returns {Element}
     */
    Element.prototype.property=function(name,value )
    {
        var fix =  Breeze.fix();
        name =  fix.attrMap[name] || name;
        var lower=name.toLowerCase();
        if( lower==='innerhtml' )
        {
            return this.html(value);
        }else if( lower==='value' )
        {
            return this.value( value );
        }

        return access.call(this,name,value,{
            get:function(prop)
            {
                return ( fix.attrtrue[prop] ? this[prop] : this.getAttribute(prop) ) || null;
            },
            set:function(prop,newValue,obj){

                if( lower === 'style' )
                    throw new Error('the style property names only use style method to operate in property');
                if( prop === 'className')
                {
                     obj.addClass(newValue);

                }else if( newValue === null )
                {
                    this.removeAttribute(prop);

                }else
                {
                    fix.attrtrue[prop] ? this[prop] = val : this.setAttribute(prop, newValue);
                }
                return true;
            }
        },PropertyEvent.CHANGE);
    }

    /**
     * 判断当前匹配元素是否有指定的属性名
     * @param prop
     * @returns {boolean}
     */
    Element.prototype.hasProperty=function(prop)
    {
        var elem = this.current();
        return typeof elem.hasAttributes === 'function' ? elem.hasAttributes( name ) : !!elem[name];
    }

    /**
     * 获取匹配第一个元素的节点名称
     * @returns {string}
     * @public
     */
    Element.prototype.nodeName=function()
    {
        var elem= this.current();
        return elem && typeof elem.nodeName=== "string" && elem.nodeName!='' ? elem.nodeName.toLowerCase() : '';
    }

    /**
     * 获取设置当前元素的文本内容。
     * @returns {string|Element}
     */
    Element.prototype.text=function( value )
    {
        return access.call(this,'text',value,{
            get:function(){
                var ret = "",nodeType = this.nodeType;
                if( nodeType === 1 || nodeType === 9 || nodeType === 11 )
                {
                    return typeof this.textContent === "string" ? this.textContent : this.innerText;
                } else if ( nodeType === 3 || nodeType === 4 )
                {
                    return this.nodeValue;
                }
                return ret;
            },
            set:function(prop,newValue)
            {
                typeof this.textContent === "string" ? this.textContent=newValue : this.innerText=newValue;
            }
        },PropertyEvent.CHANGE) || '';
    }

    /**
     * 获取设置表单元素的值。此方法只会对表单元素有用。
     * @returns {string|Element}
     */
    Element.prototype.value=function( value )
    {
        return access.call(this,'value',value,{
            get:function(prop){
                return this.hasAttribute('value') ? this.value : null;
            },
            set:function(prop,newValue)
            {
                if( this.hasAttribute('value') )this.value=newValue;
            }
        },PropertyEvent.CHANGE) || null;
    }

    /**
     * 判断是否有指定的类名
     * @param className
     * @returns {boolean}
     */
    Element.prototype.hasClass=function( className )
    {
        var value=this.property('class');
        return value === '' || !value ? false : typeof className==='string' ? new RegExp('(\\s|^)' + className + '(\\s|$)').test( value ) : true ;
    }

    /**
     * 添加指定的类名
     * @param className
     * @returns {Element}
     */
    Element.prototype.addClass=function( className )
    {
        if( typeof className !== "string" )
            throw new Error('invaild class name');
        this.forEach(function(elem){

            if( !this.hasClass( className ) )
            {
                var oldClass=Breeze.trim( elem['className'] );
                oldClass= [ Breeze.trim( oldClass ) ];
                oldClass.push( className );
                elem['className'] = Breeze.trim( oldClass.join(' ') );
            }
        });
        return this;
    }

    /**
     * 移除指定的类名或者清除所有的类名。
     * @param className
     * @returns {Element}
     */
    Element.prototype.removeClass=function(className)
    {
        var all = typeof className !== 'string';
        this.forEach(function(elem){
            var val='';
            if( !all )
            {
                var value=elem['className'] || '';
                var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
                val=value.replace(reg, '');
            }
            val === '' ? elem.removeAttribute('class') : elem['className'] = Breeze.trim(val);
            try {
                elem.offsetWidth = element.offsetWidth;
            }catch(e){}
        })
        return this;
    }

    /**
     * 获取元素大小
     * @param border 是否包含边框
     * @returns {*|number}
     */
    Element.prototype.size=function( border )
    {
        var size ={width:0,height:0};
        if( Breeze.isWindow(elem) )
        {
            var docElem = elem.document.documentElement;
            size.width=Math.max(elem.innerWidth || 0, elem.offsetWidth || 0,elem.clientWidth || 0, docElem.clientWidth || 0);
            size.height=Math.max(elem.innerHeight || 0, elem.offsetHeight || 0,elem.clientHeight || 0, docElem.clientHeight || 0);

        }else if( Breeze.isDocument(elem) )
        {
            var docElem = elem.documentElement;
            size.width=Math.max(
                elem.body.scrollWidth  || 0, docElem.scrollWidth || 0
                ,elem.body.offsetWidth || 0, elem.offsetWidth || 0
                ,elem.body.clientWidth || 0, elem.clientWidth || 0
            );
            size.height+=docElem.clientLeft || 0;

            size.height=Math.max(
                elem.body.scrollHeight  || 0, docElem.scrollHeight || 0
                ,elem.body.offsetHeight || 0, elem.offsetHeight || 0
                ,elem.body.clientHeight || 0, elem.clientHeight || 0
            );
            size.height+=docElem.clientTop || 0;

        }else if ( typeof elem.offsetWidth !== "undefined"  )
        {
            size.width = elem.offsetWidth;
            size.height = elem.offsetHeight;
            border = border !== false;
            var margin= Breeze.isBrowser( Breeze.BROWSER_IE, 9 ,'<');
            var pos = [ "Top", "Right", "Bottom", "Left" ];
            for ( var i=0 ; i < 4; i ++ )
            {
                if( !border )
                {
                    size[ i%2==0 ? 'width' : 'height' ]-= parseFloat( Breeze.style( elem, "border"+pos[ i ]+"Width" ) ) || 0;
                }
                if( margin )
                {
                    size[ i%2==0 ? 'width' : 'height']-= parseFloat( Breeze.style( elem, "margin"+pos[ i ]  ) ) || 0;
                }
            }

        }else
        {
            size.width = parseInt( Breeze.style(elem,'width') ) || 0;
            size.height = parseInt( Breeze.style(elem,'height') ) || 0;
            for ( var i=0 ; i < 4; i ++  )
            {
                size[ i%2==0 ? 'width' : 'height'] += parseFloat( Breeze.style( elem, "padding" + cssExpand[ i ] ) ) || 0;
            }
        }
        return size;
    }


    /**
     * @param prop
     * @param value
     * @returns {*|number}
     * @private
     */
    var __size__=function(prop,value)
    {
        var border = typeof value==='boolean' ? value : ( value===undefined || value==='border' );
        value = (value===undefined || value==='border' || typeof value==='boolean') ? undefined : parseFloat( value );
        return access.call(this,prop, value,{
            get:function(prop,obj){
                return obj.size(border)[prop];
            },
            set:function(prop,newValue,oldValue,target){
                Breeze.style(this,prop,newValue);
            }
        },PropertyEvent.CHANGE) || 0;
    }

    /**
     * @private
     */
    var __position__=function(prop,value)
    {
        return access.call(this,prop, value,{
            get:function(prop){
                return Breeze.getBoundingRect(this)[ prop ];
            },
            set:function(prop,newValue){
                if( Breeze.style(this,'position')==='static' )Breeze.style(this,'position','relative');
                return Breeze.style(this,prop,parseInt(newValue) || 0 );
            }
        },PropertyEvent.CHANGE) || 0;
    }

    /**
     * 设置所有匹配元素的宽度
     * @param val
     * @returns {Element}
     */
    Element.prototype.width=function( value )
    {
        return __size__.call(this,'width',value);
    }

    /**
     * 获取匹配第一个元素的高度
     * @param border 是否包括边框的宽度
     * @returns {Number}
     */
    Element.prototype.height=function( value )
    {
        return __size__.call(this,'height',value);
    }

    /**
     * 获取设置滚动条的位置
     * @param number left
     * @param number top
     * @returns {Element|{left:number,top:number,height:number,width:number}}
     */
    Element.prototype.scroll=function( left, top )
    {
        var value = true;
        if( typeof left === "undefined" && typeof  top === "undefined" )
        {
            value=undefined;
        }
        return access.call(this,'scroll', value,
        {
            get:function(prop)
            {
                var scroll={};
                var element = this.defaultView || this.parentWindow || this;
                if( Breeze.isWindow( element ) )
                {
                    scroll.left = element.pageXOffset || element.document.documentElement.scrollLeft || element.document.body.scrollLeft;
                    scroll.top =  element.pageYOffset  || element.document.documentElement.scrollTop || element.document.body.scrollTop;
                    scroll.height = element.document.documentElement.scrollHeight || element.document.body.scrollHeight;
                    scroll.width = element.document.documentElement.scrollWidth || element.document.body.scrollWidth;

                }else
                {
                    scroll.left = element.scrollLeft;
                    scroll.top =  element.scrollTop;
                    scroll.height = element.scrollHeight;
                    scroll.width = element.scrollWidth;
                }
                return scroll;
            },

            set:function(prop,newValue,obj){

                var element = this.defaultView || this.parentWindow || this;
                if( obj.style('position')==='static' )obj.style('position','relative');
                if( !(left && top) )
                {
                    var pos = Breeze.scroll(element);
                    left ||(left=pos.left);
                    top || (top=pos.top);
                }

                left = Math.max(left,0);
                top = Math.max(top,0);

                if( typeof element.scrollTo === "function" )
                {
                    element.scrollTo(left,top);
                }else
                {
                    element.scrollTop = top;
                    element.scrollLeft = left;
                }
                return true;
            }

        },PropertyEvent.CHANGE) || 0;
    }

    /**
     * 获取元素相对文档页面边界的矩形坐标。
     * 如果元素的 position = fixed 或者 force=== true 则相对浏览器窗口的位置
     * @param NodeElement elem
     * @param boolean force
     * @returns {left,top,right,bottom,width,height}
     */
    Element.prototype.getBoundingRect=function( force )
    {
        var value={ 'top': 0, 'left': 0 ,'right' : 0,'bottom':0,'width':0,'height':0}, box, size;
        var elem= this.current();
        if( Breeze.isWindow(elem) )
        {
            size = Breeze.getSize(elem);
            value.left = elem.screenLeft || elem.screenX;
            value.top = elem.screenTop || elem.screenY;
            value.width = size.width;
            value.height = size.height;
            value.right = size.width + value.left;
            value.bottom = size.height + value.top;
            return value;
        }

        if( !Breeze.isNodeElement(elem) )throw new Error('invalid elem. elem not is NodeElement');
        var doc =  elem.ownerDocument || elem, docElem=doc.documentElement;
        var scroll = Breeze.scroll( Breeze.getWindow(doc) );
        if( "getBoundingClientRect" in document.documentElement )
        {
            box = elem.getBoundingClientRect();
            var clientTop = docElem.clientTop || doc.body.clientTop || 0, clientLeft = docElem.clientLeft || doc.body.clientLeft || 0;
            value.top = box.top + scroll.top - clientTop;
            value.left = box.left + scroll.left - clientLeft;
            value.right = box.right + scroll.left - clientLeft;
            value.bottom = box.bottom + scroll.top - clientTop;
            value.width = box.width || box.right-box.left;
            value.height = box.height || box.bottom-box.top;

        }else
        {
            size = Breeze.getSize( elem );
            value.width = size.width;
            value.height=size.height;
            do {
                value.top += elem.offsetTop;
                value.left += elem.offsetLeft;
                elem = elem.offsetParent;
            } while (elem);
            value.right = value.width+value.left;
            value.bottom = value.height+value.top;
        }

        //始终相对浏览器窗口的位置
        if( Breeze.style(elem,'position') === 'fixed' || force===true )
        {
            value.top -= scroll.top;
            value.left -= scroll.left;
            value.right -= scroll.left;
            value.bottom -= scroll.top;
        }
        return value;
    }

    /**
     * 获取或者设置相对于父元素的左边位置
     * @param val 如果是布尔类型则会返回坐标位置。 true 相对于本地, false 相对于全局的坐标位置，默认为 false。
     * @returns {number|Element}
     */
    Element.prototype.left=function( val )
    {
        return __position__.call(this,'left',val)
    }

    /**
     * 获取或者设置相对于父元素的顶边位置
     * @param val 如果是布尔类型则会返回坐标位置。 true 相对于本地, false 相对于全局的坐标位置，默认为 false。
     * @returns {number|Element}
     */
    Element.prototype.top=function( val )
    {
        return __position__.call(this,'top',val)
    }

    /**
     * 获取或者设置相对于父元素的右边位置
     * @param val 如果是布尔类型则会返回坐标位置。 true 相对于本地, false 相对于全局的坐标位置，默认为 false。
     * @returns {number|Element}
     */
    Element.prototype.right=function( val )
    {
        return __position__.call(this,'right',val)
    }

    /**
     * 获取或者设置相对于父元素的底端位置
     * @param val 如果是布尔类型则会返回坐标位置。 true 相对于本地, false 相对于全局的坐标位置，默认为 false。
     * @returns {number|Element}
     */
    Element.prototype.bottom=function( val )
    {
        return __position__.call(this,'bottom',val)
    }

    /**
     * @private
     */
    var __point__=function(left,top,local)
    {
        var target=this.current();
        var point={}
        point['x']=left || 0;
        point['y']=top || 0;
        if( target && target.parentNode )
        {
            var offset=this.getBoundingRect();
            if( local )
            {
                point['x']+=offset['x'];
                point['y']+=offset['y'];
            }else
            {
                point['x']-=offset['x'];
                point['y']-=offset['y'];
            }
        }
        return point;
    }

    /**
     * 将本地坐标点转成相对视图的全局点
     *  @param left
     *  @param top
     *  @returns {object} left top
     */
    Element.prototype.localToGlobal=function( left,top  )
    {
       return __point__.call(this,left,top,true);
    }

    /**
     *  将视图的全局点转成相对本地坐标点
     *  @param left
     *  @param top
     *  @returns {object}  left top
     */
    Element.prototype.globalToLocal=function( left,top )
    {
        return __point__.call(this,left,top,false);
    }

    /**
     * 显示元素
     * @returns {Element}
     */
    Element.prototype.show=function()
    {
        var type = this.data('__display__') || 'block';
        this.style('display', type );
        return this;
    }

    /**
     * 隐藏当前元素
     * @returns {Element}
     */
    Element.prototype.hide=function()
    {
        this.data('__display__', this.style('display') || 'block' );
        this.style('display', 'none' );
        return this;
    }

    /**
     * 执行一个动画
     * @param options
     * @param callback
     * @returns {*}
     */
    Element.prototype.animation=function( options ,callback )
    {
        var tl=  new Timeline().bind( this.toArray() )
        options=[].concat( options );
        for( var i in options )
        {
            var d = options[i].duration;
            delete options[i].duration
            tl.addKeyFrame( options[i] , d );
        }
        if( typeof callback === 'function' )
        {
           tl.addEventListener(TimelineEvent.FINISH,callback);
        }
        tl.play();
        return tl;
    }

    /**
     * 将一个元素淡入
     * @param duration
     * @param callback
     * @returns {Element}
     */
    Element.prototype.fadeIn=function(duration,callback)
    {
        this.style('opacity',0);
        this.animation({'opacity':1,'duration':duration},callback);
        return this;
    }

    /**
     * 将一个元素淡出
     * @param duration
     * @param callback
     * @returns {Element}
     */
    Element.prototype.fadeOut=function(duration,callback)
    {
        this.style('opacity',1);
        this.animation({'opacity':0,'duration':duration},callback);
        return this;
    }

    module.Element=Element;

})( typeof exports === "object" ? exports :  window )
