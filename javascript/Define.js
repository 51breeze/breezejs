/**
 * 定义模块对象
 * @require System,Internal,Class,Interface,Reflect,Object,JSON,Array,Internal.$get
 * @internal
 */
var modules={};
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
        var construct = descriptions.constructor;
        for (var prop in descriptions )classModule[prop] = descriptions[prop];
        classModule.constructor=null;
        if( typeof construct === "function" )
        {
            classModule.constructor = construct;
            construct.prototype = classModule;
            //开放原型继承
            //classModule.prototype = descriptions.constructor.prototype;
        }
    }
    return classModule;
}
Internal.define = define;

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
            Internal.throwError('syntax','Invalid operator "'+o+'"' );
    }
}

/**
 * 转换错误消息
 * @private
 * @param thisArg
 * @param properties
 * @param classModule
 * @param error
 * @param info
 * @param method
 */
function toMessage(thisArg, properties, classModule, error, info , method )
{
    var items = System.isArray(properties) ? Array.prototype.map.call(properties,function (item) {
        if( typeof item === "string" )return item;
        return System.getQualifiedClassName( item );
    }) : [properties];
    if(thisArg)items.unshift( System.getQualifiedClassName( thisArg ) );
    var msg = (typeof error === "string" ? error : error.message)+'\n';
    if( error instanceof System.Error ){
        msg = error.type + ' '+error.message+'\n';
        if( method === 'new' || method==='delete')msg=method+' '+msg;
    }
    msg+=items.join('.')+'('+classModule.filename + ':' + info + ')\n';
    throw new Error(msg);
}

/**
 * 获取类的全名
 * @private
 * @param classModule
 * @returns {string}
 */
function getFullname(classModule) {
    return classModule.package ? classModule.package + '.' + classModule.classname : classModule.classname;
}

/**
 * 生成操作方法
 * @private
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
                if( issuper===true ){
                    receiver=thisArg;
                    thisArg = $get(classModule,"extends");
                }
                var value=Reflect.get(thisArg, property, receiver, classModule);
                if( arguments[arguments.length-1]==='throw' )throw new System.Error(value);
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
                toMessage(thisArg, property, classModule, error, info,'get');
            }
        }
        case 'set' : return function(info, thisArg, property,value, operator, issuper)
        {
            try{
                if( property == null )return value;
                var receiver=undefined;
                if( issuper===true ){
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
                toMessage(thisArg, property, classModule, error, info,'set');
            }
        }
        case 'delete' : return function(info, thisArg, property)
        {
            try{
                return Reflect.deleteProperty(thisArg, property);
            }catch(error){
                toMessage(thisArg, property, classModule, error, info,'delete');
            }
        }
        case 'new' : return function(info, theClass, argumentsList )
        {
            try{
                if( arguments[arguments.length-1]==='throw' )throw new System.Error( Reflect.construct(theClass, argumentsList) );
                return Reflect.construct(theClass, argumentsList);
            }catch(error){
                toMessage(theClass, [], classModule, error, info,'new');
            }
        }
        case 'apply' : return function(info,thisArg, property, argumentsList,issuper)
        {
            try{
                var receiver=undefined;
                if( issuper === true ){
                    receiver=thisArg;
                    thisArg = $get(classModule,"extends");
                }
                var ret;
                if( property ) {
                    ret= Reflect.apply( Reflect.get(thisArg, property, receiver, classModule), receiver || thisArg, argumentsList );
                }else{
                    ret= Reflect.apply(thisArg, receiver, argumentsList);
                }
                if( arguments[arguments.length-1]==='throw' )throw new System.Error( ret );
                return ret;
            }catch(error){
                toMessage(thisArg, property, classModule, error, info, 'call');
            }
        }
        case 'check' : return function (info, type, value)
        {
            if( value == null && type === System.Object )return value;
            if ( !System.is(value, type) )
            {
                toMessage(null, [], classModule, 'TypeError Specify the type of value do not match. must is "' + getQualifiedClassName(type) + '"', info, 'Type');
            }
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

    if( Object.prototype.hasOwnProperty.call(modules,name) )return modules[name];
    if(Object.prototype.hasOwnProperty.call(System, name))return System[name];
    for (var i in modules)if (i === name)return modules[i];
    Internal.throwError('type', '"' + name + '" is not define');
}

/**
 * 返回对象的完全限定类名
 * @param value 需要完全限定类名称的对象。
 * 可以将任何类型、对象实例、原始类型和类对象
 * @returns {string}
 */
System.getQualifiedClassName = function getQualifiedClassName(value)
{
    if( value==null )return 'Object';
    if( value===System )return 'System';
    if( value===JSON )return 'JSON';
    if( value===Reflect )return 'Reflect';
    if( value instanceof Class )return getFullname(value.constructor.prototype);
    var type = typeof value;
    if( type==='number' || type==='boolean')return System.ucfirst(type);
    var str = (value.constructor || value).toString();
    str = str.substr(0, str.indexOf('(') );
    var name = str.substr(str.lastIndexOf(' ')+1);
    if( !System[name] )Internal.throwError('reference', '"'+name+'" type does not exist');
    return name;
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
        var parentModule = $get(classModule,"extends");
        if (parentModule) {
            return parentModule.fullclassname;
        }
    }
    return null;
}