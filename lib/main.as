
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

import DataArray;

public class Main
{
        static public var name:String = '3999 yyy fsss 666' ;
        public var names:String = '399999' ;
        public const uuu:String = 'yhhh' ;
        public var iu:Number= 5;
        public var dd:Class = Array;
        function Main(jj)
        {
            EventDispatcher(document).addEventListener(Event.READY,function (e)
            {

                log('========ready=====');

                var data = new DataArray();
                data[0] = {id:2,name:'yejun',time:120};
                data[1] = {id:2,name:'zhangSang',time:100};
                data[5] = {id:3,name:'LiShing',time:300};

                var rd = new DataRender();
                rd.dataProfile('datas');
                rd.view('<?foreach(datas as key item){?><li>key:{key} value:{item.id} >> {item.name} </li><?}?>');
                rd.viewport('#container');
                rd.source('http://breezejs.com/json.php');
               // rd.source(data);
                rd.dataSource().rows(30);
                rd.dataSource().select(3);
                rd.display();

            });
        }
}
}