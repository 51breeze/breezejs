const fs = require('fs');
const root = process.cwd().replace('\\','/');
const suffix = '.as';

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
    return file.replace( new RegExp( '(^|\.)'+file+'$' ) ,'');
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
    var has=0;
    var reg= new RegExp( '(^|\.)'+classname+'$' );
    for( var i in module['import'] ) if( module['import'][i].match( reg ) )
    {
        has++;
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

    if( tag )
    {
        switch( tag[1].toLowerCase() )
        {
            case 'package':
                var ret = code.match(/\s*(package)(\s+[\w\.]*)?/i);
                if (!ret)throw new Error('[package error] '+code);
                if( (ret[2] || '') !== module['package'] )throw new Error('package path invalid for '+ret[2] );
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
                    if( !checkExtendsClass(module,extend) )throw new Error('[Not found extends class for '+extend+']' );
                    module['extends']=extend;
                }
                break;
            case 'var':
                var ret = code.match(/^\s*(\w+\s+)?var\s+(\w+)\s*\=\s*([\'\"])?([^\3]*)\3/i);
                if (!ret)throw new Error('var error');
                var c = qualifier(module, ret[1]);
                var v =  ret[4] ? ret[4] : undefined;
                if( !ret[3] && isNaN( parseInt( v ) ) )
                {
                    throw new Error('var error '+code);
                }
                module.var[c].push( {'name':ret[2],'value': v} )
                break;
        }

    }else
    {
        var ret = code.match(/^\s*(\w+\s+)?function\s+(set\s+|get\s+)?(\w+)(\s*(\()([^\)]*)(\))?)?/i);
        if ( ret && !module.current )
        {
            var obj = {'content':[],'param':[],'name':ret[3],'access':'', 'parambreak':!ret[7]};
            obj.access = ret[2] ? ret[2] : '';

            //是否有匹配到括号中的参数
            if( ret && ret[6] )
            {
                var param = trim( ret[6] );
                if( param !== '')
                {
                    obj.param = [ param ]
                }
            }

            module.current = obj;
            var c = qualifier(module, ret[1] );

            module.fn[c].push( module.current );
            var fn = module.func || (module.func={});
            var name =  module.current.access+module.current.name;
            if( fn[ name ] )throw new Error('function name conflict for '+ret[3] );
            fn[name]=true;

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

/**
 * 生成模块代码
 * @param module
 * @returns {string}
 */
function create( module )
{
    var classname = trim(module.class);
    var constructor='function(){}';
    var wrap=[];
    var access={};
    var func_map=[];
    var func_public=[];
    var func_internal={'protected':[],'internal':[]};

    var var_map=[];
    var var_public=[];
    var var_internal={'protected':[],'internal':[]};

    //组装变量
    for( var c in  module.var )
    {
        var item = module.var[c];
        var b=0;
        var val=[];
        while( b < item.length )
        {
            var value = unescape( item[b].value );
            var name = trim(item[b].name);
            if( c=== 'public'){
                val.push('this.'+name+'="'+value+'"');
            }else
            {
                val.push('"'+name+'":"'+value+'"');
            }
            b++;
        }
        module.var[c] = val.join(';\n');
    }




    //组装函数
    for( var c in module.fn )
    {
        var item = module.fn[c];
        var b=0;

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
            item[b] = val;

            if( acc ==='get' || acc==='set' )
            {
                (access[name] || (access[name]={}))[acc]=val;
                item.splice(b,1);

            }else if( name === classname && c==='public')
            {
                constructor = val;
                item.splice(b,1);

            }else
            {
                if( c === 'public')
                {
                    func_public.push( "proto."+name+"=func."+name );

                }else if( c !== 'private' )
                {
                    func_internal[c].push("'" + name + "':func." + name);
                }
                func_map.push("'"+name+"':"+val);
                b++;
            }
        }
    }

    var funs=[]
    funs.push("'protected':{"+func_internal.protected.join('\n')+'}' );
    funs.push("'internal':{"+func_internal.internal.join('\n')+'}' );

    //追加调用父类的方法
    if( module.extends && !/super\s*\(([^\)]*)\)/i.test(constructor) )
    {
        constructor = constructor.replace(/\}\s*$/,function(a){
            return 'packages["'+module.extends+'"].constructor.apply(this, arguments);\n}';
        });
    }

    if( module.var.private !=='')
    var_map.push( module.var.private )
    if( module.var.protected !=='')
    var_map.push( module.var.protected )
    if( module.var.internal !=='')
    var_map.push( module.var.internal )

    //追加变量到构造函数中
    constructor = constructor.replace(/\}\s*$/,function(a){
        return  'this.__var__={'+var_map.join(',\n')+'};\n'+module.var.public + '\n}';
    });

    wrap.push("'constructor':"+constructor );
    wrap.push("'fn':{"+funs.join(',')+"}");
    wrap.push("'var':{"+funs.join(',')+"}");




    var code = [];
    code.push('+(function( packages ){');
    code.push('var func={'+ func_map.join(',\n')+'}');
    code.push('var module={'+ wrap.join(',\n')+'}');

    if( module.extends )
    {
       code.push('module.constructor.prototype = new packages["'+module.extends+'"].constructor()');
    }

    code.push('var proto = module.constructor.prototype');
    code.push('var p = packages["'+trim(module.package)+'"] || (packages["'+trim(module.package)+'"]={})');
    code.push('p["'+module['class']+'"]= module');
    code.push('proto.constructor = module.constructor');
    code.push('Object.defineProperties(proto,{\n'+toAceess(access)+'\n})');
    code.push( func_public.join('\n') );
    code.push('})(packages)');
    return code.join(';\n');
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
 * 转成变量字符串
 * @param variable
 */
function toVariable( variable )
{
    for( var c in variable )
    {
        var item = variable[c];
        var b=0;
        var val=[];
        while( b < item.length )
        {
            var value = unescape( item[b].value );
            var name = trim(item[b].name);
            if( c=== 'public'){
               val.push('this.'+name+'="'+value+'"');
            }else
            {
                val.push('"'+name+'":"'+value+'"');
            }
            b++;
        }
        variable[c] = val.join(';\n');
    }
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
        'fn':{public:[],protected:[],private:[],internal:[]},
        'var':{public:[],protected:[],private:[],internal:[]},
        'balancer':0
    };

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


/*var global="(function(){\n\
var packages={};\n\
function merge(){\n\
    var target = arguments[0];\n\
    var len = arguments.length;\n\
    for(var i=1; i<len; i++ )\n\
    {\n\
       var item = arguments[i];\n\
        for( var p in item )\n\
        {\n\
            if( typeof item[p] === 'object' && typeof target[p] === 'object' )\n\
            {\n\
                merge(target[p],  item[p] );\n\
            }else{\n\
                target[p] = item[p];\n\
            }\n\
        }\n\
    }\n\
    return target;\n\
}\n";


content = global + content +'\n})';*/





fs.writeFileSync('./test-min.js', content );





















