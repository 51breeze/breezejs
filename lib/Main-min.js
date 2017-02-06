(function(){
var System = (function(_Object,_Function,_Array,_String,_Number,_Boolean,_RegExp,_Error,_ReferenceError,_TypeError,_SyntaxError,undefined)
{
    var s=System={};
    var m={};
    var $console = console || {};
    s.Object  = _Object;
    s.Function= _Function;
    s.Array   = _Array;
    s.String  = _String;
    s.Number  = _Number;
    s.Boolean = _Boolean;
    s.RegExp  = _RegExp;
    s.Error   = _Error;
    s.ReferenceError = _ReferenceError;
    s.TypeError      = _TypeError;
    s.SyntaxError    = _SyntaxError;
    s.log = $console.log || function(){};
    s.info = $console.info || function(){};
    s.dir = $console.dir || function(){};
    s.error = $console.error || function(){};
    s.assert = $console.assert || function(){};
    s.time = $console.time || function(){};
    s.timeEnd = $console.timeEnd || function(){};
    s.trace = $console.trace || function(){};
    s.warn = $console.warn || function(){};

    /**
     * 对象类构造器
     * @param value
     * @returns {*}
     * @constructor
     */
    function Object( value )
    {
        if ( !(value === undefined || value === null) )return _Object(value);
        if( !(this instanceof Object) ) return new Object();
        return this;
    }
    s.Object =Object;
    Object.prototype = new _Object();
    Object.prototype.constructor=Object;

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
     * 设置对象的原型链
     * @returns {Object}
     */
    var $setPrototypeOf = _Object.setPrototypeOf || function setPrototypeOf(obj, proto)
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
            target = this;
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
                    src = target[ name ];
                    copy = options[ name ];
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
                        target[ name ] = Object.merge( deep, clone, copy );

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
     * 指示 Object 类的实例是否在指定为参数的对象的原型链中
     * @param theClass
     * @returns {Boolean}
     */
    var $isPrototypeOf = _Object.prototype.isPrototypeOf;
    Object.prototype.isPrototypeOf = function( theClass )
    {
        var proto = Object.getPrototypeOf(this);
        var obj = this instanceof Class ? this : proto.constructor;
        if( obj instanceof Class )
        {
            var classObj = theClass;
            while (classObj instanceof Class)
            {
                if (classObj === obj)return true;
                classObj = classObj.extends;
            }
        }
        return $isPrototypeOf.call( proto, theClass);
    }

    /**
     * 表示对象是否已经定义了指定的属性。
     * 如果目标对象具有与 name 参数指定的字符串匹配的属性，则此方法返回 true；否则返回 false。
     * @param prop 对象的属性。
     * @returns {Boolean}
     */
    var $hasOwnProperty = _Object.prototype.hasOwnProperty;
    Object.prototype.hasOwnProperty = function( name )
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            var desc = obj === this ? obj.static[name] : obj.proto[name];
            return desc && desc.id !== "function";
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
    var $propertyIsEnumerable=_Object.prototype.propertyIsEnumerable;
    Object.prototype.propertyIsEnumerable = function( name )
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            var desc = obj === this ? obj.static[name] : obj.proto[ name ];
            if( desc && ( desc.qualifier!=='public' || (desc.id === "function" && typeof desc.value === "function")))return false;
            return (obj.dynamic && !desc) || (desc && desc.enumerable !== false);
        }
        return $propertyIsEnumerable.call(this,name);
    }

    /**
     * 设置循环操作动态属性的可用性。
     * 该属性必须存在于目标对象上，原因是：该方法不检查目标对象的原型链。
     * @param name 对象的属性
     * @param isEnum  (default = true)
     * 如果设置为 false，则动态属性不会显示在 for..in 循环中，且方法 propertyIsEnumerable() 返回 false。
     */
    var $defineProperty=_Object.defineProperty;
    Object.prototype.setPropertyIsEnumerable = function( name, isEnum )
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            var desc = obj === this ? obj.static[name] : obj.proto[ name ];
            if( desc )
            {
                desc.enumerable = isEnum !== false;
                if( desc.id !=='function' || (desc.value && typeof desc.value.get === "function") )$defineProperty(obj === this ? obj.static : this[obj.token], name, {enumerable: isEnum !== false});
            }

        }else if( $hasOwnProperty.call(this,name) )
        {
            $defineProperty(this, name, {enumerable:isEnum !== false});
        }
    }

    /**
     * 返回指定对象的原始值
     * @returns {String}
     */
    var $valueOf = _Object.prototype.valueOf;
    Object.prototype.valueOf=function()
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            return obj === this ? '[Class: '+obj.classname+']' : '[object '+ obj.classname+']';
        }else if( obj instanceof Interface )
        {
            return '[Interface: '+obj.classname +']';
        }
        return $valueOf.call( this );
    }

    /**
     * 返回指定对象的字符串表示形式。
     * @returns {String}
     */
    var $toString = _Object.prototype.toString;
    Object.prototype.toString=function()
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            return obj === this ? '[Class: '+obj.classname+']' : '[object '+ obj.classname+']';

        }else if( obj instanceof Interface )
        {
            return '[Interface: '+obj.classname +']';
        }
        return $toString.call( this );
    }

    /**
     * 返回对象可枚举的属性的键名
     * @returns {Array}
     */
    Object.prototype.keys=function()
    {
        var items=[];
        var it = new Iterator(this);
        var len = it.items.length;
        var i = 0;
        for(;i<len;i++)items.push( it.items[i].key );
        return items;
    }

    /**
     *  返回对象可枚举的属性值
     * @returns {Array}
     */
    Object.prototype.values=function()
    {
        var items=[];
        var it = new Iterator(this);
        var len = it.items.length;
        var i = 0;
        for(;i<len;i++)items.push( it.items[i].value );
        return items;
    }

    /**
     * 数组构造器
     * @returns {Array}
     * @constructor
     */
    function Array(length)
    {
        if( !(this instanceof Array) )return _Array.apply(new Array(), Array.prototype.slice.call(arguments,0) );
        this.length=0;
        return _Array.apply(this,Array.prototype.slice.call(arguments,0));
    }
    s.Array =Array;
    Array.prototype = new Object();
    Array.prototype.constructor = Array;
    Array.prototype.length  =0;
    Array.prototype.slice   = _Array.prototype.slice;
    Array.prototype.splice  = _Array.prototype.splice;
    Array.prototype.concat  = _Array.prototype.concat;
    Array.prototype.join    = _Array.prototype.join;
    Array.prototype.pop     = _Array.prototype.pop;
    Array.prototype.push    = _Array.prototype.push;
    Array.prototype.shift   = _Array.prototype.shift;
    Array.prototype.unshift = _Array.prototype.unshift;
    Array.prototype.sort    = _Array.prototype.sort;
    Array.prototype.reverse = _Array.prototype.reverse;
    Array.prototype.toString =_Array.prototype.toString;
    Array.prototype.valueOf =_Array.prototype.valueOf;

    /**
     * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
     * @param callback 一个回调函数。
     * 参数中的第一个为属性值，第二个为属性名。
     * 如果返回 false 则退出循环
     * @returns {Object}
     */
    Array.prototype.forEach=function( callback, thisArg )
    {
        if( typeof callback !== "function" )throwError('type','"callback" must be a function')
        var it = new Iterator(this);
        var len = it.items.length;
        var i = 0;
        for(;i<len;i++)if(callback.call(thisArg, it.items[i].value, it.items[i].key )=== false)return this;
        return this;
    }

    /**
     * 方法使用指定的函数测试所有元素，并创建一个包含所有通过测试的元素的新数组。
     * @param callback
     * @param thisArg
     * @returns {Array}
     */
    Array.prototype.filter=function (callback, thisArg)
    {
        if (typeof callback !== 'function')throwError('type','callback must be a function');
        var it = new Iterator(this);
        var len = it.items.length;
        var items = new Array();
        var i = 0;
        for (; i < len; i++)if ( callback.call(thisArg, it.items[i].value, it.items[i].key) )items.push( it.items[i].value );
        return items;
    }

    /**
     * 将一个数组的所有元素从开始索引填充到具有静态值的结束索引
     * @param value
     * @param start
     * @param end
     * @returns {Object}
     */
    Array.prototype.fill = function fill(value, start, end)
    {
        var obj = Object(this);
        if( !(obj instanceof Class) )
        {
            var o = obj.constructor instanceof Class ? obj[obj.constructor.token] : obj;
            var len = o.length >> 0;
            var relativeStart = start >> 0;
            var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
            var relativeEnd = end === undefined ? len : end >> 0;
            var final = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
            while (k < final) {
                o[k] = value;
                k++;
            }
        }
        return obj;
    };

    /**
     * 返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。
     * @param callback
     * @param thisArg
     * @returns {*}
     */
    Array.prototype.find = function(callback,thisArg)
    {
        if (typeof callback !== 'function')throwError('type','callback must be a function');
        var it = new Iterator(this);
        var len = it.items.length;
        for (var i = 0; i < len; i++)if ( callback.call(thisArg, it.items[i].value, it.items[i].value.key) )
        {
            return it.items[i].value;
        }
        return undefined;
    };


    /**
     * 描述符构造器
     * @constructor
     */
    function Descriptor(){}
    s.Descriptor =Descriptor;
    Descriptor.prototype = new Object();
    Descriptor.prototype.constructor = Descriptor;
    Descriptor.prototype.enumerable = false;
    Descriptor.prototype.configurable = false;
    Descriptor.prototype.writable = false;
    Descriptor.prototype.value = undefined;
    Descriptor.prototype.get = undefined;
    Descriptor.prototype.set = undefined;

    /**
     * 迭代构造器
     * @param target
     * @constructor
     */
    function Iterator( target )
    {
       if( !(this instanceof Iterator) ) return new Iterator(target);
       target = Object(target);
       var items = [];
       var desc;
       var obj = target;
       var dynamic = false;
       if( target instanceof Class )
       {
           desc = obj = target.static;
       }else if( target.constructor instanceof Class  )
       {
           obj = target[ target.constructor.token ];
           desc = target.constructor.proto;
           dynamic = target.constructor.dynamic;
       }
       for( var prop in obj )
       {
           if( !$propertyIsEnumerable.call(obj,prop) )continue;
           if( desc )
           {
               if( desc[prop] && ( desc[prop].qualifier!=='public' || (desc[prop].id==='function' && typeof desc[prop].value === "function") ) )continue;
               if( (dynamic && !desc[prop]) || ( desc[prop] && desc[prop].enumerable !== false) )
               {
                   items.push({
                       key:prop,
                       value:obj[prop] ==='__getter__' && desc[prop].id==='function' && typeof desc[prop].value.get === "function" ? desc[prop].value.get.call(target) : obj[prop]
                   });
               }
               
           }else
           {
               items.push({key:prop,value:obj[prop]});
           }
       }
       this.items = items;
    }
    s.Iterator = Iterator;
    Iterator.prototype = new Object();
    Iterator.prototype.items = null;
    Iterator.prototype.cursor = -1;
    Iterator.prototype.constructor = Iterator;


    /**
     * 将指针向前移动一个位置并返回当前元素
     * @returns {*}
     */
    Iterator.prototype.seek= function seek()
    {
        if( this.items.length <= this.cursor+1 )return false;
        return this.items[ ++this.cursor ];
    }

    /**
     * 返回当前指针位置的元素
     * @returns {*}
     */
    Iterator.prototype.current=function current()
    {
        return this.items[ this.cursor ];
    }

    /**
     * 返回上一个指针位置的元素
     * 如果当前指针位置在第一个则返回false
     * @returns {*}
     */
    Iterator.prototype.prev=function current()
    {
        if( this.cursor < 1 )return false;
        return this.items[ this.cursor-1 ];
    }

    /**
     * 返回下一个指针位置的元素。
     * 如果当前指针位置在最后一个则返回false
     * @returns {*}
     */
    Iterator.prototype.next=function next()
    {
        if( this.cursor >= this.items.length )return false;
        return this.items[ this.cursor+1 ];
    }

    /**
     * 将指针移到到指定的位置并返回当前位置的元素
     * @param cursor
     * @returns {*}
     */
    Iterator.prototype.moveTo=function moveTo( cursor )
    {
        cursor=cursor >> 0;
        if( cursor < 0 || cursor >= this.items.length )return false;
        this.cursor = cursor;
        return this.items[ this.cursor ];
    }

    /**
     * 重置指针
     * @returns {Iterator}
     */
    Iterator.prototype.reset=function reset()
    {
        this.cursor = -1;
        return this;
    }

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
    s.Class = Class;
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
    s.Interface = Interface;
    Interface.prototype              = new Object();
    Interface.prototype.constructor  = null;
    Interface.prototype.extends      = null;
    Interface.prototype.proto        = null;
    Interface.prototype.classname    = '';
    Interface.prototype.package      = '';
    Interface.prototype.token        = '';

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
    s.Error = Error;
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
    s.ReferenceError = ReferenceError;
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
    s.TypeError = TypeError;
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
    s.SyntaxError = SyntaxError;
    SyntaxError.prototype = new Error();
    SyntaxError.prototype.constructor=SyntaxError;

    /**
     * 返回对象类型的字符串表示形式
     * @param instanceObj
     * @returns {*}
     */
    function typeOf( instanceObj )
    {
        if( instanceObj instanceof Class )return 'class';
        if( instanceObj instanceof Interface )return 'interface';
        if( instanceObj instanceof s.RegExp )return 'regexp';
        return typeof instanceObj;
    }
    s.typeOf=typeOf;

    /**
     * 检查实例对象是否属于指定的类型(不会检查接口类型)
     * @param instanceObj
     * @param theClass
     * @returns {boolean}
     */
    function instanceOf(instanceObj, theClass)
    {
        var isclass = theClass instanceof Class;
        var isInterface = theClass instanceof Interface;
        if( instanceObj && (isclass || isInterface) )
        {
            if( instanceObj instanceof Class )return isclass;
            instanceObj = instanceObj.constructor;
            while( instanceObj )
            {
                if( instanceObj === theClass )return true;
                instanceObj=instanceObj.extends;
            }
        }
        if( typeof theClass !== "function" )return false;
        return Object(instanceObj) instanceof theClass;
    }
    s.instanceOf=instanceOf;
    /**
     * 检查实例对象是否属于指定的类型(检查接口类型)
     * @param instanceObj
     * @param theClass
     * @returns {boolean}
     */
    function is(instanceObj, theClass)
    {
        var isclass = theClass instanceof Class;
        var isInterface = theClass instanceof Interface;
        if( isclass || isInterface )
        {
            if( instanceObj instanceof Class )return isclass;
            instanceObj = instanceObj.constructor;
            while( instanceObj )
            {
                if( instanceObj === theClass )return true;
                if( instanceObj.implements && instanceObj.implements.length > 0 )
                {
                    for (var b in instanceObj.implements)
                    {
                        var interfaceModule = instanceObj.implements[b];
                        do{
                            if( interfaceModule === theClass ) return true;
                        } while ( interfaceModule && (interfaceModule = interfaceModule.extends));
                    }
                }
                instanceObj=instanceObj.extends;
            }
        }
        return instanceOf( instanceObj, theClass);
    }
    s.is=is;

    /**
     * 为指定的类创建一个新的实例对象
     * @param fn
     * @param param
     * @returns {nop}
     */
    function Nop(){}
    function factory(theClass, args)
    {
        var obj;
        var constructor =  theClass;
        if( theClass instanceof Class )
        {
            if( theClass.isAbstract )throwError('type','Abstract class cannot be instantiated');
            constructor = theClass.constructor;
        }

        if( typeof constructor !== "function" )throwError('type','is not constructor');
        if( arguments.length <= 2 )
        {
            obj =  arguments.length===1 ? new constructor() : new constructor( args );
        }else
        {
            Nop.prototype = constructor.prototype;
            obj = constructor.apply( new Nop() , Array.prototype.slice.call(arguments, 1) );
        }
        //原型链引用
        if( Object.getPrototypeOf(obj) !== constructor.prototype )$setPrototypeOf(obj, constructor.prototype);
        return obj;
    }
    s.factory=factory;

    /**
     * 根据指定的类名获取类的对象
     * @param name
     * @returns {Object}
     */
    function getDefinitionByName( name )
    {
        if( m[ name ] )return m[ name];
        if( s[name] )return s[name];
        for ( var i in m )if( i=== name )return m[i];
        throwError('type', '"'+name+'" is not define');
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
         switch ( typeOf(value) )
         {
             case 'boolean': return 'Boolean';
             case 'number' : return 'Number' ;
             case 'string' : return 'String' ;
             case 'regexp' : return 'RegExp' ;
             case 'class'  : return 'Class' ;
             case 'interface': return 'Interface' ;
             case 'function' :
                 if (value === s.String)return 'String';
                 if (value === s.Boolean)return 'Boolean';
                 if (value === s.Number)return 'Number';
                 if (value === s.RegExp)return 'RegExp';
                 if (value === s.Array)return 'Array';
                 if (value === s.Object)return 'Object';
                  return 'Function';
         }
         if( isObject(value,true) )return 'Object';
         if( isArray(value) )return 'Array';
         if( value instanceof String )return 'String';
         if( value instanceof Number )return 'Number';
         if( value instanceof Boolean )return 'Boolean';
         if( value.constructor instanceof Class )return value.constructor.classname;
         throwError('type','type does not exist');
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
            var parentModule = classModule.extends;
            if ( parentModule )
            {
                return  parentModule.fullclassname;
            }
        }
        return null;
    }
    s.getQualifiedSuperclassName =getQualifiedSuperclassName;
    /**
     * 判断是否为一个可遍历的对象
     * null, undefined 属于对象类型但也会返回 false
     * @param val
     * @param flag 默认为 false。如为true表示一个纯对象,否则数组对象也会返回true
     * @returns {boolean}
     */
    function isObject(val , flag )
    {
        if( !val )return false;
        var proto =  Object.getPrototypeOf(val);
        var result = !!(proto === Object.prototype || proto===_Object.prototype);
        if( !result && flag !== true && isArray(val) )return true;
        return result;
    };
    s.isObject =isObject;
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
    s.isDefined =isDefined;
    /**
     * 判断是否为数组
     * @param val
     * @returns {boolean}
     */
    function isArray(val)
    {
        return val instanceof Array || val instanceof _Array;
    };
    s.isArray =isArray;
    /**
     * 判断是否为函数
     * @param val
     * @returns {boolean}
     */
    function isFunction( val ){
        return typeof val === 'function';
    };
    s.isFunction =isFunction;
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
     * 抛出错误信息
     * @param type
     * @param msg
     */
    function throwError(type, msg , line, filename)
    {
        switch ( type ){
            case 'type' :
                throw new s.TypeError( msg,line, filename );
                break;
            case 'reference':
                throw new s.ReferenceError( msg ,line, filename);
                break;
            case 'syntax':
                throw new s.SyntaxError( msg ,line, filename );
                break;
            default :
                throw new s.Error( msg , line, filename );
        }
    }
    s.throwError =throwError;
    /**
     * 判断是否为一个空值
     * @param val
     * @param flag 为true时排除val为0的值
     * @returns {boolean}
     */
    function isEmpty(val , flag )
    {
        if( !val )return flag !== true || val !== 0;
        if( isObject(val) )
        {
            var ret;
            for( ret in val )break;
            return typeof ret === "undefined";
        }
        return false;
    };
    s.isEmpty=isEmpty;

    /**
     * 去掉指定字符两边的空白
     * @param str
     * @returns {string}
     */
    function trim( str )
    {
        return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
    }
    s.trim = trim;

    //引用属性或者方法
    var __call=(function () {

        var policy={
            "Array":{
                "proto":{"length":{"writable":false, "enumerable":false, "configurable":false}}
            }
        }

        /**
         * 检查值的类型是否和声明时的类型一致
         * @param description
         * @param value
         */
        function checkValueType(description,value,strName )
        {
            if( description && description.type && description.type !== '*' )
            {
                var type = typeOf(value);
                var result = false;
                switch ( type )
                {
                    case 'string' :
                        result =  description.type === String || description.type === Object;
                        break;
                    case 'number' :
                        result =  description.type === Number || description.type === Object;
                        break;
                    case 'regexp' :
                        result =  description.type === RegExp || description.type === Object;
                        break;
                    case 'class' :
                        result =  description.type === Class || description.type === Object;
                        break;
                    case 'boolean':
                        result =  description.type === Boolean;
                        break;
                    default :
                        result = description.type === Object ? true : instanceOf(value,description.type);
                        break;
                }
                if( !result )
                {
                    throwError('type', '"' + strName + '" type can only be a (' + getQualifiedClassName(description.type) + ')');
                }
            }
        }

        //检查是否可访问
        function checkPrivilege(descriptor,referenceModule, classModule  )
        {
            if( descriptor && descriptor.qualifier && descriptor.qualifier !== 'public' )
            {
                //不是本类中的成员调用（本类中的所有成员可以相互调用）
                if( referenceModule !== classModule )
                {
                    var is= false;
                    if( descriptor.qualifier === 'internal' )
                    {
                        is = referenceModule.package === classModule.package;

                    }else if( descriptor.qualifier === 'protected' )
                    {
                        is = Object.prototype.isPrototypeOf.call(classModule,referenceModule);
                    }
                    return is;
                }
            }
            return true;
        }

        /**
         * 是否为一个数学赋值运算符
         * @param o
         * @returns {boolean}
         */
        function isMathAssignOperator( o )
        {
            switch (o) {
                case '=' :
                case '+=' :
                case '-=' :
                case '*=' :
                case '/=' :
                case '%=' :
                case '^=' :
                case '&=' :
                case '|=' :
                case '<<=' :
                case '>>=' :
                case '>>>=' :
                case '--' :
                case '++' :
                    return true;
            }
            return false;
        }

        /**
         * 数学运算
         * @param a
         * @param o
         * @param b
         * @returns {*}
         */
        function mathOperator( a, o, b)
        {
            if( a==='--' || b==='--')return o-1;
            if( a==='++' || b==='++' )return o+1;
            switch (o)
            {
                case '+=' : return a+=b;
                case '-=' : return a-=b;
                case '*=' : return a*=b;
                case '/=' : return a/=b;
                case '%=' : return a%=b;
                case '^=' : return a^=b;
                case '&=' : return a&=b;
                case '|=' :return a|=b;
                case '<<=' :return a<<=b;
                case '>>=' :return a>>=b;
                case '>>>=' :return a>>>=b;
                default : return b;
            }
        }

        /**
         * 设置属性值
         * @param thisArg
         * @param refObj
         * @param desc
         * @param prop
         * @param value
         * @param strName
         * @returns {*}
         */
        function setValue(thisArg, refObj, desc, prop, value, strName,writable)
        {
            if( !writable )throwError('type', '"' + strName +'" cannot be alter of constant');
            if ( desc )
            {
                checkValueType(desc, value, strName);
                if( desc.id==='function' )
                {
                    if (typeof desc.value.set !== 'function')throwError('reference', '"' + strName + '" Accessor setter does not exist');
                    desc.value.set.call(thisArg, value);
                    return value;
                }
                if ( !Object.prototype.hasOwnProperty.call(refObj, prop) )throwError('reference', '"' + strName + '" property does not exist');
            }
            try {
                refObj[ prop ] = value;
            } catch (e) {
                throwError('reference', '"' + strName + '" property cannot be set');
            }
            if( refObj[prop] !== value )throwError('reference', '"' + strName + '" property cannot be set');
            return value;
        }

        /**
         * 获取属性值
         * @param thisArg
         * @param refObj
         * @param desc
         * @param prop
         * @param strName
         * @returns {*}
         */
        function getValue(thisArg, refObj, desc, prop, strName)
        {
            //如是是对全局类的属性操作
            if ( desc && desc.id ==='function' )
            {
                if (typeof desc.value.get !== 'function')throw new throwError('reference', '"' + strName + '" Accessor getter does not exist');
                return desc.value.get.call(thisArg);
            }
            if( !prop )return refObj;
            return refObj[prop];
        }

        /**
         * 生成一个调用函数的方法
         * @param classModule
         * @returns {Function}
         */
        function call( classModule, thisArg, properties, args, iscall)
        {
            var desc;
            var strName = properties ? properties : thisArg;
            var lastProp = properties;
            var refObj = thisArg;
            var value = refObj;
            var isset = typeof args !== "undefined" && !iscall;
            var operator;
            var left;

            //一组引用对象的属性或者是运算符（必须在属性的前面或者后面）
            if( properties && typeof properties !== "string" )
            {
                //前自增减运算符
                if( properties[0]==='--' || properties[0]==='++' )left = properties.shift();
                //指定的引用对象模块
                if( properties[0] instanceof Class )refObj = value = properties.shift();
                //属性名字符串的表示
                strName = properties.join('.');
                //需要操作的属性名
                lastProp = properties.pop();
                //指定的赋值运算符
                if( isMathAssignOperator( lastProp )  )
                {
                    operator = lastProp;
                    if(operator==='=')operator='';
                    strName = properties.join('.');
                    lastProp = properties.pop();
                }

                //如果有链式操作则获取引用
                if( properties.length > 0 )
                {
                    var i = 0;
                    //获取实例引用
                    while( i < properties.length && refObj )
                    {
                        refObj = thisArg = call( classModule, thisArg, properties[i++], undefined , false);
                    }
                }
            }

            //引用对象不能是空
            if( !refObj && (isset || iscall || lastProp) )throwError('reference', '"'+strName+( refObj===null ? '" property of null' : '" is not defined') );
            //属性对象是否可写
            var writable=true;
            //是否对静态模块的引用
            var isStatic = refObj instanceof Class || typeof refObj === "function";
            //对属性引用的操作
            if( lastProp )
            {
                var referenceModule = isStatic ? refObj : refObj.constructor instanceof Class ? refObj.constructor : refObj;
                //是否为引用本地类的模块
                if( referenceModule instanceof Class )
                {
                    //模块描述符
                    desc = isStatic ? referenceModule.static : referenceModule.proto;
                    desc = $hasOwnProperty.call(desc, lastProp) ? desc[lastProp] : null;

                    //如果本类中没有定义则在在扩展的类中依次向上查找。
                    if ( !desc || (desc.qualifier === 'private' && referenceModule !== classModule) )
                    {
                        var parentModule = referenceModule.extends;
                        var description;
                        while ( parentModule instanceof Class )
                        {
                            description = isStatic ? parentModule.static : parentModule.proto;
                            //继承的属性，私有的路过.
                            if ( $hasOwnProperty.call(description,lastProp) && ( description[lastProp].qualifier !== 'private' || parentModule === classModule )) {
                                desc = description[lastProp];
                                referenceModule = parentModule;
                                break;
                            }
                            parentModule = parentModule.extends;
                        }

                        //默认继承全局对象
                        parentModule = parentModule || System.Object;
                        if( !desc && iscall && !isStatic && typeof parentModule=== "function" && parentModule.prototype[lastProp] )
                        {
                            desc = parentModule.prototype;
                            refObj = desc;
                            referenceModule = parentModule;
                        }
                    }
                    //如果没有在类中定义
                    if ( !desc && iscall )throwError('reference', '"' + strName + '" is not defined');
                    //是一个类模块
                    if( referenceModule instanceof Class )
                    {
                        //是否有访问的权限
                        if (!checkPrivilege(desc, referenceModule, classModule))throwError('reference', '"' + strName + '" inaccessible.');
                        //如果是一个实例属性
                        if (!isStatic && ( desc.id === 'var' || desc.id === 'const'))
                        {
                            writable = desc.id !== 'const';
                            refObj = refObj[referenceModule.token];
                        }
                        //引用描述符的原始值
                        else {
                            lastProp = 'value';
                            refObj = desc;
                        }
                    }
                }
                //引用全局对象的原型
                else if( iscall && refObj !== System && !isStatic )
                {
                    var className = getQualifiedClassName( refObj );
                    if( className && typeof System[className] === "function" )
                    {
                        refObj = System[className].prototype;
                    }
                }
            }

            //设置属性值
            if( isset )
            {
                if( operator )
                {
                    var val = getValue( thisArg, refObj, desc, lastProp ,strName  );
                    checkValueType(desc, val, strName);
                    args = mathOperator( val, operator, args );
                }
                return setValue( thisArg, refObj, desc, lastProp ,args, strName, writable );
            }

            //获取原始值
            if( desc && (desc.id==='var' || desc.id==='const' || typeof desc.value === "object" ) )
            {
                value = getValue( thisArg, refObj, desc, lastProp ,strName );
            }
            else if( lastProp )
            {
                value = refObj[lastProp];
            }

            //调用方法
            if ( iscall )
            {
                if( value instanceof Class )value = value.constructor;
                if ( typeof value !== 'function' )throwError('reference', '"' + strName + '" is not function');
                return value.apply(thisArg, args);
            }
            //待返回的值
            var val = value;
            //如果有指定运算符
            if( left || operator )
            {
                checkValueType(desc, 1, strName);
                //前置运算(先返回运算后的结果再赋值)
                if(left)
                {
                    val = value = mathOperator( left, value, null, desc )
                }
                //后置运算(先赋值后再返回运算后的结果)
                else
                {
                    value=mathOperator( null, value, operator, desc );
                }
                //将运算后的结果保存
                setValue( thisArg, refObj, desc, lastProp , value, strName, writable );
            }
            return val;
        }
        return call;
    })();

    /**
     * 构建一个访问器
     * @param classModule
     * @param flag
     * @returns {Function}
     */
    function make(classModule, flag )
    {
        return function (info, thisArg, properties ,value)
        {
            try{
                return __call(classModule, thisArg, properties, value, flag);
            }catch(error){
                toErrorMsg(error, classModule, info)
            }
        }
    }

    function newInstance(classModule)
    {
        return function (info, theClass, args)
        {
            try{
                return System.isArray(args) ? System.factory.apply(null, [theClass].concat(args) ) : System.factory(theClass);
            }catch(error){
                toErrorMsg(error, classModule, info)
            }
        }
    }

    function checkType(classModule)
    {
        return function (info, type, value)
        {
             if( !System.is(value, type) )
             {
                 var strtype = getQualifiedClassName( type );
                 toErrorMsg('TypeError Specify the type of value do not match. must is "'+strtype+'"', classModule, info);
             }
             return value;
        }
    }

    function toErrorMsg(error, classModule, info)
    {
        var msg = classModule.filename + ':' + info + '\n';
         msg +=  typeof error === "string" ? error : error.message;
        throwError("reference", msg, info, classModule.filename );
    }

    /**
     * 定义Class或者Interface对象
     * @param name
     * @param descriptor
     * @param isInterface
     * @returns {*}
     */
    function define(name , descriptor , isInterface)
    {
        if( typeof s[ name ] === "function" )return s[ name ];
        var classModule;
        if( m[ name ] && (m[ name ] instanceof Class  || m[ name ] instanceof Interface) )
        {
            classModule = m[ name ];
        }else
        {
            if( isInterface )
            {
                classModule = m[ name ] = new Interface();
                descriptor.constructor = null;
            }else
            {
                classModule = m[name] = new Class();
                classModule.call = make(classModule, true);
                classModule.prop = make(classModule, false);
                classModule.newInstance = newInstance(classModule);
                classModule.checkType = checkType(classModule);
            }
        }

        //如果是定义类或者接口
        if( typeof descriptor === "object" )
        {
            Object.merge(classModule,descriptor);
            if( !isInterface && typeof descriptor.constructor === "function" )
            {
                descriptor.constructor.prototype= new Object();
                descriptor.constructor.prototype.constructor = classModule;
                //开放原型继承
                classModule.prototype = descriptor.constructor.prototype;
            }
        }
        return classModule;
    }
    s.define=define;
    return s;

}(Object,Function,Array,String,Number,Boolean,RegExp,Error,ReferenceError,TypeError,SyntaxError));


