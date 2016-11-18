const fs = require('fs');
const root = process.cwd();
const QS = require('querystring');
const PATH = require('path');
const Ruler = require('./Ruler.js');
const globals=require('./lib/Global.js');
const config = {'suffix':'.as','main':'main','root':root,'cache':'off','cachePath':'./cache','debug':'on', 'browser':'enable','globals':globals };
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
function createDefaultParam( stack , uid )
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
            var o = createDefaultParam( item );
            obj.param = obj.param.concat( o.param );
            obj.expre = obj.expre.concat( o.expre );

        }else if( item && item.value!==',' )
        {
            if( j===0 ) name = item.value;
            if( item.value === ':' )type = data[++j].value;
            if( item.value === '=' )
            {
                item = data[++j];
                value = item instanceof  Ruler.STACK ? toString(item, uid) : item.value;
            }
        }
    }

    if( name )
    {
        var ps =Ruler.getParentScope(stack);
        var desc = ps.define( name );

        if (value) {
            obj.expre.push(name + '=typeof ' + name + '=== "undefined" ?' + value + ':' + name+';\n');
        }

        if (desc) {

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
function createFunction( stack , uid )
{
    var children = stack.content();
    var i=0;
    var len = children.length;
    var content=[];
    var param;
    var is = stack.parent().keyword()=== 'class' && stack.parent().name()=== stack.name() && stack.keyword()==='function' && !stack.static() && !stack.parent().static();

    for(;i<len; i++)
    {
        var child = children[i];
        if( child instanceof Ruler.STACK )
        {
            if( child.keyword() === 'statement' )
            {
                param = createDefaultParam( child , uid );
                content.push( param.param.join(',') );

            }else
            {
                content.push( toString(child, uid) );
            }
        }
        //获取函数的默认参数
        else
        {
            if( is && child.value==='}' && i+1 === len )
            {
                content.push( '\nreturn this;' );
            }
            content.push( child.value );
            if( child.id==='(keyword)' && i<len )content.push(' ');

            if ( param && child.value === '{' )
            {
                content.push( param.expre.join('') );
                if( is )
                {
                    content.push( 'if( !(this instanceof '+stack.parent().name()+') )throw new SyntaxError("Please use the new operation to build instances.");\n' );
                    if( stack.parent().extends() )
                    {
                        var p = param.param.slice(0);
                        p.unshift('this');
                        content.push( stack.parent().extends()+'.call('+p.join(',')+');\n');
                    }
                    content.push('####{props}####');
                }
                param=null;
            }
        }
    }
    return content.join('');
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
    this.length=this.data.length;
    this.seek=function(){
        if( index >= this.length )return false;
        this.prev = this.current;
        this.current = this.data[index];
        index++;
        this.next = this.data[index];
        return true;
    };
}


Iteration.prototype.constructor=Iteration;

/**
 * @param stack
 * @returns {Array}
 */
function getContentStack( data )
{
    var arr=[];
    for(var i in data )
    {
        if( data[i] instanceof Ruler.STACK )
        {
            arr.push( data[i] );
        }
    }
    return arr;
}


/**
 * 生成表达式
 * @param it
 * @param desc
 * @param scope
 * @returns {string}
 */
function createExpression(it, desc , scope , uid )
{
    var str=[];

    //动态属性或者调用
    if( it.current instanceof Ruler.STACK )
    {
        if( !desc )error(it.prev.value + ' is not defined.', 'reference', it.prev );
        str.push( toString(it.current, uid ) );

        //调用函数
        if( it.current.type() === '(expression)' && it.prev && it.prev.type==='(identifier)' )
        {
            if( desc.id !=='function' )error( '"'+it.prev.value+'" is not function', 'type', it.prev );

            //检查参数类型
            if( desc.param instanceof Array )
            {
                var expres = getContentStack( it.current.content() );
                for(var i in desc.param)
                {
                    if( !expres[i] )error('Missing parameter', '', it.prev );

                    //未实现
                   // if( desc.param[i] !=='*' && expres[i].type() !== desc.param[i] )
                        //error('"'+expres[i].value+'" parameter type does not match.', 'type', expres[i] );
                }
            }

            var type =getType( desc.type );
            if( type ==='void' && it.next )error('"'+it.prev.value+'" function not return.', 'reference', it.prev );

            //未指定类型后面的不检查
            if( type ==='*' )
            {
                return str.join('');

            }else if( type !=='void' )
            {
                desc = module( type+'.proto' );
            }
        }
        //检查动态属性是否存在
        else
        {
            //未实现，暂不检查
            return str.join('');

            //[,stack,];
            /*var expres = it.current.previous(-2);
            if( expres instanceof Ruler.STACK )
            {
                var values = expres.returnValues;
                for( var i in values )
                {
                    if( !desc[ values[i].value ] )error('"'+values[i].value+'" property does not exists.', 'reference', values[i] );
                }
                desc = desc[ values[0].value ];
            }*/
        }
    }


    if( !desc )error(it.current.value + ' is not defined.', 'reference', it.current );
    str.push( it.current.value );

    var identifier = it.current.value==='this' ? 'this' : '';
    var isconst = desc.id==='const' || desc.id==='class';

    //这里是声明引用
    if( desc.id==='var' || desc.id==='const' || desc.id==='let' )
    {
        var type = getType(desc.type);
        if( type !=='*' )desc = module( type )
        identifier = it.current.value;
    }
    //访问器
    else if( desc.id==='function' && typeof desc.value === "object" )
    {
        if( it.next && it.next.value === '=' )
        {
            if( !desc.value.get )error('the "'+ it.current.value+'" accessor not setter');
            it.seek();
            it.seek();
            var val = it.current instanceof Ruler.STACK ? toString( it.current , uid ) : it.current.value;
            str.push('.set.call(this,'+ val+')');

        }else
        {
            if( !desc.value.get )error('the "'+it.current.value+'" accessor not getter');
            str.push('.get.call(this)');
        }
    }

    var refPN=null;
    var refCN=null;
    var isStatic=false;




    //引用类模块
    if( desc.id==='class' )
    {
        desc = module( desc.classname || desc.type );
        uid = desc.id;
        refPN = desc.package;
        refCN = desc.classname;
        if( it.current.value === desc.classname )
        {
            desc = desc.static;
            isStatic=true;

        }else
        {
            isStatic=false;
            desc =  desc.proto;
        }
    }

    if( !it.next )return str.join('');

    //调用函数或者动态引用属性
    if (it.next instanceof Ruler.STACK)
    {
        it.seek();
        str.push( createExpression(it, desc, scope, uid) );
    }
    //检测点运算符后面的属性
    else if (it.next.value === '.')
    {
        it.seek();
        str.push(it.current.value);
        it.seek();
        desc = desc[ it.current.value ];
        if( !desc )error(it.current.value+' does not exist.','reference', it.current);

        //类实例属性
        if( identifier && (desc.id==='var' || desc.id==='const') && !isStatic )
        {
            var obj = scope.define('this');

            //包内访问权限
            var internal = obj.scope.parent().name() === refPN && desc.privilege==='internal';

            //子类访问权限
            var ischild =  obj.scope.extends() === refCN && desc.privilege==='protected';

            //自己访问
            var self = identifier === 'this';

            if( desc.inherit )
            {
                var  parent = scope.define( desc.inherit );
                var parent = module( parent.classname );
               uid = parent.id;
            }

            //检查是否有访问的权限
            if( desc.privilege==='public' || self || internal || ischild )
            {
                //私有属性
                if( desc.privilege==='private' )str.splice(0,1, identifier+'["'+uid+'"]' );

            }else{
                error(it.current.value+' does not exist.','reference', it.current)
            }
        }
        str.push( createExpression(it, desc , scope, uid ) );
    }
    //常量不可赋值
    else if (it.next.value === '=' && isconst)
    {
        error('"' + it.current.value + '" is constant', '', it.current );
    }
    return str.join('');
}

/**
 * 获取引用超类成员的表达式
 * @param it
 * @param stack
 * @param uid
 * @returns {string}
 */
function superToString(str, it, info )
{
    //替换成父类的原型引用
    str.splice(0,1,info.type );

    //如果有指定超类方法名
    if( it.next.value==='.' )
    {
        it.seek();
        str.push( it.current.value );
        it.seek();
        str.push( it.current.value );
        checkPropery(str,it,info);
    }

    //将指针向前移动
    it.seek();

    //超类方法
    if( (it.current instanceof Ruler.STACK) && it.current.type() ==='(expression)' )
    {
        if( str.length > 1 )str.splice(1,0,'.prototype');
        str.push( '.call' );

        //删除表达式的左右括号
        it.current.content().shift();
        it.current.content().pop();
        var param = ['this'];
        if( it.current.content().length > 0 )
        {
            param.push( toString(it.current ) );
        }
        str.push( '('+param.join(',')+')' );
    }
    //超类属性
    else if( str.length === 1 )
    {
       error('Unexpected super','', it.prev )
    }
    return str.join('');
}

/**
 * 获取引用自身成员的属性
 * @param it
 * @param stack
 * @param uid
 * @returns {string}
 */
function thisToString(it, stack , uid )
{
    var str=['this'];
    var name = '';
    var old = it.current;
    var desc =  null;
    var scope;

    //如果有指定超类方法名
    if( it.next.value==='.' )
    {
        it.seek();
        it.seek();
        name=it.current.value;
    }

    //成员属性名
    if( name )
    {
        scope = Ruler.getParentFunction( stack );
        if( scope )
        {
            desc = scope.define('this');
            desc = module( desc.classname + '.proto' );
        }
        if( !desc || scope.static() )error('Unexpected this', 'reference', old );
        str.push('.');
        str.push( propertyToString(it, desc, uid , 'this', true, true, true ) );
    }
    return str.join('');
}

/**
 * 获取类成员的表达式
 * @param it
 * @param desc
 * @param uid
 * @param instance
 * @param internal
 * @param inherit
 * @param self
 * @returns {string}
 */
function propertyToString(str, it, desc , uid, instance , internal, inherit, self )
{
    desc = desc ? desc[ it.current.value ] : null;
    if( !desc )error('"'+it.current.value+'" does not exits','reference', it.current );

    //包内访问权限
    internal = internal && desc.privilege==='internal';

    //子类访问权限
    inherit =  inherit && desc.privilege==='protected';

    //判断访问权限
    if( !self && !(internal || inherit) )
        error('"'+name+'" can not access','reference', it.current );

    str.push( it.current.value );

    //成员普通属性
    if( desc.id==='var' ||  desc.id === 'const' )
    {
        //常量不可赋值
        if (desc.id === 'const' && it.next && it.next.value === '=')error('"' + it.current.value + '" assige a const', 'reference', it.current);

        //私有属性
        if( desc.privilege==='private' && uid )str.unshift('["'+uid+'"].');

    }
    //成员访问方法或者访问器
    else if( desc.id==='function' )
    {
        var iscall = (it.next instanceof Ruler.STACK) && it.next.type() === '(expression)';
        if( typeof desc.value === 'object' )
        {
            //访问器不能当函数调用
            if( iscall )error('"' + it.current.value + '" is an accessor', 'reference', it.current);
            if (it.next && it.next.value === '=')
            {
                if (!desc.value.set)error('"' + it.current.value + '" setter not exists', 'reference', it.current);
                it.seek();
                it.seek();
                if (!it.current)error('Missing expression', '', it.prev);
                var param = [instance];
                str.push('.set.call');
                param.push(it.current instanceof Ruler.STACK ? toString(it.current, uid) : it.current.value);
                str.push('(' + param.join(',') + ')');

            } else
            {
                if( !desc.value.get )error('"' + it.current.value + '" getter not exists', 'reference', it.current);
                str.push('.get.call(' + instance + ')');
            }

        }else if( iscall )
        {
            it.seek();
            callToString(str, it, desc , uid);
        }
    }
    return str.join('');
}

//检查参数类型
function checkParameter(it, desc )
{
    var pareameter=[];
    if( desc.param instanceof Array )
    {
        var stack=[];
        for(var i in data ) if( data[i] instanceof Ruler.STACK )
        {
            stack.push({value:toString( data[i] ), type:data[i].type() });
        }
        for(var i in desc.param)
        {
            if( !stack[i] )error('Missing parameter', '', it.prev );
            pareameter.push( stack[i].value );
        }
    }
    return pareameter;
}

function callToString(str, it, desc)
{
    if( it.current instanceof Ruler.STACK && it.current.type() === '(expression)' && it.prev && it.prev.id==='(identifier)' )
    {
        if( !desc )error( '"'+it.prev.value+'" is not function', 'type', it.prev );
        if( desc.id !=='function' && desc.id !=='class' && desc.type !=='Function' )error( '"'+it.prev.value+'" is not function', 'type', it.prev );

        var pareameter = checkParameter(it, desc);
        it.stack.type( desc.type );
        if( str.instance ){
            pareameter.unshift(str.instance);
            str.prop.push('.call(');
            str.prop.push( pareameter.join(',') );
            str.prop.push(')');
            str.instance='';
        }

        if( it.next && it.next.value==='.' && desc.type !== '*' )
        {
            //没有返回值
            if( desc.type === 'void' )error('"' + it.prev.value + '" function not return.', 'reference', it.prev);

            str.instance = str.prop.join('');
            str.prop = [];

            var prop = desc.type==='Class' ? 'static' : 'proto';
            var self = it.stack.scope().define( 'this' );
            desc = it.stack.scope().define( desc.type );
            desc = desc ? module( desc.classname ) : globals[ desc.type ];
            if( !desc )error('"'+ it.current.value+'" is not defined.');
            it.seek();
            str.prop.push( it.current.value );
            it.seek();
            str.prop.push( it.current.value );
            checkPropery(str, it, desc, prop , desc.classname === self.classname );
        }
        return true;
    }
    return false;
}


function expression( it )
{
    if( ( it.prev && it.prev.value === '.')    ||
        !(
            it.current.id   === '(identifier)' ||
            it.current.value==='this'          ||
            it.current.value==='super'         ||
            it.current.type ==='(string)'      ||
            it.current.type ==='(regexp)'
        )
    )return false;


    var type = getIdentifierType( it );

    it.stack.scope().define( type )

    if (it.current.value === 'super')return superToString([it.current.value], it, getDescription(it));
    return checkReference([it.current.value], it, getDescription(it));

}

function checkReference(it, info)
{
    var type = getIdentifierType( it );
    if( !type )error('"'+it.current.value+'" is not defined.');

    //如果没有下一个则退出
    if( !it.next ){
        if( it.current.value ==='super' )error('Unexpected super','', it.current );
        return it.current.value;
    }

    var str = {prop:[it.current.value], instance:'', param:[] };
    var global=false;
    var desc = it.stack.scope().define( type );
    var self = it.stack.scope().define( 'this' );
    var isnew = it.prev && it.prev.value==='new';
    var isclass = false;
    if( !desc && globals[ type ] )
    {
        desc= globals[ type ];
        isclass = desc.id==='class';
        global=true;

    }else
    {
        isclass = desc.id==='class';
        desc = module( desc.classname );
    }

    if( !desc )error('"'+it.current.value+'" is not defined.');
    if( isnew && !isclass )error('"'+it.current.value+'" is not constructs.');

    var privatize = desc.classname === self.classname;
    var prop =  type==='Class' || (it.current.value === type && !isnew) ? 'static' : 'proto';

    //调用超类
    if( it.current.value ==='super' )
    {
        if( !self.scope.extends() )error('No parent class inheritance');
        str.prop.splice(0,1, self.scope.extends() );
        str.instance='this';
        prop='constructor';
    }
    //其它的外部类
    else if( it.current.id === '(identifier)' && isclass && !global )
    {
        str.prop.splice(0,1, type,'.prototype.');
        str.instance = it.current.value;
    }

    //调用函数
    if( it.next instanceof Ruler.STACK )
    {
        if( it.next.type() === '(expression)' )
        {
            callToString(str, it,  desc[prop] );

        }else if( it.next.type() === '(property)' )
        {

        }
    }

    if( it.next.value==='.' )
    {
        it.seek();
        str.push( it.current.value );
        it.seek();
        str.push( it.current.value );
        if( prop==='constructor')str.prop.splice(1,1, type,'.prototype.');
        if( str.instance )str.prop.push( it.current.value );
        checkPropery(str,it,desc[prop] );

    }else if( it.next.value==='=' )
    {
        if( desc[prop] && desc[prop].id === 'const' )error('"' + it.current.value + '" is constant', '', it.current );
    }
    return str.join('');
}

function checkPropery(str,it,object,name, privatize)
{
    var desc = getClassPropertyDesc(it, object, name , privatize);

    //普通属性
    if (desc.id === 'var' || desc.id === 'const')
    {
        if( it.next && it.next.value==='=' && desc.id === 'const' )error('"' + it.current.value + '" is constant', '', it.current );

        //引用对象的私有属性
        if ( privatize && desc.privilege === 'private' )str.prop.splice(1,0,'["' + object.uid + '"]');
    }
    //访问器
    else if (desc.id === 'function' && typeof desc.value === "object" )
    {
        str.splice(0,1,object.type);
        str.splice(1,0,'.prototype');
        if (it.next && it.next.value === '=')
        {
            if (!desc.value.set)error('"' + it.current.value + '" setter not exists', 'reference', it.current);
            it.seek();
            it.seek();
            if (!it.current)error('Missing expression', '', it.prev);
            var param = [object.instance];
            str.push('.set.call');
            param.push(it.current instanceof Ruler.STACK ? toString(it.current) : it.current.value);
            str.push('(' + param.join(',') + ')');

        } else
        {
            if (!desc.value.get)error('"' + it.current.value + '" getter not exists', 'reference', it.current);
            str.push('.get.call(' + info.instance + ')');
        }
    }
}

function getIdentifierType( it )
{
    if( it.current instanceof Ruler.STACK && it.current.type()==='(expression)' && !it.prev )
        return getType( it.current.type() );
    switch ( it.current.type )
    {
        case '(string)' :
            return 'String';
        case '(regexp)' :
            return 'RegExp';
        default :
            var desc = it.stack.scope().define( it.current.value ) || globals[ it.current.value ];
            return !desc ? null : getType( desc.type );
    }
    return null;
}


/**
 * 根据类型返回对应的属性描述
 * @param it
 * @param type
 * @returns {}
 */
function getDescription( it )
{
    var type,desc={},self = module( it.stack.scope().define('this').classname );
    var instance='';
    var prop='proto';
    var classname='';
    switch ( it.current.type )
    {
        case '(string)' : type ='String'; break;
        case '(regexp)' : type ='RegExp'; break;
        default :
            desc = it.stack.scope().define( it.current.value );
            if( desc )
            {
                instance = 'this';
                type = getType( desc.type );
                classname = desc.classname || type;
                if( desc.id==='var' || desc.id==='const' )
                {
                    instance = it.current.value;
                    desc=it.stack.scope().define( type );
                    if( !desc )desc = globals[ type ];
                    type=getType( desc.type );
                    classname = desc.classname || type;
                }
                if( type==='Class' ) prop = 'static';

            }else if( globals[ it.current.value ] )
            {
                type = it.current.value;
                prop = 'static';
            }else
            {
                error('"' + it.current.value + '" not is defined');
            }
    }

    it.stack.type(type);
    var desc = module( classname || type ) || globals[type];
    if( desc.id === 'function' )it.stack.type('Function');
    if( desc.id === 'object' )prop='static';

    return{
        isglobal:!!globals[ type ],
        type:it.stack.type(),
        instance:instance,
        internal:self.packge === desc.package,
        inherit:self.extends,
        self:self.classname === desc.classname,
        uid:self.classname === desc.classname ? desc.id : '',
        prop:prop,
        module:desc,
    };
}

/**
 * 根据类型返回对应的属性描述
 * @param it
 * @param type
 * @returns {}
 */
function getDescriptionByType( it , type , propname, instance )
{
    var self = module( it.stack.scope().define('this').classname );
    propname = propname || type;
    var prop = 'proto';
    if( it.stack.scope().define(propname) && !it.stack.scope().define(propname).classname )
    var object = it.stack.scope().define(propname) ? module( it.stack.scope().define(propname).classname ) : globals[ propname];
    if( type !=='*' && type!=='void' )it.stack.type(type);
    if( object.id === 'function' )it.stack.type('Function');
    if( object.id === 'object' || type==='Class' || (it.current.value===type && !it.prev) )prop='static';
    if( !instance && it.current.id==='(identifier)' && it.current.value!==type )instance=it.current.value;
    return{
        global: !it.stack.scope().define(type),
        type:it.stack.type(),
        instance:instance || 'this',
        internal:self.packge === object.package,
        inherit:self.extends,
        self:self.classname === object.classname,
        uid:self.classname === object.classname ? object.id : '',
        prop:prop,
        module:object,
    };
}


/**
 * 获取类中成员信息。
 * 如果是继承的类，成员信息不存在时则会逐一向上查找，直到找到或者没有父级类为止。
 * @param prop
 * @param info
 * @returns {*}
 */
function getClassPropertyDesc(it, object, name )
{
    var prop = it.current.value;
    if( object[ name ][ prop ] ) return object[ name ][ prop ];
    if( prop === object.type )return {id:'class',type:object.type };
    var parent=object;
    var child;
    var desc;

    if( name ==='proto' ) while( parent && parent.inherit )
    {
        child = parent;
        parent = module( parent.inherit );
        if( parent && parent.proto[ prop ] )
        {
            desc = parent.proto[ prop ];
            if( parent.nonglobal )
            {
                //包内访问权限
                var internal = parent.package === child.package && desc.privilege === 'internal';

                //子类访问权限
                var inherit = child.inherit === parent.fullclassname && desc.privilege === 'protected';

                //判断访问权限
                if ( !(internal || inherit || desc.privilege === 'public') )
                {
                    error('"' + it.current.value + '" inaccessible', 'reference', it.current);
                }
            }
            return desc;
        }
    }
    error('"' + it.current.value + '" does not exits', 'reference', it.current );
}


/**
 * 转换语法
 * @returns {String}
 */
function toString( stack , uid )
{
    if( stack.keyword() === 'function' )
    {
        return createFunction( stack , uid );
    }

    var str = [];
    var it = new Iteration( stack );
    var isstatement= stack.parent().keyword() === 'statement';
    while ( it.seek() )
    {
        if( it.current instanceof Ruler.STACK )
        {
            str.push( toString(it.current, uid ) );
            continue;
        }

        var val = isstatement ? null : expression(it);
        if( val )
        {
            str.push( val );
            continue;
        }

        str.push(typeof it.current.value !== "undefined" ? it.current.value : it.current );

        //关键字的后面必须跟空格
        if( it.current.id === '(keyword)' && it.next )str.push(' ');

    }
    str = str.join('');
    return str;
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
    var list = module( getModuleName( stack.parent().name(), stack.name() ) );
    list.constructor.value= isstatic ? 'function(){}' : 'function(){ if( !(this instanceof '+stack.name()+') )throw new SyntaxError("Please use the new operation to build instances."); return this;}';

    //父类
    var parent = null;

    //继承父类
    if( list.extends )
    {
        //终结的类不可以扩展
        if( stack.final() )error('parent class not is extends.');
    }

    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK ){

            var val = [];

            //是静态成员还是动态成功
            var ref =  item.static() || isstatic ? list.static : list.proto;

            //类中的成员方法
            if( item.keyword() === 'function' )
            {
                item.content().splice(1,1);

                //如果有继承，检查扩展的方法
                if( parent )
                {
                    var info = !item.static() ? parent['proto'] : parent['static'];
                    info = info[ item.name() ];
                    if( info )
                    {
                        //终结的方法子类中不可扩展
                        if( info.final )error('the "'+item.name()+'" method not is extends. in parent class');

                        //子类中必须使用 override 关键字才能扩展父中的方法
                        if( !item.override() )error('Missing override','', item.content()[0] );

                        //覆盖的方法必须与父类的方法相匹配
                        if( typeof info.value ==='object' || item.accessor() )
                        {
                            if( !( typeof info.value === 'object' && item.accessor() ) )error('the "' + item.name() + '" method not matched', '', item.content()[0]);
                            info = info.value[item.accessor()];
                        }
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

                //构造函数
                if( item.name() === stack.name() && !isstatic )
                {
                    list.constructor.value = toString( item , list.id );
                    continue;
                }
                //普通函数
                else
                {
                    val.push(  toString( item, list.id ) );
                }

            }
            //类中的成员属性
            else if( item.keyword() === 'var' || item.keyword() === 'const' )
            {
                item.content().shift();
                var ret = toString( item , list.id ).replace( new RegExp('^'+item.name()+'\\s*\\=?'), '' );
                ret = ret ? ret : 'undefined';

                //私有属性直接放到构造函数中
                if( !item.static() && item.qualifier()==='private' )
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
    props = 'this["'+list.id+'"]={'+props.join(',')+'};\n';
    list.constructor.value=list.constructor.value.replace('####{props}####', props );
    return list;
}

    
/**
 * 获取类的成员信息
 * @param stack
 * @returns {string}
 */
function getPropertyDescription(stack )
{
    var data = stack.content();
    var i = 0;
    var item;
    var len = data.length;
    var isstatic = stack.static();

    // 组合接口
    var list = {'static':{},'proto':{},'import':{},constructor:{}};
    var define = stack.parent().define();
    for ( var j in define )list['import'][j]=define[j].classname;
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

    list['inherit'] = stack.extends() ? list['import'][ stack.extends() ] || stack.extends() : null;
    list['package']=stack.parent().name();
    list['type']=stack.name();
    list['nonglobal']=true;
    list['fullclassname']=getModuleName(list.package, stack.name() );
    list['classname']=stack.name();
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

        needMakeModules.push( scope );
        data = getPropertyDescription( scope );
        data.cachefile = cachefile;
        data.uid= id;
    }

    for(var i in data.import )loadModuleDescription( data.import[i] );
    syntaxDescribe.push( data );
    module( file, data);
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
function toValue( describe, flag )
{
    var code=[];
    for( var p in describe )
    {
        if( describe[p].inherit )continue;
        if( (describe[p].id==='var' || describe[p].id==='const') && describe[p].privilege === 'private' && !flag )continue;
        if( typeof describe[p].value === "object" )
        {
            var val=[];
            if ( describe[p].value.get )val.push('get:' +describe[p].value.get.value );
            if ( describe[p].value.set )val.push('set:' +describe[p].value.set.value );
            code.push( p+':{'+val.join(',')+'}' );

        }else
        {
            code.push( p+':'+ describe[p].value );
        }
    }
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
        var str= '(function(){\n';
        for (var i in o.import )
        {
            var obj = module( o.import[i] ) || globals[ o.import[i] ];
            if( typeof obj.id === "number" )
            {
                str += 'var ' + i + '=' + getMethods('module', ['"' + o.import[i]+'"'])+';\n';
            }
        }

        str+='var '+o.classname+'='+o.constructor+';\n';
        var proto = o.extends ? o.extends+'.prototype' : null;
        str+=o.classname+'.prototype=Object.create('+proto+','+toValue(o.proto)+');\n';
        str+='merge('+o.classname+','+toValue(o.static, true )+');\n';
        str+=o.classname+'.prototype.constructor='+o.classname+';\n';
        str+= 'return '+o.classname+';\n';
        str+= '})()';
        code.push( getMethods('module', ['"'+getModuleName(o.package,o.classname)+'"', str ] ) );

    });

    var mainfile = pathfile( config.main , config.suffix, config.lib );
    var filename = PATH.resolve(PATH.dirname( mainfile ),PATH.basename(mainfile,config.suffix)+'-min.js' );
    var system = fs.readFileSync( PATH.resolve(config.make, 'System.js') , 'utf-8');

    fs.writeFileSync(  filename,[
        '(function(){\n',
        system,
        code.join(';\n'),
        ';\n',
        'var main='+getMethods('module', ['"'+config.main+'"'] ),
        ';\nnew main();\n',
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