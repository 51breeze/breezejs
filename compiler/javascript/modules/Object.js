/**
 * 对象类构造器
 * @param value
 * @returns {*}
 * @constructor
 * @require System;
 */
function Object( value )
{
    if ( value != null )return $Object(value);
    if( !(this instanceof Object) ) return new Object();
    return this;
};
System.Object = Object;
Object.prototype = new $Object();
Object.prototype.constructor=Object;
Object.create = $Object.create;

/**
 * 合并其它参数到指定的 target 对象中
 * 如果只有一个参数则只对本身进行扩展。
 * @param deep true 深度合并
 * @param target object 目标源对象
 * @param ...valueObj object 待合并到目标源上的对象
 * @returns Object
 */
Object.merge =function merge()
{
    var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false;
    if ( typeof target === "boolean" )
    {
        deep = target;
        target = arguments[1] || {};
        i++;
    }
    if ( length === i )
    {
        target = {};
        --i;
    }else if ( typeof target !== "object" && typeof target !== "function" )
    {
        target = {};
    }

    for ( ; i < length; i++ )
    {
        if ( (options = arguments[ i ]) != null )
        {
            for ( name in options )
            {
                src =  System.Reflect.get(target,name);
                copy = System.Reflect.get(options,name);
                if ( target === copy )continue;
                if ( deep && copy && ( System.isObject(copy,true) || ( copyIsArray = System.isArray(copy) ) ) )
                {
                    if ( copyIsArray )
                    {
                        copyIsArray = false;
                        clone = src && System.isArray(src) ? src : [];
                    } else
                    {
                        clone = src && System.isObject(src) ? src : {};
                    }
                    System.Reflect.set(target, name ,Object.merge( deep, clone, copy ) )

                } else if ( typeof copy !== "undefined" )
                {
                    System.Reflect.set(target,name,copy);
                }
            }
        }
    }
    return target;
}

/**
 * @private
 * 设置对象的原型链
 * @returns {Object}
 */
var $setPrototypeOf = $Object.setPrototypeOf || function setPrototypeOf(obj, proto)
{
    obj.__proto__ = proto;
    return obj;
}

/**
 * @internal Object.setPrototypeOf
 */
Object.setPrototypeOf = $setPrototypeOf;

/**
 * 定义属性描述
 * @internal Object.defineProperty
 */
Object.defineProperty = $Object.defineProperty;

/**
 * 指示 Object 类的实例是否在指定为参数的对象的原型链中
 * @param theClass
 * @returns {Boolean}
 */
var $isPrototypeOf = $Object.prototype.isPrototypeOf;
Object.prototype.isPrototypeOf = function( theClass )
{
    if( this instanceof System.Class )
    {
        var protoClass = this.constructor.prototype;
        var objClass = theClass;
        while ( objClass )
        {
            if (objClass === protoClass)return true;
            objClass = objClass.extends;
            if( !(objClass instanceof System.Class) )
            {
                return Object === protoClass;
            }
        }
    }
    return $isPrototypeOf.call( this, theClass);
}

/**
 * 表示对象本身是否已经定义了指定的属性。
 * 如果目标对象具有与 name 参数指定的字符串匹配的属性，则此方法返回 true；否则返回 false。
 * @param prop 对象的属性。
 * @returns {Boolean}
 */
var $hasOwnProperty = $Object.prototype.hasOwnProperty;
Object.prototype.hasOwnProperty = function( name )
{
    if( this instanceof System.Class )
    {
        var objClass = this.constructor.prototype;
        var isstatic = objClass === this;
        var desc;
        do {
            desc = isstatic ? objClass.static : objClass.proto;
            if( $hasOwnProperty.call(desc,name) )
            {
                var qualifier = desc[name].qualifier;
                return qualifier === undefined || qualifier === 'public';

            }else if( !isstatic )
            {
                var refObj = this[objClass.token];
                if( $hasOwnProperty.call(refObj,name) )
                {
                    return true;
                }
            }
        }while( (objClass = objClass.extends) && objClass instanceof System.Class );
        return false;
    }
    return $hasOwnProperty.call(this,name);
}

/**
 * 表示指定的属性是否存在、是否可枚举。
 * 如果为 true，则该属性存在并且可以在 for..in 循环中枚举。该属性必须存在于目标对象上，
 * 原因是：该方法不检查目标对象的原型链。您创建的属性是可枚举的，但是内置属性通常是不可枚举的。
 * @param name
 * @returns {Boolean}
 */
