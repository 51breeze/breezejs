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
        {
            selector=selector.toArray();
        }

        if( !(this instanceof Breeze) )
            return new Breeze( selector,context );

        this.length=0;
        if( !Utils.isDefined(selector) && !Utils.isDefined(context) )
            return this;

        var result=selector;
        this.context = this.getContext( context );
        this.selector = selector;
        if( Utils.isString( selector ) )
        {
            selector=Utils.trim(selector);
            if( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 )
            {
                selector =  Utils.createElement(selector);

            }else if( selector==='body' || selector==='window' || selector==='document' )
            {
                var win = Utils.getWindow( this.context ) || window;
                result= [  win[ selector ] || win.document[selector] || win ];
            }else
            {
                result= Sizzle( selector, this.context );
            }
        }

        if( Utils.isWindow(selector) || Utils.isDocument( selector ) )
        {
            result=[selector];

        }else if( Utils.isNodeElement(selector) )
        {
            result=[selector];

            //新创建的元素直接添加到文档中
            if( !selector.parentNode )
                this.addChild(result[0]);
        }

        //初始化元素管理器
        Manager.call(this, result );

        //设置当前对象中的根元素
        this.__rootElement__= this[0];

        //统计实例对象数
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
        target.current(null);
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
        //自定义过滤器
        if ( Utils.isFunction( strainer ) )
        {
            return doGrep( elements, function( elem, i ){
                return !!strainer.call( elem, i) !== exclude;
            });
        }

        //是否为指定的元素
        if ( Utils.isHTMLElement( strainer ) )
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
            return ( Utils.inObject( strainer, elem ) >= 0 ) !== exclude;
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
            ret=elements.length === 1 && Sizzle.matchesSelector( elements[ 0 ], selector ) ? [ elements[ 0 ] ] : Sizzle.matches( selector, elements );
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
    };


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
            __rootEvent__=new EventDispatcher( window );
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
     * 判断指定的选择器是否在当前匹配的项中。
     * @param selector
     * @returns {*}
     */
    Breeze.prototype.has=function( selector )
    {
        if( typeof selector === "undefined" )
            throw  new Error('invalid selector');
        var is = Utils.isFunction(selector);
        var result=false;
        this.forEach(function(elem)
        {
            var ret = is ? !!selector.call( elem ) : Sizzle.matchesSelector( elem , selector );
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
    Breeze.prototype.contains=function( selector )
    {
        return Sizzle( selector, this.getContext() ).length > 0;
    }

    /**
     * 回撒到指定步骤的选择器所匹配的元素,不包含初始化的步骤。
     * @param step
     * @returns {Breeze}
     */
    Breeze.prototype.revert=function( step )
    {
        var len= this['__reverts__'] ? this['__reverts__'].length : 0;
        step = typeof step !== "number" ? (this['__step__'] || len)-1 : step < 0 ? step+len : step ;
        step=  step > len ? 0 : step
        Math.min( Math.max(step,0), len-1 );
        if( len > 0 && this['__reverts__'][ step ] )
        {
            this['__step__']=step;
            doMake( this, this['__reverts__'][ step ],true , true );
        }
        return this;
    }

    //==================================================
    // 筛选匹配元素
    //==================================================

    /**
     * 筛选指定开始和结束索引值的元素。
     * @returns {Breeze}
     */
    Breeze.prototype.range=function(startIndex,endIndex)
    {
        return doMake( this, this.slice(startIndex,endIndex),true );
    }

    /**
     * 筛选元素等于指定的索引
     * @param index
     * @returns {Breeze}
     */
    Breeze.prototype.eq=function( index )
    {
        if( typeof index !== "number" || typeof this[index] === "undefined")
           throw new Error('invalid index');
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
    Breeze.prototype.not=function( selector , returned )
    {
        if( !Utils.isDefined(selector) )
            throw new Error('invalid selector')

        var results=this.toArray();
        if( Utils.isNumber(selector) )
        {
            selector=[ this[ selector ] ];
        }

        if( Utils.isSelector( selector ) )
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
     * @returns {Breeze}
     */
    Breeze.prototype.grep=function( strainer, invert , returned )
    {
        var results = doGrep(this,strainer,invert);
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 查找当前匹配的第一个元素下的指定选择器的元素
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.find=function( selector , returned )
    {
        if( !Utils.isString(selector) )
         throw new Error('invalid selector')
        var results = Sizzle( selector , this.getContext() );
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 返回符合过滤器条件的元素集
     * @param strainer
     * @returns {Breeze}
     */
    Breeze.prototype.filter=function(strainer, returned )
    {
        var results = doFilter(this,strainer,false);
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 查找所有匹配元素的父级元素或者指定selector的父级元素（不包括祖辈元素）
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.parent=function(selector, returned )
    {
        var results=doRecursion.call(this,'parentNode',false);
        results=Utils.isString(selector) ? doFind(results,selector) : results;
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 查找所有匹配元素的祖辈元素或者指定selector的祖辈元素。
     * @param selector
     * @returns {Breeze}
     */
    Breeze.prototype.parents=function( selector , returned )
    {
        var is = Utils.isFunction(selector);
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
     * @returns {Breeze}
     */
    Breeze.prototype.prevAll=function( selector, returned )
    {
        var results=doRecursion.call(this,'previousSibling',true);
        results=Utils.isString(selector) ? doFind(results,selector) : results
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 获取所有匹配元素紧邻的上一个同辈元素,或者指定selector的同辈元素
     * @param name
     * @returns {Breeze}
     */
    Breeze.prototype.prev=function(selector,returned)
    {
        var results=doRecursion.call(this,'previousSibling',false);
        results=Utils.isString(selector) ? doFind(results,selector) : results;
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 获取所有匹配元素向下的所有同辈元素或者指定selector的同辈元素
     * @param name
     * @returns {Breeze}
     */
    Breeze.prototype.nextAll=function( selector ,returned )
    {
        var results=doRecursion.call(this,'nextSibling',true);
        results=Utils.isString(selector) ? doFind(results,selector) : results;
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 获取每一个匹配元素紧邻的下一个同辈元素或者指定selector的同辈元素
     * @param name
     * @returns {Breeze}
     */
    Breeze.prototype.next=function(selector, returned )
    {
        var results=doRecursion.call(this,'nextSibling',false);
        results=Utils.isString(selector) ? doFind(results,selector) : results
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 获取每一个匹配元素的所有同辈元素
     * @param name
     * @returns {Breeze}
     */
    Breeze.prototype.siblings=function(selector,returned)
    {
        var results=[].concat( doRecursion.call(this,'previousSibling',true,null,true) , doRecursion.call(this,'nextSibling',true,null,true) )
        results=Sizzle.uniqueSort( results );
        if( Utils.isString(selector) )results= doFind(results,selector);
        return returned ? results : doMake( this, results ,true );
    }

    /**
     * 查找所有匹配元素的所有子级元素，不包括孙元素
     * @param selector 如果是 * 返回包括文本节点的所有元素。不指定返回所有HTMLElement 元素。
     * @returns {Breeze}
     */
    Breeze.prototype.children=function( selector , returned )
    {
        var has=true;
        if( Utils.isString( selector ) )
        {
            selector=Utils.trim(selector);
            has = selector !== '*';
        };

        var results=[];
        this.forEach(function(element)
        {
           if( !Utils.isFrame( element ) )
               results=results.concat( selector==='*' ?  Sizzle( '*' ,element) : DataArray.prototype.slice.call( element.childNodes,0 ) );
        })
        if( this.length > 1 && !has )results= Sizzle.uniqueSort(results);
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
            var context = this.getContext();
            this.current( context === document ? document.body : context );
        }

        return this.forEach(function(parent)
        {
            if( !Utils.isHTMLElement( parent ) )
            {
                throw new Error('invalid parent HTMLElement.');
            }

            try{
                var child=isElement ? childElemnet : Utils.createElement( childElemnet );
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
     * 返回指定的元素在当前匹配项中的位置
     * @param childElemnet | selector
     * @returns {Number}
     */
    Breeze.prototype.getElementIndex=function( elemnet )
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
     * @returns {string | Breeze}
     */
    Breeze.prototype.html=function( html , outer )
    {
        outer = !!outer;
        var write= typeof html !== "undefined";
        if( !write && this.length < 1 ) return '';

        return this.forEach(function(elem)
        {
            if( !write || Utils.isBoolean(html) )
            {
                html = html===true ? Utils.getHtml(elem,true) : elem.innerHTML;
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

            elem.innerHTML='';
            if( Utils.isString(html) )
            {
                html = Utils.trim( html );
                if( html === '' )
                  return;
            }
            if( outer && elem.parentNode && elem.parentNode.ownerDocument && Utils.contains(elem.parentNode.ownerDocument.body, elem.parentNode) )
            {
                this.current( elem.parentNode );
            }

            if( typeof html === "string" ) {
                this.current().innerHTML = html;
            }else {
                this.addChild(html);
            }

        });
    }

    //访问和操作属性值
    function access(name,newValue,callback,dispatchEvent)
    {
        var write= newValue !== undefined;
        if( !write && this.length < 1 )return null;
        return this.forEach(function(elem)
        {
            var oldValue= callback.get.call(elem,name,this);
            if( !write ) return oldValue;
            if( oldValue !== newValue )
            {
                callback.set.call(elem,name,newValue);
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
        }, StyleEvent.CHANGE ) || '';
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
        return access.call(this,name,value,{
            get:function(prop){
                return Utils.property(this,prop);
            },
            set:function(prop,newValue){
                if( lower === 'style' )
                    throw new Error('the style property names only use style method to operate in property');
                Utils.property(this,prop,newValue);
            }
        },PropertyEvent.CHANGE);
    }

    /**
     * 判断当前匹配元素是否有指定的属性名
     * @param prop
     * @returns {boolean}
     */
    Breeze.prototype.hasProperty=function(prop)
    {
        return Utils.hasAttribute(this.current(),prop);
    }

    /**
     * 获取匹配第一个元素的节点名称
     * @returns {string}
     * @public
     */
    Breeze.prototype.nodeName=function()
    {
        return Utils.nodeName( this.current() );
    }

    /**
     * 获取设置当前元素的内容值。如果元素是表单元素则写读value否则为text属性。
     * @returns {string|Breeze}
     */
    Breeze.prototype.content=function( value )
    {
        return access.call(this,'content',value,{
            get:function(prop){
                return ( Utils.isFormElement( this ) ? this.value : Sizzle.getText(this) ) || '';
            },
            set:function(prop,newValue)
            {
                if( Utils.isFormElement( this ) )
                {
                    this.value=newValue;
                }else
                {
                    typeof this.textContent === "string" ? this.textContent=newValue : this.innerText=newValue;
                }
            }
        },PropertyEvent.CHANGE) || '';
    }

    /**
     * 获取设置当前元素的内容值。如果元素是表单元素则写读value否则为text属性。
     * @returns {string|Breeze}
     */
    Breeze.prototype.text=function( value )
    {
        return access.call(this,'text',value,{
            get:function(){
                return Sizzle.getText(this)  || '';
            },
            set:function(prop,newValue)
            {
                typeof this.textContent === "string" ? this.textContent=newValue : this.innerText=newValue;
            }
        },PropertyEvent.CHANGE) || '';
    }

    /**
     * 获取设置表单元素的值。此方法只会对表单元素有用。
     * @returns {string|Breeze}
     */
    Breeze.prototype.value=function( value )
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
    Breeze.prototype.hasClass=function( className )
    {
        var value=this.property('class');
        return value === '' || !value ? false : typeof className==='string' ? new RegExp('(\\s|^)' + className + '(\\s|$)').test( value ) : true ;
    }

    /**
     * 添加指定的类名
     * @param className
     * @returns {Breeze}
     */
    Breeze.prototype.addClass=function( className )
    {
        this.forEach(function(elem){
            Utils.addClass(elem,className);
        });
        return this;
    }

    /**
     * 移除指定的类名或者清除所有的类名。
     * @param className
     * @returns {Breeze}
     */
    Breeze.prototype.removeClass=function(className)
    {
        this.forEach(function(elem){
            Utils.removeClass(elem,className);
        })
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
            set:function(prop,newValue,oldValue,target){
                Utils.style(this,prop,newValue);
            }
        },PropertyEvent.CHANGE) || 0;
    }

    var __scroll__=function(prop,value)
    {
        return access.call(this,prop, value,{
            get:function(prop){
                return Utils.scroll(this,'scroll'+prop);
            },
            set:function(prop,newValue,oldValue,target){
                Utils.scroll(this,'scroll'+prop,newValue);
                dispatchEventAll(target, new BreezeEvent(BreezeEvent.SCROLL) );
            }
        }) || 0;
    }

    /**
     * @private
     */
    var __position__=function(prop,value)
    {
        return access.call(this,prop, value,{
            get:function(prop){
                return Utils.position(this)[ prop ]
            },
            set:function(prop,newValue){
                if( Utils.style(this,'position')==='static' )
                    Utils.style(this,'position','relative')
                return prop==='left' ? Utils.position(this, prop ) : Utils.position(this, null, prop );
            }
        },PropertyEvent.CHANGE) || 0;
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
     * 设置元素相对舞台的位置
     * @param left
     * @param top
     * @returns {*}
     */
    Breeze.prototype.position=function(left,top)
    {
        left = parseInt(left);
        top = parseInt( top );
        return this.forEach(function(elem)
        {
            var position = Utils.position(elem);
            if( !isNaN(left) || !isNaN(top) )
            {
                if(position.left !== left || position.top !== top )
                {
                    Utils.position(elem,left,top);
                    var event = new StyleEvent( StyleEvent.CHANGE );
                    event.property = 'position';
                    event.newValue = {'left':left,'top':top};
                    event.oldValue = position;
                    dispatchEventAll(this, event);
                }

            }else{
               return position;
            }
        });
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

    window.Breeze=Breeze;

})( window )
