(function(){


    var inherit = (function() {

        var fn = function(){}
        var has = Object.prototype.hasOwnProperty;
        return function (proto,props)
        {
            if( typeof proto !== 'object' )throw TypeError('Object prototype may only be an Object or null');
            fn.prototype = proto;
            var obj = new fn();
            fn.prototype = null;
            if ( props )
            {
                props = Object( props );
                for (var p in props)if( has.call(props, p) )
                {
                    obj[p] = props[p];
                }
            }
            return obj;
        };

    })();

    var packages={};
    function require(name, value)
    {
        var path = name.replace(/\s+/g,'').split('.');
        var deep=0;
        var obj=packages;
        var last = path.pop();
        var len =path.length;
        while(deep < len )
        {
            obj = obj[ path[deep] ] || (obj[ path[deep] ]={});
            deep++;
        }
        return typeof value !== "undefined" ? obj[last]=value : obj[last];
    }

    /**
     * 根据指定的类名获取类的对象
     * @param name
     * @returns {Object}
     */
    function getDefinitionByName(name)
    {
        var value = require( name );
        if( !value )return null;
        return value.constructor;
    }

    /**
     * 获取指定实例对象的类名
     * @param value
     * @returns {string}
     */
    function getQualifiedClassName( value )
    {
       return value.classname;
    }

    /**
     * 获取指定实例对象的超类名称
     * @param value
     * @returns {string}
     */
    function getQualifiedSuperclassName(value)
    {
        return value.inherit;
    }

    /**
     * 检查值的类型是否和声明时的类型一致
     * @param description
     * @param value
     */
    function checkValueType(description,value)
    {
        if( description.type !== '*' )
        {
            var type = typeof value;
            if( description.type.toLowerCase() !== type && !(value instanceof description.type) )
                throw new TypeError('error type');
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
     * 获取成员的引用
     * @param thisArg
     * @param propNames
     * @param classModule
     * @returns {*}
     */
    function getPropertyDesc(thisArg, propNames, classModule)
    {
        var i = 0;
        var desc = thisArg;
        while ( i < propNames.length )
        {
            desc = desc[ propNames[i] ];
            if( !desc )return desc;

            if( desc.qualifier === 'private' && !(thisArg instanceof classModule.constructor) )
            {
                throwError('reference', '"' + propNames.join('.') + '" inaccessible.');
            }

            if( desc.id==='var' || desc.id==='const' )
            {
                var value = desc.qualifier === 'private' ? thisArg[ classModule.uid ][ propNames[i] ] : thisArg[ propNames[i] ];
                if( !value )return value;
                if( desc.type && desc.type !=='*' )
                {
                    var type = classModule.import( desc.type );
                    if( !type )throwError('type', '"'+desc.type+'" is not defined');
                    if( value )
                    {
                        thisArg=value;
                        classModule=type;
                    }
                }
                desc = value;
            }
        }
        return desc;
    }

    /**
     * 生成一个调用函数的方法
     * @param classModule
     * @returns {Function}
     */
    function makeCall( classModule )
    {
        return function(thisArg, propNames, args , flag )
        {
            var desc = getPropertyDesc(thisArg, propNames, classModule );

            if( !thisArg[method] )throwError('reference','is not defined');
            if( thisArg[method].id !== 'function' )throwError('type','is not function');

            var type = typeof thisArg[method].value;
            if( type ==='object' )
            {
                if( args.length===0 )
                {
                    if( typeof thisArg[method].value.get !== 'function' )throw new TypeError('is not function');
                    return thisArg[method].value.get.call(thisArg);

                }else
                {
                    if( typeof thisArg[method].value.set !== 'function' )throw new TypeError('is not function');
                    if( args.length > 1 )throw new TypeError('invalid param');
                    checkValueType( thisArg[method] , args[0] );
                    return thisArg[method].value.set.call(thisArg, args[0] );
                }

            }else if( type !=='function' )
            {
                throw new TypeError('is not function');
            }
            return thisArg[method].value.apply(thisArg, args );
        }
    }


    require('A',[], function(){

        var module={
            'uid':5698777,
            'inherit':'',
            'implements':'',
            'classname':'A',
            'filename':'com.A',
        };

        var __call=makeCall( module );
        var A=function(){
            __call(this,'address');
        }

        module.constructor = A;
        A.prototype.constructor = A;
        A.prototype.address={
            'id':'function',
            'qualifier':'public',
            'value':function (){
                console.log( 'the is A address')
            }
        }
        return module;
    });



    var B = (function(){

        var module={
            'uid':123456,
            'inherit':'A',
            'implements':'Iapi',
            'classname':'B',
            'filename':'com.B',
            'import':function( type ){}
        };

        var __call=makeCallFun( module );




        var B=function(){

            __call(module,this,'name');
            __call(module,this,'address');
        }

        module.constructor = B;

        var non = function(){};
        non.prototype = A.constructor.prototype;
        B.prototype=new non();
        B.prototype.constructor = B;
        B.prototype.age={'id':'var','qualifier':'private','value':'30',type:'String'};
        B.prototype.gen={'id':'var','qualifier':'protected','value':'5666',type:'String'};
        B.prototype.name={
            'id':'function',
            'modifier':'public',
            'value':function (){

                console.log( 'the is A name')
                console.log( this instanceof A )
                console.log( __call )
                __call(module,this,'address');
                __call(this,['gend','replace'],['5','-']);
                __call(__call(this,['gend','replace'],['5','-']) ,['replace'],['6','+']);

            }
        }
        return module;

    })();



    new B.constructor();





})()


