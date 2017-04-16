const fs = require('fs');
const PATH = require('path');
const Ruler = require('./lib/ruler.js');
const Utils = require('./lib/utils.js');
const makeSkin = require('./lib/skin.js');
const globals=require('./javascript/descriptions/globals.js');
var  descriptions={};
var  makeModules={};
var  skinContents=[];
var  styleContents=[];
var requirements={};

/**
 * 全局模块
 * @param classname
 * @returns {{}}
 */
function define(syntax, classname, module)
{
    classname = classname.replace(/\s+/g,'');
    var obj=descriptions[syntax] || (descriptions[syntax]={});
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
function filepath(file, base )
{
    return PATH.resolve( base, file.replace(/\./g,'/') );
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
 * 将元类型转字符串
 * @param stack
 * @param type
 * @returns {string}
 */
function metaTypeToString( stack , type )
{
    var content  = stack.content();
    if( stack.keyword()==='metatype'){
        content = content[1].content();
        if( Ruler.META_TYPE.indexOf( content[0].value ) < 0 )
        {
            error('Invaild Metatype label','syntax', content[0]);
        }
        type = content[0].value;
    }

    if( (type==='Embed') && stack.type()==='(expression)')
    {
        if( content[1].previous(0).value !=='source' )
        {
            error('Missing identifier source','syntax', content[1].previous(0) );
        }
    }

    var len = content.length;
    var str=[];
    for(var i=0; i<len; i++)
    {
        if ( content[i] instanceof Ruler.STACK)
        {
            str.push( metaTypeToString( content[i], type ) );

        } else if( content[i].value != null )
        {
            str.push( content[i].value  );
        }else if( typeof content[i] === "string" )
        {
            str.push( content[i]  );
        }
    }
    return str.join('');
}

/**
 * 解析元类型模块
 * @param stack
 * @param config
 * @returns {string}
 */
function parseMetaType( stack , config, project, syntax )
{
    var metatype = metaTypeToString( stack );
    metatype = Utils.executeMetaType(metatype);
    switch ( metatype.type )
    {
        case 'Skin' :
            var source = metatype.param.source;
            var skinModules = makeSkin( metatype.param.source , config );
            skinContents = skinContents.concat( skinModules.skins );
            styleContents = styleContents.concat( skinModules.styles );
            Utils.merge(requirements, skinModules.requirements );
            if( skinModules.scripts.length > 0 )
            {
                for( var i in skinModules.scripts )
                {
                    loadFragmentModuleDescription(syntax, skinModules.scripts[i], config, project );
                }
            }
            return 'Internal.define("'+source+'")';
        break;
    }
}

/**
 * 获取类的成员信息
 */
function getPropertyDescription( stack , config , project , syntax )
{
    var data = stack.content();
    var i = 0;
    var item;
    var len = data.length;
    var isstatic = stack.static();

    // 组合接口
    var list = {'static':{},'proto':{},'import':{},'constructor':{}};
    var define = stack.parent().scope().define();
    for ( var j in define )
    {
        list['import'][j]=define[j].fullclassname;
    }

    var prev = null;
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

            }else if( item.keyword() !== 'metatype' )
            {
                ref[ item.name() ] =  createDescription(item);
            }

            //为当前的成员绑定一个数据元
            if( prev && prev.keyword()==='metatype' )
            {
                ref[ item.name() ].value = parseMetaType( prev , config , project , syntax );
                prev=null;
            }
            prev = item;
        }
    }

    list['inherit'] = stack.extends() ? stack.extends() : null;
    list['package']=stack.parent().name();
    list['type']=stack.name();
    list['nonglobal']=true;
    list['fullclassname']= stack.fullclassname();
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

//构建代码描述
function makeCodeDescription( content ,config, strict )
{
    //获取代码描述
    var R= new Ruler( content, config );
     R.strict( !!strict );

    //侦听块级域
    if( config.blockScope==='enable' )
    {
        R.addListener("(statement)", function (e) {
            if( e.desc.id !=='var' )e.desc.scope =this.scope().getScopeOf();
        });
    }

    //解析代码语法
    var scope = R.start();
    if( !(scope.content()[0] instanceof Ruler.SCOPE)  )
    {
        throw new Error('Fatal error in '+sourcefile);
    }
    scope = scope.content()[0].content()[0];
    if( !(scope instanceof Ruler.SCOPE) || !( scope.keyword() === 'class' || scope.keyword() === 'interface') )
    {
        throw new Error('Fatal error in '+sourcefile);
    }
    return scope;
}


/**
 * 加载并解析模块的描述信息
 * @returns
 */
