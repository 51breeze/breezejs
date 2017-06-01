/*
 * BreezeJS BindData class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

var storage=Internal.createSymbolStorage( Symbol('bind') );

/**
 * 提交属性到每个绑定的对象
 * @private
 * @param property
 * @param newValue
 */
function commit(property,newValue )
{
    var targets = storage(this,'subscriber').getAll();
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
                var custom=properties[property] || properties['*'];
                if( custom && System.isFunction( custom ) )
                {
                    custom.call(object,property,newValue);

                }else if( property in properties || '*' in properties )
                {
                    var prop = typeof custom === "string" ? custom : property;
                    if( object instanceof Bindable ||  object instanceof Element )
                    {
                        object.property(prop,newValue);

                    }else if( System.isNodeElement(object) )
                    {
                         typeof object[ prop ] !== "undefined" ? object[ prop ] = newValue : object.setAttribute(prop,newValue);

                    }else
                    {
                        object[ prop ] = newValue;
                    }
                }
            }
        }
    }
};

/**
 * 数据双向绑定器
 * @param proxyObject  一个数据对象, 可以是空。 如果此对象是一个单一的对象则会把此对象上的所有属性继承到绑定器上。
 * 如果是一个DOM元素则会监听当前元素的属性变更并传送到被绑定的对象中。
 * @constructor
 * @require Object,EventDispatcher,PropertyEvent,Symbol,Dictionary,Element
 */
function Bindable( proxyObject )
{
    if( !(this instanceof Bindable) )
        return new Bindable( proxyObject );
    EventDispatcher.call(this , proxyObject );
    storage(this,true,{"proxyObject":proxyObject,"data":{},"subscriber":new Dictionary()});
    this.addEventListener(PropertyEvent.CHANGE,function(event){
        commit.call(this,event.property, event.newValue);
    });
}

Bindable.NAME='bindable';
Bindable.prototype=  Object.create( EventDispatcher.prototype );
Bindable.prototype.constructor=Bindable;

/**
 * 指定对象到当前绑定器。
 * @param object targetObject 数据对象，允许是一个 DOM元素、EventDispatcher、Object。如果是 Object 则表示为单向绑定，否则都为双向绑定。
 * @param string eventType 需要绑定的属性名,允是一个*代表绑定所有属性, 默认为 value
 * @param function|string propertyName 如果是函数发生变更时调用，如果是一个属性名发生变更时赋值
 * @returns {Bindable}
 */
Bindable.prototype.bind=function(target, eventType, propertyName )
{
    eventType =  eventType || 'value';
    var subscriber = storage(this,'subscriber');
    var data = subscriber.get(target,{});
    data[ eventType ]=propertyName;
    return this;
};

/**
 * 解除绑定(取消订阅)
 * @public
 * @param object target 数据对象，允许是一个 DOM元素、EventDispatcher、Object
 * @param string property 需要绑定的属性名
 * @returns {boolean}
 */
Bindable.prototype.unbind=function(target,property)
{
    var subscriber = storage(this,'subscriber');
    if( typeof property ==='string' )
    {
        var data=subscriber.get( target );
        if( data )
        {
            delete data[property];
            return true;
        }
        return false;
    }
    return !!subscriber.remove( target );
};

/**
 * 提交属性的值到绑定器。
 * 调用此方法成功后会传递当前改变的值到绑定的对象中。
 * @param string name
 * @param void value
 */
Bindable.prototype.property=function(name,value)
{
    if( typeof name === "string" )
    {
        var data = storage(this, 'data');
        var old = data[name];
        if (typeof value !== 'undefined' && old !== value)
        {
            data[name] = value;
            var ev = new PropertyEvent(PropertyEvent.CHANGE);
            ev.property = name;
            ev.newValue = value;
            ev.oldValue = old;
            this.dispatchEvent(ev);
            return true;
        }
    }
    return false;
};

/**
 * 检查是否有指定的属性名
 * @param string name
 * @returns {boolean}
 */
Bindable.prototype.hasProperty=function(name)
{
    var dataitem = storage(this,'dataitem');
    return typeof dataitem[name] !== 'undefined';
};
System.Bindable = Bindable;