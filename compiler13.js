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

function checkSegmentation( arr )
{
    return arr instanceof Array && arr.length > 0 ? arr.length % 2 === 1 : false ;
}

var balance={'{':'}','(':')','[':']'};

var syntax={

    '(addBefore)':function (c) {

        var s = this.scope();
        if( s.type() === 'class' || s.type() === 'package' )
        {
            return false;
        }
        if( c.id==='(keyword)' && c.value==='function')return false;
        if( c.type==='(newline)' )
        {
            var p = this.previous(-1);
            if(p && p.type==='(newline)')p = this.previous(-2);
            if( p && ( p.type==='(number)' || p.type==='(regexp)' || p.id==='}' || isPropertyName(p.value) ) )
            {
                this.endSemicolon();

            }else if( p && ( p.id===')' || p.id===']' ) &&
                !( this.next.id ==='.' || this.next.id ===')' || this.next.id ===']' || this.next.id==='{') )
            {
                this.endSemicolon();
            }
        }
    },
    '(identifier)':function( c ) {

        if( c.id === '.' )
        {
            var p = this.previous(function (p) {
                 return p && p.type === '(newline)';
            });
            if( p && p.id==='(keyword)' && p.value ==='this' )return true;
            if( !p || p.id==='(keyword)' )this.error();
            if( !( p.type==='(identifier)' && ( p.id === ']' || p.id === ')' ) ) && !isPropertyName(p.value) )
            {
               this.error();
            }
            p = this.next;
            if( p.id==='(keyword)' )p = this.seek(true);
            if( !isPropertyName(p.value) )this.error();

        } else if( c.id === ',' || c.id===':' )
        {
            var p = this.previous(function (p) {
                return p && p.type === '(newline)';
            });
            if( ( p.type =='(identifier)' && ( p.id === '.' || p.id === ',' || p.id === ':' || p.id===';' ||
                p.id==='?' || isOperator(p.id) ) ) )
            {
               this.error();
            }

        }else if( c.id==='?' )
        {
            this.expect(function (r) {
                return r.id !== ':';
            });
            if( this.current.id !== ':' )this.error();
            this.expect(function (r) {
                return !this.hasSemicolon();
            });
            this.endSemicolon();

        }else if( c.id==='(' || c.id==='{' || c.id==='[')
        {
            this.expect(function (r) {
                return r.id !== balance[c.id];
            });

        } else if( c.id ===';' )
        {

        }else if( c.id ===')' || c.id==='}' || c.id===']' )
        {

        }
        else if( c.id !=='(keyword)' )
        {

             if( this.prev.value==='package' || this.prev.value==='import' || this.prev.id==='.' )return true;

             var p = this.previous(function (p) {
                   return p && p.type==='(newline)';
             });

             if( ( !p || p.id !=='.' ) && !isReference( this.scope(), c ) )
             {
                 console.log( this.scope().type() )
                 this.error(c.value+' not is defined');
             }
        }
    },

    '(operator)':function (o) {

        var p = this.prev;
        if( o.value ==='--' || o.value==='++' )
        {
            if( isPropertyName(p.value) )
            {
                p = this.seek();
            }else if( p.type==='(newline)' || p.id===';' )
            {
                p = this.seek();
                if ( !isPropertyName(p.value) )this.error();
                p = this.seek();
            }else
            {
                this.error();
            }
            return true;

        }else if( !(o.id==='!' || o.id==='!!') )
        {
            if( p.id === '.' || p.id === ',' || p.id===';' || p.id==='?' || p.id==='(' || p.id==='{' || p.id==='[' ||
                isOperator(p.id)  ){
                this.error();
            }

            p= this.next;
            if( p.id === '.' || p.id === ',' || p.id===';' || p.id==='?' || p.id===')' || p.id==='}' || p.id===']' ||
                isOperator(p.id) ){
                this.error();
            }
        }
    },

    "package":function (){

        var s = this.scope();
        var b = this.__balance__.length;
        var end = function (o) {
            var c = this.__balance__.length;
            if( b===c && o.id==='}' ){
                this.scope().switch( s );
                s.close=true;
                this.removeListener('(endBlack)', end );
            }
        }
        this.addListener('(endBlack)', end );

        var name=[];
        this.loop(function(){
            this.seek(true);
            if( this.current.id==='{' || this.next.id ==='(keyword)' )return false;
            if( this.current.type ==='(newline)' )return true;
            if( this.current.id !=='.' && !isPropertyName(this.current.value) )this.error();
            name.push( this.current.value );
            return true;
        });
        if( name.length > 0 && !checkSegmentation(name) )this.error('Invalid package name');
        name = name.join('');
        s.name( name );
    },

    'import':function (o){

        var s = this.scope();
        if( s.type() !=='package' )this.error('Unexpected import ', 'syntax');
        var a,name=[];
        this.loop(function () {
            this.seek();
            if( this.current.id === ';' || ( this.next.id==='(keyword)' && this.next.value.toLowerCase() !== 'as' ) )return false;
            if( this.current.value.toLowerCase() === 'as' )
            {
                this.seek(true);
                a = this.current.value;
                return false;
            }
            if( this.current.id !=='.' && !isPropertyName(this.current.value) )this.error('Invalid filename');
            name.push( this.current.value );
            return true;
        });
        this.endSemicolon();

        if( !checkSegmentation(name) )this.error('Invalid import filename');
        name = name.join('');
        if( !a )
        {
            a = name.match( /\w+$/ );
            a = a[0];
        }
        if( s.define(a) )error('The class '+a+' of the conflict.')
        s.define(a, name );
        this.config('reserved').push(a);
    },
    'public,private,protected,internal,static':function(c)
    {
        var s = this.scope();
        var n = this.seek();
        if( (s.type() !=='package' && s.type() !=='class') || ( c.value === n.value ) || n.id !=='(keyword)' )this.error();

        var type ='dynamic';
        var qualifier = c.value;

        if( !(n.value === 'function' || n.value === 'var' || n.value==='class') )
        {
            type='static';
            if( c.value==='static' && 'public,private,protected,internal'.indexOf( n.value )>=0 )
            {
                qualifier = n.value;
            }
            n = this.seek();
        }
        if( n.value==='class' || n.value === 'function' )
        {
            syntax[n.value].call(this,n);
            s= this.scope();
            s.is_static = type === 'static';
            s.qualifier(qualifier);

        }else if(n.value==='var')
        {
            syntax[n.value].call(this,n);
        }else
        {
             this.error();
        }
    },
    'class':function()
    {
        var b = this.__balance__.length;
        var end = function (o) {
            var c = this.__balance__.length;
            if( b===c && o.id==='}' ){
                this.scope().switch( this.scope().parent() );
                this.removeListener('(endBlack)', end );
            }
        }
        this.addListener('(endBlack)', end );

        var s = this.scope();
        var old = s;
        if( s.type() !=='package' )this.error();
        s.add( new Scope('class') );
        s = this.scope();

        var n = this.seek(true);
        if( n.value !== this.module.class || !isPropertyName( n.value) )
        {
            this.error('Invalid class name');
        }

        n = this.seek(true);
        if( n.id==='(keyword)' && n.value==='extends' )
        {
            n = this.seek(true);
            var p = s.parent();
            var v = p.define( n.value  );
            if( !v ) this.error(n.value + ' is not defined','reference');
            s.extends( n.value );
            this.seek(true);
        }
    },
    'var' : function (c)
    {
        var s = this.scope();
        var n = this.seek();
        if( !checkStatement(n.value, this.config('reserved') ) )this.error();
        if( s.type() === 'class' )
        {
            var name = n.value;
            var value = undefined;
            var n = this.seek();
            if( n.id === '=' ){
                n = this.seek();
                if( !isReference(s, n.value ) || n.value === 'this' )
                {
                    this.error();
                }
                value = n.value;
                this.seek();
            }
            if( s.define(name) )error('cannot define repeat the variables 1')
            s.define(name,value);

        }else
        {
            this.add(n);
            if( s.define(n.value) )error('cannot define repeat the variables 2');
            s.define(n.value,true);
            this.expect(function (n) {
                if( n.id===',' )
                {
                    n = this.seek(true);
                    this.add(n);
                    if (s.define(n.value)) {
                        console.log(n)
                        error('cannot define repeat the variables ');
                    }
                    if (!checkStatement(n.value, this.config('reserved')))this.error();
                    s.define(n.value, true);
                }
                return !this.hasSemicolon();
            });
        }
        this.endSemicolon();
        return false;
    },
    'function' : function ()
     {
         var b = this.__balance__.length;
         var end = function (o) {
             var c = this.__balance__.length;
             if( b===c && o.id==='}' ){
                 this.scope().switch( this.scope().parent() );
                 this.removeListener('(endBlack)', end );
             }
         }
         this.addListener('(endBlack)', end );

         var s = this.scope();
         if( s.type() ==='package' )this.error('Invalid scope');
         var old=s;
         var n;
         s = new Scope('function');
         old.add( s );

         if( old.type() === 'class' )
         {
             n = this.seek();
             if( (n.value==='get' || n.value==='set') && this.next.id !== '(' )
             {
                 s.accessor( n.value );
                 n = this.seek(true);
             }
             if( !isPropertyName(n.value) ){
                 this.error();
             }
             s.name( n.value );
             n = this.seek(true);

         }else
         {
             n = this.seek(true);
             if( n.id !== '(' )
             {
                 if( !checkStatement(n.value, this.config('reserved') ) )this.error();
                 s.define( n.value );
                 s.name(n.value );
                 n = this.seek(true);
             }
         }

         if( n.id !== '(' )this.error();
         this.loop(function(){
             var n = this.seek(true);
             if( n.id ===')' )return false;
             if( n.id==='(keyword)' )this.error();
             if( n.id !== ',' && !checkStatement( n.value, this.config('reserved') ) )this.error('Invalid param name');
             s.param( n.value );
             if( n.id !== ',' )s.define( n.value , true );
             return true;
         })
         if( s.accessor()==='get' && s.param().length > 0 )this.error('Invalid accessor of get.');
         if( s.accessor()==='set' && s.param().length !==1 )this.error('Invalid accessor of set.');
         if( s.param().length > 0 && !checkSegmentation( s.param() ) )this.error();
         if( this.seek(true).id !== '{' )this.error( "Missing token {" );
     },
    'if,while,switch':function (c)
    {
        /*var n = this.seek(true);
        if( n.id !=='(' )this.error('Missing token (');
        var len = this.scope().length();
        this.expect(function (n) {
            return n.id !== ')';
        });

        if( this.scope().length() - len < 2 )this.error('Missing parameter');
        this.seek(true);*/
    }
    
}

