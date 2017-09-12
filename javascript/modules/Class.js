/**
 * 类对象构造器
 * @returns {Class}
 * @constructor
 * @require System,Object,ReferenceError;
 */
function Class() {
}
Class.valueOf=Class.toString=function () {return '[object Class]'};
Class.prototype = Object.create( Object.prototype );
Class.prototype.constructor = Class;
Class.prototype.valueOf=function valueOf()
{
    if(this==null)return this===null ? 'null' : 'undefined';
    if( this instanceof Class )
    {
        return '[class '+this.__T__.classname+']';
    }
    return Object.prototype.valueOf.call( this );
};

/**
 * 返回指定对象的字符串表示形式。
 * @returns {String}
 */
Class.prototype.toString=function toString()
{
    if(this==null)return this===null ? 'null' : 'undefined';
    if( this instanceof Class )
    {
        return '[object Class]';
    }
    return Object.prototype.toString.call( this );
};

var has = $Object.prototype.hasOwnProperty;
function getProtoDescByNs(name, proto, ns)
{
    var desc;
    for(var i=0; i< ns.length; i++)
    {
        var n = ns[i].valueOf();
        if( has.call(proto, n ) &&  has.call( proto[n].value, name) )
        {
            if( desc )
            {
                throw new System.ReferenceError('"'+name+'" inaccessible');
            }
            desc = proto[ n ];
        }
    }
    return desc;
}

function description(scope, refObject, name , thisArgument , ns)
{
    var objClass = refObject.constructor;
    //表示获取一个类中的属性或者方法（静态属性或者静态方法）
    var isstatic = refObject instanceof Class;
    var desc = null;
    if( isstatic || objClass instanceof Class )
    {
        if( isstatic ) objClass = refObject;
        //是否为调用超类中的方法
        isstatic =  isstatic && thisArgument===refObject;
        var proto = isstatic ? objClass.__T__.method : objClass.__T__.proto;

        //默认命名空间
        if( has.call(proto,name) && System.Array.prototype.indexOf.call(scope.__T__.uri, proto[ name ].ns ) >=0 )
        {
            desc = proto[ name ];
        }

        //自定义命名空间
        if( ns && ns.length > 0 )
        {
            var descNs = getProtoDescByNs(name,proto,ns);
            if( descNs && has.call(descNs.value, name) )
            {
                if( desc )
                {
                    throw new ReferenceError('"'+name+'" inaccessible');
                }
                desc = descNs.value[ name ];
            }
        }
        return desc;
    }
    return null;
}

Class.prototype.__call__=function(target, name, argumentsList, receiver, ns)
{
    if( target && name != null )
    {
        receiver = receiver || target;
        target = this.__get__(target,name,receiver,ns);
    }
    return System.Reflect.apply(target, receiver, argumentsList);
};

Class.prototype.__get__=function(target, propertyKey, receiver, ns)
{
    if( propertyKey==null )return target;
    if( target == null ){
        throw new ReferenceError('reference target is null or undefined');
    }
    var refType = typeof target;

    //只对一个对象进行引用操作( number or boolean 不可以)
    if( !(refType === 'object' || refType === 'function' || 'string' || 'regexp') )
    {
        throw new ReferenceError('reference target be not object');
    }

    receiver = receiver || target;

    //是否静态原型
    var isstatic = receiver instanceof Class;

    //函数的属性或者方法
    if( System.isFunction(target) )
    {
        return has.call(target,propertyKey) ? target[propertyKey] : target.prototype[propertyKey] || Object.prototype[propertyKey];
    }

    var desc = description(this,target,propertyKey,receiver,ns);
    if( !desc )
    {
        //如果是一个静态属性的引用报错
        if( isstatic )
        {
            throw new ReferenceError( '"'+propertyKey+'" is not exist');
        }
        return Object.prototype[propertyKey] || target[propertyKey];
    }

    //一个访问器
    var getter = desc.value && desc.value.get ? desc.value.get : desc.get;
    if( getter )
    {
        return getter.call( isstatic ? undefined : receiver);
    }

    //是否为一个实例属性
    if( !isstatic )
    {
        var _private = this.__T__.uri[0];
        if( has.call(receiver,_private) && has.call(receiver[_private],propertyKey) )
        {
            return receiver[_private][propertyKey];
        }
    }
    //实例函数 或者 静态属性 或者 静态方法
    return desc.value || desc;
};

