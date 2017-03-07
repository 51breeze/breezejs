(function(undefined){
var System=(function($Object,$Function,$Array,$String,$Number,$Boolean,$Math,$Date,$RegExp,$Error,$ReferenceError,$TypeError,$SyntaxError,$JSON,$Reflect){
"use strict";
var System={};
var modules={};
/**
 * 控制台输出对象时先转成字符串
 * @param item
 * @returns {*}
 */

(function (System,console) {

var toString = function (items)
{
   var str=[];
   for(var i=0; i<items.length; i++)
   {
       str.push( System.Object.prototype.valueOf.call(items[i]) );
   }
   return str.join(' ');
}

if( console===null )
{
    (function () {

         var __container__=null;
         function panel() {
             if( System.Element && !__container__ )
             {
                var container = System.Element('<div />');
                 container.style('border','solid 1px #ccc');
                 container.width('100%');
                 container.height(200);
                 container.style('position','absolute');
                 container.style('left','0px');
                 container.style('bottom','0px');
                 container.style('overflow','auto');
                // container.bottom(0);
                // container.left(0);
                 __container__ = container;
                 System.EventDispatcher( document ).addEventListener( System.Event.READY , function (e) {
                     System.Element( document.body ).addChild( container );
                 })
             }
             return __container__;
         }  
        console={
            log:function log() {
                var container = panel();
                if( container ) {
                    container.addChild( '<p style="line-height: 12px;padding: 3px 0px;margin: 0px;">' + toString(arguments) +'</p>' );
                }
            },
            info:function info() {},
            trace:function trace() {},
            warn:function warn() {},
            error:function error() {},
            dir:function dir() {},
            assert:function assert() {},
            time:function time() {},
            timeEnd:function timeEnd() {}
        }
    }());
}

System.log = function log(){
    console.log( toString(arguments) );
};
System.info =function info(){
    console.info( toString(arguments) );
};
System.trace = function trace(){
    console.trace( toString(arguments) );
};
System.warn = function warn(){
    console.warn( toString(arguments) );
};
System.error = function error(){
    console.error( toString(arguments)  );
};
System.dir = function dir(){
    console.dir( toString(arguments) );
};
System.assert = console.assert;
System.time = console.time;
System.timeEnd = console.timeEnd;

}(System, typeof console === "undefined" ? null : console ));

/**
 * 全局函数
 * @type {*|Function}
 */
System.isFinite = isFinite;
System.decodeURI= decodeURI;
System.decodeURIComponent= decodeURIComponent;
System.encodeURI= encodeURI;
System.encodeURIComponent= encodeURIComponent;
/*System.escape= escape;
System.eval= eval;
System.unescape= unescape;*/
System.isNaN= isNaN;
System.parseFloat= parseFloat;
System.parseInt= parseInt;


/**
 * 环境参数配置
 */
System.env={
    'BROWSER_IE':'IE',
    'BROWSER_FIREFOX':'FIREFOX',
    'BROWSER_CHROME':'CHROME',
    'BROWSER_OPERA':'OPERA',
    'BROWSER_SAFARI':'SAFARI',
    'BROWSER_MOZILLA':'MOZILLA',
    'NODE_JS':'NODE_JS',
    'IS_CLIENT':false
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
                return result == value;
            case '!=' :
                return result != value;
            case '>' :
                return result > value;
            case '>=' :
                return result >= value;
            case '<' :
                return result < value;
            default:
                return result <= value;
        }
    };

}(System.env));


/**
 * 返回对象类型的字符串表示形式
 * @param instanceObj
 * @returns {*}
 */

if( System.env.platform( System.env.BROWSER_IE ) && System.env.version( 8, '<=' ) )
{
    System.typeOf= function typeOf( instanceObj )
    {
        if( instanceObj instanceof System.Class )return 'class';
        if( instanceObj instanceof System.Interface )return 'interface';
        var val = typeof instanceObj;
        if( val=== "object" && /function/i.test(instanceObj + "") )
        {
            return "function";
        }else if( val === 'function' && instanceObj.constructor === System.RegExp )
        {
            return "object";
        }
        return val;
    }

}else
{
    System.typeOf=function typeOf( instanceObj )
    {
        if( instanceObj instanceof System.Class )return 'class';
        if( instanceObj instanceof System.Interface )return 'interface';
        return typeof instanceObj;
    }
}


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
    if( proto instanceof System.Class)
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
    instanceObj = System.Object(instanceObj);
    return instanceObj instanceof theClass || ( theClass===System.JSON && isObject(instanceObj,true) );
}
System.instanceOf=instanceOf;
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
    instanceObj = System.Object( instanceObj );
    return instanceObj instanceof theClass || ( theClass===System.JSON && isObject(instanceObj,true) );
}
System.is=is;

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
System.getDefinitionByName =getDefinitionByName;

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
            if (value === System.String)return 'String';
            if (value === System.Boolean)return 'Boolean';
            if (value === System.Number)return 'Number';
            if (value === System.RegExp)return 'RegExp';
            if ( value === System.Array )return 'Array';
            if ( value === System.Date )return 'Date';
            if ( value === System.Object )return 'Object';
            if ( value === System.Iterator )return 'Iterator';
            if ( value === System.Reflect )return 'Reflect';
            if (value === System.JSON)return 'JSON';
            return 'Function';
        default :
            if( value=== system )return 'System';
            if( value === System.Math )return 'Math';
            if( value === System.Reflect )return 'Reflect';
            if( value === System.Iterator )return 'Iterator';
            if( isArray(value) )return 'Array';
            if( isObject(value,true) )return 'Object';
            if( value instanceof System.RegExp )return 'RegExp';
            if( value instanceof System.Date )return 'Date';
            if( value instanceof System.String )return 'String';
            if( value instanceof System.Number )return 'Number';
            if( value instanceof System.Boolean )return 'Boolean';
            if( value.constructor instanceof Class )return getFullname(value.constructor);
    }
    throwError('reference','type does not exist');
}
System.getQualifiedClassName=getQualifiedClassName;
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
System.getQualifiedSuperclassName =getQualifiedSuperclassName;
/**
 * 判断是否为一个可遍历的对象
 * null, undefined 属于对象类型但也会返回 false
 * @param val
 * @param flag 默认为 false。如为true表示一个纯对象,否则数组对象也会返回true
 * @returns {boolean}
 */
function isObject(val , flag )
{
    if( !val || typeof val !== "object" )return false;
    var proto =  Object.getPrototypeOf(val);
    var result = proto === Object.prototype || proto===$Object.prototype;
    if( !result && flag !== true && isArray(val) )return true;
    return result;
};
System.isObject =isObject;
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
System.isDefined =isDefined;
/**
 * 判断是否为数组
 * @param val
 * @returns {boolean}
 */
function isArray(val)
{
    if( !val || typeof val !== "object" )return false;
    var proto =  System.Object.getPrototypeOf(val);
    return proto === System.Array.prototype || proto===$Array.prototype;
};
System.isArray =isArray;

/**
 * 判断是否为函数
 * @param val
 * @returns {boolean}
 */
function isFunction( val ){
    if(!val)return false;
    return System.typeOf(val) === 'function' || val instanceof Function;
};
System.isFunction =isFunction;
/**
 * 判断是否为布尔类型
 * @param val
 * @returns {boolean}
 */
function isBoolean( val ){
    return typeof val === 'boolean';
};
System.isBoolean=isBoolean;
/**
 * 判断是否为字符串
 * @param val
 * @returns {boolean}
 */
function isString( val )
{
    return typeof val === 'string';
};
System.isString=isString;
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
System.isScalar=isScalar;
/**
 * 判断是否为数字类型
 * @param val
 * @returns {boolean}
 */
function isNumber(val )
{
    return typeof val === 'number';
};
System.isNumber=isNumber;

/**
 * 抛出错误信息
 * @param type
 * @param msg
 */
function throwError(type, msg , line, filename)
{
    System.log( type, msg , line, filename );
    switch ( type ){
        case 'type' :
            throw new System.TypeError( msg,line, filename );
            break;
        case 'reference':
            throw new System.ReferenceError( msg ,line, filename);
            break;
        case 'syntax':
            throw new System.SyntaxError( msg ,line, filename );
            break;
        default :
            throw new System.Error( msg , line, filename );
    }
}
System.throwError =throwError;
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
System.isEmpty=isEmpty;

/**
 * 去掉指定字符两边的空白
 * @param str
 * @returns {string}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
}
System.trim = trim;


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
    step = System.Math.max(step,1);
    for(;low<high;low+=step)obj.push(low);
    return obj;
}
System.range=range;

/**
 * 将字符串的首字母转换为大写
 * @param str
 * @returns {string}
 */
function ucfirst( str )
{
    return typeof str === "string" ? str.charAt(0).toUpperCase()+str.substr(1) : str;
};
System.ucfirst=ucfirst;

/**
 * 将字符串的首字母转换为小写
 * @param str
 * @returns {string}
 */
function lcfirst( str )
{
    return typeof str === "string" ? str.charAt(0).toLowerCase()+str.substr(1) : str;
};
System.lcfirst=lcfirst;

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
System.format=format;

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
System.repeat=repeat;

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
System.compare=compare;


/**
 * 格式化输出
 * @format
 * @param [...]
 * @returns {string}
 */
function sprintf()
{
    var str='',i= 1,len=arguments.length,param;
    if( len > 0 )
    {
        str=arguments[0];
        if( typeof str === "string" )
        {
            for (; i < len; i++)
            {
                param = arguments[i];
                str = str.replace(/%(s|d|f|v)/, function (all, method) {
                    if (method === 'd') {
                        param = parseInt(param);
                        return isNaN(param) ? '' : param;
                    } else if (method === 'f') {
                        param = parseFloat(param);
                        return isNaN(param) ? '' : param;
                    } else if (method === 'v') {
                        return System.Object.prototype.valueOf.call(param);
                    }
                    return System.Object.prototype.toString.call(param);
                });
            }
            str.replace(/%(s|d|f|v)/g, '');
        }
    }
    return str;
}
System.sprintf=sprintf;

/**
 * 把一个对象序列化为一个字符串
 * @param object 要序列化的对象
 * @param type   要序列化那种类型,可用值为：url 请求的查询串,style 样式字符串。 默认为 url 类型
 * @param group  是否要用分组，默认是分组（只限url 类型）
 * @return string
 */
function serialize(object, type , group )
{
    if( typeof object === "string" || !object )
        return object;
    var str=[],key,joint='&',separate='=',val='',prefix=isBoolean(group) ? null : group;
    type = type || 'url';
    group = ( group !== false );
    if( type==='style' )
    {
        joint=';';
        separate=':';
        group=false;
    }else if(type === 'attr' )
    {
        separate='=';
        joint=' ';
        group=false;
    }
    if(isObject(object,true) )for( key in object )
    {
        val=type === 'attr' ? '"' +object[key]+'"' : object[key];
        key=prefix ? prefix+'[' + key +']' : key;
        str=str.concat(  typeof val==='object' ?serialize( val ,type , group ? key : false ) : key + separate + val  );
    }
    return str.join( joint );
};
System.serialize=serialize;

/**
 * 将一个已序列化的字符串反序列化为一个对象
 * @param str
 * @returns {{}}
 */
function unserialize( str )
{
    var object={},index,joint='&',separate='=',val,ref,last,group=false;
    if( /[\w\-]+\s*\=.*?(?=\&|$)/.test( str ) )
    {
        str=str.replace(/^&|&$/,'');
        group=true;

    }else if( /[\w\-\_]+\s*\:.*?(?=\;|$)/.test( str ) )
    {
        joint=';';
        separate=':';
        str=str.replace(/^;|;$/,'')
    }

    str=str.split( joint );
    for( index in str )
    {
        val=str[index].split( separate );
        if( group &&  /\]\s*$/.test( val[0] ) )
        {
            ref=object,last;
            val[0].replace(/\w+/ig,function(key){
                last=ref;
                ref=!ref[ key ] ? ref[ key ]={} : ref[ key ];
            });
            last && ( last[ RegExp.lastMatch ]=val[1] );
        }else
        {
            object[ val[0] ]=val[1];
        }
    }
    return object;
};
System.unserialize=unserialize;

/**
 * 获取 1970 到现在的所有毫秒数
 * @returns {number}
 */
function time()
{
    return new System.Date().getTime();
}
System.time = time;

var crc32 = (function () {
    var crc32Table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 " +
    "E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D " +
    "6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 " +
    "3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 " +
    "ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 " +
    "CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 " +
    "01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 " +
    "7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 " +
    "F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE " +
    "A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 " +
    "33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F " +
    "5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C " +
    "74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D " +
    "0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 " +
    "89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 " +
    "D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF " +
    "4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 " +
    "2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 " +
    "EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 " +
    "86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA " +
    "11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 " +
    "4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C " +
    "CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 " +
    "B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
    function crc32( str, crc )
    {
        if( typeof crc === "undefined" ) crc = 0;
        var n = 0; //a number between 0 and 255
        var x = 0; //an hex number
        var iTop = str.length;
        crc = crc ^ (-1);
        for( var i = 0; i < iTop; i++ )
        {
            n = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
            x = "0x" + crc32Table.substr( n * 9, 8 );
            crc = ( crc >>> 8 ) ^ x;
        }
        return Math.abs( crc ^ (-1) );
    };
    return crc32;
}());
System.crc32 = crc32;




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
/**
 * 获取指定对象的原型
 * @type {Object}
 * @returns {Boolean}
 */
Object.getPrototypeOf = $Object.getPrototypeOf || function getPrototypeOf(obj)
{
    if( !obj )return null;
    return obj.__proto__ ? obj.__proto__ : (obj.constructor ? obj.constructor.prototype : null);
}

/**
 * 生成一个对象
 */
Object.create  = $Object.create || (function() {
    function F() {};
    return function (O,P) {
        if (typeof O != 'object')System.throwError('type','Object prototype may only be an Object or null');
        F.prototype = O;
        var obj = new F();
        F.prototype = null;
        if( P !=null )
        {
            P = Object( P );
            for (var n in P)if( $hasOwnProperty.call(P, n) )
            {
                Object.defineProperty(obj,n, P[n]);
            }
        }
        return obj;
    };
})();

/**
 * 定义属性的描述
 * @type {*|Function}
 */
Object.defineProperty =$Object.defineProperty;
if( !Object.defineProperty || ( System.env.platform( System.env.BROWSER_IE ) && System.env.version(8) ) )
{
    Object.defineProperty = function defineProperty(obj, prop, desc)
    {
        if ($hasOwnProperty.call(obj, prop))
        {
            if (obj[prop] instanceof Descriptor)
            {
                if (obj[prop].configurable === false)System.throwError('type', '"' + prop + '" property is not configurable');
                Descriptor.call(obj[prop], desc);
                return;
            }
            if (typeof desc.value === "undefined")desc.value = obj[prop];
        }
        obj[prop] = new Descriptor(desc);
        return;
    };
}

/**
 * 描述符构造器
 * @private
 * @param desc
 * @constructor
 */
function Descriptor( desc )
{
    if( !(this instanceof Descriptor) )return new Descriptor(desc);
    this.writable = !!desc.writable;
    this.enumerable = !!desc.enumerable;
    this.configurable = !!desc.configurable;
    if (typeof desc.value !== "undefined")
    {
        if(desc.get || desc.set || this.get || this.set)throwError('type','value and accessor can only has one');
        this.value = desc.value;
    }
    if ( typeof desc.get !== "undefined" )
    {
        if( typeof desc.get !== "function" )throwError('type','getter accessor is not function');
        if( typeof desc.value !== "undefined" || typeof this.value !== "undefined")throwError('type','value and accessor can only one');
        this.get = desc.get;
    }
    if ( typeof desc.set !== "undefined" )
    {
        if( typeof desc.set !== "function" )throwError('type','setter accessor is not function');
        if( typeof desc.value !== "undefined" || typeof this.value !== "undefined" || this.writable===false )throwError('type','value and accessor and writable can only one');
        this.set = desc.set;
    }
    return this;
}
Descriptor.prototype={};
Descriptor.prototype.constructor = Descriptor;System.Object=Object;
/**
 * 函数构造器
 * @returns {*}
 * @constructor
 */
var Function = function Function() {
    return $Function.apply(this, Array.prototype.slice.call(arguments,0) );
};
Function.prototype = new $Function();
Function.prototype.apply = $Function.prototype.apply;
Function.prototype.call = $Function.prototype.call;

/**
 * 绑定一个对象到返回的函数中
 * 返回一个函数
 * @type {bind}
 */
Function.prototype.bind = $Function.prototype.bind;
if( !$Function.prototype.bind )
{
    Function.prototype.bind = function bind(thisArg)
    {
        if (typeof this !== "function")throwError('type', "Function.prototype.bind - what is trying to be bound is not callable");
        var args = Array.prototype.slice.call(arguments, 1),
            fn = this,
            Nop = function () {
            },
            Bound = function () {
                return fn.apply(this instanceof Nop ? this : thisArg || this, args.concat(Array.prototype.slice.call(arguments)));
            };
        Nop.prototype = this.prototype;
        Bound.prototype = new Nop();
        return Bound;
    };
}System.Function=Function;
/**
 * 数组构造器
 * @returns {Array}
 * @constructor
 */
var Array = function Array(length)
{
    if( !(this instanceof Array) )return $Array.apply( new Array(), Array.prototype.slice.call(arguments,0) );
    this.length=0;
    return $Array.apply(this,Array.prototype.slice.call(arguments,0));
};
Array.prototype = new Object();
Array.prototype.constructor = Array;
Array.prototype.length  =0;
Array.prototype.slice   = $Array.prototype.slice;
Array.prototype.splice  = $Array.prototype.splice;
Array.prototype.concat  = $Array.prototype.concat;
Array.prototype.join    = $Array.prototype.join;
Array.prototype.pop     = $Array.prototype.pop;
Array.prototype.push    = $Array.prototype.push;
Array.prototype.shift   = $Array.prototype.shift;
Array.prototype.unshift = $Array.prototype.unshift;
Array.prototype.sort    = $Array.prototype.sort;
Array.prototype.reverse = $Array.prototype.reverse;
Array.prototype.toString= $Array.prototype.toString;
Array.prototype.valueOf = $Array.prototype.valueOf;

