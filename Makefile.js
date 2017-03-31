const fs = require('fs');
const PATH = require('path');
const Ruler = require('./lib/ruler.js');
const Utils = require('./lib/utils.js');
const descriptions={};
const makeModules={};

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
 * 获取类的成员信息
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
                ref[ item.name() ].metatype = prev;
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

/**
 * 加载并解析模块的描述信息
 * @returns
 */
function loadModuleDescription( syntax , file , config , project )
{
    //获取源文件的路径
    var sourcefile = filepath(file, project.path).replace(/\\/g,'/');

    //获取对应的包和类名
    var fullclassname = PATH.relative( config.project.path, sourcefile ).replace(/\\/g,'/').replace(/\//g,'.');

    //如果已加载
    if( define(syntax, fullclassname) )return;

    //先占个位
    define(syntax, fullclassname, {} );

    sourcefile+=config.suffix;
    if( !fs.existsSync(sourcefile) )throw new Error('is not found '+sourcefile);

    //检查源文件的状态
    var stat = fs.statSync( sourcefile );

    //源文件修改过的时间
    var id = new Date(stat.mtime).getTime();

    //编译源文件
    Utils.info('Checking file '+sourcefile+'...');

    //获取代码内容
    var R= new Ruler( fs.readFileSync( sourcefile , 'utf-8'), config );
    
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

    //需要编译的模块
    var module = makeModules[syntax] || (makeModules[syntax]=[]);
    module.push( scope );

    //获取模块的描述
    var description = getPropertyDescription( scope );
    description.uid= id;
    description.filename = sourcefile.replace(/\\/g,'/');
    scope.filename = description.filename;

    //加载导入模块的描述
    for(var i in description.import )
    {
        loadModuleDescription(syntax, data.import[i], config, project );
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
         var content = require('./lib/javascript.js')(config, makeModules['javascript'], descriptions['javascript'], project);
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
                loadModuleDescription(project_config.syntax, project_config.bootstrap, project_config, project);
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
module.exports = make;