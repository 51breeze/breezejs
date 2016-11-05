
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
    import com.D;


    public class Test extends B {

         static public var name:String = '3 sdfsdf 6666' ;
         public var name:String = '3' ;
         public var jj:Array = [] ;
         public const age:String = '3' ;

          function Test(jj:String)
          {
             this.test();
              this.jj=['123'];

              this.names='uuiiii';
             console.log(this.names);

         }

          private function elem():Test
          {
              this.cre();
              Test.name;
              console.log('666');
              var bb = [];
              bb.splice().length;
              return this;
          }

          protected function cre()
          {
              console.log( this.name );
          }

         private var _names:String='999';

         public function set names(bbs:String):void
         {
              this._names=bbs;
         }
          public function get names()
         {
             return this._names;
         }
    }

}


