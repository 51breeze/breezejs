(function(){
var System = (function(_Object,_String,_Array,_Error){
var s={};
var globals={};
var packages={};
function getPrototypeOf(obj)
{
    if( typeof _Object.getPrototypeOf === "function" )
    {
        return _Object.getPrototypeOf(obj);
    }else
    {
        return obj.__proto__ || (obj ? obj.constructor.prototype : null);
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
    if( value && s.instanceof(value, Object) )return value;
    if( !(this instanceof Object) )return new Object( value );
    if ( value && isObject(value,true) )this.merge(true,value);
}

Object.prototype = new _Object();
Object.prototype.constructor=Object;

/**
 * 指示 Object 类的实例是否在指定为参数的对象的原型链中
 * @param theClass
 * @returns {Boolean}
 */
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
    return _Object.isPrototypeOf.call(obj, theClass );
}

/**
 * 表示对象是否已经定义了指定的属性。
 * 如果目标对象具有与 name 参数指定的字符串匹配的属性，则此方法返回 true；否则返回 false。
 * @param prop 对象的属性。
 * @returns {Boolean}
 */
Object.prototype.hasOwnProperty = function( name )
{
    var obj = this.constructor instanceof Class ? this.constructor : this;
    if( obj instanceof Class )
    {
        var desc = obj === this ? obj.static[name] : obj.proto[name];
        return desc && desc.id !== "function";
    }
    return _Object.hasOwnProperty.call(obj,name)
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
    var obj = this.constructor instanceof Class ? this.constructor : this;
    if( obj instanceof Class )
    {
       var desc = obj === this ? obj.static[name] : obj.proto[ name ];
       if( !desc || desc.id === "function" )return false;
       return desc.enumerable===true;
    }
    return _Object.propertyIsEnumerable.call(obj,name);
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
        _Object.defineProperty(obj, name, {enumerable:isEnum !== false } );
    }
}

/**
 * 返回指定对象的原始值
 * @returns {String}
 */
Object.prototype.valueOf=function()
{
    var obj = this.constructor instanceof Class ? this.constructor : this;
    if( obj instanceof Class )
    {
        return obj === this ? '[class '+obj.classname+']' : '[object '+ obj.classname+']';
    }
    return _Object.prototype.valueOf.call( this );
}

/**
 * 返回指定对象的字符串表示形式。
 * @returns {String}
 */
Object.prototype.toString=function()
{
    var obj = this.constructor instanceof Class ? this.constructor : this;
    if( obj instanceof Class )
    {
        return obj === this ? '[class '+obj.classname+']' : '[object '+ obj.classname+']';
    }
    return _Object.prototype.toString.call( this );
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
                if( typeof src === "function" && s.instanceof(target, Object) )
                {
                    throwError('syntax','"'+name+'" is a protected method');
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
s.Error = Error;

function ReferenceError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='ReferenceError';
}
ReferenceError.prototype = new Error();
ReferenceError.prototype.constructor=ReferenceError;

function TypeError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='TypeError';
}
TypeError.prototype = new Error();
TypeError.prototype.constructor=TypeError;

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
function Class(){}
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
s.Class = Class;

/**
 * 接口构造函数
 * @constructor
 */
function Interface(){}
Interface.prototype              = new Object();
Interface.prototype.constructor  = null;
Interface.prototype.extends      = null;
Interface.prototype.proto        = null;
Interface.prototype.classname    = '';
Interface.prototype.package      = '';
Interface.prototype.token        = '';
s.Interface = Interface;

globals.Object = Object;
globals.Class = Class;
globals.Interface = Interface;
globals.String = String;
globals.Array = Array;
globals.Number = Number;
globals.RegExp = RegExp;
globals.Boolean = Boolean;
globals.System = s;

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
 * @param instanceObj
 * @param theClass
 * @returns {boolean}
 */
s.instanceof=function(instanceObj, theClass)
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
            instanceObj=instanceObj.extends;
        }
    }
    if( typeof theClass !== "function" )return false;
    if( instanceObj instanceof theClass )return true;
    var type = s.typeof( instanceObj );
    switch ( type )
    {
        case 'string' : return theClass === String;
        case 'boolean' : return theClass === Boolean;
        case 'number' : return theClass === Number;
        case 'class' : return theClass === Class;
    }
    return false;
}

