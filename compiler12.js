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

    if( keyword==='function' ||  keyword==='condition' )
    {
        this.param=[];
    }

    this.closer=false;
    this.parent=null;
    this.events={};

    this.switch( this );

    this.addListener('switchBefore',function(){

        if ( ( this.keyword==='condition' && this.name==='if') && this.param.length ===0 )
        {
            this.param =  this.content.splice(0, this.content.length );
            if( this.param.length===0 )
            {
                this.param.push(null);
            }
            console.log('=====22222=++++====')
            return false;
        }
    })


    this.addListener('appendBefore', function (event)
    {
        var child = event.child;
        var last = this.content[ this.content.length-1 ];


        if ( ( this.keyword==='condition' ) && this.content.length===0 && this.closer && this.param.length>0 && child.name!=='{' )
        {

            console.log('======++++====', this.name, this.param )

           // this.balance.push(';');
            this.closer=false;

           // return false;
        }

        if( child instanceof Stack )
        {
            if( last instanceof Stack )
            {
                //合并函数的代码体
                if ( (last.keyword==='function' || last.keyword==='condition' ) && last.closer && last.param.length ===0 && child.name==='{' )
                {

                    last.param =  last.content.splice(0, last.content.length);
                    if( last.param.length===0 )
                    {
                        last.param.push(null);
                    }

                    last.closer=false;
                    event.child = last;
                    this.switch( last );
                    return false;
                }
            }

            //变量上下文中不能插入变量
            if ( this.keyword==='var' && child.keyword==='var' )
            {
                throw new Error('syntax not end');
            }

            //函数(自定义函数)的表达式合并 if|else if|switch|...()
            else if ( (this.keyword==='function' || this.keyword==='condition' ) && !this.closer && this.balance.length===0 && child.name === '(' )
            {
                event.child = this;
                this.switch( this );
                return false;
            }
            //代码块合并 do|try...{}
            else if ( this.keyword==='black' && !this.closer && this.balance.length===0 && child.name === '{' )
            {
                event.child = this;
                this.switch( this );
                return false;
            }
        }

    },100)


    //变量必须要以';'结束
    if( keyword ==='var' )this.balance.push(';');

}

Stack.current=null;
Stack.getInstance=function( code, delimiter )
{
    var name,keyword;
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
        name=delimiter;
        keyword='object';
        if( delimiter==='[' )
        {
            name = code;
            keyword='array';
            code='';
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

    if( current && current !== newobj )
    {
        var obj = current.append( newobj );
        if( obj instanceof Stack )newobj=obj;
    }

    newobj.code=code;
    newobj.delimiter=delimiter;
    return newobj;
}

Stack.prototype.constructor=Stack;

Stack.prototype.append=function( value )
{
    if( !value || value==='\n' )return value;
    var event = {child:value};
    if( this.hasListener('appendBefore') && !this.dispatcher('appendBefore', event) )
    {
        return event.child;
    }

    value =  event.child;
    if( value instanceof Stack )
    {
        if( value === this )throw new Error('the child and parent is same');
        if( value.parent )throw new Error('child added.');
        value.parent=this;
    }

    if( this.closer )
    {
        console.log( this , value );
        throw new Error('this is closered');
    }

    if( value )
    {
        this.content.push( value );
    }
    return value;
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
    if( stack instanceof Stack && Stack.current !== stack )
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

    //获取函数名称
    if( this.keyword==='function' && typeof this.name === "undefined" )
    {
        code = trim( code );
        this.name= code ? code : delimiter==='(' ? '' : undefined;
        code='';
    }
    //获取变量名称
    else if( code && this.keyword==='var' && typeof this.name === "undefined" )
    {
        code =  trim( code );
        this.name = code;
    }

    if (code)this.append(code);

    //如果是运算符
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

            if( context.balance.length === 0 )
            {
                console.log( context, delimiter, tag )
                throw new Error('Not the end of the delimiter 3');
            }
            return 1;
        }

        if( context.balance.length===0 )
        {
            //关闭上下文并切换到父级上下文
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

   // console.log( current.content[0].content[2].content[3].content[0].content[0] )
    console.log( current.content[0].content[0].content )
    //console.log( current.content )
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
        (typeof strainer === \"undefined\" + \"sdfsdf\" ? function(){return this.nodeType===1; } : strainer);\n\
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

content = " function doRecursion( propName,strainer, deep )\n\
{\n\
   do\n{\n\
                currentItem = currentItem[propName];\n\
                if( currentItem && s.call(currentItem) )ret = ret.concat( currentItem );\n\
            }while(1){}\n\
}";

var  rootcontext = start( content );

//console.log( toString( rootcontext ) )

//console.log( rootcontext.content[1].content[2].content[3].content[1].content )
//console.log( rootcontext.content[1].content )


