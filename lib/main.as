
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
<<<<<<< HEAD
    import lib.EventDispatcher;
=======
   import lib.EventDispatcher;
   import lib.Iprosess;
>>>>>>> origin/master

    public class Main extends B {

       // static public var name:String = '3999 yyy fsss 666' ;
        public var names:String = '3' ;
        static public var name:Number = 5 ;


          //var bb:String='123';
          function Main(jj)
          {

              var ii={
                  name:{},
                  age:1
              };

              ii.cc = 666;

              var bb:Function=function () {
                  console.log('=====9999=====')
              };

              bb();


              var b,c='uuuu',d=6;
              var name=null;
              super(jj);
              console.log( Main.classname );
              console.log( this.names );
          }
    }
}