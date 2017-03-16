
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
              //  data.orderBy( {'id':DataArray.DESC,'time':DataArray.DESC});


                var dataSource = new DataSource();
               // dataSource.source( 'http://breezejs.com/json.php' );

                //log( dataSource.length , dataSource.select() );
              //  var d = dataSource.select('id>2');

               //var d=dataSource.grep().execute('id=2');

                var t = new Http();

                t.addEventListener(HttpEvent.SUCCESS,function (e) {
                     log( e.url );
                });

                t.addEventListener(HttpEvent.LOAD_START,function (e) {
                    log( e.type , e.url );
                });

                t.load('http://breezejs.com/json.php','ii=66');
                t.load('http://breezejs.com/json.php?1','');
                t.load('http://breezejs.com/json.php?2','');


               /* for(var i in d )
             {
             log( i,'==>>', d[i].id , '===>>', d[i].name );
             }*/


            });
        }
}
}