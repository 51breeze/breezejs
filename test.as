



/**
 +------------------------------------------------------------------------------
 * @package  : com.library.Cdisplay
 +------------------------------------------------------------------------------
 * @class    : 显示块类
 +------------------------------------------------------------------------------
 * @access   :
 +------------------------------------------------------------------------------
 * @author   : yejun <664371281@qq.com>
 +------------------------------------------------------------------------------
 */


//类

package{

    import B as UU;

    public class test extends UU {

        static public var name = 123;
        private var ccc = 236666;
        protected var tttt = 'tyuuu';
        static private var uuu = 'pppp';

        public function test()
        {
             this.names=69999;

             console.log( this.position() );

            this.uuuu(9999,'pppp');
        }

        public function uuuu(name,b)
        {
             b=["9999",
            "dsfdsssssss",
            "dsdfdsfdsfdsf","dsfdsfdsfd"];
            var c="dfdsdssssssssssssssssssss"+
                    "ccccccccccccccccc"+
                    "dfdfdsfdsf";

            console.log('this is uuuu', name, b, c);

            test.bbbb();
        }

        static public function bbbb() {


            console.log('this is bbbb');

            this.onResize()

        }

        private var __style__='pppp';

        public function get style(){
            return this.__style__;
        }

        //调整大小
        function onResize(kkkss,
                          lll,
                          bb)
        {
            this.kkk=23;
        }

        private function position(event)
        {
              return true
        }


        /**
         * @private
         */
        function access(callback, name, newValue)
        {
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
            });
        }

        /**
         * @private
         */
        function removeChild(parent,child, flag )
        {
            if( child && parent.hasChildNodes() && child.parentNode === parent )
            {
                var result=parent.removeChild( child );
                flag===false || dispatchElementEvent.call(this,parent,child,ElementEvent.REMOVE);
                return !!result;
            }
            return false;
        }

        /**
         * @private
         */
        function getChildNodes(element,selector,flag)
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
         * @private
         */
        function dispatchElementEvent(parent, child , type )
        {
            if( this instanceof EventDispatcher && this.hasEventListener( type )  )
            {
                var event=new ElementEvent( type )
                event.parent=parent;
                event.child=child
                return this.dispatchEvent( event );
            }
            return true;
        }

        /**
         *  @private
         */
        function doMake( elems )
        {
            var r = this.__reverts__ || (this.__reverts__ = []);
            r.push( this.splice(0,this.length, elems ) );
            this.current(null);
            return this;
        }


}
}


