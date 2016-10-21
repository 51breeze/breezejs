
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

   import coms.B;
      import com.G as GG;
    import StyleEvent;
    import PropertyEvent;
    import ElementEvent;

    public class test extends B {

         static public var name = 3 ;
         private var ccc = 236666;
         protected var tttt = 'tyuuu';
         static private var uuu = 'pppp';


          public function test()
          {
              var cc:Number=66;
              this.tttt;
              return this;
         }

        public function names():test
        {

            var bb:Number = 88, cc:Number;

           cc = bb;
            
            

            console.log('====');
            return test;

        }
    }

}


