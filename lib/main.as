
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
   import com.Abs;


    public class Main extends B implements IProsess {

        static public var name:String = '3999 yyy fsss 666' ;
        public var names:String = '399999' ;
        public var uuu:String = 'yhhh' ;
      //  static public var name:String = '5' ;


          //var bb:String='123';
          function Main(jj)
          {
              var i = 50;
              var items=[];
              var j=i;

              var a = new Array(5,6,8);
              a['name'] = 666 ;

              a.push( 'yejun' );

              //new Abs();
              var cc = {age:100};
              cc.age /= 3;
              cc.bb=66666;
              console.log( cc );



              var o = new Object();

              o['ssss'] = 666;

             // this.setPropertyIsEnumerable('uuu',false);

              console.log( a  ,'=====', a.length , a.values(), o.keys() , this.values()  );

              console.log( '%s', a.find(function (val) {
                  return val===666;
              }));

              var target=1
                  ,index=0;

              //new Abs();

              for( var c in items )
              {
                  console.log( items[c](), '====88888' );
              }


              for(let i=j; i<60; i++)
              {
                  var b=i;

                  let hh=i;
                  var uu=123, yyyy,hhhh=6899;

                  yyyy=8888888888;

                  console.log( hh ,i );
                  //items.push( function(){ return i+'---'+hh;} );

                  if( false )
                  {


                        let hh;
                         console.log( jj );
                         items.push(  function(){ return i+'---'+hh;} );

                  }

              }
              console.log(i, b  );
              this.tests(undefined,2,3,4,5,6);

              console.log( this is IProsess,'==========' );

          }


        private var _home:String='ooooo';

        function get home(){

            console.log( this is IProsess , ' the is getter home');
            return this._home;

        }

        function tests(a=666 ,...avg)
        {

            var  bb=666; 
            var tests;
            if( true ){
                const bb=888;
                var i=9;
                if( a )
                {
                }
                console.log( '===%s',Main );

            }



            console.log(a, avg  , i, bb);
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