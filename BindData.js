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
     * @param target 需要监听的对象。在这些对象上所做出的任何属性变化都会影响到通过 bind 方法所绑定到的数据源
     * @constructor
     */
    function BindData( target )
    {
        if( !(this instanceof BindData) )
            return new BindData( target );

        /**
         * @private
         * @type {Breeze.Dictionary}
         */
        var subscription= new Dictionary()
            ,dataset={}
            ,self=this

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
                        if( Breeze.isFunction( callback ) )
                        {
                            callback.call(object,property,newValue);

                        }else if( property in properties || '*' in properties )
                        {
                            if( object && object.nodeType === 1 && typeof object.nodeName ==='string'  )
                            {
                                property=object.hasOwnProperty('value') ? 'value' : 'innerHTML' ;
                                object[ property ]= newValue;

                            }else if( object instanceof BindData || object instanceof Breeze )
                            {
                                object.setProperty(property,newValue)

                            } else if( typeof object === 'object' && !object.nodeType && object != object.window )
                            {
                                object[ property ]= newValue;
                            }
                        }
                    }
                }
            }
        }

        //初始化父类
        EventDispatcher.call(this);

        //监听当前绑定对象的属性。
        if( !(target instanceof EventDispatcher) )
            target=EventDispatcher.call( this, target );

        target.addEventListener(PropertyEvent.PROPERTY_CHANGE,function(event)
        {
            if( event instanceof PropertyEvent )
                self.setProperty(event.property,event.newValue );
        });

        /**
         * 绑定需要动态改变属性的对象
         * @param target
         * @param property
         * @returns {boolean}
         */
        this.bind=function(target,property,callback)
        {
            property = property || 'value';
            if( (typeof target === 'object' || target instanceof Array) && !target.nodeType && target != target.window )
            {
                var obj = subscription.get(target)
                if( !obj )subscription.set(target, (obj={}) );
                obj[property]=callback;
                return true;
            }
            return false;
        }

        /**
         * 解除绑定
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
         * 设置数据源
         * @param name
         * @param value
         */
        this.data=function(name,value)
        {
            typeof name === 'string' ? dataset[name]=value : dataset=name ;
        }

        /**
         * 设置属性
         * @param name
         * @param value
         */
        this.setProperty=function(name,value)
        {
            if( this.getProperty( name ) !== value )
            {
                dataset[ name ] = value;
                commit(name,value);
                var ev=new PropertyEvent(PropertyEvent.PROPERTY_CHANGE)
                ev.property=name;
                ev.newValue=value;
                this.dispatchEvent(ev);
            }
        }

        /**
         * 获取属性
         * @param name
         * @returns {*}
         */
        this.getProperty=function(name)
        {
            return dataset[ name ];
        }

        /**
         * 检查是否有指定的属性名
         * @param name
         * @returns {boolean}
         */
        this.hasProperty=function(name)
        {
            return dataset.hasOwnProperty(name);
        }
    }
    BindData.prototype=new EventDispatcher();
    BindData.prototype.constructor=BindData;
    window.BindData=BindData;

})()