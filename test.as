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

    packages['EventDispatcher']={
        'constructor':function(){},
        'protected':{},
        'public':{}
    };

    (function(module){

        var prototype = module.constructor.prototype;
        prototype.constructor = module.constructor;

        prototype.addEventListener=function()
        {
            return 'yejun';
        }

        prototype.removeEventListener=function()
        {

        }

    })( packages['EventDispatcher'] )


    packages['breeze']={
        'constructor':function(){},
        'protected':{

            baby:function(){}

        },
        'private':{
            name:function()
            {
                return 'yejun';
            }
        }
    };

    (function(module, extend ){

        if( extend )
        {
            module.constructor.prototype = new extend.constructor();
            merge(module.protected, extend.protected );
        }

        var prototype = module.constructor.prototype;
        prototype.constructor = module.constructor;

        prototype.cc='yejun';
        prototype.add=function()
        {
            this.baby();
            //-->  module.protected.baby.call(this);

        }

        prototype.avg=function()
        {
            this.name();

            //-->  module.private.name.call(this);
            return 43;
        }

    })( packages['breeze'] , packages['EventDispatcher'] )






})()












