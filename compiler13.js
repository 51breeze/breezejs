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
function qualifier(module, code )
{
    var q = code ? trim(code).toLowerCase().split(/\s+/) : [];
    if( q.length > 2 )
    {
        throw new Error('[qualifier invalid]');
    }
    var index = q.indexOf('static');
    var s= index >=0 ? q.splice(index,1)[0] : false;
    var p= q[0] ? q[0] : 'public';
    if ( typeof module.dynamic.function[ p ] === "undefined" )
    {
        throw new Error('[qualifier invalid]');
    }
    return [s, p];
}


//平衡对称器
function balancer( module , code )
{
    //平衡左对称符
    var v=[];

    var l= code.match(/(\(|\{)/g);
    var r= code.match(/(\)|\})/g);

    if( l )
    {
        module.balancer=module.balancer+l.length;
        v= v.concat(l);
    }

    //平衡右对称符
    if( r )
    {
        module.balancer=module.balancer-r.length;
        v= v.concat(r);
    }

    //关闭当前上下文
    if( module.next && module.balancer === 2 && v.indexOf('}') >=0 )
    {
        module.next=null;
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
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
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
            if( /[\s\W]+/.test( trim(p[i]) ) )
            {
                throw  new Error('[param invalid]')
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
    if(  module['import'][classname] )
    {
        return module['import'][classname];
    }

    var has=[];
    for( var i in module['import'] ) if( module['import'][i] === classname )
    {
        has.push( module['import'][i] );
    }
    if (has.length < 1)throw new Error('[Not found extends class for ' + classname + ']');
    if (has.length > 1)throw new Error('[Not sure of the class name for ' + classname + ']');
    return has[0];
}


function checkSyntax( code )
{

}

/**
 * 检测非字符串的值
 * @param val
 * @returns {*}
 */
function checkNotStringValue( val )
{
    var ret = val==='';
    if( val ) {
        val = trim(val);
        ret = val && (/^(|new\s+)\w+\s*\(.*?\)\;?$/.test(val) || /^(\d+|null|true|false)\;?$/i.test(val) );
    }
    if (!ret)throw new Error('[value error]');
    return true;
}

function globalOptions(module, code , keyword )
{
    switch ( keyword )
    {
        case 'package':
            var ret = code.match(/\s*(package)(\s+[\w\.]*)?/i);
            if (!ret)throw new Error('[package error] ' + code);
            var pname = ret[2] ? trim(ret[2]) : '';
            if (pname !== module['package'])throw new Error('[package path invalid]');
            break;
        case 'import':
            var ret = code.match(/^\s*(import)\s+([\w\.]*)(\s+as\s+(\w+))?$/i);
            if (!ret)throw new Error('[syntax error] ' + code);
            ret[2] = trim(ret[2]);
            if (!checkfile(ret[2]))throw new Error('[Not found class for ' + ret[2] + ']');
            var alias= ret[3] ? ret[4] : ret[2].match(/\w+$/)[0];

            if( module['import'][alias] )
            {
                throw new Error('[conflict import the '+ret[2]+']');
            }
            module['import'][alias]=ret[2];

            break;
        case 'class':
            var ret = code.match(/[\w\s]*(class)\s+(\w+)(\s+extends\s+([\w\.]*))?/i);
            if (!ret)throw new Error('class error');
            if (ret[2] !== module['class'] || module['import'][ ret[2] ] )throw new Error('file name and class name is not consistent');
            if (ret[4])
            {
                module['extends'] = checkExtendsClass(module, trim(ret[4]) );
            }
            break;
        case 'var':
            var ret = code.match(/^((\w+\s+)+)?var\s+(\w+)(\s*\=\s*([\'\"])?([^\5]*)\5)?/i);
            if (!ret)throw new Error('var error');
            var c = qualifier(module, ret[1] );
            var v = ret[6] ? unescape(ret[6]) : undefined;
            var n = ret[3];
            var q = ret[5] ? ret[5] : '';

            //检测非字符串变量是否正确
            if( v && q === '' )checkNotStringValue( v );
            (c[0]=== 'static' ? module.static.variable[c[1]] : module.dynamic.variable[c[1]])[n]=q+v+q;
            if (module.uinque[n]==='' || module.uinque[n]==='static')throw new Error('[conflict variable name]');
            module.uinque[n] = c[0] ? 'static' : '';
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
    if( module.next )return module.next;
    var ret = code.match(/((\w+\s+)+)?function\s+(set\s+|get\s+)?(\w+)/i);
    if( ret )
    {
        module.next = {'content':[],'param':[],'name':ret[4],'parambreak':true,defvar:[] };
        module.next.body = module.next.param;
        var q = qualifier(module, ret[1] );
        var is_access=ret[3] || '';
        var refobj = q[0]==='static' ? module.static.function[ q[1] ] : is_access !== '' ? (module.accessor[ ret[4] ] || (module.accessor[ ret[4] ]={}))[is_access]=[] : module.dynamic.function[ q[1] ];

        refobj.push( module.next  );
        if( module.uinque[ module.next.name ]==='' ||
            module.uinque[ module.next.name ] === 'static' ||
            module.uinque[ module.next.name ] === is_access )
        {
            throw new Error('[conflict function name]' );
        }
        module.uinque[ module.next.name ]=q[0] || is_access;
        return module.next;

    }else if( !module.next )
    {
        throw new Error('[syntax invalid]');
    }
    return null;
}

function contextParam(module, code  )
{
    //换行的参数
    if( module.next && module.next.parambreak )
    {
        var p = code.match(/(^|\(|\,)([^\(\)]*)(\)|\,|$)/);
        if( p )
        {
            if( p[2] )
            {
                module.next.body.push(p[2]);
            }
            if( p[3] === ')')
            {
                module.next.param = module.next.param.join('');
                checkParam( module.next.param );
                module.next.parambreak=false;
                module.next.body =  module.next.content;
            }
        }
    }
}

/**
 * 获取导入的类名
 * @param module
 * @returns {Array}
 */
function getImportClassName( module )
{
    var arr=[];
    for (var i in module.import )
    {
        arr.push( i );
    }
    return arr;
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
                throw new Error('[syntax error 1]'+code)
            }
            codeContext(module, code);

        }else if( !module.next )
        {
            globalOptions(module,code, keyword );
        }
    }

    var flag = module.next ? module.next.parambreak : false;

    //上下文参数
    contextParam(module, code);

    if( module.next && !flag )
    {
        var classname = getImportClassName(module);
        classname.push( module.class );
        classname.push( 'this' );

        var regexp = new RegExp('^(^|[\\(\\[\\,\\;\\:\\s+])('+classname.join('|')+')\\s*\\.\\s*(\\w+)\\s*\\(([^\\(\\)]*)\\)','ig');

        //获取设置函数
        code = code.replace( regexp , function (a, b, c, d, e) {

            var e = e && e !=='' ? ','+e : '';
            if( c==='this' )
            {
                return b + 'map.dynamic.'+d+'.call(this'+e+')';

            }else
            {
                return b + 'map.static.'+d+'('+e+')';
            }
        });

        regexp = new RegExp('(^|[\\(\\[\\,\\;\\:\\s+])('+classname.join('|')+')\\s*\\.\\s*(\\w+)(\\s*\=([\\\'\\\"])?([^\\5]*)\\5)?','ig');

        //获取设置变量
        code = code.replace( regexp , function (a, b, c, d, e, f, g) {
            var v = e ? g : null;
            var q = f ? f : '';
            if( c==='this' )
            {
                return b + (v ? '__g__.prop.call(this,"' + d + '",' + q + v + q + ')' : '__g__.prop.call(this,"' + d + '")');

            }else
            {
                return b + (v ? 'map.static["' + d + '"]=' + q + v + q : 'map.static["' + d + '"]' );
            }
        });

        //判断实例是否属性于某个类
        code = code.replace(/([\S]*)\s+insanceof\s+([\S]*)/ig, function (a, b, c) {

            if (b !== 'this' && checkExtendsClass(module, b).length > 0) {
                b = torefe(b);
            }
            if (c !== 'this' && checkExtendsClass(module, c).length > 0) {
                c = torefe(c);
            }
            return b + ' instanceof ' + c;
        })

        module.next.body.push( code );

    }else if( !module.next && module.balancer > 2 && flag)
    {
        throw new Error('[syntax error 2]'+code)
    }

    //获取对称符
    balancer( module, code);
}

//组装函数
function makeFunction( funcs )
{
    var data={};
    for( var c in funcs )
    {
        var val = funcs[c];
        var name = trim( val.name );
        var param = val.param instanceof Array ? val.param.join(',') : val.param;
        val = val.content.join(";");
        val = val.replace(/\;+\s*([\(\)\{\}\,\+\:])/gm,'$1\n');
        val = val.replace(/([\(\)\{\}\,\+\:])\s*\;+/gm,'$1\n');
        val = val.replace(/\;+/g,';\n');
        val = unescape( val );
        val = 'function('+trim(param)+')'+val;
        data[ name ]= val;
    }
    return data;
}

//组装变量
function makeVariable(module)
{
   return [
        objectToString(module.dynamic.variable.public,false),
        objectToString(module.dynamic.variable.protected,false),
        objectToString(module.dynamic.variable.private,false),
        objectToString(module.dynamic.variable.internal,false),
    ].join(',');
}

/**
 * 组件模块内部的所有动态和静态函数/变量
 * @param module
 * @returns {string}
 */
function makeMap( module, classname )
{
    var map=[];
    module.dynamic.function.public = makeFunction( module.dynamic.function.public );
    if( module.dynamic.function.public[ classname ] )
    {
        module.constructor = module.dynamic.function.public[ classname ];
        delete module.dynamic.function.public[ classname ];
    }
    module.dynamic.function.protected = makeFunction( module.dynamic.function.protected );
    module.dynamic.function.private = makeFunction( module.dynamic.function.private );
    module.dynamic.function.internal = makeFunction( module.dynamic.function.internal );
    module.static.function.public = makeFunction( module.static.function.public );
    module.static.function.protected = makeFunction( module.static.function.protected );
    module.static.function.private = makeFunction( module.static.function.private );
    module.static.function.internal = makeFunction( module.static.function.internal );

    map.push('dynamic:'+objectToString(merge({}, module.dynamic.function.public,
            module.dynamic.function.protected,
            module.dynamic.function.private,
            module.dynamic.function.internal ), false));
    map.push('static:'+objectToString(merge({}, module.static.function.public,
            module.static.function.protected,
            module.static.function.private,
            module.static.function.internal,
            module.static.variable.public,
            module.static.variable.protected,
            module.static.variable.private,
            module.static.variable.internal), false));
    return  'var map={'+map.join(',\n')+'}';
}

/**
 * 组装访问器
 * @param module
 * @returns {string}
 */
function makeAccessor(module ){

    for (var i in module.accessor )
    {
        var items = {};
        for( var p in module.accessor[i])
        {
            items[p] = makeFunction( module.accessor[i][p] );
            items[p]= items[p][i];
        }
        module.accessor[i]=items;
    }
    return objectToString( module.accessor, false );
}

/**
 * 组装引用对象的属性
 * @param object
 * @param a
 * @param b
 * @param c
 * @returns {Array}
 */
function makeRefObject(object, a, b , c )
{
    var val=[];
    for (var prop in object)
    {
        val.push(a+prop+b+c+prop)
    }
    return val;
}

function makeModuleConfig( module , classname )
{
    var config={
        'constructor':classname,
        'package':"'"+module.package+"'",
        'dynamic':{
            'function':{
                'protected':{},
                'internal':{}
            },
            'variable':{
                'protected':{},
                'internal':{}
            }
        },'static':{
            'function':{
                'protected':{},
                'internal':{}
            },
            'variable':{
                'protected':{},
                'internal':{}
            }
        }
    };


    var fn_protected = makeRefObject(module.dynamic.function.protected,'',':','map.dynamic.');
    if( fn_protected.length > 0 )
    {
        config.dynamic.function.protected='{'+fn_protected.join(',\n')+'}';
    }
    var fn_internal = makeRefObject(module.dynamic.function.internal,'',':','map.dynamic.');
    if( fn_internal.length > 0 )
    {
        config.dynamic.function.internal='{'+fn_internal.join(',\n')+'}';
    }

    config.dynamic.variable.protected=objectToString(module.dynamic.variable.protected);
    config.dynamic.variable.internal=objectToString(module.dynamic.variable.internal);

    fn_protected = makeRefObject(module.static.function.protected,'',':','map.static.');
    if( fn_protected.length > 0 )
    {
        config.static.function.protected='{'+fn_protected.join(',\n')+'}';
    }
    fn_internal = makeRefObject(module.static.function.internal,'',':','map.static.');
    if( fn_internal.length > 0 )
    {
        config.static.function.internal='{'+fn_internal.join(',\n')+'}';
    }
    config.static.variable.protected=objectToString(module.static.variable.protected);
    config.static.variable.internal=objectToString(module.static.variable.internal);
    return 'var module='+objectToString(config,false);
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
        for (var i in obj)
        {
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
    module.constructor='function(){}';

    var map = makeMap( module , classname )
    var accessor = makeAccessor( module );
    var variable = makeVariable( module );

    //构造函数,初始化变量
    module.constructor = module.constructor.replace(/^\s*function.*?\{/,function(a){
        var str = a+'\n';
        str += 'this.__uniqid__=__g__.uniqid.call(this);\n';
        str+='__g__.prop.call(this,'+variable+');'+'\n';
        return str;
    });

    //继承类
    if( module.extends )
    {
        //初始化父类
        if( !/super\s*\(([^\)]*)\)/i.test(module.constructor) )
        {
            module.constructor = module.constructor.replace(/^\s*function.*?\{/,function(a){
                var str = a+'\n';
                str += "var param=[].slice.call(arguments);\n";
                str += "param.unshift('constructor');\n";
                str += "param.unshift('"+module.extends+"');\n";
                str +='__g__.super.apply(this,param);\n';
                return str;
            });
        }
    }

    module.constructor = module.constructor.replace(/\}$/,function(a){
        return 'return this;\n}';
    });

    var moduleConfig = makeModuleConfig( module, classname );

    var code = [];
    code.push('+(function(){');

    //引用的类
    for (var j in module.import )
    {
        var classname = torefe( j );
        code.push('var '+classname+'=__g__.module("'+module.import[j]+'.constructor")');
    }

    //将构造函数赋值给类名
    code.push('var '+module.class+'='+module.constructor);
    code.push(map);
    code.push(moduleConfig);

    //继承父类中的属性
    if( module.extends )
    {
        code.push('__g__.merge(map.dynamic,__g__.module("'+module.extends+'.dynamic.function.protected"))');
        code.push('__g__.merge(module.dynamic.function.protected,__g__.module("'+module.extends+'.dynamic.function.protected"))');

        code.push('__g__.merge(map.static,__g__.module("'+module.extends+'.static.function.protected"))');
        code.push('__g__.merge(module.static.function.protected,__g__.module("'+module.extends+'.static.function.protected"))');

        code.push('__g__.merge(map.static,__g__.module("'+module.extends+'.static.variable.protected"))');
        code.push('__g__.merge(module.static.variable.protected,__g__.module("'+module.extends+'.static.variable.protected"))');
    }


    //继承包中的属性
    var internals = global( module.package );
    for (var key in internals)
    {
        if( typeof internals[key].package === module.package )
        {
            var classname = realclassname( internals[key].package,internals[key].class );
            code.push('__g__.merge(map.dynamic,__g__.module("' + classname + '.dynamic.function.internal"))');
            code.push('__g__.merge(module.dynamic.function.internal,__g__.module("' +classname + '.dynamic.function.internal"))');

            code.push('__g__.merge(map.static,__g__.module("' + classname + '.static.function.internal"))');
            code.push('__g__.merge(module.static.function.internal,__g__.module("' +classname + '.static.function.internal"))');

            code.push('__g__.merge(map.static,__g__.module("' + classname + '.static.variable.internal"))');
            code.push('__g__.merge(module.static.variable.internal,__g__.module("' + classname + '.static.variable.internal"))');
        }
    }

    if( module.extends )
    {
        code.push('module.constructor.prototype = __g__.getInstance("' + module.extends + '")');
    }

    //引用原型对象
    code.push('var proto = module.constructor.prototype');

    //设置构造函数
    code.push('proto.constructor = module.constructor');

    //定义访问器
    code.push('Object.defineProperties(proto,'+accessor+')');

    //公共属性
    var a= makeRefObject( module.static.function.public,module.class+'.','=','map.static.' );
    var b= makeRefObject( module.static.variable.public,module.class+'.','=','map.static.' );
    var c= makeRefObject( module.dynamic.function.public,'proto.','=','map.dynamic.' );
    if(a.length>0)code.push( a.join(';\n') );
    if(b.length>0)code.push( b.join(';\n') );
    if(c.length>0)code.push( c.join(';\n') );
    for( var prop in module.dynamic.variable.public)
    {
        code.push('proto.'+prop+'='+module.dynamic.variable.public[prop]);
    }

    //注册模块到全局包
    code.push('__g__.module("'+ realclassname(module.package,module.class) +'", module)');
    code.push('})();\n');
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
 * 生成模块配置
 * @param file
 * @returns {}
 **/
function createModule(file)
{
    return {
        'package':packagename(file),
        'class': classname(file),
        'import':{},
        'extends':null,
        'type':'public',
        'accessor':[],
        'dynamic': {
            'function':{public:[],protected:[],private:[],internal:[]},
            'variable':{public:{},protected:{},private:{},internal:{}}
        },
        'static':{
            'function':{public:[],protected:[],private:[],internal:[]},
            'variable':{public:{},protected:{},private:{},internal:{}}
         },
        'uinque':{}
    };
}


var syntax={

    '(identifier)':function ()
    {
        var c = this.current();
        if( c.id === '.' || c.id === ',' || c.id==='?' || c.id==='=' || c.id===';' )
        {
            var p = this.previous();
            if( ( p.type =='(identifier)' && ( p.id === '.' || p.id === ',' || p.id==='?' || p.id==='=' ) ) )
            {
               this.error();
            }
            else if( ( c.id==='=' ) && ( isOperator( p.value ) || isIdentifier(p.value ) ) )
            {
                this.error();
            }
        }
    },

    "package":function (){

        var r = this.current();
        var s = this.scope().current();
    },

    'import':function (){

        var s = this.scope().current();
        if( s.type() !=='package' )this.error('Unexpected import ', 'syntax');
        var a,str=[];
        this.expect(function (r)
        {
            if( r.type==='(newline)' || r.id===';' )return false;
            if( r.id==='(keyword)' && r.value === 'as' )
            {
                var r = this.next();
                a = r.value;
                return false;
            }
            str.push( r.value );
            return true;
        });

        var r = this.seek();
        if( r.id==='(keyword)' && r.value ==='as' )
        {
            var r = this.next();
            a = r.value;
        }
        str = str.join('');
        if( !a )
        {
            a = str.match( /\w+$/ );
            a = a[0];
        }
        if( !checkStatement(a) )this.error('Invalid property name');
        this.module.import[a] = str;
    },
    'as':function ()
    {
        var p = this.previous();
        if( !isPropertyName(p.value) ) this.error();
        this.previous(function (r) {
            if( r.id==='(keyword)' ){
                if( r.value !=='import' ) this.error();
                return false;
            }
            return true;
        })
    },
    'public,private,protected,internal,static':function()
    {
        var s = this.scope().current();
        if( s.type() !=='package' && s.type() !=='class' )this.error();
    },
    'class':function()
    {
        var s = this.scope().current();
        if( s.type() !=='package' )this.error();
        s.add( new Scope('class') );

        var p = this.previous();
        if( p.id==='(keyword)' && (p.value==='static' || p.value==='internal') )
        {
            this.module.type=p.value;
        }

        s = this.next();
        if(  s.value !== this.module.class )
        {
            this.error('Invalid class name');
        }

        s = this.next();
        if( s.id==='(keyword)' && s.value==='extends' )
        {
            var r = this.next();
            if( !this.module.import[ r.value ] )
            {
                this.error( r.value+' is not defined','reference');
            }
            this.module.extends=r.value;
        }
    },
    'var' : function ()
    {
        var s = this.scope().current();
        var category = 'dynamic';
        var type = 'public';

        if( s.type() === 'class' )
        {
            this.previous(function (r) {
                if (r.id === '(keyword)') {
                    if (r.value === 'static')category = 'static';
                    if (r.value === 'private' || r.value === 'protected' || r.value === 'internal')type = r.value;
                    return true;
                }
                return false;
            })
        }
        var r = this.next();
        if( !checkStatement(r.value) )this.error();
        if( s.type() === 'class' )
        {
            var v = this.next();
            if( v.type !=='(operator)' || v.id !=='=' )this.error();
            v = this.next();
            this.module[category]['variable'][type][ r.value ] = v.value;

        }else
        {
            this.expect(function (r)
            {
                 if( r.type ==='(newline)')return true;
                 if( r.id===';')return false;
            });
        }
    },
    'function' : function ()
     {
         var s = this.scope().current();
         var old=s;
         s.add( new Scope('function') );
         s = this.scope().current();
         if( old.type() === 'class' )
         {
             var category = 'dynamic';
             var type = 'public';
             this.previous(function (r)
             {
                 if (r.id === '(keyword)') {
                     if (r.value === 'static')category = 'static';
                     if (r.value === 'private' || r.value === 'protected' || r.value === 'internal')type = r.value;
                     return true;
                 }
                 return false;
             })

             var r = this.next();
             if( r.id === '(keyword)' && (r.value==='get' || r.value==='set') )
             {
                 s.accessor=r.value;
                 r = this.next();
             }

             if( !checkStatement(r.value) )this.error();
             s.name( r.value );
             if( this.module.uinque[ r.value ] === s.accessor)
             {
                 this.error('Duplicate function '+r.value );
             }
             this.module[category]['function'][type].push(s);
         }

         var r = this.next();
         if( r.id !== '(' )
         {
             if( checkStatement(r.value) )this.error();
             s.name( r.value );
             r = this.next();
         }

         if(  r.id !== '(' )this.error();
         this.expect(function (r) {

             if( r.type==='(newline)' )return true;
             if( r.type !=='(identifier)' || r.id==='(keyword)' )this.error();
             if( r && r.id === ')' )return false;
             if( r.id !== ',' )
             {
                 if( !checkStatement( r.value ) )this.error('Invalid param name');
                 s.param( r.value )
             }
             return true;
         });

         r = this.expect(function (r) {
             return r.type==='(newline)';
         });

         if( r.id !== '{' )this.error();
     }
    
}

function Scope( type )
{
   this.__parent__=null;
   this.__content__=[];
   this.__define__=[];
   this.__balance__=0;
   this.__type__ = type;
   this.__name__='';
   this.__param__=[];
   this.accessor='';
   if( Scope.__current__===null )Scope.__current__=this;
}

Scope.__current__=null;
Scope.prototype.add=function( scope )
{
    if( scope instanceof Scope )
    {
        scope.__parent__=this;
        Scope.__current__ = scope;
    }
    this.__content__.push( scope );
}

Scope.prototype.define=function( prop )
{
    if( typeof prop === 'undefined' )return this.__define__.slice(0);
    this.__define__.push( prop );
}

Scope.prototype.name=function( name )
{
    if( typeof name === 'undefined' )return this.__name__;
    this.__name__=name;
}

Scope.prototype.param=function( name )
{
    if( typeof name === 'undefined' )return this.__param__.slice(0);
    this.__param__.push( name );
}

Scope.prototype.parent=function()
{
    return this.__parent__;
}

Scope.prototype.content=function()
{
    return this.__content__;
}

Scope.prototype.type=function()
{
    return this.__type__;
}

Scope.prototype.current=function()
{
    return Scope.__current__;
}

Scope.prototype.balance=function( open )
{
    open ? this.__balance__++ : this.__balance__--;
    if( this.__balance__ < 0 )throw new SyntaxError('Unexpected token');
    if( this.__balance__===0 )
    {
        Scope.__current__ = this.parent() || Scope.__current__;
    }
}

function Ruler( content )
{
    this.lines=content.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split(/\n/);
    this.line=0;
    this.cursor=0;
    this.input='';
    this.closer=null;
    this.history=[];
    this.__scope__=new Scope('package');
    this.events={};
    for (var type in syntax )
    {
        this.addListener( type.split(','), syntax[type] ) ;
    }
}


Ruler.prototype.dispatcher=function( type, options )
{
    if( this.events[type] && this.events[type].length > 0 )
    {
        var listener = this.events[type].slice();
        var len = listener.length;
        for ( var i =0; i<len; i++)
        {
            if( listener[i].callback.call(this, options) === false )
            {
                return false;
            }
        }
    }
    return true;
}


Ruler.prototype.addListener=function(type, callback, priority)
{
    if( type instanceof Array )
    {
        for (var i in type )this.addListener( type[i], callback, priority);
        return this;
    }
    var obj = this.events[type] || ( this.events[type]=[] );
    obj.push({callback:callback, priority:priority || 0});
    if( obj.length > 1 )obj.sort(function(a,b)
    {
        return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
    })
    return this;
}


Ruler.prototype.hasListener=function(type, callback)
{
    if( typeof callback === "undefined"  )
    {
        return !!this.events[type];

    }else if( this.events[type] && this.events[type].length > 0 )
    {
        var len = this.events[type].length;
        for ( var i =0; i<len; i++)
        {
            if( this.events[type][i] && this.events[type][i].callback === callback )
            {
                return true;
            }
        }
    }
    return false;
}


Ruler.prototype.removeListener=function(type, callback)
{
    if( typeof callback === "undefined" )
    {
        delete this.events[type];

    }else if(  this.events[type] &&  this.events[type].length > 0 )
    {
        var len = this.events[type].length;
        for ( var i =0; i<len; i++)
        {
            if( this.events[type][i] && this.events[type][i].callback === callback )
            {
                this.events[type].splice(i,1);
                return this;
            }
        }
    }
    return this;
}


Ruler.prototype.scope=function()
{
    return this.__scope__;
}

Ruler.prototype.done=function()
{
    return !(this.line < this.lines.length);
}

Ruler.prototype.move=function()
{
    if ( this.line < this.lines.length )
    {
        this.input = this.lines[ this.line ].replace(/\t/g,'  ');
        var s = trim( this.input );
        this.line++;
        this.cursor=0;

        if( s.indexOf('/*',0) === 0 )this.closer='*/';
        if( this.closer )
        {
            if( s.indexOf( this.closer , s.length-2 )>=0 )this.closer=null;
            return this.move();

        }else if( !s || s.indexOf('//',0)===0 )
        {
            return this.move();
        }
        return this.input;
    }
    return null;
}


Ruler.prototype.previous=function ( step )
{
    var index =  typeof step === "number" ? step : -2;
    var i = index < 0 ? this.history.length+index : index;
    var r = this.history[ i ];
    if( typeof step === "function"  )
    {
        var s;
        while ( ( s=step.call(this, r ) ) && ( r=this.previous( --index ) ) );
        return s;
    }
    return r;
}

Ruler.prototype.current=function ()
{
    return this.previous(-1);
}

Ruler.prototype.error=function (msg, type)
{
    var c = this.current();
    msg =  msg || 'Unexpected token';
    type = type || 'syntax';
    console.log( c );
    console.log( 'error line:', this.line, '  character:', this.cursor );
    switch ( type )
    {
        case 'syntax' :
            throw new SyntaxError(msg+' '+c.id);
            break;
        case 'reference' :
            throw new ReferenceError(msg);
            break;
        default :
            throw new Error(msg+' '+c.id, c.id );
    }
}

Ruler.prototype.seek=function ()
{
    this.__seek__=true;
    this.state={'cursor':this.cursor,'line':this.line,'input':this.input};
    var o = this.next();
    this.__seek__=false;
    return o;
}

Ruler.prototype.expect=function(callback)
{
    var ret = false;
    var r;
    do{
        r = this.next();
        if( callback )ret = callback.call(this,r);
    }while( ret && !this.done() )
    return r;
}

Ruler.prototype.next=function()
{
    if( this.__seek__ === false && this.state )
    {
        this.line= this.state.line;
        this.input= this.state.input;
        this.cursor= this.state.cursor;
        this.state=null;
    }

    var o;
    if( this.input.length === this.cursor )
    {
        if( !this.move() ){
            o={type:'(end)' ,value:'(end)', id:'(end)'};
        } ;
        if( this.line > 1 ){
            o={type:'(newline)' ,value:'(newline)', id:'(newline)'};
        }
        o.line= this.line;
        o.cursor = this.cursor;
        if (this.__seek__ === true)return o;

    }else
    {
        var s = this.input.slice(this.cursor);
        while (s.charAt(0) === " ") {
            this.cursor++;
            s = s.slice(1);
        }
        o = this.number(s) || this.keyword(s) || this.operator(s) || this.identifier(s);

        if (this.__seek__ === true)return o;
        if (!o)throw new SyntaxError('Unexpected Illegal ' + s);

        if( o.id === '{' || o.id === '}' )
        {
            this.scope().current().balance( o.id === '{' )
        }

        o.line= this.line;
        o.cursor = this.cursor;

        this.cursor += o.value.length;
        this.history.push( o );
    }

    if( o.id==='(keyword)' && this.hasListener(o.value) )
    {
        this.dispatcher( o.value );

    }else
    {
        this.dispatcher( o.type );
    }
    return o;
}

var reserved = [
'static','public','private','protected','internal','package',
'extends','import','class','var','function','as','new','get',
'set','typeof','instanceof','if','else','do','while','for',
'switch','case','break','default','try','catch','throw','Infinity',
'finally','return','null','false','true','NaN','undefined'
];

Ruler.prototype.keyword=function(s)
{
    s = /^([a-z_$]+[\w+]?)/i.exec( s )
    if( s )
    {
        var index = reserved.indexOf( s[1] );
        var o = {type: '(identifier)', value: s[1], id: index >= 0 ? '(keyword)' : '(identifier)'};
        return o;
    }
    return null;
}

Ruler.prototype.number=function(s)
{
    if( isNumber(s) )
    {
        if( s.charAt(0)==='.' && !/\d/.test( s.charAt(1) ) )return null;
        s = /^(0x[0-9a-f]+|o[0-7]+|[\-\+]?[\d\.]+)/i.exec(s)
        return {type:'(number)' ,value:s[1],id:s[1]};
    }
    return null;
}

Ruler.prototype.identifier=function(s)
{
    if( isIdentifier( s.charAt(0) ) )
    {
        if( s.charAt(0)==='.' && /\d/.test( s.charAt(1) ) )return false;
        return {type:'(identifier)' ,value:s.charAt(0), id:s.charAt(0)};
    }
    switch( s.charAt(0) )
    {
        case '`' :
        case '"' :
        case '\'':
            var i=1;
            while ( i<s.length && !(s.charAt(0) === s.charAt(i) && s.charAt(i-1) !=='\\') )i++;
            if( s.charAt(0) !== s.charAt(i) )throw new SyntaxError('Missing identifier '+s.charAt(0));
            return {type:s.charAt(0)==='`' ? '(template)' : '(string)' ,value: s.substr(0,i+1), id:s.charAt(0)};
        case '/':
            var i=1;
            while ( i<s.length )
            {
                var j = s.charAt(i);
                if( ( j ==='.' || j===';' ) && s.charAt(i-1) !=='\\' )break;
                i++;
            }
            var j = trim( s.substr(0,i) );
            var g= j.match(/[a-zA-Z]+$/) || '';
            if( g  )
            {
                g = g[0];
                j = j.substr(0, j.length-g.length );
            }
            if( s.charAt(0) !== j.charAt(j.length-1) )throw new SyntaxError('Missing identifier '+s.charAt(0));
            new RegExp( j.slice(1,-1), g );
            return {type:'(regexp)' ,value: s.substr(0,i), id:s.charAt(0)};
    }
    return null;
}

Ruler.prototype.operator=function(s)
{
    s = getOperator(s);
    if( s )
    {
        if( !isOperator(s) )throw new SyntaxError('Unexpected operator ' + s);
        return {type:'(operator)', value: s, id: s};
    }
    return null;
}

function getOperator(s)
{
    switch( s.charAt(0) )
    {
        case '!' :
        case '|' :
        case '&' :
        case '+' :
        case '-' :
        case '*' :
        case '/' :
        case '=' :
        case '>' :
        case '<' :
        case '^' :
        case '%' :
        case '~' :

            if( s.charAt(0)==='/' && s.charAt(1)!=='=' )
            {
                var p = this.current();
                if( !p || !(p.type==='(number)' || isPropertyName(p.value) ) )return '';
            }
            return s.substr(0,1) + getOperator( s.substr(1) );
            break;
    }
    return '';
}

function isNumber(s)
{
  return /^(0x[0-9a-f]+|o[0-7]+|[\-\+]?[\d\.]+)/i.test(s);
}

function checkStatement(s)
{
    return isPropertyName(s) && reserved.indexOf( s )<0;
}

function isPropertyName(s)
{
   return /^([a-z_$]+[\w+]?)/i.test( s );
}

function isIdentifier( s )
{
    switch( s )
    {
        case '{' :
        case '}' :
        case '(' :
        case ')' :
        case '[' :
        case ']' :
        case ';' :
        case ':' :
        case '.' :
        case ',' :
        case '?' :
            return true;
    }
    return false;
}


function isBlack( s )
{
    switch( s )
    {
        case '{' :
        case '}' :
        case '(' :
        case ')' :
        case '[' :
        case ']' :
            return true;
    }
    return false;
}

function isOperator( o )
{
    switch (o) {
        case '=' :
        case '&' :
        case '|' :
        case '<' :
        case '>' :
        case '-' :
        case '+' :
        case '*' :
        case '/' :
        case '%' :
        case '!' :
        case '^' :
        case '==' :
        case '&&' :
        case '||' :
        case '<=' :
        case '>=' :
        case '--' :
        case '++' :
        case '+=' :
        case '-=' :
        case '*=' :
        case '/=' :
        case '%=' :
        case '^=' :
        case '&=' :
        case '|=' :
        case '!!' :
        case '<<' :
        case '>>' :
        case '===' :
        case '!==' :
            return true;
    }
    return false;
}



/**
 * 执行编译
 */
function make( file , fs )
{
    var content = fs.readFileSync( pathfile( file ) , 'utf-8');
  //  var code = content.split(/[\r]*\n/);
  //  var num = code.length;
    //var i = 0;
  //  var balancer=0;

    //模块文件的配置
    var module=createModule(file);

    //注册到全局模块中
    global(module.package)[module.class] = module;

    var r = new Ruler( content );
    var s;
    r.module=module;

    while ( !r.done() )
    {
        s= r.next();

        //console.log( s );
    }

    console.log(module );
    return ;



    //逐行
    while ( i < num )
    {
        var item = code[i++];

        //注释的内容不解析
        if( balancer===0 && /^\s*\/\*/.test(item) )
        {
            balancer++;
        } else if( balancer===1 && /\*\/\s*$/.test(item) )
        {
            balancer--;
        }
        if( balancer===0 &&  item !== '' && !/^\s*\/\//.test(item) )
        {

        }
    }



    var contents=[];

    //编译依赖的模块
    for ( var j in module.import )
    {
        contents.push( make( module.import[j] , fs ) );
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




var main='test';
var content = make( main , fs );


/*if( !global_error )
{
    var system = fs.readFileSync( './system.js' , 'utf-8');
    var app='\nreturn __g__.getInstance("'+main+'");\n';
    content = "(function(){\n" + system + content + app +'\n})()';
    fs.writeFileSync('./test-min.js', content );
}*/





//showMem()


