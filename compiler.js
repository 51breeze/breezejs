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

function qualifier(module, val )
{
    val =  trim( val );
    if( val==='')return 'public';
    if ( typeof module.fn[ val ] === "undefined" )
        throw new Error('[qualifier invalid] '+val);
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
    if( param )
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


/**
 * 解析代码
 * @param module
 * @param code
 */
function parse( module, code )
{
    //模块配置
    var tag = code.match(/^\s*[\w\s]*(package|import|class|var)/i);

    //获取对称符
    var b = balancer( module, code );

    if( tag && !module.current )
    {
        switch( tag[1].toLowerCase() )
        {
            case 'package':
                var ret = code.match(/\s*(package)(\s+[\w\.]*)?/i);
                if (!ret)throw new Error('[package error] '+code);
                var pname = ret[2] ? trim(ret[2]) : '';
                if( pname !== module['package'] )throw new Error('package path invalid for '+pname );
                break;
            case 'import':
                var ret = code.match(/\s*(import)\s+([\w\.]*)/i);
                if (!ret)throw new Error('[syntax error] '+code);
                ret[2] = trim(ret[2]);
                if( !checkfile( ret[2] ) )throw new Error('[Not found class for '+ret[2]+'] '+code);
                module['import'].push( ret[2] );
                break;
            case 'class':
                var ret = code.match(/[\w\s]*(class)\s+(\w+)(\s+extends\s+([\w\.]*))?/i);
                if (!ret)throw new Error('class error');
                if( ret[2] !==  module['class'] )throw new Error('file name and class name is not consistent');
                if (ret[4])
                {
                    var extend = trim( ret[4] );
                    var classname = checkExtendsClass(module,extend);
                    if( classname.length < 1 )throw new Error('[Not found extends class for '+extend+']' );
                    if( classname.length > 1 )throw new Error('[Not sure of the class name for '+extend+']' );
                    module['extends']=classname[0];
                }
                break;
            case 'var':
                var ret = code.match(/^\s*(\w+\s+)?var\s+(\w+)(\s*\=\s*([\'\"])?([^\4]*)\4)?/i);
                if (!ret)throw new Error('var error');
                var c = qualifier(module, ret[1]);
                var v =  ret[5] ? ret[5] : undefined;
                var n=ret[2];
                var q = ret[4] ? ret[4] : '';

                if( v && q==='' && !/\w+\s*\(.*?\)\s*$/.test(v) && !/^(\d+|null|true|false)$/i.test( trim(v) ) )
                {
                    throw new Error('var error '+code);
                }
                if( module.uinquename[ n ] )throw new Error('variable name conflict for '+n );
                module.uinquename[n]=true;
                module.var[c].push( {'name':n,'value': v, is_string:q} );
                break;
        }

    }else
    {
        var ret = code.match(/^\s*(\w+\s+)?function\s+(set\s+|get\s+)?(\w+)(\s*(\()([^\)]*)(\))?)?/i);
        if ( ret && !module.current )
        {
            var obj = {'content':[],'param':[],'name':ret[3],'access':'', 'parambreak':!ret[7], defvar:[]};
            obj.access = ret[2] ? ret[2] : '';

            //是否有匹配到括号中的参数
            if( ret && ret[6] )
            {
                var param = trim( ret[6] );
                if( param !== '')
                {
                    if( obj.parambreak )
                    {
                        obj.param=[ param ];
                    }else
                    {
                        obj.param=param.split(',');
                        obj.defvar = obj.param.slice();
                    }
                }
            }

            module.current = obj;
            var c = qualifier(module, ret[1] );

            module.fn[c].push( module.current );
            var name =  module.current.access+module.current.name;
            if( module.uinquename[ name ] )throw new Error('function name conflict for '+ret[3] );
            module.uinquename[name]=true;

        }else if( module.current )
        {
            //换行的参数
            if( module.current.parambreak )
            {
                var p = code.match(/^(\s*\()?([^\(\)]*)/);
                if( p )
                {
                    p = p[1] ? p[1] : p[2];
                    if( p && p!=='')
                    {
                        checkParam( p );
                        module.current.param.push( p );
                    }
                }

                //关闭换行的参数
                if( b.indexOf(')') >=0 )
                {
                   module.current.param = module.current.param.join('');
                   checkParam( module.current.param );
                   module.current.param = module.current.param.split(',');
                   module.current.parambreak=false;
                }

            }else
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

               module.current.content.push( code );
            }

            //关闭当前上下文
            if( module.balancer === 2 && b.indexOf('}') >=0 )
            {
                module.current=null;
            }

        }else if( module.balancer > 2  )
        {
            throw new Error('[syntax error] '+ code)
        }
    }
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
            list[ name ] = value;
            module.pubvar.push('proto.'+name+'="'+value+'"');
            b++;
        }
        module.var[c]=list;
    }
}

function objectToString( obj , q )
{
    var str=[];
    q =  typeof q === "undefined" ? "'" : q;
    if( typeof obj === "object" )
    {
        for (var i in obj) {
            if (typeof obj[i] === "object") {
                str.push("'" + i + "':"+q+ objectToString(obj[i]) +q);
            } else {
                str.push("'" + i + "':"+q+ obj[i] +q);
            }
        }
    }
    return "{"+str.join(',')+'}';
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
    funs.push("'protected':"+objectToString( module.fn.protected ,'') );
    funs.push("'internal':"+objectToString( module.fn.internal ,'') );
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
    code.push('var func='+ objectToString( merge( module.fn.public, module.fn.protected, module.fn.private, module.fn.internal ), '' ) );

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
    code.push('Object.defineProperties(proto,'+objectToString(module.access)+')');

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
 * 将访问器转成字符串
 * @param access
 * @returns {string}
 */
function toAceess( access )
{
    var val=[];
    for(var prop in access )
    {
        var data=[];
        if( access[prop].set )
        {
            data.push( "set:"+access[prop].set )
        }
        if( access[prop].get )
        {
            data.push( "get:"+access[prop].get )
        }
        val.push( "'"+prop+"':{"+data.join(',\n')+"}" );
    }
    return val.join(',\n');
}



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
    var haserror=false;

    //模块文件的配置
    var module={
        'package':packagename(file),
        'class': classname(file),
        'import':[],
        'extends':null,
        'access':{},
        'fn':{public:[],protected:[],private:[],internal:[]},
        'var':{public:[],protected:[],private:[],internal:[]},
        'balancer':0,
        'uinquename':{}
    };

   global(module.package)[module.class] = module;

    //逐行
    while (i < num && !haserror )
    {
        var item = code[i];
        i++;
        if (item !== '')
        {
            //注释的内容不解析
            if (!skip && /^\s*\/\*/.test(item)) {
                skip = true;
                continue;
            } else if (skip && /\*\/\s*$/.test(item)) {
                skip = false;
                continue;
            }
            if (/^\s*\/\//.test(item)) {
                continue;
            }

            //如果是正文进入解析
            if (!skip)
            {
                //替换转义的引号
                var str = item.replace(new RegExp("\\\\([\'\"])", 'g'), function (a, b) {
                    return b === '"' ? "__#034#__" : "__#039#__";
                });

                //引号中的对称符号不检查
                str = str.replace(new RegExp("([\'\"])[^\\1]*\\1", 'g'), function (a) {
                    return a.replace(/\;/g, '__#059#__').replace(/[\(\)\{\}]/, function (a) {
                        return a === '(' ? '__#040#__' : a === ')' ? '__#041#__' : a === '{' ? '__#123#__' : '__#125#__';
                    })
                });

                str = str.replace(/\{/g,"\n{").replace(/\}/g,"\n}").replace(/\;/g,"\n");

                str = trim( str );

                //分割成多行
                str = str.split(/\n/);

                //解析和检查每行的代码
                for (var b in str) if (str[b] !== '')
                {
                    try {
                        parse(module, trim(str[b]) );
                    } catch (e) {
                        haserror=true;
                        console.log(e.message, file,' in line ' + i);
                    }
                }
            }
        }
    }

    var contents=[];

    //编译依赖的模块
    if( module.import.length > 0 )
    {
        for ( var j in module.import )
        {
            contents.push( make( module.import[j] , fs ) );
        }
    }

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
var system = fs.readFileSync( './system.js' , 'utf-8');
content = "(function(){\n" + system + content +'\n})';

fs.writeFileSync('./test-min.js', content );















