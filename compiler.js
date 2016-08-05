const fs = require('fs');
const root = process.cwd().replace('\\','/');
const suffix = '.as';
const global_module={};

function global(name)
{
    var path = name.replace(/\s+/g,'').split('.');
    var deep=0;
    var obj=global_module;
    var len =path.length;
    while(deep < len )
    {
        name = path[deep];
        obj = obj[ name ] || (obj[ name ]={});
        deep++;
    }
    return obj;
}

function merge()
{
    var target = arguments[0];
    var len = arguments.length;
    for(var i=1; i<len; i++ )
    {
        var item = arguments[i];
        for( var p in item )
        {
            if( typeof item[p] === 'object' && typeof target[p] === 'object' )
            {
                merge(target[p],  item[p] );
            }else{
                target[p] = item[p];
            }
        }
    }
    return target;
}

function pathfile( file )
{
    file = file && file !='' ? file.replace('.','/') : '';
    return root +'/'+ file + suffix;
}

function classname( file )
{
    var ret = file.match(/(^|\.)(\w+)$/);
    return ret && ret[2] ? ret[2] : null;
}

function packagename( file )
{
    return file.replace( /(^|\.)\w+$/ ,'');
}

function torefe( classname )
{
    return classname.replace(/[\.\s]+/g,'');
}

function checkfile( file )
{
    try{
        return fs.statSync( pathfile(file) ).isFile();
    } catch (e) {
        return false;
    }
}

/**
 * 获取修饰符
 * @param module
 * @param val
 * @returns {*}
 */
function qualifier(module, val )
{
    val =  val ? trim( val ) : '';
    if( val==='')return 'public';
    if ( typeof module.fn[ val ] === "undefined" )
        throw new Error('[qualifier invalid]');
    return val;
}


//平衡对称器
function balancer( module , code )
{
    //平衡左对称符
    var v=[];
    if( /\(/.test( code ) )
    {
        module.balancer++;
        v.push('(');
    }
    if( /\{/.test( code ) )
    {
        module.balancer++;
        v.push('{');
    }

    //平衡右对称符
    if( /\)/.test( code ) )
    {
        module.balancer--;
        v.push(')');
    }
    if( /\}/.test( code ) )
    {
        module.balancer--;
        v.push('}');
    }

    //关闭当前上下文
    if( module.current && module.balancer === 2 && v.indexOf('}') >=0 )
    {
        module.current=null;
    }
    return v;
}

/**
 * 去掉两边的空白
 * @param str
 * @returns {string|void|XML}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/(^[\s\t]+|[\s\t]+$)/,'') : '';
}

/**
 * 检查参数是否合法
 * @param param
 */
function checkParam( param )
{
    if( param && param !=='' )
    {
        var p= param.split(',');
        for(var i in p)
        {
            if( /(\w+\s+\w+)|(\W+)/.test( trim(p[i]) ) )
            {
                throw new Error('param invalid')
            }
        }
    }
}

/**
 * 检查继承的类是否存在
 * @param module
 * @param classname
 * @returns {boolean}
 */
function checkExtendsClass(module, classname )
{
    var has=[];
    var reg= new RegExp( '(^|\.)'+classname+'$' );
    for( var i in module['import'] ) if( module['import'][i].match( reg ) )
    {
        has.push( module['import'][i] );
    }
    return has;
}


function checkSyntax( code )
{

}

