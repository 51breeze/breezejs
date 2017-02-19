
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

    public class D extends Object {

         protected var bb:String='123';

         function D(jj:String='123')
          {

              System.log(jj,' this is a D class ');
              var cc:Number=66;
 
         }

        protected function get address():String
        {
            return '66666';
        }
        protected function set address(add:String):void
        {
        }

         public function test()
         {
             return 'the fun createname';
         }

    }

}


