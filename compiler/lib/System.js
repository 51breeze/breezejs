var s={};
var packages={};
function getPrototypeOf(obj)
{
    if( typeof _Object.getPrototypeOf === "function" )
    {
        return _Object.getPrototypeOf(obj);
    }else
    {
        return obj.__proto__ || obj.constructor.prototype;
    }
}

/**
 * 对象类
 * @param value
 * @returns {*}
 * @constructor
 */
function Object( value )
{
    if( !(this instanceof Object) )
    {
        return new Object( value );
    }
    if( value )
    {
        var proto = getPrototypeOf(value);
        if ( proto && proto.constructor === Object )return value;
        if ( this.constructor === Object && isObject(value,true) )this.merge(true,value);
    }
}

Object.prototype = new _Object();
Object.prototype.isPrototypeOf = function( theClass )
{
    return _Object.isPrototypeOf.call(this, theClass);
}

/**
 * 表示对象是否已经定义了指定的属性。
 * 如果目标对象具有与 name 参数指定的字符串匹配的属性，则此方法返回 true；否则返回 false。
 * @param prop 对象的属性。
 * @returns {Boolean}
 */
Object.prototype.hasOwnProperty = function( name )
{
    return _Object.hasOwnProperty.call(this,name)
}

/**
 * 表示指定的属性是否存在、是否可枚举。
 * 如果为 true，则该属性存在并且可以在 for..in 循环中枚举。该属性必须存在于目标对象上，
 * 原因是：该方法不检查目标对象的原型链。您创建的属性是可枚举的，但是内置属性通常是不可枚举的。
 * @param name
 * @returns {Boolean}
 */
Object.prototype.propertyIsEnumerable = function( name )
{
    var proto = getPrototypeOf(this);
    if( proto.constructor !== Object )
    {
       var desc = proto.constructor.prototype[ name ];
       if( !desc || typeof desc.value === "function" )return false;
       return !!desc.enumerable;
    }
    return _Object.propertyIsEnumerable.call(this,name);
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
    var proto = getPrototypeOf(this);
    if( proto.constructor !== Object )
    {
       var proto = proto.constructor.prototype;
       if( typeof proto[name] === 'object' && typeof proto[name].enumerable !== "undefined" )
       {
           proto[name].enumerable = isEnum !== false;
       }

    }else
    {
        _Object.defineProperty(this, name,{enumerable:isEnum !== false });
    }
}

/**
 * 返回指定对象的原始值
 * @returns {String}
 */
Object.prototype.valueOf=function()
{
    var proto = getPrototypeOf(this);
    if( proto.constructor !== Object )
    {
        var str = proto.constructor.toString();
        var end = str.indexOf('(');
        str = str.substr(9, end-9 );
        return '[class ' + str + ']';

    }else
    {
        return _Object.prototype.valueOf.call( this );
    }
}

/**
 * 返回指定对象的字符串表示形式。
 * @returns {String}
 */
Object.prototype.toString=function()
{
    return this.valueOf();
}

/**
 * 合并其它参数到指定的 target 对象中
 * 如果只有一个参数则只对本身进行扩展。
 * @param deep true 深度合并
 * @param target object 目标源对象
 * @param ...valueObj object 待合并到目标源上的对象
 * @returns Object
 */
Object.prototype.merge = function()
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
        target = this;
        --i;
    }else if ( typeof target !== "object" &&  typeof target !== "function" )
    {
        target = {};
    }

    for ( ; i < length; i++ )
    {
        if ( (options = arguments[ i ]) != null )
        {
            for ( name in options )
            {
                src = target[ name ];
                copy = options[ name ];
                if ( target === copy )continue;
                if ( deep && copy && ( isObject(copy) || ( copyIsArray = isArray(copy) ) ) )
                {
                    if ( copyIsArray )
                    {
                        copyIsArray = false;
                        clone = src && isArray(src) ? src : [];
                    } else
                    {
                        clone = src && isObject(src) ? src : {};
                    }
                    target[ name ] = Object.prototype.merge.call(this, deep, clone, copy );
                } else if ( typeof copy !== "undefined" )
                {
                    target[ name ] = copy;
                }
            }
        }
    }
    return target;
}

