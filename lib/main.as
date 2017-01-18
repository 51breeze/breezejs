
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
              var j=i;
              for(let i=j; i<60; i++)
              {
                  var b=i;

                  let hh=i;

                  console.log( hh ,i );
                  items.push( function(){ return i+'---'+hh;} );

                  if( false )
                  {
                      let hh;
                       console.log( jj );

                      items.push( function(){ return function(){ return i+'---'+hh;} } );
                  }

              }
              console.log(i, b  );
              this.tests(1,2,3,4,5,6);
              for( var c in items )
              {
                  console.log( items[c](), '====88888' );
              }
              console.log( this is IProsess,'==========' );

          }

        function tests(a ,...avg)
        {
            var tests;
            if( true ){

                var i=9;
                if( a )
                {
                }

            }
            console.log(a, avg  , i );
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