function error(msg, type)
{
    switch ( type )
    {
        case 'syntax' :
            throw new SyntaxError(msg);
            break;
        case 'reference' :
            throw new ReferenceError(msg);
            break;
        default :
            throw new Error(msg);
    }
}


function Scope( type )
{
   this.__content__=[];
   this.__define__={};
   this.__type__ = type;
   this.__name__='';
   this.__param__=[];
   this.__accessor__='';
   this.__qualifier__='public';
   this.close=false;
   this.__extends__='';
   this.__parent__=null;
   if( Scope.__current__===null )Scope.__current__=this;
}

Scope.__current__=null;
Scope.prototype.add=function( scope )
{
    if( scope instanceof Scope )
    {
        if( scope.__parent__ && this === scope )
        {
            throw new Error('Added scope');
        }
        scope.__parent__=this;
        Scope.__current__ = scope;
        this.__content__.push( scope );
        if( scope.type()==='function' )
        {
            var p = scope.parent();
            p = p.type()==='class' ? p.parent() : p;
            var def = p.define();
            for (var i in def )
            {
                scope.define( i, true );
            }
        }
        return this;
    }
    error('Not is Scope')
}

Scope.prototype.define=function( prop , value )
{
    if( typeof prop === 'undefined' )return this.__define__;
    if( typeof prop === 'string' &&  typeof value === 'undefined' )
    {
        return this.__define__[prop];
    }
    this.__define__[prop]=value;
    return this;
}