/**
 * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
 * @param callback 一个回调函数。
 * 参数中的第一个为属性值，第二个为属性名。
 * 如果返回 false 则退出循环
 * @returns {Object}
 */
Object.prototype.forEach=function( callback )
{
      if( isObject(this) )
      {
          for(var i in this)if( callback.call(this, this[i], i ) === false )return this;
      }
      return this;
}

Object.prototype.constructor = Object;
s.Object = Object;


/**
 * 类对象构造器
 * @param descriptor
 * @returns {Class}
 * @constructor
 */
function Class( descriptor )
{
    this.merge( descriptor );
    if( typeof descriptor.factory === "function" )
    {
        descriptor.factory.prototype = new Object();
        descriptor.factory.prototype.constructor = descriptor.factory;
    }
    packages[ descriptor.package ? descriptor.package+'.'+descriptor.classname : descriptor.classname ] = this;
}
Class.prototype                  = new Object();
Class.prototype.constructor      = Class;
Class.prototype.factory          = null;
Class.prototype.extends          = null;
Class.prototype.static           = null;
Class.prototype.proto            = null;
Class.prototype.token            = '';
Class.prototype.classname        = '';
Class.prototype.package          = '';
Class.prototype.implements       = [];
Class.prototype.final            = false;
Class.prototype.dynamic          = false;
s.Class = Class;

/**
 * 返回对象的字符串表示形式
 * @param object
 * @returns {*}
 */
s.typeof=function( object )
{
    if( object instanceof Class )return 'class';
    return typeof object;
}

/**
 * 检查实例对象是否属于指定的类型(不会检查接口类型)
 * @param object
 * @param theClass
 * @returns {boolean}
 */
s.instanceof=function(object, theClass)
{
    if( typeof object !== "object" || !theClass )return false;
    if( theClass instanceof Class )
    {
        while( object && object.factory )
        {
            if( object.factory === theClass )return true;
            object=object.factory.extends;
        }
        return false;
    }
    if( typeof theClass !== "function" )return false;
    return object instanceof theClass;
}

/**
 * 检查实例对象是否属于指定的类型(检查接口类型)
 * @param object
 * @param theClass
 * @returns {boolean}
 */
s.is=function(object, theClass)
{
    if( typeof object !== "object" || !theClass )return false;
    if( theClass instanceof Class )
    {
        while( object && object.constructor )
        {
            if( object.constructor === theClass )return true;
            if( object.implements && object.implements.length > 0 )
            {
                for (var b in object.implements)
                {
                    if( object.implements[b]===theClass ) return true;
                }
            }
            object=object.constructor.extends;
        }
        return false;
    }
    if( typeof theClass !== "function" )return false;
    return object instanceof theClass;
}


/**
 * 为指定的类创建一个新的实例对象
 * @param fn
 * @param param
 * @returns {nop}
 */
function nop(fn, param ) {fn.apply(this, param); return this;}
s.new=function( theClass , param)
{
    var fn = theClass instanceof Class ? theClass.factory : theClass;
    var obj;
    if( typeof fn !== "function" )throw new TypeError('is not constructor');
    if( !(param instanceof Array) )
    {
        obj = new fn( param );
    }else
    {
        nop.prototype = fn.prototype;
        obj = new nop(fn, param);
        nop.prototype = null;
    }
    obj.constructor = theClass;
    return obj;
}

/**
 * 根据指定的类名获取类的对象
 * @param name
 * @returns {Object}
 */
function getDefinitionByName( name )
{
    if( packages[ name ] )return packages[ name];
    for ( var i in packages )if( i=== name )return packages[i];
    if( globals[name] )return globals[name];
    throw new TypeError( '"'+name+'" is not define');
}
s.getDefinitionByName =getDefinitionByName;