/**
 * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
 * @param callback 一个回调函数。
 * 参数中的第一个为属性值，第二个为属性名。
 * 如果返回 false 则退出循环
 * @returns {Object}
 */
Array.prototype.forEach=function( callback, thisArg )
{
    if (!isFunction(callback))module.throwError('type',callback + " is not a function");
    var it = new Iterator(this);
    thisArg = thisArg || this;
    for(;it.seek();)
    {
        if( callback.call(thisArg,it.current().value, it.current().key , it.items)=== false)return this;
    }
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
    var items = new Array();
    var i = 0;
    if( isObject(this) )
    {
        for (i in this )if (callback.call(thisArg, this[i], i))items.push(this[i]);
    }else
    {
        var it = new Iterator(this);
        var len = it.items.length;
        for (; i < len; i++)if (callback.call(thisArg, it.items[i].value, it.items[i].key))items.push(it.items[i].value);
    }
    return items;
}

/**
 * 返回一个唯一元素的数组
 * @returns {Array}
 */
Array.prototype.unique=function()
{
    var arr= this.slice(0);
    for (var i = 0; i<arr.length; i++)
    {
        for(var b=i+1; b<arr.length; b++ )
        {
            if( arr[i]===arr[b] )
            {
                arr.splice(b,1);
            }
        }
    }
    return arr;
};

/**
 * 将一个数组的所有元素从开始索引填充到具有静态值的结束索引
 * @param value
 * @param start
 * @param end
 * @returns {Object}
 */
Array.prototype.fill = function fill(value, start, end)
{
    var o =isArray(this) ? this : [];
    var len = o.length >> 0;
    var relativeStart = start >> 0;
    var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
    var relativeEnd = end === undefined ? len : end >> 0;
    var final = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
    while (k < final) {
        o[k] = value;
        k++;
    }
    return obj;
};

/**
 * 返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。
 * @param callback
 * @param thisArg
 * @returns {*}
 */
Array.prototype.find = function find(callback,thisArg)
{
    if (typeof callback !== 'function')throwError('type','callback must be a function');
    var it = new Iterator(this);
    var len = it.items.length;
    for (var i = 0; i < len; i++)if ( callback.call(thisArg, it.items[i].value, it.items[i].key) )
    {
        return it.items[i].value;
    }
    return undefined;
};
/**
 * 返回一个数组
 * @type {Function}
 */
Array.prototype.map = $Array.prototype.map || function(callback, thisArg)
{
    var T, A, k;
    if (this == null)System.throwError('type',"this is null or not defined");
    if (!isFunction(callback))System.throwError('type',callback + " is not a function");
    var O =  isObject(this) ? this : [];
    var len = O.length >>> 0;
    if (thisArg)T = thisArg;
    A = new Array(len);
    k = 0;
    var kValue, mappedValue;
    while(k < len) {
        if (k in O) {
            kValue = O[ k ];
            mappedValue = callback.call(T, kValue, k, O);
            A[ k ] = mappedValue;
        }
        k++;
    }
    return A;
};System.Array=Array;
System.String=$String;
System.Number=$Number;
System.Boolean=$Boolean;
System.Math=$Math;
System.Date=$Date;
System.RegExp=$RegExp;
/**
 * 错误消息构造函数
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
var Error = function Error( message , line, filename )
{
    this.message = message;
    this.line=line;
    this.filename = filename;
    this.type='Error';
};
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
System.Error=Error;
/**
 * 引用错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
var ReferenceError = function ReferenceError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='ReferenceError';
};
ReferenceError.prototype = new Error();
ReferenceError.prototype.constructor=ReferenceError;
System.ReferenceError=ReferenceError;
/**
 * 类型错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
var TypeError = function TypeError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='TypeError';
};
TypeError.prototype = new Error();
TypeError.prototype.constructor=TypeError;
System.TypeError=TypeError;
/**
 * 语法错误构造器
 * @param message
 * @param line
 * @param filename
 * @constructor
 */
var SyntaxError = function SyntaxError( message , line, filename )
{
    Error.call(this, message , line, filename);
    this.type='SyntaxError';
};
SyntaxError.prototype = new Error();
SyntaxError.prototype.constructor=SyntaxError;
System.SyntaxError=SyntaxError;
/**
 * JSON 对象构造器
 * @constructor
 */
var JSON = function JSON(){ if(this instanceof JSON)throwError('JSON is not constructor.'); };
(function () {
var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
function escFunc(m) {return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1);};
JSON.parse = function (strJson) {return eval('(' + strJson + ')');}
JSON.stringify = function(value)
{
    if(value == null) return 'null';
    var type = typeof value;
    if (type ==='number')return System.isFinite(value) ? value.toString() : 'null';
    if (type ==='boolean')return value.toString();
    if (type ==='object')
    {
        var tmp = [];
        if (typeof value.toJSON === 'function') {
            return JSON.stringify( value.toJSON() );
        } else if ( isArray(value) ) {
            for (var i = 0; i < value.length; i++)tmp.push( JSON.stringify( value[i] ) );
            return '['+tmp.join(',')+']';
        } else if ( isObject(value,true) ) {
            var items = getEnumerableProperties.call(value);
            for( var i =0; i<items.length; i++ )tmp.push( JSON.stringify(items[i].key)+':'+JSON.stringify(items[i].value) );
            return '{' + tmp.join(', ') + '}';
        }
    }
    return '"' + value.toString().replace(escRE, escFunc) + '"';
};
}());
System.JSON=JSON;
/**
 * Reflect是一个内置的对象，提供可拦截的JavaScript操作的方法。
 * 方法与代理处理程序相同。反射不是一个函数对象，因此它不可构造。
 * @constructor
 */
var $rConstruct =$Reflect && $Reflect.construct;
var Reflect = function Reflect() {
    if(this instanceof Reflect)throwError('Reflect is not constructor.');
}

/**
 * 静态方法 Reflect.apply() 通过指定的参数列表发起对目标(target)函数的调用
 * @param func
 * @param thisArgument
 * @param argumentsList
 * @returns {*}
 */
Reflect.apply=function apply( func, thisArgument, argumentsList)
{
    if( func instanceof Class )func=$get(func,"constructor");
    if( System.typeOf(func) !== "function" )throwError('type','is not function');
    if( func===thisArgument )thisArgument=undefined;
    return isArray(argumentsList) ? System.Function.prototype.apply.call( func, thisArgument, argumentsList ) :
        System.Function.prototype.call.call( func, thisArgument, argumentsList );
}

/**
 * Reflect.construct() 方法的行为有点像 new 操作符 构造函数 ， 相当于运行 new target(...args).
 * @param target
 * @param argumentsList
 * @param newTarget
 * @returns {*}
 */
Reflect.construct=function construct(theClass, args, newTarget)
{
    if( theClass === newTarget )newTarget=undefined;
    if( theClass instanceof Class )
    {
        if( $get(theClass,"isAbstract") )throwError('type','Abstract class cannot be instantiated');
        theClass = $get(theClass,"constructor");
        if( typeof theClass !== "function"  )throwError('type','is not constructor');

    }else if( typeof theClass !== "function" )
    {
        throwError('type','is not function');
    }
    args = isArray(args) ? args : [];
    var instanceObj;
    if( $rConstruct )
    {
        instanceObj = newTarget ? $rConstruct(theClass, args, newTarget) : $rConstruct(theClass, args);
    }else
    {
        switch ( $get(args,"length") )
        {
            case 0 :instanceObj = new theClass(); break;
            case 1 :instanceObj = new theClass(args[0]);break;
            case 2 :instanceObj = new theClass(args[0], args[1]);break;
            case 3 :instanceObj = new theClass(args[0], args[1], args[2]);break;
            case 4 :instanceObj = new theClass(args[0], args[1], args[2], args[3]);break;
            case 5 :instanceObj = new theClass(args[0], args[1], args[2], args[3], args[4]);break;
            case 6 :instanceObj = new theClass(args[0], args[1], args[2], args[3], args[4], args[5]);break;
            case 7 :instanceObj = new theClass(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);break;
            case 8 :instanceObj = new theClass(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);break;
            case 9 :instanceObj = new theClass(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);break;
            case 10:instanceObj = new theClass(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);break;
            default :
                instanceObj = Function('f,a', 'return new f(a[' + range(0, args.length).join('],a[') + ']);')(theClass, args);
        }
    }
    //原型链引用
    //if (Object.getPrototypeOf(instanceObj) !== theClass.prototype)$setPrototypeOf(instanceObj, theClass.prototype);
    //返回一个新的实例对象
    return instanceObj;
}

/**
 * 静态方法 Reflect.defineProperty() 有很像 Object.defineProperty() 方法，但返回的是 Boolean 值。
 * @param target
 * @param propertyKey
 * @param attributes
 * @returns {boolean}
 */
Reflect.defineProperty=function defineProperty(target, propertyKey, attributes)
{
    try {
        if( propertyKey==null )return false;
        Object.defineProperty(target, propertyKey, attributes);
        return true;
    }catch (e){
        return false;
    }
}

/**
 * 静态方法 Reflect.deleteProperty() 允许用于删除属性。它很像 delete operator ，但它是一个函数。
 * @param target
 * @param propertyKey
 * @returns {boolean}
 */
Reflect.deleteProperty=function deleteProperty(target, propertyKey)
{
    if( !target || propertyKey==null || target instanceof Class )return false;
    var objClass = $get(target,"constructor");
    if( objClass instanceof Class )
    {
        if( !$get(objClass,"dynamic") )return false;
        do{
            var obj = $get(target, objClass.token);
            if( obj && $hasOwnProperty.call(obj,propertyKey) )
            {
                var protoDesc = $get(objClass,"proto");
                var hasDesc =  $hasOwnProperty.call(protoDesc,propertyKey);
                //只有动态添加的属性或者是可配置的属性才可以删除
                if( hasDesc )
                {
                    var desc = $get(protoDesc,propertyKey);
                    if( $get(desc,"configurable") === false || $get(desc,"id") !=='dynamic' )return false;
                }
                delete obj[propertyKey];
                if ( hasDesc ){
                    delete protoDesc[propertyKey];
                }
                return true;
            }
        }while ( (objClass = $get(objClass,"extends") ) && $get(objClass,"dynamic") && objClass instanceof Class )
    }
    delete target[propertyKey];
    return !$hasOwnProperty.call(target,propertyKey);
}

/**
 * 静态方法 Reflect.has() 作用与 in 操作符 相同。
 * @param target
 * @param propertyKey
 * @returns {boolean}
 */
Reflect.has=function has(target, propertyKey)
{
    if( propertyKey==null || target == null )return false;
    var objClass = target instanceof Class ? target : $get(target,"constructor");
    if( objClass instanceof Class )
    {
        var isstatic = objClass === target;
        do {
            var desc= isstatic ? $get(objClass,"static") :  $get(objClass,"proto");
            //没有属性描述符默认为public
            if( !$hasOwnProperty.call(desc, propertyKey) )
            {
                desc=null;
                //只有非静态的才有实例属性
                if( !isstatic && $hasOwnProperty.call(target[objClass.token],propertyKey) )
                {
                    return true;
                }
            }
            if( desc )
            {
                var qualifier = $get( $get(desc,propertyKey), "qualifier");
                return !qualifier || qualifier === 'public';
            }
            objClass = $get(objClass,"extends");
            if( !(objClass instanceof Class) )
            {
                return propertyKey in (objClass||Object).prototype;
            }
        }while ( objClass );
        return false;
    }
    return propertyKey in target;
}

/**
 * 获取目标公开的属性值
 * @param target
 * @param propertyKey
 * @returns {*}
 */
Reflect.get=function(target, propertyKey, receiver , classScope )
{
    if( propertyKey==null )return target;
    if( !target )throwError('type','target object is null');
    var objClass = target instanceof Class ? target : $get(target,"constructor");
    if( objClass instanceof Class )
    {
        var isstatic = objClass === target;
        //如果是获取超类中的属性或者方法
        if( isstatic && (receiver && $get(receiver,"constructor") instanceof Class) )isstatic=false;
        do {
            var desc= isstatic ? $get(objClass,"static") :  $get(objClass,"proto");
            var refObj = $get(target, $get(objClass,'token') );
            var has = $hasOwnProperty.call(desc, propertyKey);
            //没有属性描述符默认为public  只有非静态的才有实例属性
            if( !isstatic && !has && $hasOwnProperty.call(refObj, propertyKey) )
            {
                return $get(refObj, propertyKey);
            }
            if( desc && has )
            {
               desc = $get(desc,propertyKey);
               if( $get(desc,"qualifier") !== 'private' || classScope === objClass )
               {
                   //是否有访问的权限
                   if (!checkPrivilege(desc, objClass, classScope))
                   {
                       if (classScope)throwError('reference', '"' + propertyKey + '" inaccessible.');
                       return undefined;
                   }
                   if (desc.get) {
                       return desc.get.call(receiver || target);
                   } else {
                       if (isstatic)return $get(desc, "value");
                       return $hasOwnProperty.call(desc, 'value') ? $get(desc, "value") : $get(refObj, propertyKey);
                   }
               }
            }
            objClass = $get(objClass,"extends");
            if( !(objClass instanceof Class) )
            {
                return $get( (objClass||Object).prototype,propertyKey);
            }

        }while ( objClass )
        return undefined;
    }
    return $get(target, propertyKey, receiver );
}

/**
 * 设置目标公开的属性值
 * @param target
 * @param propertyKey
 * @param value
 * @returns {*}
 */
Reflect.set=function(target, propertyKey, value , receiver , classScope )
{
    if( propertyKey==null )return false;
    if( !target )throwError('reference','Reference object is null');
    var objClass = target instanceof Class ? target : $get(target,"constructor");
    if( objClass instanceof Class )
    {
        var isstatic = objClass === target;
        //如果是获取超类中的属性或者方法
        if( isstatic && (receiver && receiver.constructor instanceof Class) )isstatic=false;
        do{
            var desc= isstatic ? $get(objClass,"static") :  $get(objClass,"proto");
            //没有属性描述符默认为public
            if( !$hasOwnProperty.call(desc, propertyKey) )
            {
                desc=null;
                //只有非静态的才有实例属性
                if( !isstatic )
                {
                    if( $hasOwnProperty.call(target[objClass.token],propertyKey ) )
                    {
                        $set( $get(target,objClass.token), propertyKey, value );
                        return true;
                    }
                    //动态对象可以动态添加
                    else if( $get(objClass,"dynamic") === true )
                    {
                        if( !$hasOwnProperty.call(target,objClass.token) ){
                            Object.defineProperty(target,objClass.token,{value:{}});
                        }
                        var refObj = $get(target, objClass.token);
                        $set($get(objClass,"proto"),propertyKey,{id:'dynamic'});
                        $set(refObj,propertyKey,value);
                        return true;
                    }
                }
            }
            if( desc && ( $get( $get(desc,propertyKey),"qualifier") !== 'private' || classScope === objClass ) )
            {
                desc = $get(desc,propertyKey);
                //是否有访问的权限
                if( !checkPrivilege(desc, objClass, classScope) ){
                    if(classScope)throwError('reference', '"' + propertyKey + '" inaccessible.');
                    return false;
                }
                if( $hasOwnProperty.call(desc,"set") ){
                    desc.set.call(receiver || target, value);
                }else {
                    if (desc.writable === false)throwError('reference', '"' + propertyKey + '" is not writable');
                    isstatic ? $set(desc,"value", value) : $set( $get( target,objClass.token ), propertyKey ,value);
                }
                return true;
            }
        }while( objClass=$get(objClass,"extends") );
        return false;
    }
    return $set(target,propertyKey,value,receiver);
}

/**
@private
*/
var __descCheck__ = System.env.platform('IE') && System.env.version(8);

/**
 * @private
 */
function $get(target, propertyKey, receiver)
{
    if( !target )return undefined;
    var value = target[propertyKey];
    if( __descCheck__ && value instanceof Descriptor )
    {
        return value.get ? value.get.call(receiver || target) : value.value;
    }
    return value;
}

/**
 * @private
 */
function $set(target,propertyKey,value,receiver)
{
    var desc = target[propertyKey];
    if( __descCheck__ && desc instanceof Descriptor )
    {
        if( desc.writable=== false )throwError('reference','"'+propertyKey+'" is not writable');
        if( desc.set ){
            desc.set.call(receiver||target, value);
        }else {
            desc.value = value;
        }
        return true;
    }
    try {
        target[ propertyKey ] = value;
    }catch (e){
        return false;
    }
    return true;
}

/**
 * 检查是否可访问
 * @private
 * @param descriptor
 * @param referenceModule
 * @param classModule
 * @returns {boolean}
 */
function checkPrivilege(descriptor,referenceModule, classModule  )
{
    if( descriptor )
    {
        var qualifier = $get(descriptor,"qualifier");

        //不是本类中的成员调用（本类中的所有成员可以相互调用）
        if( (qualifier && qualifier !=='public') && referenceModule !== classModule )
        {
            if( qualifier === 'internal' )
            {
                return $get(referenceModule,"package") === $get(classModule,"package");

            }else if( qualifier === 'protected' )
            {
                return Object.prototype.isPrototypeOf.call(classModule,referenceModule);
            }
            return false;
        }
    }
    return true;
}
System.Reflect=Reflect;
/**
 * 类对象构造器
 * @returns {Class}
 * @constructor
 */
var Class = function Class(){};
Class.prototype = new Object();System.Class=Class;
/**
 * 接口构造函数
 * @constructor
 */
var Interface = function Interface(){};
Interface.prototype = new Object();System.Interface=Interface;
/**
 *  事件对象,处理指定类型的事件分发。
 * @param type
 * @param bubbles
 * @param cancelable
 * @returns {Event}
 * @constructor
 */
var Event = function Event( type, bubbles, cancelable )
{
    if ( !(this instanceof Event) )
        return new Event(  type, bubbles,cancelable );
    if( typeof type1==="string" )throwError('type','event type is not string');
    this.type = type;
    this.bubbles = !(bubbles===false);
    this.cancelable = !(cancelable===false);
};

