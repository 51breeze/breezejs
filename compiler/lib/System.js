const utils = require('./utils.js');
const globals=['Object','Function','Array','String','Number','Boolean','Math','Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','JSON','Reflect'];
const contents=['var System','=','(function($',globals.join(',$'),'){\n'];

/**
 * 全局系统对象
 * @type {{}}
 */
contents.push('var system={};\n');

/**
 * 本地模块对象
 * @type {{}}
 */
contents.push('var modules={};\n');

function system( config )
{

    contents.push( utils.getContents(__dirname + '/globals.js') );

    /**
     * 构建全局对象模块
     */
    for (var prop in globals)
    {
        var name = globals[prop];
        try {
            contents.push(utils.getContents(__dirname + '/modules/' + name + '.js'));
            contents.push('\n');
            contents.push('system.' + name + '=' + name + ';\n');
        } catch (e) {
            contents.push('system.' + name + '=$' + name + ';\n');
        }
    }

    /**
     * 内置模块
     * @type {string[]}
     */
    var coreModule=['Class','Interface',/*'Event','EventDispatcher'*/];
    for( var p in coreModule )
    {
        contents.push( utils.getContents(__dirname + '/modules/'+coreModule[p]+'.js') );
        contents.push('system.'+coreModule[p]+'='+coreModule[p]+';\n');
    }

    /**
     * 根据指定的版本加载对应的策略文件
     * @type {*|Array}
     */
    var files = utils.getDirectoryFiles( __dirname+'/fix/' );
    for(var i in files )
    {
        var is=true;
        var path = __dirname + '/fix/' + files[i];
        if( config.compat && config.compat !== '*' )
        {
            var version = utils.getFilenameByPath(path);
            version = version.split('-', 1);
            if( config.compat.hasOwnProperty(version[0]) )
            {
                is = parseFloat( version[1] ) >= parseFloat( config.compat[ version[0] ] );
            }

        }
        if(is){
            contents.push( utils.getContents(path) );
        }
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


