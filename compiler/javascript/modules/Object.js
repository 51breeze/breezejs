/**
 * 对象类构造器
 * @param value
 * @returns {*}
 * @constructor
 * @require System,Internal.$get,Internal.$set;
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
                src =  $get(target,name);
                copy = $get(options,name);
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
                   $set(target, name ,Object.merge( deep, clone, copy ) )

                } else if ( typeof copy !== "undefined" )
                {
                    $set(target,name,copy);
                }
            }
        }
    }
    return target;
}

/**
 * @internal Object.setPrototypeOf
 * 设置对象的原型链
 * @returns {Object}
 */
Object.setPrototypeOf = $Object.setPrototypeOf || function setPrototypeOf(obj, proto)
{
    obj.__proto__ = proto;
    return obj;
}

/**
 * 定义属性描述
 */
Object.defineProperty = $Object.defineProperty;

/**
 * 获取对象的原型
 * @internal Object.getPrototypeOf
 */
Object.getPrototypeOf = $Object.getPrototypeOf;

/**
 * 生成一个对象
 * @internal Object.create
 */
Object.create = $Object.create;

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
            objClass = $get(objClass,"extends");
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
            desc = isstatic ? $get(objClass,"static") : $get(objClass,"proto");
            if( $hasOwnProperty.call(desc,name) )
            {
                var qualifier = $get( $get(desc,name),"qualifier");
                return typeof qualifier === "undefined" || qualifier === 'public';

            }else if( !isstatic )
            {
                var refObj = $get(this,$get(objClass,"token"));
                if( $hasOwnProperty.call(refObj,name) )
                {
                    return true;
                }
            }
        }while( (objClass = $get(objClass,"extends") ) && objClass instanceof System.Class );
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
    var isClass = this instanceof System.Class;
    var objClass = isClass ? this.constructor.prototype : null;
    var token;
    var proto;
    if( isClass && objClass)
    {
        //静态类没有可枚举的属性
        if( this === objClass )return items;
        token = $get(objClass,'token');
        proto = $get(objClass,'proto');
    }
    if( $hasOwnProperty.call(this,name) )
    {
        if( name !== token && $propertyIsEnumerable.call(this,name)  )
        {
            if( proto && $hasOwnProperty.call(proto, name) )
            {
                //动态创建的属性通过设置变得不可枚举
                if( proto[name].id==='dynamic' && proto[name].enumerable === false )return false;

                //通过对象的定义属性设置不可枚举
                if( proto[name].enumerable === false && System.Descriptor && proto[name] instanceof System.Descriptor )return false;
            }
            return true;
        }
        return false;
    }
    return false;
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
        if( $get(objClass,"dynamic") === true && objClass !== this )
        {
            var token = $get(objClass,"token");
            if( name === token )return false;
            if( $hasOwnProperty.call(this, name) )
            {
                var desc;
                var proto = $get(objClass,'proto');
                //内置属性不可以枚举
                if( !$hasOwnProperty.call(proto,name) )
                {
                    desc = {'id':'dynamic',enumerable:false};
                    proto[name]=desc;
                }else
                {
                    desc= proto[name];
                }
                desc.enumerable=isEnum !== false;
                return true;
            }
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
    var isClass = this instanceof System.Class;
    var objClass = isClass ? this.constructor.prototype : null;
    var token;
    var proto;
    do {
        if( isClass && objClass)
        {
            //静态类没有可枚举的属性
            if( this === objClass )return items;
            token = $get(objClass,'token');
            proto = $get(objClass,'proto');
        }
        for(prop in this)
        {
            if( prop !== token && $propertyIsEnumerable.call(this,prop) && $hasOwnProperty.call(this,prop) )
            {
                if( !(proto && $hasOwnProperty.call(proto, prop) && proto[prop].id==='dynamic' && proto[prop].enumerable === false) )
                {
                    switch (state){
                        case -1 : items.push(prop); break;
                        case  1 : items.push( $get(this,prop) ); break;
                        case  2 : items[prop] = $get(this,prop); break;
                        default : items.push({key: prop, value: $get(this,prop)}); break;
                    }
                }
            }
        }
    } while ( isClass && (objClass = $get(objClass,"extends") ) && $get(objClass,"dynamic")===true && objClass instanceof System.Class );
    return items;
}