/**
 * 一组事件名的常量
 * @type {string}
 */
Event.SUBMIT='submit';
Event.RESIZE='resize';
Event.FETCH='fetch';
Event.UNLOAD='unload';
Event.LOAD='load';
Event.RESET='reset';
Event.FOCUS='focus';
Event.BLUR='blur';
Event.ERROR='error';
Event.COPY='copy';
Event.BEFORECOPY='beforecopy';
Event.CUT='cut';
Event.BEFORECUT='beforecut';
Event.PASTE='paste';
Event.BEFOREPASTE='beforepaste';
Event.SELECTSTART='selectstart';
Event.READY='ready';
Event.SCROLL='scroll';

/**
 * 事件原型
 * @type {Object}
 */
Event.prototype = new Object();
Event.prototype.constructor = Event;
//true 只触发冒泡阶段的事件 , false 只触发捕获阶段的事件
Event.prototype.bubbles = true;
//是否可以取消浏览器默认关联的事件
Event.prototype.cancelable = true;
Event.prototype.currentTarget = null;
Event.prototype.defaultPrevented = false;
Event.prototype.originalEvent = null;
Event.prototype.type = null;
Event.prototype.propagationStopped = false;
Event.prototype.immediatePropagationStopped = false;
Event.prototype.altkey = false;
Event.prototype.button = false;
Event.prototype.ctrlKey = false;
Event.prototype.shiftKey = false;
Event.prototype.metaKey = false;

/**
 * 阻止事件的默认行为
 */
Event.prototype.preventDefault = function preventDefault()
{
    if( this.cancelable===true )
    {
        this.defaultPrevented = true;
        if ( this.originalEvent )this.originalEvent.preventDefault ? this.originalEvent.preventDefault() : this.originalEvent.returnValue = false
    }
};

/**
 * 阻止向上冒泡事件
 */
Event.prototype.stopPropagation = function stopPropagation()
{
    if( this.originalEvent )
    {
        this.originalEvent.stopPropagation ? this.originalEvent.stopPropagation() :  this.originalEvent.cancelBubble=true;
    }
    this.propagationStopped = true;
}

/**
 *  阻止向上冒泡事件，并停止执行当前事件类型的所有侦听器
 */
Event.prototype.stopImmediatePropagation = function stopImmediatePropagation()
{
    if( this.originalEvent && this.originalEvent.stopImmediatePropagation )this.originalEvent.stopImmediatePropagation();
    this.stopPropagation();
    this.immediatePropagationStopped = true;
}

/**
 * map event name
 * @private
 */
Event.fix={
    map:{},
    hooks:{},
    prefix:'',
    eventname:{
        'webkitAnimationEnd':true,
        'webkitAnimationIteration':true,
        'DOMContentLoaded':true
    }
};
Event.fix.map[ Event.READY ]='DOMContentLoaded';

/**
 * 获取统一的事件名
 * @param type
 * @param flag
 * @returns {*}
 */
Event.type = function(type, flag )
{
    if( typeof type !== "string" )return type;
    if( flag===true )
    {
        type= Event.fix.prefix==='on' ? type.replace(/^on/i,'') : type;
        var lower =  type.toLowerCase();
        for(var prop in Event.fix.map)
        {
            if( Event.fix.map[prop].toLowerCase() === lower )
            {
                return prop;
            }
        }
        return type;
    }
    if( Event.fix.eventname[ type ]===true )return type;
    return Event.fix.map[ type ] ? Event.fix.map[ type ] : Event.fix.prefix+type.toLowerCase();
};

(function () {

    var eventModules=[];
    Event.registerEvent = function registerEvent( callback )
    {
        eventModules.push( callback );
    }

    /**
     * 根据原型事件创建一个Breeze Event
     * @param event
     * @returns {Event}
     */
    Event.create = function create( originalEvent )
    {
        originalEvent=originalEvent ? originalEvent  : (typeof window === "object" ? window.event : null);
        var event=null;
        var i=0;
        if( !originalEvent )throwError('type','Invalid event');
        var type = originalEvent.type;
        var target = originalEvent.srcElement || originalEvent.target;
        target = target && target.nodeType===3 ? target.parentNode : target;
        var currentTarget =  originalEvent.currentTarget || target;
        if( typeof type !== "string" )throwError('type','Invalid event type');
        type = Event.type( type, true );
        while ( i<eventModules.length && !(event =eventModules[i++]( type, target, originalEvent )));
        if( !(event instanceof Event) )event = new Event( type );
        event.type= type;
        event.target=target;
        event.currentTarget = currentTarget;
        event.bubbles = !!originalEvent.bubbles;
        event.cancelable = !!originalEvent.cancelable;
        event.originalEvent = originalEvent;
        event.timeStamp = originalEvent.timeStamp;
        event.relatedTarget= originalEvent.relatedTarget;
        event.altkey= !!originalEvent.altkey;
        event.button= originalEvent.button;
        event.ctrlKey= !!originalEvent.ctrlKey;
        event.shiftKey= !!originalEvent.shiftKey;
        event.metaKey= !!originalEvent.metaKey;
        return event;
    };
}());

/**
 * IE8 以下
 */
if( System.env.platform('IE') && System.env.version(8) )
{
    Event.fix.map[ Event.READY ] = 'readystatechange';
    Event.fix.prefix='on';
    (function () {

        /**
         * 监测加载对象上的就绪状态
         * @param event
         * @param type
         * @returns loaded|complete|4
         */
        var getReadyState=function( target )
        {
            var nodeName=  typeof target.nodeName === "string" ?  target.nodeName.toLowerCase() : null ;
            var readyState=target.readyState;
            //iframe
            if( nodeName==='iframe' )
            {
                readyState=target.contentWindow.document.readyState;
            }//window
            else if( target.window && target.document )
            {
                readyState=target.document.readyState;
            }
            return readyState;
        }

        Event.fix.hooks[ Event.READY ]=function (listener, dispatcher)
        {
            var target=this;
            var doc = this.contentWindow ?  this.contentWindow.document : this.ownerDocument || this.document || this;
            var win=  doc && doc.nodeType===9 ? doc.defaultView || doc.parentWindow : window;
            if( !(win || doc) )return;
            var handle=function(event)
            {
                if( !event )
                {
                   switch ( getReadyState( doc ) )
                   {
                       case 'loaded'   :
                       case 'complete' :
                       case '4'        :
                           event= new Event( Event.READY );
                       break;
                   }
                }
                if( event )
                {
                    event = event instanceof Event ? event : Event.create( event );
                    event.currentTarget = target;
                    event.target = target;
                    dispatcher( event );
                }
            }

            var type = Event.type(Event.READY);
            doc.addEventListener ? doc.addEventListener( type, handle ) : doc.attachEvent(type, handle);

            //不是一个顶级文档或者窗口对象
            if( !this.contentWindow && win && doc )
            {
                var toplevel = false;
                try {
                    toplevel = win.frameElement == null;
                } catch(e) {}
                if ( toplevel && doc.documentElement.doScroll )
                {
                    var doCheck=function(){
                        try {
                            doc.documentElement.doScroll("left");
                        } catch(e) {
                            setTimeout( doCheck, 1 );
                            return;
                        }
                        handle();
                    }
                    doCheck();
                }
            }
            handle();
            return true;
        }
    }());
}System.Event=Event;
/**
 * 事件调度器，所有需要实现事件调度的类都必须继承此类。
 * @param HTMLElement|EventDispatcher target 需要代理事件的目标对象
 * @returns {EventDispatcher}
 * @constructor
 */
var EventDispatcher = function EventDispatcher( target )
{
    if( !(this instanceof EventDispatcher) )return new EventDispatcher( target );
    if( target )
    {
        if( typeof target !=='object' || !(  System.typeOf( target.addEventListener ) === "function" || System.typeOf( target.attachEvent )=== "function" ) )
        {
            throwError('type', 'target is not "EventDispatcher"');
        }
        Object.defineProperty(this,'target', {value:target});
    }
};
EventDispatcher.prototype=new Object();
EventDispatcher.prototype.constructor=EventDispatcher;
EventDispatcher.prototype.target=null;
(function(){

/**
 * 判断是否有指定类型的侦听器
 * @param type
 * @returns {boolean}
 */
EventDispatcher.prototype.hasEventListener=function( type  )
{
    var target = $get(this,'target') || this;
    var events;
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0)
        {
            events = $get( target[len--],'__events__');
            if( events && Object.prototype.hasOwnProperty.call(events,type) )
            {
                events =$get(events,type)
                return events && events.length > 0;
            }
        }
        return false;
    }
    events = $get( target,'__events__');
    if( events && Object.prototype.hasOwnProperty.call(events,type) )
    {
        events =$get(events,type)
        return events && events.length > 0;
    }
    return false;
};

/**
 * 添加侦听器
 * @param type
 * @param listener
 * @param priority
 * @returns {EventDispatcher}
 */
EventDispatcher.prototype.addEventListener=function(type,callback,useCapture,priority,reference)
{
    if( typeof type !== 'string' )throwError('type','Invalid event type.')
    if( typeof callback !== 'function' )throwError('type','Invalid callback function.')
    var listener=new Listener(type,callback,useCapture,priority,reference,this);
    var target = $get(this,"target") || this;
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0)addEventListener(target[--len], listener);
        return this;
    }
    addEventListener(target, listener);
    return this;
};

/**
 * 移除指定类型的侦听器
 * @param type
 * @param listener
 * @returns {boolean}
 */
EventDispatcher.prototype.removeEventListener=function(type,listener)
{
    var target= $get(this,"target") || this;
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0)removeEventListener( target[--len], type, listener, this);
        return true;
    }
    return removeEventListener(target,type,listener,this);
};

/**
 * 调度指定事件
 * @param event
 * @returns {boolean}
 */
EventDispatcher.prototype.dispatchEvent=function( event )
{
    if( !(event instanceof Event) )throwError('type','invalid event.');
    var target = $get(this,"target") || this;
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0)
        {
            event.target = event.currentTarget = target[--len];
            dispatchEvent(event);
        }
        return !event.immediatePropagationStopped;
    }
    event.target = event.currentTarget=target;
    return dispatchEvent( event );
};

/**
 * 添加侦听器到元素中
 * @param listener
 * @param handle
 * @returns {boolean}
 */
function addEventListener(target, listener )
{
    //获取事件数据集
    var type = listener.type;
    var events = $get( target, '__events__');

    //如果没有则定义
    if( !events )
    {
        events = {};
        Object.defineProperty(target,'__events__',{value:events});
    }

    //获取指定事件类型的引用
    events = events[ type ] || ( events[ type ]=[] );

    //如果不是 EventDispatcher 则在第一个事件中添加事件代理。
    if( events.length===0 && !System.instanceOf(target, EventDispatcher) )
    {
        if( Object.prototype.hasOwnProperty.call(Event.fix.hooks,type) )
        {
            Event.fix.hooks[ type ].call(target, listener, dispatchEvent);
        }else {
            type = Event.type(type);
            target.addEventListener ? target.addEventListener(type, dispatchEvent, listener.useCapture) : target.attachEvent(type,function(e){dispatchEvent(e,target)});
        }
    }

    //添加到元素
    events.push( listener );

    //按权重排序，值大的在前面
    if( events.length > 1 ) events.sort(function(a,b)
    {
        return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
    });
    return true;
};


/**
 * 添加侦听器到元素中
 * @param string type 事件类型, 如果是一个'*'则表示删除所有的事件
 * @param function listener 可选，如果指定则只删除此侦听器
 * @param EventDispatcher eventDispatcher 可选，如果指定则只删除本对象中的元素事件
 * @returns {boolean}
 */
function removeEventListener(target, type, listener , dispatcher )
{
    //获取事件数据集
    var events = $get(target,'__events__');
    if( !Object.prototype.hasOwnProperty.call(events,type) )
    {
        return false;
    }
    events = events[type];
    var length= events.length;
    var ret = length;
    var is = typeof listener === "function";
    while (length > 0)
    {
        --length;
        //如果有指定侦听器则删除指定的侦听器
        if ( (!is || events[length].callback === listener) && events[length].dispatcher === dispatcher )
        {
            events.splice(length, 1);
        }
    }

    //如果是元素并且也没有侦听器就删除
    if( events.length < 1 && !(target instanceof EventDispatcher)  )
    {
        var eventType= Event.type( type );
        if( target.removeEventListener )
        {
            target.removeEventListener(eventType,dispatchEvent,false);
            target.removeEventListener(eventType,dispatchEvent,true);
        }else if( target.detachEvent )
        {
            target.detachEvent(eventType,dispatchEvent);
        }
    }
    return events.length !== ret;
};

/**
 * 调度指定侦听项
 * @param event
 * @param listeners
 * @returns {boolean}
 */
function dispatchEvent( e, currentTarget)
{
    if( !(e instanceof Event) ){
        e = Event.create( e );
        if(currentTarget)e.currentTarget = currentTarget;
    }
    if( !e || !e.currentTarget )throw new Error('invalid event target')
    var target = e.currentTarget;
    var events = $get(target ,'__events__')
    if( !Object.prototype.hasOwnProperty.call(events, e.type) )return true;
    events = $get( events, e.type ).slice(0);
    var length= 0,listener,thisArg;
    while( length < events.length )
    {
        listener = events[ length++ ];
        thisArg = listener.reference || listener.dispatcher;
        //调度侦听项
        listener.callback.call( thisArg , e );
        if( e.immediatePropagationStopped===true )
           return false;
    }
    return true;
};



/**
 * 事件侦听器
 * @param type
 * @param callback
 * @param priority
 * @param capture
 * @param currentTarget
 * @param target
 * @constructor
 */
