/**
 * 控制台输出对象时先转成字符串
 * @param item
 * @returns {*}
 */
var toString = function (item)
{
    if( isArray(item) )return Array.prototype.map.call(item,toString);
    if( isObject(item,true) ){
        var objs={};
        for(var i in item){objs[i] = toString(item[i]);}
        return objs;
    }
    return item ? item.valueOf() : item;
}
system.log = function log(){
    console.log.apply(undefined, Array.prototype.map.call(arguments,toString) );
};
system.info =function info(){
    console.info.apply(undefined, Array.prototype.map.call(arguments,toString) );
};
system.trace = function trace(){
    console.log.apply(undefined, ['Trace: '].concat( Array.prototype.map.call(arguments,toString) ) );
    console.log( '   At '+$traceItems.join('\n   At ') );
};
system.warn = function warn(){
    console.warn.apply(undefined, Array.prototype.map.call(arguments,toString) );
};
system.error = function error(){
    console.error.apply(undefined, Array.prototype.map.call(arguments,toString) );
};
system.dir = function dir(){
    console.dir.apply(undefined, Array.prototype.map.call(arguments,toString) );
};
system.assert = console.assert;
system.time = console.time;
system.timeEnd = console.timeEnd;

/**
 * 全局函数
 * @type {*|Function}
 */
system.isFinite = isFinite || function () {};
system.decodeURI= decodeURI || function () {};
system.decodeURIComponent= decodeURIComponent || function () {};
system.encodeURI= encodeURI || function () {};
system.encodeURIComponent= encodeURIComponent || function () {};
system.escape= escape || function () {};
system.eval= eval || function () {};
system.isNaN= isNaN || function () {};
system.parseFloat= parseFloat || function () {};
system.parseInt= parseInt || function () {};
system.unescape= unescape || function () {};

/**
 * 环境参数配置
 */
system.Env={
    'BROWSER_IE':'IE',
    'BROWSER_FIREFOX':'FIREFOX',
    'BROWSER_CHROME':'CHROME',
    'BROWSER_OPERA':'OPERA',
    'BROWSER_SAFARI':'SAFARI',
    'BROWSER_MOZILLA':'MOZILLA',
    'NODE_JS':'NODEJS',
}

/**
 * 获取环境变量的参数
 */
;(function(env){

    var _platform=[];
    if( typeof navigator !== "undefined" )
    {
        var ua = navigator.userAgent.toLowerCase();
        var s;
        (s = ua.match(/msie ([\d.]+)/))             ? _platform=[env.BROWSER_IE,parseFloat(s[1])] :
        (s = ua.match(/firefox\/([\d.]+)/))         ? _platform=[env.BROWSER_FIREFOX,parseFloat(s[1])] :
        (s = ua.match(/chrome\/([\d.]+)/))          ? _platform=[env.BROWSER_CHROME,parseFloat(s[1])] :
        (s = ua.match(/opera.([\d.]+)/))            ? _platform=[env.BROWSER_OPERA,parseFloat(s[1])] :
        (s = ua.match(/version\/([\d.]+).*safari/)) ? _platform=[env.BROWSER_SAFARI,parseFloat(s[1])] :
        (s = ua.match(/^mozilla\/([\d.]+)/))        ? _platform=[env.BROWSER_MOZILLA,parseFloat(s[1])] : null ;

    }else if( typeof process !== "undefined" )
    {
        _platform=[env.NODE_JS, process.version ];
    }

    /**
     * 获取当前运行平台
     * @returns {*}
     */
    env.platform = function platform( name ) {
        if( name != null )return name == platform[0];
        return platform[0];
    }

    /**
     * 判断是否为指定的浏览器
     * @param type
     * @returns {string|null}
     */
    env.version=function version(value, expre)
    {
        var result = _platform[1];
        if( arguments.length===0 )return result;
        value = parseFloat(value);
        switch ( expre )
        {
            case '=' :
                return value == result;
            case '!=' :
                return value != result;
            case '>' :
                return value > result;
            case '>=' :
                return value >= result;
            case '<' :
                return value < result;
            default:
                return value <= result;
        }
    };

}(system.Env));


