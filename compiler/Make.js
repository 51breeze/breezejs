const fs = require('fs');
const root = process.cwd();
const QS = require('querystring');
const PATH = require('path');
const Ruler = require('./Ruler.js');
const globals=require('./lib/Globals.js');
const config = {'suffix':'.as','main':'Main','root':root,'cache':'off','cachePath':'./cache','debug':'on', 'browser':'enable','globals':globals };
const modules={};

/**
 * 全局模块
 * @param name
 * @returns {{}}
 */
function module(name, module)
{
    var path = name.replace(/\s+/g,'').split('.');
    var classname = path.pop();
    var deep=0;
    var obj=modules;
    var len =path.length;
    while(deep < len )
    {
        name = path[deep];
        obj = obj[ name ] || (obj[ name ]={});
        deep++;
    }
    if( typeof module === 'object' )
    {
        obj[ classname ] = module;
        return module;
    }
    return obj[ classname ] || globals[classname] || null;
}


/**
 * 返回文件的路径
 * @param file
 * @param lib
 * @returns {*}
 */
function pathfile( file, suffix , lib)
{
    lib = lib || config.lib;
    suffix = suffix || config.suffix;
    return  PATH.resolve(lib, file.replace('.',PATH.sep) + suffix );
}

/**
 * 去掉两边的空白
 * @param str
 * @returns {string|void|XML}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
}

/**
 * 合并对象
 * @returns {*}
 */
function merge()
{
    var target = arguments[0];
    var len = arguments.length;
    for(var i=1; i<len; i++ )
    {
        var item = arguments[i];
        for( var p in item )
        {
            if( Object.prototype.isPrototypeOf( item[p] ) && Object.prototype.isPrototypeOf( target[p] ) )
            {
                target[p] = merge( target[p],  item[p] );
            }else{
                target[p] = item[p];
            }
        }
    }
    return target;
}

/**
 * 获取模块全名
 * @param a
 * @param b
 * @returns {string}
 */
function getModuleName(a, b)
{
    return a ? a+'.'+b : b;
}

/**
 * 创建默认参数
 * @param stack
 * @returns {{param: Array, expre: Array}}
 */
function createDefaultParam( stack , module)
{
    var data = stack.content();
    var obj = {'param':[],'expre':[]};
    var name;
    var type='*';
    var value;

    for ( var j=0; j< data.length ; j++ )
    {
        var item = data[j];
        if( item instanceof  Ruler.STACK )
        {
            var o = createDefaultParam( item, module );
            obj.param = obj.param.concat( o.param );
            obj.expre = obj.expre.concat( o.expre );

        }else if( item && item.value!==',' )
        {
            if( j===0 ) name = item.value;
            if( item.value === ':' )type = data[++j].value;
            if( item.value === '=' )
            {
                item = data[++j];
                value = item instanceof  Ruler.STACK ? toString(item, module) : item.value;
            }
        }
    }

    if( name )
    {
        var ps = stack.scope();
        var desc = ps.define( name );

        if (value)
        {
            obj.expre.push(name + '=typeof ' + name + '=== "undefined" ?' + value + ':' + name+';\n');
        }

        if (desc)
        {
            type = desc.type.replace(/^\(|\)$/g,'');
            if( type !=='*' )
            {
                obj.expre.push('if( typeof ' + name + ' !== "' +type.toLowerCase() + '" )throw new TypeError("Specify the type of mismatch");\n');
            }
        }
        obj.param.push( name );
    }
    return obj;
}


/**
 * 生成函数
 * @param stack
 * @returns {string}
 */
function createFunction( stack,module )
{
    var children = stack.content();
    var i=0;
    var len = children.length;
    var content=[];
    var param;
    var is = stack.parent().keyword()==='class' && stack.parent().name() === stack.name();

    for(;i<len; i++)
    {
        var child = children[i];
        if( child instanceof Ruler.STACK )
        {
            if( child.keyword() === 'statement' )
            {
                param = createDefaultParam( child, module );
                content.push( param.param.join(',') );

            }else
            {
                content.push( toString(child,module) );
            }
        }
        //获取函数的默认参数
        else
        {
            content.push( child.value );
            if( child.id==='(keyword)' && i<len )content.push(' ');
            if ( child.value === '{' )
            {
                //运行时检查参数的类型是否正确
                if( param )
                {
                    content.push( param.expre.join('') );
                    param=null;
                }

                //构造函数
                if( is )
                {
                    //运行时检查实例对象是否属于本类
                    content.push( 'if( !(this instanceof '+stack.name()+') )throw new SyntaxError("Please use the new operation to build instances.");\n' );

                    //如果没有调用超类，则调用超类的构造函数
                    if( stack.parent().extends() && !stack.called )
                    {
                        content.push( stack.parent().extends() + '.call(this);\n');
                    }

                    //类中的私有属性
                    content.push('####{props}####');
                }
            }
        }
    }
    return content.join('');
}


function typeToIdentifier( type )
{
    return type.replace('.','');
}


/**
 * 创建属性的描述
 * @param stack
 * @returns {string}
 */
