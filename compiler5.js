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
        'start':false,
        'end':false,
        'balance':[],
    };
}

var current=newcontext();
var rootcontext = current;
var newline =new RegExp('(\\/\\*|\\(|\\{|\\[|\\]|\\}|\\)|\\*\\/|\\/\\/|\\?|\\n|\\;|\\:|\\,|\\"|\\\'|\\!?\\+?\\=+|\\+|\\|+|\\&+|\\<+\\=?|\\>+\\=?|\\!+|$)','g');
var last_delimiter;
var map_delimiter={
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
        current.balance.push( map_delimiter[delimiter] );

    } else if ( increase===false || /\)|\}|\]/.test(delimiter))
    {
        var last = current.balance.pop();
        if(  last !== delimiter )
        {
            console.log( last, delimiter )
            throw new Error('Not the end of the syntax')
        }
        current.end = current.closer && current.balance.length===0;
    }

    //上下文参数
    if( !current.closer )
    {
        if(str)current.param.push( str );
        if( current.balance.length===0 )
        {
            current.closer=true;
        }
    }

    //最近一次的定界符
    last_delimiter = delimiter;
    return str;
}



/**
 * 根据对象定界符返回新的对象
 * @param tag
 * @returns {}
 */
function create_object( context, tag , last_object )
{
    if( /\{|\[/.test(tag) )
    {
        var parent = is_object( last_object ) ? last_object : null;
        last_object={type:tag==='{' ? 'object' : 'array',content:[], closer:false , parent: parent && !parent.closer ? parent : null }
        var obj = (last_object.parent || context)
        obj.content.push( last_object );

    }else if( /\}|\]/.test(tag) )
    {
        if( typeof last_object !== "object" || last_object.closer )
        {
            throw new Error('invalid context');
        }
        last_object.closer=true;
    }
    return last_object;
}

function is_object( last_object )
{
    return last_object && (last_object.type==='object' || last_object.type==='array');
}


var last_object;
var last_keyword;
var test_contents=[];

/**
 * 添加内容并验证语法
 * @param context
 * @param val
 * @param tag
 */
function appendAndCheckSyntax(context, val , tag )
{
    var body= context;

    //根据当前的定界符创建对象
    last_object = create_object(context, tag, last_object );
    if( last_object )body = last_object;

    //当前语法的关键词
    var keyword= val && /^(var|if|else\s+if|do|while|switch|try|catch)(\s+|$)/.exec( val ) ? RegExp.$1 : last_keyword;
    if(val )test_contents.push( val );

    if( body.type ==='array' )
    {
        if( tag===',' || tag===']' )
        {
            var str = test_contents.join('').replace(/\n+/,'');

            if( !/^([\'\"])?([^\1]*)\1$/.exec( str ) )
            {
                throw new Error('invalid value');
            }

            if( !RegExp.$1 && !/^\d+$/.test(RegExp.$2) && ( /\W/.test(RegExp.$2) || context.defvar.indexOf( RegExp.$2 )<0 ) )
            {
                throw new Error('undefined value');
            }
            test_contents=[];
        }

    }else if( body.type ==='object' )
    {
        if( tag===',' || tag==='}' )
        {
            var str = test_contents.join('').replace(/\n+/,'');
            if( !/^\w\:([\'\"])?([^\1]*)\1$/.exec( str ) )
            {
                throw new Error('syntax error for object key')
            }
            if( !RegExp.$1 && !/^\d+$/.test(RegExp.$2) && ( /\W/.test(RegExp.$2) || context.defvar.indexOf( RegExp.$2 )<0 ) )
            {
                throw new Error('undefined value');
            }
            test_contents=[];
        }

    }else if (keyword === 'var')
    {
        val = val.replace(/^var\s*/, '');
        if (/\W/.test(val) || val === 'var' || !/^[\n\;\,\=\'\"]$/.test(tag) ) {
            console.log(tag, context.content, context.content.length - 1)
            throw new Error('invalid variable')
        }

        test_contents=[];
    }

    //if( tag !=='[' )test_contents.push( tag );

    //写入内容与定界符
    if(val){
        body.content.push( val );
    }
    body.content.push( tag );

    //记录关键词
    last_keyword = keyword;

    //如果当前对象关闭则返回上一级对象
    if( last_object && last_object.closer )
    {
        last_object=last_object.parent;
    }
}




var content = " function doRecursion( propName,strainer, deep )\n\
{\n\
    var currentItem={lll:78,\
    'uuu':'kkkk'\
    }\n\
    ,bbb,\
    ret=[]\n\
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
   var kkk=[12,tttt]\
   , rrrr=123\n\
   ,yyy,\n\
   qqqq='7777'\n\
   var uu,ccc\n\
   uuu=777;\
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

    if( current.start && !current.end )
    {
        //是否需要标记当前的定界符, 通常为'\n'或';'
        appendAndCheckSyntax(current, val, tag);
       // if(val) current.content.push( val );
       // current.content.push( tag );
    }

    //开始写入正文
    if( !current.start && tag==='{' )
    {
        current.start=true;
    }

    //结束写入正文，并切换到父上下文
    if( tag==='}' && current.closer && current.end )
    {
        current = current.parent || rootcontext;
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


console.log( rootcontext.content[0] )


