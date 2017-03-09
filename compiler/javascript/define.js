/**
 * 本地模块对象
 * @require System,Array,Reflect,Object,Class,Interface;
 */
var modules={};

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
    var items = System.isArray(properties) ? Array.prototype.map.call(properties,function (item) {
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
 * 根据指定的类名获取类的对象
 * @param name
 * @returns {Object}
 */
System.getDefinitionByName = function getDefinitionByName(name) {
    if ($hasOwnProperty.call(modules, name))return $get(modules, name);
    if ($hasOwnProperty.call(system, name))return $get(system, name);
    for (var i in modules)if (i === name)return modules[i];
    throwError('type', '"' + name + '" is not define');
}

/**
 * @private
 * 获取一个类的命名
 * @param classModule
 * @returns {string}
 */
function getFullname(classModule) {
    return $get(classModule, "package") ? $get(classModule, "package") + '.' + $get(classModule, "classname") : $get(classModule, "classname");
}

/**
 * 返回对象的完全限定类名
 * @param value 需要完全限定类名称的对象。
 * 可以将任何类型、对象实例、原始类型和类对象
 * @returns {string}
 */
System.getQualifiedClassName = function getQualifiedClassName(value) {
    switch (System.typeOf(value)) {
        case 'boolean':
            return 'Boolean';
        case 'number' :
            return 'Number';
        case 'string' :
            return 'String';
        case 'regexp' :
            return 'RegExp';
        case 'class'  :
            return getFullname(value);
        case 'interface':
            return getFullname(value);
        case 'function' :
            if (value === System.String)return 'String';
            if (value === System.Boolean)return 'Boolean';
            if (value === System.Number)return 'Number';
            if (value === System.RegExp)return 'RegExp';
            if (value === System.Array)return 'Array';
            if (value === System.Date)return 'Date';
            if (value === System.Object)return 'Object';
            if (value === System.Iterator)return 'Iterator';
            if (value === System.Reflect)return 'Reflect';
            if (value === System.JSON)return 'JSON';
            return 'Function';
        default :
            if (value === system)return 'System';
            if (value === System.Math)return 'Math';
            if (value === System.Reflect)return 'Reflect';
            if (value === System.Iterator)return 'Iterator';
            if (System.isArray(value))return 'Array';
            if (System.isObject(value, true))return 'Object';
            if (value instanceof System.RegExp)return 'RegExp';
            if (value instanceof System.Date)return 'Date';
            if (value instanceof System.String)return 'String';
            if (value instanceof System.Number)return 'Number';
            if (value instanceof System.Boolean)return 'Boolean';
            if (value.constructor instanceof System.Class)return getFullname(value.constructor);
    }
    throwError('reference', 'type does not exist');
}
/**
 * 获取指定实例对象的超类名称
 * @param value
 * @returns {string}
 */
System.getQualifiedSuperclassName =function getQualifiedSuperclassName(value) {
    var classname = System.getQualifiedClassName(value)
    if (classname) {
        var classModule = System.getDefinitionByName(classname);
        var parentModule = $get(classModule, "extends");
        if (parentModule) {
            return $get(parentModule, "fullclassname");
        }
    }
    return null;
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
System.define=define;