function loadModuleDescription( syntax , file , config , project )
{
    //获取源文件的路径
    var sourcefile = filepath(file, config.project_path ).replace(/\\/g,'/');

    //获取对应的包和类名
    var fullclassname = PATH.relative( project.path, sourcefile ).replace(/\\/g,'/').replace(/\//g,'.');

    sourcefile+=config.suffix;
    if( !fs.existsSync(sourcefile) ){
        if( globals.hasOwnProperty(file) )return;
        console.log( globals[file] )
        throw new Error('is not found '+sourcefile);
    }

    //如果已加载
    if( define(syntax, fullclassname) )return;

    //先占个位
    define(syntax, fullclassname, {} );

    //检查源文件的状态
    var stat = fs.statSync( sourcefile );

    //源文件修改过的时间
    var id = new Date(stat.mtime).getTime();

    //编译源文件
    Utils.info('Checking file '+sourcefile+'...');

    //解析代码语法
    var scope = makeCodeDescription(fs.readFileSync( sourcefile , 'utf-8'), config, true );

    //需要编译的模块
    var module = makeModules[syntax] || (makeModules[syntax]=[]);
    module.push( scope );

    //获取模块的描述
    var description = getPropertyDescription( scope, config, project , syntax );
    description.uid= id;
    description.filename = sourcefile.replace(/\\/g,'/');
    scope.filename = description.filename;

    //加载导入模块的描述
    for(var i in description.import )
    {
        loadModuleDescription(syntax, description.import[i], config, project );
    }
    define(syntax, description.fullclassname, description );
    return description;
}

//目前支持的语法
const syntax_supported={
    'php':true,
    'javascript':true
}

//构建器
const builder={

    'javascript':function(config,project)
     {
         var bootstrap = PATH.resolve(project.path, config.bootstrap );
         var fullclassname = PATH.relative( config.project.path, bootstrap ).replace(/\\/g,'/').replace(/\//g,'.');
         config.main = fullclassname;
         var jsSyntax = require('./lib/javascript.js');
         var content = jsSyntax(config, makeModules['javascript'], descriptions['javascript'], project, skinContents, styleContents );
         var filename;
         if( content.js )
         {
             filename = PATH.resolve(Utils.getBuildPath(config, 'build.webroot.static.js'), config.bootstrap + '.js');
             fs.writeFileSync(filename, content.js);
         }
         if( content.css )
         {
             filename = PATH.resolve(Utils.getBuildPath(config, 'build.webroot.static.css'), config.bootstrap + '.css');
             fs.writeFileSync(filename, content.css);
         }
     },
     'php':function(config,project){

     }
};

/**
 * 开始生成代码片段
 */
function make( config )
{
    makeModules = {};
    descriptions = {};
    requirements = config.requirements || (config.requirements = {});

    //浏览器中的全局模块
    if( config.browser === 'enable' )
    {
        var browser = require('./javascript/descriptions/browser.js');
        for(var b in browser){
            globals[b]=browser[b];
        }
    }
    config.globals=globals;

    var build_project = config.project.child;
    var project_config;
    var p;
    try
    {
        for (p in build_project)
        {
            var project = build_project[p];
            project_config = Utils.merge({},config, project.config || {});
            if (typeof project_config.bootstrap === "string" && typeof project_config.syntax === "string")
            {
                if (syntax_supported[project_config.syntax] !== true)
                {
                    throw new Error('Syntax ' + project_config.syntax + ' is not be supported.');
                }
                var classname = PATH.relative( config.project_path, filepath(project_config.bootstrap, project.path ) );
                loadModuleDescription(project_config.syntax, classname, project_config, project);
            }
        }
        Utils.info('Making starting...');
        for (p in build_project)
        {
            var project = build_project[p];
            project_config = Utils.merge({},config, project.config || {});
            if (typeof project_config.bootstrap === "string" && typeof project_config.syntax === "string")
            {
                builder[project_config.syntax](project_config, project);
            }
        }
        Utils.info('Making done...');
    }catch (e)
    {
        Utils.error(e.message);
        if( config.debug=='on')console.log( e );
    }
}



/**
 * 加载并解析模块的描述信息
 * @returns
 */
function loadFragmentModuleDescription( syntax, fragmentModule, config , project )
{
    //解析代码语法
    var scope = makeCodeDescription( fragmentModule.content, config, false );

    var _package = scope.parent();

    if( _package.name() )
    {
        Utils.error('模块内部代码不能声明包');
        process.exit();
    }
    _package.__name__ = fragmentModule.package;
    
    if( scope.name() )
    {
        Utils.error('模块内部代码不能声明类');
        process.exit();
    }
    scope.__name__ = fragmentModule.classname;
    var inherit = fragmentModule.extends || '';
    if( inherit )
    {
        var classname = inherit;
        if( classname.lastIndexOf('.') )
        {
            classname = classname.substr( classname.lastIndexOf('.')+1 );
        }
        scope.__extends__ = classname;
        if( _package.scope().define(classname) )classname=inherit;
        _package.scope().define(classname,{'type':'('+classname+')','id':'class','fullclassname':inherit,'classname':classname });
    }

    //需要编译的模块
    var module = makeModules[syntax] || (makeModules[syntax]=[]);
    module.push( scope );

    //获取模块的描述
    var description = getPropertyDescription( scope );
    description.uid= new Date().getTime();
    description.filename = fragmentModule.filepath.replace(/\\/g,'/');
    scope.filename=description.filename;

    //加载导入模块的描述
    for(var i in description.import )
    {
        loadModuleDescription(syntax, description.import[i], config, project );
    }

    define(syntax, description.fullclassname, description );
    return description;
}

module.exports = make;