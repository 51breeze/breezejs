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
       var cacheProxy = new CacheProxy('__data__');

       /**
        *
        * @returns {Window.CacheProxy}
        */
       this.cacheProxy=function( element )
       {
           if( !element )
              return cacheProxy
           return cacheProxy.proxy( element );
       }

       this.setInstance(this);
   }

    ElementManager.prototype=new DataArray();
    ElementManager.prototype.constructor= ElementManager;


    /**
     * 获取指定元素的实例对象
     * @param element
     * @returns {*}
     */
    ElementManager.prototype.getInstance=function( element )
    {
        return element ? this.cacheProxy(element).get( 'instance' ) : null;
    }

    /**
     * 为指定的元素设置一个实例对象
     * @param elements
     * @param instance
     */
    ElementManager.prototype.setInstance=function(elements, instance )
    {
        elements = elements instanceof Array ? elements : [elements];
        instance = instance === null ? null : instance || this;
        if (elements.length > 0) for (var i = 0; i < elements.length; i++)if (elements[i]) {
            if (!this.cacheProxy(elements[i]).has('instance'))this.cacheProxy().set('instance', instance );
        }
    }

    window.ElementManager=ElementManager;

})(window)
