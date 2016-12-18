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
        var isStatic = typeof thisArg === "function";
        var referenceModule = isStatic ? thisArg : thisArg.constructor;
        var desc = isStatic ? referenceModule.properties[propName] : referenceModule.prototype.properties[ propName ];

        //如果本类中没有定义则在在扩展的类中依次向上查找。
        if( !desc && referenceModule.descriptor.extends )
        {
             var  parentModule =  referenceModule.descriptor.extends;
             while ( parentModule )
             {
                 var description =  isStatic ? parentModule.properties : parentModule.prototype.properties;

                 //继承的属性，私有的路过.
                 if( description[propName] && description[propName].qualifier !== 'private' )
                 {
                     desc = description[propName];
                     referenceModule= parentModule;
                     break;
                 }
                 parentModule = parentModule.descriptor.extends;
             }
        }

        if( !desc )throwError('reference', '"'+propname+'" is not defined' );

        //不是public限定符则检查是否可访问
        if( desc.qualifier && desc.qualifier !== 'public' )
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
    function getReferenceValueByPropName(propName, thisArg, storage, classModule, propname )
    {
        if (thisArg instanceof Class || thisArg.prototype instanceof Class )
        {
            var desc = getPropertyDescription(thisArg, propName, classModule, propname);
            //如果引用的属性是一个存储器
            if (desc.id === 'function' && typeof desc.value === "object")
            {
                if (typeof desc.value.get !== 'function')throw new TypeError('"'+propname+'" getter does not exist');
                return desc.value.get.call(thisArg);

            } else if ( desc.id === 'var' || desc.id === 'const' )
            {
                return storage[propName];
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
    function makeCall( storage, classModule )
    {
        return function(propnames, args, iscall )
        {
            var desc;
            var value;
            var propname = propnames;
            var lastProp = propnames;
            var thisArg = this;
            if( typeof propnames !== "string" )
            {
                propname = propnames.join('.');
                lastProp = propnames.pop();
                if (propnames.length > 0)
                {
                    var i = 0;
                    //获取实例引用
                    while (i < propnames.length && thisArg) {
                        thisArg = getReferenceValueByPropName(propnames[i++], thisArg, storage, classModule, propname);
                    }
                }
            }

            if( !thisArg )throwError('reference', '"'+propname+( thisArg===null ? '" is null' : '" is not defined') );

            //全局类属性引用
            value = thisArg[lastProp];

            //本地类属性引用描述说明
            if( thisArg instanceof Class || thisArg.prototype instanceof Class )
            {
                desc = getPropertyDescription(thisArg, lastProp, classModule, propname);
                value = desc.value;
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
                value = storage;
            }

            //对属性引用进行赋值操作
            if (isset)
            {
                if( desc.id !== 'var' && !isaccessor )
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

        var Aa = System.makeClass({
            'constructor': function Aa()
            {
                this.aa = makeCall({'_address':'5林要5555 9999'}, Aa );
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
                    console.log( this.aa(['_address']) );
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

    })();




   +(function(){

       var Aa = getDefinitionByName('Aa');

       var storage={iioo:'6==static iioo'};
       var iioo = function (value) {
           if( typeof value === "undefined" )return storage['iioo'];
           storage['iioo'] = value;
       }

       var A = System.makeClass({
           'constructor': function A()
           {
               Aa.call(this);
               this.a = makeCall({'_address':'5林要5555 9999'}, A );
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
                   console.log( this.a(['_address']) );
                   this.a(['access'],null, true)

               }
           }
       },{
           'iioo':{'id':'var',value:iioo}
       });

    })();

    +(function(){

        var A = getDefinitionByName('A');


        function B(){

            A.call(this);
            this.b = makeCall( {'gen':'305666', 'age':'30'}, B );
            var ret = this.b(['name'], null, true );
        }

        var storage={name:'6==static'};
        var name = function (value) {
            if( typeof value === "undefined" )return storage['name'];
            storage['name'] = value;
        }

        var iioo = A.properties.iioo.value;



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
            gen:{'id':'var','qualifier':'private','value':null,'type':A},
            gril:{id:'function','qualifier':'public',type:Number,value:{set:function (value) {

                console.log( 'the is a gril accessor set value:'+value );
                this.b(['age'], value)

            },get:function () {

                console.log( 'the is a gril accessor get' )
                return this.b(['age'] );

            }}},

            name:{
                'id':'function',
                'qualifier':'public',
                'value':function (){

                  /*  console.log( 'this is name funciton' )
                    this.b(['age'], 50 )
                    console.log(   this.b(['age'] ) )
                 //   console.log(  __call(this, ['_address'] ) )
                    this.b(['address'], [9999], true )
                    this.b(['gril'] , 90 )
                    console.log( this.b(['gril'] ) )

                    var b =  new A();
                    this.b(['gen'],b )*/

                    //console.log(  this.b( ['gen','address'],['999999==6---=='], true ) )
                    iioo('============')
                    console.log( iioo() ,'=====')

                }
            },
        },{
            'name':{'id':'var',value:name},
        });

        var b =  new B();

    })();


})();

