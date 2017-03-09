const utils = require('../core/utils.js');
const globals=['Object','Function','Array','String','Number','Boolean','Math','Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','JSON','Reflect','console'];
const contents=[];
const rootPath =  utils.getResolvePath( __dirname );
/**
 *  已加载的模块
 */
const loaded = {'System':true};

/**
 * 使用严格模式
 */
contents.push('"use strict";\n');

/**
 * 全局系统对象
 */
contents.push('var System={};\n');

/**
 * 模块描述
 */
contents.push('var descriptions={};\n');

/**
 * 封闭域
 */
contents.push('(function(System,$',globals.join(',$'),'){\n');

/**
 * 根据指定的版本加载对应的策略文件
 * @type {Array}
 */
function polyfill( config )
{
    var files = utils.getDirectoryFiles( rootPath+'/fix/' );
    var items={};
    for(var i in files )
    {
        var is=true;
        var path = rootPath + '/fix/' + files[i];
        var info = utils.getFilenameByPath(path).split('-', 2);
        if( config.compat && typeof config.compat === 'object' && config.compat.hasOwnProperty( info[1] ) )
        {
            is = parseFloat( info[2] ) >= parseFloat( config.compat[ info[1] ] );
        }
        if(is){
            if( !(items[ info[0] ] instanceof Array) )items[ info[0] ]=[];
            items[ info[0] ].push(path);
        }
    }
    return items;
}

/**
 * 获取内置模块的描述信息
 * @param str
 * @param name
 * @returns {{import: Array, describe: {static: {}, proto: {}}}}
 */
function describe( str, name )
{
    var result = str.match( /\@(require|public|private|protected|internal)\s+([^\r\n\;]*)/ig );
    var desc={"requirements":[],'describe':{"static":{},"proto":{}}};
    for( var i in result )
    {
        var val = result[i];
        var index = val.indexOf(' ');
        var prefix = val.substr(1, index-1).toLowerCase();
        val = val.substr(index+1);
        switch ( prefix )
        {
            case 'require' :
                desc.requirements = desc.requirements.concat( val.split(',') );
            break;
            case 'public' :
            case 'private' :
            case 'internal' :
            case 'protected' :
                val = val.toLowerCase().replace(/\s+/g,' ').split(' ');
                var writable = val[1]==='non-writable' ? ',writable:false' : '';
                var prop = val[0];
                var lastIndex = prop.lastIndexOf('.');
                var proto = true;
                if( lastIndex > 0 )
                {
                    proto = prop.indexOf( name.toLowerCase()+'.prototype.' )===0;
                    prop = prop.substr( lastIndex+1 );
                }
                var obj = proto ? desc.describe.proto : desc.describe.static;
                var info=[];
                if( prefix !== 'public' )info.push('qualifier:"'+prefix+'"');
                if( val[1]==='non-writable' )info.push('writable:false');
                if( info.length > 0 && prop )obj[ prop ]='{'+info.join(',')+'}';
            break;
        }
    }
    return desc;
}

/**
 * 获取指定的文件模块
 * @param filepath
 */
function include( name , filepath, fix )
{
    if( loaded[name] === true )return;
    loaded[name]=true;
    filepath = filepath ? filepath : rootPath + '/modules/' + name + '.js';
    if( utils.isFileExists(filepath) )
    {
        var str = utils.getContents( filepath );
        var desc = describe( str, name);
        var map = desc.requirements.map(function (val) {
            if( val === 'System' || val === 'system')return 'System';
            include(val);
            return 'System.'+val;
        });
        contents.push('(function('+desc.requirements.join(',')+'){\n');
        contents.push( str );
        contents.push('\n');
        //加载对应模块的兼容策略文件
        if( fix[name] )for( var f in fix[name] )
        {
            contents.push( utils.getContents(fix[name][f]) );
        }
        contents.push('}('+map.join(',')+'));\n');
        return true;

    }else if( globals.indexOf(name) >=0 )
    {
        contents.push('System.' + name + '=$' + name + ';\n');
        return true;
    }
    throw new Error(name+' does exists');
}

/**
 * 合并代码
 * @param config
 * @returns {string}
 */
function combine( config , code )
{
    var fix = polyfill( config );

    /**
     * 全局函数
     */
    include('globals' , rootPath+'/globals.js', fix );

    /**
     * 引用全局对象模块
     */
    var requires = ['Class','Interface'].concat( globals.slice(0) );
    if( config.import && config.import.length>0 )
    {
        for ( var i in config.import )
        {
            if( requires.indexOf( config.import[i] ) < 0 )requires.push( config.import[i] );
        }
    }
    for(var prop in requires)include( requires[prop] , null, fix );

    /**
     * 模块定义器
     */
    include('define' , rootPath+'/define.js', fix );

    /**
     * 内置系统对象
     */
    var g = globals.map(function(val) {
         if( val==='JSON' || val==='Reflect' || val==='console')return 'typeof '+val+'==="undefined"?null:'+val;
         return val;
    })
    contents.push('}(System,' + g.join(',') + '));\n');
    return [
        '(function(undefined){\n',
        contents.join(''),
        '\n',
        '(function(System,'+ requires.join(',')+'){\n',
        code,
        'delete System.define;\n',
        'var main=System.getDefinitionByName("'+config.main+'");\n',
        'System.Reflect.construct(main);\n',
        '})(System,System.'+requires.join(',System.')+');\n',
        '})();'
    ].join('');
}
module.exports = combine;