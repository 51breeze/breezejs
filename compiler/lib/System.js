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
        if( value )
        {
           this.merge(value);
        }
    }

    Object.prototype = new _Object();
    Object.prototype.isPrototypeOf = function( theClass )
    {
        return _Object.isPrototypeOf.call(this, theClass);
    }

    Object.prototype.getPrototypeOf = function( obj )
    {
        return _Object.getPrototypeOf( obj );
    }

    Object.prototype.hasOwnProperty = function( prop )
    {
        return _Object.hasOwnProperty.call(this,prop)
    }

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

    Object.prototype.toString=function()
    {
        return this.valueOf();
    }

    Object.prototype.defineProperty=function (prop, desc)
    {
        if( typeof _Object.defineProperty === 'function' )
        {
            _Object.defineProperty(this, prop, desc);
            return this;
        }

        if( typeof prop !== 'string' )throw TypeError('Invalid prop name');
        if( typeof desc !== 'object' || !desc )throw TypeError('Property description must be an object:'+desc );

        var d = {};
        if( this.hasOwnProperty.call(desc,"enumerable") )d.enumerable = !!desc.enumerable;
        if (this.hasOwnProperty.call(desc, "configurable"))d.configurable = !!desc.configurable;
        if (this.hasOwnProperty.call(desc, "value"))d.value = desc.value;
        if (this.hasOwnProperty.call(desc, "writable"))d.writable = !!desc.writable;
        if (this.hasOwnProperty.call(desc, "get") )
        {
            if ( typeof desc.get !== "function" )throw new TypeError("bad getter");
            d.get = desc.get;
        }
        if( this.hasOwnProperty.call(desc, "set") )
        {
            if ( typeof desc.set !== "function" )throw new TypeError("bad setter");
            d.set = desc.set;
        }
        if ( ("get" in d || "set" in d) && ("value" in d || "writable" in d) )throw new TypeError("identity-confused descriptor");
        this[prop]=d;
        return this;
    }

    Object.prototype.defineProperties = function(props)
    {
        if( typeof _Object.defineProperties === 'function' )
        {
            _Object.defineProperties(this, props );
            return this;
        }
        if ( typeof obj !== "object" || !obj )throw new TypeError("Invalid object");
        for( var p in props )
        {
            if( this.hasOwnProperty.call(props, p) )
            {
                this.defineProperty(p, props[p] );
            }
        }
        return this;
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

    Object.prototype.constructor = Object;
    s.Object = Object;

    /**
     * 类对象
     * @constructor
     */
    function Class(){}
    Class.prototype = new Object();
    Class.prototype.constructor = Class;
    s.Class = Class;

    /**
     * 注册类模块
     * @param classname
     * @param classModule
     * @returns {*}
     */
    s.registerClassModule=function( classname, classModule )
    {
        if( typeof classname !== 'string' )
        {
           throw new Error('Invalid class name');
        }

        var is=false;
        if( typeof classModule === 'function' )
        {
            is = Object.prototype.getPrototypeOf(classModule.prototype).constructor === Class ;
        }else
        {
            is = Object.prototype.isPrototypeOf.call(classModule, Class );
        }

        if( !is )
        {
            throw new Error('Invalid class module');
        }
        packages[ classname ] = classModule;
        return classModule;
    }

    /**
     * 根据指定的类名获取类的对象
     * @param name
     * @returns {Object}
     */
    s.getDefinitionByName = function( name )
    {
        if( packages[ name ] )return packages[ name ].constructor;
        for ( var i in packages )if( i=== name )return packages[i].constructor;
        if( globals[name] )return globals[name].constructor;
        return null;
    }

    /**
     * 获取指定实例对象的类名
     * @param value
     * @returns {string}
     */
     s.getQualifiedClassName=function( value )
     {
         var val=null;
         if( value instanceof s.Class )val = value.__classname__;
         if( !val && value && value.prototype && value.prototype.constructor )
         {
             for (var i in globals)
             {
                 if ( value.prototype.constructor === globals[i].constructor )
                 {
                     var str = Object.prototype.toString().call(value)
                     var end = str.indexOf('(');
                     return str.substr(9, end);
                 }
             }
         }
         return null;
    }

    /**
     * 获取指定实例对象的超类名称
     * @param value
     * @returns {string}
     */
    s.getQualifiedSuperclassName=function(value)
    {
        var filename = getQualifiedClassName( value )
        if (filename)
        {
            var classModule = s.getDefinitionByName( filename );
            if ( classModule )
            {
                return typeof classModule.inherit === "string" ? getDefinitionByName( classModule.inherit ) : classModule.inherit;
            }
        }
        return null;
    }

    /**
     * 判断是否为一个可遍历的对象
     * @param val
     * @param flag true 表示包括数组， 否则只能是一个纯对象
     * @returns {boolean}
     */
    function isObject(val , flag )
    {
        return val && typeof val === "object" ? !!( val.constructor === Object || ( flag && isArray(val) ) ) : false;
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