/**
 * 检查实例对象是否属于指定的类型(检查接口类型)
 * @param instanceObj
 * @param theClass
 * @returns {boolean}
 */
s.is=function(instanceObj, theClass)
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
    return s.instanceof( instanceObj, theClass);
}


/**
 * 为指定的类创建一个新的实例对象
 * @param fn
 * @param param
 * @returns {nop}
 */
function Nop(){}
s.new=function( theClass )
{
    var index = 1;
    if( typeof theClass === "string" )
    {
        index++;
        theClass = arguments[1];
    }
    var obj;
    var constructor =  theClass;
    if( theClass instanceof Class )
    {
        if( theClass.isAbstract )throwError('type','Abstract class of cannot be instantiated');
        constructor = theClass.constructor;
    }

    if( typeof constructor !== "function" )throwError('type','is not constructor');
    if( arguments.length <= 2 )
    {
        obj = new constructor( arguments[index] );
    }else
    {
        Nop.prototype = constructor.prototype;
        obj = constructor.apply( new Nop() , Array.prototype.slice.call(arguments, index) );
    }
    if( constructor !== theClass )
    {
        obj.constructor = theClass;
    }
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
         case 'function' :
             if( value === String )return 'String';
             if( value === Boolean )return 'Boolean';
             if( value === Number )return 'Number';
             if( value === RegExp )return 'RegExp';
             if( value === Array )return 'Array';
             if( value === Class )return 'Class';
             if( value === Object || value === _Object )return 'Object';
             return 'Function';
             break;
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
     throwError('type','type does exits' )
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
            var classname = parentModule.classname;
            return parentModule.package ? parentModule.package +'.'+ classname : classname;
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
    var result = val && proto? (proto.constructor === Object || proto.constructor===_Object) : false;
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


//引用属性或者方法
var __call=(function () {

    /**
     * 检查值的类型是否和声明时的类型一致
     * @param description
     * @param value
     */
    function checkValueType(description,value,strName )
    {
        if( description && description.type !== '*' )
        {
            var type = typeof value;
            var result = false;
            switch ( type )
            {
                case 'string' :
                    result =  description.type === String || description.type === Object;
                    break;
                case 'number' :
                    result =  description.type === Number || description.type === Object;
                    break;
                case 'boolean':
                    result =  description.type === Boolean;
                    break;
                default :
                    result = description.type === Object ? true : System.instanceof(value,description.type);
                    break;
            }
            if( !result )
            {
                throwError('type', '"' + strName + '" type can only be a (' + System.getQualifiedClassName(description.type) + ')');
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
                    is = referenceModule.isPrototypeOf( classModule );
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
        //对属性引用的操作
        if( lastProp )
        {
            //是否对静态模块的引用
            var isStatic = refObj instanceof Class;
            var referenceModule = isStatic ? refObj : refObj.constructor;

            //是否为引用本地类的模块
            if( referenceModule instanceof Class )
            {
                isStatic = isStatic && thisArg === refObj;
                //模块描述符
                desc = isStatic ? referenceModule.static[lastProp] : referenceModule.proto[lastProp];
                //如果本类中没有定义则在在扩展的类中依次向上查找。
                if ( (!desc || (desc.qualifier === 'private' && referenceModule !== classModule) ) && referenceModule.extends )
                {
                    var parentModule = referenceModule.extends;
                    var description;
                    while (parentModule)
                    {
                        description = isStatic ? parentModule.static : parentModule.proto;
                        //继承的属性，私有的路过.
                        if( description[lastProp] && ( description[lastProp].qualifier !== 'private' || parentModule===classModule ) )
                        {
                            desc = description[lastProp];
                            referenceModule = parentModule;
                            break;
                        }
                        parentModule = parentModule.extends;
                    }
                }
                //如果没有在类中定义
                if ( !desc ){
                    throwError('reference', '"' + strName + '" is not defined');
                }
                //是否有访问的权限
                if( !checkPrivilege( desc, referenceModule, classModule) )throwError('reference', '"' + strName + '" inaccessible.');
                //如果是一个实例属性
                if( !isStatic && ( desc.id === 'var' || desc.id === 'const' ) )
                {
                    writable = desc.id === 'var';
                    refObj = refObj[ referenceModule.token ];
                }
                //引用描述符的原始值
                else
                {
                    lastProp='value';
                    refObj = desc;
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
        }else if( lastProp )
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
 * 抛出错误信息
 * @param type
 * @param msg
 */
function throwError(type, msg , line, filename)
{
    switch ( type ){
        case 'type' :
            throw new TypeError( msg,line, filename );
            break;
        case 'reference':
            throw new ReferenceError( msg ,line, filename);
            break;
        case 'syntax':
            throw new SyntaxError( msg ,line, filename );
            break;
        default :
            throw new Error( msg , line, filename );
    }
}
s.throwError = throwError;

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
            var msg = classModule.filename + ':' + info + '\n';
            msg += error.filename ? error.message : error.type +' '+ error.message;
            throwError("reference", msg, info, classModule.filename );
        }
    }
}

s.define=function( name , descriptor , isInterface)
{
    if( typeof globals[ name ] === "function" )return globals[ name ];
    var classModule;
    if( packages[ name ] instanceof Class  || packages[ name ] instanceof Interface )
    {
        classModule = packages[ name ];

    }else
    {
        if( isInterface )
        {
            classModule = packages[ name ] = new Interface();
            descriptor.constructor = null;
        }else
        {
            classModule = packages[name] = new Class();
            classModule.call = make(classModule, true);
            classModule.prop = make(classModule, false);
        }
    }

    if( typeof descriptor === "object" )
    {
        classModule.merge( descriptor );
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
return s;
})(Object,String,Array,Error);

(function(Object, Class){
(function(){
var D;
var __prop__;
var __call__;
D=System.define("com.D",{
"constructor":function(jj){this["1484659445221"]={"bb":123};
if(System.typeof(jj) === "undefined"){jj='123';}
if(!System.is(jj,String))System.throwError("type","type of mismatch. must is a String");
var cc=66;},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\D.as",
"static":{},
"token":"1484659445221",
"extends":null,
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
Abs=System.define("com.Abs",{
"constructor":function(){this["1485139948086"]={"dispatcher":null,"age":'3',"name":'666 66fff'};
return D.constructor.call(this);},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\Abs.as",
"static":{
"address":{"id":"var","qualifier":"private","type":String,"value":'shu line 6666'},
"classname":{"id":"function","qualifier":"protected","type":String,"value":{get:function(){return '==the B classname=';}}}
},
"token":"1485139948086",
"extends":D,
"classname":"Abs",
"package":"com",
"isAbstract":true,
"proto":{
"dispatcher":{"id":"var","qualifier":"public","type":EventDispatcher,"value":null},
"age":{"id":"const","qualifier":"protected","type":String,"value":'3'},
"createName":{"id":"function","qualifier":"protected","type":"*","value":function(){return 'the fun createname';}},
"name":{"id":"var","qualifier":"private","type":String,"value":'666 66fff'},
"cre":{"id":"function","qualifier":"protected","type":"*","value":function(str){__call__("46:37",console,"log",[__prop__("46:35",this,"name")]);__call__("47:36",console,"log",['call cre']);}},
"connect":{"id":"function","qualifier":"public","type":String,"value":function(str){return '';}}
}});
__prop__=Abs.prop;
__call__=Abs.call;
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
B=System.define("com.B",{
"constructor":function(jj){this["1485134406017"]={"dispatcher":null,"age":'3',"name":'666 66fff'};
__call__("38:23",this,[D],[jj]);var cc=66;__call__("40:54",console,"log",['===the is B====',System.is(this,D)]);},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\B.as",
"static":{
"address":{"id":"var","qualifier":"private","type":String,"value":'shu line 6666'},
"classname":{"id":"function","qualifier":"protected","type":String,"value":{get:function(){return '==the B classname=';}}}
},
"token":"1485134406017",
"extends":D,
"classname":"B",
"package":"com",
"isAbstract":false,
"proto":{
"dispatcher":{"id":"var","qualifier":"public","type":EventDispatcher,"value":null},
"age":{"id":"const","qualifier":"protected","type":String,"value":'3'},
"createName":{"id":"function","qualifier":"protected","type":"*","value":function(){return 'the fun createname';}},
"name":{"id":"var","qualifier":"private","type":String,"value":'666 66fff'},
"cre":{"id":"function","qualifier":"protected","type":"*","value":function(str){__call__("55:37",console,"log",[__prop__("55:35",this,"name")]);__call__("56:36",console,"log",['call cre']);}},
"connect":{"id":"function","qualifier":"public","type":String,"value":function(str){return '';}}
}});
__prop__=B.prop;
__call__=B.call;
})();
(function(){
var B=System.define("com.B");
var EventDispatcher;
var __prop__;
var __call__;
EventDispatcher=System.define("lib.EventDispatcher",{
"constructor":function(target){this["1483963402933"]={"getProxyTarget":null,"storage":null,"forEachCurrentItem":null,"length":null};
Object.constructor.call(this);
__prop__("34:50",this,'getProxyTarget'||__prop__("34:48",this,"length"));__prop__("35:31",this,"getProxyTarget")=target&&1?function(){return __prop__("37:40",target,"length")>0?target:[this];}:function(){return __prop__("40:50",this,"forEachCurrentItem")?[__prop__("40:77",this,"forEachCurrentItem")]:(__prop__("40:94",this,"length")>0?this:[this]);};},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\lib\\EventDispatcher.as",
"static":{
"Listener":{"id":"var","qualifier":"public","type":Class,"value":B},
"SpecialEvent":{"id":"var","qualifier":"public","type":Class,"value":B}
},
"token":"1483963402933",
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
var target=__call__("46:45",this,"getProxyTarget"),index=0;while(index<target){var events=__call__("50:65",this,["storage","call"],[__prop__("50:63",target,index)]);if(events&&__prop__("51:42",events,type)){return true;}index++;}__call__("57:78",console,"log",[System.instanceof(this,EventDispatcher),'====is even ====']);return false;}},
"addEventListener":{"id":"function","qualifier":"public","type":System.define("lib.EventDispatcher"),"value":function(type,callback,useCapture,priority,reference,callback,useCapture,priority,reference){var len=__prop__("70:31",type,"length");if(System.instanceof(type,Array)){while(len>0)__call__("75:106",this,"addEventListener",[__prop__("75:66",type,--len),callback,useCapture,priority,reference]);return this;}if(System.typeof("79:27",type)!=='string'){throw System.new("81:54",Error,['invalid event type.']);}var target=__call__("84:45",this,"getProxyTarget"),index=0;var listener=System.new("86:93",EventDispatcher,"Listener",[callback,useCapture,priority,reference]);var bindBeforeProxy;while(index<__prop__("89:41",target,"length")){__prop__("91:35",listener,"dispatcher")=this;__prop__("92:38",listener,"currentTarget")=__prop__("92:52",target,index);__prop__("93:29",listener,"type")=type;if(!(System.instanceof(__prop__("94:43",bindBeforeProxy,type),__prop__("94:83",EventDispatcher,"SpecialEvent")))||!__call__("95:71",bindBeforeProxy,[type,"callback","call"],[this,listener])){}index++;}return this;}},
"removeEventListener":{"id":"function","qualifier":"public","type":"*","value":function(type,listener,listener){var target=__call__("114:45",this,"getProxyTarget");var b=0;var removeEventListener;while(b<__prop__("117:36",target,"length")){__call__("119:70",removeEventListener,"call",[__prop__("119:50",target,b),type,listener,this]);b++;}return true;}},
"dispatchEvent":{"id":"function","qualifier":"public","type":"*","value":function(event){var BreezeEvent;var dispatchEvent;if(!(System.instanceof(event,BreezeEvent)))throw System.new("136:49",Error,['invalid event.']);var target=__prop__("137:47",this,'getProxyTarget');var targets=__call__("138:54",this,'getProxyTargets',[998]);var i=0;var element;__call__("141:20",target);while(i<__prop__("142:36",target,"length")&&!__prop__("142:65",event,"propagationStopped")){element=__prop__("144:36",target,i);__prop__("145:35",event,"currentTarget")=element;__prop__("146:28",event,"target")=__prop__("146:43",event,"target")||element;__call__("147:38",dispatchEvent,[event]);i++;}return !__prop__("150:44",event,"propagationStopped");}}
}});
__prop__=EventDispatcher.prop;
__call__=EventDispatcher.call;
})();
(function(){
var EventDispatcher=System.define("lib.EventDispatcher");
var B=System.define("com.B");
var IProsess=System.define("lib.IProsess");
var Abs=System.define("com.Abs");
var Main;
var __prop__;
var __call__;
Main=System.define("Main",{
"constructor":function(jj){this["1485154263319"]={"names":'3'};
B.constructor.call(this);
var uu,yyyy,hhhh;
var b;
var c;
var i=50;var items=[];var j=i;var target=1,index=0;for(var c in items){__call__("46:56",console,"log",[__call__("46:41",items,c),'====88888']);}(function(){for(var i=j;i<60;i++){var b=i;var hh=i;var uu=123,hhhh=6899;yyyy=8888888888;__call__("59:38",console,"log",[hh,i]);if(false){(function(i){var hh;__call__("67:42",console,"log",[jj]);__call__("68:71",items,"push",[function(){return i+'---'+hh;}]);}).call(this,i);}}}).call(this);
__call__("73:33",console,"log",[i,b]);__call__("74:45",this,"tests",[undefined,2,3,4,5,6]);__call__("76:58",console,"log",[System.is(this,IProsess),'==========']);},
"implements":[IProsess],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\Main.as",
"static":{
"name":{"id":"var","qualifier":"public","type":String,"value":'3999 yyy fsss 666'}
},
"token":"1485154263319",
"extends":B,
"classname":"Main",
"package":"",
"isAbstract":false,
"proto":{
"names":{"id":"var","qualifier":"public","type":String,"value":'3'},
"tests":{"id":"function","qualifier":"public","type":"*","value":function(a,avg){avg=Array.prototype.slice.call(arguments, 1);
if(System.typeof(a) === "undefined"){a=666;}
var i;
var bb=666;var tests;if(true){(function(){var bb=888;var i=9;if(a){}}).call(this);}__call__("96:40",console,"log",[a,avg,i,bb]);}},
"cre":{"id":"function","qualifier":"protected","type":"*","value":function(str){return __prop__("102:28",this,"bb");}},
"database":{"id":"function","qualifier":"public","type":String,"value":function(name,type,type){return '';}}
}});
__prop__=Main.prop;
__call__=Main.call;
})();
delete System.define;
var main=System.getDefinitionByName("Main");
System.new(main);
})(System.Object, System.Class );
})();