/**
 * 返回对象类型的字符串表示形式
 * @param instanceObj
 * @returns {*}
 */
function typeOf( instanceObj )
{
    if( instanceObj instanceof Class )return 'class';
    if( instanceObj instanceof Interface )return 'interface';
    return typeof instanceObj;
}
system.typeOf=typeOf;

/**
 * 检查实例对象是否属于指定的类型(不会检查接口类型)
 * @param instanceObj
 * @param theClass
 * @returns {boolean}
 */
function instanceOf(instanceObj, theClass)
{
    var isclass = theClass instanceof Class;
    //instanceof 不检查接口类型
    if( !isclass && theClass instanceof Interface )return false;
    if( instanceObj && isclass )
    {
        if( instanceObj instanceof Class )return isclass;
        var proto = instanceObj.constructor;
        while( proto )
        {
            if( proto === theClass )return true;
            proto=proto.extends;
        }
    }
    //如果不是一个函数直接返回false
    else if( typeof theClass !== "function" )
    {
        return false;
    }
    instanceObj = Object(instanceObj);
    return instanceObj instanceof theClass || ( theClass===system.JSON && isObject(instanceObj,true) );
}
system.instanceOf=instanceOf;
/**
 * 检查实例对象是否属于指定的类型(检查接口类型)
 * @param instanceObj
 * @param theClass
 * @returns {boolean}
 */
function is(instanceObj, theClass)
{
    var isclass = theClass instanceof Class;
    var isInterface = !isclass ? theClass instanceof Interface : false;
    if(instanceObj && (isclass || isInterface) )
    {
        if( instanceObj instanceof Class )return isclass;
        var proto = instanceObj.constructor;
        while( proto )
        {
            if( proto === theClass )return true;
            if( proto.implements && proto.implements.length > 0 )
            {
                var i = 0;
                for(;i<proto.implements.length;i++)
                {
                    var interfaceModule = proto.implements[i];
                    while ( interfaceModule )
                    {
                        if( interfaceModule === theClass )return true;
                        interfaceModule = interfaceModule.extends;
                    }
                }
            }
            proto=proto.extends;
        }
        if( isInterface )return false;

    }else if( typeof theClass !== "function" )
    {
        return false;
    }
    instanceObj = Object( instanceObj );
    return instanceObj instanceof theClass || ( theClass===system.JSON && isObject(instanceObj,true) );
}
system.is=is;

/**
 * 根据指定的类名获取类的对象
 * @param name
 * @returns {Object}
 */
function getDefinitionByName( name )
{
    if( modules[ name ] )return modules[ name];
    if( system[name] )return system[name];
    for ( var i in modules )if( i=== name )return modules[i];
    throwError('type', '"'+name+'" is not define');
}
system.getDefinitionByName =getDefinitionByName;

/**
 * @private
 * 获取一个类的命名
 * @param classModule
 * @returns {string}
 */
function getFullname(classModule) {
    return classModule.package ? classModule.package+'.'+classModule.classname : classModule.classname;
}

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
        case 'class'  : return  getFullname(value);
        case 'interface': return  getFullname(value);
        case 'function' :
            if (value === system.String)return 'String';
            if (value === system.Boolean)return 'Boolean';
            if (value === system.Number)return 'Number';
            if (value === system.RegExp)return 'RegExp';
            if ( value === system.Array )return 'Array';
            if ( value === system.Date )return 'Date';
            if ( value === system.Object )return 'Object';
            if ( value === system.Iterator )return 'Iterator';
            if ( value === system.Reflect )return 'Reflect';
            if (value === system.JSON)return 'JSON';
            return 'Function';
        default :
            if( value=== system )return 'System';
            if( value === system.Math )return 'Math';
            if( value === system.Reflect )return 'Reflect';
            if( value === system.Iterator )return 'Iterator';
            if( isArray(value) )return 'Array';
            if( isObject(value,true) )return 'Object';
            if( value instanceof system.RegExp )return 'RegExp';
            if( value instanceof system.Date )return 'Date';
            if( value instanceof String )return 'String';
            if( value instanceof Number )return 'Number';
            if( value instanceof Boolean )return 'Boolean';
            if( value.constructor instanceof Class )return getFullname(value.constructor);
    }
    throwError('reference','type does not exist');
}
system.getQualifiedClassName=getQualifiedClassName;
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
system.getQualifiedSuperclassName =getQualifiedSuperclassName;
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
    var result = !!(proto === Object.prototype || proto===$Object.prototype);
    if( !result && flag !== true && isArray(val) )return true;
    return result;
};
system.isObject =isObject;
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
system.isDefined =isDefined;
/**
 * 判断是否为数组
 * @param val
 * @returns {boolean}
 */
