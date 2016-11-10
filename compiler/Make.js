const fs = require('fs');
const root = process.cwd();
const QS = require('querystring');
const PATH = require('path');
const Ruler = require('./Ruler.js');
const functions=require('./lib/Functions.js');
const global_module=require('./lib/Global.js');
const config = {'suffix':'.as','main':'main','root':root,'cache':'off','cachePath':'./cache','debug':'on', 'browser':'enable' ,'functions':functions};

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
    var obj=global_module;
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
    return obj[ classname ] || null;
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
function createDefaultParam( stack )
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
                value = item instanceof  Ruler.STACK ? toString(item) : item.value;
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
                obj.expre.push('if( !(' + name + ' instanceof ' + type + ') )throw new TypeError("Specify the type of mismatch");\n');
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
function createFunction( stack )
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
                param = createDefaultParam( child );
                content.push( param.param.join(',') );

            }else
            {
                content.push( toString(child) );
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
 * 检查属性是否存在
 * @param scope
 */
function checkPropExists( scope )
{
    var ref =  scope.keyword()==='expression' ? Ruler.getParentScope(scope) : null;
    if( !ref )return;
    var data = scope.content();
    var i=0;
    var item;

    for(;i<data.length; i++)
    {
        item = data[i];
        var obj;
        var isref=false;
        var isglobal=false;

        if( item instanceof Ruler.STACK )
        {
            if( item.type() ==='(Object)' || item.type() ==='(Array)' || item.type() ==='(Boolean)' )
            {
                obj = ref.define( getType( item.type() ) );

            }else if( item.type() ==='(expression)' )
            {
                return;
            }

        }else if( item.type==='(string)' || item.type==='(boolean)' || item.type==='(number)' || item.type==='(regexp)' )
        {
            var type = getType( item.type);
            obj = ref.define( type.charAt(0).toUpperCase()+type.substr(1) );

        }else
        {
            if( item.value !== 'this' && (item.type !== '(identifier)' || item.id==='(keyword)') )continue;
            obj = ref.define( item.value );
            if( !obj ) obj = ref.define('static_'+item.value );
        }

        //这里是声明引用
        if( obj && (obj.id==='var' || obj.id==='const' || obj.id==='let') )
        {
            var type =  getType(obj.type);
            if( type !=='*' )
            {
                obj = ref.define(type);
                isref=true;
            }
        }
        //系统全局对象
        else if( !obj )
        {
            obj = functions[ item.value ];
            isglobal=true;
        }

        //如果没有定义
        if( !obj )
        {
            error(item.value + ' is not defined.', 'reference', item);
        }

        //属性描述
        var desc = obj;
        var next = data[++i];

        //如果是一个引用的类
        if( obj && obj.id==='class' )
        {
            //不能直接对类名作赋值操作
            if( !isref && next && !(next instanceof Ruler.STACK) && next.value==='=' )
            {
                error('the "'+item.value+'" is class constant cannot be assigned', '', item);
            }
            desc = module( obj.classname );
        }

        //引用属性的描述信息
        if( isglobal )
        {
            desc = obj.id==='object' ? desc['static'] : desc;
        }else
        {
            desc = item.value !=='this' && !isref ? desc['static'] : desc['proto'];
        }
        var old = item;

        while ( next && ( next.value === '.' || ( next instanceof Ruler.STACK && next.type() === '(property)' ) ) )
        {
            if( next.value === '.' )next = data[++i];
            item = next;
            var prop=item.value;
            if (item instanceof Ruler.STACK && item.type() === '(property)')
            {
                next = data[++i];
                continue;
            }

            desc = desc[prop];

            //属性必须先定义后使用
            if( !desc )
            {
                error( prop+' does not exist', 'reference', item);
            }

            next = data[i + 1];
            if( old.value==='this' )
            {
                if( desc.privilege==='private' && desc.id==='var' )
                {
                    old.value='this[uid]';

                }else if( desc.id==='function' && typeof desc.value ==='object' )
                {
                    if ( desc.value.get && !next )
                    {
                        item.value = prop + '.get.call(this)';

                    } else if (desc.value.set && next && next.value === '=')
                    {
                        item.value = prop + '.set.call(this,';
                        next = data[++i];
                        next.value='';
                        next = data[++i];
                        item.value+=(next instanceof Ruler.STACK ? toString(next) : next.value);
                        item.value+=')';
                        next.value='';
                        break;
                    }
                }
            }

            //是否为调用
            if ( next instanceof Ruler.STACK && next.type() === '(expression)' )
            {
                //必须是函数
                if( desc.id !== 'function' )error( prop+' is not function', 'type', item);
                next = data[++i];
                next = data[++i];

            } else if ( next && next.value === '=' )
            {
                //常量是不可以改变的
                if ( desc.id === 'const' ) error('Constant values cannot be changed after the defined', 'syntax', item);

                //检查类型是否一致
                if( (desc.id === 'var' || desc.id==='let') && desc.type !== '*' )
                {
                    if( desc.type !== getType( scope.type() ) )
                    {
                        error('type is not consistent. can only be ' + desc.type, 'type', item);
                    }
                }
            }

            if( desc.type !=='*' && desc.type !=='void' )
            {
                desc = module(desc.type);
                if (!desc)error('"' + desc.type + '" is not defined', 'type', item);
                desc = desc['proto'];
            }
        }

    }
}


/**
 * 迭代器
 * @param data
 * @constructor
 */
function Iteration( data )
{
    var index=0;
    this.index=index;
    this.data=data.slice(0);
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
function createExpression(it, desc , scope )
{
    var str=[];

    //动态属性或者调用
    if( it.current instanceof Ruler.STACK )
    {
        if( !desc )error(it.prev.value + ' is not defined.', 'reference', it.prev );
        str.push( toString(it.current) );

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

    var isconst = desc.id==='const' || desc.id==='class';

    //这里是声明引用
    if( desc.id==='var' || desc.id==='const' || desc.id==='let' )
    {
        var type = getType(desc.type);
        if( type !=='*' )desc = scope.define( type );

    }
    //访问器
    else if( desc.id==='function' && typeof desc.value === "object" )
    {
        if( it.next && it.next.value === '=' )
        {
            if( !desc.value.get )error('the "'+ it.current.value+'" accessor not setter');
            it.seek();
            it.seek();
            var val = it.current instanceof Ruler.STACK ? toString( it.current ) : it.current.value;
            str.push('.set('+ val+')');
        }else
        {
            if( !desc.value.get )error('the "'+it.current.value+'" accessor not getter');
            str.push('.get()');
        }
    }

    var is = it.current.value==='this';

    //引用类模块
    if( desc.id==='class' )
    {
        desc = module( desc.classname );
        desc = it.current.value === desc.classname ? desc.static : desc.proto;
    }

    if( !it.next )return str.join('');

    //调用函数或者动态引用属性
    if (it.next instanceof Ruler.STACK)
    {
        it.seek();
        str.push( createExpression(it, desc, scope) );
    }
    //检测点运算符后面的属性
    else if (it.next.value === '.')
    {
        it.seek();
        str.push(it.current.value);
        it.seek();
        desc = desc[it.current.value];

        //类的私有属性
        if( is && (desc.id==='var' || desc.id==='const') && desc.privilege==='private' )
        {
            str.splice(0,1, 'this[uid]' );
        }
        str.push( createExpression(it, desc , scope) );
    }
    //常量不可赋值
    else if (it.next.value === '=' && isconst)
    {
        error('"' + it.current.value + '" is constant', '', it.current );
    }
    return str.join('');
}

/**
 * 转换语法
 * @returns {String}
 */
function toString( stack )
{
    var data = stack.content();
    var str = [];
    if( stack.keyword() === 'function' )
    {
        return createFunction( stack );
    }

    var it = new Iteration( data );
    var scope=null,desc=null;
    var isstatement= stack.parent().keyword() === 'statement';
    while ( it.seek() )
    {
        if( it.current instanceof Ruler.STACK )
        {
            str.push( toString(it.current) );
        }
        else if( (!it.prev || it.prev.value !=='.') && !isstatement &&
            ( it.current.id === '(identifier)' || it.current.value==='this' || it.current.type ==='(string)' || it.current.type ==='(regexp)') )
        {
            if (!scope)scope = Ruler.getParentScope( stack );
            if( !desc )
            {
                var prop = it.current.value;
                switch ( it.current.type )
                {
                    case '(string)' : prop='String'; break;
                    case '(regexp)' : prop='RegExp'; break;
                }
                desc = scope.define( prop );
                if (!desc)desc = functions[ prop ];
            }
            str.push( createExpression(it, desc, scope) );
            desc=null;

        }else
        {
            str.push(typeof it.current.value !== "undefined" ? it.current.value : it.current );

            //关键字的后面必须跟空格
            if( it.current.id === '(keyword)' && it.next )str.push(' ');
        }
    }
    str = str.join('');
    return str;
}

/**
 * 继承描述信息
 * @param childClass
 * @param parentClass
 */
function inheritDescribe(childClass, parentClass)
{
    var internal =  childClass.package === parentClass.package;
    var category=['static','proto'];
    for( var i in category )
    {
        var refObj = parentClass[ category[i] ];
        for (var b in refObj )
        {
            var item = refObj[ b ];
            var child = childClass[ category[i] ];
            if( !child[b] )
            {
                //继承访问器
                if( typeof item.value === 'object' )
                {
                    if( typeof child[b].value !== 'object' )child[b].value={};
                    if( item.value.get && !child[b].value.get )
                    {
                        var obj = inheritParentMethods(item.value.get , parentClass.class,internal );
                        if( obj )child[b].value.get = obj;
                    }
                    if( item.value.set && !child[b].value.set )
                    {
                        var obj = inheritParentMethods(item.value.set , parentClass.class,internal );
                        if( obj )child[b].value.set = obj;
                    }
                }
                //继承方法
                else
                {
                    var obj = inheritParentMethods(item , parentClass.class, internal );
                    if( obj )child[b] = obj;
                }
            }
        }
    }
}

/**
 * 继承父类方法
 * @param parentMethod
 * @param inheritName
 * @param internal
 * @returns {*}
 */
function inheritParentMethods(parentMethod, inheritName, internal )
{
    if( parentMethod.privilege === 'public' || parentMethod.privilege === 'protected' || (internal && parentMethod.privilege === 'internal') )
    {
        return merge({'inherit': inheritName },parentMethod);
    }
    return null;
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
    var constructor= isstatic ? 'function(){}' : 'function(){ if( !(this instanceof '+stack.name()+') )throw new SyntaxError("Please use the new operation to build instances."); return this;}';

    // 组合接口
    var list = module( getModuleName( stack.parent().name(), stack.name() ) );

    //父类
    var parent = null;

    //继承父类
    if( list.extends )
    {
        //终结的类不可以扩展
        if( stack.final() )error('parent class not is extends.');

        //继承父类的成员
        parent =  module( list.import[ list.extends ] );
        inheritDescribe(list, parent );
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

                    //终结的方法子类中不可扩展
                    if( info && info.final )error('the "'+item.name()+'" method not is extends. in parent class');

                    //覆盖的方法必须与父类的方法相匹配
                    if( info && !( typeof info.value ==='object' && item.accessor() ) )error('the "'+item.name()+'" method not matched','', item.content()[0]);
                    if( info && item.accessor() && typeof info.value ==='object' )info = info.value[ item.accessor() ];

                    //覆盖的方法必须在父类中已定义
                    if( item.override() && !info )
                    {
                        if( item.accessor() ){
                            error('the "'+item.name()+'" '+item.accessor()+'ter does exists in super class','', item.content()[0] );
                        }else{
                            error('the "'+item.name()+'" method does exists in super class','', item.content()[0] );
                        }
                    }

                    //子类中必须使用 override 关键字才能扩展父中的方法
                    if( info && !item.override() )error('Missing override','', item.content()[0] );
                }

                //构造函数
                if( item.name() === stack.name() && !isstatic )
                {
                    constructor= toString( item );
                    continue;
                }
                //普通函数
                else
                {
                    val.push(  toString( item ) );
                }

            }
            //类中的成员属性
            else if( item.keyword() === 'var' || item.keyword() === 'const' )
            {
                item.content().shift();
                var ret = toString( item ).replace( new RegExp('^'+item.name()+'\\s*\\=?'), '' );
                ret = ret ? ret : 'undefined';

                //私有属性直接放到构造函数中
                if( !item.static() && item.qualifier() ==='private' )
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
    props = 'this[uid]={'+props.join(',')+'};\n';
    list['constructor']=constructor.replace('####{props}####', props );
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
    var list = {'static':{},'proto':{},'import':{}};
    var define = stack.parent().define();
    for ( var j in define )list['import'][j]=define[j].classname;
    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK )
        {
            if( item.keyword() === 'function' && item.name() === stack.name() && !isstatic )
            {
                continue;
            }
            var ref =  item.static() || isstatic ? list.static : list.proto;
            var desc = createDescription(item);

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
    list['extends']=stack.extends();
    list['package']=stack.parent().name();
    list['class']=stack.name();
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
function loadModuleDescription(file )
{
    var has = module(file);
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
        data.id= id;
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
function toValue( describe )
{
    var code=[];
    for( var p in describe )
    {
        if( describe[p].id==='var' || describe[p].id==='const' && describe[p].privilege === 'private' )continue;
        if( typeof describe[p].value === "object" )
        {
            var val=[];
            if ( describe[p].value.get )val.push('get:' + toInheritValue( describe[p].value.get,p+'.get' ) );
            if ( describe[p].value.set )val.push('set:' + toInheritValue( describe[p].value.set,p+'.set' ) );
            code.push( p+':{'+val.join(',')+'}' );

        }else
        {
            code.push( p+':'+ toInheritValue(describe[p],p) );
        }
    }
    return '{\n'+code.join(',\n')+'\n}';
}

/**
 * 返回需要继承父类成员的表现式
 * @param describe
 * @param prop
 * @returns {*}
 */
function toInheritValue( describe , prop )
{
    if( describe.inherit )return describe.inherit+'.prototype.'+prop;
    return describe.value;
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
        str+='var uid = '+o.id+''+index+';\n';
        for (var i in o.import )
        {
            var obj = module( o.import[i] );
            if( typeof obj.id === "number" )
            {
                str += 'var ' + i + '=' + getMethods('module', ['"' + o.import[i]+'"'])+';\n';
            }
        }

        str+='var '+o.class+'='+o.constructor+';\n';
        var proto = o.extends ? o.extends+'.prototype' : null;
        str+=o.class+'.prototype=Object.create('+proto+','+toValue(o.proto)+');\n';
        str+='Object.defineProperties('+o.class+','+toValue(o.static)+');\n';
        str+=o.class+'.prototype.constructor='+o.class+';\n';
        str+= 'return '+o.class+';\n';
        str+= '})()';
        code.push( getMethods('module', ['"'+getModuleName(o.package,o.class)+'"', str ] ) );

    });

    var mainfile = pathfile( config.main , config.suffix, config.lib );
    var filename = PATH.resolve(PATH.dirname( mainfile ),PATH.basename(mainfile,config.suffix)+'-min.js' );
    var system = fs.readFileSync( PATH.resolve(config.make, 'System.js') , 'utf-8');
    fs.writeFileSync(  filename, ['(function(){\n',system,code.join(';\n'),';\n})();'].join('') );
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
    for(var b in browser)global_module[b]=browser[b];
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