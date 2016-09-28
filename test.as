



/**
 +------------------------------------------------------------------------------
 * @package  : com.library.Cdisplay
 +------------------------------------------------------------------------------
 * @class    : 显示块类
 +------------------------------------------------------------------------------
 * @access   :
 *
 +------------------------------------------------------------------------------
 * @author   : yejun <664371281@qq.com>
 +------------------------------------------------------------------------------
 */


//类

package com
{

    import coms.B;
    import com.G;
    import StyleEvent;
    import PropertyEvent;
    import ElementEvent;

    public class test extends B {

        static public var name = 3 ;
        private var ccc = 236666;
        protected var tttt = 'tyuuu';
        static private var uuu = 'pppp';

        public function test()
        {

            var uu=123,ccc=666;

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
                    } while (deep && currentItem);
                }
            })



            /*this.names=69999;
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
            });*/

        }


    }
}