function Listener(type,callback,useCapture,priority,reference,dispatcher)
{
    this.type=type;
    this.callback=callback;
    this.useCapture=!!useCapture;
    this.priority=parseInt(priority) || 0;
    this.reference=reference || null;
    this.dispatcher=dispatcher;
};
Listener.prototype.constructor= Listener;
Listener.prototype.useCapture=false;
Listener.prototype.dispatcher=null;
Listener.prototype.reference=null;
Listener.prototype.priority=0;
Listener.prototype.callback=null;
Listener.prototype.currentTarget=null;
Listener.prototype.type=null;
}());System.EventDispatcher=EventDispatcher;
if( typeof window !=="undefined" ){
/*!
 * Sizzle CSS Selector Engine v@VERSION
 * http://sizzlejs.com/
 *
 * Copyright 2008, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: @DATE
 */
var Sizzle = (function( window ) {
var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// http://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];
	nodeType = context.nodeType;

	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	if ( !seed && documentIsHTML ) {

		// Try to shortcut find operations when possible (e.g., not under DocumentFragment)
		if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType !== 1 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, parent,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;
	parent = doc.defaultView;

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", unloadHandler, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Support tests
	---------------------------------------------------------------------- */
	documentIsHTML = !isXML( doc );

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [ m ] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			docElem.appendChild( div ).innerHTML = "<a id='" + expando + "'></a>" +
				"<fetch id='" + expando + "-\f]' msallowcapture=''>" +
				"<option selected=''></option></fetch>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( div.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.2+, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.7+
			if ( !div.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibing-combinator selector` fails
			if ( !div.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"__proxyTarget__": function(elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"owner": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (oldCache = outerCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.fetch = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is no seed and only one group
	if ( match.length === 1 ) {

		// Take a shortcut and set the context if the root selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				support.getById && context.nodeType === 9 && documentIsHTML &&
				Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}
return Sizzle;
})( window );
/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
var Element = (function(System, Sizzle){
"use strict";
var fix={
    attrMap:{
        'tabindex'       : 'tabIndex',
        'readonly'       : 'readOnly',
        'for'            : 'htmlFor',
        'maxlength'      : 'maxLength',
        'cellspacing'    : 'cellSpacing',
        'cellpadding'    : 'cellPadding',
        'rowspan'        : 'rowSpan',
        'colspan'        : 'colSpan',
        'usemap'         : 'useMap',
        'frameborder'    : 'frameBorder',
        'class'          : 'className',
        'contenteditable': 'contentEditable'
    }
    ,attrtrue:{
        'className':true,
        'innerHTML':true,
        'value'    :true
    }
    ,cssPrefixName:''
    ,cssPrefix:{
        'box-shadow':true,
        'border-radius':true,
        'border-top-left-radius':true,
        'border-top-right-radius':true,
        'border-bottom-left-radius':true,
        'border-bottom-right-radius':true,
        'focus-ring-color':true,
        'user-select':true,
        'radial-gradient':true,
        'linear-gradient':true,
        'animation-name':true,
        'animation-duration':true,
        'animation-iteration-count':true,
        'animation-delay':true,
        'animation-fill-mode':true,
        'animation-direction':true,
        'animation-timing-function':true,
        'animation-play-state':true
    }
    ,cssUpperRegex:/([A-Z]|^ms)/g
    ,cssCamelRegex:/-([a-z]|[0-9])/ig
    ,cssCamelCase:function( all, letter )
    {
        return ( letter + "" ).toUpperCase();
    }
    ,cssNumber:{
        "fillOpacity": true,
        "fontWeight": true,
        "lineHeight": true,
        "opacity": true,
        "orphans": true,
        "widows": true,
        "zIndex": true,
        "zoom": true
    }
    ,cssHooks:{}
    ,cssMap:{}
    ,fnHooks:{}
    ,getsizeval:function( prop )
    {
        if ( Element.prototype.isWindow.call(this) )
        {
            return Math.max(
                this['inner'+prop] || 0,
                this['offset'+prop] || 0,
                this['client'+prop] || 0,
                this.document.documentElement['client'+prop] || 0
            );

        } else if (Element.prototype.isDocument.call(this) )
        {
            return Math.max(
                    this.body['scroll'+prop] || 0,
                    this.documentElement['scroll'+prop] || 0,
                    this.body['offset'+prop] || 0,
                    this['offset'+prop] || 0,
                    this.body['client'+prop] || 0,
                    this['client'+prop] || 0
                )+(this.documentElement[ prop==='Height'? 'clientTop' : 'clientLeft' ] || 0);
        }
        return this['offset'+prop] || 0;
    }
};

/**
 * @private
 */
var accessor={};

/**
 * @private
 */
function access(callback, name, newValue)
{
    var write= typeof newValue !== 'undefined';
    if( !write && this.length < 1 )return null;
    var getter = accessor[callback].get;
    var setter = accessor[callback].set;
    if( fix.fnHooks[callback] )
    {
        getter = typeof fix.fnHooks[callback].get === "function" ? fix.fnHooks[callback].get : getter ;
        setter = typeof fix.fnHooks[callback].set === "function" ? fix.fnHooks[callback].set : setter ;
    }
    if( !write )return getter.call(this.current(),name,this);
    return this.forEach(function(elem)
    {
        var oldValue= getter.call(elem,name,this);
        if( oldValue !== newValue )
        {
            var event = setter.call(elem,name,newValue,this);
            if( typeof event === "string" )
            {
                event = event===StyleEvent.CHANGE ?  new StyleEvent( StyleEvent.CHANGE ) :  new PropertyEvent( PropertyEvent.CHANGE );
                event.property = name;
            }
            if( event instanceof PropertyEvent )
            {
                event.property = event.property || name;
                event.newValue = event.newValue || newValue;
                event.oldValue = event.oldValue || oldValue;
                this.dispatchEvent( event );
            }
        }

    });
}

/**
 * @private
 */
function removeChild(parent,child, flag )
{
    if( child && parent.hasChildNodes() && child.parentNode === parent )
    {
        var result=parent.removeChild( child );
        flag===false || dispatchElementEvent.call(this,parent,child,ElementEvent.REMOVE);
        return !!result;
    }
    return false;
}

/**
 * @private
 */
function getChildNodes(elem, selector, flag)
{
    var ret=[],isfn=System.isFunction(selector);
    if( elem.hasChildNodes() )
    {
        var len=elem.childNodes.length,index= 0,node;
        while( index < len )
        {
            node=elem.childNodes.item(index);
            if( ( isfn && selector.call(this,node,index) ) || ( !isfn && (selector==='*' || node.nodeType===1) )  )
                ret.push( node );
            if( flag===true && ret.length >0 )break;
            ++index;
        }
    }
    return ret;
}
/**
 * @private
 */
function dispatchElementEvent(parent, child , type )
{
    if( this instanceof EventDispatcher && this.hasEventListener( type )  )
    {
        var event=new ElementEvent( type );
        event.parent=parent;
        event.child=child;
        return this.dispatchEvent( event );
    }
    return true;
}

/**
 *  @private
 */
function doMake( elems )
{
    var r = this.__reverts__ || (this.__reverts__ = []);
    r.push( this.splice(0,this.length, elems ) );
    this.current(null);
    return this;
}

/**
 *  @private
 */
function doRecursion(propName,strainer, deep )
{
    var currentItem,ret=[];
    var s = typeof strainer === "string" ? function(){return querySelector(strainer, null , null, [this]).length > 0 } :
        typeof strainer === "undefined" ? function(){return this.nodeType===1} : strainer ;

    this.forEach(function(elem)
    {
        if( elem && elem.nodeType )
        {
            currentItem=elem;
            do{
                currentItem = currentItem[propName];
                if( currentItem && s.call(currentItem) )ret = ret.concat( currentItem );
            } while (deep && currentItem)
        }
    });
    return ret;
}



/**
 * @private
 * @type {RegExp}
 */
var selectorExpr = /^(?:#([\w-]+)|\:?(\w+.*?)|\.([\w-]+)|(\[[\w-]+.*?\]))$/;

/**
 * 判断是否为一个有效的选择器
 * @param selector
 * @returns {boolean}
 */
function isSelector( selector )
{
    return typeof selector === "string" ? selectorExpr.test( selector ) : false;
};

/**
 * 统一规范的样式名
 * @param name
 * @returns {string}
 */
function getStyleName( name )
{
    if( typeof name !=='string' )
        return name;
    if( name === 'cssText')
        return name;
    name=fix.cssMap[name] || name;
    name=name.replace( /^-ms-/, "ms-" ).replace( fix.cssCamelRegex, fix.cssCamelCase );
    name = name.replace( fix.cssUpperRegex, "-$1" ).toLowerCase();
    if( fix.cssPrefix[name] === true )
        return fix.cssPrefix+name;
    return name;
};

/**
 * 选择元素
 * @param mixed selector CSS3选择器
 * @param mixed context  上下文
 * @returns []
 */
var querySelector = typeof Sizzle === "function" ?  function querySelector(selector, context, results, seed) {
    return Sizzle( selector, context, results, seed);
} : function querySelector(selector, context, results, seed )
{
    if( !(results instanceof Array) )
    {
        //如果选择器不是一个字符串
        if (typeof selector !== "string")
        {
            results = Element.prototype.isNodeElement.call(selector) || Element.prototype.isWindow(selector) ? [selector] : [];
        }else
        {
            var has = false;
            //设置上下文
            if (context && typeof context.nodeName === "string" && context.nodeType === 1) {
                var id = context.getAttribute('id');
                if (!id || id == '') {
                    has = true;
                    id = 'sq_' + Math.ceil( Math.random() * 1000000);
                    context.setAttribute('id', id);
                }
                selector = '#' + id + ' ' + selector;
            } else if (typeof context === "string") {
                selector = context + ' ' + selector;
            }
            results = document.querySelectorAll(selector);
            if(has)context.removeAttribute('id');
        }
    }

    if( isArray(seed) )
    {
        var i=0;
        var ret=[];
        while( i<seed.length )if( Array.prototype.indexOf.call(results, seed[i]) >=0 )
        {
            ret.push( seed[i] )
            i++;
        }
        return ret;
    }
    return results;
};

/**
 * @type {RegExp}
 */
var singleTagRegex=/^<(\w+)(.*?)\/\s*>$/
    ,tableChildRegex=/^\<(tr|td|th|thead|tbody|tfoot)/i;

/**
 * 创建HTML元素
 * @param html 一个html字符串
 * @returns {Node}
 */
function createElement(html )
{
    if(System.isString(html) )
    {
        html=System.trim( html );
        if( html !== '' )
        {
            var match;
            if( html.charAt(0) !== "<" && html.charAt( html.length - 1 ) !== ">" && html.length >=1 )
            {
                return document.createElement( html );

            }else if( html.charAt(0) === "<" && ( match=singleTagRegex.exec(html) ) )
            {
                var elem = document.createElement( match[1] );
                var attr =matchAttr( html );
                var isset = typeof elem.setAttribute === "function";
                for(var prop in attr )
                {
                    if( isset )
                    {
                        elem.setAttribute( prop, attr[prop] );
                    }else{
                        var attrNode = document.createAttribute( prop );
                        attrNode.nodeValue=attr[ prop ];
                        elem.setAttributeNode( attrNode )
                    }
                }
                return elem;

            }else if( tableChildRegex.exec(html) )
            {
                html="<table>"+ html +"</table>";
            }

            var div = document.createElement( "div");
            div.innerHTML =  html;
            var len=div.childNodes.length;

            if(  len > 1 )
            {
                var fragment= document.createDocumentFragment();
                while( len > 0 )
                {
                    --len;
                    fragment.appendChild( div.childNodes.item(0) );
                }
                return fragment;
            }
            div=div.childNodes.item(0);
            return div.parentNode.removeChild( div );
        }

    }else if (Element.prototype.isNodeElement.call(html) )
        return  html.parentNode ?cloneNode(html,true) : html;
    throw new Error('createElement param invalid')
};

var getAttrExp = /(\w+)(\s*=\s*([\"\'])([^\3]*?)[^\\]\3)?/g;
var lrQuoteExp = /^[\'\"]|[\'\"]$/g;

/**
 * 匹配字符串中的属性
 * @param strAttr
 * @return {}
 */
function matchAttr(strAttr)
{
    if( typeof strAttr === "string" && /[\S]*/.test(strAttr) )
    {
        var i=  strAttr.charAt(0)==='<' ? 1 : 0;
        var attr=strAttr.replace(/=\s*(\w+)/g,'="$1"').match( getAttrExp );
        strAttr={};
        if( attr && attr.length > 0 )
        {
            var item;
            while( item=attr[i++] )
            {
                var val  =  item.split('=');
                if( val.length > 0 )
                {
                    var prop =System.trim( val[0] );
                    strAttr[ prop ]='';
                    if( typeof val[1] === "string" )
                    {
                        strAttr[ prop ]=val[1].replace( lrQuoteExp ,'').replace(/\\([\'\"])/g,'$1');
                    }
                }
            }
        }
        return strAttr;
    }
    return null;
};

/**
 * 以小写的形式返回元素的节点名
 * @returns {string}
 */
function getNodeName(elem )
{
    return elem && typeof elem.nodeName=== "string" && elem.nodeName!='' ? elem.nodeName.toLowerCase() : '';
};


/**
 * 合并元素属性。
 * 将 refTarget 对象的属性合并到 target 元素
 * @param target 目标对象
 * @param oSource 引用对象
 * @returns {*}
 */
function mergeAttributes(target, oSource)
{
    var iselem=Element.prototype.isNodeElement.call( target );
    if( System.isObject(oSource,true) )
    {
        for (var key in oSource)if (oSource[key] && oSource[key] != '')
        {
            iselem ? target.setAttribute(key, oSource[key]) : target[key] = oSource[key];
        }

    }else
    {
        var i=0, len=oSource.attributes.length,item;
        while( i<len )
        {
            item=oSource.attributes.item(i++);
            if( item.nodeValue && item.nodeValue !='' )
            {
                iselem ? target.setAttribute(item.nodeName, item.nodeValue) : target[item.nodeName] = item.nodeValue;
            }
        }
    }
    return target;
};

/**
 * 判断元素是否有Style
 * @returns {boolean}
 */
function hasStyle(elem )
{
    return !( !elem || !elem.nodeType || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style );
};


/**
 * 克隆节点元素
 * @param nodeElement
 * @returns {Node}
 */
function cloneNode(nodeElement , deep )
{
    if( nodeElement.cloneNode )
    {
        return nodeElement.cloneNode( !!deep );
    }
    //nodeElement.nodeName
    if( typeof nodeElement.nodeName==='string' )
    {
        var node = document.createElement( nodeElement.nodeName  );
        if( node )mergeAttributes(node,nodeElement);
        return node;
    }
    return null;
};

/**
 * Element class
 * @param selector
 * @param context
 * @returns {Element}
 * @constructor
 */
function Element(selector, context)
{
    if( !(this instanceof Element) )
    {
        return new Element( selector, context );
    }
    if( context )
    {
        Object.defineProperty(this,'context',{value:context});
    }
    var result=[];
    if( selector )
    {
        if (System.isArray(selector))
        {
            result = Array.prototype.filter.call(selector, function (elem) {
                return Element.prototype.isNodeElement.call(elem) || Element.prototype.isWindow.call(elem);
            });

        } else if (selector instanceof Element) {
            result = selector.slice(0);

        } else if (typeof selector === "string") {
            result = selector.charAt(0) === '<' && selector.charAt(selector.length - 1) === '>' ? createElement(selector) : querySelector(selector, context);
        }
        else if (Element.prototype.isNodeElement.call(selector)) {
            result = selector;
        }
    }
    Array.prototype.splice.apply(this,[0,0].concat(result) );
    EventDispatcher.call(this);
    Object.defineProperty(this,'forEachCurrentItem',{writable:true,value:null});
    Object.defineProperty(this,'forEachCurrentIndex',{writable:true,value:NaN});
}
Element.prototype= new EventDispatcher();
Element.prototype.constructor = Element;
Element.prototype.context = undefined;
Element.prototype.forEachCurrentItem=undefined;
Element.prototype.forEachCurrentIndex=NaN;
Element.prototype.length=0;
Element.prototype.slice= Array.prototype.slice;
Element.prototype.concat=Array.prototype.concat;
Element.prototype.indexOf= Array.prototype.indexOf;
Element.prototype.splice= Array.prototype.splice;

/**
 * 遍历元素
 * @param function callback
 * @param object refObject
 * @returns {*}
 */
Element.prototype.forEach=function forEach(callback , refObject )
{
    var result;
    refObject=refObject || this;
    var current = $get(this,'forEachCurrentItem');
    if( current  )
    {
        result=callback.call( refObject ,current,$get(this,"forEachCurrentIndex") );
    }else
    {
        var items=this.slice(0),
            index = 0,
            len=items.length;
        for( ; index < len ; index++ )
        {
            current = items[ index ];
            $set(this,"forEachCurrentItem",current);
            $set(this,"forEachCurrentIndex",index);
            result=callback.call( refObject ,current,index);
            if( result !== undefined )
                break;
        }
        $set(this,"forEachCurrentItem",null);
        $set(this,"forEachCurrentIndex",NaN);
    }
    return typeof result === 'undefined' ? this : result;
};

/**
 * 设置获取当前操作的元素
 * 此操作不会改变原有元素结果集，只是对当前操作的设置和一个引用的元素
 * 如果在调用这个方法之前调用了this.forEach且没有结束遍历，则返回的是forEach当前游标位置的元素，否则为0的游标元素
 * @param selector|HTMLElement element
 * @returns {*}
 */
Element.prototype.current=function current( elem )
{
    if( elem == null )return $get(this,"forEachCurrentItem") || this[0];
    if( typeof elem=== "string" )
    {
        elem=querySelector(elem, $get(this,"context") || document );
        $set(this,"forEachCurrentItem" , (elem && elem.length > 0 ? elem[0] : null) );
        $set(this,"forEachCurrentIndex",NaN);

    }else if(  Element.prototype.isNodeElement.call(elem) || Element.prototype.isWindow.call(elem) )
    {
        $set(this,"forEachCurrentItem",elem);
        $set(this,"forEachCurrentIndex",NaN);

    }else
    {
        $set(this,"forEachCurrentItem",null);
        $set(this,"forEachCurrentIndex",NaN);
    }
    return this;
};

/**
 * @private
 */
accessor['property']={
    get:function(name){
        return ( fix.attrtrue[name] || typeof this.getAttribute !== "function"  ? this[name] : this.getAttribute(name) ) || null; }
    ,set:function(name,newValue){
        newValue === null ?
            ( fix.attrtrue[name] || typeof this.removeAttribute !== "function"  ? delete this[name] : this.removeAttribute(name) ) :
            ( fix.attrtrue[name] || typeof this.setAttribute !== "function"  ? this[name] = newValue : this.setAttribute(name, newValue) );
        return PropertyEvent.CHANGE;
    }
};

/**
 * 为每一个元素设置属性值
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.property=function property(name, value )
{
    name =  fix.attrMap[name] || name;
    var lower=name.toLowerCase();
    if( lower==='innerhtml' || lower==='html' )
    {
        return this.html(value);

    }else if( lower==='value' || lower==='text' )
    {
        return this[lower]( value );

    }else if( lower === 'classname' && typeof value === "string" )
    {
        this.addClass(value);

    }else if( lower === 'style' )
    {
        throw new Error('the style property names only use style method to operate in property');
    }
    return access.call(this,'property',name,value);
};

/**
 * 判断当前匹配元素是否有指定的属性名
 * @param prop
 * @returns {boolean}
 */
Element.prototype.hasProperty=function hasProperty(prop )
{
    var elem = this.current();
    if( !elem )return false;
    return typeof elem.hasAttributes === 'function' ? elem.hasAttributes( prop ) : !!elem[prop];
};


/**
 * 获取设置数据对象,支持带'.'操作
 * @param name
 * @param value
 * @returns {*}
 */
Element.prototype.data=function data(name, value )
{
    var write = typeof value !== "undefined";
    var type =  typeof name;
    return this.forEach(function(target)
    {
        if( type === "object" )
        {
            target.__data__ = name;

        }else if( type === 'string' )
        {
            target = target.__data__ || (target.__data__={});
            var namespace = name.split('.');
            var i = 0, len = namespace.length-1;
            while( i<len )
            {
                name = namespace[i++];
                target= target[ name ] || (target[ name ] = {});
            }
            name = namespace[ len++ ];
            if( !write )
            {
                return target[ name ] || null;
            }

            if( value !== null )
            {
                target[name] = value;

            }else if(  typeof target[ name ] !== 'undefined' )
            {
                delete target[ name ];
            }
        }
    })
};


/**
 * @private
 */
accessor['style']= {
    get:function(name){
        var getter = fix.cssHooks[name] && typeof fix.cssHooks[name].get === "function" ? fix.cssHooks[name].get : null;
        var currentStyle = hasStyle(this) ? (document.defaultView && document.defaultView.getComputedStyle ?
            document.defaultView.getComputedStyle(this, null) : this.currentStyle || this.style) : {};
        return getter ? getter.call(this, currentStyle, name) : currentStyle[name];
    }
    ,set:function(name,value, obj ){

        var type =/^\d+$/.test( System.trim(value) ) ? 'number' : typeof value;
        if( !this || !this.style || ( type === "number" && isNaN( value ) ) )return;
        var increment = type === "string" ? /^([\-+])=([\-+.\de]+)/.exec( value ) : null;

        //增量值
        if (increment) {
            var inc = obj.style(name);
            inc = parseFloat(inc) || 0;
            value = ( +( increment[1] + 1 ) * +increment[2] ) + inc;
            type = "number";
        }

        //添加单位
        if (type === "number" && !fix.cssNumber[name])
            value += "px";

        //解析 cssText 样式名
        if (name === 'cssText')
        {
            var elem = this;
            value = value.replace(/([\w\-]+)\s*\:([^\;]*)/g, function (all, name, value) {
                if (fix.cssHooks[name] && typeof fix.cssHooks[name].set === "function") {
                    var obj = {};
                    fix.cssHooks[name].set.call(elem, obj, value);
                    return System.serialize(obj, 'style');
                }
                return getStyleName(name) + ':' + value;
            });
        }

        try {
            var orgname = getStyleName(name);
            if ( !fix.cssHooks[name] || typeof fix.cssHooks[name].set !== "function"
                || !fix.cssHooks[name].set.call(this, this.style, value, orgname) )
            {
                this.style[ orgname ] = value;
            }
        } catch (e) {
        }
        return StyleEvent.CHANGE;
    }
};

/**
 * 设置所有匹配元素的样式
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.style=function style(name, value )
{
    if( typeof name === 'string' && /^(\s*[\w\-]+\s*\:[\w\-\s]+;)+$/.test(name)  )
    {
        value=name;
        name='cssText';
    }
    else if( System.isObject(name) )
    {
        value=System.serialize( name,'style');
        name='cssText';
    }
    return access.call(this,'style',name,value);
};

/**
 * 显示元素
 * @returns {Element}
 */
Element.prototype.show=function show()
{
    return this.forEach(function(){
        var type = this.data('display') || 'block';
        this.style('display', type );
    })
};

/**
 * 隐藏当前元素
 * @returns {Element}
 */
Element.prototype.hide=function hide()
{
    return this.forEach(function(){
        var d = this.style('display');
        this.data('display', System.isEmpty( d ) ? 'block' : d );
        this.style('display', 'none' )
    })
};


/**
 * @private
 */
accessor['text']= {
    get:function(){  return typeof this.textContent === "string" ? this.textContent : this.innerText; }
    ,set:function(newValue){
        typeof this.textContent === "string" ? this.textContent=newValue : this.innerText=newValue;
        return PropertyEvent.CHANGE;
    }
};


/**
 * 获取设置当前元素的文本内容。
 * @returns {string|Element}
 */
Element.prototype.text=function text(value )
{
    return access.call(this,'text','text',value);
};

/**
 * @private
 */
accessor['value']= {
    get:function(){ return this.hasAttribute('value') ? this.value : null }
    ,set:function(name,newValue){
        this.hasAttribute('value') ? this.value=newValue : null ;
        return PropertyEvent.CHANGE;
    }
};


/**
 * 获取设置表单元素的值。此方法只会对表单元素有用。
 * @returns {string|Element}
 */
Element.prototype.value=function value(value )
{
    return access.call(this,'value','value',value);
};


/**
 * 判断是否有指定的类名
 * @param className
 * @returns {boolean}
 */
Element.prototype.hasClass=function hasClass(className )
{
    var elem = this.current();
    if( !elem )return false;
    var value=elem['className'] || '';
    return value === '' || !value ? false : typeof className==='string' ? new RegExp('(\\s|^)' + className + '(\\s|$)').test( value ) : true ;
};


/**
 * 添加指定的类名
 * @param className
 * @returns {Element}
 */
Element.prototype.addClass=function addClass(className )
{
    if( typeof className !== "string" )
        throw new Error('invaild class name');
    className = System.trim( className );
    this.forEach(function(elem){

        if( !this.hasClass( className ) )
        {
            var oldClass=System.trim( elem['className'] );
            var old = oldClass;
            oldClass= [ System.trim( oldClass ) ];
            oldClass.push( className );
            var newValue = System.trim( oldClass.join(' ') );
            elem['className'] = newValue;

            if( this.hasEventListener(StyleEvent.CHANGE) )
            {
                var event = new StyleEvent( StyleEvent.CHANGE );
                event.property = 'class';
                event.newValue = newValue;
                event.oldValue = old;
                return event
            }
        }
    });
    return this;
};

/**
 * 移除指定的类名或者清除所有的类名。
 * @param className
 * @returns {Element}
 */
Element.prototype.removeClass=function removeClass(className )
{
    var all = typeof className !== 'string';
    return this.forEach(function(elem){
        var newValue='';
        var old=elem['className'] || '';
        if( !all )
        {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            newValue=old.replace(reg, '');
        }
        newValue === '' ? elem.removeAttribute('class') : elem['className'] = System.trim(newValue);
        try {
            elem.offsetWidth = elem.offsetWidth;
            if( this.hasEventListener(StyleEvent.CHANGE) )
            {
                var event = new StyleEvent( StyleEvent.CHANGE );
                event.property = 'class';
                event.newValue = old;
                event.oldValue = newValue;
                return event
            }
        }catch(e){}
    })
};

/**
 * 获取设置元素宽度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.width=function width(value )
{
    return access.call(this,'style','width',value);
};

/**
 * 获取设置元素高度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.height=function height(value )
{
    return access.call(this,'style','height',value);
};

/**
 * @private
 */
accessor['scroll']={
    get:function(prop){
        var e = this.defaultView || this.parentWindow || this;
        var p= 'scroll'+prop;
        return Element.prototype.isWindow.call( e ) ? e[ prop.toLowerCase()==='top'?'pageYOffset':'pageXOffset'] || e.document.documentElement[p] || e.document.body[p] : e[p] ;
    },
    set:function(prop,newValue,obj){
        var e = this.defaultView || this.parentWindow || this;
        if( obj.style('position')==='static' )obj.style('position','relative');
        if(typeof e.scrollTo === "function")
        {
            var param = [newValue,NaN];
            if( prop.toLowerCase()==='top' )param = param.reverse();
            e.scrollTo.apply(e, param );
        } else
        {
            e['scroll'+prop] = newValue;
        }

        if( this.hasEventListener( ScrollEvent.CHANGE ) ){

            var event = new ScrollEvent( ScrollEvent.CHANGE );
            event.property = prop.toLowerCase();
            return event;
        }
    }
};

/**
 * 获取设置滚动条顶部的位置
 * @param value
 */
Element.prototype.scrollTop=function scrollTop(value)
{
    return access.call(this,'scroll','Top',value);
};

/**
 * 获取设置滚动条左部的位置
 * @param value
 */
Element.prototype.scrollLeft=function scrollLeft(value)
{
    return access.call(this,'scroll','Left',value);
};

/**
 * 获取滚动条的宽度
 * @param value
 */
Element.prototype.scrollWidth=function scrollWidth()
{
    return access.call(this,'scroll','Width');
};

/**
 * 获取滚动条的高度
 * @param value
 */
Element.prototype.scrollHeight=function scrollHeight()
{
    return access.call(this,'scroll','Height');
};

/**
 * 获取元素相对文档页面边界的矩形坐标。
 * 如果元素的 position = fixed 或者 force=== true 则相对浏览器窗口的位置
 * @param NodeElement elem
 * @param boolean force
 * @returns {left,top,right,bottom,width,height}
 */
Element.prototype.getBoundingRect=function getBoundingRect( force )
{
    var value={ 'top': 0, 'left': 0 ,'right' : 0,'bottom':0,'width':0,'height':0};
    var elem= this.current();
    if( this.isWindow() )
    {
        value.left = elem.screenLeft || elem.screenX;
        value.top = elem.screenTop || elem.screenY;
        value.width = this.width();
        value.height = this.height();
        value.right = value.width + value.left;
        value.bottom = value.height + value.top;
        return value;
    }

    if( !this.isNodeElement() )
        throw new Error('invalid elem. elem not is NodeElement');

    var doc =  elem.ownerDocument || elem, docElem=doc.documentElement;
    this.current( Element.prototype.getWindow.call(doc) );
    var scrollTop = this.scrollTop();
    var scrollLeft = this.scrollLeft();
    this.current( elem );

    if( "getBoundingClientRect" in document.documentElement )
    {
        var box = elem.getBoundingClientRect();
        var clientTop = docElem.clientTop || doc.body.clientTop || 0,
            clientLeft = docElem.clientLeft || doc.body.clientLeft || 0;

        value.top = box.top + scrollTop - clientTop;
        value.left = box.left + scrollLeft - clientLeft;
        value.right = box.right + scrollLeft - clientLeft;
        value.bottom = box.bottom + scrollTop - clientTop;
        value.width = box.width || box.right-box.left;
        value.height = box.height || box.bottom-box.top;

    }else
    {
        value.width = this.width();
        value.height= this.height();
        do {
            value.top += elem.offsetTop;
            value.left += elem.offsetLeft;
            elem = elem.offsetParent;
        } while (elem);
        value.right = value.width+value.left;
        value.bottom = value.height+value.top;
    }

    //始终相对浏览器窗口的位置
    if( this.style('position') === 'fixed' || force===true )
    {
        value.top -= scrollTop;
        value.left -= scrollLeft;
        value.right -= scrollLeft;
        value.bottom -= scrollTop;
    }
    return value;
};

/**
 * @private
 */
accessor['position']={
    get:function(prop,obj){
        return obj.getBoundingRect()[ prop ];
    },
    set:function(prop,newValue,obj){
        if( obj.style('position')==='static' )obj.style('position','relative');
        return obj.style(prop,parseInt(newValue) || 0 );
    }
};


/**
 * 获取或者设置相对于父元素的左边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.left=function left(val )
{
    return access.call(this,'position','left',val)
};

/**
 * 获取或者设置相对于父元素的顶边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.top=function top(val )
{
    return access.call(this,'position','top',val)
};

/**
 * 获取或者设置相对于父元素的右边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.right=function right(val )
{
    return access.call(this,'position','right',val)
};

/**
 * 获取或者设置相对于父元素的底端位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.bottom=function bottom(val )
{
    return access.call(this,'position','bottom',val)
};

/**
 * @private
 */
function point(left, top, local )
{
    var old = this.forEachCurrentItem;
    var target = this.current();
    this.current( target.parentNode );
    var offset=this.getBoundingRect();
    this.current( old );
    left = left || 0;
    top = top || 0;
    return local===true ? {left:offset.left+left,top:offset.top+top} : {left:left-offset.left, top:top-offset.top};
}

/**
 *  将本地坐标点转成相对视图的全局点
 *  @param left
 *  @param top
 *  @returns {object} left top
 */
Element.prototype.localToGlobal=function localToGlobal(left, top)
{
    return point.call(this,left, top, true);
};

/**
 *  将视图的全局点转成相对本地坐标点
 *  @param left
 *  @param top
 *  @returns {object}  left top
 */
Element.prototype.globalToLocal=function globalToLocal(left, top )
{
    return point.call(this,left, top);
};

//============================================元素选择===================================

/**
 * 回撒到指定步骤的选择器所匹配的元素,不包含初始化的步骤。
 * @param step
 * @returns {Element}
 */
Element.prototype.revert=function revert(step )
{
    var reverts= this.__reverts__;
    if( reverts && reverts.length > 0 )
    {
        var len=reverts.length;
        step = step || -1;
        step= step < 0 ? step+len : step;
        step=step >= len ? 0 : step;
        this.splice(0,this.length, reverts.splice(step, len-step).shift() );
    }
    return this;
};

/**
 * 查找当前匹配的第一个元素下的指定选择器的元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.find=function find(selector )
{
    var ret=[];
    this.forEach(function(elem){
        ret = ret.concat.apply(ret,querySelector(selector, elem ) );
    });
    return doMake.call( this, ret );
};

/**
 * 查找所有匹配元素的父级元素或者指定selector的父级元素（不包括祖辈元素）
 * @param selector
 * @returns {Element}
 */
Element.prototype.parent=function parent(selector )
{
    return doMake.call( this, Array.prototype.unique.call( doRecursion.call(this,'parentNode',selector ) ) );
};

/**
 * 查找所有匹配元素的祖辈元素或者指定 selector 的祖辈元素。
 * 如果指定了 selector 则返回最近的祖辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.parents=function parents(selector )
{
    return doMake.call( this, Array.prototype.unique.call( doRecursion.call(this,'parentNode',selector, true ) ) );
};

/**
 * 获取所有匹配元素向上的所有同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prevAll=function prevAll(selector )
{
    return doMake.call( this, doRecursion.call(this,'previousSibling', selector, true ) );
};

/**
 * 获取所有匹配元素紧邻的上一个同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prev=function prev(selector )
{
    return doMake.call( this, doRecursion.call(this,'previousSibling', selector ) );
};

/**
 * 获取所有匹配元素向下的所有同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.nextAll=function nextAll(selector )
{
    return doMake.call( this, doRecursion.call(this,'nextSibling', selector , true ) );
};

/**
 * 获取每一个匹配元素紧邻的下一个同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.next=function next(selector )
{
    return doMake.call( this, doRecursion.call(this,'nextSibling', selector ) );
};

/**
 * 获取每一个匹配元素的所有同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.siblings=function siblings(selector )
{
    var results=[].concat( doRecursion.call(this,'previousSibling',selector,true) , doRecursion.call(this,'nextSibling',selector, true) );
    return doMake.call( this, results );
};

/**
 * 查找所有匹配元素的所有子级元素，不包括孙元素
 * @param selector 如果是 * 返回包括文本节点的所有元素。不指定返回所有HTMLElement元素。
 * @returns {Element}
 */
Element.prototype.children=function children(selector )
{
    if( typeof selector === 'undefined' )
    {
        selector= function(item){ return item.nodeType===1 };
    }
    var is=typeof selector === "function";
    var results=[];
    this.forEach(function(element)
    {
        if( !this.isFrame() && element.hasChildNodes() )
        {
            var child = this.slice.call( element.childNodes );
            results =  is ? this.concat.call( results, Array.prototype.filter.call(child, selector ) ) :
                this.concat.call( results, querySelector(selector,element,null,child) );
        }
    });
    return doMake.call( this, Array.prototype.unique.call(results) );
};

//========================操作元素===========================

/**
 * 用指定的元素来包裹当前所有匹配到的元素
 * @param element
 * @returns {Element}
 */
Element.prototype.wrap=function wrap(element )
{
    var is=System.isFunction( element );
    return this.forEach(function(elem)
    {
        var wrap=createElement( is ? element.call(this,elem) : element );
        this.current( elem.parentNode ).addChildAt( wrap , elem );
        this.current( wrap ).addChildAt( elem ,-1);
    });
};

/**
 * 取消当前所有匹配元素的父级元素。不指定选择器则默认为父级元素，否则为指定选择器的祖辈元素。
 * 父级或者祖辈元素只能是body的子元素。
 * @param selector
 * @returns {Element}
 */
Element.prototype.unwrap=function unwrap(selector )
{
    var is= typeof selector === "undefined";
    return this.forEach(function(elem)
    {
        var parent= is ?  elem.parentNode : doRecursion.call(this,'parentNode',selector )[0];
        if( parent && parent.ownerDocument && Element.prototype.contains.call( parent.ownerDocument.body, parent ) )
        {
            var children=parent.hasChildNodes() ? parent.childNodes : [];
            if( parent.parentNode )
            {
                this.current( parent.parentNode );
                var len=children.length,i=0;
                while( i<len ){
                    if( children[i] )this.addChildAt( children[ i ], parent );
                    i++;
                }
                this.removeChildAt( parent );
            }
        }
    });
};


/**
 * 获取或者设置 html
 * @param html
 * @returns {string | Element}
 */
Element.prototype.html=function html(html )
{
    var outer = html === true;
    var write= !outer && typeof html !== "undefined";
    if( !write && this.length < 1 ) return '';
    return this.forEach(function(elem)
    {
        if( !write )
        {
            html=elem.innerHTML;
            if( outer )
            {
                if( typeof elem.outerHTML==='string' )
                {
                    html=elem.outerHTML;
                }else
                {
                    var cloneElem=cloneNode( elem, true);
                    if( cloneElem )
                    {
                        html=document.createElement( 'div' ).appendChild( cloneElem ).innerHTML;
                    }
                }
            }
            return html;
        }

        if( elem.hasChildNodes() )
        {
            var nodes=elem.childNodes;
            var len=nodes.length,b=0;
            for( ; b < len ; b++ ) if( nodes[b] )
            {
                removeChild.call(this,elem, nodes[b] , false );
            }
        }

        if( typeof html === "string" )
        {
            html = System.trim( html );
            try{
                elem.innerHTML = html;
                dispatchElementEvent.call(this,elem,html,ElementEvent.ADD)
            }catch(e)
            {
                var nodename = getNodeName( elem );
                if( !new RegExp("^<"+nodename).exec(html) )
                {
                    html= System.sprintf('<%s>%s</%s>',nodename,html,nodename);
                }
                var child= createElement( html );
                var deep =  nodename === 'tr' ? 2 : 1,d=0;
                while( d < deep && child.firstChild )
                {
                    d++;
                    child=child.firstChild;
                }
                mergeAttributes(child, elem);
                elem.parentNode.replaceChild(child,  elem );
                dispatchElementEvent.call(this,elem.parentNode,child,ElementEvent.ADD);
            }

        }else
        {
            this.addChild(html);
            return true;
        }
    });
};


/**
 * 添加子级元素（所有已匹配的元素）
 * @param childElemnet
 * @returns {Element}
 */
Element.prototype.addChild=function addChild(childElemnet )
{
    return this.addChildAt( childElemnet,-1);
};

/**
 * 在指定位置加子级元素（所有已匹配的元素）。
 * 如果 childElemnet 是一个已存在的元素，那么会先删除后再添加到当前匹配的元素中后返回，后续匹配的元素不会再添加此元素。
 * @param childElemnet 要添加的子级元素
 * @param index | refChild | fn(node,index,parent)  要添加到的索引位置
 * @returns {Element}
 */
Element.prototype.addChildAt=function addChildAt(childElemnet, index)
{
    if( childElemnet instanceof Element )
    {
        childElemnet=childElemnet.slice(0);
        for( var c=0; c<childElemnet.length; c++)
        {
            this.addChildAt( childElemnet[c], index );
        }
        return this;
    }

    if( index===undefined )
        throw new Error('Invalid param the index');

    var isElement= childElemnet && childElemnet.nodeType && typeof childElemnet.nodeName === 'string';

    //如果没有父级元素则设置上下文为父级元素
    if( this.length === 0 && !this.current() )
    {
        var context = $get(this,"context");
        this.current( context === document ? document.body : context );
    }

    return this.forEach(function(parent)
    {
        if( !this.isHTMLElement() )
        {
            throw new Error('invalid parent HTMLElement.');
        }
        try{
            var child=isElement ? childElemnet : createElement( childElemnet );
        }catch(e){
            throw new Error('The childElemnet not is HTMLElement');
        }
        if( child.parentNode !== parent  )
        {
            if( child.parentNode )this.removeChildAt( child );
            this.current(parent);
            var refChild=index && index.parentNode && index.parentNode===parent ? index : null;
            !refChild && ( refChild=this.getChildAt( typeof index==='number' ? index : index ) );
            refChild && (refChild=index.nextSibling);
            parent.insertBefore( child , refChild || null );
            dispatchElementEvent.call(this,parent,child,ElementEvent.ADD )
        }
        if( isElement ) return this;
    })
};

/**
 * 返回指定索引位置的子级元素( 匹配选择器的第一个元素 )
 * 此方法只会计算节点类型为1的元素。
 * @param index | refChild | fn(node,index,parent)
 * @returns {Node|null}
 */
Element.prototype.getChildAt=function getChildAt( index )
{
    return this.forEach(function(parent)
    {
        var childNodes,child=null;
        if( parent.hasChildNodes() )
        {
            if( typeof index === 'function' )
            {
                child=getChildNodes.call(this, parent ,index ,true)[0];

            }else if( typeof index === 'number' )
            {
                childNodes=getChildNodes.call(this,parent);
                index=index < 0 ? index+childNodes.length : index;
                child=index >= 0 && index < childNodes.length ? childNodes[index] : null;
            }
        }
        return child;
    })
};

/**
 * 返回子级元素的索引位置( 匹配选择器的第一个元素 )
 * @param childElemnet | selector
 * @returns {Number}
 */
Element.prototype.getChildIndex=function getChildIndex( childElemnet )
{
    if( typeof childElemnet==='string' )
    {
        childElemnet= querySelector( childElemnet, null, null, this.slice(0) )[0];
        if( !childElemnet )return -1;
        this.current( childElemnet.parentNode );
    }
    var parent = this.current();
    if( childElemnet.parentNode===parent )
    {
        return this.indexOf.call( getChildNodes(parent), childElemnet );
    }
    return -1;
};


/**
 * 移除指定的子级元素
 * @param childElemnet|selector
 * @returns {Element}
 */
Element.prototype.removeChild=function removeChild( childElemnet )
{
    if( typeof childElemnet==='string' )
    {
        this.forEach(function(elem)
        {
            var children=querySelector(childElemnet,elem), b=0,len=children.length;
            for( ; b<len ; b++)if( children[b] && children[b].nodeType===1 && children[b].parentNode )
            {
                this.removeChildAt( children[b] );
            }
        })
    }else
    {
        this.removeChildAt( childElemnet );
    }
    return this;
};

/**
 * 移除子级元素
 * @param childElemnet|index|fn  允许是一个节点元素或者是相对于节点列表中的索引位置（不包括文本节点）。
 *        也可以是一个回调函数过滤要删除的子节点元素。
 * @returns {Element}
 */
Element.prototype.removeChildAt=function removeChildAt(index)
{
    var is=false;
    if( typeof index === "object" && index.parentNode )
    {
        this.current( index.parentNode );
        is=true;
    }else if( !System.isNumber( index ) )
        throw new Error('Invalid param the index. in removeChildAt');
    return this.forEach(function(parent)
    {
        var child= is ? index : this.getChildAt( index );
        if( child.parentNode === parent )parent.removeChild(child);
        if( is )return this;
    });
};

/**
 * 测试指定的元素（或者是一个选择器）是否为当前元素的子级
 * @param child
 * @returns {boolean}
 */
Element.prototype.contains=function contains( child )
{
    var parent = this instanceof Element ? this.current() : this;
    if( isNodeElement(child) )
    {
        if('contains' in parent)return parent.contains( child ) && parent !== child;
        return !!(parent.compareDocumentPosition(child) & 16) && parent !== child ;
    }
    return querySelector( child, parent ).length > 0;
}

/**
 * 获取元素所在的窗口对象
 * @param elem
 * @returns {window|null}
 */
Element.prototype.getWindow=function getWindow()
{
    var elem = this instanceof Element ? this.current() : this;
    var ret = null;
    if( elem ) {
        elem = elem.ownerDocument || elem;
        ret = elem.window || elem.defaultView || elem.contentWindow || elem.parentWindow;
    }
    return ret ? ret : window || null;
}

//form elements
var formPatternReg=/select|input|textarea|button/i;

/**
 * 判断是否为一个表单元素
 * @returns {boolean}
 */
Element.prototype.isForm=function isForm(exclude)
{
    var elem  = this instanceof Element ? this.current() : this;
    if( elem && typeof elem.nodeName ==='string' )
    {
        var ret=formPatternReg.test( elem.nodeName );
        return ret && typeof exclude === 'string' ? exclude.toLowerCase() !== this.nodeName() : ret;
    }
    return false;
};

/**
 * @private
 * @type {boolean}
 */
var ishtmlobject = typeof HTMLElement==='object';

/**
 * 判断是否为一个HtmlElement类型元素,document 不属性于 HtmlElement
 * @returns {boolean}
 */
Element.prototype.isHTMLElement=function isHTMLElement()
{
    var elem  = this instanceof Element ? this.current() : this;
    if( typeof elem !== "object" )return false;
    return ishtmlobject ? elem instanceof HTMLElement : ( elem.nodeType === 1 && typeof elem.nodeName === "string" );
};

/**
 * 判断是否为一个节点类型元素
 * document window 不属于节点类型元素
 * @returns {boolean}
 */
Element.prototype.isNodeElement=function isNodeElement()
{
    var elem  = this instanceof Element ? this.current() : this;
    if( typeof elem !== "object" ) return false;
    return typeof Node !== "undefined" ? elem instanceof Node :
        !!( elem.nodeType && typeof elem.nodeName === "string" && (typeof elem.tagName === "string" || elem.nodeType===9) );
};

/**
 * 判断是否为一个html容器元素。
 * HTMLElement和document属于Html容器
 * @param element
 * @returns {boolean|*|boolean}
 */
Element.prototype.isHTMLContainer=function isHTMLContainer()
{
    var elem  = this instanceof Element ? this.current() : this;
    if( typeof elem !== "object" ) return false;
    return Element.prototype.isHTMLElement.call(elem) || Element.prototype.isDocument.call(elem);
};

/**
 * 判断是否为一个事件元素
 * @param element
 * @returns {boolean}
 */
Element.prototype.isEventElement=function isEventElement()
{
    var elem  = this instanceof Element ? this.current() : this;
    return (elem && ( typeof elem.addEventListener === "function" || typeof elem.attachEvent=== "function" ) );
};

/**
 * 判断是否为窗口对象
 * @param obj
 * @returns {boolean}
 */
Element.prototype.isWindow=function isWindow()
{
    var elem  = this instanceof Element ? this.current() : this;
    return ( elem && elem === Element.prototype.getWindow.call(elem) );
};

/**
 * 决断是否为文档对象
 * @returns {*|boolean}
 */
Element.prototype.isDocument=function isDocument()
{
    var elem  = this instanceof Element ? this.current() : this;
    return elem && elem.nodeType===9;
};

/**
 * 判断是否为一个框架元素
 * @returns {boolean}
 */
Element.prototype.isFrame=function isFrame()
{
    var elem  = this instanceof Element ? this.current() : this;
    var nodename =getNodeName(elem);
    return (nodename === 'iframe' || nodename==='frame');
};


// fix style name add prefix
if( System.env.platform( System.env.BROWSER_FIREFOX ) && System.env.version(4) )
{
    fix.cssPrefixName='-moz-';

}else if( System.env.platform( System.env.BROWSER_SAFARI )  || System.env.platform( System.env.BROWSER_CHROME ) )
{
    fix.cssPrefixName='-webkit-';

}else if( System.env.platform(System.env.BROWSER_OPERA) )
{
    fix.cssPrefixName='-o-';

}else if( System.env.platform(System.env.BROWSER_IE) && System.env.version(9,'>=') )
{
    fix.cssPrefixName='-ms-';
}

//set hooks for userSelect style
fix.cssHooks.userSelect={

    get: function( style )
    {
        return style[ getStyleName('userSelect') ] || '';
    },
    set: function( style, value )
    {
        style[ getStyleName('userSelect') ] = value;
        style['-moz-user-fetch'] = value;
        style['-webkit-touch-callout'] = value;
        style['-khtml-user-fetch'] = value;
        return true;
    }
};

//set hooks for radialGradient and linearGradient style
fix.cssHooks.radialGradient=fix.cssHooks.linearGradient={

    get: function( style, name )
    {
        return  Element.storage(this,name) || '';
    },
    set: function( style, value, name )
    {
        value = System.trim(value);
        //Element.storage(this,name,value);
        if( ( System.env.platform(System.env.BROWSER_SAFARI) && System.env.version(5.1,'<') )  ||
            ( System.env.platform(System.env.BROWSER_CHROME) && System.env.version(10,'<') ) )
        {
            var position='';
            var deg= 0;
            if(name==='radialGradient')
            {
                position=value.match(/([^\#]*)/);
                if( position ){
                    position = position[1].replace(/\,\s*$/,'');
                    value=value.replace(/([^\#]*)/,'')
                }
                value = value.split(',');
            }else
            {
                var deg = value.match(/^(\d+)deg/);
                value = value.split(',');
                if( deg )
                {
                    deg = deg[1];
                    value.splice(0,1);
                }
                deg=parseFloat(deg) || 0;
            }
            var color = [];
            for(var i=0; i<value.length; i++)
            {
                var item = System.trim(value[i]).split(/\s+/,2);
                if( i===0 )color.push("from("+item[0]+")");
                if( !(i===0 || i===value.length-1 ) || typeof item[1] !== "undefined"  )
                {
                    var num = (parseFloat(item[1]) || 0) / 100;
                    color.push( "color-stop("+num+","+item[0]+")" );
                }
                if( i===value.length-1 )
                    color.push("to("+item[0]+")");
            }

            var width= Element.getSize(this,'width');
            var height=  Element.getSize(this,'height');
            if(name==='radialGradient')
            {
                position = position.split(/\,/,2);
                var point = System.trim(position[0]).split(/\s+/,2);
                if(point.length===1)point.push('50%');
                var point = point.join(' ');
                position=point+',0, '+point+', '+width/2;
                value=System.sprintf("%s,%s,%s",'radial',position,color.join(',') );

            }else{

                var x1=Math.cos(  deg*(Math.PI/180) );
                var y1=Math.sin(  deg*(Math.PI/180) );
                value=System.sprintf("%s,0% 0%,%s %s,%s",'linear',Math.round(x1*width),Math.round(y1*height),color.join(',') );
            }
            name='gradient';

        }else if( !value.match(/^(left|top|right|bottom|\d+)/) && name==='linearGradient' )
        {
            value= '0deg,'+value;

        }else if( name==='linearGradient' )
        {
            value= value.replace(/^(\d+)(deg)?/,'$1deg')
        }

        var prop = 'background-image';
        if( System.env.platform(System.env.BROWSER_IE) && System.env.version(10,'<') )
        {
            value=value.split(',');
            var deg = value.splice(0,1).toString();
            deg = parseFloat( deg ) || 0;
            var color=[];
            for(var i=0; i<value.length; i++)
            {
                var item = System.trim(value[i]).split(/\s+/,2);
                color.push( i%1===1 ? "startColorstr='"+item[0]+"'" :  "endColorstr='"+item[0]+"'" );
            }
            var type = deg % 90===0 ? '1' : '0';
            var linear = name==='linearGradient' ? '1' : '2';
            value = 'alpha(opacity=100 style='+linear+' startx=0,starty=5,finishx=90,finishy=60);';
            value= style.filter || '';
            value += System.sprintf(";progid:DXImageTransform.Microsoft.gradient(%s, GradientType=%s);",color.join(','), type );
            value += "progid:DXImageTransform.Microsoft.gradient(enabled = false);";
            prop='filter';

        }else
        {
            value= System.sprintf('%s(%s)', getStyleName( name ) , value ) ;
        }
        style[ prop ] = value ;
        return true;
    }
};

//add get width hooks
fix.cssHooks.width= {
    get:function(style){ return parseInt( fix.getsizeval.call(this,'Width') || style['width'] ) || 0 }
};

//add get height hooks
fix.cssHooks.height={
    get:function (style){return parseInt( fix.getsizeval.call(this,'Height') || style['height'] ) || 0;}
};


var Stylesheet = {};

/**
 * @private
 */
var animationSupport=null;

/**
 * 判断是否支持css3动画
 * @returns {boolean}
 */
function isAnimationSupport()
{
    if( animationSupport === null )
    {
        var prefix = fix.cssPrefixName;
        var div =createElement('div');
        var prop = prefix+'animation-play-state';
        div.style[prop] = 'paused';
        animationSupport = div.style[prop] === 'paused';
    }
    return animationSupport;
};

/**
 * @private
 */
var defaultOptions= {
    'duration':'1s',
    'repeats':'1',
    'reverse':'normal',
    'delay':'0s',
    'timing':'ease',
    'state':'running',
    'mode':'forwards'
};

/**
 * 生成css3样式动画
 * properties={
*    '0%':'left:10px;',
*    '100%':'left:100px;'
* }
 */
Stylesheet.createAnimationStyleSheet=function(stylename, properties, options )
{
    if( !isAnimationSupport() )return false;
    options =Object.merge(defaultOptions,options || {});
    var  css=[];
    for( var i in properties )
    {
        if( typeof  properties[i] === "string" )
        {
            css.push( i + ' {');
            css.push( properties[i] );
            css.push( '}' );
        }
    }

    var prefix = fix.cssPrefixName;
    css.unshift('@'+prefix+'keyframes ' + stylename + '{');
    css.push('}');
    css.push( '.'+stylename+'{' );

    var repeats = options.repeats < 0 ? 'infinite' : options.repeats;
    var timing=options.timing.replace(/([A-Z])/,function(all,a){
        return '-'+a.toLowerCase();
    });

    var param = {
        'name':stylename,
        'duration':options.duration,
        'iteration-count': repeats,  //infinite
        'delay':options.delay,
        'fill-mode':options.mode,  //both backwards none forwards
        'direction': options.reverse,  // alternate-reverse  reverse alternate normal
        'timing-function': timing,  //ease  ease-in  ease-out  cubic-bezier  linear
        'play-state':options.state //paused running
    };
    for( var p in  param )
    {
        css.push(prefix+'animation-'+p+':'+param[p]+';');
    }
    css.push('}');
    return css.join("\r\n");
};

/**
 * @private
 */
var headStyle =null;

/**
 * @param string style
 */
Stylesheet.addStyleSheet=function(styleName, styleSheetObject )
{
    if( headStyle=== null )
    {
        var head = document.getElementsByTagName('head')[0];
        headStyle = document.createElement('style');
        document.getElementsByTagName('head')[0].appendChild( headStyle );
    }

    if(System.isObject(styleSheetObject) )
    {
        styleSheetObject=System.serialize( styleSheetObject, 'style' );
    }

    if( typeof styleSheetObject === "string" )
    {
        if( System.env.platform( System.env.BROWSER_IE ) && System.env.version(9,'<') )
        {
            var styleName = styleName.split(',');
            styleSheetObject = styleSheetObject.replace(/^\{/,'').replace(/\}$/,'');
            for(var i=0; i<styleName.length; i++ )
            {
                headStyle.styleSheet.addRule(styleName[i], styleSheetObject, -1);
            }
        }else
        {
            if (styleSheetObject.charAt(0) !== '{')
            {
                styleSheetObject = '{' + styleSheetObject + '}';
            }
            headStyle.appendChild(document.createTextNode(styleName + styleSheetObject));
        }
        return true;
    }
    return false;
};
System.StyleSheel = Stylesheet;
return Element;
})(System,Sizzle);System.Element=Element;
/**
 * ElementEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 */
var ElementEvent = function ElementEvent( type, bubbles,cancelable )
{
    if( !(this instanceof ElementEvent) )return new ElementEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
ElementEvent.prototype=new Event();
ElementEvent.prototype.parent=null;
ElementEvent.prototype.child=null;
ElementEvent.prototype.constructor=ElementEvent;
ElementEvent.ADD='elementAdd';
ElementEvent.REMOVE='elementRemove';

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof ElementEvent )return originalEvent;
});System.ElementEvent=ElementEvent;
/*
 * BreezeJS Http class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
var Http = (function(System,Object,EventDispatcher,JSON,HttpEvent,Math){
    'use strict';
    var isSupported=false;
    var XHR=null;
    var localUrl='';
    var patternUrl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/;
    var protocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/;
    var patternHeaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg;
    var localUrlParts=[];
    var setting = {
        async: true
        , dataType: 'html'
        , method: 'GET'
        , timeout: 30
        , charset: 'UTF-8'
        , header: {
            'contentType': 'application/x-www-form-urlencoded'
            ,'Accept': "text/html"
            ,'X-Requested-With': 'XMLHttpRequest'
        }
    };

    if( typeof window !=="undefined" )
    {
        XHR = window.XMLHttpRequest || window.ActiveXObject;
        isSupported= typeof XHR === "function";
        localUrl = location.href;
        localUrlParts = patternUrl.exec( localUrl.toLowerCase() ) || [];
    }

    /**
     * 调度相关事件
     * @param type
     * @param data
     * @param status
     * @param xhr
     */
    function dispatchEvent(type, data, status, xhr)
    {
        if (this.hasEventListener(type))
        {
            var event = new HttpEvent(type);
            event.data = data || null;
            event.status = status || 0;
            event.url = xhr.__url__ || null;
            this.dispatchEvent(event);
        }
        if (xhr && xhr.__timeoutTimer__)
        {
            clearTimeout(xhr.__timeoutTimer__);
            xhr.__timeoutTimer__ = null;
        }
    };

    /**
     * @private
     * 完成请求
     * @param event
     */
    function done(event)
    {
        var xhr = event.currentTarget;
        var options = $get(this,"__options__");
        if (xhr.readyState !== 4)return;
        var match, result = null, headers = {};
        dispatchEvent.call(this, HttpEvent.DONE, null, 4, xhr);

        //获取响应头信息
        if( typeof xhr.getAllResponseHeaders === "function" )
        {
            while ( ( match = patternHeaders.exec(xhr.getAllResponseHeaders()) ) )
            {
                headers[match[1].toLowerCase()] = match[2];
            }
        }
        Object.defineProperty(this,'__responseHeaders__',{value:headers});
        if (xhr.status >= 200 && xhr.status < 300)
        {
            result = xhr.responseXML;
            if (options.dataType.toLowerCase() === Http.TYPE.JSON)
            {
                try {
                    result = JSON.parse( xhr.responseText );
                } catch (e) {
                    throw new Error('Invalid JSON the ajax response');
                }
            }
        }
        dispatchEvent.call(this,  HttpEvent.SUCCESS , result, xhr.status, xhr);
    };

    /**
     * HTTP 请求类
     * @param options
     * @returns {Http}
     * @constructor
     */
    function Http( options )
    {
        if( !isSupported )throw new Error('Http the client does not support');
        if ( !(this instanceof Http) )return new Http(options);
        Object.defineProperty(this,'__options__',{'value':Object.merge(true, setting, options)});
        EventDispatcher.call(this);
    }

    /**
     * Difine constan Http accept type
     */
    Http.ACCEPT = {
        XML: "application/xml,text/xml",
        HTML: "text/html",
        TEXT: "text/plain",
        JSON: "application/json, text/javascript",
        ALL: "*/*"
    };

    /**
     * Difine constan Http contentType data
     */
    Http.FORMAT = {
        X_WWW_FORM_URLENCODED: "application/x-www-form-urlencoded",
        FORM_DATA: "multipart/form-data",
        PLAIN: "text/plain",
        JSON: "application/json"
    };

    /**
     * Difine constan Http dataType format
     */
    Http.TYPE = {
        HTML: 'html',
        XML: 'xml',
        JSON: 'json',
        JSONP: 'jsonp'
    };

    /**
     * Difine Http method
     */
    Http.METHOD = {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT'
    };

    /**
     * 继承事件类
     * @type {Object|Function}
     */
    Http.prototype = new EventDispatcher();
    Http.prototype.constructor = Http;

    /**
     * 取消请求
     * @returns {Boolean}
     */
    Http.prototype.abort = function abort()
    {
        var xhr = $get(this,"__xhr__");
        if (xhr) {
            if( typeof xhr === "function" )xhr.abort();
            dispatchEvent.call(this, HttpEvent.CANCELED, null, -1);
            return true;
        }
        return false;
    };

    /**
     * 发送请求
     * @param data
     * @returns {boolean}
     */
    Http.prototype.send = function send(url, data, method)
    {
        if (typeof url !== "string")throw new Error('Invalid url');
        if ( $get(this,"__xhr__") )return true;
        var options = $get(this,"__options__");
        var async = !!options.async;
        var method = method || options.method;
        var self = this;
        if (typeof method === 'string')
        {
            method = method.toUpperCase();
            if (!(method in Http.METHOD)) {
                throw new Error('Invalid method for ' + method);
            }
        }

        try {
            var xhr;
            if (options.dataType.toLowerCase() === 'jsonp')
            {
                xhr = new ScriptRequest( async );
                xhr.addEventListener(HttpEvent.SUCCESS, function (event) {
                    dispatchEvent.call(this, event.type, event.data || null, 4, xhr);
                }, false, 0, this);
                xhr.send(url, data, method);

            } else
            {
                xhr = new XHR("Microsoft.XMLHTTP");
                EventDispatcher(xhr).addEventListener(Event.LOAD, done, false, 0, this);
                data = System.serialize(data, 'url') || null;
                if (method === Http.METHOD.GET && data)
                {
                    if (data != '')url += /\?/.test(url) ? '&' + data : '?' + data;
                    data = null;
                }
                xhr.open(method, url, async);

                //如果请求方法为post
                if (method === Http.METHOD.POST)
                {
                    options.header.contentType = "application/x-www-form-urlencoded";
                }

                //设置请求头
                if (typeof xhr.setRequestHeader === 'function')
                {
                    if (!/charset/i.test(options.header.contentType))options.header.contentType += ';' + options.charset;
                    try {
                        var name;
                        for (name in options.header)
                        {
                            xhr.setRequestHeader(name, options.header[name]);
                        }
                    } catch (e){}
                }

                //设置可以接收的内容类型
                if (xhr.overrideMimeType && options.header.Accept)
                {
                    xhr.overrideMimeType(options.header.Accept)
                }
                xhr.send(data);
            }

        } catch (e) {
            throw new Error('Http the client does not support');
        }

        Object.defineProperty(this, '__xhr__', {value: xhr});
        xhr.__url__ = url;

        //设置请求超时
        xhr.__timeoutTimer__ = setTimeout((function (xhr) {
            return function () {
                xhr.abort();
                dispatchEvent.call(self, HttpEvent.TIMEOUT, null, 0, xhr);
            }
        })(xhr), options.timeout * 1000);
        return true;
    };

    /**
     * 设置Http请求头信息
     * @param name
     * @param value
     * @returns {Http}
     */
    Http.prototype.setRequestHeader = function (name, value) {
        var options = $get(this,"__options__");
        if (typeof value !== "undefined" && !$get(this,"__xhr__") )
        {
            options.header[name] = value;
        }
        return this;
    };

    /**
     * 获取已经响应的头信息
     * @param name
     * @returns {null}
     */
    Http.prototype.getResponseHeader = function (name) {
        var responseHeaders = $get(this,"__responseHeaders__");
        if( !responseHeaders )return '';
        return typeof name === 'string' ? responseHeaders[ name.toLowerCase() ] || '' : responseHeaders;
    };

    //脚本请求队列
    var queues = [];

    /**
     * 通过脚本请求服务器
     * @returns {ScriptRequest}
     * @constructor
     */
    function ScriptRequest( async )
    {
        if (!(this instanceof ScriptRequest)) {
            return new ScriptRequest();
        }
        var target = document.createElement('script');
        target.setAttribute('type', 'text/javascript');
        EventDispatcher.call(this, target);
        queues.push(this);
        this.__key__ = 's'+queues.length+System.time();
        this.__target__ = target;
        this.__async__ = !!async;
    }

    ScriptRequest.prototype = new EventDispatcher();
    ScriptRequest.prototype.constructor = ScriptRequest;

    /**
     * 开始请求数据
     * @param url
     * @param data
     * @param async
     */
    ScriptRequest.prototype.send = function send(url, data, method)
    {
        if (this.__sended__)
            return false;

        this.__sended__ = true;
        if (typeof url !== 'string')
        {
            throw new Error('Invalid url.');
        }

        var param = [];
        !data || param.push( System.serialize(data, 'url') );
        param.push('k=' + this.__key__ );
        param = param.join('&');
        url += !/\?/.test(url) ? '?' + param : '&' + param;

        var target = this.__target__;
        if( this.__async__ )target.setAttribute('async', 'async');
        target.setAttribute('src', url);
        if (!target.parentNode) {
            (document.head || document.getElementsByTagName("head")[0]).appendChild(target);
        }
    };

    /**
     * 终止请求
     */
    ScriptRequest.prototype.abort = function ()
    {
        this.__canceled__ = true;
        var target = this.__target__;
        if (target && target.parentNode) {
            target.parentNode.removeChild(target);
        }
        return true;
    };

    /**
     * 脚本请求后的响应回调函数
     * @param data 响应的数据集
     * @param key 向服务器请求时的 key。 此 key 是通知每个请求对象做出反应的唯一编号。
     */
    Http.JSONP_CALLBACK = function callback(data, key)
    {
        var index = Math.max(queues.length - 1, 0);
        if (typeof key !== "undefined") while (index > 0) {
            if (queues[index].__key__ == key)break;
            index--;
        }
        if (queues[index] && queues[index].__key__ == key)
        {
            var target = queues.splice(index, 1).pop();
            if (!target.__canceled__) {
                var event = new HttpEvent(HttpEvent.SUCCESS);
                event.data = data;
                event.status = 200;
                target.dispatchEvent(event);
            }
        }
    }
    return Http;
}(System,System.Object,System.EventDispatcher,System.JSON,System.HttpEvent));

System.Http=Http;
var HttpEvent = function HttpEvent( type, bubbles,cancelable ){
    if( !(this instanceof HttpEvent) )return new HttpEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
HttpEvent.prototype=new Event();
HttpEvent.prototype.data=null;
HttpEvent.prototype.url=null;
HttpEvent.SUCCESS = 'httpSuccess';
HttpEvent.ERROR   = 'httpError';
HttpEvent.CANCELED  = 'httpCanceled';
HttpEvent.TIMEOUT = 'httpTimeout';
HttpEvent.DONE    = 'httpDone';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof HttpEvent )return originalEvent;
});System.HttpEvent=HttpEvent;
var KeyboardEvent = function KeyboardEvent( type, bubbles,cancelable  )
{
    if( !(this instanceof KeyboardEvent) )return new KeyboardEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
KeyboardEvent.prototype=new Event();
KeyboardEvent.prototype.constructor=KeyboardEvent;
KeyboardEvent.prototype.keycode=null;
KeyboardEvent.KEY_PRESS='keypress';
KeyboardEvent.KEY_UP='keyup';
KeyboardEvent.KEY_DOWN='keydown';

//键盘事件
Event.registerEvent(function ( type , target, originalEvent )
{
    switch ( type ){
        case KeyboardEvent.KEY_PRESS :
        case KeyboardEvent.KEY_UP :
        case KeyboardEvent.KEY_DOWN :
            var event =new KeyboardEvent( type );
            event.keycode = originalEvent.keyCode || originalEvent.keycode;
            return event;
    }
});System.KeyboardEvent=KeyboardEvent;
/**
 * MouseEvent
 * @param src
 * @param props
 * @constructor
 */
var MouseEvent = function MouseEvent( type, bubbles,cancelable  )
{
    if( !(this instanceof MouseEvent) )return new MouseEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
};
MouseEvent.prototype=new Event();
MouseEvent.prototype.constructor=MouseEvent;
MouseEvent.prototype.pageX= NaN;
MouseEvent.prototype.pageY= NaN;
MouseEvent.prototype.offsetX=NaN;
MouseEvent.prototype.offsetY=NaN;
MouseEvent.prototype.screenX= NaN;
MouseEvent.prototype.screenY= NaN;
MouseEvent.MOUSE_DOWN='mousedown';
MouseEvent.MOUSE_UP='mouseup';
MouseEvent.MOUSE_OVER='mouseover';
MouseEvent.MOUSE_OUT='mouseout';
MouseEvent.MOUSE_OUTSIDE='mouseoutside';
MouseEvent.MOUSE_MOVE='mousemove';
MouseEvent.MOUSE_WHEEL='mousewheel';
MouseEvent.CLICK='click';
MouseEvent.DBLCLICK='dblclick';

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent ) {

    if( type && /^mouse|click$/i.test(type) )
    {
        var event =new MouseEvent( type );
        event.pageX= originalEvent.x || originalEvent.clientX || originalEvent.pageX;
        event.pageY= originalEvent.y || originalEvent.clientY || originalEvent.pageY;
        event.offsetX = originalEvent.offsetX;
        event.offsetY = originalEvent.offsetY;
        event.screenX= originalEvent.screenX;
        event.screenY= originalEvent.screenY;
        if( typeof event.offsetX !=='number' && target )
        {
            event.offsetX=originalEvent.pageX-target.offsetLeft;
            event.offsetY=originalEvent.pageY-target.offsetTop;
        }
        if( type === MouseEvent.MOUSE_WHEEL )
        {
            event.wheelDelta=originalEvent.wheelDelta || ( originalEvent.detail > 0 ? -originalEvent.detail : Math.abs( originalEvent.detail ) );
        }
        return event;
    }
});

if( System.env.platform( System.env.BROWSER_FIREFOX ) )
{
    Event.fix.map[ MouseEvent.MOUSE_WHEEL ] = 'DOMMouseScroll';
}System.MouseEvent=MouseEvent;
/**
 * PropertyEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 */
var PropertyEvent = function PropertyEvent( type, bubbles,cancelable ){
    if( !(this instanceof PropertyEvent) )return new PropertyEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
PropertyEvent.prototype=new Event();
PropertyEvent.prototype.property=null;
PropertyEvent.prototype.newValue=null;
PropertyEvent.prototype.oldValue=null;
PropertyEvent.prototype.constructor=PropertyEvent;
PropertyEvent.CHANGE='propertyChange';
PropertyEvent.COMMIT='propertyCommit';
Event.fix.map[ PropertyEvent.CHANGE ] = 'input';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    switch ( type ){
        case PropertyEvent.CHANGE :
        case PropertyEvent.COMMIT :
            var event =new PropertyEvent( type );
            if( typeof originalEvent.propertyName === "string" )
            {
                event.property = originalEvent.propertyName;
                event.newValue = target[ event.property ];
            }
            return event;
    }
});System.PropertyEvent=PropertyEvent;
/**
 * StyleEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 */
var StyleEvent = function StyleEvent( type, bubbles,cancelable ){
    if( !(this instanceof StyleEvent) )return new StyleEvent(type, bubbles,cancelable);
    PropertyEvent.call(this, type, bubbles,cancelable );
    return this;
};
StyleEvent.prototype=new PropertyEvent();
StyleEvent.prototype.constructor=StyleEvent;
StyleEvent.CHANGE='styleChange';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
     if( originalEvent instanceof StyleEvent )return originalEvent;
     if( type === StyleEvent.CHANGE )return new StyleEvent( StyleEvent.CHANGE );
});System.StyleEvent=StyleEvent;
/*
* BreezeJS TouchEvent class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/
var TouchEvent = function TouchEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchEvent) )return new TouchEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
TouchEvent.prototype.constructor=TouchEvent ;
TouchEvent.prototype=new Event();
TouchEvent.TOUCH_START='touchStart';
TouchEvent.TOUCH_MOVE='touchMove';
TouchEvent.TOUCH_END='touchEnd';
TouchEvent.TOUCH_CANCEL='touchCancel';

var TouchPinchEvent = function TouchPinchEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchPinchEvent) )return new TouchPinchEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
TouchPinchEvent.prototype.constructor=TouchPinchEvent ;
TouchPinchEvent.prototype=new TouchEvent();
TouchPinchEvent.prototype.moveX=NaN;
TouchPinchEvent.prototype.moveY=NaN;
TouchPinchEvent.prototype.startX=NaN;
TouchPinchEvent.prototype.startY=NaN;
TouchPinchEvent.prototype.scale=NaN;
TouchPinchEvent.prototype.previousScale=NaN;
TouchPinchEvent.prototype.moveDistance=NaN;
TouchPinchEvent.prototype.startDistance=NaN;
TouchPinchEvent.TOUCH_PINCH_START='touchPinchStart';
TouchPinchEvent.TOUCH_PINCH_MOVE='touchPinchMove';
TouchPinchEvent.TOUCH_PINCH_END='touchPinchEnd';

var TouchDragEvent = function TouchDragEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchDragEvent) )return new TouchDragEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
TouchDragEvent.prototype.constructor=TouchDragEvent;
TouchDragEvent.prototype=new TouchEvent();
TouchDragEvent.prototype.startX=NaN;
TouchDragEvent.prototype.startY=NaN;
TouchDragEvent.prototype.moveX=NaN;
TouchDragEvent.prototype.moveY=NaN;
TouchDragEvent.prototype.lastMoveX=NaN;
TouchDragEvent.prototype.lastMoveY=NaN;
TouchDragEvent.prototype.startDate=NaN;
TouchDragEvent.prototype.moveDate=NaN;
TouchDragEvent.prototype.velocity=NaN;
TouchDragEvent.prototype.held=false;
TouchDragEvent.TOUCH_DRAG_START='touchDragStart';
TouchDragEvent.TOUCH_DRAG_MOVE='touchDragMove';
TouchDragEvent.TOUCH_DRAG_END='touchDragEnd';

var TouchSwipeEvent = function TouchSwipeEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchSwipeEvent) )return new TouchSwipeEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
TouchSwipeEvent.prototype.constructor=TouchSwipeEvent;
TouchSwipeEvent.prototype=new TouchEvent();
TouchSwipeEvent.prototype.startX=NaN;
TouchSwipeEvent.prototype.startY=NaN;
TouchSwipeEvent.prototype.moveX=NaN;
TouchSwipeEvent.prototype.moveY=NaN;
TouchSwipeEvent.prototype.lastMoveX=NaN;
TouchSwipeEvent.prototype.lastMoveY=NaN;
TouchSwipeEvent.prototype.startDate=NaN;
TouchSwipeEvent.prototype.moveDate=NaN;
TouchSwipeEvent.prototype.velocity=NaN;
TouchSwipeEvent.prototype.vDistance=NaN;
TouchSwipeEvent.prototype.hDistance=NaN;
TouchSwipeEvent.prototype.swiped=NaN;
TouchSwipeEvent.SWIPE_START='touchSwipeStart';
TouchSwipeEvent.SWIPE_MOVE='touchSwipeMove';
TouchSwipeEvent.SWIPE_END='touchSwipeEnd';


/*

var getDistance=function(startX,endX,startY,endY)
{
    return endX === startX && endY === startY ? 0 : Math.sqrt( Math.pow( (endX - startX), 2 ) + Math.pow( (endY - startY), 2 ) );
};

TouchEvent.setting = {
    longpress: {
        requiredTouches: 1,
        msThresh: 800,
        triggerStartPhase: false
    },
    rotate: {
        requiredTouches: 1
    }
};

//=============================== DragEvent ===============================

var type={};
type[TouchDragEvent.TOUCH_DRAG_START] = [TouchEvent.TOUCH_START];
type[TouchDragEvent.TOUCH_DRAG_MOVE]  = [TouchEvent.TOUCH_MOVE,TouchEvent.TOUCH_START];
type[TouchDragEvent.TOUCH_DRAG_END]   = [TouchEvent.TOUCH_END];

EventDispatcher.SpecialEvent( [TouchDragEvent.TOUCH_DRAG_START,TouchDragEvent.TOUCH_DRAG_MOVE, TouchDragEvent.TOUCH_DRAG_END ] ,function(listener, dispatch, add, remove)
{
     var t = type[ listener.type ];
     for( var i =0; i< t.length; i++)
     {

        // add(t[])
     }

    var dataName='__touch_drag_data__';
    var settings=TouchEvent.setting['drag'],
        x=0,
        y= 0,
        data=this[dataName],
        touches=event.targetTouches,
        type=event.type.toLowerCase() ;

    if( touches.length > 0 )
    {
        x=touches[0].pageX;
        y=touches[0].pageY
    }
    if( touches.length === 1 )
    {
        switch( listener.type )
        {
           case TouchEvent.TOUCH_START.toLowerCase() :
           {
               data=this[dataName]={};
               data.startX=x;
               data.startY=y;
               data.lastMoveX=x;
               data.lastMoveY=y;
               data.startDate=event.timeStamp;
               data.held=false;
               event= new TouchDragEvent( event ,data);
               event.type = TouchDragEvent.TOUCH_DRAG_START;
               this.dispatchEvent( event );
           }break;
           case TouchEvent.TOUCH_MOVE.toLowerCase() :
           {
               data.lastMoveX= data.moveX!==undefined ? data.moveX : data.startX;
               data.lastMoveY= data.moveY!==undefined ? data.moveY : data.startY;
               data.lastMoveDate=data.moveDate !==undefined ? data.moveDate : data.startDate;
               data.moveDate=event.timeStamp;
               data.moveX=x;
               data.moveY=y;
               data.held=( data.held || (data.moveDate - data.lastMoveDate) > 100 );
               var distance = getDistance( data.lastMoveX,data.moveX,data.lastMoveY,data.moveY ),
                   ms = data.moveDate - data.lastMoveDate;
               data.velocity = ms === 0 ? 0 : distance / ms;
               if( data.held )
               {
                   event = new TouchDragEvent( event,data);
                   event.type = TouchDragEvent.TOUCH_DRAG_MOVE;
                   this.dispatchEvent( event );
               }
           }break;
        }

    }else if( type===TouchEvent.TOUCH_END.toLowerCase() && data )
    {
        event= new TouchDragEvent( event ,data);
        event.type = TouchDragEvent.TOUCH_DRAG_END;
        delete this[dataName];
        this.dispatchEvent( event );
    }
});

//=============================== PinchEvent ===============================

type={};
type[TouchPinchEvent.TOUCH_PINCH_START] = TouchEvent.TOUCH_START;
type[TouchPinchEvent.TOUCH_PINCH_MOVE]  = [TouchEvent.TOUCH_MOVE,TouchEvent.TOUCH_START];
type[TouchPinchEvent.TOUCH_PINCH_END]   = TouchEvent.TOUCH_END;
EventDispatcher.expandHandle(type,function(event)
{
    var dataName='__touch_pinch_data__';
        data=this[dataName],
        touches=event.targetTouches,
        type=event.type.toLowerCase() ;

    if( touches &&  touches.length === 2 )
    {
        var points = {
            x1: touches[0].pageX,
            y1: touches[0].pageY,
            x2: touches[1].pageX,
            y2: touches[1].pageY
        };
        points.centerX = (points.x1 + points.x2) / 2;
        points.centerY = (points.y1 + points.y2) / 2;

        switch( type )
        {
            case TouchEvent.TOUCH_START.toLowerCase() :
            {
               data=this[dataName]={
                    'startX' : points.centerX,
                    'startY' : points.centerY,
                    'startDistance': getDistance( points.x1,points.x2,points.y1,points.y2 )
                };
                event=new TouchPinchEvent( event , data );
                event.type=TouchPinchEvent.TOUCH_PINCH_START;
                this.dispatchEvent( event );
            }break;
            case TouchEvent.TOUCH_MOVE.toLowerCase() :
            {
                data.previousScale = data.scale || 1;
                var moveDistance =  getDistance( points.x1,points.x2,points.y1,points.y2 ),
                    startDistance = data.startDistance;
                data.scale = moveDistance / startDistance;
                data.moveDistance=moveDistance;
                data.moveX=points.centerX;
                data.moveY=points.centerY;
                if( data.scale * startDistance > 0 )
                {
                    event=new TouchPinchEvent( event ,data );
                    event.type=TouchPinchEvent.TOUCH_PINCH_MOVE;
                    this.dispatchEvent( event );
                }

            }break;
        }

    }else if( type===TouchEvent.TOUCH_END.toLowerCase() && data )
    {
        event = new TouchPinchEvent( event , data );
        event.type =  TouchPinchEvent.TOUCH_PINCH_END;
        delete this[dataName];
        this.dispatchEvent( event );
    }
});

//=============================== SwipeEvent ===============================
type={};
type[TouchSwipeEvent.TOUCH_SWIPE_START] = TouchEvent.TOUCH_START;
type[TouchSwipeEvent.TOUCH_SWIPE_MOVE]  = [TouchEvent.TOUCH_MOVE,TouchEvent.TOUCH_START];
type[TouchSwipeEvent.TOUCH_SWIPE_END]   = TouchEvent.TOUCH_END;
EventDispatcher.expandHandle(type,function(event)
{
    var dataName='__touch_swipe_data__';
    var settings=TouchEvent.setting['swipe'],
        x=0,
        y= 0,
        data=this[dataName],
        touches=event.targetTouches,
        type=event.type.toLowerCase() ;

    if( touches &&  touches.length === 1 )
    {
        if( touches.length > 0 )
        {
            x=touches[0].pageX;
            y=touches[0].pageY
        }

        if( data === undefined )
        {
            data=this[dataName]={};
            data.startX=x;
            data.startY=y;
            data.startDate=event.timeStamp;
        }

        data.lastMoveDate = data.moveDate || data.startDate;
        data.lastMoveX    = data.moveX!==undefined ? data.moveX : data.startX;
        data.lastMoveY    = data.moveY!==undefined ? data.moveY : data.startY;
        data.moveDate     = event.timeStamp;
        data.moveX        = x;
        data.moveY        = y;
        data.hDistance    = data.moveX - data.startX;
        data.vDistance    = data.moveY - data.startY;
        var ms = data.moveDate - data.lastMoveDate;

        if(  !data.swiped  &&  Math.abs(data.hDistance) / ms > settings.velocityThresh ||
            Math.abs(data.vDistance) / ms > settings.velocityThresh )
        {
            data.swiped = true;
        }

        switch( type )
        {
            case TouchEvent.TOUCH_START.toLowerCase() :
            {
                event= new TouchSwipeEvent(event,data);
                event.type=TouchSwipeEvent.TOUCH_SWIPE_START;
                this.dispatchEvent( event );

            }break;
            case TouchEvent.TOUCH_MOVE.toLowerCase() :
            {
                if( data.swiped )
                {
                    var distance = getDistance( data.lastMoveX,data.moveX,data.lastMoveY,data.moveY ),
                        velocity = ms === 0 ? 0 : distance / ms,
                        direction=null;

                    if ( velocity > 1 )
                    {
                        if ( Math.abs(data.hDistance) > Math.abs( data.vDistance) )
                            direction = data.hDistance > 0 ? 'right' : 'left';
                        else
                            direction = data.vDistance > 0 ? 'down' : 'up';
                        data.direction=direction;
                        data.velocity=velocity;
                    }

                    if ( !data.swipeExecuted && direction )
                    {
                        data.swipeExecuted = true;
                        event= new TouchSwipeEvent(event,data);
                        event.type=TouchSwipeEvent.TOUCH_SWIPE_MOVE;
                        this.dispatchEvent( event ,data);
                        this[dataName]={};
                    }
                }

            }break;
        }

    }else if( type===TouchEvent.TOUCH_END.toLowerCase() && data )
    {
        delete this[dataName];
        event= new TouchSwipeEvent(event,data);
        event.type=TouchSwipeEvent.TOUCH_SWIPE_END;
        this.dispatchEvent( event ,data);
    }
});*/

System.TouchEvent=TouchEvent;
System.window = window;
System.document = document;

}
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
                    thisArg = $get(classModule,"extends");
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
                    thisArg = $get(classModule,"extends");
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
                    thisArg = $get(classModule,"extends");
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
            if ( !System.is(value, type) )toErrorMsg('TypeError Specify the type of value do not match. must is "' + getQualifiedClassName(type) + '"', classModule, info, value);
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
    if( typeof System[ name ] === "function" )return System[ name ];
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
            classModule.del = makeMethods('delete', classModule);
            classModule.get = makeMethods('get', classModule);
            classModule.set = makeMethods('set', classModule);
            classModule.newin = makeMethods('new', classModule);
            classModule.apply = makeMethods('apply', classModule);
            classModule.check = makeMethods('check', classModule);
        }
    }

    //如果是定义类或者接口
    if( typeof descriptions === "object" )
    {
        for (var prop in descriptions )classModule[prop] = descriptions[prop];
        classModule.constructor=null;
        if( typeof descriptions.constructor === "function" )
        {
            descriptions.constructor.prototype= new Object();
            descriptions.constructor.prototype.constructor = classModule;
            classModule.constructor = descriptions.constructor;
            //开放原型继承
            classModule.prototype = descriptions.constructor.prototype;
        }
    }
    return classModule;
}
System.define=define;return System;
}(Object,Function,Array,String,Number,Boolean,Math,Date,RegExp,Error,ReferenceError,TypeError,SyntaxError,typeof JSON==="undefined"?null:JSON,typeof Reflect==="undefined"?null:Reflect));

(function(Class,Interface,Number,String,JSON,Object,RegExp,Error,EvalError,RangeError,ReferenceError,SyntaxError,TypeError,URIError,Function,Date,Boolean,Symbol,Iterator,Reflect,Event,EventDispatcher,Array,Math,arguments,window,document,navigator ,location,Element,MouseEvent,KeyboardEvent,HttpEvent,StyleEvent,PropertyEvent,ElementEvent){
(function(){
var D=System.define("com.D",{
"constructor":function(){Object.defineProperty(this, "1488016754642", {enumerable: false, configurable: false, writable: false, value: {"bb":'123'}});Reflect.apply(Object,this);
},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\D.as",
"static":{},
"token":"1488016754642",
"extends":Object,
"classname":"D",
"package":"com",
"isAbstract":false,
"proto":{
"bb":{"qualifier":"protected"},
"address":{"qualifier":"protected","get":function(){return D.check("37:18",String,'66666');},"set":function(add){if(!System.is(add,String))System.throwError("type","type of mismatch. must is a String");
}},
"test":{"writable":false,"value":function(){return 'the fun createname';}}
}}, false);
})();
(function(){
var Dispatcher=System.define("com.Dispatcher",{
"constructor":function(){Object.defineProperty(this, "1488024327960", {enumerable: false, configurable: false, writable: false, value: {}}); Reflect.apply(EventDispatcher,this);},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\Dispatcher.as",
"static":{},
"token":"1488024327960",
"extends":EventDispatcher,
"classname":"Dispatcher",
"package":"com",
"isAbstract":false,
"proto":{
"addData":{"writable":false,"value":function(val){var e=Dispatcher.newin("26:40",Event,['addData']);Dispatcher.apply("28:35",this,"dispatchEvent",[e]);return val;}}
}}, false);
})();
(function(){
var IProt=System.define("lib.IProt",{
"constructor":null,
"token":"1484362494903",
"extends":null,
"classname":"IProt",
"package":"lib",
"isAbstract":false,
"proto":{
"connect":{"writable":false}
}}, true);
})();
(function(){
var IProt=System.define("lib.IProt");
var IProsess=System.define("lib.IProsess",{
"constructor":null,
"token":"1487687739698",
"extends":IProt,
"classname":"IProsess",
"package":"lib",
"isAbstract":false,
"proto":{
"database":{"writable":false}
}}, true);
})();
(function(){
var B=System.define("com.B");
var D=System.define("com.D");
var Dispatcher=System.define("com.Dispatcher");
var IProsess=System.define("lib.IProsess");
var IProt=System.define("lib.IProt");
var Abs=System.define("com.Abs",{
"constructor":function(){Object.defineProperty(this, "1486372858099", {enumerable: false, configurable: false, writable: false, value: {"dispatcher":null,"age":'3',"name":'666 66fff'}}); Reflect.apply(D,this);},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\Abs.as",
"static":{
"address":{"qualifier":"private","value":'shu line 6666'},
"classname":{"writable":false,"qualifier":"protected","get":function(){return Abs.check("33:18",String,'==the B classname=');}}
},
"token":"1486372858099",
"extends":D,
"classname":"Abs",
"package":"com",
"isAbstract":true,
"proto":{
"age":{"writable":false,"qualifier":"protected"},
"createName":{"writable":false,"qualifier":"protected","value":function(){return 'the fun createname';}},
"name":{"qualifier":"private"},
"cre":{"writable":false,"qualifier":"protected","value":function(str){if(!System.is(str,String))System.throwError("type","type of mismatch. must is a String");
Abs.apply("46:36",System,"log",[Abs.get("46:34",this,"name")]);Abs.apply("47:35",System,"log",['call cre']);}},
"connect":{"writable":false,"value":function(str){return Abs.check("51:18",String,'');}}
}}, false);
})();
(function(){
var Abs=System.define("com.Abs");
var D=System.define("com.D");
var Dispatcher=System.define("com.Dispatcher");
var IProsess=System.define("lib.IProsess");
var IProt=System.define("lib.IProt");
var B=System.define("com.B",{
"constructor":function(jj){Object.defineProperty(this, "1488119169758", {enumerable: false, configurable: false, writable: false, value: {"dispatcher":null,"age":'3',"name":'666 66fff'}});D.constructor.call(this,jj);var cc=66;B.apply("40:42",System,"log",['===the is B====']);},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\B.as",
"static":{
"address":{"qualifier":"protected","value":'shu line 6666'},
"classname":{"writable":false,"qualifier":"protected","get":function(){return B.check("33:18",String,'==the B classname=');}}
},
"token":"1488119169758",
"extends":D,
"classname":"B",
"package":"com",
"isAbstract":false,
"proto":{
"age":{"writable":false,"qualifier":"protected"},
"createName":{"writable":false,"qualifier":"protected","value":function(){return 'the fun createname';}},
"name":{"qualifier":"private"},
"cre":{"writable":false,"qualifier":"protected","value":function(str){if(!System.is(str,String))System.throwError("type","type of mismatch. must is a String");
B.apply("54:36",System,"log",[B.get("54:34",this,"name")]);B.apply("55:35",System,"log",['call cre']);}},
"connect":{"writable":false,"value":function(str){return B.check("59:18",String,'');}}
}}, false);
})();
(function(){
var B=System.define("com.B");
var IProsess=System.define("lib.IProsess");
var IProt=System.define("lib.IProt");
var Abs=System.define("com.Abs");
var D=System.define("com.D");
var Dispatcher=System.define("com.Dispatcher");
var Main=System.define("Main",{
"constructor":function(jj){Object.defineProperty(this, "1488904387330", {enumerable: false, configurable: false, writable: false, value: {"names":'399999',"uuu":'yhhh',"iu":5,"dd":Array,"_home":'ooooo'}});Reflect.apply(B,this);
Main.apply("70:16",Main.apply("43:41",EventDispatcher,undefined,[document]),"addEventListener",[Main.get("43:71",Event,"READY"),function(e){Main.apply("45:41",System,"log",['=====ready=====']);Main.apply("57:20",Main.apply("47:39",Element,undefined,['#container']),"addEventListener",[Main.get("47:74",MouseEvent,"CLICK"),function(e){Main.apply("49:61",System,"log",['==========style =====event=====']);}]);Main.apply("66:20",Main.apply("59:34",Element,undefined,['#list']),"addEventListener",[Main.get("59:69",MouseEvent,"CLICK"),function(e){Main.apply("61:53",this,"current",[Main.get("61:51",e,"currentTarget")]);Main.apply("64:69",System,"log",['==========%s=====',Main.apply("64:67",this,"property",['id'])]);}]);}]);},
"implements":[IProsess],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\Main.as",
"static":{
"name":{"value":'3999 yyy fsss 666'}
},
"token":"1488904387330",
"extends":B,
"classname":"Main",
"package":"",
"isAbstract":false,
"proto":{
"uuu":{"writable":false},
"ddcc":{"writable":false,"value":function(e){}},
"_home":{"qualifier":"private"},
"home":{"writable":false,"get":function(){Main.apply("83:65",System,"log",[System.is(this,IProsess),' the is getter home']);return Main.get("84:29",this,"_home");}},
"tests":{"writable":false,"value":function(a){avg=Array.prototype.slice.call(arguments, 1);
if(System.typeOf(a) === "undefined"){a=666;}
if(!System.is(a,Number))System.throwError("type","type of mismatch. must is a Number");
var i;
var bb=666;var tests;if(true){(function(){var yy=666;i=9;if(a){}Main.apply("102:42",System,"log",['===%s',Main]);}).call(this);}Main.apply("104:39",System,"log",[a,avg,i,bb]);return Main.check("105:18",Main,this);}},
"cre":{"writable":false,"qualifier":"protected","value":function(str){if(!System.is(str,String))System.throwError("type","type of mismatch. must is a String");
Main.apply("112:45",System,"log",[Main.get("112:24",this,"bb"),'====this cre====']);return Main.check("113:18",String,Main.get("113:26",this,"bb"));}},
"database":{"writable":false,"value":function(name,type){if(System.typeOf(name) === "undefined"){name='123';}
if(!System.is(name,String))System.throwError("type","type of mismatch. must is a String");
if(System.typeOf(type) === "undefined"){type=666;}
if(!System.is(type,Number))System.throwError("type","type of mismatch. must is a Number");
return Main.check("118:18",String,'');}}
}}, false);
})();
delete System.define;
var main=System.getDefinitionByName("Main");
Reflect.construct(main);
})(System.Class,System.Interface,System.Number,System.String,System.JSON,System.Object,System.RegExp,System.Error,System.EvalError,System.RangeError,System.ReferenceError,System.SyntaxError,System.TypeError,System.URIError,System.Function,System.Date,System.Boolean,System.Symbol,System.Iterator,System.Reflect,System.Event,System.EventDispatcher,System.Array,System.Math,System.arguments,System.window,System.document,System.navigator ,System.location,System.Element,System.MouseEvent,System.KeyboardEvent,System.HttpEvent,System.StyleEvent,System.PropertyEvent,System.ElementEvent);
})();