function isArray(val)
{
    if(!val)return false;
    return val instanceof Array || val instanceof $Array;
};
system.isArray =isArray;

/**
 * 判断是否为函数
 * @param val
 * @returns {boolean}
 */
function isFunction( val ){
    return typeof val === 'function' || val instanceof Function;
};
system.isFunction =isFunction;
/**
 * 判断是否为布尔类型
 * @param val
 * @returns {boolean}
 */
function isBoolean( val ){
    return typeof val === 'boolean';
};
system.isBoolean=isBoolean;
/**
 * 判断是否为字符串
 * @param val
 * @returns {boolean}
 */
function isString(val )
{
    return typeof val === 'string';
};
system.isString=isString;
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
system.isScalar=isScalar;
/**
 * 判断是否为数字类型
 * @param val
 * @returns {boolean}
 */
function isNumber(val )
{
    return typeof val === 'number';
};
system.isNumber=isNumber;
/**
 * 抛出错误信息
 * @param type
 * @param msg
 */
function throwError(type, msg , line, filename)
{
    switch ( type ){
        case 'type' :
            throw new system.TypeError( msg,line, filename );
            break;
        case 'reference':
            throw new system.ReferenceError( msg ,line, filename);
            break;
        case 'syntax':
            throw new system.SyntaxError( msg ,line, filename );
            break;
        default :
            throw new system.Error( msg , line, filename );
    }
}
system.throwError =throwError;
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
system.isEmpty=isEmpty;

/**
 * 去掉指定字符两边的空白
 * @param str
 * @returns {string}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
}
system.trim = trim;


/**
 * 返回一组指定范围值的数组
 * @param low 最低值
 * @param high 最高值
 * @param step 每次的步增数，默认为1
 */
function range(low,high,step)
{
    var obj = new Array();
    if( !isNumber(step) )step=1;
    step = Math.max(step,1);
    for(;low<high;low+=step)obj.push(low);
    return obj;
}
system.range=range;

/**
 * 数学运算
 * @private
 * @param a
 * @param o
 * @param b
 * @returns {*}
 */
function mathOperator( a, o, b)
{
    switch (o)
    {
        case '=' : return  b;
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
        default :
            throwError('syntax','Invalid operator "'+o+'"' );
    }
}

function toPropertyStr(thisArg, properties ) {
    var items = isArray(properties) ? Array.prototype.map.call(properties,function (item) {
        if( typeof item === "string" )return item;
        return getQualifiedClassName( item );
    }) : [properties];
    items.unshift( getQualifiedClassName( thisArg ) );
    return items.join('.');
}

function toErrorMsg(error, classModule, info, thisArg)
{
    var msg = classModule.filename + ':' + info + '\n';
    msg +=  typeof error === "string" ? error : error.message;
    throwError("reference", msg, info, classModule.filename );
}

/**
 * @private
 * 生成操作函数
 * @param method
 * @param classModule
 * @returns {Function}
 */
