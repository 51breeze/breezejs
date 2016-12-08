(function(){


    function checkValueType(desc,value)
    {
        if( desc.type !== '*' )
        {
            var type = typeof value;
            if( desc.type.toLowerCase() !== type && !(value instanceof desc.type) )
                throw new TypeError('error type');
        }
    }

    function makeCall()
    {
        return function(props, refobj, name, param )
        {
            if( !props[name] )throw new TypeError('is not defined');
            if( props[name].id !== 'function' )throw new TypeError('is not function');

            var type = typeof props[name].value;
            if( type ==='object' )
            {
                if( param.length===0 )
                {
                    if( typeof props[name].value.get !== 'function' )throw new TypeError('is not function');
                    return props[name].value.get.call(refobj);

                }else
                {
                    if( typeof props[name].value.set !== 'function' )throw new TypeError('is not function');
                    if( param.length > 1 )throw new TypeError('invalid param');
                    checkValueType( props[name] , param[0] );
                    return props[name].value.set.call(refobj, param[0] );
                }

            }else if( type !=='function' )
            {
                throw new TypeError('is not function');
            }
            return props[prop].value.apply(refobj, param );
        }
    }



    var A = (function(){

        var module;
        var A=function(){
            __call(module,this,'address');
        }

        A.prototype.constructor = constructor;

        module={
            constructor:A,
            proto: {
                address:{
                    'id':'function',
                    'modifier':'public',
                    'value':function (){
                      console.log( 'the is A address')
                    }
                }
            }
        }

        var __call=function(module, thisAvg, prop, param )
        {
           return module.proto[prop].apply(thisAvg, param );
        }
        return module;

    })();


    var B = (function(){

        var __call=function(module, thisAvg, prop, param )
        {
            if( !module.proto[prop] )throw new TypeError('is not defined');
            if( module.proto[prop].id !== 'function' )throw new TypeError('is not function');

            var type = typeof module.proto[prop].value;
            if( type ==='object' )
            {
                if( param.length===0 )
                {
                    if( typeof module.proto[prop].value.get !== 'function' )throw new TypeError('is not function');
                    return module.proto[prop].value.get.call(thisAvg);

                }else
                {
                    if( typeof module.proto[prop].value.set !== 'function' )throw new TypeError('is not function');
                    if( param.length > 1 )throw new TypeError('invalid param');
                    checkValueType( module.proto[prop] , param[0] );
                    return module.proto[prop].value.set.call(thisAvg, param[0] );
                }

            }else if( type !=='function' )
            {
                throw new TypeError('is not function');
            }
            return module.proto[prop].value.apply(thisAvg, param );
        }

        var __prop=function(module, thisAvg, prop, value )
        {
            if( !module.proto[prop] )throw new TypeError('is not defined');
            if( typeof value !== "undefined" )
            {
                if( module.proto[prop].id ==='const' )throw new TypeError('is const');
                checkValueType(  module.proto[prop] , value )
                thisAvg[ prop ] = value;
                return thisAvg;
            }
            return thisAvg[ prop ];
        }

        var module;

        var B=function(){

            __call(module,this,'name');
            __call(module,this,'address');
        }

        var non = function(){};
        non.prototype = A.constructor.prototype;
        B.prototype=new non();
        B.prototype.constructor = B;

        module=(function(B,A,__call){ return {

            'constructor':B,
            'proto':{
                'name':{
                    'id':'function',
                    'modifier':'public',
                    'value':function (){

                        console.log( 'the is A name')
                        console.log( this instanceof A )
                        console.log( __call )
                        __call(module,this,'address');

                    }
                },
                'age':{id:'var', 'modifier':'private', type:'String', 'value':'30'},
            },
            'inherit':'A',
            'implements':'J,K',

        }})(B,A.constructor,__call);

        module.proto.address=A.proto.address

        return module;

    })();



    new B.constructor();





})()


