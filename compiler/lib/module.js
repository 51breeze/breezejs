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