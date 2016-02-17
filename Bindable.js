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
     * @private
     * @param property
     * @param newValue
     */
    var commit=function(property,newValue )
    {
        var targets = this.subscription().getAll();
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
                    if( Utils.isFunction( custom ) )
                    {
                        custom.call(object,property,newValue);

                    }else if( property in properties || '*' in properties )
                    {
                        var prop = typeof custom === "string" ? custom : property;
                        if( object instanceof Bindable )
                        {
                            object.commitProperty(prop,newValue);

                        }else if( object instanceof Breeze )
                        {
                            object.property(prop,newValue);

                        }else if( Utils.isNodeElement(object) )
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
    }

    /**
     * 绑定属性变更事件
     * @private
     * @param Bindable bindable
     */
     function bindEvent( bindable , bindName )
     {
         bindable= bindable || this;
         this.addEventListener(PropertyEvent.COMMIT, function (event)
         {
             var property = event.property;
             var newvalue = event.newValue;
             if( typeof bindName !== "undefined" && property!==bindName )
                 return ;
             if( bindable === this )
             {
                 commit.call(bindable,property,newvalue);

             }else
             {
                 bindable.commitProperty(property,newvalue);
             }
         });
     }


    /**
     * 数据双向绑定器
     * @param propertyObject  一个数据对象, 可以是空。 如果此对象是一个单一的对象则会把此对象上的所有属性继承到绑定器上。
     *                      如果是一个DOM元素则会监听当前元素所的属性的变更并传送到被绑定的对象中。
     * @constructor
     */
    function Bindable( propertyObject )
    {
        if( propertyObject instanceof Bindable )
          return propertyObject;

        if( Utils.isNodeElement(propertyObject) )
        {
            var bindable =  Utils.storage(propertyObject,Bindable.NAME);
            if( bindable &&  bindable instanceof Bindable )
              return bindable;
        }

        if( !(this instanceof Bindable) )
            return new Bindable( propertyObject );

        if( Utils.isNodeElement(propertyObject) )
        {
            EventDispatcher.call( this , propertyObject );
            Utils.storage(propertyObject,Bindable.NAME,this);
            this.addEventListener(PropertyEvent.CHANGE,function(event){

                var property = event.property;
                var newvalue = event.newValue;
                if( typeof this[property] !== "undefined" )
                    this.property(property,newvalue);
            })

        }else
        {
            EventDispatcher.call( this );
            if( Utils.isObject(propertyObject) )for( var key in propertyObject ) if( typeof this[key] !== "function" )
            {
                this[key] =  propertyObject[key];
                if( this[key] instanceof EventDispatcher )
                {
                    bindEvent.call(this[key], this);
                }

            }else if( typeof propertyObject === "string")
            {
                this[ propertyObject ]= null;
            }
        }
        bindEvent.call(this);
    }

    Bindable.NAME='bindable';
    Bindable.prototype=new EventDispatcher();
    Bindable.prototype.constructor=Bindable;
    Bindable.prototype.__subscription__=null;

    /**
     * 订阅者对象词典
     * @protected
     * @param target
     * @returns {Dictionary}
     */
    Bindable.prototype.subscription=function( target )
    {
        if( this.__subscription__=== null )
        {
            this.__subscription__=new Dictionary();
        }
        return this.__subscription__;
    }

    /**
     * 指定对象到当前绑定器。(订阅)
     * @public
     * @param object targetObject 数据对象，允许是一个 DOM元素、EventDispatcher、Object。 如果是 Object 则表示为单向绑定，否则都为双向绑定。
     * @param string property 需要绑定的属性名,允是一个*代表绑定所有属性
     * @param function|string custom 如果是函数发生变更时调用，如果是一个属性名发生变更时赋值
     * @returns {Bindable}
     */
    Bindable.prototype.bind=function(targetObject,property,custom)
    {
        property =  property || 'value';
        if( targetObject instanceof EventDispatcher )
        {
            bindEvent.call(targetObject, this, property);

        }else  if( Utils.isEventElement(targetObject) )
        {
            bindEvent.call(new EventDispatcher(targetObject), this, property);
        }

        if( typeof targetObject === 'object' )
        {
            var obj =this.subscription().get( targetObject ) || ( this.subscription().set(targetObject, (obj={}) ) );
            obj[ property ] = custom;
        }
        return this;
    }

    /**
     * 解除绑定(取消订阅)
     * @public
     * @param object target 数据对象，允许是一个 DOM元素、EventDispatcher、Object
     * @param string property 需要绑定的属性名
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
     * 提交属性的值到绑定器。
     * 调用此方法成功后会传递当前改变的值到绑定的对象中。
     * @param string name
     * @param void value
     */
    Bindable.prototype.commitProperty=function(name,value)
    {
        if( typeof value === 'undefined' )
            return this[ name ];
        var old = this[name];
        if( old !== value )
        {
            this[ name ] = value;
            var ev = new PropertyEvent(PropertyEvent.COMMIT);
            ev.property = name;
            ev.newValue = value;
            ev.oldValue = old;
            this.dispatchEvent( ev );
        }
        return this;
    }

    /**
     * 检查是否有指定的属性名
     * @param string name
     * @returns {boolean}
     */
    Bindable.prototype.hasProperty=function(name)
    {
        return typeof this[name] !== 'undefined';
    }

    window.Bindable=Bindable;

})()