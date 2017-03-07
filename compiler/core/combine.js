const utils = require('./utils.js');
const globals=['Object','Function','Array','String','Number','Boolean','Math','Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','JSON','Reflect'];
const contents=['var System','=','(function($',globals.join(',$'),'){\n'];
const rootPath =  utils.getResolvePath( __dirname+'/../');
contents.push('"use strict";\n');

/**
 * 全局系统对象
 * @type {{}}
 */
contents.push('var System={};\n');

/**
 * 本地模块对象
 * @type {{}}
 */
contents.push('var modules={};\n');

function combine( config )
{
    /**
     * 全局对象
     */
    contents.push( utils.getContents(rootPath + '/core/globals.js') );

    /**
     * 根据指定的版本加载对应的策略文件
     * @type {Array}
     */
    var files = utils.getDirectoryFiles( rootPath+'/fix/' );
    var fix_items={};
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
            contents.push(utils.getContents(rootPath + '/modules/' + name + '.js'));
            contents.push('\n');
            //加载对应模块的兼容策略文件
            if( fix_items[name] )
            {
                for( var f in fix_items[name] )
                {
                    contents.push( utils.getContents(fix_items[name][f]) );
                }
            }
            contents.push('System.' + name + '=' + name + ';\n');
        } catch (e) {
            contents.push('System.' + name + '=$' + name + ';\n');
        }
    }

    /**
     * 内置模块
     * @type {string[]}
     */
    var coreModule=['Class','Interface','Event','EventDispatcher'];
    for( var p in coreModule )
    {
        var name = coreModule[p];
        contents.push( utils.getContents(rootPath + '/modules/'+name+'.js') );
        //加载对应模块的兼容策略文件
        if( fix_items[name] )
        {
            for( var f in fix_items[name] )
            {
                contents.push( utils.getContents(fix_items[name][f]) );
            }
        }
        contents.push('System.'+name+'='+name+';\n');
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
            contents.push( utils.getContents(rootPath + '/plus/Sizzle.js') );
        }
        var files = utils.getDirectoryFiles( rootPath+'/modules/client/' );
        for( var p in files )
        {
            var path = rootPath + '/modules/client/'+files[p];
            var name = utils.getFilenameByPath( path )
            contents.push( utils.getContents(path) );
            contents.push('System.'+name+'='+name+';\n');
        }
        contents.push('System.window = window;\n');
        contents.push('System.document = document;\n');
        contents.push('\n}\n');
    }

    /**
     * 模块注册器
     */
    contents.push( utils.getContents(rootPath + '/core/define.js') );

    /**
     * 返回系统对象
     */
    var g = globals.map(function(val) {
         if( val==='JSON' || val==='Reflect' )
         {
             return 'typeof '+val+'==="undefined"?null:'+val;
         }
         return val;
    })

    contents.push('return System;\n');
    contents.push('}(' + g.join(',') + '));\n');
    return contents.join('');
}
module.exports = combine;


