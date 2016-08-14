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
var newline =new RegExp('(\\/\\*|\\(|\\{|\\[|\\]|\\}|\\)|\\*\\/|\\/\\/|\\?|\\n|\\;|\\:|\\,|\\"|\\\'|\=+|\\.|\\+|\\|{1,2}|\\&{1,2})','g');
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
}

function getparent()
{
    return !current.closer ? current : current.parent || rootcontext;
}

function getlastchlid( obj )
{
    return  obj.children.length>0 ? obj.children[ obj.children.length-1 ] : null;
}



/**
 * 返回新的上下文
 * @param tag
 * @returns {}
 */
function context( tag , str )
{
    if( typeof delimiter[ tag ] !== "undefined" )
    {
        if( (tag ==='"' || tag==="'") && current.delimiter===tag && !current.closer )
        {
            return str;
        }else if( tag==='+' )
        {
            return str //? str : '+';
        }

        str = trim(str);
        var obj = newcontext();
        obj.delimiter= tag;
        obj.parent=!current.closer ? current : current.parent;

        //声明函数
        if( tag==='(' && /^function(\s+\w+)?$/.exec( str ) )
        {
            obj.keyword = 'function';
            obj.name = RegExp.$1 ? RegExp.$1 : null;
            str='';
        }
        //声明变量
        else if( /^var\s+(\w+)$/.exec( str ) )
        {
            obj.keyword = 'var';
            obj.name = RegExp.$1;
            str='';
        }
        //引用属性
        else if( tag==='[' && /^(\w+)$/.exec( str ) )
        {
           // obj.keyword = 'prop';
           // obj.name = RegExp.$1;
           // str='';
        }
        //引用属性
        else if( tag==='.' && /^(\w+)$/.exec( str ) )
        {
            //obj.keyword = 'prop';
           // obj.name = RegExp.$1;
            //str='';
        }
        //三运算
        else if( tag==='?' )
        {
            //obj.keyword = 'if';
            //obj.name = str;
        }
        obj.parent.children.push( obj );
        current = obj;
    }
    return str;
}

//关闭上下文
function end( tag )
{
    var closer = delimiter[ current.delimiter ] instanceof RegExp ?  delimiter[ current.delimiter ].test( tag ) :  delimiter[ current.delimiter ]===tag;
    if( !closer && !current.closer && ( /(\]|\}|\)|\*\/)/.test( tag ) ) && !/(\[|\{|\(|\/\*)/.test(current.delimiter) )
    {
        closer=true;
        current.closer= true;
        current = current.parent;

    }else if( closer && (tag === "'" || tag === '"') )
    {
        closer=current.children.length>0 && current.delimiter===tag;
    }

    if( closer )
    {
        current.closer= closer;
        current = current.parent;
        return true;
    }
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

//content = "var s={ccc:'yyyy',\nbb:'iiii'}\n";






//content = content.replace(/\=\=\=/g,'__#501#__').replace(/\=\=/g,'__#500#__');

var global_error=false;
var ret;
var pos = 0;
while ( (ret = newline.exec(content)) && !global_error ) {

    var tag = ret[0];
    var val = trim( content.substr(pos, ret.index - pos) );
    pos += ret.index - pos + tag.length;
    val =  context(tag, val);
    if( val ){
        current.children.push( val );
    }
    current.children.push( tag );
    end( ret[0] );
}



function toString( rootcontext )
{
    var str=[];
    str.push( rootcontext.keyword );
    str.push( rootcontext.name );
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

//objectToString( rootcontext.children , 'parent')

