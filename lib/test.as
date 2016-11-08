
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

              var b= Test;
              this.age;

         }

         public function bbb():Class
         {
             return B;
         }

          private function elem():Test
          {
              this.cre();
              Test.name;
              console.log('666');
              var bb = [];
              bb.splice(1).length;
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
         override public function get names()
         {
             return this._names;
         }
    }

}


