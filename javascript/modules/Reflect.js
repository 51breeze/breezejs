/**
 * Reflect是一个内置的对象，提供可拦截的JavaScript操作的方法。
 * 方法与代理处理程序相同。反射不是一个函数对象，因此它不可构造。
 * @constructor
 * @require Class,Object,Internal.$get,Internal.$set
 */
var $rConstruct =$Reflect && $Reflect.construct;
var $has = $Object.prototype.hasOwnProperty;
function Reflect(){if(this instanceof Reflect)throwError('Reflect is not constructor.');}
System.Reflect=Reflect;
/**
 * 静态方法 Reflect.apply() 通过指定的参数列表发起对目标(target)函数的调用
 * @param theClass
 * @param thisArgument
 * @param argumentsList
 * @returns {*}
 */
Reflect.apply=function apply( theClass, thisArgument, argumentsList)
{
    if( theClass instanceof Class && theClass.constructor.prototype === theClass )theClass=$get(theClass,"constructor");
    if( System.typeOf(theClass) !== "function" )Internal.throwError('type','is not function');
    if( theClass===thisArgument )thisArgument=undefined;
    return argumentsList && System.isArray(argumentsList) ? System.Function.prototype.apply.call( theClass, thisArgument, argumentsList ) :
        System.Function.prototype.call.call( theClass, thisArgument, argumentsList );
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
    if( theClass instanceof Class && theClass.constructor.prototype === theClass)
    {
        if( $get(theClass,"isAbstract") )Internal.throwError('type','Abstract class cannot be instantiated');
        theClass = $get(theClass,"constructor");
        if( typeof theClass !== "function" )Internal.throwError('type','is not constructor');

    }else if( typeof theClass !== "function" )
    {
        console.log( theClass )
        Internal.throwError('type','is not function');
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
}

/**
 * 静态方法 Reflect.deleteProperty() 允许用于删除属性。它很像 delete operator ，但它是一个函数。
 * @param target
 * @param propertyKey
 * @returns {boolean}
 */
Reflect.deleteProperty=function deleteProperty(target, propertyKey)
{
    if( !target || propertyKey==null )return false;
    if( target instanceof Class )
    {
        var objClass = target.constructor.prototype;
        if( objClass === target )return false;
        if( !$get(objClass,"dynamic") )return false;
        var token = $get(objClass,"token");
        var obj = $get(target, token );
        if( obj && $has.call(obj,propertyKey) )
        {
            var protoDesc = $get(objClass,"proto");
            //只有动态添加的属性或者是可配置的属性才可以删除
            if( $has.call(protoDesc,propertyKey) )
            {
                var desc = $get(protoDesc,propertyKey);
                if( $get(desc,"configurable") === false || $get(desc,"id") !=='dynamic' )return false;
                delete protoDesc[propertyKey];
            }
            delete obj[propertyKey];
            return true;
        }
        return false;
    }
    delete target[propertyKey];
    return !$has.call(target,propertyKey);
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
    if( target instanceof Class )
    {
        var objClass = target.constructor.prototype;
        var isstatic = objClass === target;
        do {
            var desc= isstatic ? $get(objClass,"static") :  $get(objClass,"proto");
            var token = $get(objClass,"token");
            //没有属性描述符默认为public
            if( !$has.call(desc, propertyKey) )
            {
                desc=null;
                //只有实例对象才有实例属性
                if( !isstatic && $has.call( $get(target,token),propertyKey) )
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
    if( target == null )Internal.throwError('type','target object is null');
    if( target instanceof Class )
    {
        var objClass = target.constructor.prototype;
        var isstatic = objClass === target;

        //如果是获取超类中的属性或者方法
        if( isstatic && (receiver && receiver instanceof Class && receiver.constructor.prototype !== receiver) )isstatic=false;
        do {
            var desc= isstatic ? $get(objClass,"static") :  $get(objClass,"proto");
            var token = $get(objClass,'token');
            var refObj = $get(target, token);
            var has = $has.call( desc, propertyKey);
            var hasProp = refObj && $has.call(refObj, propertyKey);
            if( token===propertyKey && !hasProp)return undefined;

            //没有属性描述符默认为public  只有非静态的才有实例属性
            if( !isstatic && !has && hasProp )
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
                       if (classScope)Internal.throwError('reference', '"' + propertyKey + '" inaccessible.');
                       return undefined;
                   }
                   //访问器
                   if (desc.get) {
                       return desc.get.call(receiver || target);
                   } else {
                       if (isstatic)return $get(desc, "value");
                       return hasProp ? $get(refObj, propertyKey) : $get(desc, "value");
                   }
               }
            }
            objClass = $get(objClass,"extends");
            if( !(objClass instanceof Class) )
            {
                if( $has.call(target, propertyKey) )
                {
                    return $get(target, propertyKey, receiver );
                }

                //内置对象以__开头的为私有属性外部不可访问
                if( propertyKey[0]==='_' && propertyKey[1]==='_')return undefined;
                return $get((objClass||Object).prototype,propertyKey,receiver);
            }

        }while ( objClass )
        return undefined;
    }
    //非对象的引用
    if( target == null )Internal.throwError('reference', 'non-object');
    //内置对象以__开头的为私有属性外部不可访问
    if( propertyKey[0]==='_' && propertyKey[1]==='_')return undefined;
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
    if( target==null )Internal.throwError('reference','Reference object is '+(target));
    if( target instanceof Class )
    {
        var objClass = target.constructor.prototype;
        var isstatic = objClass === target;
        //如果是获取超类中的属性或者方法
        if( isstatic && (receiver && receiver instanceof Class && receiver.constructor.prototype !== receiver ) )isstatic=false;
        do{
            var desc= isstatic ? $get(objClass,"static") :  $get(objClass,"proto");
            var token = $get(objClass,"token");
            var isdynamic = !!$get(objClass,"dynamic");
            desc = $has.call(desc, propertyKey) ? $get(desc,propertyKey) : null;
            if( desc && (classScope === objClass || $get(desc,"qualifier") !== 'private') )
            {
                //是否有访问的权限
                if( !checkPrivilege(desc, objClass, classScope) )
                {
                    if(classScope)Internal.throwError('reference', '"' + propertyKey + '" inaccessible.');
                    return false;
                }

                //是否为一个访问器
                if( $has.call(desc,"set") )
                {
                    desc.set.call(receiver || target, value);
                    return true
                }

                //不可写操作
                if (desc.writable === false)Internal.throwError('reference', '"' + propertyKey + '" is not writable');
                isstatic ? $set(desc,"value", value) : $set( $get( target, token ), propertyKey ,value);
                return true;
            }

            //如果实例属性
            if( !isstatic )
            {
                //动态对象可以动态添加
                if( isdynamic === true )
                {
                    if( propertyKey === token )Internal.throwError('syntax', '"' + propertyKey + '" is not configurable.');
                    var parent = objClass;
                    do{
                        parent = $get(parent,"extends");
                        if( !(parent instanceof Class) && $has.call( (parent || Object).prototype, propertyKey) )
                        {
                            Internal.throwError('reference', '"' + propertyKey + '" is not wirtable.');
                        }
                    }while ( parent );
                    $set(target,propertyKey,value);
                    return true;
                }
                //如果是公开的属性
                var refObj = $get(target,token);
                if( refObj && $has.call( refObj ,propertyKey ) )
                {
                    $set( refObj, propertyKey, value );
                    return true;
                }
            }
            if( isdynamic )return false;

        }while( ( objClass=$get(objClass,"extends") ) && objClass instanceof Class );
        return false;
    }

    //非对象的引用
    if( target == null )
    {
        Internal.throwError('reference', 'non-object');
    }

    // "__"开头并且以"__"结尾的都为私有属性
    var p = propertyKey+"";
    if( p.substr(0,2) ==='__' && p.substr(-2) ==='__' )
    {
        Internal.throwError('reference', '"' + propertyKey + '" inaccessible.');
    }

    //原型链上的属性或者函数上的属性不可设置
    if( typeof target === "function" || Object.hasProtoInherit(target,propertyKey) )
    {
        Internal.throwError('reference', '"' + propertyKey + '" is not wirtable.');
    }
    return $set(target,propertyKey,value,receiver);
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