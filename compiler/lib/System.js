(function(_Object,_String,_Array){
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
    if( value )
    {
        var proto = getPrototypeOf(value);
        if ( proto && proto.constructor === Object )return value;
    }
    if( !(this instanceof Object) )return new Object( value );
    if ( value && this.constructor === Object && isObject(value,true) )this.merge(true,value);
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
       return !!desc.enumerable;
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
        return obj === this ? '[class Class]' : '[class '+ obj.classname+']';
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
        return obj === this ? '[class Class]' : '[class '+ obj.classname+']';
    }
    return  _Object.prototype.toString.call( this );
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

globals.Object = Object;
globals.Class = Class;
globals.String = String;
globals.Array = Array;
globals.Number = Number;
globals.RegExp = RegExp;
globals.Boolean = Boolean;

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
    if( theClass instanceof Class )
    {
        if( instanceObj instanceof Class  )return true;
        instanceObj = instanceObj.constructor;
        while( instanceObj )
        {
            if( instanceObj === theClass )return true;
            instanceObj=instanceObj.extends;
        }
    }
    if( typeof theClass !== "function" )return false;
    return instanceObj instanceof theClass;
}

/**
 * 检查实例对象是否属于指定的类型(检查接口类型)
 * @param instanceObj
 * @param theClass
 * @returns {boolean}
 */
s.is=function(instanceObj, theClass)
{
    if( theClass instanceof Class )
    {
        if( instanceObj instanceof Class  )return true;
        instanceObj = instanceObj.constructor;
        while( instanceObj )
        {
            if( instanceObj === theClass )return true;
            if( instanceObj.implements && instanceObj.implements.length > 0 )
            {
                for (var b in instanceObj.implements)
                {
                    if( instanceObj.implements[b] === theClass ) return true;
                }
            }
            instanceObj=instanceObj.extends;
        }
    }
    if( typeof theClass !== "function" )return false;
    return instanceObj instanceof theClass;
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
    var constructor = theClass instanceof Class ? theClass.constructor : theClass;
    if( typeof constructor !== "function" )throw new TypeError('is not constructor');
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

/**
 * 抛出错误信息
 * @param type
 * @param msg
 */
function throwError(type, msg )
{
    switch ( type ){
        case 'type' :
            throw new TypeError( msg );
            break;
        case 'reference':
            throw new ReferenceError( msg );
            break;
        case 'syntax':
            throw new SyntaxError( msg );
            break;
        default :
            throw new Error( msg );
    }
}

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
        }

        if ( !Object.prototype.hasOwnProperty.call(refObj, prop) )throwError('reference', '"' + strName + '" property does not exist');
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
                if ( !desc )throwError('reference', '"' + strName + '" is not defined');
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
            var msg = classModule.filename+':'+info+'\n'
            msg += error.message+'\n';
            throwError("reference", msg );
        }
    }
}

s.define=function( name , descriptor )
{
    if( typeof globals[ name ] === "function" )return globals[ name ];
    var classModule;
    if( packages[ name ] instanceof Class )
    {
        classModule = packages[ name ];
    }else
    {
        classModule = packages[ name ] = new Class();
        classModule.call=make(classModule, true);
        classModule.prop=make(classModule, false);
    }
    if( typeof descriptor === "object" )
    {
        classModule.merge( descriptor );
        if( typeof descriptor.constructor === "function" )
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
})(Object,String,Array);
