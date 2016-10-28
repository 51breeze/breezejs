const fs = require('fs');
const root = process.cwd();
const global_module={};
const config = {'suffix':'as','main':'main','root':root,'cache':true,'cachePath':'./cache'};
const QS = require('querystring');
const PATH = require('path');
const Ruler = require('./Ruler.js');

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
    return  PATH.resolve(lib, file.replace('.',PATH.sep) +'.'+ suffix );
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


var moduleList=[];

/**
 * 执行编译
 */
function make( file )
{
    var has = module(file);
    if( has )return has;

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
        console.log( sourcefile,'...' );
        var content = fs.readFileSync( sourcefile , 'utf-8');
        var R= new Ruler( content, config );
        R.addListener('loadModule',function(e){
            make( e.name );
        });
        var scope = R.start();
        data = Ruler.createModule(scope);
        data['id']= id;
        fs.writeFileSync( cachefile , JSON.stringify(data) );
    }

    for(var i in data.import)make( data.import[i] );
    module( getModuleName( data.package, data.class), data );
    moduleList.push( data );
    return data;
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


// 合并传入的参数
var arguments = process.argv.splice(1);
config.make = PATH.dirname( arguments.shift() );
for(var b in arguments )merge(config, QS.parse( arguments[b] ) );
config.cache = config.cache!=='off';


//检查是否有指定需要编译的库文件
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

//引用已加载的全局模块
config.loadModule = module;

//必须指主文件
if( !config.main )
{
    console.log('main file can not is empty');
    process.exit();
}

console.log('========start make=======' );
make( config.main );


function getMethods(name,param)
{
    return '__g__.'+name+'('+param.join(',')+')';
}


function toValue( describe, flag )
{
     var code=[];
     for( var p in describe )
     {
         if( typeof describe[p].v === "object" )
         {
            code.push( p+':'+ toValue(describe[p].v, true) );

         }else
         {
             code.push(p + ':' + (flag===true ? describe[p] : describe[p].v) );
         }
     }
     return '{'+code.join(',')+'}';
}

var code=[];
moduleList.forEach(function(o){

    var str= '(function(){\n';
    for (var i in o.import )
    {
        str += 'var '+i+'='+getMethods('module', ['"' + o.import[i] + '.constructor"'])+';\n';
    }
    str+='var '+o.class+'='+o.constructor+';\n';
    str+='var map={';
    str+='"constructor":'+o.class+',\n';
    str+='"static":'+ toValue(o.static)+',\n';
    str+='"proto":'+ toValue(o.proto);
    str+='};\n';

    if( o.extends )str+=o.class+'.prototype= new '+o.extends+'();\n';
    str+= o.class+'.constructor= '+o.class+';\n';
    str+= 'return map;\n';
    str+= '})()';
    code.push( getMethods('module', ['"'+getModuleName(o.package,o.class)+'"', str ] )  );

});

code = code.join(';\n')+';\n';

var mainfile = pathfile( config.main , config.suffix, config.lib );
var filename = PATH.resolve(PATH.dirname( mainfile ),PATH.basename(mainfile,'.'+config.suffix)+'-min.js' );
var system = fs.readFileSync( PATH.resolve(config.make, 'System.js') , 'utf-8');

code = '(function(){\n' + system + code;
code+='})();'



fs.writeFileSync(  filename, code );


console.log('===========done=========\n' );


/*if( !global_error )
{
    var system = fs.readFileSync( './system.js' , 'utf-8');
    var app='\nreturn __g__.getInstance("'+main+'");\n';
    content = "(function(){\n" + system + content + app +'\n})()';
    fs.writeFileSync('./test-min.js', content );
}*/
//showMem()


