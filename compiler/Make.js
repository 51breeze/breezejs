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
function createFunction( stack )
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
    this.returnValues=[];
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

        if( this.current.value==='=' && !(this.next instanceof Ruler.STACK) )
        {
            this.next =  new Ruler.STACK('expression','(*)');
            this.next.__content__ = this.data.splice(index,  this.data.length-index,  this.next );
            this.next.__parent__  = stack.parent();
        }
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
    if( typeof value !== "undefined" )this.returnValues.push( value );
    return this.returnValues;
}

/**
 * 检查参数类型
 * @param it
 * @param desc
 * @returns {Array}
 */
function checkParameter(it, desc )
{
    var pareameter=[];
    var stack=[];
    var data=it.current.content();
    for(var i in data ) if( data[i] instanceof Ruler.STACK )
    {
        var obj = {value:toString( data[i] ), type:data[i].type() }
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
    return false;
}


/**
 * 解析表达式
 * @param it
 * @returns {*}
 */
function expression( it )
{
    if( it.prev && it.prev.value === '.' )return false;
    var type = getConstantType(it.current.value);
    if( !type && it.current.type ==='(number)' )type='Number';

    if( type )
    {
        it.stack.type( type );
        it.values( it.current.value );
        return it.current.value;
    }

    if(!(
        it.current.id   === '(identifier)' ||
        it.current.value==='this'          ||
        it.current.value==='super'         ||
        it.current.value==='new'           ||
        it.current.type ==='(boolean)'     ||
        it.current.type ==='(number)'      ||
        it.current.type ==='(string)'      ||
        it.current.type ==='(regexp)'
    ))return false;

    if( it.stack.parent().type() === '(Json)' || it.stack.type() === '(Json)' )
    {
        return false;
    }
    return checkReference( it );
}

/**
 * 根据类型获取类全名
 * @param map
 * @param type
 * @returns {*}
 */
function getImportClassByType(imports, type )
{
    if( imports[type] )return imports[type];
    if( globals[type] )return type;
    for(var i in imports )if(imports[i] === type )return imports[i];
    return null;
}

/**
 * 检查表达式的引用
 * @param it
 * @returns {*}
 */
function checkReference(it)
{
    var isnew=false;
    var str = {prop:[it.current.value], instance:'', before:'', after:'' };
    if( it.current.value==='new' )
    {
        isnew=true;
        it.seek();
        str.prop.push(' ');
        str.prop.push( it.current.value );
        str.prop = [ str.prop.join('') ];
    }

    //获取当前标识符引用的类型
    var desc = getIdentifierType( it );
    var type = desc ;
    var id='';

    //引用属性
    if( typeof desc === "object" )
    {
        id = desc.id;

        //本类类型
        type = id==='class' && desc.scope && it.current.value === desc.scope.name() ? desc.scope.name() : desc.type;
    }

    //当前操作的类型
    var t = it.current.value === type || id==='class' ? 'Class' : (id==='object' ? 'Object' : type);

    //new 运算符只能应用于类
    if( isnew && t !== 'Class'  )
    {
        error('"' + it.current.value + '" is not constructs.');
    }

    //实例类型
    t = it.current.value==='this' || it.current.value === 'super' ? type : t;
    it.stack.type( t );

     //变量引用赋值操作
     if( it.next && it.next.value === '=' )
     {
          if( (id==='const' || !id) && it.stack.parent().keyword() !=='statement' )error('"' + it.current.value + '" is constant', '', it.current );
          it.seek();
          str.prop.push( it.current.value );
          it.seek();
          str.prop.push( toString(it.current) );
          checkSpecifyType(it, desc, it.current )
          if( it.current.before )str.before+= it.current.before;
          return str.prop.join('');
     }

    //如果没有下一个则退出
    if( !it.next || type==='*' || type==='Json' )
    {
        if( it.current.value ==='super' )
        {
            error('Unexpected super','', it.current );
        }
        return it.current.value;
    }

    //原型链属性名
    var prop = t === 'Class' || id === 'object' ? 'static' : 'proto';

    //类本身实例
    var self = module( it.stack.scope().define('this').fullclassname ) ;

    //调用超类
    var issuper = false;
    if (it.current.value === 'super')
    {
        str.prop.splice(0, 1, self.inherit);
        str.instance = 'this';
        issuper = true;
    }

    //如果不是所有类型，检查类成员属性
    while( it.next && type !== '*' && type !=='void')
    {
        //是否对类本身实例的引用
        desc = self.classname === type || self.fullclassname === type ? self : module( getImportClassByType(self.import, type) );
        if (!desc)error('"' + it.current.value + '" is not defined.', '', it.current);

        if ( it.next instanceof Ruler.STACK )
        {
            //调用函数
            if ( it.next.type() === '(expression)' )
            {
                if( isnew && it.stack.type() !=='Class' )
                {
                    error('is not constructor','type', it.prev );
                }

                it.seek();
                if( !(desc.id ==='function' || desc.id ==='class' || desc.type ==='Function' || desc.type==='Class') )
                {
                    error( '"'+it.prev.value+'" is not function', 'type', it.prev );
                }

                var ref = str.prop.join('');
                var msg ='this.'+it.prev.value+' is not function\\n';
                    msg += self.filename.replace(/\\/g,'/') +':'+it.prev.line+':'+it.prev.cursor;
                    it.stack.before.push('if( !(typeof '+ref+' === "function") )throw new TypeError("'+msg+'");');

                var pareameter = checkParameter(it, desc);
                it.stack.type( desc.type );

                if( str.instance )
                {
                    pareameter.unshift(str.instance);
                    str.prop.push('.call');
                }

                str.prop.push('(');
                str.prop.push( pareameter.join(',') );
                str.prop.push(')');
                str.prop = [ str.prop.join('') ];
                str.instance='';
                type = desc.type;
                var is = it.next instanceof Ruler.STACK && ( it.next.type() === '(expression)' || it.next.type() === '(property)' );

                //没有返回值
                if( type === 'void' && it.next && ( it.next.value === '.' || is ) )error('"' + it.prev.value + '" function not return.', 'reference', it.prev);

            }
            //动态属性
            else if( it.next.type() === '(property)' )
            {
                it.seek();
                str.prop.push( toString( it.current ) );
            }
        }
        //类成员属性
        else if ( it.next && it.next.value === '.' )
        {
            it.seek();
            str.prop.push(it.current.value);
            it.seek();
            str.prop.push(it.current.value);
            if (issuper)str.prop.splice(1, 0, '.prototype');
            desc = checkPropery(str, it, desc, prop, desc.classname === self.classname );
            type = desc.type;

        }else
        {
            break;
        }
    }

    return str.prop.join('');
}


/**
 * 验证指定的类型与当前表达式返回的类型是否一致
 * @param it
 * @param stack
 * @param desc
 * @returns {boolean}
 */
function checkSpecifyType(it,desc,stack)
{
    if( desc.type==='*' || desc.type==='Object' || stack.type()==='Object' )return true;
    if( stack.type() !== desc.type ){
        error('Specify the type of mismatch','type', it.prev );
    }
}

/**
 * 验证类成员是否定义和是否有访问权限
 * @param str
 * @param it
 * @param object
 * @param name
 * @param privatize
 */
function checkPropery(str,it,object, name, privatize )
{
    var desc = getClassPropertyDesc(it, object, name);

    //普通属性
    if (desc.id === 'var' || desc.id === 'const')
    {
        //引用对象的私有属性
        if ( privatize && desc.privilege === 'private' )
        {
             str.prop.splice(1,0,'["' + object.uid + '"]');
             str.prop = [ str.prop.join('') ];
             str.instance ='';
        }

        it.stack.type( desc.type );
        if( it.next && it.next.value==='=' )
        {
            if( desc.id === 'const' )error('"' + it.current.value + '" is constant', '', it.current );
        }
    }
    //函数
    else if (desc.id === 'function' )
    {
        //访问器
        if( typeof desc.value === "object" )
        {
            var param =[];
            var call='';

            //静态方法没有实例对象所以不需要走原型引用
            if( name !== 'static' )
            {
                call='.call';
                param = [str.prop[0]];
                str.prop.splice(0, 1, object.type);
                str.prop.splice(1, 0, '.prototype');
            }

            //setter
            if (it.next && it.next.value === '=')
            {
                if (!desc.value.set)error('"' + it.current.value + '" setter not exists', 'reference', it.current);
                it.seek();
                if ( !it.seek() )error('Missing expression', '', it.prev);
                str.prop.push('.set'+call);

                param.push( toString(it.current) );
                checkSpecifyType(it, desc, it.current )
                str.prop.push('(' + param.join(',') + ')');
                it.stack.type('void');

            }
            //getter
            else
            {
                if (!desc.value.get)error('"' + it.current.value + '" getter not exists', 'reference', it.current);
                str.prop.push('.get'+call+'(' + param.join(',') + ')');
                it.stack.type( desc.type );
            }
            str.instance = '';
            str.prop = [ str.prop.join('') ];

        }else
        {
            it.stack.type('Function');
        }
    }
    return desc;
}

/**
 * 获取标识符定义的类型
 * @param it
 * @returns {*}
 */
function getIdentifierType( it )
{
    if( it.current instanceof Ruler.STACK && it.current.type()==='(expression)' && !it.prev )
        return getType( it.current.type() );
    switch ( it.current.type )
    {
        case '(string)' :
            it.values( it.current.value.substr(1,-2) );
            return 'String';
        case '(regexp)' :
            return 'RegExp';
        case '(number)' :
            it.values( it.current.value );
            return 'Number';
        case '(boolean)' :
            return 'Boolean';
        default :
            var desc = it.stack.scope().define( it.current.value ) || globals[ it.current.value ];
            if( desc ){
                desc.type = getType( desc.type );
                return desc;
            }
    }
    error('"'+it.current.value+'" is not defined.', '', it.current );
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
    if( object[ name ] )
    {
        var prop = it.current.value;

        //这里引用的是一个类，并非类的实例
        if ( prop === object.type )return {id: 'class', type: object.type};
        var desc = object[name][prop];

        //如果在本类中有定义
        if ( desc )
        {
            var self = module( it.stack.scope().define('this').fullclassname );

            //非全局模块和外部类需要检查权限
            if( self.type !== object.type )checkPrivilege(it, desc, object, self );
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
 * @param inobject 模块
 * @param currobject 前场景对象
 */
function checkPrivilege(it, desc, inobject, currobject )
{
    //非全局模块需要检查
    if ( inobject.nonglobal )
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
function toString( stack )
{
    if( stack.keyword() === 'function' )
    {
        return createFunction( stack );
    }

    var str = [];
    var it = new Iteration( stack );
    var isBefore=false;
    if( stack.parent() instanceof Ruler.SCOPE )
    {
        stack.before=[];
        isBefore=true;

    }else if( stack.parent().before )
    {
        stack.before = stack.parent().before;
    }

    while ( it.seek() )
    {
        if( it.current instanceof Ruler.STACK )
        {
            str.push( toString( it.current ) );
            continue;
        }

        var val = expression( it );
        if( val )
        {
            str.push( val );
            if( it.next && it.next.id === '(keyword)' )str.push(' ');
            continue;
        }

        str.push( typeof it.current.value !== "undefined" ? it.current.value : it.current );

        //关键字的后面必须跟空格
        if( it.current.id === '(keyword)' && it.next )str.push(' ');
    }

    if( isBefore )str.unshift( stack.before.join('') )
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
    if( module.import[ classname ] )return module.import[ classname ];
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
    var list = module( getModuleName( stack.parent().name(), stack.name() ) );
    list.constructor.value= isstatic ? 'function(){}' : 'function(){ if( !(this instanceof '+stack.name()+') )throw new SyntaxError("Please use the new operation to build instances."); return this;}';

    //父类
    var parent = null;

    //继承父类
    if( list.inherit )
    {
        //终结的类不可以扩展
        if( stack.final() )error('parent class not is extends.');
        parent = module(  list.inherit );
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
                if( list.inherit )
                {
                    parent = list;
                    while( parent.inherit )
                    {
                        parent = module( getModuleFullname(parent, parent.inherit ) );
                        if( !parent )error('Not found parent class. ' );
                        chackOverride(item, parent ,  list.package === parent.package );
                    }
                }

                //构造函数
                if( item.name() === stack.name() && !isstatic )
                {
                    list.constructor.value = toString( item );
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
    props = props.length > 0 ? 'this["'+list.uid+'"]={'+props.join(',')+'};\n' : '';
    list.constructor.value=list.constructor.value.replace('####{props}####', props );
    return list;
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

        needMakeModules.push( scope );
        data = getPropertyDescription( scope );
        data.cachefile = cachefile;
        data.uid= id;
        data.filename = sourcefile;
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
    if( code.length===0 )return '';
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
            if( typeof obj.uid === "number" )
            {
                str += 'var ' + i + '=' + getMethods('module', ['"' + o.import[i]+'"'])+';\n';
            }
        }

        str+='var '+o.classname+'='+o.constructor.value+';\n';
        var proto = o.inherit ? o.inherit+'.prototype' : null;

        var _proto = toValue(o.proto);
        var _static = toValue(o.static, true);

        if( _proto )
        {
            str += o.classname + '.prototype=Object.create(' + proto + ',' +_proto+ ');\n';
        }

        if(_static)
        {
            str += 'merge(' + o.classname + ',' + _static + ');\n';
        }

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