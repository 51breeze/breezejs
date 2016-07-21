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

package breezejs.brreze{

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
            this.name=names;this.ccc='0000';

            if(1){

            }
        }

        public function get style(){

            return this.Style;

        }

        //调整大小
        function onResize():void{

        }

        private function setPosition(event:BreezeEvent)
        {

        }
    }
}