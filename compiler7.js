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
        'closer':false,
        'balance':[],
        'parent': context ?  context.closer ? context.parent : context : null,
        'level':1
    };
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

    function balance(context, delimiter, force )
    {
        force = force || ( delimiter ===';' && context.name==='var' && !context.closer);
        if( force || /\)|\}|\]/.test(delimiter) )
        {
            var last = context.balance.pop();
            if( last !== delimiter )
            {
               // console.log( last, delimiter, context.name )
                global_error=true;
                throw new Error('Not the end of the delimiter');
            }
            context.closer = context.balance.length===0;
            return context.closer;
        }
        return false;
    }


    /**
     * 返回新的上下文
     * @param tag
     * @returns {}
     */
    function context( context, delimiter , str )
    {
        var obj;

        //生成一个新的上下文
        if( str && /^function(\s+\w+)?$/.exec( str ) )
        {
            obj = newcontext( context );
            obj.name=RegExp.$1;
            obj.defvar=[];
            obj.balance.push( map_delimiter[delimiter] );

        }else if( str && /^(var|if|else\s+if|do|while|switch|case|default|try|catch)(\s+|$)/.exec( str ) )
        {
            obj = newcontext( context );
            obj.name=RegExp.$1;

            if( obj.name==='var')
            {
                if( context.name==='var' && !context.closer )
                {
                    context.closer=true;
                    obj.parent = context.parent;
                }
                obj.balance.push(';');
                addContent(obj, str.replace(/^var\s*/,'') , delimiter );

            }else
            {
                obj.balance.push( map_delimiter[delimiter] );
            }
            if( (obj.name ==='case' || obj.name ==='default') &&  obj.parent.name!=='switch')
            {
                throw new SyntaxError('The keyword "'+obj.name+'" must appear in the switch');
            }

        }else if( /[\{\[\(]/.test(delimiter) )
        {
            obj = newcontext( context );
            obj.name= delimiter ;
            obj.balance.push( map_delimiter[delimiter] );
            addContent(obj, str , delimiter );

        }else if( context.name !== delimiter && /[\'\"]/.test(delimiter) )
        {
            obj = newcontext( context );
            obj.name= delimiter;
            obj.balance.push( map_delimiter[delimiter] );
        }

        if( obj )
        {
            obj.parent.content.push( obj );
            obj.level = obj.parent.level+1;
        }
        return obj;
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

    function addContent(context, val, delimiter )
    {
        if (val) context.content.push(val);
        //  delimiter = variableItem(body, delimiter);
        if (delimiter && !/[\(\{\[\'\"\n\]\}\)]/.test(delimiter))context.content.push(delimiter);
    }

    function parsecode( body, delimiter , val , end )
    {
        var is_quote= delimiter ==='"' || delimiter==="'";
        var begin_quote = is_quote && last_delimiter !== delimiter;
        var is_new=false;

        if( delimiter ==='}' && body.name==='var' && !body.closer )
        {
            parsecode(body, ';', val );

        } else
        {
            var obj = context(body, delimiter, val, last_delimiter);
            if( obj ){
                current = obj;
                body = obj;
                is_new=true;
            }
        }

        if( !is_new && !body.closer )
        {
            addContent(body, val, delimiter )
        }

        balance(body, delimiter, is_quote && !begin_quote );

        //结束写入正文，并切换到父上下文
        if (body.closer || end )
        {
            current = body.parent;
        }
        last_delimiter = delimiter;
    }

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
        pos += ret.index - pos + tag.length;
        //console.log( val , tag)
        try {
            parsecode(current, tag, val, pos === len);
        }catch(e){
            console.log( 'error line in ', num , ' code :', val );
        }
        if( tag==='\n')num++;
    }

    if( !current.closer && current !== rootcontext )
    {
       // console.log(current.level, current.name )
       // throw new Error('Not the end of the delimiter 2');
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

console.log( rootcontext.content[1].content )


