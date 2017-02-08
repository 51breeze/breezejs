const fs = require('fs');
const root = process.cwd();
const QS = require('querystring');
const PATH = require('path');
const Ruler = require('./Ruler.js');
const globals=require('./lib/Descriptions.js');
const Utils = require('./lib/Utils.js');
const config = {
    'suffix':'.as',
    'main':'Main',
    'root':root,
    'cache':'off',
    'cachePath':'./cache',
    'debug':'on',
    'browser':'enable',
    'globals':globals,
    'enableBlockScope':'on',
    'reserved':['let']
};
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
    return  PATH.resolve( lib, file.replace('.',PATH.sep) + suffix );
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
        desc['type']=stack.returnType;
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
function Iteration( stack , module )
{
    var index=0;
    this.stack = stack;
    this.module = module;
    this.index=index;
    this.data=stack.content().slice(0);
    this.prev=undefined;
    this.next=undefined;
    this.current=undefined;
    this.content=[];
    this.seek=function(){
        if( index===0 )stack.dispatcher({type:'(iterationStart)',content:this.content,iteration:this});
        if( index >= this.data.length )
        {
            this.next = undefined;
            stack.dispatcher({type:'(iterationDone)',content:this.content,iteration:this});
            return false;
        }
        this.prev = this.current;
        this.current = this.data[index];
        index++;
        this.next = this.data[index];
        stack.dispatcher({type:'(iterationSeek)',content:this.content,iteration:this});
        if( this.current.value==='return' && this.current.id==='(keyword)' )this.checkReturnType( stack );
        return true;
    };
    stack.returnValues=[];
    if( config.enableBlockScope ==='on')this.parseBlockScope( stack );
    this.parseFunctionScope( stack );
    this.parseArgumentsOfMethodAndConstructor( stack );
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
 * 检查函数的返回类型
 * @param stack
 */
Iteration.prototype.checkReturnType=function(stack)
{
    var fnScope = stack.getScopeOf();
    if( fnScope.returnType && fnScope.returnType !=='*' )
    {
        if( fnScope.returnType ==='void' )
        {
            if(this.next.value !==';')error('can not has return value', 'type', this.current );
            return;
        }
        if(this.next.value ===';')error('Missing return value', 'type', this.current );
        if( fnScope.returnType ==='Object' )return;
        this.content.push('return ');
        var info = '"' + this.current.line + ':' + this.current.cursor + '"';
        this.content.push( this.module.classname +".checkType("+info+","+ getDefinedClassName(this.module, fnScope.returnType )+",");
        this.seek();
        this.content.push( toString(this.current, this.module) );
        this.content.push(")");
        this.current={};
    }
}

function getDefinedClassName(classmodule, type)
{
    if( classmodule.type === type )return type;
    if( classmodule.import && classmodule.import[type] && classmodule.import[type].id==='class')return type;
    if( type.indexOf('.') > 0 )
    {
        for(var b in classmodule.import )if( classmodule.import[b] === type )return b;
    }
    return globals[type] ? type : null;
}

/**
 * 生成函数
 * @param stack
 * @returns {string}
 */
Iteration.prototype.parseArgumentsOfMethodAndConstructor=function( stack )
{
    //如果是一个构造函数
    if( stack.keyword()==='function' )
    {
        //运行时检查实例对象是否属于本类
        // content.push( 'if( !(this instanceof '+stack.name()+') )throw new SyntaxError("Please use the new operation to build instances.");\n' );
        if( stack.name() === this.module.classname )
        {
            stack.addListener('(iterationDone)', function (e) {
                var index = this.name() && this.parent().keyword() !== 'class' ? 7 : 5;
                //预留私有属性占位
                e.iteration.content.splice(index, 0, '####{props}####');
                //如果没有调用超类，则调用超类的构造函数
                if (e.iteration.module.inherit && !stack.called) {
                    e.iteration.content.splice(index + 1, 0, e.iteration.module.inherit + '.constructor.call(this);\n');
                }
            }, -500);
        }
    }

    if( stack.keyword() ==='statement' && stack.parent().keyword() === 'function' )
    {
        var items = stack.parent().param();
        var scope = stack.parent().scope();
        var express = [];
        var rest = items.indexOf('...');
        if (rest >= 0) {
            express.unshift(items.slice(-1) + '=Array.prototype.slice.call(arguments, ' + rest + ');\n');
            items = items.slice(0, rest);
        }
        this.content.push( items.join(',') );
        for (var i in items) {
            var desc = scope.define( items[i] );
            desc.type = getType(desc.type);
            if (desc.value instanceof Ruler.STACK)
            {
                var value = toString(desc.value, this.module);
                express.push('if(System.typeOf(' + items[i] + ') === "undefined"){'+value+';}\n');
            }
            if (desc.type !== '*' && desc.type !=='Object')
            {
                express.push('if(!System.is(' + items[i] + ',' + desc.type + '))System.throwError("type","type of mismatch. must is a ' + desc.type + '");\n');
            }
        }
        stack.parent().addListener('(iterationDone)',function (e)
        {
            if(express.length>0)
            {
                var index = this.name() && this.parent().keyword() !=='class' ? 7: 5;
                e.iteration.content.splice( index, 0, express.join('') )
            }
        },-400);
        this.seek();
    }
}



/**
 * 处理块级域
 * @param stack
 */
Iteration.prototype.parseBlockScope=function(stack)
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

        stack.addListener('(iterationDone)',function (e)
        {
            if( hasBlockScope )
            {
                if( stack.keyword()==='do' )
                {
                    e.content.unshift('(function(){');
                    var index = this.parent().content().indexOf(this);
                    index++;
                    if( this.parent().content().length > index && this.parent().content()[ index ].keyword()==='while' )
                    {
                        this.parent().content()[ index ].addListener('(iterationDone)',function (e) {
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
                    var startIndex =  this.name() && this.parent().keyword() !=='class' ? 7 : 5;
                    e.content.splice( startIndex, 0, '(function('+ blockScopeItems.join(',')+'){' );
                    e.content.splice( e.content.length-1,0, '}).call('+['this'].concat(blockScopeItems).join(',')+');' );
                }
            }
        });
    }
}

/**
 * 将var变量提到函数中
 * @param stack
 */
Iteration.prototype.parseFunctionScope=function( stack )
{
    //声明的变量不能当前类模块同名。
    if( stack.keyword() === 'expression' && stack.parent().keyword()==='statement' )
    {
        stack.addListener('(iterationSeek)',function (e)
        {
            if ( e.iteration.current.value === e.iteration.module.classname )
            {
                var desc = e.iteration.stack.getScopeOf().define( e.iteration.current.value );
                if(desc && desc.id !== 'class' )error( '"'+e.iteration.current.value+'" is self class. do not declaration', 'type', e.iteration.current );
            }
        });
    }

    //替换一些关键字
    if( stack.keyword() ==='var' || stack.keyword() ==='const' || stack.keyword() ==='let')
    {
        this.seek();
        if( stack.keyword() !== 'var' || stack.scope().keyword()==='function' )this.content.push('var ');
        if( stack.parent().keyword()==='condition' && stack.parent().parent().keyword() ==='for')
        {
            var forin =function (e) {
                if( e.iteration.current.value==='in')
                {
                    e.content.push(' in ');
                    e.iteration.seek();
                    e.content.push('Iterator(');
                    e.content.push( toString(e.iteration.current, e.iteration.module ) );
                    e.content.push(',true)');
                    e.iteration.current={};
                    stack.removeListener('(iterationSeek)',forin);
                }
            }
            stack.addListener('(iterationSeek)',forin);
        }
    }
    //如果var变量不在函数域中则添加到函数域中
    else if( stack.keyword() === 'statement' && stack.parent().keyword() === 'var' && stack.parent().scope().keyword() !== 'function' )
    {
        var items=[];
        stack.addListener('(iterationSeek)',function (e) {
            if( e.iteration.current instanceof Ruler.STACK )
            {
                items.push( e.iteration.current.content()[0].value );
                var infor = this.scope().keyword() === 'for' && this.parent().content().length === 4 && this.parent().content()[2].value === 'in';
                if( !infor )
                {
                    if (e.iteration.current.content().length === 1)e.iteration.seek();
                    if (e.iteration.current.value === ',')e.iteration.seek();
                }
            }
        });
        stack.scope().getScopeOf().addListener('(iterationDone)',function (e) {
            if( items.length > 0 )
            {
                var startIndex = this.name() && this.parent().keyword() !=='class' ? 7 : 5;
                e.content.splice( startIndex , 0, 'var ' + items.join(',')+';\n' );
            }
            stack.removeListener('(iterationSeek)');
            this.removeListener('(iterationDone)');
        });
    }
}

/**
 * 检查参数类型
 * @param desc
 * @param funExpression
 * @returns Boolean
 */
function checkCallParameter(it, desc, property )
{
    var content = it.current.content();
    var parameters = []
    for( var b in content )
    {
        if( content[b] instanceof Ruler.STACK )
        {
            parameters.push( content[b] );
        }
    }
    var param = property.isglobal ? desc.param : desc.paramType;
    if( param  && param.length > 0 )
    {
        if( parameters.length < param.length )error('Missing parameter', 'syntax', property.lastStack );
        for(var i in desc.param )
        {
            if( desc.param[i]==='...' )
            {
                property.runningCheck=true;
                return true;
            }

            var type = '*';
            if( parameters[i].content().length === 1 )
            {
                var expres =parameters[i].previous();
                if( !(expres instanceof Ruler.STACK) )
                {
                    var t = Utils.getValueTypeof( expres.type ) || Utils.getConstantType( expres.value );
                    if( !t ){
                        var defVal = parameters[i].getScopeOf().define(expres.value);
                        if( defVal )t = defVal.type !== '*' ? defVal.type : defVal.referenceType || '*';
                    }
                    type =t !== '*' ? t : type;
                }
            }

            if( type==='*' )
            {
                type = getType( parameters[i].type() );
                if (parameters[i].keyword() === 'function')type = 'Function';
            }

            if( param[i] === '*' || type==='*' )
            {
                property.runningCheck=true;
                continue;
            }
            //检查参数的类型
            if( !checkTypeOf( it.module , param[i] , type ) )
            {
                error('param type of mismatch. must is a "'+param[i]+'"', 'type', property.lastStack );
            }
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
    if( globals[stack.value] )return true;
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
    var property = {name:[],descriptor:null,thisArg:'',expression:false,before:'',after:'',"super":null,runningCheck:false,lastStack:null,isglobal:false,type:'*'};

    //是否有前置运算符
    if( Utils.isLeftOperator(it.current.value) )
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
            property.type= getType(it.current.type());

        }else
        {
            property.thisArg = toString(it.current, classmodule);
            property.type= getType(it.current.type());
            if( it.current.type() !=='(Array)' )return property;
            type='Array';
            desc = module(type);
            property.isglobal=true;
            property.type = type;
            property.lastStack = getStack(  it.current, true );
        }

    }else
    {
        //是一个引用或者是一个字面量
        if (isReference(it.current))
        {
            //获取字面量类型
            type = Utils.getValueTypeof(it.current.type);
            if (type) {
                desc = globals[type];
                property.isglobal=true;
            }
            //声明的引用
            else {
                desc = it.stack.scope().define(it.current.value);
                if (desc) {
                    desc.type = getType(desc.type);
                    if( desc.id==='let' || desc.id==='const' )
                    {
                        var blockScope = it.stack.scope();
                        while( blockScope && blockScope.keyword()==='function' )blockScope = blockScope.parent().scope();
                        blockScope.dispatcher({"type":"(blockScope)","name":it.current.value, "stack":it.stack, "current":it.current,'scope':desc.scope });
                    }
                }
                 //全局引用
                else
                {
                    desc = globals[it.current.value];
                    property.isglobal=true;
                }
            }
            if (!desc)error('"' + it.current.value + '" is not defined.', 'reference', it.current);
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
            property.type = type || '*';

        }
        //一组常量的值
        else
        {
            type = Utils.getConstantType(it.current.value) || Utils.getValueTypeof(it.current.type);
            if (!type){
                //console.log( it.stack )
                error('Unexpected identifier','syntax',  it.current );
            }
            property.type = type || '*';
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
                property.type='*';

            }else if( it.current.type() === '(expression)' )
            {
                property.expression = true;
                property.param = value;
                property.runningCheck=true;
                property.descriptor = desc;
                if( desc && (desc.id === 'function' || desc.id === 'class') )
                {
                    property.type = desc.type || '*';
                    property.runningCheck=false;
                    //检查函数已定义的参数
                    checkCallParameter( it, desc, property );
                }

                if( property.accessor )error('"' + property.lastStack.value + '" is not function', 'type', property.lastStack );
                if( it.next && (it.next.value==='.' || (it.next instanceof Ruler.STACK && (it.next.type() === '(property)' || it.next.type() === '(expression)' ))))
                {
                    if (type === 'void')error('"' + it.prev.value + '" no return value', 'reference', it.prev);
                    var before = property.before;
                    property.before = '';
                    isstatic=false;
                    property = {name:[],descriptor:null,thisArg:parse(classmodule,property),expression:false,before:before,after:'',"super":null,runningCheck:false,lastStack:property.lastStack};
                }

            }else
            {
                error('Unexpected expression', '');
            }

        } else if( it.next.value === '.' )
        {
            it.seek();
        } else if( it.next.id === '(identifier)' || (it.next.id === '(keyword)' && it.current.value==='.') )
        {
            it.seek();
            property.name.push( it.current.value );
            property.lastStack = it.current;

            if ( desc && desc.type !=='*' && !(desc.referenceType ==='JSON' || desc.referenceType ==='Object') )
            {
                var prevDesc = desc;
                desc = getClassPropertyDesc(it, module( getImportClassByType(classmodule, desc.type) ) , isstatic ? 'static' : 'proto', classmodule);
                type = desc.type;
                property.descriptor = desc;
                property.type = type;
                isstatic= type ==='Class';

                //如果是一个函数或者是一个访问器
                if(desc.id === 'function')
                {
                    if( typeof desc.value === "object" )
                    {
                        var setter = it.next && Utils.isMathAssignOperator(it.next.value);
                        if( setter && !desc.value.set )error( '"'+it.current.value+'" setter does exists');
                        if( !setter && !desc.value.get )error( '"'+it.current.value+'" getter does exists');
                        property.accessor = setter ? 'set' : 'get';
                    }
                }
                //如果下一个是赋值运算符则检查当前的表达式
                else if( it.next && Utils.isMathAssignOperator(it.next.value) )
                {
                    if ( desc.id === 'const' )
                    {
                        if( it.stack.parent().keyword() !=='statement' )error('"' + property.name.join('.') + '" constant is not can be modified', '', it.current);

                    }else if ( desc.id === 'function')
                    {
                        error('"'+property.name.join('.')+'" function is not can be modified', '', it.current);
                    }
                }

                //获取/设置类模块的属性 （所有属性的值是通过对象的uid进行存储）
                if( !isstatic && prevDesc.id==='class' && (desc.id==='var' || desc.id==='const') && !globals[ prevDesc.type ] )
                {
                    property.uid = prevDesc.uid;
                }
                if( desc.id==='function' && property.type === '*' ) property.type = 'Function';

            }else
            {
                property.descriptor = null;
                property.runningCheck=true;
                property.type='*';
            }

        }else
        {
            break;
        }
    }

    //是否有后置运算符
    if( it.next && Utils.isIncreaseAndDecreaseOperator(it.next.value) )
    {
        it.seek();
        property.after = it.current.value;
        property.lastStack = it.current;
    }

    //前后增减运算符只能是一个引用
    if( property.expression && ( property.after || Utils.isIncreaseAndDecreaseOperator(property.before) ) )
    {
        error( '"'+it.next.value+'" can only is reference', 'reference', it.next );
    }
    return property;
}

function checkRunning( classmodule,desc , value , operator )
{
    var method  ='';
    var thisvrg = desc.thisArg || desc.name[0];
    var props   = desc.name;
    var express=[];

    //关键字运算符
    switch (desc.before)
    {
        case 'new'    :  method = classmodule.classname+'.newInstance';desc.before=''; break;
        case 'delete' :  method = 'System.delete' ;desc.before=''; break;
        case 'typeof' :  method = 'System.typeOf' ;desc.before=''; break;
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
    if( thisvrg === props[0]  ){
        props.shift();
        if( props.length===0 )props.push('""');
    }

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
        if( !method )method = classmodule.classname+'.call';

    }else if( value )
    {
        props.push( value );
    }

    if( desc.lastStack )
    {
        props.unshift( '"'+desc.lastStack.line+':'+desc.lastStack.cursor+'"' );
    }

    if( !method )method = classmodule.classname+'.prop';
    if( logicBool )express.push( logicBool );
    express.push( method + '(' + props.join(',') + ')');
    return express.join('');
}

/**
 * 解析一个表达式
 * @param desc
 * @returns {*}
 */
function parse(classmodule, desc , value ,operator, returnValue )
{
    var express=[];
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
    if(desc.coalition===true)return desc.thisArg;
    var check = !desc.descriptor || desc.super || ( desc.expression && desc.descriptor.id !=='function' && desc.descriptor.id !=='class');
    if( !check )
    {
        check = desc.before === 'new' || desc.before === 'delete' || desc.before === 'typeof';
    }
    if( !check && ( desc.expression && ( !desc.descriptor || desc.descriptor.id !=='function' ) ) )
    {
        check=true;
    }

    if( desc.descriptor && desc.descriptor.isAbstract && desc.before ==='new'  )
    {
        error('Abstract class of can not be instantiated', 'syntax', desc.lastStack );
    }

    if( desc.name.length > 1 || (desc.name.length===1 && desc.thisArg) )check = true;

    //运行时检查
    if( check || desc.runningCheck )
    {
        return checkRunning(classmodule, desc , value ,operator );
    }
    return getReferenceOf(classmodule,desc , value , operator);
}

/**
 * 获取描述符的引用
 * @param desc
 * @param value
 * @param operator
 * @returns {string}
 */
function getReferenceOf(classmodule,desc , value , operator)
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
                    if( Utils.isIncreaseAndDecreaseOperator( desc.before ) || Utils.isIncreaseAndDecreaseOperator( desc.after ) )
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
    var type= 'Boolean';
    while( it.next && Utils.isLeftAndRightOperator(it.next.value) && !Utils.isMathAssignOperator(it.next.value)  )
    {
        it.seek();
        operator = it.current.value;
        if ( !it.next )error('Missing expression', '', it.current);
        it.seek();
        if( operator === 'instanceof' || operator === 'is' )
        {
            operator = operator==='instanceof' ? 'instanceOf' : operator;
            express.push('System.'+operator+'('+parse(classmodule, express.pop() )+','+ parse(classmodule, getDescriptorOfExpression(it, classmodule) )+')');

        }else
        {
            if( operator ==='in' ){
                express.push(' ');
            }
            express.push( operator );
            express.push( getDescriptorOfExpression(it, classmodule) );
        }
        if( operator ==='&&' || operator==='||')type='*';
    }

    if( express.length > 1 )
    {
        var items=[];
        for(var i in express )
        {
            items.push( typeof express[i] === "string" ? express[i] : parse(classmodule,express[i]) );
        }
        return {type:type,thisArg:items.join(""),coalition:true,lastStack:express[0].lastStack};
    }
    return express[0];
}