function createDescription(stack )
{
    var desc = {};
    desc['id'] =stack.keyword();
    desc['type'] = getType( stack.type() );
    desc['privilege'] =stack.qualifier();
    if( stack.final() )
    {
        desc['final'] =stack.final();
    }
    if( stack.override() )
    {
        desc['override'] =stack.override();
    }
    if( stack.keyword() === 'function' &&  stack.param().length > 0 )
    {
        desc['param'] =stack.param().join('","');
    }
    return desc;
}

/**
 * 抛出错误信息
 * @param msg
 * @param type
 */
function error(msg, type, obj )
{
    if( obj )
    {
        console.log('error line:',obj.line, ' characters:', obj.cursor );
    }
    switch ( type )
    {
        case 'syntax' :
            throw new SyntaxError(msg);
            break;
        case 'reference' :
            throw new ReferenceError(msg);
            break;
        case 'type' :
            throw new TypeError(msg);
            break;
        default :
            throw new Error(msg);
    }
}

/**
 * 获取类型
 * @param type
 * @returns {string}
 */
function getType( type )
{
   if(type==='*' || type==='void')return type;
   return typeof type=== "string" ? type.replace(/^\(|\)$/g,'') : '';
}


/**
 * 迭代器
 * @param data
 * @constructor
 */
function Iteration( stack )
{
    var index=0;
    this.stack = stack;
    this.index=index;
    this.data=stack.content().slice(0);
    this.prev=undefined;
    this.next=undefined;
    this.current=undefined;
    stack.returnValues=[];
    this.seek=function(){
        if( index >= this.data.length )
        {
            this.next = undefined;
            return false;
        }
        this.prev = this.current;
        this.current = this.data[index];
        index++;
        this.next = this.data[index];
        return true;
    };
}
Iteration.prototype.constructor=Iteration;

/**
 * 给表表达式添加返回值
 * @param stack
 * @param value
 */
Iteration.prototype.values=function( value )
{
    if( typeof value !== "undefined" )this.stack.returnValues.push( value );
    return this.stack.returnValues;
}


/**
 * 检查参数类型
 * @param it
 * @param desc
 * @returns {Array}
 */
function checkParameter(it, desc, classmodule )
{
    var pareameter=[];
    var stack=[];
    var data=it.current.content();
    for(var i in data ) if( data[i] instanceof Ruler.STACK )
    {
        var obj = {value:toString( data[i], classmodule ), type:data[i].type() }
        stack.push( obj );
        pareameter.push( obj.value );
    }
    if( desc.param instanceof Array )
    {
        for(var i in desc.param)if( !stack[i] && desc.param[i] !== '...' )
        {
           error('Missing parameter', '', it.prev );
        }
    }
    return pareameter;
}


/**
 * 判断是否为一个恒定的值
 * @param val
 * @returns {boolean}
 */
function getConstantType(val)
{
    switch ( val )
    {
        case 'null' :
        case 'undefined' :
            return 'Object';
        case 'true' :
        case 'false' :
            return 'Boolean';
        case 'NaN' :
        case 'Infinity' :
            return 'Number';
    }
    return null;
}


/**
 * 前置运算符
 * @param o
 * @returns {boolean}
 */
function isLeftOperator(o)
{
    switch (o) {
        case '~' :
        case '-' :
        case '+' :
        case '!' :
        case '!!' :
        case '--' :
        case '++' :
        case 'new' :
        case 'delete' :
        case 'typeof' :
            return true;
    }
    return false;
}

function isMathAssignOperator( o )
{
    switch (o) {
        case '=' :
        case '+=' :
        case '-=' :
        case '*=' :
        case '/=' :
        case '%=' :
        case '^=' :
        case '&=' :
        case '|=' :
        case '<<=' :
        case '>>=' :
        case '>>>=' :
            return true;
    }
    return false;
}


/**
 * 前置运算符
 * @param o
 * @returns {boolean}
 */
function isLeftOperator(o)
{
    switch (o) {
        case '~' :
        case '-' :
        case '+' :
        case '!' :
        case '!!' :
        case 'new' :
        case 'delete' :
        case 'typeof' :
            return true;
    }
    return isIncreaseAndDecreaseOperator(o);
}

/**
 * 后置运算符
 * @param o
 * @returns {boolean}
 */
function isIncreaseAndDecreaseOperator(o)
{
    switch (o) {
        case '--' :
        case '++' :
            return true;
    }
    return false;
}



/**
 * 布尔运算符
 * @param o
 * @returns {boolean}
 */
function isLeftAndRightOperator(o)
{
    switch (o) {
        case '-' :
        case '+' :
        case '*' :
        case '/' :
        case '%' :
        case '^' :
        case '<' :
        case '>' :
        case '<=' :
        case '>=' :
        case '==' :
        case '!=' :
        case '===' :
        case '!==' :
        case '&&' :
        case '||' :
        case 'instanceof' :
        case 'in' :
            return true;
    }
    return false;
}


/**
 * 是否为一个可引用的属性
 * @param stack
 * @returns {boolean}
 */
function isReference( stack )
{
    return  stack.id === '(identifier)' ||
            stack.value === 'this'      ||
            stack.value === 'super'     ||
            stack.type==='(string)'     ||
            stack.type==='(regexp)'
}


/**
 * 获取表达式的描述说明
 * @param it
 * @param classmodule
 * @returns {*}
 */
