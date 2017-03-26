#!/usr/bin/env node
const fs = require('fs');
const root = process.cwd();
const QS = require('querystring');
const PATH = require('path');
const Ruler = require('./lib/ruler.js');
const Utils = require('./lib/utils.js');
const modules={};
const config = {
    'suffix':'.as',            //需要编译文件的后缀
    'main':'Main',             //需要运行的主文件
    'cache':'off',             //是否需要开启缓存
    'cachePath':'./cache',     //代码缓存路径
    'debug':'on',              //是否需要开启调式
    'browser':'enable',        //enable disable
    'enableBlockScope':'on',   //是否启用块级域
    'reserved':['let','of'],   //需要保护的关键字
    'minify':'off',            //是否需要压缩
    'compat':'*',              //要兼容的平台 {'ie':8,'chrome':32.5}
    'build':'./build',
};
config.root = root;

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
        name = path[deep].toLowerCase();
        obj = obj[ name ] || (obj[ name ]={});
        deep++;
    }
    if( typeof module === 'object' )
    {
        obj[ classname.toLowerCase() ] = module;
        return module;
    }
    return obj[ classname.toLowerCase() ] || null;
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
    return  PATH.resolve( lib, file.replace('.',PATH.sep) + suffix );
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
 * 创建属性的描述
 * @param stack
 * @returns {string}
 */
function createDescription( stack )
{
    var desc = {};
    desc['id'] =stack.keyword();
    desc['type'] = getType( stack.type() );
    desc['privilege'] =stack.qualifier();
    desc['static'] = !!stack.static();
    if( stack.final() )
    {
        desc['final'] =stack.final();
    }
    if( stack.override() )
    {
        desc['override'] =stack.override();
    }
    if( stack.keyword() === 'function' )
    {
        desc['param'] = stack.param();
        desc['paramType'] = [];
        desc['type']=stack.returnType;
        for(var i in desc['param'] ){
            if( desc['param'][i] ==='...')
            {
                desc['paramType'].push('*');
            }else{
                var obj = stack.define(desc['param'][i]);
                obj.type = getType(obj.type);
                desc['paramType'].push(obj.type);
            }
        }
    }
    return desc;
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
    var list = {'static':{},'proto':{},'import':{},'constructor':{}};

    var define = stack.parent().scope().define();
    for ( var j in define ){
        list['import'][j]=define[j].fullclassname;
    }

    for ( ; i< len ; i++ )
    {
        item = data[i];
        if( item instanceof Ruler.STACK )
        {
            var ref =  item.static() || isstatic ? list.static : list.proto;

            //跳过构造函数
            if( item.keyword() === 'function' && item.name() === stack.name() && !isstatic )
            {
                list.constructor= createDescription(item);
                continue;
            }

            //访问器
            if( item instanceof Ruler.SCOPE && item.accessor() )
            {
                var refObj = ref[ item.name() ];
                if( !refObj )
                {
                    ref[ item.name() ] = refObj = createDescription(item);
                    refObj.value={};
                }
                refObj.value[ item.accessor() ] = createDescription(item);

            }else
            {
                ref[ item.name() ] =  createDescription(item);
            }
        }
    }

    list['inherit'] = stack.extends() ? stack.extends() : null;
    list['package']=stack.parent().name();
    list['type']=stack.name();
    list['nonglobal']=true;
    list['fullclassname']=getModuleName(list.package, stack.name());
    list['classname']=stack.name();

    if( stack.keyword()==='interface' )
    {
        list['implements'] = [];
        list['isDynamic'] = false;
        list['isStatic'] = false;
        list['isFinal'] = false;
        list['id'] = 'interface';

    }else
    {
        list['implements'] = stack.implements();
        list['isDynamic'] = stack.dynamic();
        list['isStatic'] = stack.static();
        list['isFinal'] = stack.final();
        list['isAbstract'] = stack.abstract();
        list['id'] = 'class';
    }
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
    var has = module(file);
    if( has )return has;
    module( file, {} );

    //获取源文件的路径
    var sourcefile = pathfile(file, config.suffix, config.path);
    if( !fs.existsSync(sourcefile) )
    {
        return;
    }

    //检查源文件的状态
    var stat = fs.statSync( sourcefile );

    //源文件修改过的时间
    var id = new Date(stat.mtime).getTime();
    var data;

    //缓存文件的路径
    var cachefile = pathfile( file.replace(/\./g,'_').toLowerCase(), 'json', config.cachePath );

    //编译源文件
    console.log('Checking file', sourcefile,'...' );
    var content = fs.readFileSync( sourcefile , 'utf-8');
    var R= new Ruler( content, config );
    //侦听块级域
    if( config.enableBlockScope==='off' )
    {
       R.addListener("(statement)", function (e) {
           if( e.desc.id !=='var' )e.desc.scope =this.scope().getScopeOf();
       });
    }

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

    if( !(scope.content()[0] instanceof Ruler.SCOPE )  )
    {
        console.log('fatal error in "'+sourcefile+'"');
        process.exit();
    }

    scope = scope.content()[0].content()[0];
    if( !(scope instanceof Ruler.SCOPE) || !( scope.keyword() === 'class' || scope.keyword() === 'interface') )
    {
        console.log('fatal error in "'+sourcefile+'"');
        process.exit();
    }
    //console.log( scope.content()[0] )
    needMakeModules.push( scope );
    data = getPropertyDescription( scope );
    data.cachefile = cachefile;
    data.uid= id;
    data.filename = sourcefile.replace(/\\/g,'\\\\');

    //加载导入模块的描述
    for(var i in data.import )
    {
        loadModuleDescription(data.import[i] );
    }
    syntaxDescribe.push( data );
    module( data.fullclassname, data );
}

/**
 * 开始生成代码片段
 */
function start()
{
    loadModuleDescription( config.main );
    console.log('Making starting...' );
    var syntax = 'javascript';
    var bulidContents={};
    try {

        var builder = require('./lib/'+syntax+'.js');
        var data = builder(config, needMakeModules, syntaxDescribe, modules );
        bulidContents[ syntax ] = data;

    }catch (e)
    {
        if( config.debug==='on' ){
            console.log( e );
        }else{
            console.log(e.name, e.message)
        }
        process.exit();
    }

    if( !fs.existsSync(config.build) )fs.mkdirSync( config.build );
    var mainfile = pathfile( config.main , config.suffix,  config.build );
    var filename = PATH.resolve(PATH.dirname( mainfile ),PATH.basename(mainfile,config.suffix).toLowerCase()+'-min.js' );
    fs.writeFileSync(filename, bulidContents[syntax] );
    console.log('Making done.' );
}

// 合并传入的参数
var arguments = process.argv.splice(1);
config.make = PATH.dirname( arguments.shift() );
for(var b in arguments )Utils.merge(config, QS.parse( arguments[b] ) );
config.cache = config.cache !== 'off';

//检查是否有指定需要编译的源文件目录
if( !config.path  )
{
    config.path = root;
    if( config.main )
    {
        config.path = PATH.resolve( config.main+config.suffix );
        config.main = PATH.basename( config.path, config.suffix );
        //源码文件的根目录
        config.path = PATH.resolve( config.path,'../' );
    }
}

//返回绝对路径
config.path = PATH.resolve( config.path );
config.cachePath = PATH.resolve(config.path, config.cachePath);
//if( !fs.existsSync(config.cachePath) )fs.mkdirSync( config.cachePath );

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
    Utils.merge(config,data);
}

//必须指主文件
if( !config.main )
{
    console.log('main file can not is empty');
    process.exit();
}
start();