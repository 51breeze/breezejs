(function(){

    const System = require('./compiler/lib/System.js');
    const Class = System.Class;
    const Object = System.Object;
    const module = System.registerClassModule;
    const getDefinitionByName = System.getDefinitionByName;
    const getQualifiedClassName = System.getQualifiedClassName;
    const getQualifiedSuperclassName = System.getQualifiedSuperclassName;

    function inherit(proto,props)
    {
        //if(proto)Class.prototype = proto;
        var classObj = new Class();
        if ( props )
        {
            for (var p in props)if( Object.prototype.hasOwnProperty.call(props, p) )
            {
                classObj[p] = props[p];
            }
        }
        return classObj;
    };

    /**
     * 检查值的类型是否和声明时的类型一致
     * @param description
     * @param value
     */
    function checkValueType(description,value, propname )
    {
        if( description.type !== '*' )
        {
            var type = typeof value;
            if( description.type.toLowerCase() !== type )
            {
                if( typeof description.type !=='object' || !( description.type instanceof value ) )
                {
                    throwError('type', '"'+propname+'" type error. '+ description.type );
                }
            }
        }
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
        if( !desc )throwError('reference', '"'+propname+'" is not defined' );

        //不是public限定符则检查是否可访问
        if( desc.qualifier !== 'public' )
        {
            //不是本类中的成员调用（本类中的所有成员可以相互调用）
            if( !(thisArg instanceof classModule.constructor) )
            {
                var is= false;
                if( desc.qualifier !== 'private' )
                {
                    var classname = desc.qualifier === 'protected' ? classModule.inherit : getQualifiedClassName( thisArg );
                    var classObj =  module( classModule.import( classname ) );
                    if( classObj && ( desc.qualifier === 'protected' || classObj.package === classModule.package) )
                    {
                        is = thisArg instanceof classObj.constructor;
                    }
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

            for( var i = 0; i < propNames.length && thisArg ; i++ )
            {
                thisArg = getReferenceValueByPropName( propNames[i], thisArg, classModule, propname );
            }

            //本地类属性引用
            if( thisArg instanceof Class )
            {
                desc = getPropertyDescription(thisArg, lastProp, classModule);
                value = desc.value;
            }
            //全局类属性引用
            else {
                value=thisArg[ lastProp ];
            }

            //调用方法
            if( flag )
            {
                if( typeof value !=='function' )throwError('type','"'+propname.join('.')+'" is not function');
                return value.apply(thisArg, args );
            }

            //是否需要设置值
            var isset = typeof args === "undefined" || args instanceof Array && args.length===0  ? false :  true ;

            //如是是对全局类的属性操作
            if( !desc )
            {
                if( !isset )return value;
                if( !hasOwnProperty(thisArg, lastProp) )throwError('reference','"'+propname.join('.')+'" property does not exist');
                thisArg[ lastProp ] = args[0];
                if( thisArg[ lastProp ] !== args[0] )throwError('reference','"'+propname.join('.')+'" property cannot be set');
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
                value = thisArg[classModule.uid];
            }

            //对属性引用进行赋值操作
            if (isset)
            {
                if( desc.id !=='var' && !isaccessor )
                {
                    throwError('type', '"' + propname + ( desc.id === 'const' ? '" cannot be alter of constant' : '" cannot modify the class function' ) );
                }

                var v = args instanceof Array ? args[0] : args;

                //检查属性的类型是否匹配
                checkValueType( desc, v, propname );

                //对属性引用进行赋值操作
                isaccessor ? value.call(thisArg, v ) : (value[lastProp] =v );
                return undefined;
            }

            //获取属性引用的值
            return isaccessor ? value.call(thisArg) : value[lastProp];
        }
    }


    module('com.A', (function(){

        var A=function(){
            this.name='this is a';
            this[5698777]={
                '_address':'5林  要55   5 5 '
            };
        };

        var description={
            'constructor':A,
            'uid':5698777,
            'inherit':'',
            'implements':'',
            'classname':'A',
            'filename':'com.A',
            'package':'com',
            'import':function( type ){
                return globals[type];
            }
        };

        var __call=makeCall( description );
        A.prototype = inherit(null, {
            '_address':{'id':'const','qualifier':'private','value':'5林  要55   5 5 '},
            address:{
                'id':'function',
                'qualifier':'protected',
                'value':function (){

                    console.log( 'the is A address')
                    console.log( __call(this, ['_address'] ) );
                }
            }
        })
        A.prototype.constructor = A;
        return A;

    }()));

    module('com.B', (function(){

        var A = getDefinitionByName('com.A');
        var B=function(){

            this['123456']={
                'gen':'305666',
                'age':'30',
            };

            var ret =   __call( this ,['name'], [], true );
            //console.log( ret )

        };


        var description={
            'constructor':B,
            'uid':123456,
            'inherit':'A',
            'implements':'Iapi',
            'classname':'B',
            'filename':'com.B',
            'package':'com',
            'import':function( type ){
                if( typeof type  !=='string' )return null;
                var map={'A':'com.A'};
                if( map[type] )return map[type];
                for(var i in map )if( map[i] === type )return map[i];
                return globals[type];
            }
        };

        var __call=makeCall( description );
        B.prototype=inherit(A.prototype, {
            age:{'id':'var','qualifier':'protected','value':'30',type:'String'},
            gen:{'id':'var','qualifier':'private','value':'305666',type:'String'},
            name:{
                'id':'function',
                'qualifier':'public',
                'value':function (){

                       console.log( 'this is name funciton')
                       console.log(  __call(this, ['age'] ) )

                        //  var aa = new A();
                       //  __call(aa, ['address'],[], true)


                }
            },
        });
        B.prototype.constructor = B;

        var b = new B() ;

        __call(b, ['age'], "40" )
        __call(b, ['age'], "50" )

       var bb =  new B() ;

        __call(bb, ['age'], "80" )

       console.log( __call(b, ['age'] ) ,'=====')
       console.log( __call(bb, ['age'] ) ,'=====')

        return B;

    })());

   // var B = module('com.B').constructor;
   // var b = new B() ;




})()