function getDescriptorOfExpression(it, classmodule)
{
    var type;
    var desc;
    var property = {name:[],descriptor:null,thisArg:'',expression:false,before:'',after:'',"super":""};

    //是否有前置运算符
    if( isLeftOperator(it.current.value) )
    {
        property.before =  it.current.value;
        it.seek();
    }


    //是否为一个表达式或者对象
    if( it.current instanceof Ruler.STACK  )
    {
        if( it.current.type() === '(expression)' )
        {
            type = '*';
            desc = null;
            property.thisArg = toString(it.current, classmodule);

        }else
        {
            return property.before+toString(it.current, classmodule);
        }

    }else
    {
        if (isReference(it.current))
        {
            //获取字面量类型
            type = getIdentifierType(it.current.type);
            if (type) {
                desc = globals[type];
            }
            //声明的引用
            else {
                desc = it.stack.scope().define(it.current.value);
                if (desc) {
                    desc.type = getType(desc.type);
                    if (desc.type !== '*')desc = module(getImportClassByType(classmodule, desc.type));
                } else {
                    desc = globals[it.current.value];
                }
            }

            if (!desc)error('"' + it.current.value + '" is not defined.', '', it.current);
            if( it.current.value==='super' )
            {
                property.super = desc.type;

            }else
            {
                property.name.push( it.current.value );
            }
            property.descriptor = desc;
            type = desc.type;
            it.stack.type(type);

        } else
        {
            type = getConstantType(it.current.value) || getIdentifierType(it.current.type);
            if (type)it.stack.type(type);
            return it.current.value;
        }
    }

    var isstatic = it.current.value === type || type==='Class';
    while ( it.next )
    {
        if ( it.next instanceof Ruler.STACK )
        {
            it.seek();

            var first = it.current.content()[0];
            var last  = it.current.previous(-1);
            if( first.value === '[' || first.value === '('  )
            {
                it.current.content().shift();
            }
            if( last.value === ']' || last.value === ')'  )
            {
                it.current.content().pop();
            }

            var value = toString(it.current, classmodule);
            if( it.current.type() === '(property)' )
            {
                desc = null;
                property.name.push( [value] );
                property.descriptor = desc;

            }else if( it.current.type() === '(expression)' )
            {
                property.expression = true;
                property.param = value;
                if( desc && desc.id === 'function' && typeof desc.value === "object" )
                {
                    error('"' + it.prev.value + '" is not function', 'type', it.prev);
                }

                if( it.next && (it.next.value==='.' || (it.next instanceof Ruler.STACK && (it.next.type() === '(property)' || it.next.type() === '(expression)' ))))
                {
                    if (type === 'void')error('"' + it.prev.value + '" no return value', 'reference', it.prev);
                    var before = property.before;
                    property.before = '';
                    property = {name:[],descriptor:null,thisArg:parse(property),expression:false,before:before,after:'',"super":""};
                }

            }else
            {
                error('Unexpected expression', '');
            }

        } else if( it.next.value === '.' )
        {
            it.seek();

        } else if( it.next.type === '(identifier)' )
        {
            it.seek();
            property.name.push( it.current.value );

            if ( desc && desc.type !=='*' )
            {
                var prevDesc = desc;
                desc = getClassPropertyDesc(it, desc, isstatic ? 'static' : 'proto', classmodule);
                type = desc.type;
                property.descriptor = desc;

                //如果是一个函数或者是一个访问器
                if(desc.id === 'function')
                {
                    it.stack.type('Function');
                    if( typeof desc.value === "object" )
                    {
                        var setter = it.next && it.next.value === isMathAssignOperator(it.next.value);
                        if( setter && !desc.value.set )error( '"'+it.current.value+'" setter does exists');
                        if( !setter && !desc.value.get )error( '"'+it.current.value+'" getter does exists');
                        property.accessor = setter ? 'set' : 'get';
                    }
                }
                //如果下一个是赋值运算符则检查当前的表达式
                else if( it.next && isMathAssignOperator(it.next.value) )
                {
                    if (desc.id === 'const' )
                    {
                        if( it.stack.parent().keyword() !=='statement' )error('"' + property.name.join('.') + '" is constant', '', it.current);

                    }else if ( desc.id !== 'var' )
                    {
                        error('"' + property.name.join('.') + '" is not variable', '', it.current);
                    }
                }

                //获取/设置类模块的属性 （所有属性的值是通过对象的uid进行存储）
                if( !isstatic && prevDesc.id==='class' && (desc.id==='var' || desc.id==='const') && !globals[ prevDesc.type ] )
                {
                    property.uid = prevDesc.uid;
                    if( it.next && (it.next.value==='.' || type==='Function') )
                    {
                        var before = property.before;
                        property.before = '';
                        property = {
                            name: [],
                            descriptor: null,
                            thisArg: parse(property),
                            expression: false,
                            before: before,
                            after: '',
                            "super":""
                        };
                    }
                }

                //获取指定类型的模块
                if( type !== '*' && type !== 'void' )
                {
                    it.stack.type(type);
                    isstatic = type === 'Class' ? true : false;
                    desc = module( getImportClassByType(classmodule, type) );

                }else
                {
                    desc=null;
                }

            }else
            {
                property.descriptor = desc;
            }

        }else
        {
            break;
        }
    }

    //是否有后置运算符
    if( it.next && isIncreaseAndDecreaseOperator(it.next.value) )
    {
        it.seek();
        property.after = it.current.value;
    }

    //前后增减运算符只能是一个引用
    if( property.expression && ( property.after || isIncreaseAndDecreaseOperator(property.before) ) )
    {
        error( '"'+it.next.value+'" can only is reference', 'reference', it.next );
    }
    return property;
}

