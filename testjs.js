(function(){

    const System = require('./compiler/lib/System.js');
    const Class = System.Class;
    const Object = System.Object;
    const getDefinitionByName = System.getDefinitionByName;
    const getQualifiedClassName = System.getQualifiedClassName;

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
        if( !thisArg )throwError('reference', '"'+propname+( thisArg===null ? '" is null' : '" is not defined') );
        var isStatic = typeof thisArg === "function";
        var referenceModule = thisArg.constructor.descriptor.extends === classModule ? classModule : thisArg.constructor;
        var desc = isStatic ? referenceModule.properties[propName] : referenceModule.prototype.properties[ propName ];

        //如果本类中没有定义则在在扩展的类中依次向上查找。
        if( !desc && referenceModule.descriptor.extends )
        {
             var  parentModule =  referenceModule.descriptor.extends;
             while ( parentModule )
             {
                 var description =  isStatic ? parentModule.properties : parentModule.prototype.properties;
                 if( description[propName] )
                 {
                     desc = description[propName];
                     referenceModule= parentModule;
                     if( desc.qualifier === 'private' )desc = null;
                     break;
                 }
                 parentModule = parentModule.descriptor.extends;
             }
        }

        if( !desc )throwError('reference', '"'+propname+'" is not defined' );

        //不是public限定符则检查是否可访问
        if( desc.qualifier !== 'public' )
        {
            //不是本类中的成员调用（本类中的所有成员可以相互调用）
            if( referenceModule !== classModule )
            {
                var is= false;
                if( desc.qualifier === 'internal' )
                {
                    is = referenceModule.descriptor.package === classModule.descriptor.package;

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
        if(thisArg)
        {
            if (thisArg instanceof Class)
            {
                var desc = getPropertyDescription(thisArg, propName, classModule, propname);

                //如果引用的属性是一个存储器
                if (desc.id === 'function' && typeof desc.value === "object")
                {
                    if (typeof desc.value.get !== 'function')throw new TypeError('Accessor getter does not exist');
                    thisArg = desc.value.get.call(thisArg);

                } else if (desc.id === 'var' || desc.id === 'const')
                {
                    thisArg = thisArg[ classModule.descriptor.token ][propName];

                } else
                {
                    thisArg = desc.value;
                }

            } else
            {
                thisArg = thisArg[ propName ];
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
    function makeCall(classModule)
    {
        return function(thisArg, propnames, args, iscall )
        {
            var desc;
            var value;
            var propname = propnames.join('.');
            var lastProp = propnames.pop();

            //获取实例引用
            for (var i = 0; i < propnames.length && thisArg; i++)
            {
                thisArg = getReferenceValueByPropName(propnames[i], thisArg, classModule, propname);
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
                value = thisArg[lastProp];
            }

            //调用方法
            if ( iscall )
            {
                if (typeof value !== 'function')throwError('type', '"' + propname + '" is not function');
                return value.apply(thisArg, args);
            }

            //是否需要设置值
            var isset = typeof args !== "undefined";

            //如是是对全局类的属性操作
            if (!desc) 
            {
                if (!isset)return value;
                if ( !Object.prototype.hasOwnProperty.call(thisArg, lastProp) )
                    throwError('reference', '"' + propname + '" property does not exist');
                try {
                    thisArg[lastProp] = args;
                    if (thisArg[lastProp] !== args)throwError('Cannot be set');
                } catch (e) {
                    throwError('reference', '"' + propname.join('.') + '" property cannot be set');
                }
                return undefined;
            }

            //是否为一个访问器
            var isaccessor = desc && desc.id === 'function' && typeof value === 'object';

            if (isaccessor)
            {
                value = isset ? value.set : value.get;
                if (typeof value !== 'function')throw new throwError('reference', '"' + propname + '" Accessor ' + (isset ? 'setter' : 'getter') + ' does not exist');
            }
            //对属性的引用
            else if (desc.id === 'var' || desc.id === 'const')
            {
                value = thisArg[ classModule.descriptor.token ];
            }

            //对属性引用进行赋值操作
            if (isset)
            {
                if (desc.id !== 'var' && !isaccessor)
                {
                    throwError('type', '"' + propname + ( desc.id === 'const' ? '" cannot be alter of constant' : '" cannot modify the class function' ));
                }

                //检查属性的类型是否匹配
                if (!checkValueType(desc, args))
                {
                    throwError('type', '"' + propname + '" can only be a (' + getQualifiedClassName(desc.type) + ')');
                }

                //对属性引用进行赋值操作
                isaccessor ? value.call(thisArg, args) : ( value[lastProp] = args );
                return undefined;
            }

            //获取属性引用的值
            return isaccessor ? value.call(thisArg) : value[lastProp];
        }
    }


    +(function(){

        var __call;
        var Aa = System.makeClass({
            'constructor': function Aa()
            {
                this['5698776955']={'_address':'5林要5555 9999 the is Aa test '};
            },
            'token':5698776955,
            'classname':'Aa',
            'package':'',
        },{
            'test': {
                id:'function',
                'qualifier': 'protected',
                'value': function () {
                    console.log('the is Aa test')
                    console.log( __call(this,['_address']) );
                }
            } ,
            '_address': {'id': 'var', 'qualifier': 'private', 'value': '5林要5555', 'type': String},
            'access': {
                id:'function',
                'qualifier': 'internal',
                'value': function () {
                    console.log('the is Aa access')
                }
            }
        });

        __call = makeCall( Aa );


    })();




   +(function(){

       var __call;
       var Aa = getDefinitionByName('Aa');
       var A = System.makeClass({
           'constructor': function A()
           {
               Aa.call(this);
               this['5698777']={'_address':'5林要5555 9999'};
           },
           'token':5698777,
           'extends':Aa,
           'classname':'A',
           'package':'',
       },{
           '_address': {'id': 'var', 'qualifier': 'private', 'value': '5林要5555', 'type': String},
           'address': {
               id:'function',
               'qualifier': 'protected',
               'value': function ( val ) {
                   console.log('the is A address ++'+ val )
                   console.log( __call(this,['_address']) );
                   __call(this,['access'],null, true)

               }
           }
       });
       __call = makeCall( A );

    })();

    +(function(){

        var A = getDefinitionByName('A');
        var __call;
        function B(){
            A.call(this);
            this['123456']={
                'gen':'305666',
                'age':'30',
            };

            this.call = makeCall( B );

            var ret = __call(this , ['name'], null, true );

        }
        System.makeClass({
            'constructor':B ,
            'token':123456,
            'extends':A,
            'implements':'Iapi',
            'classname':'B',
            'filename':'com.B',
            'package':'com',
            'final':false,
            'dynamic':false,
            'static':false,
        },{
            age:{'id':'var','qualifier':'protected','value':'30','type':Number},
            gen:{'id':'var','qualifier':'private','value':'305666','type':String},
            gril:{id:'function','qualifier':'public',type:Number,value:{set:function (value) {
                console.log( 'the is a gril accessor set value:'+value );
                __call(this,['age'], value );


            },get:function () {

                console.log( 'the is a gril accessor get' )
                return __call(this,['age'] );
            }}},

            name:{
                'id':'function',
                'qualifier':'public',
                'value':function (){

                    console.log( this.call() )

                    console.log( 'this is name funciton' )
                    __call(this, ['age'], 50 )
                    console.log(  __call(this,['age'] ) )
                 //   console.log(  __call(this, ['_address'] ) )
                    __call(this,['address'], [9999], true )
                    __call(this,['gril'] , 90 )
                    console.log( __call(this, ['gril'] ) )

                    var b =  new A();
                    __call(b, ['address'],[], true )
                    __call(b, ['test'],[] , true )
                    console.log( '====' )

                }
            },
        });


        __call = makeCall( B );

      //  console.log( B.constructor.prototype._address  )

        var b =  new B();

    })();


})();