var $propertyIsEnumerable=$Object.prototype.propertyIsEnumerable;
Object.prototype.propertyIsEnumerable = function propertyIsEnumerable( name )
{
    if( this instanceof System.Class )
    {
        var objClass = this.constructor.prototype;
        //动态创建的属性才可以枚举
        if( objClass.dynamic===true && objClass !== this )
        {
            do{
                if( $hasOwnProperty.call(this[objClass.token], name) )
                {
                    var proto = objClass.proto;
                    //内置属性不可以枚举
                    if( !$hasOwnProperty.call(proto,name) )return true;
                    return proto[name].id==='dynamic' && proto[name].enumerable !== false;
                }
            }while ( (objClass = objClass.extends ) && objClass.dynamic && objClass instanceof System.Class );
        }
        return false;
    }
    if( $hasOwnProperty.call(this,name) && this[name].enumerable === false && !!System.Descriptor && this[name] instanceof System.Descriptor)
        return false;
    return $propertyIsEnumerable.call(this,name);
}

/**
 * 设置循环操作动态属性的可用性。
 * 该属性必须存在于目标对象上，原因是：该方法不检查目标对象的原型链。
 * @param name 对象的属性
 * @param isEnum  (default = true)
 * 如果设置为 false，则动态属性不会显示在 for..in 循环中，且方法 propertyIsEnumerable() 返回 false。
 */
Object.prototype.setPropertyIsEnumerable = function setPropertyIsEnumerable( name, isEnum )
{
    if( this instanceof System.Class )
    {
        var objClass = this.constructor.prototype;
        //动态创建的属性才可以设置枚举
        if( objClass.dynamic === true && objClass !== this )
        {
            do{
                if( $hasOwnProperty.call(this[objClass.token], name) )
                {
                    var desc;
                    //内置属性不可以枚举
                    if( !$hasOwnProperty.call(objClass.proto,name) )
                    {
                        desc = {'id':'dynamic',enumerable:false};
                        objClass.proto[name]=desc;
                    }else
                    {
                        desc= objClass.proto[name];
                    }
                    desc.enumerable=isEnum !== false;
                    return true;
                }
            }while ( (objClass = objClass.extends ) && objClass.dynamic && objClass instanceof System.Class );
        }
        return false;
    }
    return false;
}

/**
 * 返回对象可枚举的属性的键名
 * @returns {Array}
 */
Object.prototype.keys=function()
{
    return Object.prototype.getEnumerableProperties.call(this,-1);
}

/**
 * 返回对象可枚举的属性值
 * @returns {Array}
 */
Object.prototype.values=function()
{
    return Object.prototype.getEnumerableProperties.call(this,1);
}

/**
 * 获取可枚举的属性
 * @param state
 * @returns {Array}
 * @internal Object.prototype.getEnumerableProperties
 */
Object.prototype.getEnumerableProperties=function getEnumerableProperties( state )
{
    var items=[];
    var prop;
    if( this instanceof System.Class )
    {
        var objClass = this.constructor.prototype;
        if ( objClass.dynamic && this !== objClass )
        {
            do {
                obj = this[objClass.token];
                if (obj)for(prop in obj)
                {
                    var proto = objClass.proto;
                    if( !$hasOwnProperty.call(proto, prop) ||
                    ( $propertyIsEnumerable.call(proto,prop) && proto[prop].enumerable !== false) )
                    {
                        switch (state){
                            case -1 : items.push(prop); break;
                            case  1 : items.push( obj[prop] ); break;
                            case  2 : items[prop] = obj[prop]; break;
                            default : items.push({key: prop, value: obj[prop]}); break;
                        }
                    }
                }
            } while ( (objClass = objClass.extends ) && objClass.dynamic && objClass instanceof Class );
        }

    }else if( this && typeof this !== "function" )
    {
        for( prop in this )if( $propertyIsEnumerable.call(this,prop) && !( this[prop] && this[prop].enumerable === false) )
        {
            var val = System.Reflect.get(this,prop);
            switch (state){
                case -1 : items.push(prop); break;
                case  1 : items.push(val); break;
                case  2 : items[prop] = val; break;
                default : items.push({key: prop, value: val}); break;
            }
        }
    }
    return items;
}