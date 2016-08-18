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
        'name': '',
        'content': [],
        'closer':false,
        'balance':[],
        'parent': null,
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
    if( str && /^function(\s+\w+)?$/.exec( str ) )
    {
        var obj = newcontext();
        obj.name=RegExp.$1;
        obj.parent=current;
        obj.defvar=[];
        obj.balance=[];
        obj.parent.content.push( obj );
        str='';
        current = obj;

    }else if( str && /^(var|if|else\s+if|do|while|switch|case|default|try|catch)(\s+|$)/.exec( str ) )
    {
        if( current.name==='var' && !current.closer )
        {
            current.closer=true;
        }

        var obj = newcontext();
        obj.name=RegExp.$1;
        obj.parent= current;
        obj.balance = obj.parent.balance;
        obj.parent.content.push( obj );

        current = obj;
        str=obj.name==='var' ? str.replace(/^var\s*/,'') : '';
        if( (obj.name ==='case' || obj.name ==='default') &&  obj.parent.name!=='switch')
        {
            throw new SyntaxError('The keyword "'+obj.name+'" must appear in the switch');
        }

    }else if( /[\{\[]/.test(delimiter) )
    {
        var obj = newcontext();
        obj.name= delimiter==='{' ? 'object' : 'array';
        obj.parent= current;
        obj.balance = obj.parent.balance;
        obj.parent.content.push( obj );
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
        last_delimiter = delimiter;

    } else if ( increase===false || /\)|\}|\]/.test(delimiter))
    {
        if( delimiter ==='}' && current.name==='var' && !current.closer )
        {
            current.closer=true;
            current = current.parent || rootcontext;
            return context( delimiter );
        }

        var last = current.balance.pop();
        if( last !== delimiter )
        {
            console.log( last, delimiter, str , current.name )
            throw new Error('Not the end of the delimiter');
        }
        current.closer = current.balance.length===0;
        last_delimiter = delimiter;
    }
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


function checkVariableName( val )
{
    if( val === 'var' || !/^\w+[\d\w]+$/.test(val) )
    {
        throw new Error('invalid variable name for '+val );
    }
}

function checkPropName( val )
{
    if( !/^\w+[\d\w]+$/.test(val) )
    {
        throw new Error('invalid prop name for '+val );
    }
}

function checkRefValue(context, val)
{
    checkPropName(val);
    if( context.defvar.indexOf(val) < 0 && !/^\d+$/.test(val) )
    {
        throw new Error('undefined property name for '+val );
    }
}


function checkDelimiter(allow, tag)
{
    if( !allow.test( tag ) )
    {
        throw new Error('invalid delimiter the "'+ tag+'"' )
    }
}








var last_object;
var last_keyword;
var last_tag;
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
    test_contents.push( tag );

    var _tag = tag;

    if( tag==='&' || tag==='&&' || tag==='|' || tag==='||' || tag==='<' || tag==='<='|| tag==='>' ||
        tag==='>=' || tag==='!=' || tag==='!==' || tag==='===' || tag==='==' || tag==='?' )
    {
        if( val )
        {
            console.log(last_tag, val , tag )
            checkRefValue(context, val);
        }

    }else if( body.type ==='array' )
    {
        //是否字符串类型的值
        var is_str = /[\'\"]/.test(tag);
        if( val )
        {
            //引用的属性值必须在上下文中定义
            if( !is_str )
            {
               checkRefValue(context, val)
            }
        }
        //不能与上一次相同的标签。
        else if( (!is_str && last_tag === tag && tag !=='\n') || ( tag===']' && last_tag===',') )
        {
            console.log(last_tag, val , tag )
            throw new Error('invalid array')
        }

    }else if( body.type ==='object' )
    {
        //是否字符串类型的值
        var is_str = /[\'\"]/.test(tag);

        if( val )
        {
            //是否为变量名
            var is_key = tag === ':' ;

            if( is_key )
            {
                checkPropName( val );
            }
            //引用的属性值必须在上下文中定义
            else if ( last_tag ===':' && !is_str )
            {
                checkRefValue(context, val );
            }

        }
        //不能与上一次相同的标签。
        else if( (!is_str && last_tag === tag && tag !=='\n') || ( tag==='}' && last_tag===',') )
        {
            console.log(last_tag, val , tag )
            throw new Error('invalid object')
        }


    }else if (keyword === 'var' )
    {

        //是否字符串类型的值
        var is_str = /[\'\"]/.test(tag);

        checkDelimiter( /^[\n\;\,\=\'\"\+]$/, tag );

        if( is_str && last_tag==='=' )
        {
            _tag='=';
        }

        if( val )
        {
            val = val.replace(/^var\s*/, '');

            //是否为变量名
            var is_key = last_tag !== '=' && !is_str;

            //变量名只能是以下划线字母打头和数字组成的字符并且不能为var, 并且只能出现在指定的定界符之前
            if( is_key )
            {
                checkVariableName( val );
                context.defvar.push( val );
            }
            //变量的赋值必须出现在等号之后
            else if( !is_key && last_tag !=='=' )
            {
                console.log(last_tag, val , tag )
                throw new Error('variable assignment must appear after the "=" ')
            }
            //引用的属性值必须在上下文中定义
            else if ( !is_str && !is_key )
            {
               checkRefValue(context, val );
            }

        }
        //不能与上一次相同的标签。
        else if( !is_str && last_tag === tag && tag !=='\n' )
        {
            console.log(last_tag, val , tag )
            throw new Error('invalid object')
        }
    }


    //写入内容与定界符
    if(val){
        body.content.push( val );
    }
    body.content.push( tag );

    //记录关键词
    last_keyword = keyword;
    last_tag = _tag;

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
   if(33){}\
   var mmm= 455;\
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

    //是否需要标记当前的定界符, 通常为'\n'或';'
    // appendAndCheckSyntax(current, val, tag);

    if (val) current.content.push(val);
    if( !/[\(\{\[\]\}\)]/.test(tag) )current.content.push(tag);

    //结束写入正文，并切换到父上下文
    if( current.closer )
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


console.log( rootcontext.content[1].content)


