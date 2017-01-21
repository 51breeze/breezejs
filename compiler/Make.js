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
        name = path[deep].toLowerCase();
        obj = obj[ name ] || (obj[ name ]={});
        deep++;
    }
    if( typeof module === 'object' )
    {
        obj[ classname.toLowerCase() ] = module;
        return module;
    }
    return obj[ classname.toLowerCase() ] || globals[classname] || null;
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
    var obj = {'param':[],'expre':[], 'type':[]};
    var name;
    var type='*';
    var value;

    for ( var j=0; j< data.length ; j++ )
    {
        var item = data[j];
        if( item instanceof Ruler.STACK )
        {
            var o = createDefaultParam( item, module );
            obj.param = obj.param.concat( o.param );
            obj.expre = obj.expre.concat( o.expre );

        }else if( item && item.value !==',' )
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
            obj.expre.push(name + '=System.typeof(' + name + ') === "undefined" ?' + value + ':' + name+';\n');
        }
        if (desc)
        {
            type = desc.type = getType( desc.type );
            if( type !=='*' )
            {
                obj.expre.push('if(!System.is('+name+','+type+'))System.throwError("type","type of mismatch. must is a '+type+'");\n');
            }
        }
        obj.param.push( name );
        obj.type.push( type );
    }
    return obj;
}

/**
 * 生成函数
 * @param stack
 * @returns {string}
 */
