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

/*
package breezejs{

    import breezejs.events.BreezeEvent;
    import breezejs.EventDispatcher;

    public class main extends EventDispatcher {

        public var name=null

        public function main()
        {
            super();
        }

        public function get names(){
            return this.Names
        }

        public function set names(names){

            this.Names=names
            this.name=names;
        }

        public function get style(){

            return this.Style;

        }

        public function onResize():void{

        }

        private function setPosition(event:BreezeEvent)
        {

        }
    }
}

import packages.EventDispatcher.

'constructor';

import packages.breeze.private.name;*/


(function(){

    var packages={};

    function merge()
    {
        var target = arguments[0];
        var len = arguments.lenght;
        for(var i=1; i<len; i++ )
        {
            var item = arguments[i];
            for( var p in item )
            {
                if( typeof item[p] === 'object' && typeof target[p] === 'object' )
                {
                    merge(target[p],  item[p] );
                }else{
                    target[p] = item[p];
                }
            }
        }
        return target;
    }







    (function( packages ){

        var module={
            'constructor':null,
            'public':{

                addEventListener:function(){
                },
                removeEventListener:function(){
                }
            },
            'protected':{

                baby:function(){

                }
            },
            'private':{
                name:function()
                {
                    return 'yejun';
                }
            },
            'variable':{
                "A":{
                    get:function(){return this.a;},
                    set:function(val){this.a = val;}
                },
                "B":{
                    get:function(){return this.b;},
                    set:function(val){this.b = val}
                }
            }
        };

        packages['EventDispatcher'] = module;
        module.constructor=function(){

            if( !(this instanceof module.constructor) )
            {
                return new module.constructor()
            }
        }

        var proto = module.constructor.prototype;
        proto.constructor = module.constructor;
        Object.defineProperties(prototype,module.variable);
        Object.defineProperties(prototype,module.public);

    })( packages )




    (function(packages, extend ){

       var module={
            'constructor':null,
            'public':{

                avg:function(){
                }
            },
            'protected':{

                baby:function(){

                }
            },
            'private':{
                name:function()
                {
                    return 'yejun';
                }
            },
            'variable':{
                "A":{
                    get:function(){return this.a;},
                    set:function(val){this.a = val;}
                },
                "B":{
                    get:function(){return this.b;},
                    set:function(val){this.b = val}
                }
            }
        };

        packages['Breeze'] = module;

        module.constructor=function(){

            if( !(this instanceof module.constructor) )
            {
                return new module.constructor()
            }
            !extend || extend.constructor.call(this);
            this.name='';
            this.age='30';
        }

        if( extend )
        {
            module.constructor.prototype = new extend.constructor();
            Object.defineProperties(module.protected, extend.protected );
            Object.defineProperties(module.variable, extend.variable );
        }

        var proto = module.constructor.prototype;
        proto.constructor = module.constructor;
        Object.defineProperties(prototype,module.variable);
        Object.defineProperties(prototype,module.public);

    })( packages , packages['EventDispatcher'] )








})()











