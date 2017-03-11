/**
 * Created by Administrator on 2017/3/11.
 */



//类
package com
{
     import Array;
    public dynamic class DataArray extends Array
    {
        protected var bb:String='123';
        function DataArray( length )
        {
             super("6666","888888");

            this.push( '===1=');
            this.push('66======');
            this.unshift('888888888');
            log( this.length ,  this[1], this.slice(0)  );

            this.uuuu = '9999';

            log( this.propertyIsEnumerable('uuuu') , this.uuuu );
        }
    }
}
