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
system.isFinite = isFinite;
system.decodeURI= decodeURI;
system.decodeURIComponent= decodeURIComponent;
system.encodeURI= encodeURI;
system.encodeURIComponent= encodeURIComponent;
system.escape= escape;
system.eval= eval;
system.isNaN= isNaN;
system.parseFloat= parseFloat;
system.parseInt= parseInt;
system.unescape= unescape;

/**
 * 环境参数配置
 */
system.env={
    'BROWSER_IE':'IE',
    'BROWSER_FIREFOX':'FIREFOX',
    'BROWSER_CHROME':'CHROME',
    'BROWSER_OPERA':'OPERA',
    'BROWSER_SAFARI':'SAFARI',
    'BROWSER_MOZILLA':'MOZILLA',
    'NODE_JS':'NODE_JS',
    'IS_CLIENT':false,
};

/**
 * 获取环境变量的参数
 */
(function(env){

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
        env.IS_CLIENT=true;

    }else if( typeof process !== "undefined" )
    {
        _platform=[env.NODE_JS, process.versions.node];
    }

    /**
     * 获取当前运行平台
     * @returns {*}
     */
    env.platform = function platform( name ) {
        if( name != null )return name == _platform[0];
        return _platform[0];
    }

    /**
     * 判断是否为指定的浏览器
     * @param type
     * @returns {string|null}
     */
    env.version=function version(value, expre)
    {
        var result = _platform[1];
        if( value==null )return result;
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

}(system.env));


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
    if( theClass === Class )
    {
        return instanceObj instanceof Class;
    }
    var proto = $get(instanceObj,"constructor");
    if( proto instanceof Class)
    {
        while( proto )
        {
            if( proto === theClass )return true;
            proto=$get(proto,"extends");
        }
    }

    //如果不是一个函数直接返回false
    if( typeof theClass !== "function" )
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
    if( theClass === Class )
    {
        return instanceObj instanceof Class;
    }
    var proto = $get( instanceObj, "constructor");
    if( proto instanceof Class )
    {
        while( proto )
        {
            if( proto === theClass )return true;
            var impls = $get(proto,"implements");
            if( impls && $get(impls,"length") > 0 )
            {
                var i = 0;
                var len=$get(impls,"length");
                for(;i<len;i++)
                {
                    var interfaceModule = impls[i];
                    while ( interfaceModule )
                    {
                        if( interfaceModule === theClass )return true;
                        interfaceModule = $get(interfaceModule,"extends");
                    }
                }
            }
            proto=$get(proto,"extends");
        }
    }

    if( typeof theClass !== "function" )
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
    if( $hasOwnProperty.call(modules,name) )return $get(modules,name);
    if( $hasOwnProperty.call(system,name) )return $get(system,name);
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
    return $get(classModule,"package") ? $get(classModule,"package")+'.'+$get(classModule,"classname") : $get(classModule,"classname");
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
        var parentModule = $get(classModule,"extends");
        if ( parentModule )
        {
            return $get(parentModule,"fullclassname");
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
    var result = proto === Object.prototype || proto===$Object.prototype;
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
    var proto =  Object.getPrototypeOf(val);
    return proto === Array.prototype || proto===$Array.prototype;
};
system.isArray =isArray;

/**
 * 判断是否为函数
 * @param val
 * @returns {boolean}
 */
function isFunction( val ){
    if(!val)return false;
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
 * 将字符串的首字母转换为大写
 * @param str
 * @returns {string}
 */
function ucfirst( str )
{
    return typeof str === "string" ? str.charAt(0).toUpperCase()+str.substr(1) : str;
};
system.ucfirst=ucfirst;

/**
 * 将字符串的首字母转换为小写
 * @param str
 * @returns {string}
 */
function lcfirst( str )
{
    return typeof str === "string" ? str.charAt(0).toLowerCase()+str.substr(1) : str;
};
system.lcfirst=lcfirst;

/**
 * 格式化输出
 * @format
 * @param [...]
 * @returns {string}
 */
function format()
{
    var str='',i= 1,len=arguments.length,param;
    if( len > 0 && typeof arguments[0] === "string" )
    {
        str=arguments[0];
        for (; i < len; i++) {
            param = arguments[i];
            str = str.replace(/%(s|d|f)/, function (all, method) {
                if (method === 'd') {
                    return parseInt(param);
                } else if (method === 'f') return parseFloat(param);
                return Object.prototype.valueOf.call(param);
            })
        }
        str.replace(/%(s|d|f)/g, '');
    }
    return str;
};
system.format=format;

/**
 * 复制字符串到指定的次数
 * @param string str
 * @param number num
 * @returns {string}
 */
function repeat(str, num )
{
    if( typeof str === "string" )
    {
        return new Array( (parseInt(num) || 0)+1 ).join(str);
    }
    return '';
};
system.repeat=repeat;

/**
 * 比较两个两个字符串的值。
 * 如果 a > b 返回 1 a<b 返回 -1 否则返回 0
 * 比较的优先级数字优先于字符串。字母及汉字是按本地字符集排序。
 * @param a
 * @param b
 * @returns {*}
 */
function compare(a, b)
{
    var c = parseFloat( a ), d = parseFloat( b );
    if( isNaN(c) && isNaN(d) )
    {
        return a.localeCompare(b);

    }else if( !isNaN(c) && !isNaN(d) )
    {
        return c > d ? 1 : (c < d ? -1 : 0);
    }
    return isNaN(c) ? 1 : -1;
};
system.compare=compare;