Scope.prototype.name=function( name )
{
    if( typeof name === 'undefined' )return this.__name__;
    this.__name__=name;
    return this;
}

Scope.prototype.extends=function( name )
{
    if( typeof name === 'undefined' )return this.__extends__;
    this.__extends__=name;
    return this;
}

Scope.prototype.qualifier=function( qualifier )
{
    if( typeof qualifier === 'undefined' )return this.__qualifier__;
    this.__qualifier__=qualifier;
    return this;
}


Scope.prototype.accessor=function( name )
{
    if( typeof name === 'undefined' )return this.__accessor__;
    this.__accessor__=name;
    return this;
}

Scope.prototype.param=function( name )
{
    if( typeof name === 'undefined' )return this.__param__;
    this.__param__.push( name );
    return this;
}

Scope.prototype.parent=function()
{
    return this.__parent__;
}

Scope.prototype.content=function( value )
{
    if( typeof value !== "undefined" )
    {
        this.__content__.push( value );
        return this;
    }
    return this.__content__;
}

Scope.prototype.type=function()
{
    return this.__type__;
}

Scope.prototype.clear=function(start, end )
{
    start = start || 0;
    end = end || this.__content__.length;
    return this.__content__.splice(start, end );
}

Scope.prototype.current=function()
{
    if( !Scope.__current__ )
    {
       error('Not exists scope instance')
    }
    return Scope.__current__;
}

