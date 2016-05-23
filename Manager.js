/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(undefined)
{
   "use strict";
   function Manager( elements )
   {
       if( !(this instanceof Manager) )
          return new Manager(elements);
       this.forEachCurrentItem=undefined;
       this.forEachPrevItem=undefined;
       this.forEachNextItem=undefined;
       this.forEachCurrentIndex=NaN;
       this.splice.call(this,0,0,elements);
       EventDispatcher.call(this);
   }

    Manager.prototype= new EventDispatcher()
    Manager.prototype.constructor= Manager;
    Manager.prototype.slice= DataArray.prototype.slice;
    Manager.prototype.concat= DataArray.prototype.concat;
    Manager.prototype.indexOf= DataArray.prototype.indexOf;
    Manager.prototype.splice= DataArray.prototype.splice;
    Manager.prototype.toArray= DataArray.prototype.toArray;
    Manager.prototype.forEachCurrentItem=undefined;
    Manager.prototype.forEachPrevItem=undefined;
    Manager.prototype.forEachNextItem=undefined;
    Manager.prototype.forEachCurrentIndex=NaN;

    /**
     * 返回设置当前元素
     * @param element
     * @returns {*}
     */
    Manager.prototype.current=function( element )
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
                element=Sizzle(element, this.getContext() );
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
     * 获取上下文。
     * @returns {HTMLElement}
     */
    Manager.prototype.getContext=function( context )
    {
        if( typeof context !== 'undefined' )
        {
            if( context instanceof Manager )return context.getContext();
            context = Breeze.isString(context) ? Sizzle(context,document)[0] : context;
        }
        var target = context || this.context;
        if( Breeze.isFrame( target ) && target.contentWindow )
            return target.contentWindow.document;
        return Breeze.isHTMLContainer( target ) ? target :  document ;
    }

    /**
     * 设置获取当前元素的索引
     * @param index
     * @returns {*}
     */
    Manager.prototype.index=function( index )
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
    Manager.prototype.forEach=function(callback , refObject )
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
    window.Manager=Manager;

})()
