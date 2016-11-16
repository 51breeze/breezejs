
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
         static private var address:String = 'shu line' ;
         public var name:String = '3' ;
         public var jj:Array = [] ;
        // public const age:String = '3' ;

          function Test(jj)
          {

              this.jj=['123'];

              this.names='uuiiii';
             console.log(this.names);
            // console.log( B.address, ' is a static prop');

              var b= Test;
        //     console.log( this.age , 'this is parent age');

             super('666');

             //var d =  new D();

         }

         public function bbb():Class
         {
             super.cre(666);
             return B;
         }

          private function elem():Test
          {

              new D();



              Test.name;
              console.log('666');
              var bb = [];
              bb.splice(1).length;
              return this;
          }



         private var _names:String='999';

         override public function set names(bbs:String):void
         {
             console.log('set names = ', bbs );
              this._names=bbs;
         }
        override  public function get names():String
         {
             console.log('get names ' );
             return this._names;
         }
    }

}


