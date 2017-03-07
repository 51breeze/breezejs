/**
 * 对象类构造器
 * @param value
 * @returns {*}
 * @constructor
 */
var Object = function Object( value )
{
    if ( value != null )return $Object(value);
    if( !(this instanceof Object) ) return new Object();
    return this;
};
Object.prototype = new $Object();
Object.prototype.constructor=Object;
Object.create = $Object.create;

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
 * 合并其它参数到指定的 target 对象中
 * 如果只有一个参数则只对本身进行扩展。
 * @param deep true 深度合并
 * @param target object 目标源对象
 * @param ...valueObj object 待合并到目标源上的对象
 * @returns Object
 */
Object.merge = function()
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
                if ( deep && copy && ( isObject(copy,true) || ( copyIsArray = isArray(copy) ) ) )
                {
                    if ( copyIsArray )
                    {
                        copyIsArray = false;
                        clone = src && isArray(src) ? src : [];
                    } else
                    {
                        clone = src && isObject(src) ? src : {};
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
 * 指示 Object 类的实例是否在指定为参数的对象的原型链中
 * @param theClass
 * @returns {Boolean}
 */
var $isPrototypeOf = $Object.prototype.isPrototypeOf;
Object.prototype.isPrototypeOf = function( theClass )
{
    var proto = Object.getPrototypeOf(this);
    var obj = this instanceof Class ? this : $get(proto,"constructor");
    if( obj instanceof Class )
    {
        var classObj = theClass;
        while ( classObj )
        {
            if (classObj === obj)return true;
            classObj = $get(classObj,"extends");
            if( !(classObj instanceof Class) && Object === obj )
            {
                return true;
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
    var objClass = this instanceof Class ? this : $get(this,"constructor");
    if( objClass instanceof Class )
    {
        var isstatic = objClass === this;
        var desc;
        do {
            desc = isstatic ? $get(objClass,"static") : $get(objClass,"proto");
            if( $hasOwnProperty.call(desc,name) )
            {
                var qualifier = $get( $get(desc, name),'qualifier');
                return qualifier === undefined || qualifier === 'public';

            }else if( !isstatic )
            {
                var refObj = $get( this, $get(objClass,"token") );
                if( $hasOwnProperty.call(refObj,name) )
                {
                    return true;
                }
            }
            objClass = $get(objClass,"extends");
            if( !(objClass instanceof Class) )
            {
                return !!(objClass||Object).prototype[propertyKey];
            }
        }while ( objClass );
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
Object.prototype.propertyIsEnumerable = function( name )
{
    var obj = this instanceof Class ? this : $get(this,"constructor");
    if( obj instanceof Class )
    {
        //动态创建的属性才可以枚举
        if( $get(obj,"dynamic")===true && obj !== this )
        {
            do{
                if( $hasOwnProperty.call(this[obj.token], name) )
                {
                    var proto = $get(obj,'proto');
                    //内置属性不可以枚举
                    if( !$hasOwnProperty.call(proto,name) )return true;
                    return $get( $get(proto,name),"id")==='dynamic' && $get( $get( proto,name),"enumerable") !== false;
                }
            }while ( (obj = $get(obj,"extends") ) && $get(obj,"dynamic") && obj instanceof Class );
        }
        return false;
    }
    if( $hasOwnProperty.call(this,name) && this[name].enumerable === false && this[name] instanceof Descriptor)
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
Object.prototype.setPropertyIsEnumerable = function( name, isEnum )
{
    var obj = this instanceof Class ? this : $get(this,"constructor");
    if( obj instanceof Class )
    {
        //动态创建的属性才可以设置枚举
        if( $get(obj,"dynamic") === true && obj !== this )
        {
            do{
                if( $hasOwnProperty.call(this[obj.token], name) )
                {
                    var desc;
                    //内置属性不可以枚举
                    if( !$hasOwnProperty.call(obj.proto,name) )
                    {
                        desc = {'id':'dynamic',enumerable:false};
                        $set( $get(obj,'proto') , name, desc);
                    }else
                    {
                        desc= $get( $get(obj,'proto') , name);
                    }
                    $set( desc, "enumerable", isEnum !== false);
                    return true;
                }
            }while ( (obj = $get(obj,"extends") ) && $get(obj,"dynamic") && obj instanceof Class );
        }
        return false;

    }else if( $hasOwnProperty.call(this,name) )
    {
        Object.defineProperty(this, name, {enumerable:isEnum !== false});
        return true;
    }
    return false;
}

/**
 * 返回指定对象的原始值
 * @returns {String}
 */
var $valueOf = $Object.prototype.valueOf;
Object.prototype.valueOf=function()
{
    var obj = this instanceof Class ? this : $get(this,"constructor");
    if( obj instanceof Class )
    {
        return obj === this ? '[Class: '+$get(obj,"classname")+']' : '[object '+ $get(obj,"classname")+']';
    }else if( obj instanceof Interface )
    {
        return '[Interface: '+$get(obj,"classname") +']';
    }
    return $valueOf.call( this );
}

/**
 * 返回指定对象的字符串表示形式。
 * @returns {String}
 */
Object.prototype.toString=function()
{
    var obj = this instanceof Class ? this : $get(this,"constructor");
    if( obj instanceof Class )
    {
        return obj === this ? '[Class: '+$get(obj,"classname")+']' : '[object '+ $get(obj,"classname")+']';
    }else if( obj instanceof Interface )
    {
        return '[Interface: '+$get(obj,"classname") +']';
    }
    return $Object.prototype.toString.call( this );
}

/**
 * 返回对象可枚举的属性的键名
 * @returns {Array}
 */
Object.prototype.keys=function()
{
    return getEnumerableProperties.call(this,-1);
}

/**
 *  返回对象可枚举的属性值
 * @returns {Array}
 */
Object.prototype.values=function()
{
    return getEnumerableProperties.call(this,1);
}

/**
 * @private
 * 获取可枚举的属性
 * @param state
 * @returns {Array}
 */
function getEnumerableProperties( state )
{
    var items=[];
    var prop;
    var objClass = this instanceof Class ? this : $get(this,"constructor");
    if( objClass instanceof Class)
    {
        var obj;
        if ( $get(objClass,"dynamic") && this !== objClass )
        {
            do {
                obj = $get(this,objClass.token);
                if (obj)for(prop in obj)
                {
                    var proto = $get(objClass,'proto');
                    if( !$hasOwnProperty.call(proto, prop) ||
                    ( $propertyIsEnumerable.call(proto,prop) && $get( $get(proto,prop),"enumerable" ) !== false) )
                    {
                        switch (state){
                            case -1 : items.push(prop); break;
                            case  1 : items.push( obj[prop] ); break;
                            case  2 : items[prop] = obj[prop]; break;
                            default : items.push({key: prop, value: obj[prop]}); break;
                        }
                    }
                }
            } while ( (objClass = $get(objClass,"extends") ) && $get(objClass,"dynamic") && objClass instanceof Class );
        }

    }else if( this && typeof this !== "function" )
    {
        for( prop in this )if( $propertyIsEnumerable.call(this,prop) && !( this[prop] && this[prop].enumerable === false) )
        {
            var val = Reflect.get(this,prop);
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