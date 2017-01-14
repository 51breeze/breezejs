
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

   import lib.EventDispatcher;
   import com.B;
   import lib.Iprosess;

    public class Main extends B implements Iprosess {

       // static public var name:String = '3999 yyy fsss 666' ;
        public var names:String = '3' ;
        static public var name:String = '5' ;


          //var bb:String='123';
          function Main(jj)
          {

              var ii={
                  name:{},
                  age:1
              };

              ii.cc = 666;

              var bb:Function=function () {
                //  console.log('=====9999=====')
              };

              bb();


              var b,c='uuuu',d=6;
              var name=null;
              super('666');
            console.log( Main.classname );
           console.log( this.names );

              this.cre( Main.name );
          }

          private var bb:String=null;

        override protected function cre(str:String){
              return this.bb;
          }

        function database(name:String,type:Number):String{
            return '';
        }

        function tests(b:String,c,d,...avg)
        {

            let ii=33;


        }

    }
}