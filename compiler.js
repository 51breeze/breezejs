
const fs = require('fs');

var content = fs.readFileSync('./test.as','utf-8');
var code = content.split(/[\r]*\n/);

var module={
    'package':'',
    'class':'',
    'import':[],
    'extends':[],
    'code':{
        'public':{'var':[],'function':[]},
        'protected':{'var':[],'function':[]},
        'private':{'var':[],'function':[]}
    },
    'balancer':[0,0]
};


function qualifier(module, val )
{
    val =  val ? val.replace(/\s+/,'') : '';
    if( val==='')return 'public';
    if ( typeof module.code[ val ] === "undefined" )
        throw new Error('qualifier invalid for '+c);
    return val;
}

var tag_open=[];
var tag_close=[];
function check( code ,line )
{

}

//平衡对称器
function balancer( index , code )
{
    //平衡左对称符
    var v=[];
    if( /\(/.test( code ) )
    {
        module.balancer[ index ]++;
        v.push('(');
    }
    if( /\{/.test( code ) )
    {
        module.balancer[ index ]++;
        v.push('{');
    }

    //平衡右对称符
    if( /\)/.test( code ) )
    {
        module.balancer[ index ]--;
        v.push(')');
    }
    if( /\}/.test( code ) )
    {
        module.balancer[ index ]--;
        v.push('}');
    }
    return v;
}

var current=null;
var parambreak=false;

function context(module, code )
{
    var ret = code.match(/^\s*(\w+\s+)?function(\s+set|get)?\s+(\w+)(\s*(\()(.*?)(\))?)?/i);
    if (ret)
    {
        if( module.balancer[1] > 0 )
        {
            throw new Error('not end syntax '+ code)
        }
        var c = qualifier(module, ret[1]);
        var param = [];

        //是否有匹配到括号中的参数
        if( ret[6] )
        {
            ret[6] = ret[6].replace(/(^\s+|\s+$)/,'');
            if( ret[6] !== '')
            {
                if( /(\w+\s+\w+|\W+)/.test( ret[6] ) )
                {
                    throw new Error('function param invalid')
                }
                param = ret[6].split(',')
            }
        }
        parambreak=!ret[6];
        current={'content':[],'param':param,'name':ret[3],'access':ret[2] ? ret[2] : ''};
        module.code[c].function.push( current );
    }

    //如果没有上下文
    if( !current )
    {
        throw new Error('syntax error');
    }

    //获取对称符
    var b = balancer( 1 , code );

    //换行的参数
    if( parambreak )
    {
        if( !ret )
        {
            var p = code.match(/^(\s*\()?([^\(\)]*)/);
            if( p )
            {
                if( /(\w+\s+\w+|\W+)/.test( p[1] ) )
                {
                    throw new Error('function param invalid')
                }
                current.param.push(p[1]);
            }
        }
        if( b.indexOf(')') >=0 )
        {
            parambreak=false;
        }
    }

    //代码
    if( !ret )
    {
        current.content.push( code );

    }else if( b.indexOf('{') >=0  )
    {
        current.content.push( '{' );
    }

    //关闭当前上下文
    if( b.indexOf('}') >=0 && module.balancer[1] === 0 )
    {
        current=null;
    }
}


var syntax= {

    'package': function (module, code) {
        var ret = code.match(/\s*(package)(\s+[\w\.]*)/i);
        if (!ret)throw new Error('package error');
        module['package'] = ret[2];
    },
    'import': function (module, code) {
        var ret = code.match(/\s*(import)\s+([\w\.]*)/i);
        if (!ret)throw new Error('import error');
        module['import'].push(ret[2]);
    },
    'class': function (module, code) {
        var ret = code.match(/[\w\s]*(class)\s+(\w+)(\s+extends\s+([\w\,]*))?/i);
        if (!ret)throw new Error('class error');
        module['class'] = ret[2];
        if (ret[4]) {
            module['extends'].push(ret[4].split(','));
        }
    },
    'var': function(module, code){

        var ret = code.match(/^\s*(\w+\s+)?var\s+(\w+)\s*\=\s*([\'\"])?([^\3]*)\3/i);
        if (!ret)throw new Error('var error');
        var c = qualifier(module, ret[1]);
        var v =  ret[4] ? ret[4] : undefined;
        if( !ret[3] && isNaN( parseInt( v ) ) )
        {
            throw new Error('var error '+code);
        }
        module.code[c].var.push( {'name':ret[2],'value': v} )
    }
}


var num = code.length;
var i=0;
var skip=false;
while(i<num)
{
    var item = code[i];
    i++;
    if( item !== '' )
    {
        //注释的内容不解析
        if( !skip && /^\s*\/\*/.test(item) )
        {
            skip=true;
            continue;

        }else if( skip && /\*\/\s*$/.test(item) )
        {
            skip=false;
            continue;
        }

        if( /^\s*\/\//.test(item) )
        {
            continue;
        }

        if( !skip )
        {
            //替换转义的引号
            var str = item.replace( new RegExp("\\\\([\'\"])",'g'),function(a,b){
                return b==='"' ? "__#034#__" : "__#039#__";
            });

            //引号中的对称符号不检查
            str = str.replace( new RegExp("([\'\"])[^\\1]*\\1",'g'), function(a){
                return a.replace(/\;/g,'__#059#__').replace(/[\(\)\{\}]/,function(a){
                    return a==='(' ? '__#040#__' : a===')' ? '__#041#__' :  a==='{' ? '__#123#__' : '__#125#__';
                })
            });

            //分割成多行
            str = str.split(/\;/);

            //解析和检查每行的代码
            for (var b in str ) if( str[b]!=='' )
            {
                try{
                    parse( str[b].replace(/(^\s+|\s+$)/,''), item, i );
                }catch( ee )
                {
                   console.log( ee.message , ' in line '+i );
                }
            }
        }
    }
}


function parse( code , input, line )
{
    var tag = code.match(/^\s*[\w\.\s]*(package|import|class|var)/i);
    if( tag && tag[1] )
    {
         tag = tag[1].toLowerCase();
         if( typeof syntax[tag] === "function" )
         {
            syntax[tag](module, code );
            balancer( 0 , code );
         }

    }else if( code === '}' && module.balancer[1]===0 )
    {
        balancer( 0 , code );
    }else
    {
        context(module, code );
    }
}


for( var c in module.code )
{


        for(var b in module.code[c].function )
        {
            console.log('=====function====')
            var val = module.code[c].function[ b ];
            console.log( val.content.join(';') ,'=====' , val.access );
        }
}








