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
        var len = arguments.length;
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



    +(function( packages ){

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
                "C":{
                    '__c__':'123',
                    get:function(){return this.__c__;},
                    set:function(val){ console.log('===set===') ; console.log(this); this.__c__ = val;}
                },
                "D":{
                    get:function(){return this.d;},
                    set:function(val){this.d = val}
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
        Object.defineProperties(proto,module.variable);
        merge(proto, module.public)

    })( packages );




    +(function(packages, extend ){

       var module={
            'constructor':null,
            'protected':{

                baby:function(){
                    console.log( 'protected baby');
                }
            },
            'private':{
                name:function()
                {
                    console.log( 'private name yejun',   this instanceof module.constructor );
                    module.protected.baby.call(this);
                    return 'yejun';
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
            this.__properties__={a:'12388888'};



        }


        if( extend )
        {
            module.constructor.prototype = new extend.constructor();
            merge(module.protected, extend.protected);
        }

        var proto = module.constructor.prototype;
        proto.constructor = module.constructor;

        Object.defineProperties(proto, {
            "A":{
                get:function(){return this.__properties__.a;},
                set:function(val){this.__properties__.a = val;}
            },
            "B":{
                get:function(){return this.b;},
                set:function(val){this.b = val}
            }
        });

        proto.avg=function()
        {
            module.private.name.call(this);
        }

    })( packages , packages['EventDispatcher'] );



    var obj = new packages['Breeze'].constructor()
   // obj.C='8999';

    obj.avg();

    console.log(  obj.A )


})()












