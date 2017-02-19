(function(){
var System = (function(_Object,_Function,_Array,_String,_Number,_Boolean,_Math,_Date,_RegExp,_Error,_ReferenceError,_TypeError,_SyntaxError,_JSON,_Reflect,undefined)
{
    var s=System={};
    var m={};
    var $console = console || {};
    var $traceItems=[];
    var $apply = _Function.prototype.apply;
    var $call  = _Function.prototype.call;
    var toString = function (item) {
        if( isArray(item) )return Array.prototype.map.call(item,toString);
        if( isObject(item,true) ){
            var objs={};
            for(var i in item){objs[i] = toString(item[i]);}
            return objs;
        }
        return item ? item.valueOf() : item;
    }
    s.log = function log(){
        $console.log.apply(undefined, Array.prototype.map.call(arguments,toString) );
    };
    s.info =function info(){
        $console.info.apply(undefined, Array.prototype.map.call(arguments,toString) );
    };
    s.trace = function trace(){
        $console.log.apply(undefined, ['Trace: '].concat( Array.prototype.map.call(arguments,toString) ) );
        $console.log( '   At '+$traceItems.join('\n   At ') );
    };
    s.warn = function warn(){
        $console.warn.apply(undefined, Array.prototype.map.call(arguments,toString) );
    };
    s.error = function error(){
        $console.error.apply(undefined, Array.prototype.map.call(arguments,toString) );
    };
    s.dir = function dir(){
        $console.dir.apply(undefined, Array.prototype.map.call(arguments,toString) );
    };
    s.assert = $console.assert || function(){};
    s.time = $console.time || function(){};
    s.timeEnd = $console.timeEnd || function(){};

    s.isFinite = isFinite || function () {};
    s.decodeURI= decodeURI || function () {};
    s.decodeURIComponent= decodeURIComponent || function () {};
    s.encodeURI= encodeURI || function () {};
    s.encodeURIComponent= encodeURIComponent || function () {};
    s.escape= escape || function () {};
    s.eval= eval || function () {};
    s.isNaN= isNaN || function () {};
    s.parseFloat= parseFloat || function () {};
    s.parseInt= parseInt || function () {};
    s.unescape= unescape || function () {};
    //s.uneval= uneval || function () {};

    s.Object  = _Object;
    s.Function= _Function;
    s.Array   = _Array;
    s.String  = _String;
    s.Number  = _Number;
    s.Boolean = _Boolean;
    s.RegExp  = _RegExp;
    s.Error   = _Error;
    s.ReferenceError = _ReferenceError;
    s.TypeError      = _TypeError;
    s.SyntaxError    = _SyntaxError;
    s.Math = _Math;
    s.Date = _Date;

    /**
     * 对象类构造器
     * @param value
     * @returns {*}
     * @constructor
     */
    function Object( value )
    {
        if ( !(value === undefined || value === null) )return _Object(value);
        if( !(this instanceof Object) ) return new Object();
        return this;
    }
    s.Object =Object;
    Object.prototype = new _Object();
    Object.prototype.constructor=Object;

    /**
     * 获取指定对象的原型
     * @type {Object}
     * @returns {Boolean}
     */
    Object.getPrototypeOf = _Object.getPrototypeOf;
    if( typeof Object.getPrototypeOf !== 'function' )
    {
        Object.getPrototypeOf = function getPrototypeOf(obj) {
            if( !obj )return null;
            return obj && obj.__proto__ ? obj.__proto__ : (obj.constructor ? obj.constructor.prototype : null);
        }
    }

    /**
     * 设置对象的原型链
     * @returns {Object}
     */
    var $setPrototypeOf = _Object.setPrototypeOf || function setPrototypeOf(obj, proto)
    {
        obj.__proto__ = proto;
        return obj;
    }

    /**
     * 合并其它参数到指定的 target 对象中
     * 如果只有一个参数则只对本身进行扩展。
     * @param deep true 深度合并
     * @param target object 目标源对象
     * @param ...valueObj object 待合并到目标源上的对象
     * @returns Object
     */
    Object.merge = function()
    {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;
        if ( typeof target === "boolean" )
        {
            deep = target;
            target = arguments[1] || {};
            i++;
        }
        if ( length === i )
        {
            target = {};
            --i;
        }else if ( typeof target !== "object" && typeof target !== "function" )
        {
            target = {};
        }

        for ( ; i < length; i++ )
        {
            if ( (options = arguments[ i ]) != null )
            {
                for ( name in options )
                {
                    src = target[ name ];
                    copy = options[ name ];
                    if ( target === copy )continue;
                    if ( deep && copy && ( isObject(copy,true) || ( copyIsArray = isArray(copy) ) ) )
                    {
                        if ( copyIsArray )
                        {
                            copyIsArray = false;
                            clone = src && isArray(src) ? src : [];
                        } else
                        {
                            clone = src && isObject(src) ? src : {};
                        }
                        target[ name ] = Object.merge( deep, clone, copy );

                    } else if ( typeof copy !== "undefined" )
                    {
                        target[ name ] = copy;
                    }
                }
            }
        }
        return target;
    }

    /**
     * 指示 Object 类的实例是否在指定为参数的对象的原型链中
     * @param theClass
     * @returns {Boolean}
     */
    var $isPrototypeOf = _Object.prototype.isPrototypeOf;
    Object.prototype.isPrototypeOf = function( theClass )
    {
        var proto = Object.getPrototypeOf(this);
        var obj = this instanceof Class ? this : proto.constructor;
        if( obj instanceof Class )
        {
            var classObj = theClass;
            while (classObj instanceof Class)
            {
                if (classObj === obj)return true;
                classObj = classObj.extends;
            }
        }
        return $isPrototypeOf.call( proto, theClass);
    }

    /**
     * 表示对象本身是否已经定义了指定的属性。
     * 如果目标对象具有与 name 参数指定的字符串匹配的属性，则此方法返回 true；否则返回 false。
     * @param prop 对象的属性。
     * @returns {Boolean}
     */
    var $hasOwnProperty = _Object.prototype.hasOwnProperty;
    Object.prototype.hasOwnProperty = function( name )
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            var isstatic = obj === this;
            var desc;
            do {
                desc = isstatic ? obj.static[name] : obj.proto[name];
                if( desc && (desc.qualifier==='public' || desc.qualifier==='private') ){
                    return desc.qualifier==='public';
                }
            }while ( (obj = obj.extends) && obj instanceof Class )
            return false;
        }
        return $hasOwnProperty.call(this,name);
    }

    /**
     * 表示指定的属性是否存在、是否可枚举。
     * 如果为 true，则该属性存在并且可以在 for..in 循环中枚举。该属性必须存在于目标对象上，
     * 原因是：该方法不检查目标对象的原型链。您创建的属性是可枚举的，但是内置属性通常是不可枚举的。
     * @param name
     * @returns {Boolean}
     */
    var $propertyIsEnumerable=_Object.prototype.propertyIsEnumerable;
    Object.prototype.propertyIsEnumerable = function( name )
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            //动态创建的属性才可以枚举
            if( obj.dynamic && obj !== this )
            {
                do{
                   if( $hasOwnProperty.call(this[obj.token], name) )
                   {
                       //内置属性不可以枚举
                       if( !$hasOwnProperty.call(obj.proto,name) )return true;
                       return obj.proto[name].id==='dynamic' && obj.proto[name].enumerable !== false;
                   }
                }while ( (obj = obj.extends) && obj.dynamic && obj instanceof Class );
            }
            return false;
        }
        if( $hasOwnProperty.call(this,name) && this[name].enumerable === false && this[name] instanceof Descriptor)
            return false;
        return $propertyIsEnumerable.call(this,name);
    }

    /**
     * 描述符构造器
     * @param desc
     * @constructor
     */
    function Descriptor( desc )
    {
        if( !(this instanceof Descriptor) )return new Descriptor(desc);
        this.writable = !!desc.writable;
        this.enumerable = !!desc.enumerable;
        this.configurable = !!desc.configurable;
        if (typeof desc.value !== "undefined")
        {
            if(desc.get || desc.set || this.get || this.set)throwError('type','value and accessor can only has one');
            this.value = desc.value;
        }
        if ( typeof desc.get !== "undefined" )
        {
            if( typeof desc.get !== "function" )throwError('type','getter accessor is not function');
            if( typeof desc.value !== "undefined" || typeof this.value !== "undefined")throwError('type','value and accessor can only one');
            this.get = desc.get;
        }
        if ( typeof desc.set !== "undefined" )
        {
            if( typeof desc.set !== "function" )throwError('type','setter accessor is not function');
            if( typeof desc.value !== "undefined" || typeof this.value !== "undefined" || this.writable===false )throwError('type','value and accessor and writable can only one');
            this.set = desc.set;
        }
        return this;
    }

    /**
     * 设置属性的描述
     * @type {*|Function}
     */
    var $defineProperty=_Object.defineProperty || function(obj, prop, desc)
    {
        if( $hasOwnProperty.call(obj,prop) )
        {
            if( obj[prop] instanceof Descriptor )
            {
                if( obj[ prop ].configurable === false )throwError('type','"'+prop+'" property is not configurable');
                Descriptor.call(obj[prop], desc );
                return;
            }
            if( typeof desc.value === "undefined" )desc.value = obj[prop];
        }
        obj[prop] = new Descriptor(desc);
        return;
    };
    Object.defineProperty=$defineProperty;

    /**
     * 设置循环操作动态属性的可用性。
     * 该属性必须存在于目标对象上，原因是：该方法不检查目标对象的原型链。
     * @param name 对象的属性
     * @param isEnum  (default = true)
     * 如果设置为 false，则动态属性不会显示在 for..in 循环中，且方法 propertyIsEnumerable() 返回 false。
     */
    Object.prototype.setPropertyIsEnumerable = function( name, isEnum )
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            //动态创建的属性才可以设置枚举
            if( obj.dynamic && obj !== this )
            {
                do{
                    if( $hasOwnProperty.call(this[obj.token], name) )
                    {
                        var desc;
                        //内置属性不可以枚举
                        if( !$hasOwnProperty.call(obj.proto,name) )
                        {
                            desc= obj.proto[name] = {'id':'dynamic',enumerable:false};
                        }else
                        {
                            desc= obj.proto[name];
                        }
                        desc.enumerable = isEnum !== false;
                        return true;
                    }
                }while ( (obj = obj.extends) && obj.dynamic && obj instanceof Class );
            }
            return false;

        }else if( $hasOwnProperty.call(this,name) )
        {
            $defineProperty(this, name, {enumerable:isEnum !== false});
            return true;
        }
        return false;
    }

    /**
     * 返回指定对象的原始值
     * @returns {String}
     */
    var $valueOf = _Object.prototype.valueOf;
    Object.prototype.valueOf=function()
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            return obj === this ? '[Class: '+obj.classname+']' : '[object '+ obj.classname+']';
        }else if( obj instanceof Interface )
        {
            return '[Interface: '+obj.classname +']';
        }
        return $valueOf.call( this );
    }

    /**
     * 返回指定对象的字符串表示形式。
     * @returns {String}
     */
    var $toString = _Object.prototype.toString;
    Object.prototype.toString=function()
    {
        var obj = this instanceof Class ? this : this.constructor;
        if( obj instanceof Class )
        {
            return obj === this ? '[Class: '+obj.classname+']' : '[object '+ obj.classname+']';

        }else if( obj instanceof Interface )
        {
            return '[Interface: '+obj.classname +']';
        }
        return $toString.call( this );
    }

    /**
     * 返回对象可枚举的属性的键名
     * @returns {Array}
     */
    Object.prototype.keys=function()
    {
        return getEnumerableProperties.call(this,-1);
    }

    /**
     *  返回对象可枚举的属性值
     * @returns {Array}
     */
    Object.prototype.values=function()
    {
        return getEnumerableProperties.call(this,1);
    }

    /**
     * 获取可枚举的属性
     * @param state
     * @returns {Array}
     */
    function getEnumerableProperties( state )
    {
        var items=[];
        var prop;
        if( this instanceof Class || this.constructor instanceof Class)
        {
            var objClass = this.constructor;
            var obj;
            if ( objClass.dynamic && this !== objClass )
            {
                do {
                    obj = this[objClass.token];
                    if (obj)for(prop in obj)
                    {
                        if( !$hasOwnProperty.call(objClass.proto, prop) || objClass.proto[prop].enumerable !== false )
                        {
                            switch (state){
                                case -1 : items.push(prop); break;
                                case  1 : items.push( obj[prop] ); break;
                                case  2 : items[prop] = obj[prop]; break;
                                default : items.push({key: prop, value: obj[prop]}); break;
                            }
                        }
                    }
                } while ( (objClass = objClass.extends) && objClass.dynamic && objClass instanceof Class );
            }

        }else if( this && typeof this !== "function" )
        {
            for( prop in this )if( $propertyIsEnumerable.call(this,prop) && !( this[prop] && this[prop].enumerable === false && this[prop] instanceof Descriptor ) )
            {
                var val = Reflect.get(this,prop);
                switch (state){
                    case -1 : items.push(prop); break;
                    case  1 : items.push(val); break;
                    case  2 : items[prop] = val; break;
                    default : items.push({key: prop, value: val}); break;
                }
            }
        }
        return items;
    }

    /**
     * 迭代构造器
     * @param target
     * @constructor
     */
    function Iterator( target )
    {
        if( System.is(target,Iterator) )return target;
        if( !(this instanceof Iterator) ) return new Iterator(target);
        this.items = getEnumerableProperties.call(target);
        return this;
    }
    Iterator.current=null;
    s.Iterator = Iterator;
    Iterator.prototype = new Object();
    Iterator.prototype.items = null;
    Iterator.prototype.cursor = -1;
    Iterator.prototype.constructor = Iterator;

    /**
     * 将指针向前移动一个位置并返回当前元素
     * @returns {*}
     */
    Iterator.prototype.seek= function seek()
    {
        if( this.items.length <= this.cursor+1 )return false;
        return this.items[ ++this.cursor ];
    }

    /**
     * 返回当前指针位置的元素
     * @returns {*}
     */
    Iterator.prototype.current=function current()
    {
        if(this.cursor<0)this.cursor=0;
        return this.items[ this.cursor ];
    }

    /**
     * 返回上一个指针位置的元素
     * 如果当前指针位置在第一个则返回false
     * @returns {*}
     */
    Iterator.prototype.prev=function prev()
    {
        if( this.cursor < 1 )return false;
        return this.items[ this.cursor-1 ];
    }

    /**
     * 返回下一个指针位置的元素。
     * 如果当前指针位置在最后一个则返回false
     * @returns {*}
     */
    Iterator.prototype.next=function next()
    {
        if( this.cursor >= this.items.length )return false;
        return this.items[ this.cursor+1 ];
    }

    /**
     * 将指针移到到指定的位置并返回当前位置的元素
     * @param cursor
     * @returns {*}
     */
    Iterator.prototype.move=function move( cursor )
    {
        cursor=cursor >> 0;
        if( cursor < 0 || cursor >= this.items.length )return false;
        this.cursor = cursor;
        return this.items[ this.cursor ];
    }

    /**
     * 重置指针
     * @returns {Iterator}
     */
    Iterator.prototype.reset=function reset()
    {
        this.cursor = -1;
        return this;
    }

    /**
     * Reflect是一个内置的对象，提供可拦截的JavaScript操作的方法。方法与代理处理程序相同。反射不是一个函数对象，因此它不可构造。
     * @constructor
     */
    $rConstruct =_Reflect && _Reflect.construct;
    function Reflect() {
        if(this instanceof Reflect)throwError('Reflect is not constructor.');
    }
    s.Reflect = Reflect;

    /**
     * 静态方法 Reflect.apply() 通过指定的参数列表发起对目标(target)函数的调用
     * @param func
     * @param thisArgument
     * @param argumentsList
     * @returns {*}
     */
    Reflect.apply=function apply( func, thisArgument, argumentsList)
    {
        if( func instanceof Class )func=func.constructor;
        if( typeof func !== "function" )throwError('type','is not function');
        if( func=== thisArgument )thisArgument=undefined;
        return isArray(argumentsList) ? func.apply( thisArgument, argumentsList ) : func.call( thisArgument, argumentsList );
    }

    /**
     * Reflect.construct() 方法的行为有点像 new 操作符 构造函数 ， 相当于运行 new target(...args).
     * @param target
     * @param argumentsList
     * @param newTarget
     * @returns {*}
     */
    Reflect.construct=function construct(theClass, argumentsList, newTarget)
    {
        if( theClass === newTarget )newTarget=undefined;
        if( theClass instanceof Class )
        {
            if( theClass.isAbstract )throwError('type','Abstract class cannot be instantiated');
            if( typeof theClass.constructor !== "function"  )throwError('type','is not constructor');
            theClass = theClass.constructor;

        }else if( typeof theClass !== "function" )
        {
            throwError('type','is not function');
        }
        argumentsList = argumentsList || [];
        if( $rConstruct )
        {
           return newTarget ? $rConstruct(theClass, argumentsList, newTarget) : $rConstruct(theClass, argumentsList);
        }

        if( typeof newTarget !== "function" )newTarget=Nop;
        newTarget.prototype = theClass.prototype;
        var obj = argumentsList && isArray(argumentsList) ? theClass.apply( new newTarget(), argumentsList ) : theClass.call( new newTarget(), argumentsList );
        //原型链引用
        if( Object.getPrototypeOf(obj) !== theClass.prototype )$setPrototypeOf(obj, theClass.prototype);
        return obj;
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
            $defineProperty.call(target, propertyKey, attributes);
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
        if( !target || target instanceof Class )return false;
        if( target.constructor instanceof Class )
        {
            var objClass = target.constructor;
            if( !objClass.dynamic )return false;
            do{
                var obj = target[objClass.token];
                if( obj && $hasOwnProperty.call(obj,propertyKey) )
                {
                    var hasDesc =  $hasOwnProperty.call(objClass.proto,propertyKey);
                    //只有动态添加的属性或者是可配置的属性才可以删除
                    if( hasDesc )
                    {
                        var desc = objClass.proto[propertyKey];
                        if( desc.configurable === false || desc.id !=='dynamic' )return false;
                    }
                    delete obj[propertyKey];
                    if ( hasDesc ){
                        delete objClass.proto[propertyKey];
                    }
                    return true;
                }
            }while ( (objClass = objClass.extends) && objClass.dynamic && objClass instanceof Class )
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
        var objClass = target instanceof Class ? target : target.constructor;
        if( objClass instanceof Class )
        {
            var isstatic = objClass === target;
            do {
                var desc= isstatic ? objClass.static :  objClass.proto;
                //没有属性描述符默认为public
                if( !$hasOwnProperty.call(desc, propertyKey) )
                {
                    desc=null;
                    //只有非静态的才有实例属性
                    if( !isstatic && target[objClass.token] && $hasOwnProperty.call(target[objClass.token],propertyKey) )
                    {
                        return true;
                    }
                }
                if( desc )
                {
                    return !desc[propertyKey].qualifier || desc[propertyKey].qualifier === 'public';
                }
                objClass = objClass.extends;
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
     * 检查是否可访问
     * @private
     * @param descriptor
     * @param referenceModule
     * @param classModule
     * @returns {boolean}
     */
    function checkPrivilege(descriptor,referenceModule, classModule  )
    {
        if( descriptor && descriptor.qualifier && descriptor.qualifier !== 'public' )
        {
            //不是本类中的成员调用（本类中的所有成员可以相互调用）
            if( referenceModule !== classModule )
            {
                if( descriptor.qualifier === 'internal' )
                {
                    return referenceModule.package === classModule.package;

                }else if( descriptor.qualifier === 'protected' )
                {
                    return Object.prototype.isPrototypeOf.call(classModule,referenceModule);
                }
                return false;
            }
        }
        return true;
    }


    /**
     * 获取目标公开的属性值
     * @param target
     * @param propertyKey
     * @returns {*}
     */
    Reflect.get=function(target, propertyKey, receiver , classScope )
    {
        if( !propertyKey )return target;
        if( !target )throwError('type','target object is null');
        var objClass = target instanceof Class ? target : target.constructor;
        if( objClass instanceof Class )
        {
            var isstatic = objClass === target;
            //如果是获取超类中的属性或者方法
            if( isstatic && (receiver && receiver.constructor instanceof Class) )isstatic=false;
            do {
                var desc= isstatic ? objClass.static :  objClass.proto;
                //没有属性描述符默认为public
                if( !$hasOwnProperty.call(desc, propertyKey) )
                {
                    desc=null;
                    //只有非静态的才有实例属性
                    if( !isstatic )
                    {
                        if( target[objClass.token] && $hasOwnProperty.call( target[objClass.token],propertyKey ) )
                        {
                            return target[objClass.token][propertyKey];
                        }
                    }
                }
                if( desc && ( desc[propertyKey].qualifier !== 'private' || classScope === objClass ) )
                {
                    desc = desc[propertyKey];

                    //是否有访问的权限
                    if( !checkPrivilege(desc, objClass, classScope) )throwError('reference', '"' + propertyKey + '" inaccessible.');
                    if( desc.get ){
                        return desc.get.call(receiver || target);
                    }else {
                        if( isstatic )return desc.value;
                        return $hasOwnProperty.call(desc,'value') ? desc.value : target[objClass.token][propertyKey];
                    }
                }
                objClass = objClass.extends;
                if( !(objClass instanceof Class) )
                {
                    return (objClass||Object).prototype[propertyKey];
                }

            }while ( objClass )
            return undefined;
        }
        return $get(target, propertyKey, receiver );
    }

    /**
     * @private
     */
    function $get(target, propertyKey, receiver)
    {
        var value = target[propertyKey];
        if( value instanceof Descriptor )
        {
             return value.get ? value.get.call(receiver || target) : value.value;
        }
        return value;
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
        if( !propertyKey )return false;
        if( !target )throwError('reference','Reference object is null');
        var objClass = target instanceof Class ? target : target.constructor;
        if( objClass instanceof Class )
        {
            var isstatic = objClass === target;
            //如果是获取超类中的属性或者方法
            if( isstatic && (receiver && receiver.constructor instanceof Class) )isstatic=false;
            do{
                var desc= isstatic ? objClass.static :  objClass.proto;
                //没有属性描述符默认为public
                if( !$hasOwnProperty.call(desc, propertyKey) )
                {
                    desc=null;
                    //只有非静态的才有实例属性
                    if( !isstatic )
                    {
                        if( target[objClass.token] && $hasOwnProperty.call( target[objClass.token],propertyKey ) )
                        {
                            target[objClass.token][propertyKey] = value;
                            return true;
                        }
                        //动态对象可以动态添加
                        else if( objClass.dynamic === true )
                        {
                            var refObj = target[objClass.token] || (target[objClass.token]={});
                            objClass.proto[propertyKey]={id:'dynamic'};
                            refObj[propertyKey] = value;
                            return true;
                        }
                    }
                }
                if( desc && ( desc[propertyKey].qualifier !== 'private' || classScope === objClass ) )
                {
                    desc = desc[propertyKey];
                    //是否有访问的权限
                    if( !checkPrivilege(desc, objClass, classScope) )throwError('reference', '"' + propertyKey + '" inaccessible.');
                    if( desc.set ){
                        desc.set.call(receiver || target, value);
                    }else {
                        if (desc.writable === false)throwError('reference', '"' + propertyKey + '" is not writable');
                        isstatic ? desc.value = value : target[objClass.token][propertyKey] = value;
                    }
                    return true;
                }
            }while( objClass=objClass.extends );
            return false;
        }
        return $set(target,propertyKey,value,receiver);
    }

    /**
     * @private
     */
    function $set(target,propertyKey,value,receiver)
    {
        var desc = target[propertyKey];
        if( desc instanceof Descriptor )
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
            target[propertyKey] = value;
        }catch (e){
            return false;
        }
        return true;
    }

    /**
     * JSON 对象构造器
     * @constructor
     */
   function JSON(){ if(this instanceof JSON)throwError('JSON is not constructor.'); };
   s.JSON=JSON;
   var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
   var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
   function escFunc(m) {return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1);};
   JSON.parse = function (strJson) {return eval('(' + strJson + ')');}
   JSON.stringify = function(value)
   {
       if(value == null) return 'null';
       var type = typeof value;
       if (type=== 'number')return System.isFinite(value) ? value.toString() : 'null';
       if (type === 'boolean')return value.toString();
       if ( type === 'object' )
       {
           var tmp = [];
           if (typeof value.toJSON === 'function') {
               return JSON.stringify( value.toJSON() );
           } else if ( isArray(value) ) {
               for (var i = 0; i < value.length; i++)tmp.push( JSON.stringify( value[i] ) );
               return '['+tmp.join(',')+']';
           } else if ( isObject(value,true) ) {
               var items = getEnumerableProperties.call(value);
               for( var i =0; i<items.length; i++ )tmp.push( JSON.stringify(items[i].key)+':'+JSON.stringify(items[i].value) );
               return '{' + tmp.join(', ') + '}';
           }
       }
       return '"' + value.toString().replace(escRE, escFunc) + '"';
   };

    /**
     * 数组构造器
     * @returns {Array}
     * @constructor
     */
    function Array(length)
    {
        if( !(this instanceof Array) )return _Array.apply(new Array(), Array.prototype.slice.call(arguments,0) );
        this.length=0;
        return _Array.apply(this,Array.prototype.slice.call(arguments,0));
    }
    s.Array =Array;
    Array.prototype = new Object();
    Array.prototype.constructor = Array;
    Array.prototype.length  =0;
    Array.prototype.slice   = _Array.prototype.slice;
    Array.prototype.splice  = _Array.prototype.splice;
    Array.prototype.concat  = _Array.prototype.concat;
    Array.prototype.join    = _Array.prototype.join;
    Array.prototype.pop     = _Array.prototype.pop;
    Array.prototype.push    = _Array.prototype.push;
    Array.prototype.shift   = _Array.prototype.shift;
    Array.prototype.unshift = _Array.prototype.unshift;
    Array.prototype.sort    = _Array.prototype.sort;
    Array.prototype.map    = _Array.prototype.map;
    Array.prototype.reverse = _Array.prototype.reverse;
    Array.prototype.toString=_Array.prototype.toString;
    Array.prototype.valueOf =_Array.prototype.valueOf;

    /**
     * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
     * @param callback 一个回调函数。
     * 参数中的第一个为属性值，第二个为属性名。
     * 如果返回 false 则退出循环
     * @returns {Object}
     */
    Array.prototype.forEach=function( callback, thisArg )
    {
        if( typeof callback !== "function" )throwError('type','"callback" must be a function')
        var it = new Iterator(this);
        thisArg = thisArg || this;
        for(;it.seek();)
        {
            if( callback.call(thisArg,it.current().value, it.current().key )=== false)return this;
        }
        return this;
    }

    /**
     * 方法使用指定的函数测试所有元素，并创建一个包含所有通过测试的元素的新数组。
     * @param callback
     * @param thisArg
     * @returns {Array}
     */
    Array.prototype.filter=function (callback, thisArg)
    {
        if (typeof callback !== 'function')throwError('type','callback must be a function');
        var it = new Iterator(this);
        var len = it.items.length;
        var items = new Array();
        var i = 0;
        for (; i < len; i++)if ( callback.call(thisArg, it.items[i].value, it.items[i].key) )items.push( it.items[i].value );
        return items;
    }

    /**
     * 将一个数组的所有元素从开始索引填充到具有静态值的结束索引
     * @param value
     * @param start
     * @param end
     * @returns {Object}
     */
    Array.prototype.fill = function fill(value, start, end)
    {
        var obj = Object(this);
        if( !(obj instanceof Class) )
        {
            var o = obj.constructor instanceof Class ? obj[obj.constructor.token] : obj;
            var len = o.length >> 0;
            var relativeStart = start >> 0;
            var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
            var relativeEnd = end === undefined ? len : end >> 0;
            var final = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
            while (k < final) {
                o[k] = value;
                k++;
            }
        }
        return obj;
    };

    /**
     * 返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。
     * @param callback
     * @param thisArg
     * @returns {*}
     */
    Array.prototype.find = function(callback,thisArg)
    {
        if (typeof callback !== 'function')throwError('type','callback must be a function');
        var it = new Iterator(this);
        var len = it.items.length;
        for (var i = 0; i < len; i++)if ( callback.call(thisArg, it.items[i].value, it.items[i].key) )
        {
            return it.items[i].value;
        }
        return undefined;
    };



    /**
     * 类对象构造器
     * @returns {Class}
     * @constructor
     */
    function Class()
    {
        Object.call(this);
        return this;
    }
    s.Class = Class;
    Class.prototype                  = new Object();
    Class.prototype.constructor      = null;
    Class.prototype.extends          = null;
    Class.prototype.static           = null;
    Class.prototype.proto            = null;
    Class.prototype.token            = '';
    Class.prototype.classname        = '';
    Class.prototype.package          = '';
    Class.prototype.implements       = [];
    Class.prototype.final            = false;
    Class.prototype.dynamic          = false;
    Class.prototype.call             = null;
    Class.prototype.prop             = null;

    /**
     * 接口构造函数
     * @constructor
     */
    function Interface()
    {
        Object.call(this);
        return this;
    }
    s.Interface = Interface;
    Interface.prototype              = new Object();
    Interface.prototype.constructor  = null;
    Interface.prototype.extends      = null;
    Interface.prototype.proto        = null;
    Interface.prototype.classname    = '';
    Interface.prototype.package      = '';
    Interface.prototype.token        = '';

    /**
     * 错误消息构造函数
     * @param message
     * @param line
     * @param filename
     * @constructor
     */
    function Error( message , line, filename )
    {
        this.message = message;
        this.line=line;
        this.filename = filename;
        this.type='Error';
    }
    s.Error = Error;
    Error.prototype = new Object();
    Error.prototype.constructor=Error;
    Error.prototype.line=null;
    Error.prototype.type='Error';
    Error.prototype.message=null;
    Error.prototype.filename=null;
    Error.prototype.toString=function ()
    {
        return this.message;
    }


    /**
     * 引用错误构造器
     * @param message
     * @param line
     * @param filename
     * @constructor
     */
    function ReferenceError( message , line, filename )
    {
        Error.call(this, message , line, filename);
        this.type='ReferenceError';
    }
    s.ReferenceError = ReferenceError;
    ReferenceError.prototype = new Error();
    ReferenceError.prototype.constructor=ReferenceError;


    /**
     * 类型错误构造器
     * @param message
     * @param line
     * @param filename
     * @constructor
     */
    function TypeError( message , line, filename )
    {
        Error.call(this, message , line, filename);
        this.type='TypeError';
    }
    s.TypeError = TypeError;
    TypeError.prototype = new Error();
    TypeError.prototype.constructor=TypeError;


    /**
     * 语法错误构造器
     * @param message
     * @param line
     * @param filename
     * @constructor
     */
    function SyntaxError( message , line, filename )
    {
        Error.call(this, message , line, filename);
        this.type='SyntaxError';
    }
    s.SyntaxError = SyntaxError;
    SyntaxError.prototype = new Error();
    SyntaxError.prototype.constructor=SyntaxError;

    function URIError( message , line, filename) {
        Error.call(this, message , line, filename);
        this.type='URIError';
    }
    s.URIError = URIError;
    URIError.prototype = new Error();
    URIError.prototype.constructor=URIError;

    function RangeError( message , line, filename) {
        Error.call(this, message , line, filename);
        this.type='RangeError';
    }
    s.RangeError = RangeError;
    RangeError.prototype = new Error();
    RangeError.prototype.constructor=RangeError;

    function EvalError( message , line, filename) {
        Error.call(this, message , line, filename);
        this.type='EvalError';
    }
    s.EvalError = EvalError;
    EvalError.prototype = new Error();
    EvalError.prototype.constructor=EvalError;

    /**
     * 返回对象类型的字符串表示形式
     * @param instanceObj
     * @returns {*}
     */
    function typeOf( instanceObj )
    {
        if( instanceObj instanceof Class )return 'class';
        if( instanceObj instanceof Interface )return 'interface';
        if( instanceObj instanceof s.RegExp )return 'regexp';
        return typeof instanceObj;
    }
    s.typeOf=typeOf;

    /**
     * 检查实例对象是否属于指定的类型(不会检查接口类型)
     * @param instanceObj
     * @param theClass
     * @returns {boolean}
     */
    function instanceOf(instanceObj, theClass)
    {
        var isclass = theClass instanceof Class;
        var isInterface = theClass instanceof Interface;
        if( instanceObj && (isclass || isInterface) )
        {
            if( instanceObj instanceof Class )return isclass;
            instanceObj = instanceObj.constructor;
            while( instanceObj )
            {
                if( instanceObj === theClass )return true;
                instanceObj=instanceObj.extends;
            }
        }
        if( typeof theClass !== "function" )return false;
        instanceObj = Object(instanceObj);
        return instanceObj instanceof theClass || ( theClass===s.JSON && isObject(instanceObj,true) );
    }
    s.instanceOf=instanceOf;
    /**
     * 检查实例对象是否属于指定的类型(检查接口类型)
     * @param instanceObj
     * @param theClass
     * @returns {boolean}
     */
    function is(instanceObj, theClass)
    {
        var isclass = theClass instanceof Class;
        var isInterface = theClass instanceof Interface;
        if( isclass || isInterface )
        {
            if( instanceObj instanceof Class )return isclass;
            instanceObj = instanceObj.constructor;
            while( instanceObj )
            {
                if( instanceObj === theClass )return true;
                if( instanceObj.implements && instanceObj.implements.length > 0 )
                {
                    for (var b in instanceObj.implements)
                    {
                        var interfaceModule = instanceObj.implements[b];
                        do{
                            if( interfaceModule === theClass ) return true;
                        } while ( interfaceModule && (interfaceModule = interfaceModule.extends));
                    }
                }
                instanceObj=instanceObj.extends;
            }
        }
        return instanceOf( instanceObj, theClass);
    }
    s.is=is;

    /**
     * 为指定的类创建一个新的实例对象
     * @param fn
     * @param param
     * @returns {nop}
     */
    function Nop(){}
    function factory(theClass, args)
    {
        var obj;
        var constructor =  theClass;
        if( theClass instanceof Class )
        {
            if( theClass.isAbstract )throwError('type','Abstract class cannot be instantiated');
            constructor = theClass.constructor;
        }

        if( typeof constructor !== "function" )throwError('type','is not constructor');
        if( arguments.length <= 2 )
        {
            obj =  arguments.length===1 ? new constructor() : new constructor( args );
        }else
        {
            Nop.prototype = constructor.prototype;
            obj = constructor.apply( new Nop() , Array.prototype.slice.call(arguments, 1) );
        }
        //原型链引用
        if( Object.getPrototypeOf(obj) !== constructor.prototype )$setPrototypeOf(obj, constructor.prototype);
        return obj;
    }
    s.factory=factory;

    /**
     * 根据指定的类名获取类的对象
     * @param name
     * @returns {Object}
     */
    function getDefinitionByName( name )
    {
        if( m[ name ] )return m[ name];
        if( s[name] )return s[name];
        for ( var i in m )if( i=== name )return m[i];
        throwError('type', '"'+name+'" is not define');
    }
    s.getDefinitionByName =getDefinitionByName;


    function getFullname(classModule) {
        return classModule.package ? classModule.package+'.'+classModule.classname : classModule.classname;
    }

     /**
     * 返回对象的完全限定类名
     * @param value 需要完全限定类名称的对象。
     * 可以将任何类型、对象实例、原始类型和类对象
     * @returns {string}
     */
    function getQualifiedClassName( value )
    {
         switch ( typeOf(value) )
         {
             case 'boolean': return 'Boolean';
             case 'number' : return 'Number' ;
             case 'string' : return 'String' ;
             case 'regexp' : return 'RegExp' ;
             case 'class'  : return  getFullname(value);
             case 'interface': return  getFullname(value);
             case 'function' :
                 if (value === s.String)return 'String';
                 if (value === s.Boolean)return 'Boolean';
                 if (value === s.Number)return 'Number';
                 if (value === s.RegExp)return 'RegExp';
                 if ( value === s.Array )return 'Array';
                 if ( value === s.Date )return 'Date';
                 if ( value === s.Object )return 'Object';
                 if ( value === s.Iterator )return 'Iterator';
                 if ( value === s.Reflect )return 'Reflect';
                 if (value === s.JSON)return 'JSON';
                  return 'Function';
             default :
                 if( value=== System )return 'System';
                 if( value === s.Math )return 'Math';
                 if( value === s.Reflect )return 'Reflect';
                 if( value === s.Iterator )return 'Iterator';
                 if( isArray(value) )return 'Array';
                 if( isObject(value,true) )return 'Object';
                 if( value instanceof s.Date )return 'Date';
                 if( value instanceof String )return 'String';
                 if( value instanceof Number )return 'Number';
                 if( value instanceof Boolean )return 'Boolean';
                 if( value.constructor instanceof Class )return getFullname(value.constructor);
         }
         throwError('reference','type does not exist');
    }
    s.getQualifiedClassName=getQualifiedClassName;
     /**
     * 获取指定实例对象的超类名称
     * @param value
     * @returns {string}
     */
    function getQualifiedSuperclassName(value)
    {
        var classname = getQualifiedClassName( value )
        if (classname)
        {
            var classModule = getDefinitionByName( classname );
            var parentModule = classModule.extends;
            if ( parentModule )
            {
                return  parentModule.fullclassname;
            }
        }
        return null;
    }
    s.getQualifiedSuperclassName =getQualifiedSuperclassName;
    /**
     * 判断是否为一个可遍历的对象
     * null, undefined 属于对象类型但也会返回 false
     * @param val
     * @param flag 默认为 false。如为true表示一个纯对象,否则数组对象也会返回true
     * @returns {boolean}
     */
    function isObject(val , flag )
    {
        if( !val )return false;
        var proto =  Object.getPrototypeOf(val);
        var result = !!(proto === Object.prototype || proto===_Object.prototype);
        if( !result && flag !== true && isArray(val) )return true;
        return result;
    };
    s.isObject =isObject;
    /**
     * 检查所有传入的值定义
     * 如果传入多个值时所有的都定义的才返回true否则为false
     * @param val,...
     * @returns {boolean}
     */
    function isDefined()
    {
        var i=arguments.length;
        while( i>0 ) if( typeof arguments[ --i ] === 'undefined' )return false;
        return true;
    };
    s.isDefined =isDefined;
    /**
     * 判断是否为数组
     * @param val
     * @returns {boolean}
     */
    function isArray(val)
    {
        if(!val)return false;
        return val instanceof Array || val instanceof _Array;
    };
    s.isArray =isArray;
    /**
     * 判断是否为函数
     * @param val
     * @returns {boolean}
     */
    function isFunction( val ){
        return typeof val === 'function';
    };
    s.isFunction =isFunction;
    /**
     * 判断是否为布尔类型
     * @param val
     * @returns {boolean}
     */
    function isBoolean( val ){
        return typeof val === 'boolean';
    };
    s.isBoolean=isBoolean;
    /**
     * 判断是否为字符串
     * @param val
     * @returns {boolean}
     */
    function isString(val )
    {
        return typeof val === 'string';
    };
    s.isString=isString;
    /**
     * 判断是否为一个标量
     * 只有对象类型或者Null不是标量
     * @param {boolean}
     */
    function isScalar(val )
    {
        var t=typeof val;
        return t==='string' || t==='number' || t==='float' || t==='boolean';
    };
    s.isScalar=isScalar;
    /**
     * 判断是否为数字类型
     * @param val
     * @returns {boolean}
     */
    function isNumber(val )
    {
        return typeof val === 'number';
    };
    s.isNumber=isNumber;
    /**
     * 抛出错误信息
     * @param type
     * @param msg
     */
    function throwError(type, msg , line, filename)
    {
        switch ( type ){
            case 'type' :
                throw new s.TypeError( msg,line, filename );
                break;
            case 'reference':
                throw new s.ReferenceError( msg ,line, filename);
                break;
            case 'syntax':
                throw new s.SyntaxError( msg ,line, filename );
                break;
            default :
                throw new s.Error( msg , line, filename );
        }
    }
    s.throwError =throwError;
    /**
     * 判断是否为一个空值
     * @param val
     * @param flag 为true时排除val为0的值
     * @returns {boolean}
     */
    function isEmpty(val , flag )
    {
        if( !val )return flag !== true || val !== 0;
        if( isObject(val) )
        {
            var ret;
            for( ret in val )break;
            return typeof ret === "undefined";
        }
        return false;
    };
    s.isEmpty=isEmpty;

    /**
     * 去掉指定字符两边的空白
     * @param str
     * @returns {string}
     */
    function trim( str )
    {
        return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
    }
    s.trim = trim;

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

    function makeMethods(method, classModule)
    {
        switch ( method )
        {
            case 'get' : return function(info, thisArg, property, operator, issuper)
            {
                try{
                    if( !property )return thisArg;
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
                    if( !property )return value;
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
                if ( !System.is(value, type) )toErrorMsg('TypeError Specify the type of value do not match. must is "' + getQualifiedClassName(type) + '"', classModule, info, value);
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
        if( typeof s[ name ] === "function" )return s[ name ];
        var classModule;
        if( m[ name ] && (m[ name ] instanceof Class  || m[ name ] instanceof Interface) )
        {
            classModule = m[ name ];
        }else
        {
            if( isInterface )
            {
                classModule = m[ name ] = new Interface();
                descriptions.constructor = null;
            }else
            {
                classModule = m[name] = new Class();
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
    s.define=define;
    return s;

}(Object,Function,Array,String,Number,Boolean,Math,Date,RegExp,Error,ReferenceError,TypeError,SyntaxError,JSON,Reflect));


(function(Class,Interface,Number,String,JSON,Object,RegExp,Error,EvalError,RangeError,ReferenceError,SyntaxError,TypeError,URIError,Function,Date,Boolean,Symbol,Iterator,Reflect,Array,Math,arguments){
(function(){
var D=System.define("com.D",{
"constructor":function(jj){Object.defineProperty(this, "1487494058228", {enumerable: false, configurable: false, writable: false, value: {"bb":'123'}});Object.constructor.call(this);
if(System.typeOf(jj) === "undefined"){jj='123';}
if(!System.is(jj,String))System.throwError("type","type of mismatch. must is a String");
D.apply("30:50",System,"log",[jj,' this is a D class ']);var cc=66;},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\D.as",
"static":{},
"token":"1487494058228",
"extends":Object,
"classname":"D",
"package":"com",
"isAbstract":false,
"proto":{
"bb":{"qualifier":"protected"},
"address":{"qualifier":"protected","get":function(){return D.check("37:18",String,'66666');},"set":function(add){if(!System.is(add,String))System.throwError("type","type of mismatch. must is a String");
}},
"test":{"writable":false,"value":function(){return 'the fun createname';}}
}}, false);
})();
(function(){
var IProt=System.define("lib.IProt",{
"constructor":null,
"token":"1484362494903",
"extends":null,
"classname":"IProt",
"package":"lib",
"isAbstract":false,
"proto":{
"connect":{"writable":false}
}}, true);
})();
(function(){
var IProt=System.define("lib.IProt");
var IProsess=System.define("lib.IProsess",{
"constructor":null,
"token":"1487493916094",
"extends":IProt,
"classname":"IProsess",
"package":"lib",
"isAbstract":false,
"proto":{
"database":{"writable":false}
}}, true);
})();
(function(){
var B=System.define("com.B");
var D=System.define("com.D");
var EventDispatcher=System.define("lib.EventDispatcher");
var IProsess=System.define("lib.IProsess");
var IProt=System.define("lib.IProt");
var Abs=System.define("com.Abs",{
"constructor":function(){Object.defineProperty(this, "1486372858099", {enumerable: false, configurable: false, writable: false, value: {"dispatcher":null,"age":'3',"name":'666 66fff'}});return D.constructor.call(this);},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\Abs.as",
"static":{
"address":{"qualifier":"private","value":'shu line 6666'},
"classname":{"writable":false,"qualifier":"protected","get":function(){return Abs.check("33:18",String,'==the B classname=');}}
},
"token":"1486372858099",
"extends":D,
"classname":"Abs",
"package":"com",
"isAbstract":true,
"proto":{
"age":{"writable":false,"qualifier":"protected"},
"createName":{"writable":false,"qualifier":"protected","value":function(){return 'the fun createname';}},
"name":{"qualifier":"private"},
"cre":{"writable":false,"qualifier":"protected","value":function(str){if(!System.is(str,String))System.throwError("type","type of mismatch. must is a String");
Abs.apply("46:36",System,"log",[Abs.get("46:34",this,"name")]);Abs.apply("47:35",System,"log",['call cre']);}},
"connect":{"writable":false,"value":function(str){return Abs.check("51:18",String,'');}}
}}, false);
})();
(function(){
var Abs=System.define("com.Abs");
var D=System.define("com.D");
var EventDispatcher=System.define("lib.EventDispatcher");
var IProsess=System.define("lib.IProsess");
var IProt=System.define("lib.IProt");
var B=System.define("com.B",{
"constructor":function(jj){Object.defineProperty(this, "1487489362173", {enumerable: false, configurable: false, writable: false, value: {"dispatcher":null,"age":'3',"name":'666 66fff'}});D.constructor.call(this,jj);var cc=66;B.apply("40:53",System,"log",['===the is B====',System.is(this,D)]);},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\com\\B.as",
"static":{
"address":{"qualifier":"protected","value":'shu line 6666'},
"classname":{"writable":false,"qualifier":"protected","get":function(){return B.check("33:18",String,'==the B classname=');}}
},
"token":"1487489362173",
"extends":D,
"classname":"B",
"package":"com",
"isAbstract":false,
"proto":{
"age":{"writable":false,"qualifier":"protected"},
"createName":{"writable":false,"qualifier":"protected","value":function(){return 'the fun createname';}},
"name":{"qualifier":"private"},
"cre":{"writable":false,"qualifier":"protected","value":function(str){if(!System.is(str,String))System.throwError("type","type of mismatch. must is a String");
B.apply("54:36",System,"log",[B.get("54:34",this,"name")]);B.apply("55:35",System,"log",['call cre']);}},
"connect":{"writable":false,"value":function(str){return B.check("59:18",String,'');}}
}}, false);
})();
(function(){
var B=System.define("com.B");
var EventDispatcher=System.define("lib.EventDispatcher",{
"constructor":function(target){Object.defineProperty(this, "1487492229506", {enumerable: false, configurable: false, writable: false, value: {"getProxyTarget":null,"storage":null,"forEachCurrentItem":null,"length":null}});Object.constructor.call(this);
EventDispatcher.get("34:50",this,EventDispatcher.check("34:48",String,'getProxyTarget'||EventDispatcher.get("34:48",this,"length")));EventDispatcher.set("35:31",this,"getProxyTarget",EventDispatcher.check("35:31",Function,target&&1?function(){return EventDispatcher.get("37:40",target,"length")>0?target:[this];}:function(){return EventDispatcher.get("40:50",this,"forEachCurrentItem")?[EventDispatcher.get("40:77",this,"forEachCurrentItem")]:(EventDispatcher.get("40:94",this,"length")>0?this:[this]);}));},
"implements":[],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\lib\\EventDispatcher.as",
"static":{
"Listener":{"value":B},
"SpecialEvent":{"value":B}
},
"token":"1487492229506",
"extends":Object,
"classname":"EventDispatcher",
"package":"lib",
"isAbstract":false,
"proto":{
"getProxyTarget":{"qualifier":"private"},
"storage":{"qualifier":"private"},
"forEachCurrentItem":{"qualifier":"private"},
"length":{"qualifier":"private"},
"hasEventListener":{"writable":false,"value":function(type){var events;
var target=EventDispatcher.apply("46:45",this,"getProxyTarget"),index=0;while(index<target){events=EventDispatcher.apply("50:65",EventDispatcher.get("50:41",this,"storage"),"call",[EventDispatcher.get("50:63",target,index)]);if(events&&EventDispatcher.get("51:42",events,EventDispatcher.check("51:41",String,type))){return true;}index++;}EventDispatcher.apply("57:77",System,"log",[System.instanceOf(this,EventDispatcher),'====is even ====']);return false;}},
"addEventListener":{"writable":false,"value":function(type,callback,useCapture,priority,reference){var len=EventDispatcher.get("70:31",type,"length");if(System.instanceOf(type,Array)){while(len>0)EventDispatcher.apply("75:106",this,"addEventListener",[EventDispatcher.get("75:66",type,EventDispatcher.check("75:65",String,--len)),callback,useCapture,priority,reference]);return EventDispatcher.check("76:22",null,this);}if(System.typeOf(type)!=='string'){throw EventDispatcher.new("81:54",Error,['invalid event type.']);}var target=EventDispatcher.apply("84:45",this,"getProxyTarget"),index=0;var listener=newEventDispatcher.new("86:93",EventDispatcher,"Listener",[callback,useCapture,priority,reference]);var bindBeforeProxy;while(index<EventDispatcher.get("89:41",target,"length")){EventDispatcher.set("91:35",listener,"dispatcher",this);EventDispatcher.set("92:38",listener,"currentTarget",EventDispatcher.get("92:52",target,index));EventDispatcher.set("93:29",listener,"type",type);if(!(System.instanceOf(EventDispatcher.get("94:43",bindBeforeProxy,EventDispatcher.check("94:42",String,type)),EventDispatcher.get("94:83",EventDispatcher,"SpecialEvent")))||!EventDispatcher.apply("95:71",EventDispatcher.get("95:51",EventDispatcher.get("95:42",bindBeforeProxy,EventDispatcher.check("95:41",String,type)),"callback"),"call",[this,listener])){}index++;}return EventDispatcher.check("102:18",null,this);}},
"removeEventListener":{"writable":false,"value":function(type,listener){var target=EventDispatcher.apply("114:45",this,"getProxyTarget");var b=0;var removeEventListener;while(b<EventDispatcher.get("117:36",target,"length")){EventDispatcher.apply("119:70",removeEventListener,"call",[EventDispatcher.get("119:50",target,b),type,listener,this]);b++;}return true;}},
"dispatchEvent":{"writable":false,"value":function(event,type){if(!System.is(type,String))System.throwError("type","type of mismatch. must is a String");
var BreezeEvent;var dispatchEvent;if(!(System.instanceOf(event,BreezeEvent)))throw EventDispatcher.new("136:49",Error,['invalid event.']);var target=EventDispatcher.get("137:47",this,'getProxyTarget');var targets=EventDispatcher.apply("138:54",this,'getProxyTargets',[998]);var i=0;var element;EventDispatcher.apply("141:20",target,undefined);while(i<EventDispatcher.get("142:36",target,"length")&&!EventDispatcher.get("142:65",event,"propagationStopped")){element=EventDispatcher.get("144:36",target,i);EventDispatcher.set("145:35",event,"currentTarget",element);EventDispatcher.set("146:28",event,"target",EventDispatcher.get("146:43",event,"target")||element);EventDispatcher.apply("147:38",dispatchEvent,undefined,[event]);i++;}return !EventDispatcher.get("150:44",event,"propagationStopped");}}
}}, false);
})();
(function(){
var EventDispatcher=System.define("lib.EventDispatcher");
var B=System.define("com.B");
var IProsess=System.define("lib.IProsess");
var IProt=System.define("lib.IProt");
var Abs=System.define("com.Abs");
var D=System.define("com.D");
var Main=System.define("Main",{
"constructor":function(jj){Object.defineProperty(this, "1487506122227", {enumerable: false, configurable: false, writable: false, value: {"names":'399999',"uuu":'yhhh',"iu":5,"dd":Array,"_home":'ooooo',"bb":null}});B.constructor.call(this);
var rinningTime=Main.apply("42:52",Main.new("42:42",Date),"getTime");function nnn(cccc,nnnn){if(!System.is(cccc,String))System.throwError("type","type of mismatch. must is a String");
Main.apply("44:47",System,"log",['nnn===nnn',cccc,nnnn]);return Main.check("45:24",String,'');}Main.apply("49:42",System,"log",[Main.apply("49:40",Main.new("49:30",Date),"getTime")]);Main.get("50:23",this,"iu",";++");Main.apply("51:28",System,"log",[Main.get("51:26",this,"iu")]);Main.set("52:21",this,"iu",60);Main.apply("53:28",System,"log",[Main.get("53:26",this,"iu")]);Main.set("54:21",this,"iu",60,"*=");Main.apply("55:28",System,"log",[Main.get("55:26",this,"iu")]);var obj={"name":6666,"address":{"city":'sssss the is city',"uuu":{"name":666},"list":{"name":[2,3.6,69,'5555',{"name":66666,"cccc":{'666':[1.0000005]}}]}},"home":function home(name,phone){if(!System.is(name,String))System.throwError("type","type of mismatch. must is a String");
if(!System.is(phone,Number))System.throwError("type","type of mismatch. must is a Number");
Main.apply("70:51",System,"log",['home fun ',name,phone])},"hhhh":{"n":'sss'},"bbb":Main.get("73:29",this,"iu")};Main.apply("77:50",System,"log",[Main.get("77:48",Main.get("77:43",Main.get("77:43",Main.get("77:35",Main.get("77:30",obj,"address"),"list"),"name"),4),"cccc")]);Main.apply("78:39",System,"log",[Main.delete("78:37",obj,"address","delete")]);Main.apply("79:28",System,"log",[Main.get("79:26",obj,"bbb")]);Main.apply("80:42",System,"log",[Main.apply("80:40",obj,"home",['666pppp',1])]);Main.apply("81:56",System,"log",[Main.apply("81:39",Main.new("81:29",Date),"getTime")-rinningTime]);},
"implements":[IProsess],
"final":false,
"dynamic":false,
"filename":"E:\\webroot\\breezejs\\lib\\Main.as",
"static":{
"name":{"value":'3999 yyy fsss 666'}
},
"token":"1487506122227",
"extends":B,
"classname":"Main",
"package":"",
"isAbstract":false,
"proto":{
"uuu":{"writable":false},
"ddcc":{"writable":false,"value":function(){}},
"_home":{"qualifier":"private"},
"home":{"writable":false,"get":function(){Main.apply("92:65",System,"log",[System.is(this,IProsess),' the is getter home']);return Main.get("93:29",this,"_home");}},
"tests":{"writable":false,"value":function(a){avg=Array.prototype.slice.call(arguments, 1);
if(System.typeOf(a) === "undefined"){a=666;}
if(!System.is(a,Number))System.throwError("type","type of mismatch. must is a Number");
var i;
var bb=666;var tests;if(true){(function(){var yy=666;i=9;if(a){}Main.apply("111:42",System,"log",['===%s',Main]);}).call(this);}Main.apply("113:39",System,"log",[a,avg,i,bb]);return Main.check("114:18",Main,this);}},
"bb":{"qualifier":"private"},
"cre":{"writable":false,"qualifier":"protected","value":function(str){if(!System.is(str,String))System.throwError("type","type of mismatch. must is a String");
Main.apply("121:45",System,"log",[Main.get("121:24",this,"bb"),'====this cre====']);return Main.check("123:18",String,Main.get("123:26",this,"bb"));}},
"database":{"writable":false,"value":function(name,type){if(System.typeOf(name) === "undefined"){name='123';}
if(!System.is(name,String))System.throwError("type","type of mismatch. must is a String");
if(System.typeOf(type) === "undefined"){type=666;}
if(!System.is(type,Number))System.throwError("type","type of mismatch. must is a Number");
return Main.check("128:18",String,'');}}
}}, false);
})();
delete System.define;
var main=System.getDefinitionByName("Main");
System.factory(main);
})(System.Class,System.Interface,System.Number,System.String,System.JSON,System.Object,System.RegExp,System.Error,System.EvalError,System.RangeError,System.ReferenceError,System.SyntaxError,System.TypeError,System.URIError,System.Function,System.Date,System.Boolean,System.Symbol,System.Iterator,System.Reflect,System.Array,System.Math,System.arguments);
})();