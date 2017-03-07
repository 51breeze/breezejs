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
    if( typeof func !== "function" )throwError('type','is not function');
    if( func===thisArgument )thisArgument=undefined;
    return isArray(argumentsList) ? func.apply( thisArgument, argumentsList ) : func.call( thisArgument, argumentsList );
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