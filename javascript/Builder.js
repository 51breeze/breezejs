const utils = require('../lib/utils.js');
const globals=['Object','Function','Array','String','Number','Boolean','Math','Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','JSON','Reflect','Symbol','console'];
var contents=[];
const rootPath =  utils.getResolvePath( __dirname );
/**
 *  已加载的模块
 */
const loaded = {};

/*
 const xml = require('libxmljs');
var xmlDoc = xml.parseXmlString( "<html><body id='body'>Hello</body></html>" );

var title = new xml.Element( xmlDoc ,'title','the is title')

title.attr({name:'yejun'})

xmlDoc.root().addChild( title );

//console.log( xmlDoc.root().childNodes()[1].attr('name').value() );


console.log( xmlDoc.toString() )
*/







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
    var result = str.match(/@(require|public|private|protected|internal)\s+([^\r\n\;]*)/ig );
    var desc={"requirements":[],'describe':{"static":{},"proto":{}}};
    for( var i in result )
    {
        var val = utils.trim(result[i]).replace(/\s+/g,' ');
        var index = val.indexOf(' ');
        var prefix = val.substr(1, index-1).toLowerCase();
        val = val.substr(index+1);
        switch ( prefix )
        {
            case 'require' :
                desc.requirements = desc.requirements.concat( val.replace(/\s+/g,'').split(',') );
            break;
            case 'internal' :
            case 'public' :
            case 'private' :
            case 'protected' :
                val = val.split(' ');
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
    utils.unique(desc.requirements);
    return desc;
}

const descriptions={};
const mapname={'window':'Window','document':'Document','console':'Console'};
const vendorContents=[];

/**
 * 获取指定的文件模块
 * @param filepath
 */
function include(contents, name , filepath, fix, libs )
{
    name = mapname[name] || name;
    if( loaded[name] === true )return;
    loaded[name]=true;
    filepath = filepath ? filepath : rootPath + '/modules/' + name + '.js';

    //加载的模块有依赖的第三方库
    if( libs && libs[name] )
    {
        vendorContents.push( utils.getContents( rootPath+'/vendor/'+libs[name]) );
    }

    if( utils.isFileExists(filepath) )
    {
        var str = utils.getContents( filepath );
        var desc = describe( str, name);
        if( desc.requirements.indexOf('System') < 0 )desc.requirements.unshift('System');
        var map = desc.requirements.map(function (val) {
            if( val === 'System' )return 'System';
            if( val==='Internal' )return 'Internal';
            if( val.substr(0,9) === 'Internal.')return val;
            if(val.charAt(0)!=='$')include(contents,val, null, fix,libs);
            return 'System.'+val;
        });

        var module=[];
        module.push('(function('+desc.requirements.map(function(a){return a.substr(a.lastIndexOf('.')+1);}).join(',')+'){\n');
        module.push( str );
        module.push('\n');
        //加载对应模块的兼容策略文件
        if( fix && fix[name] )for( var f in fix[name] )
        {
            module.push( utils.getContents( fix[name][f] ) );
        }
        module.push('\n}('+map.join(',')+'));\n');
        str = module.join('');

        if( !isEmpty( desc.describe.static ) ){
            if( !descriptions[name] )descriptions[name]={};
            if(!descriptions[name].static)descriptions[name].static={};
            utils.merge( descriptions[name].static, desc.describe.static);
        }
        if( !isEmpty( desc.describe.proto ) )
        {
            if( !descriptions[name] )descriptions[name]={};
            if(!descriptions[name].proto)descriptions[name].proto={};
            utils.merge( descriptions[name].proto, desc.describe.proto);
        }

        contents.push( str );
        return true;

    }else if( globals.indexOf(name) >=0 )
    {
        contents.push('System.' + name + '=$' + name + ';\n');
        return true;
    }
    throw new Error(name+' does exists ('+filepath+')');
}

/**
 * 解析内部属性
 * @param str
 * @param descriptions
 */
function parseInternal( str , descriptions )
{
    for( var m  in descriptions )
    {
        var desc = descriptions[m];
        str = parse(str, desc.static, m );
        str = parse(str, desc.proto, m+'.prototype' );
    }
    return str;
}

function parse( str, desc , prefix )
{
    if(desc)for( var p in desc )
    {
        if( desc[p].qualifier === 'internal' )
        {
            str = str.replace(new RegExp('([^$])\\b'+prefix + '\\.' + p+'\\b', 'g'), function (a,b,c)
            {
                return b+'Internal["' + prefix + '.' + p + '"]';
            });
        }
    }
    str = str.replace('System.Internal[','Internal[');
    return str;
}

/**
 * 是否为空对象
 * @param obj
 * @returns {boolean}
 */
function isEmpty( obj ) {
    for(var i in obj )return false;
    return true;
}

/**
 * 在特定的版本下需要加载的库文件
 */
const library={
    'ie-9':{'Element':'Sizzle.js'}
};

/**
 * 合并代码
 * @param config
 * @returns {string}
 */
function builder(config , code, requirements )
{
    var fix = polyfill( config );

    /**
     * 需要支持的第三方库文件
     */
    var libs={};
    for(var prop in library)
    {
        var is=config.compat==='*' || prop==='*';
        var info = prop.split('-', 1);
        if( !is && config.compat && typeof config.compat === 'object' && config.compat.hasOwnProperty( info[0] ) )
        {
            is = parseFloat( info[1] ) > parseFloat( config.compat[ info[0] ] );
        }
        if(is)utils.merge(libs, library[prop] );
    }

    /**
     * 引用全局对象模块
     */
    var requires = ['System','Class','Interface','Iterator'].concat( globals.slice(0) );
    if( requirements )
    {
        for ( var p in requirements )
        {
            if( requirements[p]===true && requires.indexOf( p ) < 0 )requires.push( p );
        }
    }
    for(var prop in requires)include(contents, requires[prop] , null, fix , libs);

    //模块定义器
    include(contents, 'define' , rootPath+'/define.js', fix , libs);

     //模块描述
    //contents.unshift('var descriptions = '+JSON.stringify(descriptions)+';\n');

    //解析内部访问权限
    contents=parseInternal( contents.join(''), descriptions );

    //合并依赖库
    contents=vendorContents.join(';\n')+contents;

    /**
     * 内置系统对象
     */
    var g = globals.map(function(val) {
         if( val==='JSON' || val==='Reflect' || val==='console' || val==='Symbol')return 'typeof '+val+'==="undefined"?null:'+val;
         return val;
    });

    return [
        '(function(System,Internal,undefined){',
        '"use strict";',
        //系统全局模块域
        '(function(System,$'+globals.join(',$')+'){',
         contents,
        '}(System,' + g.join(',') + '));',
        //自定义模块域
        '(function('+requires.join(',')+'){',
        code,
        'var main=System.getDefinitionByName("'+config.main+'");',
        'System.Reflect.construct(main);',
        '})('+requires.map(function (a){
            a = mapname[a] || a;
            if(a==='System')return a;
            return 'System.'+a;
        }).join(',')+');',
        '}({},{}));'
    ].join('\n');
}
module.exports = builder;