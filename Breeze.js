#!/usr/bin/env node
const fs = require('fs');
const QS = require('querystring');
const PATH = require('path');
const Utils = require('./lib/utils.js');
//全局配置
const config = {
    'suffix': '.as',            //需要编译文件的后缀
    'debug': 'on',              //是否需要开启调式
    'blockScope': 'enable',     //是否启用块级域
    'reserved': ['let', 'of','System',"Context"],   //需要保护的关键字
    'minify': 'off',            //是否需要压缩
    'compat_version': '*',      //要兼容的平台 {'ie':8,'chrome':32.5}
    'build_path':'../working',
    'project_path':'./',
    'skin_file_suffix':'.html',
    'project_file_suffix':'.as',
    'browser':'enable',
    'context':{
        "public":"_public",
        "protected":"_protected",
        "private":"_private",
        "internal":"_internal",
        "defineModuleMethod":"Internal.define",
        "package":"Context",
    },
    'scene':'product',                //编译模试 product 生产， dev 开发
};

for (var c in config.context )
{
    config.reserved.push( config.context[c] );
}

// 合并传入的参数
var arguments = process.argv.slice(0).splice(1);
var root_path = PATH.dirname( arguments.shift() );

//解析参数
for(var b in arguments )Utils.merge(config, QS.parse( arguments[b] ) );

//工作的目录
var project_path = PATH.resolve( config.project_path );
if( !fs.existsSync(project_path) )
{
    fs.mkdirSync( project_path );
}

//默认配置文件
var makefile = PATH.resolve(project_path,'configure.js');

//生成一个默认的配置文件
if( !Utils.isFileExists( makefile ) )
{
    fs.linkSync( PATH.resolve(root_path,'Configure.js') , makefile );
}

//合并默认配置文件
Utils.merge(config, require( makefile ) );

//程序的路径
config.root_path = root_path;

//当前工程项目路径
config.project_path = project_path;
config.project.path = project_path;
config.project.name = PATH.basename( project_path );

//构建项目路径
config.build_path = PATH.resolve( config.build_path );
config.build.path = config.build_path;
config.build.name = PATH.basename( config.build_path );
if( !fs.existsSync(config.build_path) )
{
    fs.mkdirSync( config.build_path );
}

/**
 * 构建工程结构
 * @param dir
 * @param base
 */
function buildProject(dir , base)
{
    var dirpath = PATH.isAbsolute(dir.path) ? dir.path : PATH.resolve(base,dir.path,dir.name);
    if( !fs.existsSync(dirpath) )
    {
        fs.mkdirSync( dirpath );
        if( typeof dir.bootstrap === "string" && dir.syntax )
        {
            //引用一个模板
            var file = PATH.resolve(config.root_path,dir.syntax, dir.bootstrap+dir.suffix );
            if( Utils.isFileExists( file ) )
            {
                fs.linkSync( file,PATH.resolve(dirpath,dir.bootstrap+dir.suffix) );
            }
        }
    }

    dir.path = dirpath;
    dir.name = PATH.basename( dirpath );

    if( dir.child )
    {
        for( var i in dir.child )
        {
            buildProject( dir.child[i] , dirpath );
        }
    }
}

//构建输出目录
buildProject( config.build,config.build_path );

//构建工程目录
buildProject( config.project, config.project_path );

config.project_skin_path = config.project.child.client.child.skin.path.replace(/\\/g,'/');

//开始
require('./Makefile.js')(config);