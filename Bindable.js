/*
 * BreezeJS BindData class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function(){




    /**
     * 提交属性到每个绑定的对象
     * @param property
     * @param newValue
     */
    var commit=function(property,newValue, targets )
    {
        var i,item,object,properties;
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
     * 数据双向绑定器
     * @param target 需要监听的对象,可以是一个元素选择器。在这些对象上所做出的任何属性变化都会影响到通过 bind 方法所绑定到的数据源
     *               [发布内容的对象]
     * @constructor
     */
    function Bindable( data )
    {
        if( !(this instanceof Bindable) )
            return new Bindable( data );
        EventDispatcher.call(this);
    }

    Bindable.prototype=new EventDispatcher();
    Bindable.prototype.constructor=Bindable;
    Bindable.prototype.__subscription__=null


    /**
     * 获取对象词典
     * @param target
     * @returns {null|*}
     */
    Bindable.prototype.subscription=function( target )
    {
        if( this.__subscription__=== null )
        {
            this.__subscription__=new Dictionary();
            this.__subscription__.set(target,{});
        }
        return this.__subscription__;
    }

    /**
     * 绑定需要动态改变属性的对象(相当于订阅内容)
     * @param target
     * @param property
     * @returns {boolean}
     */
    Bindable.prototype.bind=function(target,property,callback)
    {
        property =  property || 'value';
        if( typeof target === 'object' )
        {
            var obj = this.subscription(target).get( target );
                obj[ property ] = callback;
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
    Bindable.prototype.unbind=function(target,property)
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
    Bindable.prototype.property=function(name,value)
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
    Bindable.prototype.hasProperty=function(name)
    {
        return typeof dataset[name] !== 'undefined';
    }

    window.Bindable=Bindable;

})()