
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
import com.Dispatcher;
import com.DataArray;

public class Main extends B implements IProsess {

        static public var name:String = '3999 yyy fsss 666' ;
        public var names:String = '399999' ;
        public const uuu:String = 'yhhh' ;
      //  static public var name:String = '5' ;

        public var iu:Number= 5;

        public var dd:Class = Array;

          function Main(jj)
          {

             throw new TypeError('===========');

              EventDispatcher( document ).addEventListener( Event.READY , function (e) {


                  log( '=====ready=====');

                  Element('#container').addEventListener( MouseEvent.CLICK, function (e)
                  {
                      log( '==========style =====event=====');

                      //   log( e.property, e.oldValue, e.newValue );

                      this.style('backgroundColor','rgba(255,0,0,0.6)');
                      this.style('border','solid #ff0000 1px');
                      this.width( 400 );
                      this.height( 300 );
                      this.bottom(0);

                     // log( this.height(), this.width() );

                  });

                  Element('#list').addEventListener( MouseEvent.CLICK, function (e) {

                      this.current( e.currentTarget );
                      //e.stopPropagation();

                      log( '==========%s=====', this.property('id') );

                  });



              });

          }

        function ddcc(e)
        {
        }

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

        override protected function cre(str:String):String{

            log( this.bb ,'====this cre====');
            return this.bb;
        }


        function database(name:String='123',type:Number=666):String{
            return '';
        }
    
    }
}