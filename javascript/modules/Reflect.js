/**
 * Reflect是一个内置的对象，提供可拦截的JavaScript操作的方法。
 * 方法与代理处理程序相同。反射不是一个函数对象，因此它不可构造。
 * @constructor
 * @require Class,Object,Internal.$get,Internal.$set,Error,TypeError,ReferenceError,SyntaxError
 */
var $rConstruct = $Reflect && $Reflect.construct;
var $has = $Object.prototype.hasOwnProperty;
var $apply = $Function.prototype.apply;

function Reflect(){ if(this instanceof Reflect)throw new SyntaxError('Reflect is not constructor.'); }
System.Reflect=Reflect;
/**
 * 静态方法 Reflect.apply() 通过指定的参数列表发起对目标(target)函数的调用
 * @param theClass
 * @param thisArgument
 * @param argumentsList
 * @returns {*}
 */
Reflect.apply=function apply( theClass, thisArgument, argumentsList )
{
    if( theClass instanceof Class )
    {
        theClass = theClass.constructor;
    }
    if( System.typeOf(theClass) !== "function" )
    {
        throw new TypeError('is not function');
    }
    if( theClass===thisArgument )thisArgument=undefined;
    if( argumentsList && System.isArray(argumentsList) )
    {
        return $apply.call( theClass, thisArgument, argumentsList );
    }else
    {
        return thisArgument ? theClass.call(thisArgument, argumentsList ) : theClass(argumentsList);
    }
};

/**
 * Reflect.construct() 方法的行为有点像 new 操作符 构造函数 ， 相当于运行 new target(...args).
 * @param target
 * @param argumentsList
 * @param newTarget
 * @returns {*}
 */
