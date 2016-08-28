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

/**
 * 返回上下文对象
 * @param context
 * @param name
 * @param keyword
 * @returns {{name: *, keyword: *, content: Array, closer: boolean, balance: Array, parent: null}}
 */
function newcontext( context, name, keyword )
{
    return {
        'name': name,
        'keyword':keyword,
        'content': [],
        'closer':false,
        'balance':[],
        'parent':  context ? (context.closer ? context.parent : context) : null
    };
}





function Stack(keyword, name )
{
    this.name=name;
    this.keyword=keyword;
    this.content=[];
    this.balance=[];
    this.closer=false;
    this.parent=null;
    this.events={};

   /* if( /^(function|if|else\s+if|else|do|switch|try|catch)$/.test( this.keyword ) )
    {*/
        this.addListener('switchBefore', function (parentStack)
        {
            if ( /^(function|condition)$/.test( this.keyword ) && typeof this.param === "undefined")
            {
                this.closer = false;
                this.param = this.content.splice(0, this.content.length);
                return false;
            }
        })
    //}

    this.addListener('appendBefore', function (child)
    {
        var last = this.content[ this.content.length-1 ];
        if ( (last instanceof Stack && !last.closer) || (this.keyword==='var' && child instanceof Stack && child.keyword==='var' ) )
        {
            throw new Error('syntax not end');
        }
        if( child instanceof Stack  && child.name==='while' && last.name==='do' && last.keyword==='black')
        {
            child.keyword='black';
        }
    })


    //变量必须要以';'结束
    if( keyword ==='var' )this.balance.push(';');
    Stack.current=this;
}

