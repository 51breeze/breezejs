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
                result = description.type === Object ? true : value instanceof description.type;
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
function throwError(type,msg)
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

/**
 * 获取成员的描述信息
 * @param thisArg
 * @param propNames
 * @param classModule
 * @returns {*}
 */
function getPropertyDescription(thisArg, propName, classModule, propname )
{
    var isStatic = thisArg instanceof Class;

    //如果不是类对象
    if( !isStatic && !(thisArg.constructor instanceof Class) )
    {
        return null;
    }

    var referenceModule = isStatic ? thisArg : thisArg.constructor;
    var desc = isStatic ? referenceModule.static[propName] : referenceModule.proto[propName];

    //如果本类中没有定义则在在扩展的类中依次向上查找。
    if( !desc && referenceModule.extends )
    {
        var  parentModule = referenceModule.extends;
        while ( parentModule )
        {
            var description =  isStatic ? parentModule.static : parentModule.proto;

            //继承的属性，私有的路过.
            if( description[propName] && description[propName].qualifier !== 'private' )
            {
                desc = description[propName];
                referenceModule= parentModule;
                break;
            }
            parentModule = parentModule.extends;
        }
    }

    //如果没有在原型中定义
    if( !desc && typeof thisArg[propName] === "undefined" )throwError('reference', '"'+propname+'" is not defined' );

    //不是public限定符则检查是否可访问
    if( desc && desc.qualifier && desc.qualifier !== 'public' )
    {
        //不是本类中的成员调用（本类中的所有成员可以相互调用）
        if( referenceModule !== classModule )
        {
            var is= false;
            if( desc.qualifier === 'internal' )
            {
                is = referenceModule.package === classModule.package;

            }else if( desc.qualifier === 'protected' )
            {
                is = thisArg instanceof referenceModule;
            }
            if( !is )throwError('reference', '"' + propname + '" inaccessible.');
        }
    }
    return desc;
}

/**
 * 获取引用的值
 * @param propName
 * @param thisArg
 * @param classModule
 * @param propname
 * @returns {*}
 */
function getReferenceValueByPropName(propName, thisArg, classModule, propname )
{
    var desc = getPropertyDescription(thisArg, propName, classModule, propname);
    if( desc )
    {
        //如果引用的属性是一个存储器
        if (desc.id === 'function' && typeof desc.value === "object")
        {
            if (typeof desc.value.get !== 'function')throw new TypeError('"' + propname + '" getter does not exist');
            return desc.value.get(thisArg);

        } else if (desc.id === 'var' || desc.id === 'const' )
        {
            var m = thisArg instanceof Class ? thisArg : thisArg.constructor;
            return m===thisArg ? desc.value : thisArg[ m.token ];
        }
        return desc.value;
    }
    return thisArg[ propName ];
}

/**
 * 生成一个调用函数的方法
 * @param classModule
 * @returns {Function}
 */
function makeCall (classModule, thisArg, properties, args, iscall )
{
    var desc;
    var value;
    var strName = properties;
    var lastProp = properties;
    var refObj = thisArg;
    if( typeof properties !== "string" )
    {
        if( typeof properties[0] === "object" )
        {
            refObj =  properties.shift();
        }

        strName = properties.join('.');
        lastProp = properties.pop();
        if (properties.length > 0)
        {
            var i = 0;
            //获取实例引用
            while (i < properties.length && refObj )
            {
                refObj = getReferenceValueByPropName( properties[i++], refObj, classModule, strName);
                thisArg = refObj;
            }
        }
    }

    if( !refObj )throwError('reference', '"'+strName+( refObj===null ? '" is null' : '" is not defined') );
    if( lastProp )
    {
        desc = getPropertyDescription(refObj, lastProp, classModule, propname);
        value=  desc ? desc.value : thisArg[ propName ];

    }else
    {
        value = refObj;
    }

    //调用方法
    if ( iscall )
    {
        if( value instanceof Class )value = value.constructor;
        if (typeof value !== 'function')throwError('type', '"' + strName + '" is not function');
        return value.apply(thisArg, args);
    }

    //是否需要设置值
    var isset = typeof args !== "undefined";

    //如是是对全局类的属性操作
    if (!desc)
    {
        if (!isset)return value;
        if ( !Object.prototype.hasOwnProperty.call(refObj, lastProp) )
            throwError('reference', '"' + strName + '" property does not exist');
        try {
            refObj[lastProp] = args;
            if (refObj[lastProp] !== args)throwError('Cannot be set');
        } catch (e) {
            throwError('reference', '"' + strName.join('.') + '" property cannot be set');
        }
        return args;
    }

    //是否为一个访问器
    var isaccessor = desc && desc.id === 'function' && typeof value === 'object';
    if (isaccessor)
    {
        value = isset ? value.set : value.get;
        if (typeof value !== 'function')throw new throwError('reference', '"' + strName + '" Accessor ' + (isset ? 'setter' : 'getter') + ' does not exist');
    }
    //对属性的引用
    else if ( desc.id === 'var' || desc.id === 'const' )
    {
        var m = refObj instanceof Class ? refObj : refObj.constructor;

        //静态属性
        if( m===refObj )
        {
            value = desc;
            lastProp = 'value';
        }else
        {
            value = refObj[m.token];
        }
    }

    //对属性引用进行赋值操作
    if (isset)
    {
        if( desc.id !== 'var' && !isaccessor )
        {
            throwError('type', '"' + strName + ( desc.id === 'const' ? '" cannot be alter of constant' : '" cannot modify the class function' ));
        }

        //检查属性的类型是否匹配
        if ( !checkValueType(desc, args) )
        {
            throwError('type', '"' + strName + '" can only be a (' + getQualifiedClassName(desc.type) + ')');
        }

        //对属性引用进行赋值操作
        isaccessor ? value.call(thisArg, args) : ( value[lastProp] = args );
        return args;
    }

    //获取属性引用的值
    return isaccessor ? value.call(thisArg) : value[lastProp];
}
