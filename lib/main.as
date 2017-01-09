
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
   import lib.EventDispatcher;

    public class Main extends B {


        static private var name:Number = 5 ;

        private var name:String='665888';

        private var age:Number = 35;

        private var storage:Function = function () {
            
        };

        private var dispatcher:EventDispatcher;

          //var bb:String='123';
          function Main()
          {
              var ii={
                  name:{},
                  age:1
              };

              this.age+= 6;

              this.dispatcher = new EventDispatcher();


              console.log( this.name+'666' ,'========');
              console.log( this.age );

              console.log( this is B , '====is B ====');


              console.log(  this.dispatcher.hasEventListener('jjj') );

              var b,c='uuuu',d=6;
              var name=null;

             console.log( B.classname );
              console.log( Main.name );
          }
    }
}