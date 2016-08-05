



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

    import com.B;

    public class test extends B {

        public var name = 'join';

        private var ccc = '236666';
        protected var tttt = 'tyuuu';

        static private var uuu = 'pppp';

        public function test() {
            var c = new B();

            this instanceof B;
        }

        static public function bbbb() {
        }

        public function get names() {
            return this.name;
        }

        public function set names(names) {
            this.name = names;
        }


        private var __style__='pppp';

        public function get style(){
            return this.__style__;
        }

        //调整大小
        function onResize(kkkss, lll, bb)
        {
        }

        private function position(event)
        {
              return true
        }
    }
}


