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
    function CacheProxy(partition )
    {
        if( !(this instanceof CacheProxy) )
           return new CacheProxy(partition );

        /**
         * @private
         */
        var name='__storage__';
        var proxyTarget;

        /**
         * @private
         */
        var data=function(name,value)
        {
            var target = proxyTarget || this;
            var object= target[ name ] || ( target[ name ]={} );
                object = partition===undefined ? object :  object[ partition ] || ( object[ partition ]={} );

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

            }else if( typeof value === 'undefined' )
            {
                object[ partition ]={};
            }
            return true;
        }

        /**
         * 设置代理对象
         * @param target
         * @returns {CacheProxy}
         */
        this.proxy=function( target )
        {
            proxyTarget = target;
            return this;
        }

        /**
         * 设置数据
         * @param name
         * @returns {r}
         */
        this.set=function(name,value)
        {
            data(name,value);
            return this;
        }

        /**
         * 获取数据
         * @param name
         * @param value
         * @returns {*}
         */
        this.get=function(name)
        {
            return data(name);
        }

        /**
         * 删除数据
         * @param name
         * @returns {boolean}
         */
        this.remove=function(name)
        {
            return !!data(name,null);
        }

        /**
         * 判断是否存在指定属性名的数据
         * @param name
         * @returns {boolean}
         */
        this.has=function(name)
        {
           return !!data(name);
        }
    }

    CacheProxy.prototype.constructor= CacheProxy;
    window.CacheProxy=CacheProxy;

})(window)