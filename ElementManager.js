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
       if( !( this instanceof ElementManager) )
         return new ElementManager( element );

       DataArray.call(this,element);

       var name = 'instance';
       var cache = new CacheProxy('__factory__');

       this.getInstance=function( element )
       {
            return element ? cache.proxy( element ).get( name ) : null;
       }

       if( this.length > 0 ) for(var i=0; i<this.length; i++)if( this[i] )
       {
           if( !cache.proxy( this[i] ).has(name) )cache.set(name,this);
       }
   }

   ElementManager.prototype=new DataArray();
   ElementManager.prototype.constructor= ElementManager;
   window.ElementManager=ElementManager;

})(window)
