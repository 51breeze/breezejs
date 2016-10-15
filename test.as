
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

       /* static public var name = 3 ;
        private var ccc = 236666;
        protected var tttt = 'tyuuu';
        static private var uuu = 'pppp';*/

        public function test()
        {


            //for (var i in {})
            for ( var name in ccc )
            {

            }


            do{
                currentItem = currentItem[propName];


            } while ( deep && currentItem )



            var c,b,d //sdfds
             ;


var cc= {
ddd:'9999',
jj:'ssss',
    nam:{cc:333,bb:'pppp'},
    ccc:[function () {
        var cccc= /*jj*/ name;
    }],
};

            var bb=[sss,kkk,nnnn,];

            var write= typeof newValue !== 'undefined';
            if( !write && this['length'] < 1 )return null;
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

            return this.forEach(function(elem:ElementEvent,ddd)
            {
                var oldValue= getter.call(elem,name,this);
                if( oldValue !== newValue )
                {
                    var event = setter.call(elem,name,newValue,this);
                    if( typeof event === "string" )
                    {
                        event = event===StyleEvent.CHANGE ? new StyleEvent( StyleEvent.CHANGE ) :  new PropertyEvent( PropertyEvent.CHANGE );
                        event.property = name;
                    }
                    if( event instanceof PropertyEvent && this.hasEventListener( event.type ) )
                    {
                        event.property = event.property || name;
                        event.newValue = event.newValue || newValue;
                        event.oldValue = event.oldValue || oldValue;
                        this.dispatchEvent( event ) ;
                    }
                }
            });

        }


        /**
         * @private
         */
        function dispatchElementEvent(parent:ElementEvent, child , type )
        {
            if( this instanceof EventDispatcher && this.hasEventListener( type )  )
            {
                var event=new ElementEvent( type );
                event.parent=parent;
                event.child=child;
                return this.dispatchEvent( event );
            }
            return true;
        }


        function doMake( elems )
        {
            var r = this.__reverts__ || (this.__reverts__ = ['333',9999,function () {
                    
                }]);
            r.push( this.splice(0,this.length, elems ) );
            this.next(null);
            return this;
        }


        function doRecursion(propName,strainer, deep )
        {
            var currentItem,ret=[];
            var s = typeof strainer === "string" ? function(){return Breeze.querySelector(strainer, null , null, [this]).length > 0; } :
                typeof strainer === "undefined" ? function(){return this.nodeType===1;} : strainer ;

            this.forEach(function(elem)
            {
                if( elem && elem.nodeType )
                {
                    currentItem=elem;  //sdfsdfsdfsd
                    do{
                        currentItem = currentItem[propName];
                        if( currentItem && s.call(currentItem) )
                            ret = ret.concat( currentItem );

                    } while ( deep && currentItem );
                }
            });
            return ret;
        }
    }

    function CSS3Animation(properties, options )
    {
        if( !Breeze.isAnimationSupport() )
            return false;

        options =Breeze.extend(defaultOptions,options || {});
        var  css=[];
        for( var i in properties )
        {
            if( typeof  properties[i] === "string" )
            {
                css.push( i + ' {');
                css.push( properties[i] );
                css.push( '}' );
            }
        }

        var prefix = fix.cssPrefixName;
        var stylename = 'A'+Breeze.crc32( css.join('') ) ;
        if( createdAnimationStyle[ stylename ] !==true )
        {
            createdAnimationStyle[ stylename ]=true;
            css.unshift('@'+prefix+'keyframes ' + stylename + '{');
            css.push('}');
            css.push( '.'+stylename+'{' );

            var repeats = options.repeats < 0 ? 'infinite' : options.repeats;
            var timing=options.timing.replace(/([A-Z])/i,function(all,a){
                return '-'+a.toLowerCase();
            });

            var param = {
                'name':stylename,
                'duration':options.duration,
                'iteration-count': repeats,  //infinite
                'delay':options.delay,
                'fill-mode':options.mode,  //both backwards none forwards
                'direction': options.reverse,  // alternate-reverse  reverse alternate normal
                'timing-function': timing,  //ease  ease-in  ease-out  cubic-bezier  linear
                'play-state':options.state //paused running
            };
            for( var p in  param )
            {
                css.push(prefix+'animation-'+p+':'+param[p]+';');
            }
            css.push('}');
            css = css.join("\r\n");
            var head = document.getElementsByTagName('head')[0];
            var style = document.createElement('style');
            style.setAttribute('id',stylename);
            style.innerHTML= css;
            head.appendChild( style );
        }
        return stylename;
    }

}


