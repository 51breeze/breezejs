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
     * @constructor
     */
    function BindData( target )
    {
        if( !(this instanceof BindData) )
            return new BindData( target );

        //初始化父类
        Breeze.EventDispatcher.call(this);

        /**
         * @private
         * @type {Breeze.Dictionary}
         */
        var subscription= new Breeze.Dictionary()
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
                            if( Breeze.isHTMLElement(object) )
                            {
                                property=Breeze.isFormElement( object ) ? 'value' : 'innerHTML' ;
                                setAttr(object,property,newValue);

                            }else if( object instanceof Breeze.BindData || object instanceof Breeze )
                            {
                                object.setProperty(property,newValue)

                            } else if( Breeze.isObject(object,true) )
                            {
                                object[ property ]= newValue;
                            }
                        }
                    }
                }
            }
        }

        //监听当前绑定对象的属性。
        if( !(target instanceof Breeze.EventDispatcher) )
            target=Breeze.EventDispatcher.call( this,target );

        target.addEventListener(Breeze.PropertyEvent.PROPERTY_CHANGE,function(event)
        {
            if( event instanceof Breeze.PropertyEvent )
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
            if( Breeze.isString( target ) )
            {
                var i,items=Sizzle(target);
                for( i in items )
                    this.bind(items[i],property,callback);

            }else if( Breeze.isObject(target,true) )
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
                Breeze.isDefined(property) ? delete obj[ property ] : subscription.remove(target);
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
            Breeze.isObject(name,true) ?  dataset=name : dataset[name]=value;
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
                var ev=new Breeze.PropertyEvent(Breeze.PropertyEvent.PROPERTY_CHANGE)
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
    BindData.prototype=new Breeze.EventDispatcher();
    BindData.prototype.constructor=BindData;
    Breeze.BindData=BindData;

})()