(function(Object,Array, String,Class,Interface){
(function(){
var D;
var __prop__;
var __call__;
var __newInstance__;
var __check__;
D=System.define("com.D",{
"constructor":function(jj){this["1486372858074"]={"bb":123,"address":"__getter__"};
Object.constructor.call(this);
if(System.typeOf(jj) === "undefined"){jj='123';}
if(!System.is(jj,String))System.throwError("type","type of mismatch. must is a String");
__call__("30:50",System,"log",[jj,' this is a D class ']);var cc=66;},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\D.as",
"static":{},
"token":"1486372858074",
"extends":Object,
"classname":"D",
"package":"com",
"isAbstract":false,
"proto":{
"bb":{"id":"var","qualifier":"protected","type":"*","value":123},
"address":{"id":"function","qualifier":"protected","type":String,"value":{get:function(){return '66666';},set:function(add){}}},
"test":{"id":"function","qualifier":"public","type":"*","value":function(){return 'the fun createname';}}
}});
__prop__=D.prop;
__call__=D.call;
__newInstance__=D.newInstance;
__check__=D.checkType;
})();
(function(){
var IProt;
IProt=System.define("lib.IProt",{
"constructor":null,
"token":"1484362494903",
"extends":null,
"classname":"IProt",
"package":"lib",
"isAbstract":false,
"proto":{
"connect":{"id":"function","qualifier":"public","type":String}
}}, true);
})();
(function(){
var IProt=System.define("lib.IProt");
var IProsess;
IProsess=System.define("lib.IProsess",{
"constructor":null,
"token":"1484383737687",
"extends":IProt,
"classname":"IProsess",
"package":"lib",
"isAbstract":false,
"proto":{
"database":{"id":"function","qualifier":"public","type":String}
}}, true);
})();
(function(){
var B=System.define("com.B");
var D=System.define("com.D");
var EventDispatcher=System.define("lib.EventDispatcher");
var IProsess=System.define("lib.IProsess");
var IProt=System.define("lib.IProt");
var Abs;
var __prop__;
var __call__;
var __newInstance__;
var __check__;
Abs=System.define("com.Abs",{
"constructor":function(){this["1486372858099"]={"dispatcher":null,"age":'3',"classname":"__getter__","name":'666 66fff'};
return D.constructor.call(this);},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\Abs.as",
"static":{
"address":{"id":"var","qualifier":"private","type":String,"value":'shu line 6666'},
"classname":{"id":"function","qualifier":"protected","type":String,"value":{get:function(){return '==the B classname=';}}}
},
"token":"1486372858099",
"extends":D,
"classname":"Abs",
"package":"com",
"isAbstract":true,
"proto":{
"dispatcher":{"id":"var","qualifier":"public","type":EventDispatcher,"value":null},
"age":{"id":"const","qualifier":"protected","type":String,"value":'3'},
"createName":{"id":"function","qualifier":"protected","type":"*","value":function(){return 'the fun createname';}},
"name":{"id":"var","qualifier":"private","type":String,"value":'666 66fff'},
"cre":{"id":"function","qualifier":"protected","type":"*","value":function(str){__call__("46:36",System,"log",[__prop__("46:34",this,"name")]);__call__("47:35",System,"log",['call cre']);}},
"connect":{"id":"function","qualifier":"public","type":String,"value":function(str){return '';}}
}});
__prop__=Abs.prop;
__call__=Abs.call;
__newInstance__=Abs.newInstance;
__check__=Abs.checkType;
})();
(function(){
var Abs=System.define("com.Abs");
var D=System.define("com.D");
var EventDispatcher=System.define("lib.EventDispatcher");
var IProsess=System.define("lib.IProsess");
var IProt=System.define("lib.IProt");
var B;
var __prop__;
var __call__;
var __newInstance__;
var __check__;
B=System.define("com.B",{
"constructor":function(jj){this["1486372858039"]={"dispatcher":null,"age":'3',"classname":"__getter__","name":'666 66fff'};
__call__("38:23",this,[D],[jj]);var cc=66;__call__("40:53",System,"log",['===the is B====',System.is(this,D)]);},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\B.as",
"static":{
"address":{"id":"var","qualifier":"private","type":String,"value":'shu line 6666'},
"classname":{"id":"function","qualifier":"protected","type":String,"value":{get:function(){return '==the B classname=';}}}
},
"token":"1486372858039",
"extends":D,
"classname":"B",
"package":"com",
"isAbstract":false,
"proto":{
"dispatcher":{"id":"var","qualifier":"public","type":EventDispatcher,"value":null},
"age":{"id":"const","qualifier":"protected","type":String,"value":'3'},
"createName":{"id":"function","qualifier":"protected","type":"*","value":function(){return 'the fun createname';}},
"name":{"id":"var","qualifier":"private","type":String,"value":'666 66fff'},
"cre":{"id":"function","qualifier":"protected","type":"*","value":function(str){__call__("55:36",System,"log",[__prop__("55:34",this,"name")]);__call__("56:35",System,"log",['call cre']);}},
"connect":{"id":"function","qualifier":"public","type":String,"value":function(str){return '';}}
}});
__prop__=B.prop;
__call__=B.call;
__newInstance__=B.newInstance;
__check__=B.checkType;
})();
(function(){
var B=System.define("com.B");
var EventDispatcher;
var __prop__;
var __call__;
var __newInstance__;
var __check__;
EventDispatcher=System.define("lib.EventDispatcher",{
"constructor":function(target){this["1486372858129"]={"getProxyTarget":null,"storage":null,"forEachCurrentItem":null,"length":null};
Object.constructor.call(this);
__prop__("34:50",this,'getProxyTarget'||__prop__("34:48",this,"length"));__prop__("35:31",this,"getProxyTarget",__check__("35:31",EventDispatcher,target&&1?function(){return __prop__("37:40",target,"length")>0?target:[this];}:function(){return __prop__("40:50",this,"forEachCurrentItem")?[__prop__("40:77",this,"forEachCurrentItem")]:(__prop__("40:94",this,"length")>0?this:[this]);}));},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\lib\\EventDispatcher.as",
"static":{
"Listener":{"id":"var","qualifier":"public","type":Class,"value":B},
"SpecialEvent":{"id":"var","qualifier":"public","type":Class,"value":B}
},
"token":"1486372858129",
"extends":Object,
"classname":"EventDispatcher",
"package":"lib",
"isAbstract":false,
"proto":{
"getProxyTarget":{"id":"var","qualifier":"private","type":Function,"value":null},
"storage":{"id":"var","qualifier":"private","type":Function,"value":null},
"forEachCurrentItem":{"id":"var","qualifier":"private","type":"*","value":null},
"length":{"id":"var","qualifier":"private","type":"*","value":null},
"hasEventListener":{"id":"function","qualifier":"public","type":"*","value":function(type){var events;
var target=__call__("46:45",this,"getProxyTarget"),index=0;while(index<target){events=__call__("50:65",this,["storage","call"],[__prop__("50:63",target,index)]);if(events&&__prop__("51:42",events,type)){return true;}index++;}__call__("57:77",System,"log",[System.instanceOf(this,EventDispatcher),'====is even ====']);return false;}},
"addEventListener":{"id":"function","qualifier":"public","type":System.define("lib.EventDispatcher"),"value":function(type,callback,useCapture,priority,reference,callback,useCapture,priority,reference){var len=__prop__("70:31",type,"length");if(System.instanceOf(type,Array)){while(len>0)__call__("75:106",this,"addEventListener",[__prop__("75:66",type,--len),callback,useCapture,priority,reference]);return this;}if(System.typeOf("79:27",type)!=='string'){throw __newInstance__("81:54",Error,['invalid event type.']);}var target=__call__("84:45",this,"getProxyTarget"),index=0;var listener=__newInstance__("86:93",EventDispatcher,"Listener",[callback,useCapture,priority,reference]);var bindBeforeProxy;while(index<__prop__("89:41",target,"length")){__prop__("91:35",listener,"dispatcher",this);__prop__("92:38",listener,"currentTarget",__prop__("92:52",target,index));__prop__("93:29",listener,"type",type);if(!(System.instanceOf(__prop__("94:43",bindBeforeProxy,type),__prop__("94:83",EventDispatcher,"SpecialEvent")))||!__call__("95:71",bindBeforeProxy,[type,"callback","call"],[this,listener])){}index++;}return this;}},
"removeEventListener":{"id":"function","qualifier":"public","type":"*","value":function(type,listener,listener){var target=__call__("114:45",this,"getProxyTarget");var b=0;var removeEventListener;while(b<__prop__("117:36",target,"length")){__call__("119:70",removeEventListener,"call",[__prop__("119:50",target,b),type,listener,this]);b++;}return true;}},
"dispatchEvent":{"id":"function","qualifier":"public","type":"*","value":function(event){var BreezeEvent;var dispatchEvent;if(!(System.instanceOf(event,BreezeEvent)))throw __newInstance__("136:49",Error,['invalid event.']);var target=__prop__("137:47",this,'getProxyTarget');var targets=__call__("138:54",this,'getProxyTargets',[998]);var i=0;var element;__call__("141:20",target);while(i<__prop__("142:36",target,"length")&&!__prop__("142:65",event,"propagationStopped")){element=__prop__("144:36",target,i);__prop__("145:35",event,"currentTarget",element);__prop__("146:28",event,"target",__prop__("146:43",event,"target")||element);__call__("147:38",dispatchEvent,[event]);i++;}return !__prop__("150:44",event,"propagationStopped");}}
}});
__prop__=EventDispatcher.prop;
__call__=EventDispatcher.call;
__newInstance__=EventDispatcher.newInstance;
__check__=EventDispatcher.checkType;
})();
(function(){
var EventDispatcher=System.define("lib.EventDispatcher");
var B=System.define("com.B");
var IProsess=System.define("lib.IProsess");
var Abs=System.define("com.Abs");
var Main;
var __prop__;
var __call__;
var __newInstance__;
var __check__;
Main=System.define("Main",{
"constructor":function(jj){this["1486400551554"]={"names":'399999',"uuu":'yhhh',"_home":'ooooo',"home":"__getter__"};
B.constructor.call(this);
var uu,yyyy,hhhh;
var b;
var c;
var items=ddd=__check__("37:35",Array,[]||{});
    var i=50;var j=i;__call__("45:61",System,"log",[__call__("45:38",[666],"keys"),__call__("45:59",System,"trim",[''])]);var a=__newInstance__("47:38",Array,[5,6,8]);__prop__("48:23",a,'name',666);__call__("50:31",a,"push",['yejun']);var cc={"age":100};__prop__("54:20",cc,["age","/="],3);__prop__("55:19",cc,"bb",66666);__call__("56:41",System,"log",[cc,__prop__("56:40",Main,"name")]);var o=__newInstance__("60:34",Object);__prop__("62:23",o,'ssss',666);__call__("66:124",System,"log",[a,'=====',__prop__("66:47",a,"length"),__call__("66:60",a,"values"),__call__("66:70",o,"keys"),__call__("66:86",this,"values"),__call__("66:122",['=======','++++++++++'],"values")]);__call__("70:17",System,"log",['%s',__call__("70:16",a,"find",[function(val){return val===666;}])]);var target=1,index=0;for(c in items){__call__("79:55",System,"log",[__call__("79:40",items,c),'====88888']);}(function(){for(var i=j;i<60;i++){b=i;var hh=i;uu=123,hhhh=6899;yyyy=8888888888;__call__("92:37",System,"log",[hh,i]);if(false){(function(){var hh;__call__("100:41",System,"log",[jj]);}).call(this);}}}).call(this);
__call__("106:32",System,"log",[i,b]);__call__("107:45",this,"tests",[undefined,2,3,4,5,6]);__call__("109:57",System,"log",[System.is(this,IProsess),'==========']);},
"implements":[IProsess],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\Main.as",
"static":{
"name":{"id":"var","qualifier":"public","type":String,"value":'3999 yyy fsss 666'}
},
"token":"1486400551554",
"extends":B,
"classname":"Main",
"package":"",
"isAbstract":false,
"proto":{
"names":{"id":"var","qualifier":"public","type":String,"value":'399999'},
"uuu":{"id":"var","qualifier":"public","type":String,"value":'yhhh'},
"_home":{"id":"var","qualifier":"private","type":String,"value":'ooooo'},
"home":{"id":"function","qualifier":"public","type":"*","value":{get:function(){__call__("117:65",System,"log",[System.is(this,IProsess),' the is getter home']);return __prop__("118:29",this,"_home");}}},
"tests":{"id":"function","qualifier":"public","type":"*","value":function(a,){avg=Array.prototype.slice.call(arguments, 1);
if(System.typeOf(a) === "undefined"){a=666;}
var i;
var bb=666;var tests;if(true){(function(){var bb=888;i=9;if(a){}__call__("133:42",System,"log",['===%s',Main]);}).call(this);}__call__("139:39",System,"log",[a,avg,i,bb]);}},
"cre":{"id":"function","qualifier":"protected","type":"*","value":function(str){return __prop__("145:26",this,"bb");}},
"database":{"id":"function","qualifier":"public","type":String,"value":function(name,type,type){return '';}}
}});
__prop__=Main.prop;
__call__=Main.call;
__newInstance__=Main.newInstance;
__check__=Main.checkType;
})();
delete System.define;
var main=System.getDefinitionByName("Main");
System.factory(main);
})(System.Object,System.Array,System.String,System.Class,System.Interface);
})();