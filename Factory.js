/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined)
{  "use strict";


   function Factory()
   {
       var name = 'instance';
       var cache;
       this.getInstance=function( target )
       {
          return target ? Cache.call(target,'__factory__').get( name ) : null;
       }

       if( this.length > 0 ) for(var i=0; i<this.length; i++)if( this[i] )
       {
           cache = Cache(this[i],'__factory__');
           if( !cache.has(name) )cache.set(name,this);
       }
   }
   Factory.prototype.constructor= Factory;
   window.Factory=Factory;

})(window)