Scope.prototype.length=function()
{
    return this.current().__content__.length;
}

Scope.prototype.switch=function( scope )
{
    if( scope !== Scope.__current__ )
    {
        this.close = true;
        Scope.__current__ = scope || Scope.__current__;
        return true;
    }
    return false;
}

var default_config = {
    'semicolon':false,
    'reserved':[],
}


function Ruler( content, config )
{
    this.lines=content.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split(/\n/);
    this.line=0;
    this.cursor=0;
    this.input='';
    this.closer=null;
    this.__scope__=new Scope('package');
    this.events={};
    this.__end__=false;
    this.__balance__=[];
    this.__config__= merge(default_config,config || {});
    for (var type in syntax )
    {
        this.addListener( type.split(','), syntax[type] ) ;
    }
}

Ruler.prototype.config=function(key)
{
    if( typeof key === "string" )
    {
        return this.__config__[key] || null;
    }
    return this.__config__;
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
    return this.__scope__.current();
}

Ruler.prototype.done=function()
{
    return this.__end__;
}

Ruler.prototype.endSemicolon=function()
{
     if( !this.hasSemicolon() )
     {
         this.error('Missing token ;','syntax');
     }
}

Ruler.prototype.hasSemicolon=function()
{
     if( this.current.id ===';' )return true;
     if( this.next.type==='(newline)' )this.seek();
     if( this.next.id === ';' ){
         this.seek();
         this.add( this.current );
         return true;
     }
     return false;
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
    this.__end__=true;
    return null;
}


Ruler.prototype.previous=function ( step )
{
    var c = this.scope().content();
    var index =  typeof step === "number" ? step : -2;
    var i = index < 0 ? c.length+index : index;
    var r = c[ i ];
    if( typeof step === "function"  )
    {
        while ( step.call(this, r ) && ( r=this.previous( --index ) ) );
    }
    return r;
}


Ruler.prototype.error=function (msg, type)
{
    var c = this.current;
    msg =  msg || 'Unexpected token '+c.value;
    type = type || 'syntax';
    console.log( c );
    console.log( 'error line:', this.line, '  character:', this.cursor );
    error(msg , type);
}

Ruler.prototype.balance=function( o )
{
    var b = this.__balance__;
    var tag = b.pop();
    if ( o.id !== tag )
    {
        if( tag )
        {
            if( !balance[o.id] )
            {
                error('Unexpected identifier '+o.id );
            }
            b.push(tag);
        }

        if( balance[o.id] )
        {
            this.dispatcher('(beginBlack)', o );
            b.push( balance[o.id] );
        }

        if( b.length === 0 )
        {
            error('Unexpected identifier '+o.id );
        }
        return false;
    }

    if( b.length === 0 && o.id==='}' )
    {
         this.dispatcher('(end)', o );
    }
    this.dispatcher('(endBlack)', o );
    return true;
}

Ruler.prototype.fetch=function( flag )
{
    if( this.done() ){
        return {type:'(end)' ,value:'', id:'(end)'};
    }
    var o;
    if( this.input.length === this.cursor )
    {
       this.move();
       o={type:'(newline)' ,value:'\n', id:'(newline)'};

    }else
    {
        var s = this.input.slice(this.cursor);
        while (s.charAt(0) === " ") {
            this.cursor++;
            s = s.slice(1);
        }
        o = this.number(s) || this.keyword(s) || this.operator(s) || this.identifier(s);
        this.cursor += o.value.length;
    }
    if ( !o )throw new SyntaxError('Unexpected Illegal ' + s);
    o.line= this.line;
    o.cursor = this.cursor;
    if( o.type==='(newline)' && flag === true )
    {
        return this.fetch(flag);
    }
    return o;
}

