/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(window,undefined)
{  "use strict";

    /**
     * 缓存数据代理类。
     * 此缓存的数据都是在对象本身进行存储，所以此类只是一个对于中间层的封装，提供一个简便的操作。
     * @private
     */

    /**
     * @private
     */
    var dataset=function(object,name,value)
    {
        if( typeof object.storage === "undefined" )
        {
            var attr = {}
            if( object.attributes && attributes.attributes.length > 0 )
            {
                var i=0, item;
                while( item = refAttr.attributes.item(i++) )
                {
                    if( item.nodeName.substr(0,4)==='data' )
                        attr[ item.nodeName.substr(4) ]= item.nodeValue;
                }
            }
            object=object['dataset']=attr;
        }else
        {
            object=object.storage;
        }

        if( typeof name === 'string' )
        {
            if( value === null )
            {
                if( typeof object[ name ] !== 'undefined' )
                    delete object[ name ];
                return true;
            }

            if(  typeof value === 'undefined' )
                return object[ name ] || null;
            else
                object[ name ] = value;

        }else
        {
            return object;
        }
        return this;
    }

    function CacheProxy()
    {
        if( !(this instanceof CacheProxy) )
           return new CacheProxy();

        /**
         * @private
         */
        var _target;

        /**
         * 设置代理对象
         * @param target
         * @returns {CacheProxy}
         */
        this.target=function( target )
        {
            _target = target;
            return this;
        }
    }

    /**
     * 设置数据
     * @param name
     * @returns {r}
     */
    CacheProxy.prototype.set=function(name,value)
    {
        dataset(name,value);
        return this;
    }

    /**
     * 获取数据
     * @param name
     * @param value
     * @returns {*}
     */
    CacheProxy.prototype.get=function(name)
    {
        return dataset(name);
    }

    /**
     * 删除数据
     * @param name
     * @returns {boolean}
     */
    CacheProxy.prototype.remove=function(name)
    {
        dataset(name,null);
        return this;
    }

    /**
     * 判断是否存在指定属性名的数据
     * @param name
     * @returns {boolean}
     */
    CacheProxy.prototype.has=function(name)
    {
        return !!dataset(name);
    }

    CacheProxy.prototype.constructor= CacheProxy;
    window.CacheProxy=CacheProxy;

})(window)