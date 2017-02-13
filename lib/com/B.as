
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

package com
{
    import String;
    import Number;
    import com.*;
    import lib.*;

    public class B extends D {
        
         public var dispatcher:EventDispatcher = null ;
         protected const age:String = '3' ;
         static protected var address:String = 'shu line 6666' ;

        static protected function get classname():String
        {
            return '==the B classname=';
        }

         function B(jj)
         {
              super(jj);
              var cc:Number=66;
             System.log('===the is B====', this is D);
         } 



        protected function createName()
         {
             return 'the fun createname';
         }

        private var name:String='666 66fff';

        protected function cre(str:String)
        {

            System.log(  this.name );
            System.log( 'call cre');
        }

        function connect(str:Object):String{
            return '';
        }



    }

}