function globalOptions(module, code , keyword )
{
    switch ( keyword )
    {
        case 'package':
            var ret = code.match(/\s*(package)(\s+[\w\.]*)?/i);
            if (!ret)throw new Error('[package error] ' + code);
            var pname = ret[2] ? trim(ret[2]) : '';
            if (pname !== module['package'])throw new Error('package path invalid for ' + pname);
            break;
        case 'import':
            var ret = code.match(/\s*(import)\s+([\w\.]*)/i);
            if (!ret)throw new Error('[syntax error] ' + code);
            ret[2] = trim(ret[2]);
            if (!checkfile(ret[2]))throw new Error('[Not found class for ' + ret[2] + '] ' + code);
            module['import'].push(ret[2]);
            break;
        case 'class':
            var ret = code.match(/[\w\s]*(class)\s+(\w+)(\s+extends\s+([\w\.]*))?/i);
            if (!ret)throw new Error('class error');
            if (ret[2] !== module['class'])throw new Error('file name and class name is not consistent');
            if (ret[4]) {
                var extend = trim(ret[4]);
                var classname = checkExtendsClass(module, extend);
                if (classname.length < 1)throw new Error('[Not found extends class for ' + extend + ']');
                if (classname.length > 1)throw new Error('[Not sure of the class name for ' + extend + ']');
                module['extends'] = classname[0];
            }
            break;
        case 'var':
            var ret = code.match(/^\s*(\w+\s+)?(\w+\s+)?var\s+(\w+)(\s*\=\s*([\'\"])?([^\5]*)\5)?/i);
            if (!ret)throw new Error('var error');
            var c = qualifier(module, ret[2]);
            var v = ret[6] ? ret[6] : undefined;
            var n = ret[3];
            var q = ret[5] ? ret[5] : '';

            if (v && q === '' && !/\w+\s*\(.*?\)\s*$/.test(v) && !/^(\d+|null|true|false)$/i.test(trim(v))) {
                throw new Error('var error ' + code);
            }
            if (module.uinquename[n]===true)throw new Error('[conflict variable name]');
            module.uinquename[n] = true;
            module.var[c].push({'name': n, 'value': v, is_string: q});
            break;
        default :
            throw new Error('[syntax error]');
    }
}

/**
 * 获取代码块的上下文
 * @param module
 * @param code
 * @returns {*}
 */
function codeContext(module, code)
{
    if( module.current )return module.current;
    var ret = code.match(/((\w+\s+)+)?function\s+(set\s+|get\s+)?(\w+)/i);

    if( ret )
    {
        module.current = {'content':[],'param':[],'name':ret[4],'access':ret[3] || '','parambreak':true,defvar:[],is_static:false };
        module.current.body = module.current.param;

        var q = ret[2] ? trim(ret[2]).toLowerCase().split(/\s+/) : [];
        if( q.length > 2 )
        {
            throw new Error('[qualifier invalid]');
        }

        var index = q.indexOf('static');
        var s= index >=0 ? q.splice(index,1) : false;
        var p= q[0];

        module.current.is_static = !!s;
        module.fn[ qualifier(module, p ) ].push( module.current );

        if( module.uinquename[ module.current.name ] === module.current.access  )throw new Error('[conflict function name]' );
        module.uinquename[ module.current.name ]=module.current.access;
        return module.current;

    }else if( !module.current )
    {
        throw new Error('[syntax invalid]');
    }
    return null;
}

function contextParam(module, code  )
{
    //换行的参数
    if( module.current && module.current.parambreak )
    {
        var p = code.match(/(^|\(|\,)([^\(\)]*)(\)|\,|$)/);

        if( p )
        {
            if( p[2] )
            {
                module.current.body.push(p[2]);
            }

            if( p[3] === ')')
            {
                module.current.param = module.current.param.join('');
                checkParam( module.current.param );
                module.current.parambreak=false;
                module.current.body =  module.current.content;
            }
        }
    }
}


/**
 * 解析代码
 * @param module
 * @param code
 */
function parse( module, code )
{
    //模块配置
    var keyword = code.match(/^(|(static|public|private|protected|internal)\s+(?!\2))+(package|import|class|var|function)(?!\s+\3)/i);

    //有匹配到关键词
    if( keyword )
    {
        keyword = keyword[3].toLowerCase();
        if( keyword === 'function' )
        {
            if( module.balancer != 2 )
            {
                throw new Error('[syntax error]')
            }
            codeContext(module, code);

        }else if( !module.current )
        {
            globalOptions(module,code, keyword );
        }
    }

    var flag = module.current ? module.current.parambreak : false;

    //上下文参数
    contextParam(module, code);

    if( module.current && !flag )
    {
        //获取设置变量
        code = code.replace(/this\s*\.\s*(\w+)(\s*\=([\'\"])?([^\3]*)\3)?/i,function(a,b,c,d,e){
            var v = c ? e : null;
            var q = d ? d : '';
            return v ? '__g__.prop.call(this,"'+b+'",'+q+v+q+')' : '__g__.prop.call(this,"'+b+'")';
        })

        //判断实例是否属性于某个类
        code = code.replace(/([\S]*)\s+insanceof\s+([\S]*)/ig,function(a,b,c){

            if( b !== 'this' && checkExtendsClass(module, b).length>0 )
            {
                b = torefe( b );
            }
            if( c!=='this' && checkExtendsClass(module, c).length>0 )
            {
                c = torefe( c );
            }
            return b+' instanceof '+c;
        })

        module.current.body.push( code );

    }else if( module.balancer > 2 )
    {
        throw new Error('[syntax error]'+code)
    }

    //获取对称符
    balancer( module, code);
}

//组装函数
function makeFunction( module )
{
    var classname = trim( module.class );
    module.pubfunc=[];
    for( var c in module.fn )
    {
        var item = module.fn[c];
        var b=0;
        var list={};
        while( b < item.length )
        {
            var val = item[b];
            var name = trim( val.name );
            var acc =  trim( val.access );
            var param = val.param instanceof Array ? val.param.join(',') : val.param;
            val = val.content.join(";");
            val = val.replace(/\;\s*(\{|\,)/g,'$1\n');
            val = val.replace(/(\(|\)|\{|\}|\,)\s*\;/g,'$1\n');
            val = val.replace(/\;/g,';\n');
            val = unescape( val );
            val = 'function('+trim(param)+')'+val;

            if( acc ==='get' || acc==='set' )
            {
                (module.access[name] || (module.access[name]={}))[acc]=val;
                item.splice(b,1);

            }else if( name === classname )
            {
                module.constructor = val;
                item.splice(b,1);

            }else
            {
                list[ name ]=val;
                module.pubfunc.push('proto.'+name+'=func.'+name);
                b++;
            }
        }
        module.fn[c] = list;
    }
}

//组装变量
function makeVariable(module)
{
    module.pubvar=[];
    for( var c in  module.var )
    {
        var item = module.var[c];
        var b=0;
        var list={};
        while( b < item.length )
        {
            var value = unescape( item[b].value );
            var name = trim(item[b].name);
            var q = item[b].q;
            list[ name ] = value;
            module.pubvar.push('proto.'+name+'='+q+value+q);
            b++;
        }
        module.var[c]=list;
    }
}

/**
 * 将对象转成字符串形式
 * @param obj
 * @param q
 * @returns {string}
 */
function objectToString( obj , force )
{
    var str=[];
    var q =  force === false ? '' : '"';
    if( typeof obj === "object" )
    {
        for (var i in obj) {
            if (typeof obj[i] === "object") {
                str.push(i+":"+q+ objectToString(obj[i], force ) +q);
            } else {
                str.push(i+":"+q+ obj[i] +q);
            }
        }
    }
    return "{"+str.join(',')+"}";
}

/**
 * 生成模块代码
 * @param module
 * @returns {string}
 */
function create( module )
{
    var classname = trim(module.class);
    var wrap=[];
    var access={};
    var func_map=[];
    var func_public=[];
    var func_internal={'protected':[],'internal':[]};
    var var_public=[];
    var var_internal={'protected':[],'internal':[],'private':[]};
    module.constructor='function(){}';
    makeVariable( module );
    makeFunction( module );

    //继承类
    if( module.extends )
    {
        //继承父类的属性和函数
        var parent = global( module.extends );
        module.var.protected = merge( parent.var.protected, module.var.protected );
        module.fn.protected = merge( parent.fn.protected, module.fn.protected );
        if( module.package === parent.package )
        {
            module.var.internal = merge( parent.var.internal, module.var.internal );
            module.fn.internal = merge( parent.fn.internal, module.fn.internal );
        }

        //初始化父类
        if( !/super\s*\(([^\)]*)\)/i.test(module.constructor) )
        {
            module.constructor = module.constructor.replace(/\}\s*$/,function(a){
                var str = "var param=arguments.splic();\n";
                str += "param.unshift('constructor');\n";
                str += "param.unshift('"+module.extends+"');\n";
                str +='__g__.super.apply(this,param);\n}';
                return str;
            });
        }
    }

    //构造函数,初始化变量
    var initvar=[];
    initvar.push( objectToString( module.var.public ) );
    initvar.push( objectToString( module.var.protected ) );
    initvar.push( objectToString( module.var.private ) );
    initvar.push( objectToString( module.var.internal ) );

    module.constructor= module.constructor.replace(/\}\s*$/,function(a){
        var str = 'this.__uniqid__=__g__.uniqid();\n';
        str+='__g__.prop.call(this,'+initvar.join(',')+');'+'\n}';
        return str;
    });
    wrap.push("'constructor':"+module.constructor );
    wrap.push("'package':'"+module.package+"'" );

    //内部函数
    var funs=[]
    funs.push("'protected':"+objectToString( module.fn.protected ,false ) );
    funs.push("'internal':"+objectToString( module.fn.internal ,false ) );
    wrap.push("'fn':{"+funs.join(',')+"}");

    //内部变量
    var variable=[];
    variable.push("'protected':"+objectToString( module.var.protected ));
    variable.push("'internal':"+objectToString( module.var.internal ));
    wrap.push("'var':{"+variable.join(',')+"}");

    var code = [];
    code.push('+(function(){');

    //引用的类
    for (var j in module.import )
    {
        var classname = torefe( module.import[j] );
        code.push('var '+classname+'=__g__.module("'+module.import[j]+'.constructor")');
    }

    //定义的函数
    code.push('var func='+ objectToString( merge( module.fn.public, module.fn.protected, module.fn.private, module.fn.internal ), false ) );

    //模块的配置信息
    code.push('var module={'+ wrap.join(',\n')+'}');

    //继承父类
    if( module.extends )
    {
       code.push('__g__.merge(func,__g__.module("'+module.extends+'.fn.protected"))');
       code.push('__g__.merge(module.protected,__g__.module("'+module.extends+'.fn.protected"))');
       code.push('module.constructor.prototype = __g__.getInstance("'+module.extends+'")');
    }

    //引用原型对象
    code.push('var proto = module.constructor.prototype');

    //设置构造函数
    code.push('proto.constructor = module.constructor');

    //定义访问器
    code.push('Object.defineProperties(proto,'+objectToString(module.access,false)+')');

    //插入公共变量接口
    if( var_public.length > 0)
    {
        code.push( module.pubvar.join('\n') );
    }

    //插入公共函数接口
    if( func_public.length > 0 )
    {
        code.push( module.pubfunc.join('\n') );
    }

    //注册模块到全局包
    code.push('__g__.module("'+ realclassname(module.package,module.class) +'", module)');
    code.push('})()');
    return code.join(';\n');
}

/**
 * 获取包含包名的类名
 * @param package
 * @param classname
 * @returns {string}
 */
function realclassname(package, classname )
{
    var path = [];
    if( package !=='' )path.push( package );
    path.push( classname );
    return path.join('.');
}

/**
 * 反转义
 * @param val
 * @returns {XML|string}
 */
function unescape( val )
{
    val = val.replace(new RegExp('__#034#__','g'),'\\"');
    val = val.replace(new RegExp('__#039#__','g'),"\\'");
    val = val.replace(new RegExp('__#059#__','g'),';');
    val = val.replace(new RegExp('__#040#__','g'),'(');
    val = val.replace(new RegExp('__#041#__','g'),')');
    val = val.replace(new RegExp('__#123#__','g'),'{');
    val = val.replace(new RegExp('__#125#__','g'),'}');
    return val;
}

/**
 * 转义可能冲突的符号
 * @param val
 * @returns {string|XML|*}
 */
function escape( val )
{
    //替换转义的引号
    val = val.replace(new RegExp("\\\\([\'\"])", 'g'), function (a, b) {
        return b === '"' ? "__#034#__" : "__#039#__";
    });

    //引号中的对称符号不检查
    val = val.replace(new RegExp("([\'\"])[^\\1]*\\1", 'g'), function (a) {
        return a.replace(/\;/g, '__#059#__').replace(/[\(\)\{\}]/, function (a) {
            return a === '(' ? '__#040#__' : a === ')' ? '__#041#__' : a === '{' ? '__#123#__' : '__#125#__';
        })
    });
    return val;
}

var global_error=false;

/**
 * 执行编译
 */
function make( file , fs )
{
    var content = fs.readFileSync( pathfile( file ) , 'utf-8');
    var code = content.split(/[\r]*\n/);
    var num = code.length;
    var i = 0;
    var skip = false;
    var v;
    var line;

    //模块文件的配置
    var module={
        'package':packagename(file),
        'class': classname(file),
        'import':[],
        'extends':null,
        'access':{},
        'fn':{public:[],protected:[],private:[],internal:[],static:[]},
        'var':{public:[],protected:[],private:[],internal:[],static:[]},
        'balancer':0,
        'uinquename':{}
    };

    //注册到全局模块中
    global(module.package)[module.class] = module;

    //逐行
    while (i < num && !global_error )
    {
        var item = code[i];
        i++;
        if (item !== '')
        {
            //注释的内容不解析
            if( !skip && /^\s*\/\*/.test(item) )
            {
                skip = true;
                continue;

            } else if( skip && /\*\/\s*$/.test(item) )
            {
                skip = false;
                continue;
            }

            if( skip || /^\s*\/\//.test(item) )
            {
                continue;
            }

            //分行
            line = escape( item ).replace(/\{/g,"\n{").replace(/\}/g,"\n}").replace(/\;/g,"\n");

            //分割成多行
            line = line.split(/\n/);

            var b=0;
            var len = line.length;

            //解析和检查每行的代码
            do{

                v = trim( line[b++] );
                if ( v !== '' )
                {
                    try {
                        parse(module, v );
                    } catch (e) {
                        global_error = true;
                        console.log( e.message, file, ' in line ' + i);
                    }
                }

            }while( !global_error && b<len )
        }
    }

    if( module.balancer !== 0 )
    {
        global_error=true;
        console.log('syntax error', file,' in line ' + i);
    }

    if( global_error )return '';

    var contents=[];

    //编译依赖的模块
    if( module.import.length > 0 )
    {
        for ( var j in module.import )
        {
            contents.push( make( module.import[j] , fs ) );
        }
    }

    //追加到内容容器中
    contents.push( create( module ) );
    return contents.join('\n');
}


var showMem = function()
{
    var mem = process.memoryUsage();
    var format = function(bytes) {
        return (bytes/1024/1024).toFixed(2)+'MB';
    };
    console.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
    console.log('----------------------------------------');
};


var content = make( 'test' , fs );
if( !global_error )
{
    var system = fs.readFileSync( './system.js' , 'utf-8');
    content = "(function(){\n" + system + content +'\n})';
    fs.writeFileSync('./test-min.js', content );
}

















