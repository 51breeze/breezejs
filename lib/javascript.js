const fs = require('fs');
const PATH = require('path');
const Ruler = require('./ruler.js');
const Utils = require('./utils.js');
var defineModules={};
var enableBlockScope=false;
var globals={};

/**
 * 皮肤文件
 * @type {{}}
 */
const skinContents=[];

/**
 * 样式内容
 * @type {{}}
 */
var styles=[];

/**
 * 全局模块
 * @param name
 * @returns {{}}
 */
function getmodule(classname)
{
    var ref = defineModules[classname] || globals[classname];
    if(ref == null)return null;
    return ref.id == null && globals.hasOwnProperty(classname) ? globals[classname] : ref;
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
    this.state=true;
    this.seek=function(){
        if( !this.state )return false;
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
        if( this.next && this.next.value==='in')this.nextIn( stack );
        if( this.next && this.next.value==='of')this.nextOf( stack );
        return true;
    };
    stack.returnValues=[];
    if( enableBlockScope )this.parseBlockScope( stack );
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

Iteration.prototype.nextIn=function(stack)
{
    var infor=false;
    if( stack.parent().keyword() === 'statement' )
    {
        if( stack.parent().parent().parent().keyword() === "condition" )
        {
            infor = stack.parent().parent().parent().parent().keyword() === 'for';
        }
    }

    if( !infor )
    {
        var name = this.current.value;
        this.seek();
        if( !this.next )error('Missing expression','syntax', this.current );
        this.seek();
        var property = getDescriptorOfExpression(this, this.module);
        this.state=false;
        var obj = parse( this.module, property);
        this.content.push({
            name:[],
            descriptor:null,
            thisArg:'Reflect.has('+obj+','+name+')',
            expression:false,
            before:[],
            after:'',
            "super":null,
            runningCheck:false,
            lastStack:property.lastStack,
            isglobal:false,
            type:'Boolean'
        });

    }else
    {
        if( stack.parent().content().length > 1 )error('Can only statement one','syntax', this.current);
        var name = this.current.value;
        var desc = stack.scope().define( name );
        if( desc )desc.referenceType='String';
        var funScope = stack.scope().getScopeOf();
        funScope.forIterator >>= 0;
        var itn = '__$it'+(funScope.forIterator++)+'__';
        this.seek()
        this.seek()
        var property = getDescriptorOfExpression(this, this.module);
        this.state=false;
        this.content.push({
            name:[],
            descriptor:null,
            thisArg:'var '+itn+' = Iterator('+parse( this.module, property)+');'+itn+'.seek() && ('+name+'='+itn+'.current().key)!=null;',
            expression:false,
            before:[],
            after:'',
            "super":null,
            runningCheck:false,
            lastStack:property.lastStack,
            isglobal:false,
            type:'String'
        });
    }
}

Iteration.prototype.nextOf=function(stack)
{
    var infor=false;
    if( stack.parent().keyword() === 'statement' )
    {
        if( stack.parent().parent().parent().keyword() === "condition" )
        {
            infor = stack.parent().parent().parent().parent().keyword() === 'for';
        }
    }
    if( !infor )error('keyword the "of" can only in for iterator','syntax');
    if( stack.parent().content().length > 1 )error('Can only statement one','syntax', this.current);

    var name = this.current.value;
    var desc = stack.scope().define( name );
    if( desc )desc.referenceType='String';

    var funScope = stack.scope().getScopeOf();
    funScope.forIterator >>= 0;
    var itn = '__$it'+(funScope.forIterator++)+'__';

    this.seek();
    this.seek();
    var property = getDescriptorOfExpression(this, this.module);
    this.state=false;
    this.content.push({
        name:[],
        descriptor:null,
        thisArg:'var '+itn+' = Iterator('+parse( this.module, property)+'); '+itn+'.seek();',
        expression:false,
        before:[],
        after:'',
        "super":null,
        runningCheck:false,
        lastStack:property.lastStack,
        isglobal:false,
        type:'String'
    });
    var seek = function (e) {
        if( e.iteration.current.value==='{' ){
            e.iteration.seek();
            e.iteration.content.push('{ '+name+'='+itn+'.current().value;');
            stack.scope().removeListener('(iterationSeek)',seek);
        }
    }
    stack.scope().addListener('(iterationSeek)',seek);
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
        this.content.push( this.module.classname +".check("+info+","+ getDefinedClassName(this.module, fnScope.returnType )+",");
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
    //使用全名
    if( defineModules.hasOwnProperty(type) )
    {
        return type;
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
        if( stack.name() === this.module.classname && !stack.static() && stack.parent().keyword() === 'class')
        {
            stack.addListener('(iterationDone)', function (e)
            {
                var param = stack.param();
                var index = e.iteration.content.indexOf('{');

                //预留私有属性占位
                e.iteration.content.splice(++index, 0, '####{props}####');

                //如果没有调用超类，则调用超类的构造函数
                if (e.iteration.module.inherit && !stack.called)
                {
                    e.iteration.content.splice(index + 1, 0, 'Reflect.apply('+e.iteration.module.inherit+',this);\n');
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
            express.unshift( 'var '+items.slice(-1)+'=Array.prototype.slice.call(arguments, ' + rest + ');\n');
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
                express.push('if(!System.is(' + items[i] + ',' + desc.type + '))Internal.throwError("type","type of mismatch. must is a ' + desc.type + '");\n');
            }
        }
        stack.parent().addListener('(iterationDone)',function (e)
        {
            if(express.length>0)
            {
                var index =  e.iteration.content.indexOf('{');
                e.iteration.content.splice( ++index, 0, express.join('') )
            }

        },-400);
        this.seek();
        this.state=false;
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
                    var startIndex = e.content.indexOf(')');
                    if( e.content[++startIndex] ==='{')startIndex++;
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
    }
    //如果var变量不在函数域中则添加到函数域中
    else if( stack.keyword() === 'statement' && stack.parent().keyword() === 'var' && stack.parent().scope().keyword() !== 'function' )
    {
        var items=[];
        var seek = function (e)
        {
            //is expression
            if( e.iteration.current instanceof Ruler.STACK )
            {
                items.push(e.iteration.current.content()[0].value);
                if (e.iteration.current.content().length === 1){
                    e.iteration.seek();
                    if (e.iteration.current.value === ',')e.iteration.seek();
                }
            }
        }
        var done = function (e)
        {
            if( items.length > 0 )
            {
                var startIndex = e.content.indexOf('{');
                e.content.splice( ++startIndex , 0, 'var ' + items.join(',')+';\n' );
            }
            stack.removeListener('(iterationSeek)',seek );
            this.removeListener('(iterationDone)', done );
        };
        stack.addListener('(iterationSeek)', seek );
        stack.scope().getScopeOf().addListener('(iterationDone)', done);
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
    var parameters = [];
    var index = 0 ;
    var param = desc ? (property.isglobal ? desc.param : desc.paramType) : null;
    var acceptType;
    if( !param && desc && !property.isglobal && desc.id==='function' && !desc.paramType  && desc.reference instanceof Ruler.STACK )
    {
        param = desc.reference.param();
        desc.paramType=[];
        for(var i in param )
        {
            if( param[i] ==='...')
            {
                desc.paramType.push('*');

            }else
            {
                var obj = desc.reference.define( param[i] );
                obj.type = getType(obj.type);
                desc.paramType.push( obj.type );
            }
        }
        param = desc.paramType;
    }

    if( it.current.content().length > 0 )
    {
        var it = new Iteration(it.current, it.module);
        while (it.seek())
        {
            if (it.current instanceof Ruler.STACK)
            {
                acceptType = param && param[index] !=='...' ? param[index] : '*';
                parameters.push( toString(it.current, it.module, acceptType ) );
                index++;

            } else if (it.current.value !== ',')
            {
                error('Invalid identifier token', 'syntax', it.current);
            }
        }
    }

    if( param && parameters.length < param.length )
    {
        for(var i in param )
        {
            if( param[i]==='...' )break;
            if( param[i]==='*' )continue;
            if( parameters[i] === undefined )
            {
                error('Missing parameter', 'syntax', property.lastStack );
            }
        }
    }
    return parameters.join(',');
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


var requirements={};

/**
 * 获取表达式的描述说明
 * @param it
 * @param classmodule
 * @returns {*}
 */
function getDescriptorOfExpression(it, classmodule)
{
    //标记一个状态，如果是false表示跳过这段代码的解析
    if( it.state === false )return '';

    var type;
    var desc;
    var property = {name:[],descriptor:null,thisArg:'',expression:false,before:[],after:'',"super":null,runningCheck:false,lastStack:null,isglobal:false,type:'*'};

    //是否为一个前置运算符
    while ( Utils.isLeftOperator(it.current.value) )
    {
        var is = Utils.isIncreaseAndDecreaseOperator(it.current.value);
        if( ( !it.next && is ) || (it.next && it.next.type !=='(identifier)' && is) )error('"'+it.current.value+'" after must be is expression reference')
        property.before.push( it.current.value );
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
            if( it.current.valueType && it.current.valueType.length===1 )
            {
                type = it.current.valueType[0];
                desc = getmodule( type );
            }
            property.type= type;
            property.lastStack = getStack( it.current );

        }else
        {
            property.thisArg = toString(it.current, classmodule);
            property.type= getType( it.current.type() );
            property.lastStack = getStack( it.current );
            if( it.current.type() !=='(Array)' )return property;
            type='Array';
            desc = getmodule(type);
            property.isglobal=true;
            property.type = type;
        }

    }else
    {
        //是一个引用或者是一个字面量
        if (isReference(it.current))
        {
            //获取字面量类型
            type = Utils.getValueTypeof( it.current.type );
            if (type)
            {
                desc = globals[type];
                property.isglobal=true;
            }
            //声明的引用
            else
            {
                desc = it.stack.scope().define(it.current.value);
                if (desc)
                {
                    desc.type = getType(desc.type);

                    //对一个变量的引用类型
                    if( desc.type==='*' && desc.referenceType )
                    {
                        desc.type = desc.referenceType;
                    }

                    //触发一个块级域事件
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
                    if( globals.hasOwnProperty( it.current.value ) )
                    {
                        desc = globals[ it.current.value ];
                        requirements[ it.current.value ]=true;
                    }
                    if( !desc && globals.System.static.hasOwnProperty(it.current.value) )
                    {
                        property.name.push('System');
                        desc = globals.System;
                        if( desc.static[it.current.value].id==='object'){
                            desc = desc.static[it.current.value];
                        }
                    }
                    property.isglobal=true;
                }
            }

            //引用一个类的全名 client.skins.Pagination
            if( !desc && it.current.type==='(identifier)' && it.next && it.next.value==='.' )
            {
                var classType=[];
                do{
                    if( !(it.current.value==='.' || it.current.type==='(identifier)') )break;
                    classType.push( it.current.value );
                }while ( it.seek() )
                type = classType.join('');
                desc = getmodule( type );
                property.thisArg="Internal.define('"+type+"')";
                if (!desc)error('"' + type + '" is not defined.', 'reference', it.current);
                desc.referenceType = 'Class';
                //desc.type='Class';
            }

            if (!desc)error('"' + it.current.value + '" is not defined.', 'reference', it.current);

            //如果是调用超类
            if( it.current.value==='super' )
            {
                //super 只能在类成员函数中
                if( it.stack.getScopeOf().parent().keyword() !=='class' )
                {
                    error('Unexpected identifier "'+it.current.value+'"', 'syntax', it.current);
                }
                property.super = desc.type;

            }else
            {
                //如果this不在类函数的成员中,则表示this是一个函数对象，则并非是类对象
                if( it.current.value==='this' && it.stack.getScopeOf().parent().keyword() !=='class' )
                {
                    desc={'type':'*'};
                }
                if( it.current.value )property.name.push( it.current.value );
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
                error('Unexpected identifier','syntax',  it.current );
            }
            property.type = type || '*';
            property.thisArg = it.current.value;
            property.lastStack = it.current;
            property.isglobal=true;
            return property;
        }
    }
    var isstatic = it.current.value === type || type==='Class' || (desc && desc.id==='object');
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
            var value;
            if( it.current.type() === '(property)' )
            {
                desc = null;
                value = toString(it.current, classmodule,'String');
                if( !value )error('Missing expression', 'syntax', property.lastStack );
                if(  Utils.isConstant( value ) && value !=='this' )
                {
                    value = '"'+value+'"';
                }
                if( property.name.length > 0)
                {
                    var before = property.before;
                    property.before=[];
                    property.thisArg = parse(classmodule,property);
                    property.name=[];
                    property.before=before;
                }
                property.name.push( [value] );
                property.descriptor = desc;
                property.runningCheck=true;
                property.type='*';

            }else if( it.current.type() === '(expression)' )
            {
                if( property.accessor )
                {
                    var props = [ property.super ? 'super' : property.thisArg ].concat( property.name );
                    error('"' + props.join('.') + '" is not function', 'type', property.lastStack );
                }
                property.runningCheck=true;
                property.descriptor = desc;
                property.expression = true;
                value = checkCallParameter( it, desc, property );
                property.param = value;
                if( desc && (desc.id === 'function' || desc.id === 'class' || desc.referenceType==='Function') )
                {
                    property.type = desc.type || '*';
                    property.runningCheck=false;
                }
                if( it.next && (it.next.value==='.' || (it.next instanceof Ruler.STACK && (it.next.type() === '(property)' || it.next.type() === '(expression)' ))))
                {
                    if (type === 'void')error('"' + it.prev.value + '" no return value', 'reference', it.prev);
                    isstatic=false;
                    var _before = property.before.slice();
                    var before=property.before.pop();
                    if(before==='new')
                    {
                        _before.pop();
                        property.before=[before];
                    }
                    property.thisArg = parse(classmodule,property);
                    property.name=[];
                    property.descriptor=null;
                    property.super=null;
                    property.isglobal=false;
                    property.expression=false;
                    property.before = _before;
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
            if( property.name.length > 0)
            {
                var before = property.before;
                property.before=[];
                property.thisArg = parse(classmodule,property);
                property.name=[];
                property.before=before;
                delete  property.accessor;
            }

            if( it.current.value )property.name.push( it.current.value );
            property.lastStack = it.current;

            if ( desc && !(desc.type ==='*' || desc.type ==='JSON' || desc.type ==='Object') )
            {
                var prevDesc = desc;

                if( desc.id !=='function' && desc.type === 'void' )
                {
                    error( '"'+property.name.join('.')+'" void type can only be defined in function return','type', property.lastStack );
                }

                var classType= getImportClassByType(classmodule, desc.type)
                if( desc.notCheckType !== true )
                {
                    desc = getClassPropertyDesc(it, getmodule( classType ) , isstatic ? 'static' : 'proto', classmodule);
                }

                type = desc.type;
                property.descriptor = desc;
                property.type = type;
                isstatic= type ==='Class' || desc.id==='object';

                //如果是一个函数或者是一个访问器
                if(desc.id === 'function')
                {
                    if( typeof desc.value === "object" )
                    {
                        var setter = it.next && Utils.isMathAssignOperator(it.next.value);
                        if( setter && !desc.value.set )error( '"'+it.current.value+'" setter does exists');
                        if( !setter && !desc.value.get )error( '"'+it.current.value+'" getter does exists');
                        property.accessor = setter ? 'set' : 'get';
                        if( property.accessor === 'get' )
                        {
                            property.type = type;
                        }
                    }
                }
                //如果下一个是赋值运算符则检查当前的表达式
                else if( it.next && Utils.isMathAssignOperator(it.next.value) )
                {
                    if ( desc.id === 'const' )
                    {
                        if( it.stack.parent().keyword() !=='statement' )error('"' + property.name.join('.') + '" is not writable', '', it.current);

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

                //如果只是对一个函数的引用
                if( desc.id==='function' && !property.accessor ) property.type = 'Function';

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
    if( (property.after && property.before.length>0) || (property.expression && property.after) )
    {
        error( '"'+it.next.value+'" can only is reference', 'reference', it.next );
    }

    //类型转换运算符
    if( it.next && it.next.value==='as' )
    {
          it.seek();
          it.seek();
          var totype=[];
          do{
                if( !(it.current.value==='.' || it.current.type==='(identifier)') )break;
                totype.push( it.current.value );
          }while ( it.seek() );

          if( totype.length<1 )
          {
              error( 'Unexpected keyword "as" ', 'type', property.lastStack );
          }
          var typename =  getDefinedClassName( classmodule, totype.join("") );
          if( !typename )
          {
              error( '"'+totype.join("")+'" is not exists', 'type', property.lastStack );
          }
        
        var info = '"' + property.lastStack.line + ':' + property.lastStack.cursor + '"';
        var before = property.before;
        property.before=[];
        property.thisArg = operateMethodOfCheckType(classmodule, "Internal.define('"+typename+"')", parse(classmodule,property), info );
        property.name=[];
        property.descriptor=null;
        property.runningCheck=false;
        property.isglobal=false;
        property.before=before;
        property.accessor='';
        property.expression=false;
        property.type = typename;
        it.stack.valueType = typename;
    }

    var _p=it.stack.parent();
    if( _p && _p.keyword()==='object' && _p.type()==='(expression)' && property.type !=='*' )
    {
        var _valueType = _p.valueType || (_p.valueType=[]);
        if( _valueType.indexOf(property.type) <0) {
            _valueType.push(property.type);
        }
    }
    return property;
}

function getOperateMethodProps( props )
{
    return props.length>1 ?  '['+props.join(',')+']': props.join('');
}

function operateMethodOfCheckType( classmodule,type,value,info )
{
    return classmodule.classname + '.check(' + info + ',' + type + ',' + value+ ')';
}

function operateMethodOfGet(classmodule, thisvrg, desc, props ,info, before)
{
    var method = classmodule.classname + '.get';
    var param = [info,thisvrg,'undefined','undefined','undefined'];
    var index = 2;
    before = before || '';
    if( before && !Utils.isIncreaseAndDecreaseOperator(before) )before='';
    if( props.length > 0 )
    {
        index=2;
        param.splice(index++,1, getOperateMethodProps( props ) );
    }

    if( before || desc.after )
    {
        index=3;
        param.splice(index++,1, '"'+(before ? before+';' : ';'+desc.after)+'"' );
    }

    if( desc.super )
    {
        if( index===2 )return desc.super;
        index=4;
        param.splice(1,1,desc.super);
        param.splice(index++,1,thisvrg);
    }
    if( index===2)return before+thisvrg+desc.after;
    param.splice(index,3);
    return method+'('+param.join(',')+')';
}

function operateMethodOfSet(classmodule, thisvrg, desc, props ,info, value, operator )
{
    var method = classmodule.classname + '.set';
    var param = [info,thisvrg,'undefined','undefined','undefined','undefined'];
    var index = 2;
    if( props.length === 0 )return thisvrg+(operator||'=')+value;
    param.splice(index++,1,getOperateMethodProps( props ) );
    param.splice(index++,1,value);
    if( desc.super )
    {
        index=5;
        param.splice(1,1,desc.super);
        param.splice(index++,1,thisvrg);
    }
    param.splice(index,4);
    return method+'('+param.join(',')+')';
}

function operateMethodOfApply(classmodule, thisvrg, desc, props ,info)
{
    var method = classmodule.classname + '.apply';
    var param = [info,thisvrg,'undefined','undefined','undefined'];
    var index = 2;
    if( props.length > 0 )param.splice(index++ ,1, getOperateMethodProps( props ) );
    if( desc.param )
    {
        index=3;
        param.splice(index++,1,'[' + desc.param + ']' );
    }

    if( desc.super )
    {
        index=4;
        param.splice(1,1,desc.super);
        param.splice(index++,1,thisvrg);
    }
    param.splice(index,3);
    return method+'('+param.join(',')+')';
}

function operateMethodOfNew( classmodule, express, desc, info )
{
    var method = classmodule.classname + '.newin';
    var param = [info,express,'undefined'];
    var index = 2 ;
    if( desc.param )param.splice(index++,1,'[' + desc.param + ']' );
    param.splice(index,1);
    return method+'('+param.join(',')+')';
}

function operateMethodOfDel(classmodule, thisvrg, desc, props ,info)
{
    var method = classmodule.classname + '.del';
    var param = [info,thisvrg,'undefined','undefined'];
    var index = 2;
    if( props.length > 0 )param.splice(index++,1, getOperateMethodProps( props ) );
    if( desc.super )
    {
        index=3;
        param.splice(1,1,desc.super);
        param.splice(index++,1,thisvrg);
    }
    param.splice(index,2);
    return method+'('+param.join(',')+')';
}

/**
 * 运行时验证引用及操作
 * @param classmodule
 * @param desc
 * @param value
 * @param operator
 * @returns {string}
 */
function checkRunning( classmodule, desc , value , operator )
{
    var thisvrg = desc.thisArg || desc.name[0];
    var props   = desc.name.slice();

    //调用超类属性或者方法
    if( desc.super )thisvrg = 'this';

    //如果引用对象和属性对象完全相同就删除
    if( thisvrg === props[0] )props.shift();

    //前置运算符
    var beforeOperator = desc.before.pop() || '';

    //引用的属性名
    props = props.map(function (item) {
        //动态属性
        if ( item instanceof Array )return item.join('');
        return '"' + item + '"';
    });

    var info='""';

    //当前引用所在行信息
    if (desc.lastStack && desc.lastStack.line )
    {
        info='"' + desc.lastStack.line + ':' + desc.lastStack.cursor + '"';
    }

    var express;
    if( beforeOperator==='new' )
    {
        express=operateMethodOfNew(classmodule, operateMethodOfGet(classmodule, thisvrg, desc, props ,info), desc, info);
        beforeOperator= desc.before.pop();

    }else if( beforeOperator==='delete' )
    {
        express=operateMethodOfDel(classmodule, thisvrg, desc, props ,info);
        beforeOperator= desc.before.pop();

    }else if( beforeOperator==='typeof' )
    {
        express='System.typeOf('+operateMethodOfGet(classmodule, thisvrg, desc, props ,info)+')';
        beforeOperator= desc.before.pop();

    }else
    {
        if (desc.expression)
        {
            express = operateMethodOfApply(classmodule, thisvrg, desc, props, info);
        } else if (value)
        {
            express = operateMethodOfSet(classmodule, thisvrg, desc, props, info, value, operator);
        } else {
            express = operateMethodOfGet(classmodule, thisvrg, desc, props, info, beforeOperator);
        }
        if( beforeOperator && Utils.isIncreaseAndDecreaseOperator(beforeOperator) )beforeOperator = desc.before.pop();
    }

    //组合前置运算符
    while ( beforeOperator )
    {
        //关键字运算符
        switch ( beforeOperator )
        {
            default :
                express = beforeOperator+' '+express;
        }
        beforeOperator = desc.before.pop();
    }
    return express;
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
    if( desc.descriptor && desc.descriptor.isAbstract && desc.before ==='new'  )
    {
        error('Abstract class of can not be instantiated', 'syntax', desc.lastStack );
    }

    if( desc.name.length > 1 || (desc.name.length===1 && desc.thisArg) )check = true;

    //运行时检查
    //if( check || desc.runningCheck )
        return checkRunning(classmodule, desc , value ,operator );
    //获取引用 未实现后续时再优化
    return getReferenceOf(classmodule, desc , value , operator);
}

/**
 * 获取描述符的引用
 * @param desc
 * @param value
 * @param operator
 * @returns {string}
 */
function getReferenceOf( classmodule, desc , value , operator)
{
    var _operator = desc.before.length >0 ? desc.before.pop() : '';
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
    var type= '*';
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
            type= 'Boolean';

        }else
        {
            var value = getDescriptorOfExpression(it, classmodule);
            if( operator ==='in' )
            {
                express.push(' ');
                type= 'Boolean';

            }else if( Utils.isMathOperator(operator) )
            {
                type = 'Number';
            }

            if( operator==='+' && value.type !== 'Number' )
            {
                type='String';
            }
            express.push( operator );
            express.push( value );
        }
    }

    //逻辑表达式  a && b  或者是 运算表达式 a instanceof b  a > b
    if( express.length > 1 )
    {
        var items=[];
        var lastStack;
        for(var i in express )
        {
            if( typeof express[i] !== "string" && express[i].lastStack )lastStack=express[i].lastStack;
            items.push( typeof express[i] === "string" ? express[i] : parse(classmodule,express[i]) );
        }
        return {type:type,thisArg:items.join(""),coalition:true,lastStack:lastStack};
    }
    return express[0];
}

/**
 * 解析表达式
 * @param it
 * @returns {*}
 */
function expression( stack, classmodule ,  acceptType )
{
    if( stack.content().length===0 )return '';
    var it = new Iteration( stack , classmodule );
    var express = it.content;
    var val;
    while ( it.seek() )
    {
        val = bunch(it, classmodule);
        if(val)express.push( val );

        // a = b or a += b ;
        while( it.next && Utils.isMathAssignOperator(it.next.value) )
        {
            it.seek();
            express.push( it.current.value );
            if (!it.next)error('Missing expression', '', it.current);
            it.seek();
            var current = it.current;
            val = bunch(it, classmodule);
            if(val)express.push(val);
            if( current instanceof Ruler.STACK )
            {
                if( getType( stack.type() ) ==='*' )stack.type( current.type() );
            }
            //给声明的属性设置值的类型
            if( typeof express[0] === "object" && express[0].descriptor )
            {
                express[0].descriptor.valueType=stack.type();
                //express[0].descriptor.referenceType=stack.type();
            }
        }
    }

    //赋值运算从右向左（从后向前）如果有赋值
    var describe = valueDescribe = express.pop();
    var value = parse(classmodule, describe );
    var str=[];
    if( express.length === 0 )
    {
        str.push(value);

    }else
    {
        var operator;
        var returnValue = true;
        var separator = stack.parent().keyword() === 'object' && stack.parent().type() === '(expression)' ? ',' : ';';
        while (express.length > 0)
        {
            //= += /= *= -= ...
            operator = express.pop();

            //reference expression
            describe = express.pop();
            if( !describe )
            {
                error('Unexpected error');
            }

            //组合的表达式
            if (describe.coalition === true || describe.expression)
            {
                error('"' + describe.name.join('.') + '" is not reference', 'syntax', describe.lastStack);
            }

            //未声明的引用不能修改
            if (describe.descriptor)
            {
                if (describe.descriptor.id === 'class' || describe.descriptor.id === 'object')
                    error('"' + describe.name.join('.') + '" is be protected', 'type', describe.lastStack);
                if (describe.descriptor.id === 'const')
                {
                    if (describe.descriptor.constValue)error('"' + describe.name.join('.') + '" is a constant', 'type', describe.lastStack);
                    describe.descriptor.constValue = true;
                }
            }

            var valueType = getDescribeType(valueDescribe);

            //有指定类型必须检查
            if (describe.type !== '*' && describe.type !== 'Object' && operator === '=' )
            {
                if( describe.descriptor && describe.descriptor.id==='function' && describe.accessor !=='set' )
                {
                    error('"' + describe.name.join('.') + '" is not setter', 'type', describe.lastStack);
                }

                //运行时检查类型
                if ( valueType=== '*' )
                {
                    var info = '"' + describe.lastStack.line + ':' + describe.lastStack.cursor + '"';
                    value = classmodule.classname + '.check(' + info + ',' + describe.type + ',' + value + ')';

                } else if( !checkTypeOf(classmodule, describe.type, valueType, valueDescribe ) )
                {
                    error('"' + describe.name.join('.') + '" type of mismatch. must is "' + describe.type + '"', 'type', describe.lastStack);
                }
            }

            //设置引用的数据类型
            if ( describe.descriptor )
            {
                describe.descriptor.referenceType = valueType;
            }

            var ret = parse(classmodule, describe, value, operator, returnValue);
            if (express.length > 0)
            {
                ret += separator;
                if (describe.type === '*' && valueType !== '*')describe.type = valueType;
                valueDescribe = describe;
                value = parse(classmodule, describe);
            }
            returnValue = true;
            str.push(ret);
        }
    }

    value = str.join('');
    if( acceptType && acceptType !=='*' && acceptType !=='Object' )
    {
        var valueType = getDescribeType(valueDescribe);
        //运行时检查类型
        if ( valueType === '*' )
        {
            var info = '"' + valueDescribe.lastStack.line + ':' + valueDescribe.lastStack.cursor + '"';
            value = classmodule.classname + '.check(' + info + ',' + acceptType + ',' + value + ')';

        } else if ( !checkTypeOf(classmodule, acceptType, valueType, valueDescribe ) && !( stack.parent().type() ==='(property)' && valueType==='Number' ) )
        {
            error('type of mismatch. must is "' + acceptType + '"', 'type', valueDescribe.lastStack);
        }
    }
    return value;
}

function getDescribeType( refDesc )
{
    if( (refDesc.type === '*' || !refDesc.type) && refDesc.descriptor )
    {
        return refDesc.descriptor.referenceType || '*';
    }
    return refDesc.type || '*';
}

/**
 * 根据类型获取类全名
 * @param classmodule
 * @param type
 * @returns {*}
 */
function getImportClassByType(classmodule, type )
{
    //全类型名称
    if( type.indexOf('.') > 0 && defineModules.hasOwnProperty(type) )
    {
        return type;
    }

    if( classmodule.type === type || classmodule.classname===type)return classmodule.fullclassname;
    if( classmodule.import && classmodule.import.hasOwnProperty(type) )return classmodule.import[type];
    for( var i in classmodule.import )if( classmodule.import[i]===type )
    {
        return type;
    }
    if( globals.hasOwnProperty(type) )return type;
    error( '"'+type+'" type does exists','type');
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
function getClassPropertyDesc(it, refObj, name , classmodule , flag)
{
    if( refObj )
    {
        var prop = it.current.value;
        //这里引用的是一个类，并非类的实例
        if ( prop === refObj.type )return refObj;
        var desc;
        if( refObj[name] && Object.prototype.hasOwnProperty.call(refObj[name], prop) )
        {
            desc = refObj[name][prop];
            //如果在本类中有定义
            if ( desc )
            {
                //非全局模块和外部类需要检查权限
                if( classmodule.type !== refObj.type && !checkPrivilege(desc, refObj, classmodule ) )
                {
                    error('"' + it.current.value + '" inaccessible', 'reference', it.current);
                }
                return desc;
            }
        }
        var parent = refObj;
        var child;

        //在继承的类中查找
        while (parent && parent.inherit && parent.id==='class' )
        {
            child = parent;
            parent = getmodule( getImportClassByType(parent, parent.inherit) );
            if ( parent && parent[name] && Object.prototype.hasOwnProperty.call(parent[name],prop) )
            {
                desc = parent[name][prop];
                if( !checkPrivilege(desc, parent, child ) )
                {
                    error('"' + it.current.value + '" inaccessible', 'reference', it.current);
                }
                return desc;
            }
        }
        //默认都继承对象
        if( globals.Object[name][prop] )
        {
            return globals.Object[name][prop];
        }
    }
    if( classmodule.isDynamic )return {type:'*'};
    if(flag===true)return null;
    error('"' + it.current.value + '" does not exits', 'reference', it.current );
}

/**
 * 检查所在模块中的属性，在当前场景对象中的访问权限
 * @param desc 属性描述
 * @param inobject 查找的类对象
 * @param currobject 当前类对象
 */
function checkPrivilege(desc, inobject, currobject )
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
            return false;
        }
    }
    return true;
}

function metaTypeToString( stack , type )
{
    var content  = stack.content();
    if( stack.keyword()==='metatype'){
        content = content[1].content();
        if( Ruler.META_TYPE.indexOf( content[0].value ) < 0 )
        {
            error('Invaild Metatype label','syntax', content[0]);
        }
        type = content[0].value;
    }

    if( (type==='Embed') && stack.type()==='(expression)')
    {
        if( content[1].previous(0).value !=='source' )
        {
            error('Missing identifier source','syntax', content[1].previous(0) );
        }
    }

    var len = content.length;
    var str=[];
    for(var i=0; i<len; i++)
    {
        if ( content[i] instanceof Ruler.STACK)
        {
            str.push( metaTypeToString( content[i], type ) );

        } else if( content[i].value != null )
        {
            str.push( content[i].value  );
        }else if( typeof content[i] === "string" )
        {
            str.push( content[i]  );
        }
    }
    return str.join('');
}

/**
 * 转换语法
 * @returns {String}
 */
function toString( stack, module, acceptType )
{
    if( stack.keyword() === 'expression')
    {
        return expression( stack , module , acceptType );
    }
    var it = new Iteration(stack, module );
    while ( it.seek() )
    {
        if (it.current instanceof Ruler.STACK)
        {
            it.content.push( toString(it.current, module ) );

        }else if( typeof it.current === "string")
        {
            it.content.push( it.current );
        }
        else
        {
            if ( it.current.id === '(keyword)' && (it.current.value === 'in' || it.current.value === 'is' || it.current.value === 'instanceof' ))
            {
                it.content.push(' ');
            }
            it.content.push(it.current.value);
            if( it.current.value===';' && ( !it.next || it.next.value!=='}' ) )
            {
                it.content.push('\n');
            }
            if ( it.current.id === '(keyword)' && !( it.next && (it.next.value ==='(' || it.next.value ==='[') ) )it.content.push(' ');
        }
    }
    if( stack.keyword() === 'object' && acceptType && acceptType !== '*' && acceptType !== 'Object' )
    {
        var type = getType( stack.type() )
        if( type==='Array' || type==='JSON' || type==='Object' )
        {
           if ( !checkTypeOf(module, acceptType,type) )
           {
                error('type of mismatch. must is "' + acceptType + '"', 'type', getStack( stack ) );
            }
        }
    }
    return it.content.join('');
}


/**
 * 执行模块的原型链，直到回调函数返回值或者已到达最上层为止
 * @param classModule
 * @param callback
 * @returns {*}
 */
function doPrototype(classModule, callback)
{
    while ( classModule )
    {
        var val = callback( classModule );
        if( val )return val;
        if( classModule.inherit )
        {
            classModule = getmodule( getImportClassByType(classModule, classModule.inherit) );
        }else
        {
            return null;
        }
    };
    return null;
}

/**
 * 检查类型
 * 检查 currentType 是否属于 needType 包括接口类型
 * @param needType
 * @param currentType
 * @returns {*}
 */
function checkTypeOf(classModule, needType, currentType, describeType )
{
    if( needType==='*' || needType==='void' || currentType==='Object' || needType==='Object')return true;
    if( currentType ==='void' )return false;
    if( needType==='Class' && currentType==='Function' )return true;
    if( describeType && describeType.descriptor &&  describeType.descriptor.id==='class' )
    {
        currentType = describeType.descriptor.fullclassname ? getmodule( describeType.descriptor.fullclassname ) : describeType.descriptor;
    }else
    {
        currentType = getmodule( getImportClassByType( classModule, currentType ) );
    }
    var need = getmodule( getImportClassByType( classModule, needType ) );
    var isInterfaceType = need.id==="interface";
    needType = need.classname || need.type;
    return doPrototype(currentType, function (classModule) {
        if( (classModule.classname || classModule.type) === needType )return true;
        if( classModule.implements && classModule.implements.length > 0 && isInterfaceType )for( var i in classModule.implements )
        {
            return doPrototype( getmodule( getImportClassByType( classModule, classModule.implements[i] ) ) ,function (interfaceModule) {
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
        var last;
        doPrototype( getmodule( getImportClassByType( classModule, classModule.implements[i] ) ),function (module) {
            if( module.id !== 'interface' )error('Interface can only extends an interface ('+(last || module).filename+')' );
            last = module;
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
            if( !obj )error('the "' + name + '" interface method no implementation ('+classModule.filename+')')
            if( obj.type !== desc[name].type )error('the "' + name + '" interface of mismatch the return type ('+classModule.filename+')')
            if( desc[name].param.length !== obj.param.length )error('the "' + name + '" method parameter no implementation ('+classModule.filename+')')
            if( desc[name].param.length > 0 )
            {
                for(var b in desc[name].paramType )
                {
                    if( desc[name].paramType[b] !== obj.paramType[b] )
                    {
                        error('the "'+name+'" method of mismatch parameter type ('+classModule.filename+')','type');
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
function makeModule( stack , config )
{
    var fullname = stack.fullclassname();
    var classModule = getmodule( fullname );
    if( !classModule )error('"'+fullname+'" does exists');

    //继承父类
    if( classModule.inherit )
    {
        var parent = getmodule( getImportClassByType( classModule, classModule.inherit ) );

        if( !parent )
        {
            error('"'+classModule.inherit+'" does exists');
        }

        //终结的类不可以扩展
        if( parent.isFinal ){

            error('parent class is not extends.');
        }
        if( classModule.id !== parent.id )
        {
            classModule.id==='class' ? error('Class can only extends the class') : error('Interface can only extends the interface');
        }
        //需要的系统模块
        if( globals.hasOwnProperty(classModule.inherit) )requirements[ classModule.inherit ]=true;
    }

    if( stack.keyword() ==='interface' )return classModule;

    //如果有使用到的全局函数必须合并
    for ( var j in classModule.import )
    {
        if( globals.hasOwnProperty( classModule.import[j] ) )
        {
            requirements[ classModule.import[j] ]=true;
        }
    }

    var data = stack.content();
    var i = 0;
    var item;
    var props = [];
    var len = data.length;
    var isstatic = stack.static();
    if( !isstatic )
    {
        classModule.constructor.value=classModule.inherit ?
        'function(){####{props}#### Reflect.apply('+classModule.inherit+',this);}' :
            'function(){####{props}####}';
    }

    //需要实现的接口
    checkInterface(classModule);

    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK && item.keyword() !=='metatype' )
        {
            var val = [];
            //是静态成员还是动态成功
            var ref =  item.static() || isstatic ? classModule.static : classModule.proto;
            //如果有继承检查扩展的方法属性
            var info=null;
            if( classModule.inherit && item.qualifier() !== 'private' )
            {
                info=doPrototype( getmodule( getImportClassByType(classModule,  classModule.inherit ) ),function (module){
                    var desc = !item.static() ? module['proto'] : module['static'];
                    if( desc && desc.hasOwnProperty( item.name() ) && desc[ item.name() ].qualifier !== 'private' )
                    {
                        return desc[ item.name() ];
                    }
                });
            }
            var desc =  ref[ item.name() ];

            //类中的成员方法
            if( item.keyword() === 'function' )
            {
                //父类中必须存在才能覆盖
                if( item.override() && !info )
                {
                    error('"'+item.name()+'" is not exists in parent class','', getStack(item) );
                }
                //扩展父类中方法必须指定override关键字
                else if( !item.override() && info )
                {
                    error('Missing override for "'+item.name()+'"','', getStack(item) );
                }

                //父类成员如果是访问器
                if( info && !item.accessor() && info.value && (info.value.get || info.value.set) )
                {
                    error('override parent function of inconformity for "'+item.name()+'"','', getStack(item) );
                }

                //父类成员如果不是访问器
                if( info && item.accessor() )
                {
                    if( !info.value || !info.value.hasOwnProperty( item.accessor() ) )
                    {
                        error('override parent accessor of inconformity for "'+item.name()+'"','', getStack(item) );
                    }
                    info = info.value[ item.accessor() ];
                }

                //扩展父类的方法必须保持参数和参数类型的一致
                if( item.override() )
                {
                    var param = item.accessor() && desc.value ? desc.value[ item.accessor() ].paramType : desc.paramType;
                    if(info.param &&  info.param.length !== param.length )
                    {
                        error('the override parameters of inconformity for "'+item.name()+'"','', getStack(item) );
                    }
                    for(var b in info.paramType )
                    {
                        if( info.paramType[b] !== param[b] )
                        {
                            error('the override parameter types of inconformity for "'+item.name()+'"','type',getStack(item));
                        }
                    }
                }

                //去掉函数名称
                //item.content().splice(1,1);
                //构造函数
                if( item.name() === stack.name() && !isstatic )
                {
                    item.content().splice(1,1,{'type':'(string)','value':"constructor",'id':'identifier'});
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

                if( typeof desc.value === "string")
                {
                    ret = desc.value;

                } else
                {
                    item.content().shift();
                    var express = item.content()[0].content()[0];
                    var ret = 'null';
                    if (express.content().length > 1) {
                        express.content().splice(0, 2);
                        ret = expression(express, classModule);
                    }
                }

               /* if( metatype )
                {
                    ret ='Internal.define("'+metatype+'")';
                }*/

                //私有属性直接放到构造函数中
                if( !item.static() )
                {
                    props.push('"'+item.name()+'":'+ ret );
                }
                val.push( ret );
            }

            var privilege = info ? info.privilege || 'public' : null;

            //此属性或者方法与父中的成员不兼容的
            if( privilege && privilege !== item.qualifier() )
            {
                error('Incompatible override for "'+item.name()+'"','', getStack(item, true ) );
            }

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
        var event = {type:'(defineProperty)', props:props };
        stack.dispatcher(event);
        props = '\nObject.defineProperty(this, "' + classModule.uid + '",{value:{' + event.props.join(',') + '}});\n';
        classModule.constructor.value = classModule.constructor.value.replace('####{props}####', props);
    }
    return classModule;
}

function getStack( stack , flag )
{
    if( stack instanceof Ruler.STACK )
    {
        var content = stack.content();
        var len = content.length;
        var start = 0;
        while ( start < len )
        {
            var index = flag ? start++ : len-(++start);
            if( !(content[index] instanceof Ruler.STACK) )
            {
                return content[index];
            }
        }
        return getStack( stack.parent() , flag );
    }
    return stack;
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
        var id = describe[p].id;
        var writable=!(id==='const' || id==='function');
        if(describe[p].privilege !=='public')item.push( '"qualifier":"'+ describe[p].privilege+'"' );

        /*if( describe[p].type==='*' || describe[p].type==='void' )
        {
            item.push( '"type":"'+ describe[p].type+'"' );
        }else{
            if( describe[p].type.indexOf('.') > 0  )
            {
                item.push( '"type":System.define("'+ describe[p].type+'")' );
            }else {
                item.push('"type":' + describe[p].type);
            }
        }*/

        if( id==='function' || describe[p].static )
        {
            if (typeof describe[p].value === "object") {
                /* var val=[];
                 if ( describe[p].value.get )val.push('get:' +describe[p].value.get.value );
                 if ( describe[p].value.set )val.push('set:' +describe[p].value.set.value );
                 item.push( '"value":{'+val.join(',')+'}' );*/
                if (describe[p].value.get)item.push('"get":' + describe[p].value.get.value);
                if (describe[p].value.set){
                    writable=true;
                    item.push('"set":' + describe[p].value.set.value);
                }

            } else if (describe[p].value) {
                item.push('"value":' + describe[p].value);
            }
        }
        if( writable=== false )item.unshift('"writable":false' );
        if( item.length > 0)code.push('"'+p+'":{'+item.join(',')+'}');
    }
    if( code.length===0 )return '{}';
    return '{\n'+code.join(',\n')+'\n}';
}

/**
 * 将描述信息构建成类模块
 * @param o
 * @returns {string}
 */
function makeClassModule( o )
{
    var str = '(function($define){\n';
    for (var i in o.import)
    {
        if( globals.hasOwnProperty( o.import[i] )  )
        {
            if( i !== o.import[i] )
            {
                str += 'var ' + i + '=' + o.import[i] + ';\n';
            }
        }else
        {
            str += 'var ' +i + '=$define("' + getmodule( getImportClassByType(o, i) ).fullclassname + '");\n';
        }
    }
    var descriptor = [];
    if( o.id!=='interface' )
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
    str += 'var '+o.classname + '=$define("' + o.fullclassname + '",' + descriptor + ', '+(o.id==='interface' ? 'true': 'false')+');\n';
    str += '}(Internal.define));\n';
    return str;
}

/**
 * 开始生成代码片段
 */
function start(config, makeModules, descriptions , project )
{
    defineModules = descriptions;
    enableBlockScope = config.blockScope==='enable';
    requirements = config.requirements;
    globals = config.globals;

    for( var i in makeModules )
    {
        var moduleObject = makeModules[i];
        Utils.info('  Making '+moduleObject.filename )
        makeModule(moduleObject,config);
    }

    var code=[];
    for(var p in descriptions)
    {
        var o = descriptions[p];
        if( Utils.isEmpty(o) )continue;
        code.push( makeClassModule( o ) );
    };

    var builder = require( '../javascript/builder.js');
    return builder(config, code.join(''), requirements  );
}
module.exports=start;