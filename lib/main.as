
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
   import lib.IProsess;
   import lib.IProt;
   import com.Abs;
import com.D;


    public class Main extends B implements IProsess {

        static public var name:String = '3999 yyy fsss 666' ;
        public var names:String = '399999' ;
        public var uuu:String = 'yhhh' ;
      //  static public var name:String = '5' ;

        public var iu:Number= 5;

        public var dd:Class = Array;


          //var bb:String='123';
          function Main(jj)
          {

              var date =  new Date();
              var rinningTime = date.getTime();

              var ccc = [1,2,3];

              function cc(){};


              for(var i=0; i<100000 ; i++ )
              {
                  cc();
              }

              var _d =  new Date();

             log( _d.getTime() - rinningTime  );

          }

        function ddcc(){}

        private var _home:String='ooooo';

        function get home(){

            System.log( this is IProsess , ' the is getter home');
            return this._home;

        }

        function tests(a:Number=666 ,...avg):Main
        {

            var  bb=666;
            var tests;
            if( true ){
                //const bb=888;
                const yy = 666;
                var i=9;
                if( a )
                {
                    //return [];
                }

                System.log( '===%s',Main );
            }
            System.log(a, avg  , i, bb);
            return this;
        }

        //private var bb:String=null;

        override protected function cre(str:String){
            return this.bb;
        }

        function database(name:String,type:Number):String{
            return '';
        }
    }
}