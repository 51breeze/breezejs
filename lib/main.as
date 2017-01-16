
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


    public class Main extends B implements IProsess {

        static public var name:String = '3999 yyy fsss 666' ;
        public var names:String = '3' ;
      //  static public var name:String = '5' ;


          //var bb:String='123';
          function Main(jj)
          {
              var i = 50;
              var items=[];
              for(let i=i; i<5; i++)
              {
                  var b=i;

                  let hh=i;
                  console.log( hh , jj );
                  items.push( function(){ return i;} );

                  if( true )
                  {
                       console.log( jj );
                  }

              }
              console.log(i, b);
              this.tests(1,2,3,4,5,6);

              console.log( this is IProsess,'==========' );

          }

        function tests(a, ...avg)
        {
            console.log(a, avg );
        }

        private var bb:String=null;

        override protected function cre(str:String){
              return this.bb;
          }

        function database(name:String,type:Number):String{
            return '';
        }
    }
}