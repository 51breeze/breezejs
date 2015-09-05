/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(window,undefined){

    function DataArray( items )
    {
        this.length = 0;
        items = items && !(items instanceof Array) ? [items] : null;
        while( items && typeof items[ this.length ] !=='undefined' )
        {
            this[ this.length ]=items[ this.length ];
            this.length++;
        }
    }

    DataArray.prototype.slice=function(start,end)
    {
        start=start || 0;
        start = start < 0 ? this.length+start : start;
        end= typeof end ==='number' ? end : this.length;

        var index=0,items=[];
        if( start === end && typeof this[start] !=='undefined' )
        {
            items.push( this[start] );
        }
        for( ; index < end ; index++ )
        {
            if( typeof this[index] !=='undefined' )
              items.push( this[ index ] );
        }
        return items;
    }

    if( typeof Array.prototype.indexOf !=='function'  )
    {
        DataArray.prototype.indexOf=function(searchElement)
        {
            var i=0;
            for( ; i<this.length; i++ )if( this[i]===searchElement )
                return i;
            return -1;
        }
    }

    DataArray.prototype=new Array();
    DataArray.prototype.length=0;
    DataArray.prototype.constructor = DataArray;
    window.DataArray=DataArray;

})(window)