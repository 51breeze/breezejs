
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


          //var bb:String='123';
          function Main(jj)
          {


              this.tests({},2,3,4,(5+6),6 && 6666 );

              System.log( Iterator(this,true).items[0] );

              for(var bb in  this  )
              {
                  System.log( /*this[bb] , */ this[bb]   ,'=================', bb );
              }

              var items=9999,jjj:Object={"name":"666"},
                  ddd:Object;

             if( (jjj.name = ddd = items = [] || {}) ){

                 System.log(jjj,ddd,items);
             }

              var bc:IProt= this;

              System.log( '%s', Main );

              var i = 50;

              var j=i;

            //  items.length = 5;

              System.log( [666].keys() ,  System.trim( '' ) );

              var a = new Array(5,6,8);
              a['name'] = 666 ;

              a.push( 'yejun' );

              //new Abs();
              var cc = {age:100};
              cc.age /= 3;
              cc.bb=66666;
              System.log( cc , Main.name);



              var o = new Object();

              o['ssss'] = 666;

             // this.setPropertyIsEnumerable('uuu',false);

              System.log( a  ,'=====', a.length , a.values(), o.keys() , this.values() , ['=======','++++++++++'].values() );

              System.log( '%s', a.find(function (val) {
                  return val===666;
              }));

              var target=1
                  ,index=0;

              //new Abs();

              for( var c in items )
              {
                  System.log( items[c](), '====88888' );
              }


              for(let i=j; i<60; i++)
              {
                  var b=i;

                  let hh=i;
                  var uu=123, yyyy,hhhh=6899;

                  yyyy=8888888888;

                  System.log( hh ,i );
                  //items.push( function(){ return i+'---'+hh;} );

                  if( false )
                  {


                        let hh;
                         System.log( jj );
                        // items.push(  function(){ return i+'---'+hh;} );

                  }

              }
              System.log(i, b  );


              System.log( this is IProsess,'==========' );

          }

        private var _home:String='ooooo';

        function get home(){

            System.log( this is IProsess , ' the is getter home');
            return this._home;

        }

        function tests(a:*=666 ,...avg)
        {

            var  bb=666;
            var tests;
            if( true ){
                const bb=888;
                var i=9;
                if( a )
                {
                }
                System.log( '===%s',Main );

            }



            System.log(a, avg  , i, bb);
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