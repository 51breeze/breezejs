/**
 * 检查值的类型是否和声明时的类型一致
 * @param description
 * @param value
 */
function checkValueType(description,value )
{
    if( description.type !== '*' )
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
        return result;
    }
    return true;
}

/**
 * 抛出错误信息
 * @param type
 * @param msg
 */
function throwError(type, msg, error, classModule )
{
    if( classModule )
    {
        msg = classModule.filename+':'+msg+'\n'
        if( error )msg += error.message+'\n';
    }

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

function mathOperator( a, o, b)
{
    if( a==='--' )return --o;
    if( a==='++' )return ++o;
    if( b==='--')return o--;
    if( b==='++' )return o++;
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
 * 生成一个调用函数的方法
 * @param classModule
 * @returns {Function}
 */
function __call__( classModule, thisArg, properties, args, iscall)
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
            isset=true;
            if(operator==='=')operator='';
            lastProp = properties.pop();
        }
        //如果有链式操作则获取引用
        if( properties.length > 0 )
        {
            var i = 0;
            //获取实例引用
            while( i < properties.length && refObj )
            {
                refObj = thisArg = __call__( classModule, thisArg, properties[i++], undefined , false);
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
        if( !writable )throwError('type', '"' + strName +'" cannot be alter of constant');
        if( operator )args = mathOperator( getValue( thisArg, refObj, desc, lastProp ,strName  ), operator, args);
        return setValue( thisArg, refObj, desc, lastProp ,args, strName, writable );
    }

    //获取原始值
    if( desc && (desc.id==='var' || desc.id==='const' || typeof desc.value === "object" ) )
    {
        value = getValue( thisArg, refObj, desc, lastProp ,strName );
    }else
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
    var val= value;
    //如果有指定运算符
    if( left || operator )
    {
        //前置运算(先返回运算后的结果再赋值)
        if(left)
        {
            val = value = mathOperator( left, value)
        }
        //后置运算(先赋值后再返回运算后的结果)
        else
        {
            value=mathOperator( null, value, operator );
        }
        //将运算后的结果保存
        setValue( thisArg, refObj, desc, lastProp , value, strName, writable );
    }
    return val;
}

function setValue(thisArg, refObj, desc, prop, value, strName)
{
    if ( desc )
    {
        //检查属性的类型是否匹配
        if ( !checkValueType(desc, value) )throwError('type', '"' + strName + '" type can only be a (' + System.getQualifiedClassName(desc.type) + ')');
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
            return __call__(classModule, thisArg, properties, value, flag);
        }catch(error){
            throwError("reference",info ,error, classModule );
        }
    }
}