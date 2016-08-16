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
        'delimiter':'',
        'keyword': '',
        'name': null,
        'closer': false,
        'children': [],
        'parent': null,
        'balance':0,
        id:id++
    };
}

var current=newcontext();
var rootcontext = current;
var newline =new RegExp('(\\/\\*|\\(|\\{|\\[|\\]|\\}|\\)|\\*\\/|\\/\\/|\\?|\\n|\\;|\\:|\\,|\\"|\\\'|\\!?\\+?\\=+|\\+|\\|+|\\&+|\\<+\\=?|\\>+\\=?|\\!+|$)','g');
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

    //必须开启一个新的上下文
    if( start_delimiter.test(tag) )
    {
        if( (tag==='"' || tag==="'") && current.keyword==='string' )
        {
            return str;
        }

        var obj = newcontext();
        obj.delimiter= tag;
        obj.parent=!current.closer ? current : current.parent;
        obj.balance++;

        if( obj.parent.closer && obj.parent.parent )
        {
            throw new Error('syntax error end ');
        }

        //console.log('====', obj.parent.delimiter ,'====parent====', tag )
        //return Breeze.querySelector()

       // if( tag==='=') console.log('============',str,'================' )


        //console.log( str  )

        //声明函数
        if( tag==='(' && str )
        {
            if( /^(\w+)(\s+(\w+))?$/.exec( str ) )
            {
                obj.keyword = RegExp.$1;
                obj.name = RegExp.$3 ? RegExp.$3 : null;

            }else if( /^((\w+[\.])+?\w+)$/.exec( str ) )
            {
                obj.keyword = 'function';
                obj.name = RegExp.$1;
            }else
            {
                throw new Error('syntax error 6');
            }
            str='';
        }
        //声明变量
        else if( tag==='=' && /^(var\s+)?(\w+)$/.exec( str ) )
        {
           // console.log('+++++',str,'+++++', current.delimiter , current.keyword, current.name , current.id )
            obj.keyword = 'var';
            obj.name = RegExp.$1;
            str='';

        }else if(  tag==='"' || tag==="'" )
        {
            obj.keyword = 'string';
            obj.name = null;

        }else if( str==='' && tag==='{' )
        {
            obj.keyword = 'object';
            var list = current.children.length>0 ? current.children[ current.children.length-1 ] : null;
            if( list && list.keyword ==='function' )
            {
                obj.keyword = 'function';
            }
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

    if( !current || !current.parent || !close_delimiter.test( tag ) )
    {
       return true;
    }

    if( (tag === "'" || tag === '"') && current.balance<2 )
    {
        current.balance++;
        return true;
    }

    //对象中的换行符跳过， 不结束对象
    //{name:123,\n
    //cccc:456}
    if( tag==='\n' && (current.delimiter==='{' || current.delimiter==='[' ) )
    {
        return true;
    }

    var closer = delimiter[ current.delimiter ] instanceof RegExp ?  delimiter[ current.delimiter ].test( tag ) : delimiter[ current.delimiter ]===tag;

    //如果当前是一个块级结束定界符，并且当前上下文不是一个块级，则结束当前上下文。并且重做一个结束的操作。
    //function(){ var ccc=123 }

    if( !closer && /\}|\)|\]/.test( tag ) && !/\{|\(|\[/.test(current.delimiter) )
    {
        current.closer= closer;
        current = current.parent;
        console.log('-----=====', current.delimiter ,'=====----' , current.parent.children )
        end( tag );
    }

    //console.log('-----=====', tag ,'=====----' )
    if( !closer /*&& tag!==';' && tag!=='\n'*/ )
    {
       // console.log( current , current.keyword,current.name,'++++++');
        console.log('-----=====', tag ,'=====----' , current )
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

    //结尾
    if( force && !current.closer )
    {
        end( ';' );
    }
    return closer;
}


function checkSyntax( val , tag )
{
    if( current.delimiter==='{' )
    {
        if( (tag ===':' && /\W+/.test(val)) || ( (tag===',' || tag==='}') && current.children.length%2!==0 )  )
        {
            console.log( val, tag, current.children.length ,  current.children )
            throw new Error('syntax error 1');
        }

    }else if( current.delimiter==='(' )
    {
        var tmp = val.replace(/^(return|typeof)\s*/,'');
        if( /[^\w\.]+/.test(tmp) || ( tag===')' && !( current.children[current.children.length-1]===',' ||  current.children[current.children.length-1]===':' ) ) )
        {
            console.log( val, tag , current)
            throw new Error('syntax error 2');
        }
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

content = " function doRecursion( propName,strainer, deep ){\n\
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

    console.log( tag ,'=======');

    val =  context(tag, val);

    if( current.parent && current.closer )
    {
        //throw new Error('syntax error end ');
    }

    if( val ){


        current.children.push( val );
    }

    if( !/^(\(|\{|\[|\]|\}|\)|\=)$/.test( tag ) )
    {
        current.children.push(tag);
    }

    //console.log( current );
    //current.children.push( tag );
    end( ret[0] , len===pos );

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

//console.log( toString( rootcontext ) );
//console.log(  rootcontext.children[0].children );
//toString( rootcontext.children[3] )

//console.log( rootcontext.children[1].children[0].children[1].children[0].children )
//console.log( rootcontext.children )
console.log( rootcontext.children[1].children )

//objectToString( rootcontext.children , 'parent')