function makeMethods(method, classModule)
{
    switch ( method )
    {
        case 'get' : return function(info, thisArg, property, operator, issuper)
        {
            try{
                if( property==null )return thisArg;
                var receiver = undefined;
                if( issuper ){
                    receiver=thisArg;
                    thisArg = classModule.extends;
                }
                var value=Reflect.get(thisArg, property, receiver, classModule);
                var ret = value;
                switch ( operator ){
                    case ';++':
                        value++;
                        Reflect.set(thisArg, property, value , receiver, classModule);
                        break;
                    case ';--':
                        value--;
                        Reflect.set(thisArg, property, value , receiver, classModule);
                        break;
                    case '++;':
                        ++ret;
                        Reflect.set(thisArg, property, ret , receiver, classModule);
                        break;
                    case '--;':
                        --ret;
                        Reflect.set(thisArg, property, ret , receiver, classModule);
                        break;;
                }
                return ret;
            }catch(error){
                toErrorMsg(error, classModule, info, thisArg);
            }
        }
        case 'set' : return function(info, thisArg, property,value, operator, issuper)
        {
            try{
                if( property == null )return value;
                var receiver=undefined;
                if( issuper ){
                    receiver=thisArg;
                    thisArg = classModule.extends;
                }
                if( operator && operator !=='=' )
                {
                    value = mathOperator( Reflect.get(thisArg, property, receiver, classModule), operator, value);
                }
                Reflect.set(thisArg, property, value, receiver, classModule);
                return value;
            }catch(error){
                toErrorMsg(error, classModule, info, thisArg);
            }
        }
        case 'delete' : return function(info, thisArg, property)
        {
            try{
                return Reflect.deleteProperty(thisArg, property);
            }catch(error){
                toErrorMsg(error, classModule, info, thisArg);
            }
        }
        case 'new' : return function(info, theClass, argumentsList)
        {
            try{
                return Reflect.construct(theClass, argumentsList);
            }catch(error){
                toErrorMsg(error, classModule, info, theClass);
            }
        }
        case 'apply' : return function(info,thisArg, property, argumentsList,issuper)
        {
            try{
                var receiver=undefined;
                if( issuper ){
                    receiver=thisArg;
                    thisArg = classModule.extends;
                }
                if( property ) {
                    return Reflect.apply( Reflect.get(thisArg, property, receiver, classModule), receiver || thisArg, argumentsList );
                }else{
                    return Reflect.apply(thisArg, receiver, argumentsList);
                }
            }catch(error){
                toErrorMsg(error, classModule, info, thisArg);
            }
        }
        case 'check' : return function (info, type, value)
        {
            if( value === null )return value;
            if ( !system.is(value, type) )toErrorMsg('TypeError Specify the type of value do not match. must is "' + getQualifiedClassName(type) + '"', classModule, info, value);
            return value;
        }
    }
}

/**
 * 定义Class或者Interface对象
 * @param name
 * @param descriptions
 * @param isInterface
 * @returns {*}
 */
function define(name , descriptions , isInterface)
{
    if( typeof system[ name ] === "function" )return system[ name ];
    var classModule;
    if( modules[ name ] && (modules[ name ] instanceof Class  || modules[ name ] instanceof Interface) )
    {
        classModule = modules[ name ];
    }else
    {
        if( isInterface )
        {
            classModule = modules[ name ] = new Interface();
            descriptions.constructor = null;
        }else
        {
            classModule = modules[name] = new Class();
            classModule.delete = makeMethods('delete', classModule);
            classModule.get = makeMethods('get', classModule);
            classModule.set = makeMethods('set', classModule);
            classModule.new = makeMethods('new', classModule);
            classModule.apply = makeMethods('apply', classModule);
            classModule.check = makeMethods('check', classModule);
        }
    }

    //如果是定义类或者接口
    if( typeof descriptions === "object" )
    {
        for (var prop in descriptions )classModule[prop] = descriptions[prop];
        if( typeof descriptions.constructor === "function" )
        {
            descriptions.constructor.prototype= new Object();
            descriptions.constructor.prototype.constructor = classModule;
            //开放原型继承
            classModule.prototype = descriptions.constructor.prototype;
        }
    }
    return classModule;
}
system.define=define;
