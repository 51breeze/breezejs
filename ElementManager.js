/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined)
{  "use strict";


   function ElementManager(element)
   {
       DataArray.call(this,element);
   }

    ElementManager.prototype=new DataArray();
    ElementManager.prototype.constructor= ElementManager;

    ElementManager.prototype.forEachCurrentItem=undefined;
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
            return this.forEachCurrentIndex;
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
        if( index >= 0 && index < this.length )
        {
            this.forEachCurrentItem= this[ index ] ;
            this.forEachCurrentIndex= index;
            return this.forEachCurrentItem;
        }
        return this.forEachCurrentIndex;
    }
    window.ElementManager=ElementManager;

})(window)