/**
 * 解析表达式
 * @param it
 * @returns {*}
 */
function expression( stack, classmodule )
{
    if( stack.content().length===0 )return '';
    var it = new Iteration( stack , classmodule );
    var express = it.content;
    while ( it.seek() )
    {
        express.push( bunch(it, classmodule) );
        while( it.next && Utils.isMathAssignOperator(it.next.value) )
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
            if( typeof express[0] === "object" && express[0].descriptor )
            {
                express[0].descriptor.valueType=stack.type();
            }
        }
    }

    //赋值运算从右向左（从后向前）如果有赋值
    var describe = valueDescribe = express.pop();
    var value = parse(classmodule, describe );
    if( express.length === 0 )return value;
    var str=[];
    var operator;
    var returnValue = true;
    var separator = stack.parent().keyword()==='object' && stack.parent().type()==='(expression)' ? ',' : ';';
    while (express.length > 0)
    {
        operator = express.pop();
        describe = express.pop();
        if( describe.coalition === true || describe.expression )error('"'+describe.name.join('.')+'" is not reference', 'syntax', describe.lastStack);

        //未声明的引用不能修改
        if( describe.descriptor )
        {
            if( describe.descriptor.id ==='class' || describe.descriptor.id ==='object')
               error('"' + describe.name.join('.') + '" is be protected', 'type', describe.lastStack);
            if( describe.descriptor.id==='const' )
            {
                if( describe.descriptor.constValue )error('"' + describe.name.join('.') + '" is a constant', 'type', describe.lastStack);
                describe.descriptor.constValue = true;
            }
        }

        //有指定类型必须检查
        if( describe.type !=='*' && describe.type !=='Object' && operator==='=' )
        {
            //运行时检查类型
            if( valueDescribe.type === '*' )
            {
                var info = '"' + describe.lastStack.line + ':' + describe.lastStack.cursor + '"';
                value = classmodule.classname+'.checkType(' + info + ',' + describe.type + ',' + value + ')';

            }else if( !checkTypeOf( classmodule, describe.type, valueDescribe.type ) )
            {
                error('"'+describe.name.join('.')+'" type of mismatch. must is "'+describe.type+'"','type', describe.lastStack);
            }
        }

        //设置引用的数据类型
        if( describe.descriptor )describe.descriptor.referenceType = valueDescribe.type || '*';
        var ret = parse(classmodule,describe, value, operator, returnValue);
        if( express.length >0)
        {
            ret+=separator;
            if( describe.type === '*' && valueDescribe.type !=='*')describe.type = valueDescribe.type;
            valueDescribe = describe;
            value = parse(classmodule,describe);
        }
        returnValue = true;
        str.push(ret);
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
    if( classmodule.import && classmodule.import[type] )return classmodule.import[type];
    if( type.indexOf('.') > 0 )return type;
    return globals[type] ? type : null;
}

