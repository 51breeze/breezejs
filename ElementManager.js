/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined)
{  "use strict";

   function ElementManager(elements)
   {
       if( !(this instanceof ElementManager) )
          return new ElementManager()
       EventDispatcher.call(this,elements);
   }

    ElementManager.prototype=new EventDispatcher();
    ElementManager.prototype.constructor= ElementManager;
    ElementManager.prototype.forEachCurrentItem=undefined;
    ElementManager.prototype.forEachPrevItem=undefined;
    ElementManager.prototype.forEachNextItem=undefined;
    ElementManager.prototype.forEachCurrentIndex=NaN;

    /**
     * 返回设置当前元素
     * @param element
     * @returns {*}
     */
    ElementManager.prototype.current=function( element )
    {
        if( element )
        {
            var index =  this.indexOf( element );
            if( index >= 0 )
            {
                this.forEachCurrentItem=element;
                this.forEachCurrentIndex= index;
            }else
            {
                this.forEachCurrentItem = element;
                this.forEachCurrentIndex = NaN;
            }
            return this;
        }
        return this.forEachCurrentItem || this[0];
    }

    /**
     * 设置获取指定索引下的元素
     * @param index
     * @returns {*}
     */
    ElementManager.prototype.index=function( index )
    {
        if( index >= 0 && index < this.length && typeof this[index] !== "undefined" )
        {
            this.forEachCurrentItem= this[ index ];
            this.forEachCurrentIndex= index;
            return this;
        }
        return this.forEachCurrentIndex;
    }

    /**
     * 遍历元素
     * @param callback
     * @param refObject
     * @returns {*}
     */
    ElementManager.prototype.forEach=function(callback , refObject )
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

    window.ElementManager=ElementManager;

})(window)
