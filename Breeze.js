/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(window,undefined )
{

    "use strict";

    if( typeof Sizzle==='undefined' )
        throw new Error('Breeze require Sizzle engine ');

    /**
     * @private
     */
    var version='1.0.0'
    ,isSimple = /^.[^:#\[\.,]*$/
    ,breezeCounter=0

    /**
     * Breeze Class
     * @param selector
     * @param context
     * @constructor
     */
    ,Breeze=function(selector,context)
    {
        if( typeof selector === 'function' )
            return Breeze.ready( selector );

        if( selector instanceof Breeze )
            return selector;

        if( !(this instanceof Breeze) )
            return new Breeze( selector,context );

        this.length=0;
        if( !Utils.isDefined(selector) && !Utils.isDefined(context) )
            return this;

        var result;
        this.context = this.getContext( context );
        this.selector = selector;

        if( Utils.isString( selector ) )
        {
            selector=Utils.trim(selector);

            if( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 )
            {
                result = [ Utils.createElement(selector) ]

            }else
            {
                result= Sizzle( selector, this.context )
            }

        }else if( selector && Utils.isHTMLContainer(selector) || Utils.isWindow(selector) )
        {
            result=[selector];
        }
        Manager.call(this, result );
        if( result.length > 0 )
          this.__rootElement__= this[0];
        this.__COUNTER__=++breezeCounter;
    }

    /**
     * 重新编译元素到Breeze对象上
     * @param target
     * @param elems
     * @param reverted
     * @returns {Breeze}
     */
    ,doMake=function( target, elems ,clear , reverted ,uniqueSort )
    {
        if( target.__internal_return__ )
           return elems;

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
            var ret=Sizzle.uniqueSort( target.toArray() );
            if( ret.length !== target.length ){
               return doMake(target,ret,true,true,false);
            }
        }
        return target;
    }

    ,doGrep=function( elements, strainer, invert )
    {
        if( !Utils.isFunction(strainer) )
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
        if ( Utils.isFunction( strainer ) )
        {
            return doGrep( elements, function( elem, i ){
                return !!strainer.call( elem, i, elem ) !== exclude;
            });
        }

        if ( Utils.isHTMLElement( strainer ) )
        {
            return doGrep( elements, function( elem ) {
                return ( elem === strainer ) !== exclude;
            });
        }

        if ( typeof strainer === "string" )
        {
            if ( isSimple.test( strainer ) ) {
                return doFind( elements,strainer, exclude );
            }
            strainer = doFind( elements,strainer );
        }

        return doGrep( elements, function( elem ) {
            return ( Utils.inObject( strainer, elem ) >= 0 ) !== exclude;
        });
    }

    ,doFind = function( elements, selector, exclude )
    {
        var elem = elements[ 0 ];
        if ( exclude ) selector = ":not(" + selector + ")";
        return elements.length === 1 && elem.nodeType === 1 ? ( Sizzle.matchesSelector( elem, selector ) ? [ elem ] : [] ) :
            Sizzle.matches( selector, doGrep( elements, function( elem ) { return elem.nodeType === 1; }));
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
            ret=[],hasStrainer=Utils.isFunction( strainer);
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
        if( ret.length > 1 && !notSort )ret=Sizzle.uniqueSort( ret );
        return ret;
    }

    ,dispatchEventAll=function(target,element,event)
    {
        if( target instanceof EventDispatcher && target.hasEventListener( event.type ) && !target.dispatchEvent( event ) )
          return false;
        return true;
    }
   ,dispatchElementEvent=function( target, parent, child , type )
    {
        var event=new ElementEvent( type )
        event.parent=parent;
        event.child=child
        event.dispatcher=target;
        return dispatchEventAll(target, parent , event );
    }
    ,dispatchPropertyEvent=function(target,newValue,oldValue,property,element,type)
    {
        type = type || PropertyEvent.PROPERTY_CHANGE;
        var event=new PropertyEvent( type )
        event.newValue=newValue;
        event.oldValue=oldValue;
        event.property=property;
        event.target=element;
        event.dispatcher=target;
        return dispatchEventAll(target,element,event);
    }

    ,getChildNodes=function(element,selector,flag)
    {
        var ret=[]
            ,isfn=Utils.isFunction(selector);
        if( element.hasChildNodes() )
        {
            var len=element.childNodes.length,index= 0,node;
            while( index < len )
            {
                node=element.childNodes.item(index);
                if( ( isfn && selector.call(this,node,index) ) || selector==='*' || node.nodeType===1  )
                     ret.push( node )
                if( flag===true && ret.length >0 )break;
                ++index;
            }
        }
        return ret;
    }
    ,outerHtml=function( element )
    {
        var html='';
        if( typeof element.outerHTML==='string' )
        {
            html=element.outerHTML;
        }else
        {
            var cloneElem=Utils.clone( element,true),div
            if( cloneElem )
            {
                div=document.createElement( 'div' )
                div.appendChild( cloneElem );
                html=div.innerHTML;
            }
        }
        return html;
    }

    /**
     * @private
     */
    var __rootEvent__;

    /**
     * 全局事件调度器
     * @returns {EventDispatcher}
     */
    Breeze.rootEvent=function()
    {
        if( !__rootEvent__ )
            __rootEvent__=new EventDispatcher( document );
        return __rootEvent__;
    }

    /**
     * 文档准备就绪时回调
     * @param callback
     * @return {EventDispatcher}
     */
    Breeze.ready=function( callback )
    {
        return Breeze.rootEvent().addEventListener( BreezeEvent.READY , callback );
    }


    //======================================================================================
    //  Extends module class
    //======================================================================================

    /**
     * Extends EventDispatcher Class
     * @type {EventDispatcher}
     */
    Breeze.prototype=new Manager();

    //============================================================
    //  Defined Instance Propertys
    //============================================================

    //Breeze 构造方法
    Breeze.prototype.constructor=Breeze;

    //每个Breeze对象的DOM元素的作用域
    Breeze.prototype.context=null;

    //使用的选择器
    Breeze.prototype.selector=null;

    //============================================================
    //  Defined Public Method
    //============================================================

    /**
     * 返回此对象名称
     * @returns {string}
     */
    Breeze.prototype.toString=function()
    {
        return 'breeze_'+this.__COUNTER__;
    }

    /**
     * 判断指定的选择器是否在于当前匹配的项中。
     * @param selector
     * @returns {*}
     */
    Breeze.prototype.has=function( selector )
    {
        if( this.length===1 )
            return Sizzle.matchesSelector( this[0], selector );
        return Utils.isFunction(selector) ? !!doFilter(this.toArray(),selector,false).length : !!Sizzle.matches( selector,this.toArray()).length;
    }

    /**
     * 回撒到指定步骤的选择器所匹配的元素,不包含初始化的步骤。
     * @param step
     * @returns {Breeze}
     */
    Breeze.prototype.revert=function( step )
    {
        var len= this['__reverts__'] ? this['__reverts__'].length : 0;
        step = step === undefined ? (this['__revert_step__'] || len)-1 : ( step=parseInt( step ) ) < 0 ? step+len : step ;
        step=Math.min(Math.max(step,0),len-1);
        if( len > 0 && this['__reverts__'][ step ] )
        {
            this['__revert_step__']=step;
            doMake( this, this['__reverts__'][ step ],true , true );
        }
        return this;
    }

    //==================================================
    // 筛选匹配元素
    //==================================================

    /**
     * 在此上下文中添加选择器所匹配的元素
     * @param selector
     */
    Breeze.prototype.add=function( selector )
    {
        var ret=selector instanceof Breeze ? selector.toArray() : Sizzle( selector );
        if( ret.length > 0 )doMake( this, ret , false );
        return this;
    }

    /**
     * 筛选指定开始和结束索引值的元素。
     * @returns {Breeze}
     */
    Breeze.prototype.range=function(startIndex,endIndex)
    {
        return doMake( this, this.slice(startIndex,endIndex),true);
    }

    /**
     * 筛选元素等于指定的索引
     * @param index
     * @returns {Breeze}
     */
    Breeze.prototype.eq=function( index )
    {
        return doMake( this,[ this[index] ],true);
    }

    /**
     * 筛选大于索引的元素
     * @param index
     * @returns {Breeze}
     */
    Breeze.prototype.gt=function( index )
    {
        return doMake( this, doGrep(this,function(elem,i){
            return i > index;
        }),true);
    }

    /**
     * 筛选小于索引的元素
     * @param index
     * @returns {Breeze}
     */
    Breeze.prototype.lt=function( index )
    {
        return doMake( this, doGrep(this,function(elem,i){
            return i < index;
        }),true);
    }

    /**
     * 筛选元素不等于指定筛选器的元素
     * @param index
     * @returns {Breeze}
     */
    Breeze.prototype.not=function( selector )
    {
        if( Utils.isNumber(selector) )
            selector=this.get( selector );
        else if( Utils.isString( selector ) )
        {
            return doMake(this, doFind(this,selector,true) ,true);
        }
        return doMake( this,doGrep(this,function(elem){ return selector !==elem; }) ,true );
    }

    /**
     * 从元素集中来检索符合回调函数的元素
     * @param elems
     * @param callback
     * @param invert
     * @returns {Breeze}
     */
    Breeze.prototype.grep=function( strainer, invert )
    {
        return doMake( this,doGrep(this,strainer,invert),true);
    }

    /**
     * 查找当前匹配的第一个元素下的指定选择器的元素
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.find=function( selector )
    {
        return doMake( this, Sizzle(selector ) , true );
    }

    /**
     * 返回符合过滤器条件的元素集
     * @param strainer
     * @returns {Breeze}
     */
    Breeze.prototype.filter=function(strainer)
    {
        return doMake( this, doFilter(this,strainer,false) ,true );
    }

    /**
     * 查找所有匹配元素的父级元素或者指定selector的父级元素（不包括祖辈元素）
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.parent=function(selector)
    {
        var ret=doRecursion.call(this,'parentNode',false);
        return doMake(this , Utils.isDefined(selector) ? doFind(ret,selector) : ret ,true );
    }

    /**
     * 查找所有匹配元素的祖辈元素或者指定selector的祖辈元素。
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.parents=function( selector )
    {
        var is = Utils.isFunction(selector);
        var ret=doRecursion.call(this,'parentNode',true, selector===undefined ? null : function(element,ret)
        {
            if(  ( is && ( element=selector.call(this,element) ) ) ||
                 ( element.nodeType===1 && Sizzle.matchesSelector( element, selector ) ) )
            {
                ret.push(element);
                return false;
            }
            return true;
        });
        return doMake(this , ret ,true );
    }

    /**
     * 获取所有匹配元素向上的所有同辈元素,或者指定selector的同辈元素
     * @param name
     * @returns {Breeze}
     */
    Breeze.prototype.prevAll=function( selector )
    {
        var ret=doRecursion.call(this,'previousSibling',true);
        return doMake(this , Utils.isDefined(selector) ? doFind(ret,selector) : ret ,true );
    }

    /**
     * 获取所有匹配元素紧邻的上一个同辈元素,或者指定selector的同辈元素
     * @param name
     * @returns {Breeze}
     */
    Breeze.prototype.prev=function(selector)
    {
        var ret=doRecursion.call(this,'previousSibling',false);
        return doMake(this , Utils.isDefined(selector) ? doFind(ret,selector) : ret ,true );
    }

    /**
     * 获取所有匹配元素向下的所有同辈元素或者指定selector的同辈元素
     * @param name
     * @returns {Breeze}
     */
    Breeze.prototype.nextAll=function( selector )
    {
        var ret=doRecursion.call(this,'nextSibling',true);
        return doMake(this , Utils.isDefined(selector) ? doFind(ret,selector) : ret ,true );
    }

    /**
     * 获取每一个匹配元素紧邻的下一个同辈元素或者指定selector的同辈元素
     * @param name
     * @returns {Breeze}
     */
    Breeze.prototype.next=function(selector)
    {
        var ret=doRecursion.call(this,'nextSibling',false);
        return doMake(this , Utils.isDefined(selector) ? doFind(ret,selector) : ret ,true );
    }

    /**
     * 获取每一个匹配元素的所有同辈元素
     * @param name
     * @returns {Breeze}
     */
    Breeze.prototype.siblings=function(selector)
    {
        var ret=[].concat( doRecursion.call(this,'previousSibling',true,null,true) , doRecursion.call(this,'nextSibling',true,null,true) )
        ret=Sizzle.uniqueSort( ret );
        if( Utils.isDefined(selector) )ret= doFind(ret,selector);
        return doMake( this ,ret, true);
    }

    /**
     * 查找所有匹配元素的所有子级元素，不包括孙元素
     * @param selector 如果是 * 返回包括文本节点的所有元素。不指定返回所有HTMLElement 元素。
     * @returns {Breeze}
     */
    Breeze.prototype.children=function( selector )
    {
        Utils.isString( selector ) && ( selector=Utils.trim(selector) );
        var ret=[];
        this.forEach(function(element)
        {
           if( !Utils.isFrame( element ) )
             ret=ret.concat( selector==='*' ?  Sizzle( '*' ,element) : DataArray.prototype.slice.call( element.childNodes,0 ) );
        })
        var has=Utils.isString(selector) && selector!=='*';
        if( this.length > 1 && !has )
            ret= Sizzle.uniqueSort(ret);
        return doMake(this , has ? doFind(ret,selector) : ret ,true );
    }

    //=================================================
    // DOM Element 操作,这是一些破坏性的操作
    //=================================================

    // 外部操作
    /**
     * 为当前所匹配每个项的位置添加元素
     * @param element 要添加的元素
     * @param index 是否添加到元素的前面
     * @returns {Breeze}
     */
    Breeze.prototype.addElementAt=function( element,index )
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
     * @returns {Breeze}
     */
    Breeze.prototype.removeElement=function( index )
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
     * @returns {Breeze}
     */
    Breeze.prototype.removeChild=function( childElemnet )
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
     * @returns {Breeze}
     */
    Breeze.prototype.removeChildAt=function( index )
    {
        var is=false;
        if(  index !== undefined && index.parentNode ){
            this.current( index.parentNode )
            is=true;
        }else if( !Utils.isNumber( index ) )
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
            dispatchElementEvent(target,parent,child,ElementEvent.BEFORE_REMOVE ) )
        {
            var result=parent.removeChild( child );
            dispatchElementEvent(target,parent,child,ElementEvent.REMOVED );
            return !!result;
        }
        return false;
    }

    /**
     * 添加子级元素（所有已匹配的元素）
     * @param childElemnet
     * @returns {Breeze}
     */
    Breeze.prototype.addChild=function( childElemnet )
    {
        return this.addChildAt(childElemnet,-1);
    }

    /**
     * 在指定位置加子级元素（所有已匹配的元素）。
     * 如果 childElemnet 是一个已存在的元素，那么会先删除后再添加到当前匹配的元素中后返回，后续匹配的元素不会再添加此元素。
     * @param childElemnet 要添加的子级元素
     * @param index | refChild | fn(node,index,parent)  要添加到的索引位置
     * @returns {Breeze}
     */
    Breeze.prototype.addChildAt=function(childElemnet,index)
    {
        if( childElemnet instanceof Breeze )
        {
            var target =[].concat( childElemnet.__rootElement__ )
            return Utils.forEach(target,function(child){
               this.addChildAt(child,index)
            },this)
        }

        if( index===undefined )
            throw new Error('Invalid param the index. in addChildAt');

        var isElement= childElemnet && childElemnet.nodeType && typeof childElemnet.nodeName === 'string';
        return this.forEach(function(parent)
        {
            if( !parent || parent.nodeType!=1 || typeof parent.nodeName !== "string" )
            {
                throw new Error('not is a container type in addChildAt');
            }

            try{
                var child=isElement ? childElemnet : Utils.createElement( childElemnet );
            }catch(e){
                throw new Error('not is a HTMLElement type the childElemnet in addChildAt');
            }

            if( dispatchElementEvent(this,parent,child,ElementEvent.BEFORE_ADD ) )
            {
                if( child.parentNode )
                {
                   this.removeChildAt( child );
                }

                var refChild=index && index.parentNode && index.parentNode===parent ? index : null;
                    !refChild && ( refChild=this.getChildAt( typeof index==='number' ? index : index ) );
                    refChild && (refChild=index.nextSibling);

                parent.insertBefore( child , refChild || null );
                dispatchElementEvent(this,parent,child,ElementEvent.ADDED );

                if( isElement )
                {
                    //为子级元素触发添加元素
                    this.current( child );
                    dispatchElementEvent(this,parent,child,ElementEvent.ADDED );
                }
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
    Breeze.prototype.getChildIndex=function( childElemnet )
    {
        if( typeof childElemnet==='string' )
        {
            childElemnet=Sizzle.matches( childElemnet, this.toArray() )[0];
            if( !childElemnet )return -1;
            this.current( childElemnet.parentNode );
        }
        return this.forEach(function(parent)
        {
            if( childElemnet.parentNode===parent )
            {
                var index=-1;
                getChildNodes(parent,function(node){
                      if( node.nodeType === 1 )index++;
                      return node===childElemnet;
                },true)
                return index;
            }
            return -1;
        });
    }

    /**
     * 用指定的元素来包裹当前所有匹配到的元素
     * @param element
     * @returns {Breeze}
     */
    Breeze.prototype.wrap=function( element )
    {
       var is=Utils.isFunction( element );
       return this.forEach(function(elem,index)
       {
            var wrap=Utils.createElement( is ? element.call(this,elem,index) : element );
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
        var is= selector === undefined;
        return this.forEach(function(elem)
        {
            this.__internal_return__=true;
            var parent= is ?  elem.parentNode : this.parents( selector )[0];

            if( parent && parent.ownerDocument && Sizzle.contains( parent.ownerDocument.body, parent ) )
            {
               var children=this.current( parent ).children('*');
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
            this.__internal_return__=false;
        });
    }

    /**
     * 获取或者设置 html
     * @param html
     * @returns {string | Breeze}
     */
    Breeze.prototype.html=function( html , outer )
    {
        outer = !!outer;
        var write= html !== undefined;
        if( !write && this.length < 1 ) return '';

        return this.forEach(function(elem)
        {
            if( !write || Utils.isBoolean(html) )
            {
                html = html===true ? outerHtml(elem) : elem.innerHTML;
                return html;
            }

            if( elem.hasChildNodes() )
            {
                var nodes=elem.childNodes;
                var len=nodes.length,b=0;
                for( ; b < len ; b++ ) if( nodes[b] && nodes[b].nodeType===1 )
                {
                   if( !removeChild( this, elem, nodes[b] ) )
                     return this;
                }
            }
            elem.innerHTML='';
            if( outer && elem.parentNode && elem.parentNode.ownerDocument && Utils.isContains(elem.parentNode.ownerDocument.body, elem.parentNode) )
            {
                this.current( elem.parentNode );
            }
            this.addChild( html );

        });
    }

    //访问和操作属性值
    function access(name,newValue,callback,eventProp,eventType,defaultValue)
    {
        var write= newValue !== undefined;
        if( !write && this.length < 1 )return typeof defaultValue !== "undefined" ?  defaultValue : '';
        return this.forEach(function(elem)
        {
            var oldValue= callback.get.call(elem,name);
            if( !write ) return oldValue;
            if( oldValue !== newValue )
            {
                callback.set.call(elem,name,newValue);
                eventProp && dispatchPropertyEvent(this,newValue,oldValue,eventProp,elem,eventType);
            }
        });
    }

    /**
     * 获取或者设置文本内容
     * @param text
     * @returns {}
     */
    Breeze.prototype.text=function( value )
    {
       return access.call(this,'text',value,{
           get:function(prop){
                return Sizzle.getText(this) || '';
           },
           set:function(prop,newValue){
               typeof this.textContent === "string" ? this.textContent=newValue : this.innerText=newValue;
           }
        },'text');
    }

    /**
     * 设置所有匹配元素的样式
     * @param name
     * @param value
     * @returns {Breeze}
     */
    Breeze.prototype.style=function( name,value )
    {
        if( typeof name === 'string' &&  /^(\s*[\w\-]+\s*\:[\w\-\s]+;)+$/.test(name)  )
        {
            value=name;
            name='cssText';
        }
        else if( Utils.isObject(name) )
        {
            value=name;
            name='cssText';
        }

        return access.call(this,name,value,{
            get:function(prop){
                return Utils.style(this,prop) || '';
            },
            set:function(prop,newValue){
                Utils.style(this,prop,newValue);
            }
        },name,PropertyEvent.PROPERTY_STYLE_CHANGE);
    }

    /**
     * 为当前每个元素设置数据缓存
     * @param name
     * @param value
     * @returns {Breeze}
     */
    Breeze.prototype.data=function(name,value)
    {
        return access.call(this,name,value,{
            get:function(prop){
                return Utils.storage(this,prop);
            },
            set:function(prop,newValue){
                Utils.storage(this,prop,newValue);
            }
        });
    }

    var __property__={
        'className':true,
        'innerHTML':true,
        'value'    :true
    }

    /**
     * 为每一个元素设置属性值
     * @param name
     * @param value
     * @returns {Breeze}
     */
    Breeze.prototype.property=function(name,value )
    {
        name = Utils.attrMap( name );
        var lower=name.toLowerCase();
        if( lower==='innerhtml' )
          return this.html(value);
        else if( lower === 'style' )
          throw new Error('the style property names only use style method to operate in property');

        return access.call(this,name,value,{
            get:function(prop){
                if( typeof this.getAttribute !== "function" )
                    return null;
                return ( __property__[ prop ] ? this[ prop ] : this.getAttribute( prop ) ) || null;
            },
            set:function(prop,newValue){
                if( typeof this.getAttribute !== "function" )
                    return;
                if( newValue === null )
                {
                    __property__[ prop ] ? delete this[ prop ] : this.removeAttribute( prop );
                    return;
                }
                __property__[ prop ] ? this[ prop ]=newValue : this.setAttribute( prop,newValue );
            }
        },name);
    }

    /**
     * 判断是否有指定的类名
     * @param className
     * @returns {boolean}
     */
    Breeze.prototype.hasClass=function( className )
    {
        var value=this.property('class')
        return value === '' ? false : typeof className==='string' ?
               new RegExp('(\\s|^)' + className + '(\\s|$)').test( value ) : true ;
    }

    /**
     * 添加指定的类名
     * @param className
     * @returns {Breeze}
     */
    Breeze.prototype.addClass=function( className )
    {
        if( typeof className==='string' && !this.hasClass(className) )
        {
            var oldClass=this.property('class');
            this.property('class',Utils.trim(oldClass+" " + className))
        }
        return this;
    }

    /**
     * 移除指定的类名或者清除所有的类名。
     * @param className
     * @returns {Breeze}
     */
    Breeze.prototype.removeClass=function(className)
    {
        if( className !==undefined && typeof className === 'string' )
        {
            var value=this.property('class') || '';
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            var newVal=value.replace(reg, '');
            if( value!==newVal )this.property('class',newVal );
        }else
        {
            this.property('class', null );
        }
        return this;
    }

    var __size__=function(prop,value)
    {
        var border = typeof value==='boolean' ? value : ( value===undefined || value==='border' );
        value = (value===undefined || value==='border' || typeof value==='boolean') ? undefined : parseFloat( value );
        return access.call(this,prop, value,{
            get:function(prop){
                return Utils.getSize(this, prop, border );
            },
            set:function(prop,newValue){
                Utils.style(this,prop,newValue);
            }
        }, prop.toLowerCase(), undefined , 0 );
    }

    var __scroll__=function(prop,value)
    {
        return access.call(this,prop, value,{
            get:function(prop){
                return Utils.scroll(this,'scroll'+prop);
            },
            set:function(prop,newValue){
                Utils.scroll(this,'scroll'+prop,newValue);
            }
        },'scroll'+prop, undefined , 0 );
    }

    /**
     * @private
     */
    var __position__=function(prop,value)
    {
        return access.call(this,prop, value,{
            get:function(prop){
                return Utils.style(this,prop);
            },
            set:function(prop,newValue){
                if( Utils.style(this,'position')==='static' )
                    Utils.style(this,'position','relative')
                Utils.style(this,prop,newValue);
            }
        },prop , undefined , 0 );
    }

    /**
     * 设置所有匹配元素的宽度
     * @param val
     * @returns {Breeze}
     */
    Breeze.prototype.width=function( value )
    {
        return __size__.call(this,'width',value);
    }

    /**
     * 获取匹配第一个元素的高度
     * @param border 是否包括边框的宽度
     * @returns {Number}
     */
    Breeze.prototype.height=function( value )
    {
        return __size__.call(this,'height',value);
    }

    /**
     * 设置元素滚动条左边的位置
     * @returns {Breeze}
     */
    Breeze.prototype.scrollLeft=function(val)
    {
        return __scroll__.call(this,'Left',val)
    }

    /**
     * 获取元素滚动条顶边的位置
     * @returns {number}
     */
    Breeze.prototype.scrollTop=function(val)
    {
        return __scroll__.call(this,'Top',val)
    }

    /**
     * 获取或者设置相对于父元素的左边位置
     * @param val 如果是布尔类型则会返回坐标位置。 true 相对于本地, false 相对于全局的坐标位置，默认为 false。
     * @returns {number|Breeze}
     */
    Breeze.prototype.left=function( val )
    {
        return __position__.call(this,'left',val)
    }

    /**
     * 获取或者设置相对于父元素的顶边位置
     * @param val 如果是布尔类型则会返回坐标位置。 true 相对于本地, false 相对于全局的坐标位置，默认为 false。
     * @returns {number|Breeze}
     */
    Breeze.prototype.top=function( val )
    {
        return __position__.call(this,'top',val)
    }

    /**
     * 获取或者设置相对于父元素的右边位置
     * @param val 如果是布尔类型则会返回坐标位置。 true 相对于本地, false 相对于全局的坐标位置，默认为 false。
     * @returns {number|Breeze}
     */
    Breeze.prototype.right=function( val )
    {
        return __position__.call(this,'right',val)
    }

    /**
     * 获取或者设置相对于父元素的底端位置
     * @param val 如果是布尔类型则会返回坐标位置。 true 相对于本地, false 相对于全局的坐标位置，默认为 false。
     * @returns {number|Breeze}
     */
    Breeze.prototype.bottom=function( val )
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
            var offset=Utils.position( target.parentNode );
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
    Breeze.prototype.localToGlobal=function( left,top  )
    {
       return __point__.call(this,left,top,true);
    }

    /**
     *  将视图的全局点转成相对本地坐标点
     *  @param left
     *  @param top
     *  @returns {object}  left top
     */
    Breeze.prototype.globalToLocal=function( left,top )
    {
        return __point__.call(this,left,top,false);
    }

    /**
     * 设置获取元素相对舞台坐标位置
     * @param x
     * @param y
     * @returns {*}
     */
    Breeze.prototype.position=function(x,y)
    {
        var result = Utils.position( this.current(), x,y );
        if( result===true )return this;
        return result;
    }

    /**
     * 设置当前元素的显示或者隐藏
     * @param flag false 为隐藏
     * @returns {Breeze}
     */
    Breeze.prototype.display=function( flag )
    {
        if( typeof flag === "undefined" )
            return this.style('display') != 'none';
        return this.style('display',flag===false ? 'none' : 'block' );
    }

    /**
     * 执行一个动画
     * @param options
     * @param callback
     * @returns {*}
     */
    Breeze.prototype.animation=function( options ,callback )
    {
        var tl=  new Timeline().bind( this.toArray() )
        options=[].concat( options );
        for( var i in options )
        {
            var d = options[i].duration;
            delete options[i].duration
            tl.addFrame( options[i] , d );
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
     * @returns {Breeze}
     */
    Breeze.prototype.fadeIn=function(duration,callback)
    {
        this.style('opacity',0);
        this.animation({'opacity':1,'duration':duration},callback);
        return this;
    }

    /**
     * 将一个元素淡出
     * @param duration
     * @param callback
     * @returns {Breeze}
     */
    Breeze.prototype.fadeOut=function(duration,callback)
    {
        this.style('opacity',1);
        this.animation({'opacity':0,'duration':duration},callback);
        return this;
    }

    /**
     * 获取当前元素的内容值
     * @returns {*}
     */
    Breeze.prototype.content=function()
    {
        if( Utils.isFormElement( this.current() ) )
        {
            return this.property('value');
        }
        return this.text();
    }

    window.Breeze=Breeze;

})( window )
