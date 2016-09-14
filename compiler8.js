/**
 * 去掉两边的空白
 * @param str
 * @returns {string|void|XML}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
}

var newline =new RegExp('(\\/\\*|\\(|\\{|\\[|\\]|\\}|\\)|\\*\\/|\\/\\/|\\?|\\n|\\;|\\:|\\,|\\"|\\\'|\\!?\\+?\\=+|\\+|\\|+|\\&+|\\<+\\=?|\\>+\\=?|\\!+|$)','g');
var last_delimiter;
var map_delimiter={
    '(':')',
    '{':'}',
    '[':']',
    '"':'"',
    "'":"'",
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

function newcontext( context )
{
    return {
        'name': '',
        'content': [],
        'closer':0,
        'balance':[],
        'parent': null
    };
}


/**
 * 平衡器
 * @param context
 * @param delimiter
 * @returns {number}
 */
function balance(context, delimiter )
{
    if( /[\(\{\[\'\"\]\}\)]/.test(delimiter) )
    {
        var tag = context.balance.pop();
        if ( delimiter !== tag )
        {
            if( tag )
            {
                if( /[\)\}\]]/.test(delimiter) || /[\'\"]/.test(tag)  )
                {
                    throw new Error('Not the end of the delimiter');
                }
                context.balance.push(tag);
            }
            context.balance.push(map_delimiter[delimiter]);
            return 1;
        }
        if( context.balance.length===0 )
        {
            context.closer++;
        }
        return -1;
    }
    return 0;
}


/**
 * 返回新的上下文
 * @param tag
 * @returns {}
 */
function context( context, val , tag )
{
    var obj = context;
    if( val && /^function(\s+\w+)?$/.exec( val ) )
    {
        obj = {
            'name': '',
            'keyword':'function',
            'content': [],
            'closer':0,
            'balance':[],
            'parent': context
        };
        obj.param = [];
        obj.name=RegExp.$1;
        obj.defvar=[];
        obj.parent.content.push( obj );

    }/*else if( !(obj.keyword==='function' && tag==='{' && obj.closer===1) && /[\{\[]/.test( tag ) )
    {
        obj = {
            'name': '',
            'keyword':'',
            'content': [],
            'closer':0,
            'balance':[],
            'parent': context.closer ? context.parent : context
        };
        obj.name=tag;
        obj.keyword=tag;
        obj.parent.content.push( obj );
    }*/
    return obj;
}

function protectedKeyword( val )
{
    if( val && /^(if|var|else|do|while|switch|case|default|try|catch|instanceof|typeof|function|return|new|throw)$/.test( val ) )
    {
        console.log( val )
        throw new SyntaxError('conflict statement variable name. cannot protected keyword')
    }
}

function getArrLastItem( arr )
{
    return arr.length > 0 ? arr[ arr.length-1 ] : null;
}


var stack=[];
var check={

    'var':function ( context,content,val, tag , stack ){

        val = val.replace(/^var\s+/,'');
        if(val)stack.push( val );
        if( /^[\;\,\{\[\(\=]$/.test( tag ) )stack.push( tag );

        if( !/[\}\]\)\=]/.test( tag ) )
        {
            console.log( stack , tag )
            if( stack.length !==1 && stack.length>4)
            {
                throw new SyntaxError('variable syntax is not right');
            }
            protectedKeyword( stack[0] );
            context.defvar.push( stack[0] );
            stack.splice(0);
        }
    },
   'prop':function (context,content,val,tag, stack){

        if( /[\,\)]/.test( tag ) )
        {
            //if (tag !== ',' && tag !== ')')throw new SyntaxError('invalid delimiter 1');
           // if (tag === ',' && !val)throw new SyntaxError('invalid param delimiter');
        }
        //protectedKeyword(val);
    }

}

var current_stack;
function stack( context , val , tag )
{
    this.name='';
    this.content=[];
    this.parent=null;
    this.closer=false;
    this.context=context;

    if( /^(var|if|else\s+if|do|while|switch|case|default|try|catch)(\s+\w+|$)/.exec(val) )
    {
        var obj = {
            'name': RegExp.$1,
            'content': [],
            'closer':false,
            'parent': current_stack ? !current_stack.closer ? current_stack : current_stack.parent : null
        };

    }else if( /[\{\[\(]/.test(tag) )
    {
        keyword.push( RegExp.$1 );
    }
}



var keyword=[];
var stack=[];

function syntax( context ,body , val, tag )
{
  /*  if( /^(var|if|else\s+if|do|while|switch|case|default|try|catch)(\s+\w+|$)/.exec(val) )
    {
        keyword.push( RegExp.$1 );

    }else if( /[\{\[\(]/.test(tag) )
    {
        keyword.push( RegExp.$1 );
    }

    if( check[ keyword ] )
    {
        check[keyword](context, body, val, tag, stack);
    }

    if( /[\(\{\[\"\'\;]/.test( tag ) )
    {
        keyword = 'prop';
        stack=[];
    }
    last_keyword = keyword;*/

    if (val) body.push(val);

}


function variableItem( current, tag )
{
    if( (tag===';' || tag ===',') && current.name==='var' )
    {
        if( !(current.items instanceof Array) )
        {
            current.items = [];
            current.indexAt=0;
        }
        var arr = current.content.slice( current.indexAt );
        var item={name:arr[0],value:arr[2] ? arr[2] : undefined };
        current.items.push( item );
        current.indexAt+=arr.length;
        tag='';
    }
    return tag;
}


var content = " function doRecursion( propName,strainer, deep )\n\
{\n\
    var currentItem={lll:78,\
    'uuu':'kkkk'\
    }\n\
    ,bbb,\
    ret=[]\n\
     var s = typeof strainer === \"string\" ? function(){return Breeze.querySelector(strainer, null , null, [this]).length > 0 } :\n\
        (typeof strainer === \"undefined\" + \"sdfsdf\" ? function(){return this.nodeType===1} : strainer);\n\
\n\
    var uuu = this['forEach'](function(elem)\n\
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

/*content = " function doRecursion( propName,strainer, deep ){\n\
   var mmm= '455',\n\
    ccc;\n\
     var cccc;\
 }";*/



//content = "var s={ccc:'yyyy','bb':'iiii'+'ccccc'}";
//content = content.replace(/\=\=\=/g,'__#501#__').replace(/\=\=/g,'__#500#__');


function start( content )
{
    var global_error = false;
    var ret;
    var pos = 0;
    var len = content.length;
    var current=newcontext(null);
    var rootcontext=current;
    var num=1;

    while ((ret = newline.exec(content)) && !global_error && pos < len)
    {
        var tag = ret[0];
        var val = trim(content.substr(pos, ret.index - pos));
        var old= current;
        pos += ret.index - pos + tag.length;
        current = context(current, val, tag );

        //语法
         var body = current.closer<1 && current.keyword==='function' ? current.param : current.content;

         if ( old=== current )
         {
             syntax(current, body, val, tag );
         }
         if( !/[\(\{\[\n\]\}\)]/.test(tag) )body.push( tag );

        //平衡器
        balance(current, tag );

        //结束写入正文，并切换到父上下文
        if( current.keyword==='function' && current.closer > 1 )
        {
            current = current.parent;
        }
        last_delimiter = tag;
        if( tag==='\n')num++;
    }

    if( current.balance.length !==0 && current !== rootcontext )
    {
        throw new Error('Not the end of the delimiter 2');
    }
    return rootcontext;
}








function toString( rootcontext )
{
    var str=[];
    //str.push( rootcontext.keyword );
   // str.push( rootcontext.name );
   // str.push( rootcontext.delimiter );


    // console.log(  rootcontext  );

    for ( var i in rootcontext.content )
    {
        if( typeof rootcontext.content[i] === "object" )
        {
            str.push( toString( rootcontext.content[i] ) );

        }else
        {
            str.push( rootcontext.content[i] )
        }
    }
    return str.join('');
}

var  rootcontext = start( content );

//console.log( toString( rootcontext ) )

console.log( rootcontext.content[0])


