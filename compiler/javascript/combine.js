const utils = require('../core/utils.js');
const globals=['Object','Function','Array','String','Number','Boolean','Math','Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','JSON','Reflect','Symbol','console'];
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
 * 封闭域
 */
contents.push('(function(System,$'+globals.join(',$')+'){\n');

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

const cg = ['non-writable','non-enumerable','non-configurable'];

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
                val = val.replace(/\s+/g,' ').split(' ');
                var prop = val[0];
                var lastIndex = prop.lastIndexOf('.');
                var proto = true;
                if( lastIndex > 0 )
                {
                    proto = prop.indexOf( name+'.prototype.' )===0;
                    prop = prop.substr( lastIndex+1 );
                }
                var obj = proto ? desc.describe.proto : desc.describe.static;
                var info=[];
                if( prefix !== 'public' )info.push('"qualifier":"'+prefix+'"');
                for(var i in cg)
                {
                    if( val.indexOf(cg[i]) > 0 )
                    {
                        switch ( cg[i] )
                        {
                            case 'non-writable' : info.push('"writable":false'); break;
                            case 'non-enumerable' : info.push('"enumerable":false'); break;
                            case 'non-configurable' : info.push('"configurable":false'); break;
                        }
                        break;
                    }
                }
                if( info.length > 0 && prop )obj[ prop ]=JSON.parse('{'+info.join(',')+'}');
            break;
        }
    }
    return desc;
}

const descriptions={};
const mapname={'window':'Window','document':'Document','console':'Console'};

/**
 * 获取指定的文件模块
 * @param filepath
 */
function include( name , filepath, fix )
{
    name = mapname[name] || name;
    if( loaded[name] === true )return;
    loaded[name]=true;
    filepath = filepath ? filepath : rootPath + '/modules/' + name + '.js';
    if( utils.isFileExists(filepath) )
    {
        var str = utils.getContents( filepath );
        var desc = describe( str, name);
        if( desc.requirements.indexOf('System') < 0 )desc.requirements.unshift('System');
        var map = desc.requirements.map(function (val) {
            if( val === 'System' || val === 'system')return 'System';
            include(val, null, fix);
            return 'System.'+val;
        });
        if( isEmpty( desc.describe.static ) )delete desc.describe.static;
        if( isEmpty( desc.describe.proto ) )delete desc.describe.proto;
        if( !isEmpty( desc.describe ) )descriptions[name] = desc.describe;

        var module=[];
        module.push('(function('+desc.requirements.join(',')+'){\n');
        module.push( str );
        module.push('\n');
        //加载对应模块的兼容策略文件
        if( fix[name] )for( var f in fix[name] )
        {
            module.push( utils.getContents(fix[name][f]) );
        }
        module.push('\n}('+map.join(',')+'));\n');
        contents.push( module.join('') );
        return true;

    }else if( globals.indexOf(name) >=0 )
    {
        contents.push('System.' + name + '=$' + name + ';\n');
        return true;
    }
    throw new Error(name+' does exists');
}

function isEmpty( obj ) {
    for(var i in obj )return false;
    return true;
}

/**
 * 合并代码
 * @param config
 * @returns {string}
 */
function combine( config , code, requirements )
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
    if( requirements )
    {
        delete  requirements['System'];
        for ( var p in requirements )
        {
            if( requirements[p]===true && requires.indexOf( p ) < 0 )requires.push( p );
        }
    }
    for(var prop in requires)include( requires[prop] , null, fix );

    /**
     * 模块定义器
     */
    include('define' , rootPath+'/define.js', fix );

    /**
     * 模块描述
     */
    contents.splice(3,0, 'var descriptions = '+JSON.stringify(descriptions)+';\n' );

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
        '})(System,System.'+requires.map(function (a){
            return mapname[a] || a;
        }).join(',System.')+');\n',
        '})();'
    ].join('');
}
module.exports = combine;