function checkRunning( desc , value , operator )
{
    var method  ='';
    var thisvrg = desc.thisArg || desc.name[0];
    var props   = desc.name;
    var express=[];

    //关键字运算符
    if( desc.before === 'new' || desc.before === 'delete' || desc.before === 'typeof' )
    {
        method = 'System.' + desc.before;
        desc.before='';
    }

    //调用超类属性或者方法
    if( desc.super )
    {
        thisvrg = 'this';
        props.unshift( desc.super );
        method='System.super';
    }

    //没有属性直接组合后返回
    if( props.length===0 )
    {
        if( method )return method+'('+ desc.thisArg +')';
        return desc.before+desc.thisArg+desc.after;
    }

    props = props.map(function (item, index) {
        if (index===0 || item instanceof Array )return item;
        return '"' + item + '"';
    });

    //逻辑取反运算符，可以放到最外面
    var logicBool = '';
    if( desc.before==='!' || desc.before==='!!' )
    {
        logicBool = desc.before;
        desc.before='';
    }

    //前置运算符
    if (desc.before)props.unshift( desc.before );

    //后置运算符
    if (desc.after)props.push( desc.after );

    //对象引用的属性
    props= props.length===1 ? [] : [ '[' + props.join(',') + ']' ];

    //引用对象
    if( !method || method==='System.super' || method==='System.typeof' )props.unshift( thisvrg );

    //调用函数
    if ( desc.expression )
    {
        if( desc.param ) {
            if(props.length===1) props.push('null');
            props.push('['+desc.param+']');
        }
        if( !method )method = 'System.call';

    }else if( value )
    {
        props.push( value );
        props.push( operator );
    }

    if( !method )method = 'System.prop';
    if( logicBool )express.push( logicBool );
    express.push( method + '(' + props.join(',') + ')');
    return express.join('');
}

/**
 * 解析一个表达式
 * @param desc
 * @returns {*}
 */
function parse( desc , value ,operator, returnValue )
{
    var express=[];
    if( desc instanceof Array )
    {
        for (var i in desc )if( desc[i] )
        {
            express.push( parse( desc[i] , value ,operator, returnValue ) );
        }
        return express.join('');
    }

    if ( typeof desc === "string")
    {
        express.push(desc);
        if (operator)
        {
            express.push(operator);
            express.push(value);
        }
        return express.join('');
    }

    var check=!desc.descriptor || desc.super || (desc.expression && desc.descriptor.id !=='function' && desc.descriptor.id !=='class');

    if( !check )
    {
        check = desc.before === 'new' || desc.before === 'delete' || desc.before === 'typeof';
    }

    if( check )
    {
        return checkRunning( desc , value ,operator, returnValue );
    }

    var thisvrg = desc.thisArg || desc.name[0];
    var props   = desc.name;
    var isnew = desc.before==='new';

    //关键字运算符
    if( desc.before === 'new' || desc.before === 'delete' || desc.before === 'typeof' )
    {
        desc.before+=' ';
    }

    //没有属性直接组合后返回
    if( props.length===0 )return desc.before+desc.thisArg+desc.after;

    //引用变量
    if( desc.uid )props.unshift( props.shift()+'["'+desc.uid +'"]' );

    //调用函数
    if( desc.expression || desc.accessor )
    {
        var param=[];

        //非全局类中的属性必须要指定引用的对象
        if( !isnew && desc.descriptor && typeof desc.descriptor.value !== "undefined" )
        {
            props.push('value');
            param.push( thisvrg );
            if( desc.accessor )
            {
                if( operator )
                {
                    props.push('set');
                    param.push( value );
                    param.push( operator );

                }else
                {
                    props.push('get');
                    if( isIncreaseAndDecreaseOperator( desc.before ) )
                    {
                        param.push( '"'+desc.before+'"' );
                        param.push( '"left"' );

                    }else if( isIncreaseAndDecreaseOperator( desc.after ) )
                    {
                        param.push( '"'+desc.after+'"' );
                        param.push( '"right"' );
                    }
                }
            }
            props.push('call');
        }
        express=[ props.join('.') ];
        if( desc.before )express.unshift( desc.before );
        if( desc.param )param.push( desc.param );
        express.push('(' + param.join(',') + ')');

    }else
    {
        express=[ props.join('.') ];
        if ( operator )
        {
            express.push(operator);
            express.push(value);
        }else
        {
            if (desc.before)express.unshift(desc.before);
            if (desc.after)express.push(desc.after);
        }
    }
    return express.join('');
}

/**
 * 组合表达式
 * @param it
 * @param classmodule
 * @returns {*[]}
 */
