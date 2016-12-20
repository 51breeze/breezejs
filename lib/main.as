
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
   /* import com.B;
    import lib.EventDispatcher;*/

    public class Main /*extends B */{

       // static public var name:String = '3999 yyy fsss 666' ;
       // public var names:String = '3' ;
       // static public var name:Number = 5 ;

        private var getProxyTarget:Function = null;
        private var forEachCurrentItem;
        private var length;


          //var bb:String='123';
          function Main(jj , target)
          {

             this.length();

             // __call(  __call( __call(this,['length']),[], true ),[], true )

              this['getProxyTarget' || this.length ];
              this.getProxyTarget = target ?
                  function () {
                      return target.length > 0 ? target : [this];
                  }:
                  function () {
                      return this.forEachCurrentItem ? [this.forEachCurrentItem] : ( this.length > 0 ? this : [this] );
                  };

              var ii={
                  name:{},
                  age:1
              };

              var bb:Function=null;

              bb();


              var b,c='uuuu',d=6;
              var name=null;
             // super(jj);
             // console.log( B.classname );
              console.log( this.names );
          }
    }
}