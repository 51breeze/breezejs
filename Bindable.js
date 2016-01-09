/*
 * BreezeJS BindData class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(){

    /**
     * 数据双向绑定器
     * @param target 需要监听的对象,可以是一个元素选择器。在这些对象上所做出的任何属性变化都会影响到通过 bind 方法所绑定到的数据源
     *               [发布内容的对象]
     * @constructor
     */
    function Bindable()
    {
        if( !(this instanceof Bindable) )
            return new Bindable();

        EventDispatcher.call(this);

        /**
         * @private
         * @type {Dictionary}
         */
        var subscription= new Dictionary()
            ,dataset={}

        /**
         * 提交属性到每个绑定的对象
         * @param property
         * @param newValue
         */
        ,commit=function(property,newValue)
        {
            var i,item,object,properties,targets= subscription.getAll();
            for( i in targets )
            {
                item=targets[i];
                if( item.key && item.value )
                {
                    object=item.key;
                    properties=item.value;
                    if( properties )
                    {
                        var callback=properties[property] || properties['*'];
                        if( Utils.isFunction( callback ) )
                        {
                              callback.call(object,property,newValue);

                        }else if( property in properties || '*' in properties )
                        {
                            if( (object.nodeType && typeof object.nodeName ==='string' && object != object.window) || typeof object === 'object' )
                            {
                               object[ property ]= newValue;

                            }else if( object instanceof Bindable || object instanceof Breeze )
                            {
                                return object.property(property,newValue);
                            }
                        }
                    }
                }
            }
            return true;
        }

        /**
         * 绑定需要动态改变属性的对象(相当于订阅内容)
         * @param target
         * @param property
         * @returns {boolean}
         */
        this.bind=function(target,property,callback)
        {
            if( !target )
              return false;
            property = property instanceof DataSource ?  property || '?' : property || 'value';
            if( typeof target === 'object' )
            {
                var obj = subscription.get(target)
                if (!obj)subscription.set(target, (obj = {}));
                obj[property] = callback;
                return true;
            }
            return false;
        }

        /**
         * 解除绑定(取消订阅)
         * @param target
         * @param property
         * @returns {boolean}
         */
        this.unbind=function(target,property)
        {
            var obj;
            if( target && ( obj=subscription.get( target ) ) )
            {
                typeof property ==='string' ? delete obj[ property ] : subscription.remove(target);
                return true;
            }
            return false;
        }

        /**
         * 设置属性
         * @param name
         * @param value
         */
        this.property=function(name,value)
        {
            if( typeof value === 'undefined' )
              return dataset[ name ];

            var result = false;
            if( dataset[ name ] !== value )
            {
                dataset[ name ] = value;
                result=commit(name,value);
                if( result )
                {
                    var ev = new PropertyEvent(PropertyEvent.COMMIT);
                    ev.property = name;
                    ev.newValue = value;
                    this.dispatchEvent(ev);
                }
            }
            return result;
        }

        /**
         * 检查是否有指定的属性名
         * @param name
         * @returns {boolean}
         */
        this.hasProperty=function(name)
        {
            return typeof dataset[name] !== 'undefined';
        }
    }

    Bindable.prototype=new EventDispatcher();
    Bindable.prototype.constructor=Bindable;
    window.Bindable=Bindable;

})()