Reflect.construct=function construct(theClass, args, newTarget )
{
    if( theClass === newTarget )newTarget=undefined;
    if( theClass instanceof Class )
    {
        if( theClass.abstract )
        {
            throw new TypeError('Abstract class cannot be instantiated');
        }
        theClass = theClass.constructor;
        if( typeof theClass !== "function" )
        {
            throw new TypeError('is not constructor');
        }

    }else if( typeof theClass !== "function" )
    {
        throw new TypeError('is not function');
    }
    args = System.isArray(args) ? args : [];
    var instanceObj;
    if( $rConstruct )
    {
        instanceObj = newTarget ? $rConstruct(theClass, args, newTarget) : $rConstruct(theClass, args);
    }else
    {
        switch ( args.length )
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
};

/**
 * 静态方法 Reflect.deleteProperty() 允许用于删除属性。它很像 delete operator ，但它是一个函数。
 * @param target
 * @param propertyKey
 * @returns {boolean}
 */
Reflect.deleteProperty=function deleteProperty(target, propertyKey)
{
    if( !target || propertyKey==null )return false;
    if( target instanceof Class )return false;
    if( target.constructor instanceof Class )
    {
        var objClass = target.constructor;
        if( !objClass.dynamic )return false;
        var token = objClass.token;
        var obj = target[token];
        if( obj && $has.call(obj,propertyKey) )
        {
            var protoDesc = objClass.proto;

            //只有动态添加的属性或者是可配置的属性才可以删除
            if( $has.call(protoDesc,propertyKey) )
            {
                var desc = protoDesc[propertyKey];
                if( desc.configurable === false || desc.id !=='dynamic' )return false;
                delete protoDesc[propertyKey];
            }
            delete obj[propertyKey];
            return true;
        }
        return false;
    }
    delete target[propertyKey];
    return !$has.call(target,propertyKey);
};

/**
 * 静态方法 Reflect.has() 作用与 in 操作符 相同。
 * @param target
 * @param propertyKey
 * @returns {boolean}
 */
Reflect.has=function has(target, propertyKey)
{
    if( propertyKey==null || target == null )return false;
    var objClass = target.constructor;
    var isstatic = target instanceof Class;
    if( isstatic || objClass instanceof Class )
    {
        if( isstatic )objClass = target;
        do {
            var desc= isstatic ? objClass["static"] : objClass.proto;
            var token = objClass.token;
            //没有属性描述符默认为public
            if( !$has.call(desc, propertyKey) )
            {
                desc=null;
                //只有实例对象才有实例属性
                if( !isstatic && $has.call(target[token],propertyKey) )
                {
                    return true;
                }
            }
            if( desc )
            {
                var qualifier = desc[propertyKey].qualifier;
                return !qualifier || qualifier === 'public';
            }
            objClass = objClass["extends"];
            if( !(objClass instanceof Class) )
            {
                return propertyKey in (objClass||Object).prototype;
            }
        }while ( objClass );
        return false;
    }
    return propertyKey in target;
};

/**
 * 获取目标公开的属性值
 * @param target
 * @param propertyKey
 * @returns {*}
 */
Reflect.get=function(target, propertyKey, receiver , classScope )
{
    if( propertyKey==null )return target;
    if( target == null )
    {
        throw new ReferenceError('"Reflect.get" target object is null or undfined');
    }

    //动态属性
    if( !System.isNaN(propertyKey) )
    {
        return $get(target, propertyKey, receiver );
    }

    var objClass = target.constructor;
    var isstatic = target instanceof Class;
    if( isstatic || objClass instanceof Class )
    {
        if( isstatic ) objClass = target;

        //表示获取一个类中的属性或者方法（静态属性或者静态方法）
        isstatic = (!receiver || receiver===target) && isstatic;

        while( objClass )
        {
            var desc= isstatic ? objClass["static"] : objClass.proto;
            var token = objClass.token;
            //每个类的实例属性
            var refObj = target[token];
            //是否有成员类的描述信息, 默认public属性没有
            var has = desc && $has.call( desc, propertyKey);
            //是否有实例属性
            var hasProp = refObj && $has.call(refObj, propertyKey);
            //没有属性描述符默认为public  只有非静态的才有实例属性
            if( !isstatic && !has && hasProp )
            {
                return refObj[propertyKey];
            }

            if( desc && has )
            {
               desc = desc[propertyKey];
               if( ( desc.qualifier !== 'private' || classScope === objClass ) )
               {
                   //是否有访问的权限
                   if (!checkPrivilege(desc, objClass, classScope )  )
                   {
                       if (classScope)
                       {
                           throw new ReferenceError('"' + propertyKey + '" inaccessible');
                       }
                       return undefined;
                   }
                   //访问器
                   if( desc.get )
                   {
                       return desc.get.call(receiver || target);

                   }else if( !desc.set )
                   {
                       if ( isstatic )return desc.value;
                       return hasProp ? refObj[propertyKey] : desc.value;
                   }
               }
            }
            objClass = objClass["extends"];
            if( !(objClass instanceof Class) )
            {
                //默认继承Object
                if( !objClass )objClass=Object;
                receiver = target;
                target = objClass.prototype;
                objClass=null;
                break;
            }
        }

    }else if( System.typeOf(target) === "function" )
    {
        target = receiver && receiver !== target ? target.prototype : target;
    }

    //内置对象以__开头的为私有属性外部不可访问
    if( propertyKey.charAt(0)==='_' && propertyKey.charAt(1)==='_' && propertyKey.slice(-2) ==='__' )return undefined;
    return $get(target, propertyKey, receiver );
};

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
    if( target == null ){
        throw new ReferenceError('"Reflect.set" target object is null or undfined');
    }
    var objClass = target.constructor;
    var isstatic = target instanceof Class;
    if( isstatic || objClass instanceof Class )
    {
        if( isstatic )objClass = target;
       isstatic = (!receiver || receiver===target) && objClass === target;

        while(  objClass )
        {
            var desc= isstatic ? objClass["static"] : objClass.proto;
            var token = objClass.token;
            var isdynamic = !!objClass.dynamic;

            //实例属性
            var refObj = target[token];
            desc = $has.call(desc, propertyKey) ? desc[propertyKey] : null;
            if( desc && (classScope === objClass || desc.qualifier !== 'private') )
            {
                //是否有访问的权限
                if( !checkPrivilege(desc, objClass, classScope) )
                {
                    if(classScope)
                    {
                        throw new ReferenceError( '"' + propertyKey + '" inaccessible.');
                    }
                    return false;
                }

                //是否为一个访问器
                if( $has.call(desc,"set") )
                {
                    desc.set.call(receiver || target, value);
                    return true

                }else if( !$has.call(desc,"get") )
                {
                    //不可写操作
                    if (desc.writable === false)
                    {
                        throw new ReferenceError('"' + propertyKey + '" is not writable');
                    }
                    if (isstatic)
                    {
                        desc["value"]=value;
                        return true;
                    }
                }
            }

            //默认公开的实例属性
            if( !isstatic && refObj && $has.call( refObj ,propertyKey ) )
            {
                refObj[propertyKey]=value;
                return true;
            }

            //动态对象可以动态添加属性
            if( isdynamic === true )
            {
                if( !isstatic )
                {
                    if( propertyKey === token || propertyKey==='constructor')
                    {
                        throw new SyntaxError('"' + propertyKey + '" is not configurable.');
                    }
                    target[propertyKey]=value;
                    return true;
                }
                return false;
            }
            objClass=objClass["extends"];
            if( !(objClass instanceof Class) )
            {
                if( !objClass )objClass=Object;
                receiver = target;
                target = objClass.prototype;
                objClass = null;
            }
        }
    }

    //内置对象以__开头的为私有属性外部不可访问
    if( propertyKey[0]==='_' && propertyKey[1]==='_' )
    {
        throw new ReferenceError('"' + propertyKey + '" inaccessible.');
    }

    //原型链上的属性或者函数上的属性不可设置
    if( typeof target === "function" || typeof target[propertyKey] === "function" )
    {
        throw new ReferenceError('"' + propertyKey + '" is not wirtable.');
    }
    return $set(target,propertyKey,value,receiver);
};

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
        var qualifier = descriptor.qualifier;

        //不是本类中的成员调用（本类中的所有成员可以相互调用）
        if( (qualifier && qualifier !=='public') && referenceModule !== classModule )
        {
            if( qualifier === 'internal' )
            {
                return referenceModule["package"] === classModule["package"];

            }else if( qualifier === 'protected' )
            {
               return checkInheritOf( referenceModule, classModule ) || checkInheritOf( classModule, referenceModule );
            }
            return false;
        }
    }
    return true;
}

function checkInheritOf( child, parent )
{
    while ( child = child["extends"] )
    {
        if( child===parent )
        {
            return true;
        }
    }
    return false;
}