Stack.current=null;
Stack.getInstance=function( code, delimiter )
{
    var name=null,keyword;
    if( code && /^function(\s+\w+)?$/.test( code ) )
    {
        name = undefined;
        keyword = 'function';
        code=  code.replace(/^function\s*/,'');

    }else if( code && /^(var)(\s+\w+|$)/.test( code ) )
    {
        name = undefined;
        keyword = 'var';
        code=  code.replace(/^var\s*/,'');

    }else if( code && /^(if|else\s+if|else|do|while|switch|try|catch)$/.test( code ) )
    {
        name = code;
        keyword = 'condition';
        if( /^(else|do|try)$/.test(code) )
        {
            keyword='black';
        }

        code= code.replace( /^(if|else\s+if|else|do|while|switch|try|catch)$/,'' );
        if( code ){
            throw new Error('syntax invalid');
        }

    }else if( /[\{\[\(]/.test( delimiter ) )
    {
        if( (delimiter==='{' || delimiter==='(') && Stack.current && /^(function|condition)$/.test( Stack.current.keyword) )
        {
           //console.log( Stack.current.keyword )
        }else
        {
            name=delimiter;
            keyword='object';
        }

    }else if(  ( !Stack.current || Stack.current.name!==delimiter ) && /[\'\"]/.test( delimiter ) )
    {
        name=delimiter;
        keyword='object';
        if( code ){
            throw new Error('syntax invalid');
        }
    }

    var current = Stack.current;
    newobj =current;
    if( keyword )
    {
        newobj = new Stack(keyword, name);
    }
    newobj.code=code;
    newobj.delimiter=delimiter;
    if ( current && current !== newobj )
    {
        current.append( newobj );
    }
    return newobj;
}

Stack.prototype.constructor=Stack;

Stack.prototype.append=function( value )
{
    if( !value || value==='\n' )return this;
    if( this.hasListener('appendBefore') && !this.dispatcher('appendBefore', value) )
    {
        return this;
    }

    if( value instanceof Stack )
    {
        if( value === this )throw new Error('the child and parent is same');
        if( value.parent )throw new Error('child added.');
        value.parent=this;
    }

    if( this.closer )
    {
       // console.log( this , value );
        throw new Error('this is closered');
    }
    if( value )
    {
        this.content.push( value );
    }
    return this;
}

Stack.prototype.dispatcher=function( type, options )
{
    if( this.events[type] && this.events[type].length > 0 )
    {
        var len = this.events[type].length;
        for ( var i =0; i<len; i++)
        {
            if( this.events[type][i].callback.call(this, options) === false )
            {
                return false;
            }
        }
    }
    return true;
}


Stack.prototype.addListener=function(type, callback, priority)
{
     var obj = this.events[type] || ( this.events[type]=[] );
     obj.push({callback:callback, priority:priority || 0});
     if( obj.length > 1 )obj.sort(function(a,b)
     {
        return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
     })
     return this;
}


Stack.prototype.hasListener=function(type, callback)
{
    if( typeof callback === "undefined" && this.events[type] )
    {
        return true;

    }else if( this.events[type] && this.events[type].length > 0 )
    {
        var len = this.events[type].length;
        for ( var i =0; i<len; i++)
        {
            if( this.events[type][i] && this.events[type][i].callback === callback )
            {
                return true;
            }
        }
    }
    return false;
}


Stack.prototype.removeListener=function(type, callback)
{
    if( typeof callback === "undefined" )
    {
        delete this.events[type];

    }else if(  this.events[type] &&  this.events[type].length > 0 )
    {
        var len = this.events[type].length;
        for ( var i =0; i<len; i++)
        {
            if( this.events[type][i] && this.events[type][i].callback === callback )
            {
                this.events[type].splice(i,1);
                return this;
            }
        }
    }
    return this;
}



Stack.prototype.switch=function( stack )
{
    if( stack instanceof Stack)
    {
        if ( this.hasListener('switchBefore') && !this.dispatcher('switchBefore', stack) )return this;
        Stack.current = stack;
        if (stack.hasListener('switchAfter'))stack.dispatcher('switchAfter', this );
    }
    return this;
}

Stack.prototype.execute=function()
{
    var code = this.code;
    var delimiter = this.delimiter;
    if( this.keyword==='function' && typeof this.name === "undefined" && !this.closer && this.balance.length===0 )
    {
        code = trim( code );
        this.name= code ? code : delimiter==='(' ? '' : undefined;
        code='';

    }else if( code && this.keyword==='var' && typeof this.name === "undefined" )
    {
        code =  trim( code );
        this.name = code;
    }

    if (code)this.append(code);
    if( balance(this,delimiter)===0 )this.append(delimiter);
}


var map_delimiter={
    '(':')',
    '{':'}',
    '[':']',
    '"':'"',
    "'":"'",
}

/**
 * 平衡器
 * @param context
 * @param delimiter
 * @returns {number}
 */
function balance(context, delimiter )
{
    if( /[\(\{\[\'\"\;\]\}\)]/.test(delimiter) )
    {
        var tag = context.balance.pop();
        if ( delimiter !== tag )
        {
            if( tag )
            {
                if( /[\)\}\]]/.test(delimiter) || /[\'\"]/.test( tag ) )
                {
                    throw new Error('Not the end of the delimiter 2');
                }
                context.balance.push(tag);
            }
            if( map_delimiter[delimiter] )
            {
                context.balance.push( map_delimiter[delimiter] );
            }
            return 1;
        }

        if( context.balance.length===0 )
        {
           context.closer=true;
           context.switch( context.parent );
        }
        return -1;
    }
    return 0;
}


/**
 * @param obj
 * @param name
 * @param indexAt
 * @returns {*}
 */
function getItem( obj , name , indexAt )
{
    if( !name )return obj;
    var prop = name.split('.');
    var n = prop.pop();
    var i=0;
    while (i < prop.length && obj)
    {
        obj = obj[ prop[i++] ];
    }
    if( typeof indexAt === "number" && obj instanceof Array )
    {
        indexAt = indexAt<0 ? obj.length + indexAt : indexAt;
        obj=obj[ indexAt ] || {};
    }
    return obj[n] || null;
}


/**
 * 检查是否保护的属性名
 * @param val
 */
function protectedKeyword( val )
{
    if( val && /^(if|var|else|do|while|switch|case|default|try|catch|instanceof|typeof|function|return|new|throw)$/.test( val ) )
    {
        throw new SyntaxError('conflict statement variable name. cannot protected keyword')
    }
}


function start( content )
{
    var global_error = false;
    var ret;
    var pos = 0;
    var len = content.length;
    var current=new Stack('context');
    var num=1;
    var root;

    while ((ret = newline.exec(content)) && !global_error && pos < len)
    {
        var tag = ret[0];
        var val = trim(content.substr(pos, ret.index - pos));
        pos += ret.index - pos + tag.length;
        var stack = Stack.getInstance(val, tag);
        stack.execute();
        if( len === pos ){
            current.closer=true;
        }
    }

    if( current.balance.length !==0 )
    {
       // console.log( current )
       // throw new SyntaxError('Not the end of the syntax in '+num+' line');
    }
   // console.log( current.content[0].content[2].content[3].content[0].content[0].content[3].content[3] )
    console.log( current.content )
  //  return root;
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


var content = " function doRecursion( propName,strainer, deep )\n\
{\n\
    var currentItem={lll:78,\n\
    'uuu':'kkkk'\
    }\n\
    ,bbb,\
    ret=[];\n\
     var s = typeof strainer === \"string\" ? function(){return Breeze.querySelector(strainer, null , null, [this]).length > 0; } : \n\
        (typeof strainer === \"undefined\" + \"sdfsdf\" ? function(){return this.nodeType===1} : strainer);\n\
    var uuu = this['forEach'](function(elem)\n\
    {\n\
        if\n\
        ( elem && elem.nodeType )\n\
        {\n\
            currentItem=elem;\n\
            do{\n\
                currentItem = currentItem[propName];\n\
                if( currentItem && s.call(currentItem) )ret = ret.concat( currentItem );\n\
            }while(1)\n\
        }\n\
        else if(1){}\n\
    });\n\
    return ret;\n\
}";

/*content = " function doRecursion( propName,strainer, deep )\n\
{\n\
    var currentItem={lll:78,\n\
    'uuu':'kkkk'\
    }\n\
    ,bbb,\
    ret=[];\n\
     var s = typeof strainer === \"string\" ? function(){return Breeze.querySelector(strainer, null , null, [this]).length > 0; } : \n\
        (typeof strainer === \"undefined\" + \"sdfsdf\" ? function(){return this.nodeType===1} : strainer);\n\
    var uuu = this['forEach'](function(elem)\n\
    {\n\
     if\n( elem && elem.nodeType )\n\
     { this.ccc=234\
     }else if( ccc && 444 ){\n\
       this.bbb='99999'\n\
     }\n\
    });\n\
    return ret;\n\
}";*/

var  rootcontext = start( content );

//console.log( toString( rootcontext ) )

//console.log( rootcontext.content[1].content[2].content[3].content[1].content )
//console.log( rootcontext.content[1].content )


