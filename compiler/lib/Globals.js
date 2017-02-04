var globals = (function(_Object,_String,_Array,_Error, undefined )
{
    var g={};

    /**
     * 对象类构造器
     * @param value
     * @returns {*}
     * @constructor
     */
    function Object( value )
    {
        if( value !== undefined && value !== null )switch (typeof value)
        {
            case 'boolean' : return Boolean(value);
            case 'number'  : return Number(value);
            case 'regexp'  : return value;
            case 'string'  : return String(value);
        }
        if ( value && ( value instanceof Object || value instanceof Array ) )return value;
        if ( !(this instanceof Object) )return new g.Object(value);
        this.originValue = value ? value : {};
        return this;
    }

    Object.prototype = new _Object();
    Object.prototype.constructor=Object;
    Object.prototype.originValue=null;

    /**
     * 获取指定对象的原型
     * @type {Object}
     * @returns {Boolean}
     */
    Object.getPrototypeOf = _Object.getPrototypeOf;
    if( typeof Object.getPrototypeOf !== 'function' )
    {
        Object.getPrototypeOf = function getPrototypeOf(obj) {
            if( !obj )return null;
            return obj && obj.__proto__ ? obj.__proto__ : (obj.constructor ? obj.constructor.prototype : null);
        }
    }

    /**
     * 指示 Object 类的实例是否在指定为参数的对象的原型链中
     * @param theClass
     * @returns {Boolean}
     */
    var __isPrototypeOf = _Object.prototype.isPrototypeOf;
    Object.prototype.isPrototypeOf = function( theClass )
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            theClass = theClass instanceof Class ? theClass : theClass.constructor;
            while ( theClass instanceof Class )
            {
                if( obj=== theClass )return true;
                theClass = theClass.extends;
            }
            return false
        }
        return __isPrototypeOf.call(this, theClass );
    }

    /**
     * 表示对象是否已经定义了指定的属性。
     * 如果目标对象具有与 name 参数指定的字符串匹配的属性，则此方法返回 true；否则返回 false。
     * @param prop 对象的属性。
     * @returns {Boolean}
     */
    var __hasOwnProperty = _Object.prototype.hasOwnProperty;
    Object.prototype.hasOwnProperty = function( name )
    {
        var obj = this.constructor instanceof Class ? this.constructor : this;
        if( obj instanceof Class )
        {
            var desc = obj === this ? obj.static[name] : obj.proto[name];
            return desc && desc.id !== "function";
        }
        return __hasOwnProperty.call(this,name);
    }

    /**
     * 表示指定的属性是否存在、是否可枚举。
     * 如果为 true，则该属性存在并且可以在 for..in 循环中枚举。该属性必须存在于目标对象上，
     * 原因是：该方法不检查目标对象的原型链。您创建的属性是可枚举的，但是内置属性通常是不可枚举的。
     * @param name
     * @returns {Boolean}
     */
    var __propertyIsEnumerable=_Object.prototype.propertyIsEnumerable;
    Object.prototype.propertyIsEnumerable = function( name )
    {
        var obj = this.constructor instanceof Class ? this.constructor : this;
        if( obj instanceof Class )
        {
            var desc = obj === this ? obj.static[name] : obj.proto[ name ];
            if( !desc || desc.id === "function" )return false;
            return desc.enumerable===true;
        }
        return __propertyIsEnumerable.call(this,name);
    }

    /**
     * 设置循环操作动态属性的可用性。
     * 该属性必须存在于目标对象上，原因是：该方法不检查目标对象的原型链。
     * @param name 对象的属性
     * @param isEnum  (default = true)
     * 如果设置为 false，则动态属性不会显示在 for..in 循环中，且方法 propertyIsEnumerable() 返回 false。
     */
    var __defineProperty=_Object.defineProperty;
    Object.prototype.setPropertyIsEnumerable = function( name, isEnum )
    {
        var obj = this.constructor instanceof Class ? this.constructor : this;
        if( obj instanceof Class )
        {
            var desc = obj === this ? obj.static[name] : obj.proto[ name ];
            if( desc && typeof desc.enumerable !== "undefined" )
            {
                desc.enumerable = isEnum !== false;
            }

        }else
        {
            __defineProperty.call(this, name, {enumerable:isEnum !== false } );
        }
    }

    /**
     * 返回指定对象的原始值
     * @returns {String}
     */
    var __valueOf = _Object.prototype.valueOf;
    Object.prototype.valueOf=function()
    {
        var obj = this.constructor instanceof Class ? this.constructor : this;
        if( obj instanceof Class )
        {
            return obj === this ? '[class '+obj.classname+']' : '[object '+ obj.classname+']';
        }
        return __valueOf.call( this );
    }

    /**
     * 返回指定对象的字符串表示形式。
     * @returns {String}
     */
    var __toString = _Object.prototype.toString;
    Object.prototype.toString=function()
    {
        var obj = this.constructor instanceof Class ? this.constructor : this;
        if( obj instanceof Class )
        {
            return obj === this ? '[class '+obj.classname+']' : '[object '+ obj.classname+']';
        }
        return __toString.call( this );
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
            target = arguments[0] || new Object(),
            i = 1,
            length = arguments.length,
            deep = false;
        if ( typeof target === "boolean" )
        {
            deep = target;
            target = arguments[1] || new Object();
            i++;
        }
        if ( length === i )
        {
            target = this;
            --i;
        }else if ( typeof target !== "object" &&  typeof target !== "function" )
        {
            target = new Object();
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
                    if( typeof src === "function" && system.instanceof(target, Object) )
                    {
                        throwError('syntax','"'+name+'" is a protected method');
                    }
                    if ( deep && copy && ( isObject(copy,true) || ( copyIsArray = isArray(copy) ) ) )
                    {
                        if ( copyIsArray )
                        {
                            copyIsArray = false;
                            clone = src && isArray(src) ? src : new Array();
                        } else
                        {
                            clone = src && isObject(src) ? src : new Object();
                        }
                        target[ name ] = Object.prototype.merge( deep, clone, copy );
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
     * 返回对象可枚举的属性的键名
     * @returns {Array}
     */
    Object.prototype.keys=function()
    {
        var items=[];
        for(var key in this)items.push( key );
        return items;
    }

    /**
     *  返回对象可枚举的属性值
     * @returns {Array}
     */
    Object.prototype.values=function()
    {
        var items=[];
        for(var key in this)items.push( this[key] );
        return items;
    }

    /**
     * 数组构造器
     * @returns {Array}
     * @constructor
     */
    function Array()
    {
        _Array.prototype.splice.call(arguments,0);
        this.length = 0;
        return this;
    }
    Array.prototype = new Object();
    Array.prototype.constructor = Array;
    Array.prototype.length =0;

    var __slice = _Array.prototype.slice;
    Array.prototype.slice = function(startIndex, endIndex )
    {
        var obj = new Array();
        startIndex = parseInt( startIndex );
        endIndex   = parseInt( endIndex );
        if( isNaN(startIndex) ) startIndex =  0;
        if( isNaN(endIndex) ) endIndex =  this.length;
        startIndex = Math.max(startIndex,  0);
        endIndex   = Math.min(endIndex,  this.length );
        while( startIndex < endIndex )
        {
            obj[startIndex] = this[startIndex];
            startIndex++;
        }
        return obj;
    }

    var __splice = _Array.prototype.splice;
    Array.prototype.splice = function(startIndex, delCount, items )
    {
        var obj = __array.slice.call(arguments,2)
        obj.unshift(delCount);
        obj.unshift(startIndex);
        obj = __array.splice.apply( this.__proxyTarget__, obj );
        this.length = obj.length;
        return obj;
    }


    /**
     * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
     * @param callback 一个回调函数。
     * 参数中的第一个为属性值，第二个为属性名。
     * 如果返回 false 则退出循环
     * @returns {Object}
     */
    Array.prototype.forEach=function( callback )
    {
        if( typeof callback !== "function" )throwError('type','"callback" must be a function')
        if( isObject(this) )
        {
            for(var i in this)if( callback.call(this, this[i], i ) === false )return this;
        }
        return this;
    }


    /**
     * 错误消息构造函数
     * @param message
     * @param line
     * @param filename
     * @constructor
     */
    function Error( message , line, filename )
    {
        this.message = message;
        this.line=line;
        this.filename = filename;
        this.type='Error';
    }
    Error.prototype = new Object();
    Error.prototype.constructor=Error;
    Error.prototype.line=null;
    Error.prototype.type='Error';
    Error.prototype.message=null;
    Error.prototype.filename=null;
    Error.prototype.toString=function ()
    {
        return this.message;
    }


    /**
     * 引用错误构造器
     * @param message
     * @param line
     * @param filename
     * @constructor
     */
    function ReferenceError( message , line, filename )
    {
        Error.call(this, message , line, filename);
        this.type='ReferenceError';
    }
    ReferenceError.prototype = new Error();
    ReferenceError.prototype.constructor=ReferenceError;


    /**
     * 类型错误构造器
     * @param message
     * @param line
     * @param filename
     * @constructor
     */
    function TypeError( message , line, filename )
    {
        Error.call(this, message , line, filename);
        this.type='TypeError';
    }
    TypeError.prototype = new Error();
    TypeError.prototype.constructor=TypeError;


    /**
     * 语法错误构造器
     * @param message
     * @param line
     * @param filename
     * @constructor
     */
    function SyntaxError( message , line, filename )
    {
        Error.call(this, message , line, filename);
        this.type='SyntaxError';
    }
    SyntaxError.prototype = new Error();
    SyntaxError.prototype.constructor=SyntaxError;

    /**
     * 类对象构造器
     * @returns {Class}
     * @constructor
     */
    function Class()
    {
        Object.call(this);
        return this;
    }
    Class.prototype                  = new Object();
    Class.prototype.constructor      = null;
    Class.prototype.extends          = null;
    Class.prototype.static           = null;
    Class.prototype.proto            = null;
    Class.prototype.token            = '';
    Class.prototype.classname        = '';
    Class.prototype.package          = '';
    Class.prototype.implements       = [];
    Class.prototype.final            = false;
    Class.prototype.dynamic          = false;
    Class.prototype.call             = null;
    Class.prototype.prop             = null;

    /**
     * 接口构造函数
     * @constructor
     */
    function Interface()
    {
        Object.call(this);
        return this;
    }
    Interface.prototype              = new Object();
    Interface.prototype.constructor  = null;
    Interface.prototype.extends      = null;
    Interface.prototype.proto        = null;
    Interface.prototype.classname    = '';
    Interface.prototype.package      = '';
    Interface.prototype.token        = '';

    g.Object = Object;
    g.Class = Class;
    g.Interface = Interface;
    g.Array = Array;
    g.Error = Error;
    g.ReferenceError = ReferenceError;
    g.TypeError = TypeError;
    g.SyntaxError = SyntaxError;
    g.String = _String;
    g.Number = _Number;
    g.RegExp = _RegExp;
    g.Boolean = _Boolean;
    return g;

}(Object,String,Array,Error));
