
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
        // public var name:String = '3' ;
      //   public var jj:Array = [22] ;
        // public const age:String = '3' ;


         private var bbbn=123;

          function Test(jj)
          {

              console.log(this.names);


              var cc= this.names === this.names;

             // ccc.names;


             // this.jj=['123'];

              this.names='uuiiii';

            // console.log( B.address, ' is a static prop');

              var b= Test.address;
        //     console.log( this.age , 'this is parent age');

              B.classname;



             super('666');

             //var d =  new D();

         }

         public function bbb():Class
         {
             this.bbbn=999;
             console.log( super.cre(666) );
             return B;
         }

          private function elem():Test
          {

              new D().createName();

             // this.createName();

              this.name;

              this.address;

              new B().createName();
 


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
        override public function get names():String
         {
             console.log('get names ' );
             return this._names;
         }
    }

}


