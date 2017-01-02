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

/**
 * 获取成员的描述信息
 * @param thisArg
 * @param propNames
 * @param classModule
 * @returns {*}
 */
function getPropertyDescription(thisArg, propName, isStatic, classModule, propname )
{
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
    var strName = properties;
    var lastProp = properties;
    var refObj = thisArg;
    var value = refObj;
    var isset = typeof args !== "undefined" && !iscall;
    var operator;
    var left;

    if( properties && typeof properties !== "string" )
    {
        if( isMathAssignOperator( properties[0] ) )left = properties.shift();
        if( typeof properties[0] === "object" )refObj = value = properties.shift();
        strName = properties.join('.');
        lastProp = properties.pop();

        //有指定运算符
        if( isset && isMathAssignOperator( lastProp )  )
        {
            operator = lastProp;
            if( operator==='=')operator='';
            lastProp = properties.pop();
        }

        if( properties.length > 0 )
        {
            var i = 0;

            //获取实例引用
            while (i < properties.length && refObj )
            {
                refObj = thisArg = makeCall( classModule, refObj, properties[i++], undefined , false);
                if( !refObj )throwError('reference', '"'+strName+( refObj===null ? '" property of null' : '" is not defined') );
            }
        }
    }

    var writable=false;
    var privatize;
    value = refObj;
    if( lastProp && refObj )
    {
        value = refObj[ lastProp ];
        var isStatic = refObj instanceof Class;

        //如果是类对象
        if( isStatic || refObj instanceof Object )
        {
            desc=getPropertyDescription(refObj, lastProp , isStatic, classModule, strName );
            if( desc && desc.id === 'var' || desc.id === 'const' )
            {
                writable = desc.id === 'var';
                if( isStatic )lastProp='value';
                if( !isStatic )privatize = desc.token;
            }
        }
    }

    //调用方法
    if ( iscall )
    {
        if( desc )value= desc.value;
        if( value instanceof Class )value = value.constructor;
        if (typeof value !== 'function')throwError('reference', '"' + strName + '" is not function');
        return value.apply(thisArg, args);
    }

    if( isset )
    {
        if( operator )args = mathOperator( getValue( thisArg, refObj, desc, lastProp ,privatize, strName  ), operator, args);
        return setValue( thisArg, refObj, desc, lastProp ,privatize, args, strName, writable );
    }
    var val = getValue( thisArg, refObj, desc, lastProp ,privatize, strName  );
    if( left || operator )
    {
        val = left ? mathOperator( left, val) :  mathOperator( null, val, operator );
        setValue( thisArg, refObj, desc, lastProp ,privatize, val, strName, writable );
    }
    return val;
}

function setValue(thisArg, refObj, desc, prop, privatize, value, strName, writable)
{
    if( !prop )return value;
    if ( !desc )
    {
        if ( !Object.prototype.hasOwnProperty.call(refObj, prop) )throwError('reference', '"' + strName + '" property does not exist');
        try {
            refObj[prop] = value;
            if (refObj[prop] !== value)throwError('Cannot be set');
        } catch (e) {
            throwError('reference', '"' + strName + '" property cannot be set');
        }

    }else
    {
        if( !writable )throwError('type', '"' + strName +'" cannot be alter of constant');

        //检查属性的类型是否匹配
        if ( !checkValueType(desc, value) )
        {
            throwError('type', '"' + strName + '" can only be a (' + getQualifiedClassName(desc.type) + ')');
        }

        if( typeof desc.id==='function')
        {
            if (typeof desc.value.set !== 'function')throw new throwError('reference', '"' + strName + '" Accessor setter does not exist');
            desc.value.set.call(thisArg, value);

        }else
        {
            if( privatize )desc=refObj[ privatize ];
            desc[prop] = value;
        }
    }
    return value;
}

function getValue(thisArg, refObj, desc, prop, privatize, strName)
{
    if( !prop )return refObj;
    var value;

    //如是是对全局类的属性操作
    if ( !desc )
    {
        if ( !Object.prototype.hasOwnProperty.call(refObj, prop) )throwError('reference', '"' + strName + '" property does not exist');
        value =  refObj[prop];

    }else
    {
        if( typeof desc.id==='function')
        {
            if (typeof desc.value.get !== 'function')throw new throwError('reference', '"' + strName + '" Accessor getter does not exist');
            value = desc.value.get.call(thisArg);

        }else
        {
            if( privatize )desc=refObj[ privatize ];
            value = desc[prop];
        }
    }
    return value;
}


