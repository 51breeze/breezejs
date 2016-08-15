/**
 * 去掉两边的空白
 * @param str
 * @returns {string|void|XML}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
}

/**
 * 将对象转成字符串形式
 * @param obj
 * @param q
 * @returns {string}
 */
function objectToString( obj , force , exclude )
{
    var str=[];
    var q =  force === false ? '' : '"';
    if( typeof obj === "object" || obj instanceof Array )
    {
        for (var i in obj)
        {
          /*  if (typeof obj[i] === "object" || obj[i] instanceof Array )
            {
                str.push(i+":"+q+ objectToString(obj[i], force ) +q);
            } else {
                str.push(i+":"+q+ obj[i] +q);
            }*/
        }
    }
    return "{"+str.join(',')+"}";
}



var id=0
function newcontext()
{
    return {
        'delimiter':'root',
        'keyword': '',
        'name': '',
        'closer': false,
        'children': [],
        'parent': null,
        id:id++
    };
}

var current=newcontext();
var rootcontext = current;
var newline =new RegExp('(\\/\\*|\\(|\\{|\\[|\\]|\\}|\\)|\\*\\/|\\/\\/|\\?|\\n|\\;|\\:|\\,|\\"|\\\'|\\!?\\+?\\=+|\\.|\\+|\\|+|\\&+|\\<+\\=?|\\>+\\=?|\\!+|$)','g');
var delimiter= {
    '/*':'*/',
    '//':/\n/,
    '(':')',
    '{':'}',
    '[':']',
    '=':/[\;\n]+/,
    '?':/[\;\n]+/,
    '"':'"',
    "'":"'",
    '.':false,
    '+':false,
    ',':false,
    ':':false,
}

var close_delimiter=/^(\]|\}|\)|\*\/|\;|\n|\'|\")$/;
var start_delimiter=/^(\[|\{|\(|\/\*|\'|\"|\=)$/;

/**
 * 返回新的上下文
 * @param tag
 * @returns {}
 */
function context( tag , str )
{
    str = trim(str);

    //必须开启一个新的上下文域
    if( start_delimiter.test(tag) || tag==='=' )
    {
        var obj = newcontext();
        obj.delimiter= tag;
        obj.parent=!current.closer ? current : current.parent;

        //console.log('====', obj.parent.delimiter ,' ====parent====', tag )

        //声明函数
        if( tag==='(' && /^function(\s+\w+)?$/.exec( str ) )
        {
            obj.keyword = 'function';
            obj.name = RegExp.$1 ? RegExp.$1 : null;
            //str='';
        }
        //声明变量
        else if( /^var\s+(\w+)$/.exec( str ) )
        {
            obj.keyword = 'var';
            obj.name = RegExp.$1;
            //str='';

        }else if( str==='' )
        {
            obj.keyword = 'object';
            obj.name = null;
        }
        obj.parent.children.push( obj );
        current = obj;
    }
    return str;
}


//关闭上下文
function end( tag , force )
{

   // tag = tag==='' ? '\;' : tag;

    if( !current || !current.parent || !close_delimiter.test( tag ) )
    {
       return true;
    }

    if( (tag === "'" || tag === '"') && current.children.length<1 )
    {
        return true;
    }

    //对象中的换行符跳过
    if( tag==='\n' && (current.delimiter==='{' || current.delimiter==='[' ) )
    {
        return true;
    }

    var closer = delimiter[ current.delimiter ] instanceof RegExp ?  delimiter[ current.delimiter ].test( tag ) : delimiter[ current.delimiter ]===tag;

    if( !closer && ( tag!==';' && tag!=='\n' ) )
    {
       // console.log( current , current.keyword,current.name,'++++++');
        console.log('-----=====', tag ,'=====----')
        throw new Error('Not the end of the syntax');
    }

   // console.log( force, current.delimiter , current.closer , tag, closer );

    //结束上下文操作
    if( closer )
    {
        //console.log( current.delimiter );
        current.closer= closer;
        current = current.parent;
    }
    return closer;
}


var content = " function doRecursion( propName,strainer, deep )\n\
{\n\
    var currentItem={l ll:78,\
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
/*
content = " function doRecursion( propName,strainer, deep ){\n\
 var s = function(\
 pp,\
 ccc\
 ){\
    if(ccc==='9999'){\
       this.cccc=9999\
    }\
 }\n\
 }";*/

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
    val =  context(tag, val);

    if( current.parent && current.closer )
    {
        throw new Error('syntax error end ');
    }

    if( val ){

        if( current.keyword==='object' )
        {
            if( (tag ===':' && /\W+/.test(val)) || ( (tag===',' || tag==='}') && current.children.length%2!==0 )  )
            {
                throw new Error('syntax error');
            }

        }else if( current.delimiter==='(' )
        {
            if( /\W+/.test(val) || ( tag===')' && current.children[current.children.length-1]===',' )  )
            {
                throw new Error('syntax error');
            }
        }
        current.children.push( val );
    }
    current.children.push( tag );

    //console.log( current );
    //current.children.push( tag );
    end( ret[0], len===pos );
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

console.log( toString( rootcontext ) );
//console.log(  rootcontext.children[0].children );
//toString( rootcontext.children[3] )

//console.log( rootcontext.children[1].children[0].children[1].children[0].children )
//console.log( rootcontext.children )
//console.log( rootcontext.children[0] )

//objectToString( rootcontext.children , 'parent')

