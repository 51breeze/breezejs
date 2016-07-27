
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
    }
};


function qualifier(module, val )
{
    val =  val.replace(/\s+/,'');
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
            throw new E('var error '+code);
        }
        module.code[c].var.push( {'name':ret[2],'value': v} )
    },
    'function': '',
    'if': '',
    'else': '',
    'for': '',
    'foreach': '',
    'try': '',
    'catch': '',
    'switch': '',
    'while': '',
    'do': ''
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
                    parse( str[b], item, i );
                }catch( ee )
                {
                 //  console.log( ee )
                }
            }
        }
    }
}


function parse( code , input, line )
{
    var tag = code.match(/^\s*[\w\.\s\{\}\(\)]*(package|import|class|function|var|if|else|for|foreach|try|catch|switch|while|do)/i);
    if( tag && tag[1] )
    {
         tag = tag[1].toLowerCase();
         if( typeof syntax[tag] === "function" )
         {
            syntax[tag](module, code );
         }
    }
}


console.log( module );






