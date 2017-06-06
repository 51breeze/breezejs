const fs = require('fs');
const PATH = require('path');
const Ruler = require('./lib/ruler.js');
const Utils = require('./lib/utils.js');
const makeSkin = require('./lib/skin.js');
const globals=require('./javascript/descriptions/globals.js');
const uglify = require('uglify-js');
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
    desc.__stack__ = stack;
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
        for(var i in desc['param'] )
        {
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

function defineProp(proto, name, value, qualifier, type)
{
    if( proto.hasOwnProperty(name) )
    {
        throw new Error('');
    }
    proto[name]={
        'id':'const',
        'type':'('+type+')' ,
        'privilege':qualifier,
        'static':false,
        'value':value,
    };
}

/**
 * 解析元类型模块
 * @param stack
 * @param config
 * @returns {string}
 */
function parseMetaType( describe, currentStack, metaTypeStack , config, project, syntax , list )
{
    var metatype = metaTypeToString( metaTypeStack );
    metatype = Utils.executeMetaType(metatype);
    switch ( metatype.type )
    {
        case 'Skin' :
            var source = metatype.param.source;
            var modules = makeSkin( metatype.param.source , config );
            styleContents = styleContents.concat( modules.styleContents);
            modules = modules.moduleContents;
            for( var index in modules )
            {
                loadFragmentModuleDescription(syntax, modules[ index ], config, project);
            }
            describe[ currentStack.name() ].value = 'Internal.define("'+source+'")';
        break;
        case 'Bindable' :
            var name = currentStack.name();
            var item = describe[ name ];
            if( item.bindable===true )return;
            if( item.id==='var' )
            {
                var private_var = currentStack.__name__ = name+'_'+Utils.uid();
                var privilege = item.privilege;
                var type = item.type;
                describe[ private_var ]=item;
                item.privilege = "private";
                var setter = [
                    'function(val){',
                    'var old = Reflect.get(this,"'+private_var+'")',
                    'if(old!==val){',
                    'Reflect.set(this,"'+private_var+'",val)',
                    'var event = new PropertyEvent(PropertyEvent.CHANGE)',
                    'event.property = "'+name+'"',
                    'event.oldValue = old',
                    'event.newValue = val',
                    'Reflect.apply(Reflect.get(this,"dispatchEvent"),this,[event])',
                    '}',
                    '}',
                ];
                var getter = [
                    'function(val){',
                    'return Reflect.get(this,"'+private_var+'")',
                    '}',
                ];
                item = describe[ name ]={
                    'id':'function', "privilege":privilege,"bindable":true,"type":type,
                    "value":{
                        "set":{'id':'function', "privilege": privilege,"type":type,"value":setter.join(";\n")},
                        "get":{'id':'function', "privilege": privilege,"type":type,"value":getter.join(";\n")}
                    }
               }
            }
            item.bindable = true;
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
    var list = {'static':{},'proto':{},'import':{},'constructor':{}, 'attachContent':{}};
    var define = stack.parent().scope().define();
    for ( var j in define )
    {
        list['import'][j]=define[j].fullclassname;
    }

    var prev = null;
    var bindablelist = {};
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
                refObj.value[ item.accessor() ] = createDescription( item );
                if( item.accessor()==='get' )
                {
                    refObj.type = refObj.value[ item.accessor() ].type;
                }

            }else if( item.keyword() !== 'metatype' )
            {
                ref[ item.name() ] =  createDescription(item);
            }

            //为当前的成员绑定一个数据元
            if( prev && prev.keyword()==='metatype' )
            {
                parseMetaType( ref, item, prev , config , project , syntax , list );
                if( ref[ item.name() ].bindable ===true ){
                    bindablelist[ item.name() ]=ref[ item.name() ];
                }
                prev=null;
            }
            prev = item;
        }
    }

    //绑定器必须是一个可读可写的属性
    for( var p in bindablelist )
    {
        if( !bindablelist[p].value.get || !bindablelist[p].value.set)
        {
            throw new TypeError('Property must be readable and writable of Binding for "'+p+'"');
        }
    }

    list['inherit'] = stack.extends() ? stack.extends() : null;
    list['package']=stack.parent().name();
    list['type']=stack.fullclassname();
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
function makeCodeDescription( content ,config )
{
    //获取代码描述
    var R= new Ruler( content, config );

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
        throw new Error('Fatal error');
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
function loadModuleDescription( syntax , file , config , project , resource )
{
    var suffix=config.suffix;

    //获取源文件的路径
    var sourcefile = filepath(file, config.project_path ).replace(/\\/g,'/');

    //获取对应的包和类名
    var fullclassname = PATH.relative( config.project_path, sourcefile ).replace(/\\/g,'/').replace(/\//g,'.');

    //如果已加载
    if( define(syntax, fullclassname) )return;

    sourcefile+=suffix;
    if( !fs.existsSync(sourcefile) ){
        if( globals.hasOwnProperty(file) )return;
        Utils.error(resource);
        throw new Error('is not found '+sourcefile);
    }

    //先占个位
    define(syntax, fullclassname, {} );

    //检查源文件的状态
    var stat = fs.statSync( sourcefile );

    //源文件修改过的时间
    var id = new Date(stat.mtime).getTime();

    //编译源文件
    Utils.info('Checking file '+sourcefile+'...');

    //解析代码语法
    var scope = makeCodeDescription(fs.readFileSync( sourcefile , 'utf-8'), config );

    //需要编译的模块
    var module = makeModules[syntax] || (makeModules[syntax]=[]);
    module.push( scope );

    //获取模块的描述
    var description = getPropertyDescription( scope, config, project , syntax );
    description.uid= id;
    description.filename = sourcefile.replace(/\\/g,'/');
    scope.filename = description.filename;

    //加载导入模块的描述
    for (var i in description.import)
    {
        loadModuleDescription(syntax, description.import[i], config, project, description.filename );
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
         var script = jsSyntax(config, makeModules['javascript'], descriptions['javascript'], project );
         var filename;

         if( styleContents.length > 0  )
         {
             var less = require('less');
             var themes = require('./ColorThemes.js');
             var lessPath = PATH.resolve(config.root_path, './style/');
             var options =  {
                 paths: [ lessPath ],
                 globalVars:themes.default,
                 compress: false
             };

             var cssContnets=[];
             var i = 0;
             var style =  styleContents.map(function (e) {
                 return "\n@import 'mixins.less';\n" +e;
             })
             style.unshift( "\n@import 'main.less';\n" );
             var len = style.length;

             for( ; i<len; i++ )
             {
                 (function (str, css, i ) {

                     less.render(str, options, function (err, output) {
                         if (err) {
                             Utils.error(err.message);
                             Utils.error(err.extract.join('\n'));
                             css.splice(i, 0, '');
                         } else {
                             css.splice(i, 0, output.css);
                         }
                     });

                 })(style[i], cssContnets , i )
             }

             var id = setInterval(function () {
                 if( cssContnets.length === len )
                 {
                     clearInterval(id);
                     var str = cssContnets.join('\n');
                     if( config.minify ==='on' )
                     {
                         str = uglify.minify(str, {mangle: true, fromString: true}).code;
                     }
                     filename = PATH.resolve(Utils.getBuildPath(config, 'build.webroot.static.css'), config.bootstrap + '.css');
                     fs.writeFileSync(filename, str );
                 }
             },1);

         }

         if( script )
         {
             filename = PATH.resolve(Utils.getBuildPath(config, 'build.webroot.static.js'), config.bootstrap + '.js');
             if( config.minify ==='on' )
             {
                 script = uglify.minify(script, {mangle: true, fromString: true}).code;
             }
             fs.writeFileSync(filename, script );
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
    var scope = makeCodeDescription( fragmentModule.script , config);

    //需要编译的模块
    var module = makeModules[syntax] || (makeModules[syntax]=[]);
    module.push( scope );
    scope.isFragmentModule = true;

    //获取模块的描述
    var description = getPropertyDescription( scope );
    description.isFragmentModule = true;
    description.uid= new Date().getTime();
    description.filename = fragmentModule.filepath.replace(/\\/g,'/');
    scope.filename=description.filename;

    //加载导入模块的描述
    for (var i in description.import)
    {
        loadModuleDescription(syntax, description.import[i], config, project, scope.filename );
    }

    define(syntax, description.fullclassname, description );
    return scope;
}

module.exports = make;