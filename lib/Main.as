
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
  /*  import com.B;
    import lib.EventDispatcher;*/

    public class Main/* extends B*/ {


        private var bb:Main = new Main();

       // static public var name:String = '3999 yyy fsss 666' ;
        public var names:String = '3' ;
        static public var name:Number = 5 ;
        private var getProxyTarget:Function = null;



          //var bb:String='123';
          function Main(jj)
          {

              var ii={
                  name:{},
                  age:1
              };



              var target= this.getProxyTarget();

              this.names;

              this.setProps();

              var b,c='uuuu',d=6;
              var name=null;
             // super(jj);
             // console.log( B.classname );
              console.log( this.names );
          }

          function setProps()
          {

              if( 1 )
              {
                  this.getProxyTarget = function(){};
              }

          }

    }
}