/**
 * 获取类中成员信息。
 * 如果是继承的类，成员信息不存在时则会逐一向上查找，直到找到或者没有父级类为止。
 * @param it
 * @param refObj 引用类模块
 * @param name 原型链名
 * @param classmodule 当前类模块
 * @returns {*}
 */
function getClassPropertyDesc(it, refObj, name , classmodule )
{
    if( refObj[ name ] )
    {
        var prop = it.current.value;
        //这里引用的是一个类，并非类的实例
        if ( prop === refObj.type )return refObj;
        var desc;
        if( Object.prototype.hasOwnProperty.call(refObj[name], prop) )
        {
            desc = refObj[name][prop];
            //如果在本类中有定义
            if ( desc )
            {
                //非全局模块和外部类需要检查权限
                if( classmodule.type !== refObj.type )checkPrivilege(it, desc, refObj, classmodule );
                return desc;
            }
        }
        var parent = refObj;
        var child;
        //默认继承全局对象
        if( !parent.inherit && refObj.id==='class' && refObj.type !=='Object')parent.inherit='Object';
        //在继承的类中查找
        while (parent && parent.inherit )
        {
            child = parent;
            parent = module( getModuleFullname(parent, parent.inherit ) );
            if ( parent && Object.prototype.hasOwnProperty.call(parent[name],prop) )
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

/**
 * 转换语法
 * @returns {String}
 */
function toString( stack, module )
{
    if( stack.keyword() === 'expression' )
    {
        return expression( stack , module );
    }
    var it = new Iteration(stack, module );
    while ( it.seek() )
    {
        if (it.current instanceof Ruler.STACK)
        {
            it.content.push( toString(it.current, module) );
        } else
        {
            if ( it.current.id === '(keyword)' && (it.current.value === 'in' || it.current.value === 'is' || it.current.value === 'instanceof' ))
            {
                it.content.push(' ');
            }
            it.content.push(it.current.value);
            if ( it.current.id === '(keyword)' && !(it.next.value ==='(' || it.next.value ==='[') )it.content.push(' ');
        }
    }
    return it.content.join('');
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
 * 检查类型
 * 检查 currentType 是否属于 needType 包括接口类型
 * @param needType
 * @param currentType
 * @returns {*}
 */
function checkTypeOf(classModule, needType, currentType )
{
    if( needType==='*' || currentType==='*' || currentType==='void' || needType==='void')return true;
    currentType = module( getImportClassByType( classModule, currentType ));
    var need = module( getImportClassByType( classModule, needType ) );
    var isInterfaceType = need.id==="interface";
    needType = need.classname || need.type;
    if( needType ==='Object' )return true;
    return doPrototype(currentType, function (classModule) {
        if( (classModule.classname || classModule.type) === needType )return true;
        if( classModule.implements && classModule.implements.length > 0 && isInterfaceType )for( var i in classModule.implements )
        {
            return doPrototype( module( getImportClassByType( classModule, classModule.implements[i] ) ) ,function (interfaceModule) {
                if( interfaceModule.classname === needType )return true;
            });
        }
    });
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
        classModule.constructor.value=classModule.inherit ? 'function(){####{props}####return '+classModule.inherit+'.constructor.call(this);}' : 'function(){####{props}####}';
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
                    if( item.accessor() ==='get' )
                    {
                        props.push('"'+item.name()+'":"__getter__"' );
                    }
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
        props = 'Object.defineProperty(this, "'+classModule.uid+'", {enumerable: false, configurable: false, writable: false, value: {'+props.join(',')+'}});'
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
        //侦听块级域
        if( config.enableBlockScope==='off' )
        {
           R.addListener("(statement)", function (e) {
               if( e.desc.id !=='var' )e.desc.scope =this.scope().getScopeOf();
           });
        }

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
        for (var i in o.import)if( !globals[i]  )
        {
           str += 'var ' + i + '=System.define("' + module( getImportClassByType(o, i ) ).fullclassname + '");\n';
        }
        var descriptor = [];
        if(  o.id!=='interface' )
        {
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
        descriptor.push('\n"isAbstract":'+(!!o.isAbstract) );
        descriptor.push('\n"proto":' + toValue(o.proto, o.uid));
        descriptor = '{' + descriptor.join(',') + '}';
        str += 'var '+o.classname + '=System.define("' + o.fullclassname + '",' + descriptor + ', '+(o.id==='interface' ? 'true': 'false')+');\n';
        str += '})();\n';
        code.push( str );
    });

    var mainfile = pathfile( config.main , config.suffix, config.lib );
    var filename = PATH.resolve(PATH.dirname( mainfile ),PATH.basename(mainfile,config.suffix)+'-min.js' );
    var system = fs.readFileSync( PATH.resolve(config.make, './lib/System.js') , 'utf-8');

    fs.writeFileSync(  filename,[
        '(function(){\n',
        system,
        '\n',
        '(function(Object,Array, String,Class,Interface,JSON,Iterator){\n',
        code.join(''),
        'delete System.define;\n',
        'var main=System.getDefinitionByName("'+config.main+'");\n',
        'System.factory(main);\n',
        '})(System.Object,System.Array,System.String,System.Class,System.Interface,System.JSON,System.Iterator);\n',
        '})();'].join('') );
    console.log('Making done.' );
}

// 合并传入的参数
var arguments = process.argv.splice(1);
config.make = PATH.dirname( arguments.shift() );
for(var b in arguments )Utils.merge(config, QS.parse( arguments[b] ) );
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
    Utils.merge(config,data);
}

//必须指主文件
if( !config.main )
{
    console.log('main file can not is empty');
    process.exit();
}
start();