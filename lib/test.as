
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

package
{
    import com.B;
    public class Test extends B {

         static public var name:String = '3 sdfsdf' ;
         public var name:String = '3' ;
         public var jj:Array = [] ;
         public const age:String = '3' ;

          function Test(jj:String)
          {
              var cc:Number=66;
              this.name = '9999';

         }

          private function elem():Test
          {
              this.cre();
              return this;
          }

          protected function cre()
          {

          }

         static public function names(bbs:String='999'):Test
         {
            var bb:Number = 88, cc:Number;
            cc = bb;
            return this;
         }
    }

}


