
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

    import Test;
    import String;
    import Number;

    public class D {

         public var name:String = '3' ;
         protected const age:String = '3' ;


         function D(jj)
          {
              var cc:Number=66;
              this.name = '9999';
         }

         public function createName():D
         {
             return this;
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

        private var _names:String='999';

        public function set names(bbs:String):void
        {
            console.log('set names = ', bbs );
            this._names=bbs;
        }
        public function get names():String
        {
            console.log('get names ' );
            return this._names;
        }
        
        
    }

}