/**
 * 返回对象的完全限定类名
 * @param value 需要完全限定类名称的对象。
 * 可以将任何类型、对象实例、原始类型和类对象
 * @returns {string}
 */
 function getQualifiedClassName( value )
 {
     switch ( typeof value )
     {
         case 'boolean': return 'Boolean';
         case 'number' : return 'Number' ;
         case 'string' : return 'String' ;
         case 'regexp' : return 'RegExp' ;
     }

     if( isObject(value,true) )return 'Object';
     if( isArray(value) )return 'Array';
     for( var classname in packages )
     {
         if( value.constructor === packages[ classname ] )
         {
             return classname;
         }
     }
     throw new TypeError('type does exits');
}
s.getQualifiedClassName=getQualifiedClassName;

/**
 * 获取指定实例对象的超类名称
 * @param value
 * @returns {string}
 */
function getQualifiedSuperclassName(value)
{
    var classname = getQualifiedClassName( value )
    if (classname)
    {
        var classModule = getDefinitionByName( classname );
        var parentModule = classModule.descriptor.extends;
        if ( parentModule )
        {
            var classname = parentModule.descriptor.classname;
            return parentModule.descriptor.package ? parentModule.descriptor.package +'.'+ classname : classname;
        }
    }
    return null;
}
s.getQualifiedSuperclassName=getQualifiedSuperclassName;

/**
 * 判断是否为一个可遍历的对象
 * @param val
 * @param flag 默认为 false。如为true表示一个纯对象
 * @returns {boolean}
 */
function isObject(val , flag )
{
    var proto = getPrototypeOf(val);
    var result = val ? (proto.constructor === Object || proto.constructor===_Object) : false;
    if( !result && flag !== true && isArray(val) )return true;
    return result;
};
s.isObject=isObject;

/**
 * 检查所有传入的值定义
 * 如果传入多个值时所有的都定义的才返回true否则为false
 * @param val,...
 * @returns {boolean}
 */
function isDefined()
{
    var i=arguments.length;
    while( i>0 ) if( typeof arguments[ --i ] === 'undefined' )return false;
    return true;
};
s.isDefined=isDefined;

/**
 * 判断是否为数组
 * @param val
 * @returns {boolean}
 */
function isArray(val )
{
    return val instanceof Array;
};
s.isArray =  isArray;


/**
 * 判断是否为函数
 * @param val
 * @returns {boolean}
 */
function isFunction( val ){
    return typeof val === 'function';
};
s.isFunction=isFunction;

/**
 * 判断是否为布尔类型
 * @param val
 * @returns {boolean}
 */
function isBoolean( val ){
    return typeof val === 'boolean';
};
s.isBoolean=isBoolean;

/**
 * 判断是否为字符串
 * @param val
 * @returns {boolean}
 */
function isString(val )
{
    return typeof val === 'string';
};
s.isString=isString;

/**
 * 判断是否为一个标量
 * 只有对象类型或者Null不是标量
 * @param {boolean}
 */
function isScalar(val )
{
    var t=typeof val;
    return t==='string' || t==='number' || t==='float' || t==='boolean';
};
s.isScalar=isScalar;

/**
 * 判断是否为数字类型
 * @param val
 * @returns {boolean}
 */
function isNumber(val )
{
    return typeof val === 'number';
};
s.isNumber=isNumber;

/**
 * 判断是否为一个空值
 * @param val
 * @param flag 当有true时是否包含为0的值
 * @returns {boolean}
 */
function isEmpty(val , flag )
{
    if( !val && ( !flag || val !== 0 ) )return true;
    if( isObject(val,true) )
    {
        var ret;
        for( ret in val )break;
        return typeof ret === "undefined";
    }else if( isArray(val) )
    {
        return val.length === 0;
    }
    return false;
};
s.isEmpty=isEmpty;


s.define=function( name, module )
{
    if( typeof module=== "undefined" )return packages[name];
    packages[name] = module;
}

s.task = {
    queues:{},
    add:function (name, callback) {
        s.task.queues[name] = callback;
    },
    execute:function () {
        for(var i in s.task.queues )
        {
            s.task.queues[ i ]( packages[i] );
        }
    }
}
