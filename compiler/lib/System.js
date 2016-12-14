module.exports = (function (_Object, _String, _Array)
{
    const globals= require('./Globals.js');
    const packages={};
    const s={};

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
        if( value && this.constructor === Object )
        {
           this.merge(value);
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
        if( this instanceof Class )
        {
           var desc = this.constructor.prototype[ name ];
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
        if( this instanceof Class )
        {
           var proto = this.constructor.prototype;
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
        if( this instanceof Class )
        {
            var str = this.constructor.toString();
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
                    if ( target === copy )
                    {
                        continue;
                    }
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
                        target[ name ] = this.merge( deep, clone, copy );
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
     * @param classname
     * @param constructor
     * @param descriptor
     * @param prototype
     * @param properties
     * @returns {Class}
     * @constructor
     */
    function Class(descriptor,prototype,properties)
    {

        if( !(this instanceof Class) )return new Class(descriptor,prototype,properties);
        if( typeof descriptor.constructor !=='function' )throw new TypeError('Invalid constructor.');

        descriptor.constructor.prototype = this;

        //实例属性
        Object.prototype.forEach.call(prototype || {},function(item, prop){
            descriptor.constructor.prototype[ prop ] = item;
        });

        //静态属性
        Object.prototype.forEach.call(properties || {},function(item, prop){
            descriptor.constructor[ prop ] = item;
        });

        //构造函数
        descriptor.constructor.prototype.constructor = descriptor.constructor;

        //将类定义到包中
        packages[ descriptor.filename ] = descriptor;
        return descriptor;
    }
    Class.prototype = new Object();
    Class.prototype.constructor = Class;
    s.Class = Class;


    /**
     * 根据指定的类名获取类的对象
     * @param name
     * @returns {Object}
     */
    function getDefinitionByName( name )
    {
        var obj = getDefinitionDescriptorByName(name);
        return obj.constructor;
    }
    s.getDefinitionByName =getDefinitionByName;

    /**
     * 根据指定的类名获取类的对象
     * @param name
     * @returns {Object}
     */
    function getDefinitionDescriptorByName( name )
    {
        if( packages[ name ] )return packages[ name];
        for ( var i in packages )if( i=== name )return packages[i];
        if( globals[name] )return globals[name];
        throw new TypeError( '"'+name+'" is not define');
    }
    s.getDefinitionDescriptorByName =getDefinitionDescriptorByName;


    /**
     * 返回对象的完全限定类名
     * @param value 需要完全限定类名称的对象。
     * 可以将任何类型、对象实例、原始类型和类对象
     * @returns {string}
     */
     function getQualifiedClassName( value )
     {
         var refModule = value.prototype instanceof Class || value instanceof Class ? packages : globals;
         for( var classname in refModule )
         {
             if( value === refModule[ classname ].constructor || value.constructor === refModule[ classname ].constructor )
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
            var descriptor = getDefinitionDescriptorByName( classname );
            if ( descriptor && descriptor.inherit )
            {
                if( descriptor.import[ descriptor.inherit ] )return descriptor.import[ descriptor.inherit ];
                return globals[ descriptor.inherit ] || null;
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
        var result = val ? (val.constructor === Object || val.constructor===_Object) : false;
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
    return s;

}(Object, String, Array));
