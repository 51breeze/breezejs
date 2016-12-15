(function(){

    const System = require('./compiler/lib/System.js');
    const Class = System.Class;
    const Object = System.Object;
    const getDefinitionByName = System.getDefinitionByName;
    const getDefinitionDescriptorByName = System.getDefinitionDescriptorByName;
    const getQualifiedClassName = System.getQualifiedClassName;
    const getQualifiedSuperclassName = System.getQualifiedSuperclassName;

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
                    result = description.type === Object ? true : (description.type === Class ? value instanceof Function : value instanceof description.type);
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
        if( !thisArg )throwError('reference', '"'+propname+( thisArg===null ? '" is null' : '" is not defined') );
        var desc = thisArg[ propName ];

        //如在目标对象上没有定义则引用扩展的类, 直到没有定义的扩展类为止。
        if( !desc && classModule.inherit )
        {
            var extendModule = classModule.inherit;
            while ( extendModule )
            {
                if( extendModule.prototype[ propName ] )
                {
                    desc= extendModule.prototype[ propName ];
                    break;
                }
                extendModule = extendModule.inherit;
            }
        }

        if( !desc )throwError('reference', '"'+propname+'" is not defined' );

        //不是public限定符则检查是否可访问
        if( desc.qualifier !== 'public' )
        {
            //不是本类中的成员调用（本类中的所有成员可以相互调用）
            if( !(thisArg instanceof classModule.constructor) )
            {
                var is= false;
                if( desc.qualifier === 'internal' )
                {
                    var classObj = getDefinitionDescriptorByName( getQualifiedClassName( thisArg ) );
                    is = classObj.package === classModule.package;

                }else if( desc.qualifier === 'protected' && classModule.inherit )
                {
                    is = thisArg instanceof classModule.inherit;
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
        if(thisArg)
        {
            if (thisArg instanceof Class)
            {
                var desc = getPropertyDescription(thisArg, propName, classModule, propname);
                //如果引用的属性是一个存储器
                if (desc.id === 'function' && typeof desc.value === "object") {
                    if (typeof desc.value.get !== 'function')throw new TypeError('Accessor getter does not exist');
                    thisArg = desc.value.get.call(thisArg);
                } else if (desc.id === 'var' || desc.id === 'const') {
                    thisArg = desc.qualifier === 'private' ? thisArg[classModule.uid][propName] : thisArg[propName];
                } else {
                    thisArg = desc.value;
                }
            } else {
                thisArg = thisArg[propName];
            }
        }
        if( !thisArg )throwError('reference', '"'+propname+( thisArg===null ? '" is null' : '" is not defined') );
        return thisArg;
    }

    /**
     * 生成一个调用函数的方法
     * @param classModule
     * @returns {Function}
     */
    function makeCall( classModule )
    {
        return function( thisArg, propNames, args , flag )
        {
            var desc;
            var value;
            var propname = propNames.join('.');
            var lastProp = propNames.pop();

            //获取实例引用
            for( var i = 0; i < propNames.length && thisArg ; i++ )
            {
                thisArg = getReferenceValueByPropName( propNames[i], thisArg, classModule, propname );
            }

            //本地类属性引用描述说明
            if( thisArg instanceof Class )
            {
                desc = getPropertyDescription(thisArg, lastProp, classModule, propname);
                value = desc.value;
            }
            //全局类属性引用
            else
            {
                value=thisArg[ lastProp ];
            }

            //调用方法
            if( flag )
            {
                if( typeof value !=='function' )throwError('type','"'+propname.join('.')+'" is not function');
                return value.apply(thisArg, args );
            }

            //是否需要设置值
            var isset = typeof args !== "undefined";

            //如是是对全局类的属性操作
            if( !desc )
            {
                if( !isset )return value;
                if( !Object.prototype.hasOwnProperty.call(thisArg,lastProp) )throwError('reference','"'+propname.join('.')+'" property does not exist');
                try{
                    thisArg[ lastProp ] = args;
                    if( thisArg[ lastProp ] !== args )throwError('Cannot be set');
                }catch (e)
                {
                    throwError('reference','"'+propname.join('.')+'" property cannot be set');
                }
                return undefined;
            }

            //是否为一个访问器
            var isaccessor = desc.id === 'function' && typeof value === 'object';
            if (isaccessor)
            {
                value = isset ? value.set : value.get;
                if (typeof value !== 'function')throw new throwError('reference', '"' + propname + '" Accessor ' + (isset ? 'setter' : 'getter') + ' does not exist');
            }
            //对属性的引用
            else if (desc.id === 'var' || desc.id==='const')
            {
                value = thisArg[ classModule.token ];
            }

            //对属性引用进行赋值操作
            if (isset)
            {
                if( desc.id !=='var' && !isaccessor )
                {
                    throwError('type', '"' + propname + ( desc.id === 'const' ? '" cannot be alter of constant' : '" cannot modify the class function' ) );
                }

                //检查属性的类型是否匹配
                if( !checkValueType( desc, args) )
                {
                    throwError('type', '"'+propname+'" can only be a ('+ getQualifiedClassName(desc.type)+')' );
                }

                //对属性引用进行赋值操作
                isaccessor ? value.call(thisArg, args ) : ( value[lastProp]=args );
                return undefined;
            }

            //获取属性引用的值
            return isaccessor ? value.call(thisArg) : value[lastProp];
        }
    }


   +(function(){

        var __call;
        function A(){
            this['5698777']={'_address':'5林要5555'}
        };

       var descriptor = Class({
           'constructor':A,
           'token':5698777,
           'inherit':null,
           'implements':null,
           'classname':'A',
           'package':'com',
           'final':false,
           'dynamic':false,
           'static':false,
           'import':{},
           'descriptor':{
               'proto': {
                   '_address': {'id': 'var', 'qualifier': 'private', 'value': '5林要5555', 'type': String},
                   'address': {
                       'qualifier': 'protected',
                       'value': function () {
                           console.log('the is A address')
                           console.log(__call(this,descriptor,['_address']));
                       }
                   }
               },
               'static':{
               }
           }
       });
        __call=makeCall(descriptor);

    })();

    +(function(){

        var A = getDefinitionByName('com.A');
        var __call;
        function B(){

            this['123456']={
                'gen':'305666',
                'age':'30',
            };
            var ret = __call( this ,['name'], [], true );
            //console.log( ret )
        };

        __call=makeCall(Class({
            'constructor':B,
            'token':123456,
            'inherit':A,
            'implements':'Iapi',
            'classname':'B',
            'filename':'com.B',
            'package':'com',
            'final':false,
            'dynamic':false,
            'static':false,
            'import':{'A':A}
        },{
            age:{'id':'var','qualifier':'protected','value':'30','type':Number},
            gen:{'id':'var','qualifier':'private','value':'305666','type':String},
            name:{
                'qualifier':'public',
                'value':function (){
                    console.log( 'this is name funciton')
                    console.log(  __call(this, ['age'], 50 ) )
                    console.log(  __call(this, ['age'] ) )
                    console.log(  __call(this, ['address'],[], true ) )
                }
            },
        }));

        var b =  new B();





    })();


})();