function createFunction(stack, moduleObject )
{
    var children = stack.content();
    var i=0;
    var len = children.length;
    var content=[];
    var param;
    var is = stack.parent().keyword()==='class' && stack.parent().name() === stack.name();
    stack.appendBodyBefore=[];
    stack.dispatcher({type:'(parseStart)',content:content});
    for(;i<len; i++)
    {
        var child = children[i];
        if( child instanceof Ruler.STACK )
        {
            if( child.keyword() === 'statement' )
            {
                param = createDefaultParam( child, moduleObject );
                content.push( param.param.join(',') );
            }else
            {
                content.push( toString(child,moduleObject) );
            }
        } else
        {
            content.push( child.value );
            if( child.id==='(keyword)' && i>0 )content.push(' ');
        }
    }
    stack.dispatcher({type:'(parseDone)',content:content});
    //构造函数
    if( is )
    {
        //运行时检查实例对象是否属于本类
        // content.push( 'if( !(this instanceof '+stack.name()+') )throw new SyntaxError("Please use the new operation to build instances.");\n' );
        //如果没有调用超类，则调用超类的构造函数
        stack.appendBodyBefore.unshift('####{props}####');
        if( moduleObject.inherit && !stack.called )stack.appendBodyBefore.unshift( moduleObject.inherit+'.constructor.call(this);\n' );
    }

    //运行时检查参数的类型是否正确
    if( param )
    {
        var argument = stack.param();
        var rest = argument.indexOf('...');
        stack.appendBodyBefore.unshift( param.expre.join('') );
        if( rest>=0 )stack.appendBodyBefore.unshift( argument.slice(-1)+'=Array.prototype.slice.call(arguments, '+rest+');\n' );
    }

    var startIndex =  content[1]==='(' ? 5 : 6;
    var endIndex = content[content.length-1]==='}' ? content.length-2 : content.length-1;
    if( stack.appendBodyBefore instanceof Array && stack.appendBodyBefore.length > 0 )
    {
        content.splice(startIndex, 0 , stack.appendBodyBefore.join('') );
        delete stack.appendBodyBefore;
    }
    if( stack.appendBodyAfter instanceof Array && stack.appendBodyAfter.length > 0 )
    {
        content.splice( endIndex, 0, stack.appendBodyAfter.join('') );
        delete stack.appendBodyAfter;
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
function createDescription( stack )
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
    if( stack.keyword() === 'function' )
    {
        desc['param'] = stack.param();
        desc['paramType'] = [];
        for(var i in desc['param'] ){
            if( desc['param'][i] ==='...')
            {
                desc['paramType'].push('*');
            }else{
                var obj = stack.define(desc['param'][i]);
                obj.type = getType(obj.type);
                desc['paramType'].push(obj.type);
            }
        }
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
 * @param desc
 * @param funExpression
 * @returns Boolean
 */
function checkParameter(it, desc, property )
{
    var content = it.current.content();
    var parameters = []
    for( var b in content )
    {
        if( content[b] instanceof Ruler.STACK ) {
            parameters.push( content[b] );
        }
    }
    var param = property.isglobal ? desc.param : desc.paramType;
    if( param  && param.length > 0 )
    {
        if( parameters.length < param.length ) error('Missing parameter', 'syntax', property.lastStack );
        for(var i in desc.param )
        {
            if( desc.param[i]==='...' )
            {
                property.runningCheck=true;
                return true;
            }
            var type = getType( parameters[i].type() );
            if( param[i] === '*' || type==='*' ){
                property.runningCheck=true;
                continue;
            }
            if( ( param[i] !=='Object' || type==='Boolean' ) && param[i] !== type )
            {
                error('Can only be a '+param[i]+'', 'type', property.lastStack );
            }
        }
    }
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
            return true;
    }
    return isLeftKeywordOperator(o) || isIncreaseAndDecreaseOperator(o);
}

/**
 * 是一个左关键字运算符
 * @param o
 * @returns {boolean}
 */
function isLeftKeywordOperator(o)
{
    switch (o) {
        case 'new' :
        case 'delete' :
        case 'typeof' :
            return true;
    }
    return false;
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
        case 'is' :
        case 'in' :
            return true;
    }
    return false;
}

/**
 * @param it
 */
function createBlockScope(it)
{
    var block = it.stack.scope();
    var id = block.keyword();
    if( id ==='for' || id==='do' || id==='switch' || id==='while' )
    {
        if( !block.appendBefore )
        {
            block.appendBefore=['(function(){'];
            block.appendAfter=['}());\n'];
        }

    }else if( id==='function' )
    {
        while( block.parent() && block.parent().keyword()==='function' )block = block.parent();
        var type = block.parent().type();
        var id = block.parent().keyword();
        var isObj = id==='object' && (type=== '(expression)' || type === '(Array)' || type === '(Json)' || type==='(property)');
        var endIdentifier = id === 'ternary' || isObj ? '' : ';\n';
        block.appendBefore=['(function(){ return ' ];
        block.appendAfter=['}())'+endIdentifier];

    }else if( id==='if' || id==='else' || id==='try' || id==='catch' || id==='finally' )
    {
        if( !block.appendBefore )
        {
            block.appendBodyBefore=['(function(){'];
            block.appendBodyAfter=['}());\n'];
        }
    }
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
    var property = {name:[],descriptor:null,thisArg:'',expression:false,before:'',after:'',"super":null,runningCheck:false,lastStack:null,isglobal:false};

    //是否有前置运算符
    if( isLeftOperator(it.current.value) )
    {
        property.before =  it.current.value;
        property.lastStack = it.current;
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
            it.stack.type( it.current.type() );

        }else
        {
            property.thisArg = toString(it.current, classmodule);
            it.stack.type( it.current.type() );
            return property;
        }

    }else
    {
        //是一个引用或者是一个字面量
        if (isReference(it.current))
        {
            //获取字面量类型
            type = getIdentifierType(it.current.type);
            if (type) {
                desc = globals[type];
                property.isglobal=true;
            }
            //声明的引用
            else {
                desc = it.stack.scope().define(it.current.value);
                if (desc) {
                    desc.type = getType(desc.type);
                    if( desc.id==='let' )
                    {
                        var blockScope = it.stack.scope();
                        while( blockScope && blockScope.keyword()==='function' )blockScope = blockScope.parent().scope();
                        if( blockScope.hasListener('(blockScope)') )
                        {
                            blockScope.dispatcher({"type":"(blockScope)","name":it.current.value, "stack":it.stack, "current":it.current,'scope':desc.scope });
                        }
                        //createBlockScope(it);
                    }
                    if (desc.type !== '*')desc = module(getImportClassByType(classmodule, desc.type));
                } else {
                    desc = globals[it.current.value];
                    property.isglobal=true;
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
            property.lastStack = it.current;
            type = desc.type;
            //如果没有确定类型并且有设置值类型则引用值的类型
            //if( type==='*' && desc.valueType )type = desc.valueType;
            it.stack.type(type);
        }
        //一组常量的值
        else
        {
            type = getConstantType(it.current.value) || getIdentifierType(it.current.type);
            if (!type)error('Unexpected identifier','syntax',  it.current );
            it.stack.type(type);
            property.thisArg = it.current.value;
            property.lastStack = it.current;
            property.isglobal=true;
            return property;
        }
    }

    var isstatic = it.current.value === type || type==='Class';
    while ( it.next )
    {
        if ( it.next instanceof Ruler.STACK )
        {
            it.seek();
            property.lastStack =  getStack( it.current );
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
            var value = it.current.content().length > 0 ? toString(it.current, classmodule) : '';
            if( it.current.type() === '(property)' )
            {
                desc = null;
                if( !value )error('Missing expression', 'syntax', property.lastStack );
                property.name.push( [value] );
                property.descriptor = desc;
                property.runningCheck=true;
                it.stack.type('*');

            }else if( it.current.type() === '(expression)' )
            {
                property.expression = true;
                property.param = value;
                property.runningCheck=true;
                if( desc && desc.id === 'function' )
                {
                    it.stack.type(desc.type);
                    property.runningCheck=false;
                    //检查函数已定义的参数
                    checkParameter( it, desc, property );
                }

                if( property.accessor )error('"' + property.lastStack.value + '" is not function', 'type', property.lastStack );
                if( it.next && (it.next.value==='.' || (it.next instanceof Ruler.STACK && (it.next.type() === '(property)' || it.next.type() === '(expression)' ))))
                {
                    if (type === 'void')error('"' + it.prev.value + '" no return value', 'reference', it.prev);
                    var before = property.before;
                    property.before = '';
                    property = {name:[],descriptor:null,thisArg:parse(property),expression:false,before:before,after:'',"super":null,runningCheck:false,lastStack:property.lastStack};
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
            property.lastStack = it.current;
            if ( desc && desc.type !=='*' )
            {
                var prevDesc = desc;
                desc = getClassPropertyDesc(it, desc, isstatic ? 'static' : 'proto', classmodule);
                type = desc.type;
                property.descriptor = desc;

                //当前表达式的类型
                it.stack.type(type);

                //如果是一个函数或者是一个访问器
                if(desc.id === 'function')
                {
                    if( typeof desc.value === "object" )
                    {
                        var setter = it.next && isMathAssignOperator(it.next.value);
                        if( setter && !desc.value.set )error( '"'+it.current.value+'" setter does exists');
                        if( !setter && !desc.value.get )error( '"'+it.current.value+'" getter does exists');
                        property.accessor = setter ? 'set' : 'get';
                    }else
                    {
                        it.stack.type('Function');
                    }
                }
                //如果下一个是赋值运算符则检查当前的表达式
                else if( it.next && isMathAssignOperator(it.next.value) )
                {
                    if (desc.id === 'const' )
                    {
                        if( it.stack.parent().keyword() !=='statement' )error('"' + property.name.join('.') + '" is constant', '', it.current);

                    }else if ( desc.id !== 'var' && desc.id !== 'let' )
                    {
                        error('"' + property.name.join('.') + '" is not variable', '', it.current);
                    }
                }

                //获取/设置类模块的属性 （所有属性的值是通过对象的uid进行存储）
                if( !isstatic && prevDesc.id==='class' && (desc.id==='var' || desc.id==='const') && !globals[ prevDesc.type ] )
                {
                    property.uid = prevDesc.uid;
                }

                //获取指定类型的模块
                if( type !== '*' && type !== 'void' )
                {
                    isstatic = type === 'Class' ? true : false;
                    desc = module( getImportClassByType(classmodule, type) );
                }

            }else
            {
                it.stack.type('*');
                property.descriptor = null;
                property.runningCheck=true;
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
        property.lastStack = it.current;
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
    }

    //没有属性直接组合后返回
    if( props.length===0 )
    {
        if( method )return method+'('+ thisvrg +')';
        return desc.before+thisvrg+desc.after;
    }

    props = props.map(function (item, index) {
        if ( !desc.thisArg && (index===0 || item instanceof Array) )return item;
        return '"' + item + '"';
    });

    //逻辑取反运算符，可以放到最外面
    var logicBool = '';
    if( desc.before==='!' || desc.before==='!!' )
    {
        logicBool = desc.before;
        desc.before='';
    }

    //如果引用对象和属性对象完全相同就删除
    if( thisvrg === props[0]  )props.shift();

    //运算并赋值
    if( operator && operator !=='=' )props.push( '"'+operator+'"' );

    //前置运算符
    if (desc.before)props.unshift( '"'+desc.before+'"' );

    //后置运算符
    if (desc.after)props.push( '"'+desc.after+'"' );

    //对象引用的属性
    if( props.length > 0 )
    {
        props = props.length === 1 && !desc.super ? [ props[0] ] : ['[' + props.join(',') + ']'];
    }
    props.unshift( thisvrg );

    //调用函数
    if ( desc.expression )
    {
        if( desc.param )props.push('['+desc.param+']');
        if( !method )method = '__call__';

    }else if( value )
    {
        props.push( value );
    }

    if( desc.lastStack )
    {
        props.unshift( '"'+desc.lastStack.line+':'+desc.lastStack.cursor+'"' );
    }

    if( !method )method = '__prop__';
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

    var check = !desc.descriptor || desc.super || ( desc.expression && desc.descriptor.id !=='function' && desc.descriptor.id !=='class');
    if( !check )
    {
        check = desc.before === 'new' || desc.before === 'delete' || desc.before === 'typeof';
    }
    if( !check && ( desc.expression && ( !desc.descriptor || desc.descriptor.id !=='function' ) ) )
    {
        check=true;
    }

    if( desc.name.length > 1 || (desc.name.length===1 && desc.thisArg) )check = true;

    //运行时检查
    if( check || desc.runningCheck )
    {
        return checkRunning( desc , value ,operator, returnValue );
    }
    return getReferenceOf(desc , value , operator);
}

/**
 * 获取描述符的引用
 * @param desc
 * @param value
 * @param operator
 * @returns {string}
 */
function getReferenceOf(desc , value , operator)
{
    var express=[];
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
                    param.push( operator !== '=' ? [[props.slice(0).concat('get','call').join('.'), '(', thisvrg, ')'].join(''), operator.slice(0, -1), value ].join('') : value );
                    props.push('set');

                }else
                {
                    //自增减运算
                    if( isIncreaseAndDecreaseOperator( desc.before ) || isIncreaseAndDecreaseOperator( desc.after ) )
                    {
                        var o = desc.before ||  desc.after;
                        param.push( [ [props.slice(0).concat('get','call').join('.'), '(', thisvrg, ')'].join(''),  o.charAt(0) , 1 ].join('') );
                        if( desc.after )param.push(  o==='--' ? '+1':'-1');
                        desc.before='';
                        desc.after='';
                        props.push('set');

                    }else
                    {
                        props.push('get');
                    }
                }
            }
            props.push('call');
        }
        express=[ props.join('.') ];
        if( desc.before )express.unshift( desc.before );
        if( desc.param )param.push( desc.param );
        express.push('(' + param.join(',') + ')');
    }
    //引用属性
    else
    {
        express=[ props.join('.') ];

        //赋值运算符
        if ( operator )
        {
            express.push(operator);
            express.push(value);
        }
        //操作运算符
        else
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
    var operator;
    while( it.next && isLeftAndRightOperator(it.next.value) )
    {
        it.seek();
        operator = it.current.value;
        if ( !it.next )error('Missing expression', '', it.current);
        it.seek();
        if( operator === 'instanceof' || operator === 'is' )
        {
            express.push('System.'+operator+'('+parse( express.pop() )+','+ parse( getDescriptorOfExpression(it, classmodule) )+')');
        }else
        {
            if( operator ==='in' ){
                express.push(' ');
            }
            express.push( operator );
            express.push( getDescriptorOfExpression(it, classmodule) );
        }
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
            var current = it.current;
            express.push( bunch(it, classmodule) );
            if( current instanceof Ruler.STACK )
            {
                if( getType( stack.type() ) ==='*' )stack.type( current.type() );
            }
            //给声明的属性设置值的类型
            if( typeof express[0][0] === "object" && express[0][0].descriptor )
            {
                express[0][0].descriptor.valueType=stack.type();
            }
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

        //在继承的类中查找
        while (parent && parent.inherit )
        {
            child = parent;
            parent = module( getModuleFullname(parent, parent.inherit ) );
            if ( parent && parent[name][prop] )
            {
                desc = parent[name][prop];
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

function makeBlockScope( stack )
{
    if( stack instanceof Ruler.SCOPE && !stack.hasListener('(blockScope)') )
    {
        var blockScopeItems=[];
        var hasBlockScope=false;
        stack.addListener('(blockScope)',function (e)
        {
            hasBlockScope=true;
            if( blockScopeItems.indexOf(e.name) < 0 && this !== e.scope )
            {
                blockScopeItems.push( e.name );
            }
        });
        stack.addListener('(parseDone)',function (e)
        {
            if( hasBlockScope )
            {
                if( stack.keyword()==='do' )
                {
                    e.content.unshift('(function(){');
                    var index = this.parent().content().indexOf(this);
                    if( this.parent().content().length > index && this.parent().content()[ index ].keyword()==='while' )
                    {
                        this.parent().content()[ index ].addListener('(parseDone)',function (e) {
                            e.content.push('}).call(this);\n');
                            e.prevented=true;
                            e.stopPropagation=true;
                        },100);

                    }else
                    {
                        e.content.push('}).call(this);\n');
                    }
                }
                else if( stack.keyword()==='for' || stack.keyword()==='while' )
                {
                    e.content.unshift('(function(){');
                    e.content.push('}).call(this);\n');

                }else
                {
                    var startIndex = e.content[4]===')' && e.content[5]==='{' ? 6 : 5;
                    e.content.splice( startIndex, 0, '(function('+ blockScopeItems.join(',')+'){' );
                    e.content.splice( e.content.length-1,0, '}).call('+['this'].concat(blockScopeItems).join(',')+');' );
                }
            }
        });
    }
}

/**
 * 转换语法
 * @returns {String}
 */
function toString( stack, module )
{
    var str = [];
    if( stack.keyword() === 'function' )
    {
        str.push( createFunction( stack , module ) );

    } else if( stack.keyword() === 'expression' )
    {
        str.push( expression( stack , module ) );

    }else
    {
        //将var变量提到函数作用域中
        if( stack.keyword() ==='var' && stack.scope().keyword() !== 'function' )
        {
            var funScope = stack.scope().getScopeOf();
            var infor = stack.scope().keyword()==='for' && stack.content().length ===4 && stack.content()[2].value==='in';
            var shift = stack.content().shift();
            if( shift.value !=='var' )stack.content().unshift(shift);
            if( !(funScope.appendBodyBefore instanceof Array) )funScope.appendBodyBefore=[];
            var items=[];
            var content = stack.content()[0];
            if( content.keyword() === 'statement' )
            {
                content=content.content();
                var len = content.length;
                while (len > 0) {
                    var item = content[--len];
                    if (item instanceof Ruler.STACK) {
                        items.push(item.content()[0].value);
                        //删除没有赋值的变量
                        if (item.content().length === 1 && !infor) {
                            content.splice(len, 1);
                            if (len > 0)content.splice(--len, 1);
                        }
                    }
                }
                funScope.appendBodyBefore.push('var ' + items.join(',') + ';\n');
                if (content.length < 1)return '';
            }
        }

        var it = new Iteration(stack);
        makeBlockScope(stack);
        stack.dispatcher({type:'(parseStart)',content:str});
        while (it.seek())
        {
            if (it.current instanceof Ruler.STACK)
            {
                str.push(toString(it.current, module));
            } else
            {
                if ( it.current.id === '(keyword)' && (it.current.value === 'in' || it.current.value === 'is' || it.current.value === 'instanceof' ))
                {
                    str.push(' ');
                }
                if (it.current.value === 'let')
                {
                    str.push('var');
                } else {
                    str.push(it.current.value);
                }
                if ( it.current.id === '(keyword)' && !(it.next.value ==='(' || it.next.value ==='[') )str.push(' ');
            }
        }
        stack.dispatcher({type:'(parseDone)',content:str});
    }

    if( stack.appendBefore instanceof Array && stack.appendBefore.length > 0 )
    {
        str.unshift( stack.appendBefore.join('') );
        delete stack.appendBefore;
    }

    if( stack.appendAfter instanceof Array && stack.appendAfter.length > 0 )
    {
        str.push( stack.appendAfter.join('') );
        delete stack.appendAfter;
    }
    str = str.join('');
    return str;
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
 * 执行模块的原型链，直到回调函数返回值或者已到达最上层为止
 * @param classModule
 * @param callback
 * @returns {*}
 */
function doPrototype(classModule, callback)
{
    do{
        var val = callback( classModule );
        if( val )return val;
        if( classModule.inherit )
        {
            classModule = module( getImportClassByType(classModule, classModule.inherit) );
        }else
        {
            return null;
        }
    } while ( classModule );
}

/**
 * 检查模块的接口是否实现
 * @param classModule
 */
function checkInterface(classModule)
{
    if( classModule.implements.length === 0 )return;
    var interfaceDesc = [];
    for( var i in classModule.implements )
    {
        doPrototype( module( getImportClassByType( classModule, classModule.implements[i] ) ) ,function (module) {
            interfaceDesc.push( module.proto );
        });
    }
    var desc;
    var obj;
    for( var i in interfaceDesc )
    {
        desc = interfaceDesc[i];
        for( var name in desc )
        {
            obj=doPrototype(classModule,function (module) {
                if( module.proto[name] && module.proto[name].id === 'function')return module.proto[name];
            });
            if( !obj )error('Not implementation of the "' + name + '" method interface')
            if( obj.type !== desc[name].type )error('the "' + name + '" interface of mismatch the return type')
            if( desc[name].param.length !== obj.param.length )error('Not implementation of the "' + name + '" method parameter')
            if( desc[name].param.length > 0 )
            {
                for(var b in desc[name].paramType )
                {
                    if( desc[name].paramType[b] !== obj.paramType[b] )
                    {
                        error('the "'+name+'" method of mismatch parameter type','type');
                    }
                }
            }
        }
    }
}

/**
 * 生成模块信息
 * @param stack
 * @returns {string}
 */
function makeModule( stack )
{
    var fullname = getModuleName( stack.parent().name(), stack.name() );
    var classModule = module( fullname );
    if( !classModule )error('"'+fullname+'" does exists');

    //继承父类
    if( classModule.inherit )
    {
        var parent = module( getImportClassByType( classModule, classModule.inherit ) );
        //终结的类不可以扩展
        if( parent.isFinal )error('parent class is not extends.');
    }

    if( stack.keyword() ==='interface' )
    {
        return classModule;
    }

    var data = stack.content();
    var i = 0;
    var item;
    var props = [];
    var len = data.length;
    var isstatic = stack.static();
    if( !isstatic ){
        classModule.constructor.value=classModule.inherit ? 'function(){return '+classModule.inherit+'.constructor.call(this);}' : 'function(){}';
    }

    //需要实现的接口
    checkInterface(classModule);

    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK ){

            var val = [];

            //是静态成员还是动态成功
            var ref =  item.static() || isstatic ? classModule.static : classModule.proto;

            //如果有继承检查扩展的方法属性
            var info;
            if( classModule.inherit && item.qualifier() !== 'private' )
            {
                info=doPrototype( module( getImportClassByType(classModule,  classModule.inherit ) ),function (module) {
                    var desc = !item.static() ? module['proto'] : module['static'];
                    if( desc[ item.name() ] && desc[ item.name() ].qualifier !== 'private' )
                    {
                        return desc[ item.name() ];
                    }
                });
            }

            //类中的成员方法
            if( item.keyword() === 'function' )
            {
                //父类中必须存在才能覆盖
                if( item.override() && !info )
                {
                    error('Must cover function of the parent. for "'+item.name()+'"','', getStack(item) );
                }
                //扩展父类中方法必须指定override关键字
                else if( !item.override() && info )
                {
                    error('Missing override for "'+item.name()+'"','', getStack(item) );
                }

                //扩展父类的方法必须保持参数和参数类型的一致
                if( item.override() )
                {
                    var param = item.param();
                    if( info.param.length !== param.length )error('the override parameters of inconformity for "'+item.name()+'"','', getStack(item) );
                    for(var b in info.param )
                    {
                        if( info.param[b] !==param[b] )error('the override parameter types of inconformity for "'+item.name()+'"','type',getStack(item));
                    }
                }

                //去掉函数名称
                item.content().splice(1,1);

                //构造函数
                if( item.name() === stack.name() && !isstatic )
                {
                    classModule.constructor.value = toString( item , classModule );
                    continue;
                }
                //普通函数
                else
                {
                    val.push( toString( item , classModule ) );
                }
            }
            //类中的成员属性
            else if( item.keyword() === 'var' || item.keyword() === 'const' )
            {
                //属性不能指定override关键字
                if( item.override() )
                {
                    error('can only override method of the parent','', getStack(item) );
                }

                item.content().shift();
                var express = item.content()[0].content()[0];
                var ret = 'null';
                if( express.content().length > 1 )
                {
                    express.content().splice(0,2);
                    ret = expression( express , classModule );
                }

                //私有属性直接放到构造函数中
                if( !item.static() )
                {
                    props.push('"'+item.name()+'":'+ ret );
                }
                val.push( ret );
            }

            //此属性或者方法与父中的成员不兼容的
            if( info && info.privilege !== item.qualifier() )
            {
                error('Incompatible override for "'+item.name()+'"','', getStack(item, true ) );
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

    if( classModule.id !=='interface' && !isstatic )
    {
        props = props.length > 0 ? 'this["'+classModule.uid+'"]={'+props.join(',')+'};\n' : '';
        classModule.constructor.value = classModule.constructor.value.replace('####{props}####', props);
    }
    return classModule;
}

function getStack( stack , flag )
{
    if( stack instanceof Ruler.STACK )
    {
        return getStack( flag ? stack.content()[0] : stack.previous(), flag )
    }
    return stack;
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
    var list = {'static':{},'proto':{},'import':{},'constructor':{}};
    var define = stack.parent().scope().define();
    for ( var j in define )list['import'][j]=define[j].fullclassname;

    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK )
        {
            var ref =  item.static() || isstatic ? list.static : list.proto;

            //跳过构造函数
            if( item.keyword() === 'function' && item.name() === stack.name() && !isstatic )
            {
                list.constructor= createDescription(item);
                continue;
            }

            //访问器
            if( item instanceof Ruler.SCOPE && item.accessor() )
            {
                var refObj = ref[ item.name() ];
                if( !refObj )
                {
                    ref[ item.name() ] = refObj = createDescription(item);
                    refObj.value={};
                }
                refObj.value[ item.accessor() ] = createDescription(item);

            }else
            {
                ref[ item.name() ] =  createDescription(item);
            }
        }
    }

    list['inherit'] = stack.extends() ? stack.extends() : null;
    list['package']=stack.parent().name();
    list['type']=stack.name();
    list['nonglobal']=true;
    list['fullclassname']=getModuleName(list.package, stack.name());
    list['classname']=stack.name();

    if( stack.keyword()==='interface' )
    {
        list['implements'] = [];
        list['isDynamic'] = false;
        list['isStatic'] = false;
        list['isFinal'] = false;
        list['id'] = 'interface';

    }else
    {
        list['implements'] = stack.implements();
        list['isDynamic'] = stack.dynamic();
        list['isStatic'] = stack.static();
        list['isFinal'] = stack.final();
        list['isAbstract'] = stack.abstract();
        list['id'] = 'class';
    }
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

        if( !(scope.content()[0] instanceof Ruler.SCOPE )  )
        {
            console.log('fatal error in "'+sourcefile+'"');
            process.exit();
        }

        scope = scope.content()[0].content()[0];
        if( !(scope instanceof Ruler.SCOPE) || !( scope.keyword() === 'class' || scope.keyword() === 'interface') )
        {
            console.log('fatal error in "'+sourcefile+'"');
            process.exit();
        }
        //console.log( scope.content()[0] )
        needMakeModules.push( scope );
        data = getPropertyDescription( scope );
        data.cachefile = cachefile;
        data.uid= id;
        data.filename = sourcefile.replace(/\\/g,'\\\\');
    }

    for(var i in data.import )
    {
        loadModuleDescription(data.import[i] );
    }
    syntaxDescribe.push( data );
    module( data.fullclassname, data);
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
function toValue( describe, uid )
{
    var code=[];
    var properties=[];

    for( var p in describe )
    {
        // if( describe[p].inherit )continue;
        var item = [];
        if( uid && (describe[p].id==='var' || describe[p].id==='const') )
        {
            //item.push('"token":'+uid );
        };

        item.push( '"id":"'+ describe[p].id+'"' );
        item.push( '"qualifier":"'+ describe[p].privilege+'"' );

        if( describe[p].type==='*' || describe[p].type==='void' )
        {
            item.push( '"type":"'+ describe[p].type+'"' );
        }else{

            if( describe[p].type.indexOf('.') > 0  )
            {
                item.push( '"type":System.define("'+ describe[p].type+'")' );
            }else {
                item.push('"type":' + describe[p].type);
            }
        }

        if( typeof describe[p].value === "object" )
        {
            var val=[];
            if ( describe[p].value.get )val.push('get:' +describe[p].value.get.value );
            if ( describe[p].value.set )val.push('set:' +describe[p].value.set.value );
            item.push( '"value":{'+val.join(',')+'}' );

        }else if( describe[p].value )
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
    syntaxDescribe.forEach(function(o){

        index++;
        var str = '(function(){\n';
        for (var i in o.import)
        {
            if( !globals[i]  )
            {
                str += 'var ' + i + '=System.define("' + module( getImportClassByType(o, i ) ).fullclassname + '");\n';
            }
        }

        var descriptor = [];
        str += 'var ' + o.classname + ';\n';
        if(  o.id!=='interface' )
        {
            str += 'var __prop__;\n';
            str += 'var __call__;\n';
            descriptor.push('\n"constructor":' + o.constructor.value);
            descriptor.push('\n"implements":[' + o.implements.join(',') + ']');
            descriptor.push('\n"final":' + !!o.isFinal);
            descriptor.push('\n"dynamic":' + !!o.isDynamic);
            descriptor.push('\n"filename":"' + o.filename + '"');
            descriptor.push('\n"static":' + toValue(o.static));
        }else
        {
            descriptor.push('\n"constructor":null');
        }
        descriptor.push('\n"token":"' + o.uid + '"');
        descriptor.push('\n"extends":' + o.inherit);
        descriptor.push('\n"classname":"' + o.classname + '"');
        descriptor.push('\n"package":"' + o.package + '"');
        descriptor.push('\n"proto":' + toValue(o.proto, o.uid));
        descriptor = '{' + descriptor.join(',') + '}';
        if( o.id!=='interface' )
        {
            str += o.classname + '=System.define("' + o.fullclassname + '",' + descriptor + ');\n';
            str += '__prop__=' + o.classname + '.prop;\n';
            str += '__call__=' + o.classname + '.call;\n';
        }else
        {
            str += o.classname + '=System.define("' + o.fullclassname + '",' + descriptor + ', true);\n';
        }
        str += '})();\n';
        code.push( str );
    });

    var mainfile = pathfile( config.main , config.suffix, config.lib );
    var filename = PATH.resolve(PATH.dirname( mainfile ),PATH.basename(mainfile,config.suffix)+'-min.js' );
    var system = fs.readFileSync( PATH.resolve(config.make, './lib/System.js') , 'utf-8');

    fs.writeFileSync(  filename,[
        '(function(){\n',
        'var System = '+system,
        '\n',
        '(function(Object, Class){\n',
        code.join(''),
        'delete System.define;\n',
        'var main='+getMethods('System.getDefinitionByName', ['"'+config.main+'"'] ),
        ';\n',
        'System.new(main);\n',
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