Class.prototype.__set__=function (target, propertyKey, value, receiver, ns)
{
    if( propertyKey==null )return target;
    if( target == null )
    {
        throw new ReferenceError('reference target is null or undefined');
    }

    var refType = typeof target;
    if( !(refType === 'object' || refType === 'function') )
    {
        throw new ReferenceError('reference target be not object');
    }

    receiver = receiver || target;
    var desc = description(this,target,propertyKey,receiver,ns);
    var isstatic = receiver instanceof Class;
    if( !desc )
    {
        if( isstatic )
        {
            throw new ReferenceError( '"'+propertyKey+'" is not exist');
        }

        var objClass = receiver.constructor;
        var isClass =  objClass instanceof Class;

        //设置一个动态属性
        if( isClass && objClass.__T__.dynamic ===true )
        {
            return receiver[propertyKey] = value;
        }

        //如果是一个类的引用
        if( isClass )
        {
            throw new ReferenceError( '"'+propertyKey+'" is not exist');
        }

        //对象属性
        return receiver[propertyKey] = value;
    }

    //一个访问器
    var setter = desc.value && desc.value.set ? desc.value.set : desc.set;
    if( setter )
    {
        setter.call( isstatic ? undefined : receiver, value );
        return value;
    }

    //如果在类中没有定义此属性或者是一个常量
    if( !has.call(desc, "value") || desc.writable !==true )
    {
        throw new ReferenceError( '"'+propertyKey+'" is not writable');
    }

    //静态属性
    if( isstatic )
    {
        return desc.value = value;
    }

    var _private = this.__T__.uri[0];
    if (has.call(receiver, _private) && has.call(receiver[_private], propertyKey))
    {
        return receiver[_private][propertyKey] = value;
    }
    throw new ReferenceError( '"'+propertyKey+'" is not exist');
};

Class.prototype.__has__=function (target,name,ns)
{
    var desc = description(this,target,name,undefined,ns);
    if( desc )return !!desc;
    return !!target[name];
};

Class.prototype.__unset__=function (refObject,name,thisArgument,ns)
{
    thisArgument = thisArgument || refObject;
    var objClass = thisArgument.constructor;
    var isstatic = thisArgument instanceof Class;
    if( name==null || isstatic )
    {
        return false;
    }
    if( objClass instanceof Class )
    {
        if( objClass.__T__.dynamic !== true )return false;
        var proto = objClass.__T__.proto;
        if( has.call(proto, name) )
        {
            return false;
        }
        //自定义命名空间
        if( ns && ns.length > 0 )
        {
            var descNs = getProtoDescByNs(name,proto,ns);
            if( descNs && has.call(descNs.value, name) )
            {
                return false;
            }
        }
    }
    delete thisArgument[name];
};

Class.prototype.__incre__=function ( refObject, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(refObject, name, undefined, ns );
    var ret = val+1;
    this.__set__(refObject, name, ret , undefined, ns );
    return flag ? val : ret;
};

Class.prototype.__decre__=function ( refObject, name, flag , ns )
{
    flag = flag !== false;
    var val = this.__get__(refObject, name, undefined, ns );
    var ret = val-1;
    this.__set__(refObject, name, ret , undefined, ns );
    return flag ? val : ret;
};

Class.prototype.__check__=function(type, value)
{
    if( value == null || type === System.Object )return value;
    if ( type && !System.is(value, type) )
    {
        throw new TypeError( 'Specify the type of value do not match. must is "' + System.getQualifiedClassName(type)+'"' )
    }
    return value;
};
System.Class = Class;

