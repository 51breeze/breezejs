
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
    public class Dispatcher extends EventDispatcher
    {


       public function addData(val:Object):Object
        {
            var e = new Event('addData');
           // e.data = val;
            this.dispatchEvent( e );
            return val;

        }
    }

}

