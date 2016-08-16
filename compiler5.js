/**
 * 去掉两边的空白
 * @param str
 * @returns {string|void|XML}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
}

function newcontext()
{
    return {
        'param':[],
        'closer':null,
        'name': '',
        'content': [],
        'parent': null,
        'defvar':[],
        'balance':[],
    };
}

var current=newcontext();
var rootcontext = current;
var newline =new RegExp('(\\/\\*|\\(|\\{|\\[|\\]|\\}|\\)|\\*\\/|\\/\\/|\\?|\\n|\\;|\\:|\\,|\\"|\\\'|\\!?\\+?\\=+|\\+|\\|+|\\&+|\\<+\\=?|\\>+\\=?|\\!+|$)','g');
var last_delimiter;
var end_delimiter={
    '(':')',
    '{':'}',
    '[':']',
    '"':'"',
    "'":"'",
}


/**
 * 返回新的上下文
 * @param tag
 * @returns {}
 */
function context( delimiter , str )
{
    //生成一个新的上下文
    if( /^function(\s+\w+)?$/.exec( str ) )
    {
        var obj = newcontext();
        obj.name=RegExp.$1;
        obj.parent=current;
        obj.parent.content.push( obj );
        str='';
        current = obj;
    }

    //平衡器
    var increase=null;
    if( delimiter ==='"' || delimiter==="'")
    {
        increase = last_delimiter===delimiter ? false : true;
    }
    if ( increase===true || /\(|\{|\[/.test(delimiter)  )
    {
        current.balance.push( end_delimiter[delimiter] );

    } else if ( increase===false || /\)|\}|\]/.test(delimiter))
    {
        var last = current.balance.pop();
        if(  last !== delimiter )
        {
            console.log( last, delimiter )
            throw new Error('Not the end of the syntax')
        }
    }

    //最近一次的定界符
    last_delimiter = delimiter;
    return str;
}

var lastSyntax={};
var lastTag;
function checkSyntax( context, val , tag )
{
    if( !val )return true;
    if( /^var/.test( val ) || ( (tag===',' || tag==='=' || tag===';' || tag==='\n') && lastSyntax.name==='var' )  )
    {
        if( lastSyntax.name !=='var' )
        {
            lastSyntax={name:'var',end:false, content:{} };
        }
        val = val.replace(/^var\s*/,'');
        if( val )
        {
            if (/\W/.test(val)) {
                throw new Error('invalid variable')
            }
            if( lastTag !== '=')
            {
                lastSyntax.content[val] = null;
                lastSyntax.lastname = val;

            }else if( lastTag === '=' )
            {
                lastSyntax.content[ lastSyntax.lastname ] = val;
            }
            context.defvar.push(val);
        }
    }
    lastTag=tag;
}


var content = " function doRecursion( propName,strainer, deep )\n\
{\n\
    var currentItem={lll:78,\
    'uuu':'kkkk'\
    }\n\
    ,bbb\
    ,ret=[]\n\
    var \n\
    s = typeof strainer === \"string\" ? function(){return Breeze.querySelector(strainer, null , null, [this]).length > 0 } :\n\
        (typeof strainer === \"undefined\" + \"sdfsdf\" ? function(){return this.nodeType===1} : strainer);\n\
\n\
    this.forEach(function(elem)\n\
    {\n\
        if( elem && elem.nodeType )\n\
        {\n\
            currentItem=elem;\n\
            do{\n\
                currentItem = currentItem[propName];\n\
                if( currentItem && s.call(currentItem) )ret = ret.concat( currentItem );\n\
            } while (deep && currentItem)\n\
        }\n\
    })\n\
    return ret;\n\
}";

content = " function doRecursion( propName,strainer, deep ){\n\
    var ccc=function(){\
        var cccc='ooooo'\
    }\n\
    this.ccc.bb(ccc==='9999'){\
       this.cccc=9999\
    }\
 }";



//content = "var s={ccc:'yyyy','bb':'iiii'+'ccccc'}";
//content = content.replace(/\=\=\=/g,'__#501#__').replace(/\=\=/g,'__#500#__');

var global_error=false;
var ret;
var pos = 0;
var len = content.length;

while ( (ret = newline.exec(content)) && !global_error && pos < len )
{
    var tag = ret[0];
    var val = trim( content.substr(pos, ret.index - pos) );
    pos += ret.index - pos + tag.length;
    val = context(tag, val);

    //上下文参数
    if( !current.closer )
    {
        if(val)current.param.push( val );
        if( current.balance.length===0 )
        {
            current.closer=true;
        }
    }
    //正文
    else if( current.closer )
    {
        checkSyntax(current, val, tag);
        if( val )current.content.push( val );
        current.content.push( tag );
    }

    //当前上下文结束，并切换到父上下文
    if( tag==='}' && current.closer && current.balance.length===0 )
    {
        current = current.parent;
    }
}



function toString( rootcontext )
{
    var str=[];
    //str.push( rootcontext.keyword );
   // str.push( rootcontext.name );
   // str.push( rootcontext.delimiter );


    // console.log(  rootcontext  );

    for ( var i in rootcontext.children )
    {
        if( typeof rootcontext.children[i] === "object" )
        {
            str.push( toString( rootcontext.children[i] ) );

        }else
        {
            str.push( rootcontext.children[i] )
        }
    }
    return str.join('');
}


console.log( rootcontext.content )