Ruler.prototype.prev=null;
Ruler.prototype.current=null;
Ruler.prototype.next=null;
Ruler.prototype.seek=function ( flag )
{
    this.prev    = this.current;
    this.current = this.next===null ? this.fetch( true ) : this.next;
    this.next    = this.fetch( this.current.type === '(newline)' );
    if( this.current.type==='(identifier)' && isBlack( this.current.value ) )this.balance( this.current );
    if( flag === true && this.current.type==='(newline)' )
    {
       return this.seek( flag );
    }
    return this.current;
}

Ruler.prototype.step=function ( flag )
{
    this.seek( flag );
    this.add( this.current );
    this.check();
    return this.current;
}

Ruler.prototype.check=function(o)
{
    o = o || this.current;
    this.dispatcher( o.id==='(keyword)' && this.hasListener(o.value) ? o.value : o.type , o );
}

Ruler.prototype.beginScope=function()
{
    if( !(this.current.id ==='{' || this.seek(true).id ==='{') )this.error( "Missing token {" );
    return this;
}

Ruler.prototype.endScope=function( s )
{

    this.loop(function() {
        if( this.next.id==='}' )
        {
            this.seek();
            return false;
        }
        this.step();
        return this.current.id !== '}';
    });
    if( this.current.id !=='}' )this.error('Missing token }');
    this.scope().switch( s );
    if( this.next.type !=='(end)' )this.step();
    return this;
}

Ruler.prototype.expect=function(callback)
{
    var ret = false;
    var r;
    do{
        r =this.step();
        if( callback )ret = callback.call(this,r);
    }while( ret && !this.done() )
    return r;
}

Ruler.prototype.loop=function(callback)
{
    while( !this.done() && callback.call(this) );
    return this.current;
}

Ruler.prototype.add=function( val, index )
{
    if(val.type==='(end)')return false;
    index = index || this.scope().length();
    if( this.previous(index) !== val )
    {
        if (!this.hasListener('(addBefore)') || this.dispatcher('(addBefore)', val))
        {
            this.scope().__content__.splice(index,0, val);
            return true;
        }
    }
    return false;
}

var reserved = [
'static','public','private','protected','internal','package',
'extends','import','class','var','function','as','new','typeof',
'instanceof','if','else','do','while','for', 'switch','case',
'break','default','try','catch','throw','Infinity','this',
'finally','return','null','false','true','NaN','undefined'
];

Ruler.prototype.keyword=function(s)
{
    s = /^([a-z_$]+[\w]*)/i.exec( s )
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
            if( s.charAt(0) !== s.charAt(i) )this.error('Missing identifier '+s.charAt(0) );
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
            if( s.charAt(0) !== j.charAt(j.length-1) )this.error('Missing identifier '+s.charAt(0) );
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
        if( !isOperator(s) )this.error('Unexpected operator '+s);
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

var structure=['if','else','do','while','for','switch','try','catch','finally'];
function isStructure( name )
{
    return structure.indexOf( name )>=0;
}

function isNumber(s)
{
  return /^(0x[0-9a-f]+|o[0-7]+|[\-\+]?[\d\.]+)/i.test(s);
}

function checkStatement(s, define )
{
    return isPropertyName(s) && reserved.indexOf( s )<0 && ( !define || define.indexOf(s)<0 );
}

function isPropertyName(s)
{
   return /^([a-z_$]+[\w+]?)/i.test( s );
}

var globals=['window','document','location','setInterval','clearInterval','setTimeout','clearTimeout','console','alert','confirm'];
function isReference( scope, obj )
{
    if( obj.type==='(regexp)' || obj.type==='(string)' || obj.type==='(number)' || obj.value==='this' )return true;
    if( scope.define( obj.value ) )return true;
    if( globals.indexOf(obj.value)>=0 )return true;
    return nonObject(obj.value);
}

function nonObject(val)
{
    return /^(null|undefined|true|false|NaN|Infinity)$/i.test(val);
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
        r.step();
    }

   /// console.log( r.scope().content()[0].content().slice(-1)[0] );
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