function bunch(it, classmodule)
{
    var express = [ getDescriptorOfExpression(it, classmodule) ];
    while( it.next && isLeftAndRightOperator(it.next.value) )
    {
        it.seek();
        if( it.current.id==='(keyword)' )
        {
            express.push( ' '+it.current.value+' ' );
        }else{
            express.push( it.current.value );
        }
        if ( !it.next )error('Missing expression', '', it.current);
        it.seek();
        express.push( getDescriptorOfExpression(it, classmodule) );
    }
    return express;
}

/**
 * 解析表达式
 * @param it
 * @returns {*}
 */
function expression( stack, classmodule )
{
    if( stack.content().length===0 )return '';
    var it = new Iteration( stack );
    var express = [];

    while ( it.seek() )
    {
        express.push( bunch(it, classmodule) );
        if( it.next && isMathAssignOperator(it.next.value) )
        {
            it.seek();
            express.push( it.current.value );
            if (!it.next)error('Missing expression', '', it.current);
            it.seek();
            express.push( bunch(it, classmodule) );
        }
    }

    var value = parse( express.pop() );
    var str=[];
    if( express.length === 0 )
    {
        str.push(value);

    }else
    {
        var operator;
        var returnValue = true;
        while (express.length > 0)
        {
            operator = express.pop();
            value = parse(express.pop(), value, operator, returnValue);
            returnValue = true;
            str.push(value);
        }
    }
    return str.join('');
}

/**
 * 根据类型获取类全名
 * @param map
 * @param type
 * @returns {*}
 */
function getImportClassByType(classmodule, type )
{
    if( classmodule.type === type )return classmodule.fullclassname;
    if( classmodule.import[type] )return classmodule.import[type];
    if( type.indexOf('.') > 0 )return type;
    return globals[type] ? type : null;
}


/**
 * 验证指定的类型与当前表达式返回的类型是否一致
 * @param it
 * @param stack
 * @param desc
 * @returns {boolean}
 */
function checkSpecifyType(it,desc,stack, module )
{
    if( desc.type==='*' || desc.type==='Object' || stack.type()==='Object' )return true;
    if( desc.type==='Class' )
    {
        //转换类的类型
        var type = getImportClassByType( module, stack.type() );
        if( type )desc.type=stack.type();
    }
    if( stack.type() !== desc.type )
    {
        error('Specify the type of mismatch','type', it.prev );
    }
}

/**
 * 获取标识符定义的类型
 * @param it
 * @returns {*}
 */
function getIdentifierType( type )
{
    switch ( type )
    {
        case '(string)' :
            return 'String';
        case '(regexp)' :
            return 'RegExp';
        case '(number)' :
            return 'Number';
        case '(boolean)' :
            return 'Boolean';
        default :
            return null;
    }
}

/**
 * 获取类中成员信息。
 * 如果是继承的类，成员信息不存在时则会逐一向上查找，直到找到或者没有父级类为止。
 * @param it
 * @param object 引用类模块
 * @param name 原型链名
 * @param classmodule 当前类模块
 * @returns {*}
 */
function getClassPropertyDesc(it, object, name , classmodule )
{
    if( object[ name ] )
    {
        var prop = it.current.value;

        //这里引用的是一个类，并非类的实例
        if ( prop === object.type )return object;
        var desc = object[name][prop];

        //如果在本类中有定义
        if ( desc )
        {
            //非全局模块和外部类需要检查权限
            if( classmodule.type !== object.type )checkPrivilege(it, desc, object, classmodule );
            return desc;
        }

        var parent = object;
        var child;

        //在继承的类中查找, 静态属性及方法不继承
        if (name === 'proto') while (parent && parent.inherit )
        {
            child = parent;
            parent = module( getModuleFullname(parent, parent.inherit ) );
            if ( parent && parent.proto[prop] )
            {
                desc = parent.proto[prop];
                checkPrivilege(it, desc, parent, child );
                return desc;
            }
        }
    }
    error('"' + it.current.value + '" does not exits', 'reference', it.current );
}

/**
 * 检查所在模块中的属性，在当前场景对象中的访问权限
 * @param it
 * @param desc 属性描述
 * @param inobject 查找的类对象
 * @param currobject 当前类对象
 */
function checkPrivilege(it, desc, inobject, currobject )
{
    //非全局模块需要检查
    if ( typeof desc.privilege !== "undefined" )
    {
        //包内访问权限
        var internal = inobject.package === currobject.package && desc.privilege === 'internal';

        //子类访问权限
        var inherit = inobject.fullclassname === currobject.import[ currobject.inherit ] && desc.privilege === 'protected';

        //判断访问权限
        if ( !(internal || inherit || desc.privilege === 'public') )
        {
            error('"' + it.current.value + '" inaccessible', 'reference', it.current);
        }
    }
}


/**
 * 转换语法
 * @returns {String}
 */
function toString( stack, module )
{
    if( stack.keyword() === 'function' )
    {
        return createFunction( stack , module );

    } else if( stack.keyword() === 'expression' )
    {
        return expression( stack , module );
    }

    var str = [];
    var it = new Iteration( stack );
    while ( it.seek() )
    {
        if( it.current instanceof Ruler.STACK )
        {
            str.push( toString(it.current, module) );
        }else
        {
            str.push(it.current.value);
            if (it.current.id === '(keyword)')str.push(' ');
        }
    }
    str = str.join('');
    return str;
}

