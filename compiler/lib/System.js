const utils = require('./utils.js');
const globals=['Object','Function','Array','String','Number','Boolean','Math','Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','JSON','Reflect'];
const contents=['var System','=','(function($',globals.join(',$'),'){\n'];

/**
 * 全局系统对象
 * @type {{}}
 */
contents.push('var system=System={};\n');

/**
 * 本地模块对象
 * @type {{}}
 */
contents.push('var modules={};\n');
function system( config )
{
    /**
     * 全局对象
     */
    contents.push( utils.getContents(__dirname + '/globals.js') );

    /**
     * 根据指定的版本加载对应的策略文件
     * @type {Array}
     */
    var files = utils.getDirectoryFiles( __dirname+'/fix/' );
    var fix_items={};
    for(var i in files )
    {
        var is=true;
        var path = __dirname + '/fix/' + files[i];
        var info = utils.getFilenameByPath(path).split('-', 2);
        if( config.compat && typeof config.compat === 'object' && config.compat.hasOwnProperty( info[1] ) )
        {
           is = parseFloat( info[2] ) >= parseFloat( config.compat[ info[1] ] );
        }
        if(is){
            if( !(fix_items[ info[0] ] instanceof Array) )fix_items[ info[0] ]=[];
            fix_items[ info[0] ].push(path);
        }
    }

    /**
     * 构建全局对象模块
     */
    for (var prop in globals)
    {
        var name = globals[prop];
        try {
            contents.push(utils.getContents(__dirname + '/modules/' + name + '.js'));
            contents.push('\n');
            //加载对应模块的兼容策略文件
            if( fix_items[name] )
            {
                for( var f in fix_items[name] )
                {
                    contents.push( utils.getContents(fix_items[name][f]) );
                }
            }
            contents.push('system.' + name + '=' + name + ';\n');
        } catch (e) {
            contents.push('system.' + name + '=$' + name + ';\n');
        }
    }

    /**
     * 内置模块
     * @type {string[]}
     */
    var coreModule=['Class','Interface','Event','EventDispatcher'];
    for( var p in coreModule )
    {
        contents.push( utils.getContents(__dirname + '/modules/'+coreModule[p]+'.js') );
        contents.push('system.'+coreModule[p]+'='+coreModule[p]+';\n');
    }

    /**
     * 客户端模块
     */
    if( config.browser === 'enable' )
    {
        contents.push('if( typeof window !=="undefined" ){\n');
        //ie 下需要使用的元素选择器
        if( config.compat==='*' || (typeof config.compat === "object" && config.compat.ie < 9 ) )
        {
            contents.push( utils.getContents(__dirname + '/modules/client/Sizzle.js') );
        }
        var files = utils.getDirectoryFiles( __dirname+'/modules/client/events/' );
        for( var p in files )
        {
            var path = __dirname + '/modules/client/events/'+files[p];
            var name = utils.getFilenameByPath( path )
            contents.push( utils.getContents(path) );
            contents.push('system.'+name+'='+name+';\n');
        }
        contents.push( utils.getContents(__dirname + '/modules/client/Element.js') );
        contents.push( utils.getContents(__dirname + '/modules/client/Window.js') );
        contents.push( utils.getContents(__dirname + '/modules/client/Document.js') );
        contents.push('\n}\n');
    }

    /**
     * 模块注册器
     */
    contents.push( utils.getContents(__dirname + '/module.js') );

    /**
     * 返回系统对象
     */
    contents.push('return system;\n');
    contents.push('}(' + globals.join(',') + '));\n');
    return contents.join('');
}
module.exports = system;


