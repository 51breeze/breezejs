
const fs = require('fs');

function qualifier(module, val )
{
    val =  trim( val );
    if( val==='')return 'public';
    if ( typeof module.fn[ val ] === "undefined" )
        throw new Error('[qualifier invalid] '+val);
    return val;
}


//平衡对称器
function balancer( module , code )
{
    //平衡左对称符
    var v=[];
    if( /\(/.test( code ) )
    {
        module.balancer++;
        v.push('(');
    }
    if( /\{/.test( code ) )
    {
        module.balancer++;
        v.push('{');
    }

    //平衡右对称符
    if( /\)/.test( code ) )
    {
        module.balancer--;
        v.push(')');
    }
    if( /\}/.test( code ) )
    {
        module.balancer--;
        v.push('}');
    }
    return v;
}

/**
 * 去掉两边的空白
 * @param str
 * @returns {string|void|XML}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/(^[\s\t]+|[\s\t]+$)/,'') : '';
}

/**
 * 检查参数是否合法
 * @param param
 */
function checkParam( param )
{
    if( param && /(\w+\s+\w+|\W+)/.test( trim(param) ) )
    {
        throw new Error('param invalid')
    }
}


/**
 * 解析代码
 * @param module
 * @param code
 */
function parse( module, code )
{
    //模块配置
    var tag = code.match(/^\s*[\w\s]*(package|import|class|var)/i);

    //获取对称符
    var b = balancer( module, code );

    if( tag )
    {
        switch( tag[1].toLowerCase() )
        {
            case 'package':
                var ret = code.match(/\s*(package)(\s+[\w\.]*)/i);
                if (!ret)throw new Error('package error');
                module['package'] = ret[2];
                break;
            case 'import':
                var ret = code.match(/\s*(import)\s+([\w\.]*)/i);
                if (!ret)throw new Error('import error');
                module['import'].push(ret[2]);
                break;
            case 'class':
                var ret = code.match(/[\w\s]*(class)\s+(\w+)(\s+extends\s+([\w\,]*))?/i);
                if (!ret)throw new Error('class error');
                module['class'] = ret[2];
                if (ret[4]) {
                    module['extends'].push(ret[4].split(','));
                }
                break;
            case 'var':
                var ret = code.match(/^\s*(\w+\s+)?var\s+(\w+)\s*\=\s*([\'\"])?([^\3]*)\3/i);
                if (!ret)throw new Error('var error');
                var c = qualifier(module, ret[1]);
                var v =  ret[4] ? ret[4] : undefined;
                if( !ret[3] && isNaN( parseInt( v ) ) )
                {
                    throw new Error('var error '+code);
                }
                module.var[c].push( {'name':ret[2],'value': v} )
                break;
        }

    }else
    {
        var ret = code.match(/^\s*(\w+\s+)?function\s+(set\s+|get\s+)?(\w+)(\s*(\()([^\)]*)(\))?)?/i);

        if (ret)
        {
            var c = qualifier(module, ret[1] );
            var param = [];

            //是否有匹配到括号中的参数
            if( ret[6] )
            {
                ret[6] = trim( ret[6] );
                if( ret[6] !== '')
                {
                    checkParam( ret[6] );
                    param = ret[6].split(',');
                }
            }

            module.current={'content':[],'param':param,'name':ret[3],'access':ret[2] ? ret[2] : '', 'parambreak':!ret[7] };
            module.fn[c].push( module.current );

        }else if( module.current )
        {
            //换行的参数
            if( module.current.parambreak )
            {
                var p = code.match(/^(\s*\()?([^\(\)]*)/);
                if( p )
                {
                    checkParam( p[1] );
                    module.current.param.push( p[1] );
                }

                //关闭换行的参数
                if( b.indexOf(')') >=0 )
                {
                    module.current.parambreak=false;
                }

            }else
            {
                module.current.content.push( code );
            }

            //关闭当前上下文
            if( module.balancer === 2 && b.indexOf('}') >=0 )
            {
                module.current=null;
            }

        }else if( module.balancer > 2  )
        {
            throw new Error('[syntax error] '+ code)
        }
    }
}

function create( module )
{
    var code = [];
    code.push('+(function( packages ){');
    code.push('var module={');


    var classname = trim(module.class);
    var constructor='function(){}';

    for( var c in module.fn )
    {
        var item = module.fn[c];
        for(var b in item )
        {
            var val = item[b];
            val.name = trim( val.name );
            item[b] = val.content.join(";\n");

            item[b] = item[b].replace('__#034#__','\"');
            item[b] = item[b].replace('__#039#__','\'');
            item[b] = item[b].replace(new RegExp('__#059#__','g'),';');
            item[b] = item[b].replace('__#040#__','(');
            item[b] = item[b].replace('__#041#__',')');
            item[b] = item[b].replace('__#123#__','{');
            item[b] = item[b].replace('__#125#__','}');

            item[b] = 'function'+item[b].replace(/(\)\})\;/,'$1');
            if( val.name === classname && val.access ==='' && c==='public')
            {
                constructor = item[b];
                delete item[b];
            }
        }
    }

    var p = [];
    p.push("'constructor':"+constructor );


    console.log( module.fn.public.join('\n') )

}



/**
 * 执行编译
 */
function make( file , fs )
{
    var content = fs.readFileSync( file , 'utf-8');
    var code = content.split(/[\r]*\n/);
    var num = code.length;
    var i = 0;
    var skip = false;

    //模块文件的配置
    var module={
        'package':'',
        'class':'',
        'import':[],
        'extends':[],
        'fn':{public:[],protected:[],private:[]},
        'var':{public:[],protected:[],private:[]},
        'balancer':0
    };

    //逐行
    while (i < num)
    {
        var item = code[i];
        i++;
        if (item !== '')
        {
            //注释的内容不解析
            if (!skip && /^\s*\/\*/.test(item)) {
                skip = true;
                continue;
            } else if (skip && /\*\/\s*$/.test(item)) {
                skip = false;
                continue;
            }
            if (/^\s*\/\//.test(item)) {
                continue;
            }

            //如果是正文进入解析
            if (!skip)
            {
                //替换转义的引号
                var str = item.replace(new RegExp("\\\\([\'\"])", 'g'), function (a, b) {
                    return b === '"' ? "__#034#__" : "__#039#__";
                });

                //引号中的对称符号不检查
                str = str.replace(new RegExp("([\'\"])[^\\1]*\\1", 'g'), function (a) {
                    return a.replace(/\;/g, '__#059#__').replace(/[\(\)\{\}]/, function (a) {
                        return a === '(' ? '__#040#__' : a === ')' ? '__#041#__' : a === '{' ? '__#123#__' : '__#125#__';
                    })
                });

                str = str.replace(/\{/g,"\n{").replace(/\}/g,"\n}").replace(/\;/g,"\n");

                str = trim( str );

                //分割成多行
                str = str.split(/\n/);

                //解析和检查每行的代码
                for (var b in str) if (str[b] !== '')
                {
                    try {
                        parse(module, trim(str[b]) );
                    } catch (e) {
                        console.log(e.message, ' in line ' + i);
                    }
                }
            }
        }
    }

   return create( module );
}




make( './test.as' , fs );