/**
 * 检查子类中对父类方法的扩展
 * @param item
 * @param parent
 * @param internal
 * @param protect
 */
function chackOverride( item, parent , internal )
{
    var info = !item.static() ? parent['proto'] : parent['static'];
    info = info[ item.name() ];
    internal = info ? internal && info.privilege==='internal' : false;

    //有权限访问的方法都必须检查是否正确扩展
    if( info && (info.privilege ==='public' || info.privilege ==='protected' || internal ) )
    {
        //终结的方法子类中不可扩展
        if( info.final )error('the "'+item.name()+'" method not is extends. in parent class');

        //覆盖的方法必须与父类的方法相匹配
        if( typeof info.value ==='object' || item.accessor() )
        {
            if( !( typeof info.value === 'object' && item.accessor() ) )error('the "' + item.name() + '" method not matched', '', item.content()[0]);
            info = info.value[item.accessor()];
            if( !info && item.override() )
                error('the "'+item.name()+'" '+item.accessor()+'ter does exists in super class','', item.content()[0] );
        }

        //子类中必须使用 override 关键字才能扩展父中的方法
        if( !item.override() && info )error('Missing override','', item.content()[0] );
    }
    //覆盖的方法必须在父类中已定义
    else if( item.override() )
    {
        if( item.accessor() ){
            error('the "'+item.name()+'" '+item.accessor()+'ter does exists in super class','', item.content()[0] );
        }else{
            error('the "'+item.name()+'" method does exists in super class','', item.content()[0] );
        }
    }
}

/**
 * 获取模块的全名
 * @param module
 * @param classname
 * @returns {*}
 */
function getModuleFullname( module , classname )
{
    if( module.classname === classname )return module.fullclassname;
    if( module.import && module.import[ classname ] )return module.import[ classname ];
    return classname;
}


/**
 * 生成模块信息
 * @param stack
 * @returns {string}
 */
function makeModule( stack )
{
    if( stack.keyword() !=='class' )
    {
        throw new Error('Invalid stack');
        process.exit();
    }

    var data = stack.content();
    var i = 0;
    var item;
    var props = [];
    var len = data.length;
    var isstatic = stack.static();

    // 组合接口
    var classModule = module( getModuleName( stack.parent().name(), stack.name() ) );
    classModule.constructor.value= isstatic ? 'function(){}' : 'function(){ if( !(this instanceof '+stack.name()+') )throw new SyntaxError("Please use the new operation to build instances."); return this;}';

    //父类
    var parent = null;

    //继承父类
    if( classModule.inherit )
    {
        //终结的类不可以扩展
        if( stack.final() )error('parent class not is extends.');
        parent = module(  classModule.inherit );
    }

    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK ){

            var val = [];

            //是静态成员还是动态成功
            var ref =  item.static() || isstatic ? classModule.static : classModule.proto;

            //类中的成员方法
            if( item.keyword() === 'function' )
            {
                item.content().splice(1,1);

                //如果有继承，检查扩展的方法
                if( classModule.inherit )
                {
                    parent = classModule;
                    while( parent.inherit )
                    {
                        parent = module( getModuleFullname(parent, parent.inherit ) );
                        if( !parent )error('Not found parent class. ' );
                        chackOverride(item, parent ,  classModule.package === parent.package );
                    }
                }

                //构造函数
                if( item.name() === stack.name() && !isstatic )
                {
                    classModule.constructor.value = toString( item , classModule );
                    continue;
                }
                //普通函数
                else
                {
                    val.push(  toString( item , classModule ) );
                }
            }
            //类中的成员属性
            else if( item.keyword() === 'var' || item.keyword() === 'const' )
            {
                item.content().shift();
                var ret = toString( item, classModule ).replace( new RegExp('^'+item.name()+'\\s*\\=?'), '' );
                ret = ret ? ret : 'null';

                //私有属性直接放到构造函数中
                if( !item.static() /*&& item.qualifier()==='private'*/ )
                {
                    props.push('"'+item.name()+'":'+ ret );
                }
                val.push( ret );
            }

            var desc =  ref[ item.name() ];

            //访问器的原始代码
            if( item instanceof Ruler.SCOPE && item.accessor() )
            {
                desc.value[ item.accessor() ].value = val.join('');
            }
            //成员的原始代码
            else
            {
                desc.value=val.join('');
            }
        }
    }
    props = props.length > 0 ? 'this["'+classModule.uid+'"]={'+props.join(',')+'};\n' : '';
    classModule.constructor.value=classModule.constructor.value.replace('####{props}####', props );
    return classModule;
}

    
/**
 * 获取类的成员信息
 * @param stack
 * @returns {string}
 */
function getPropertyDescription( stack )
{
    var data = stack.content();
    var i = 0;
    var item;
    var len = data.length;
    var isstatic = stack.static();

    // 组合接口
    var list = {'static':{},'proto':{},'import':{},constructor:{}};
    var define = stack.parent().scope().define();
    for ( var j in define )list['import'][j]=define[j].fullclassname;

    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK )
        {
            var ref =  item.static() || isstatic ? list.static : list.proto;
            var desc = createDescription(item);

            //跳过构造函数
            if( item.keyword() === 'function' && item.name() === stack.name() && !isstatic ){

                list.constructor=desc;
                continue;
            }

            //访问器
            if( item instanceof Ruler.SCOPE && item.accessor() )
            {
                ref =  ref[ item.name() ] || (ref[ item.name() ]={id:'function',type:desc.type,privilege:desc.privilege,value:{}});
                ref.value[ item.accessor() ] = desc;

            }else
            {
                ref[ item.name() ] = desc;
            }
        }
    }

    list['inherit'] = stack.extends() ? stack.extends() : null;
    list['package']=stack.parent().name();
    list['type']=stack.name();
    list['nonglobal']=true;
    list['fullclassname']=getModuleName(list.package, stack.name());
    list['classname']=stack.name();
    list['implements']=stack.implements();
    list['isDynamic']=stack.dynamic();
    list['isStatic']=stack.static();
    list['isFinal']=stack.final();
    list['id']='class';
    return list;
}

//需要编译的模块
var needMakeModules=[];
var syntaxDescribe=[];

/**
 * 加载并解析模块的描述信息
 * @param file 模块名的全称。含包名 比如 com.Test。
 * @returns
 */
function loadModuleDescription( file )
{
    var has = module(file) || globals[file];
    if( has )return has;
    module( file, {} );
    
    //获取源文件的路径
    var sourcefile = pathfile(file, config.suffix, config.lib );

    //检查源文件的状态
    var stat = fs.statSync( sourcefile );

    //源文件修改过的时间
    var id =  new Date(stat.mtime).getTime();

    //是否需要重新编译
    var isupdate = false;
    var data;
    var packagename = file.split('.').slice(0,-1).join('.');


    //缓存文件的路径
    var cachefile = pathfile( file.replace(/\./g,'_').toLowerCase(), 'json', config.cachePath );
    if( config.cache && fs.existsSync(cachefile) )
    {
        var json = fs.readFileSync( cachefile , 'utf-8');
        data = JSON.parse( json );
        isupdate = data.id === id;
    }

    //编译源文件
    if( !isupdate )
    {
        console.log('Checking file', sourcefile,'...' );
        var content = fs.readFileSync( sourcefile , 'utf-8');
        var R= new Ruler( content, config );
        R.addListener('checkPackageName',function (e) {

            if( e.value !== packagename ){
               R.error('the package "'+e.value+'" and the actual path is not the same')
            }

        }).addListener('checkClassName',function (e)
        {
            var name = file.split('.').pop();
            if( e.value !== name )R.error('the class "'+e.value+'" and the actual file name is not the same');

        }).addListener('fetchFiles',function (e)
        {
            var files = getDirectoryFiles( e.path );
            var self= this;
            files.forEach(function (a) {
                if(a==='.' || a==='..')return;
                var filepath = e.path.split('.');
                filepath.push('.');
                filepath.push( PATH.basename(a, PATH.extname(a) ) );
                e.callback.call(self, null, filepath, e.scope );
            });
        })

        //解析代码语法
        try{
            var scope = R.start();
        }catch (e){
            if( config.debug==='on' ){
                console.log( e );
            }else {
                console.log(e.name, e.message)
            }
            process.exit();
        }

        scope = scope.content()[0].content()[0];
        if( typeof scope.keyword !=='function' || scope.keyword() !== 'class' )
        {
            console.log('error');
            process.exit();
        }

        //console.log( scope.content()[6].content()[6] );
        //process.exit();

        needMakeModules.push( scope );
        data = getPropertyDescription( scope );
        data.cachefile = cachefile;
        data.uid= id;
        data.filename = sourcefile.replace(/\\/g,'\\\\');
    }

    for(var i in data.import )
    {
        loadModuleDescription(data.import[i]);
    }
    syntaxDescribe.push( data );
    module( file, data);
}
    

function getDirectoryFiles( path )
{
    path = PATH.resolve(config.lib, path.replace('.',PATH.sep) )
    var files = fs.readdirSync( path );
    return files;
}

/**
 * 获取一个方法的字符串表达式
 * @param name
 * @param param
 * @returns {string}
 */
function getMethods(name,param)
{
    return name+'('+param.join(',')+')';
}


/**
 * 生成语法描述
 * @param describe
 * @param flag
 * @returns {string}
 */
function toValue( describe )
{
    var code=[];
    var properties=[];

    for( var p in describe )
    {
       // if( describe[p].inherit )continue;
        if( (describe[p].id==='var' || describe[p].id==='const') )
        {
            //properties.push('"'+p+'":'+describe[p].value);
        };

        var item = [];
        item.push( '"id":"'+ describe[p].id+'"' );
        item.push( '"qualifier":"'+ describe[p].privilege+'"' );

        if( describe[p].type==='*' || describe[p].type==='void' )
        {
            item.push( '"type":"'+ describe[p].type+'"' );
        }else{
            item.push( '"type":'+ describe[p].type );
        }

        if( typeof describe[p].value === "object" )
        {
            var val=[];
            if ( describe[p].value.get )val.push('get:' +describe[p].value.get.value );
            if ( describe[p].value.set )val.push('set:' +describe[p].value.set.value );
            item.push( '"value":{'+val.join(',')+'}' );

        }else
        {
            item.push( '"value":'+ describe[p].value );
        }
        code.push('"'+p+'":{'+item.join(',')+'}');
    }
    if( code.length===0 )return '{}';
    return '{\n'+code.join(',\n')+'\n}';
}


/**
 * 格式化字节
 * @param bytes
 * @returns {string}
 */
function format(bytes)
{
    return (bytes/1024/1024).toFixed(2)+'MB';
}

/**
 * 获取占用的内存信息
 */
function showMem()
{
    var mem = process.memoryUsage();
    console.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
}

/**
 * 开始生成代码片段
 */
function start()
{
    loadModuleDescription( config.main );
    console.log('Making starting...' );
    for( var i in needMakeModules )
    {
        var moduleObject = needMakeModules[i];
        console.log('  Making ',  pathfile( getModuleName( moduleObject.parent().name(), moduleObject.name() )  , config.suffix, config.lib ) );
        try {
            var data = makeModule(moduleObject);
            var cachefile = data.cachefile;
            delete data.cachefile;
            fs.writeFileSync(cachefile, JSON.stringify(data) );
        }catch (e)
        {
            if( config.debug==='on' ){
                console.log( e );
            }else {
                console.log(e.name, e.message)
            }
            process.exit();
        }
    }

    var code=[];
    var index = 0;
    var defined={};
    syntaxDescribe.forEach(function(o){

        index++;
        var str= '(function(){\n';
        var include=[];
        for (var i in o.import )
        {
            var obj = module( o.import[i] );
            if( obj )
            {
                str += 'var ' +i+';\n';
                include.push(i+'=getDefinitionByName("'+o.import[i]+'");\n');
            }
        }

        var callback = 'function(){'+include.join('')+'}';
        var descriptor = [];
        descriptor.push('"factory":'+o.constructor.value);
        descriptor.push('"token":"'+o.uid+'"');
        descriptor.push('"extends":'+o.inherit);
        descriptor.push('"classname":"'+o.classname+'"');
        descriptor.push('"package":"'+o.package+'"');
        descriptor.push('"implements":['+o.implements.join(',')+']');
        descriptor.push('"final":'+!!o.isFinal);
        descriptor.push('"dynamic":'+!!o.isDynamic);
        descriptor.push('"static":'+toValue(o.static));
        descriptor.push('"proto":'+toValue(o.proto));
        descriptor = '{'+descriptor.join(',')+'}';

        str+= 'var '+o.classname+'= new Class('+descriptor+','+callback+');\n';
        str+= '})()';
        code.push( str );

    });

    var mainfile = pathfile( config.main , config.suffix, config.lib );
    var filename = PATH.resolve(PATH.dirname( mainfile ),PATH.basename(mainfile,config.suffix)+'-min.js' );
    var system = fs.readFileSync( PATH.resolve(config.make, './lib/System.js') , 'utf-8');
    var utils = fs.readFileSync( PATH.resolve(config.make, './lib/Utils.js') , 'utf-8');

    fs.writeFileSync(  filename,[
        '(function(){\n',
        'var System = (function(_Object,_String,_Array){\n',
        'var globals={};\n',
         system,
        '})(Object,String,Array);\n',
        '\n',
        '(function(Object, Class){\n',
        utils,
        '\n',
        code.join(';\n'),
        ';\n',
        'System.task.execute();\n',
        'delete System.define;\n',
        'delete System.task;\n',
        'var main='+getMethods('System.getDefinitionByName', ['"'+config.main+'"'] ),
        ';\n',
        'new main();\n',
        '})(System.Object, System.Class );\n',
        '})();'].join('') );

    console.log('Making done.' );
}

// 合并传入的参数
var arguments = process.argv.splice(1);
config.make = PATH.dirname( arguments.shift() );
for(var b in arguments )merge(config, QS.parse( arguments[b] ) );
config.cache = config.cache!=='off';

//浏览器中的全局模块
if( config.browser !=='disable' )
{
    var browser = require('./lib/Browser.js');
    for(var b in browser)globals[b]=browser[b];
}

//检查是否有指定需要编译的源文件目录
if( !config.lib  )
{
    if( config.make === root )
    {
        console.log('not found lib path');
        process.exit();
    }
    config.lib = root;
}

//返回绝对路径
config.lib = PATH.resolve( config.lib );
config.cachePath = PATH.resolve(config.lib, config.cachePath);
if( !fs.existsSync(config.cachePath) )fs.mkdirSync( config.cachePath );

//如果指定的配置文件
if( config.config )
{
   config.config = PATH.resolve( config.config );

    //检查配置文件是否存在
   if( !fs.existsSync( config.config ) )
   {
       console.log('not found config file');
       process.exit();
   }

   var suffix =  PATH.extname( config.config );
   var data={};
   if( suffix === 'json' )
   {
       var json = fs.readFileSync( config.config , 'utf-8');
       data =  JSON.parse( json );
   }else
   {
      data =  require( config.config );
   }
   merge(config,data);
}

//必须指主文件
if( !config.main )
{
    console.log('main file can not is empty');
    process.exit();
}

start();