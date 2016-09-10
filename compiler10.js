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
}

Stack.next=null;
Stack.getInstance=function( code, delimiter )
{
    var name=null,keyword;

    if( code && /^function(\s+(\w+))?$/.exec( code ) )
    {
        name = RegExp.$2 || undefined;
        keyword = 'function';

    }else if( code && /^(var)(\s+(\w+)|$)/.exec( code ) )
    {
        if( Stack.next && Stack.next.keyword==='var' && !Stack.next.closer )
        {
            Stack.next.closer=true;
            if( Stack.next.parent )
            {
                Stack.next.switch( Stack.next.parent );
            }
        }
        name = RegExp.$3 || undefined;
        keyword = 'var';

    }else if( code && /^(if|else\s+if|else|do|while|switch|try|catch)$/.exec( code ) )
    {
        name = RegExp.$1;
        keyword = 'condition';

    }else if( /[\{\[\(]/.test( delimiter ) )
    {
        name=delimiter;
        keyword='object';
    }

    var newobj;
    if( Stack.next && Stack.next.keyword==='function' && delimiter==='{')
    {
        Stack.next.closer=false;
        Stack.next.param = Stack.next.content.splice(0,Stack.next.content.length);
        newobj=Stack.next;

    }else
    {
        newobj = keyword || !Stack.next ? new Stack(keyword, name) : Stack.next;
        if (Stack.next !== newobj ){

            if( Stack.next )Stack.next.append(newobj);
            newobj.isnew=true;
        }
    }

    Stack.next=newobj;
    newobj.lastCode=code;
    newobj.lastDelimiter=delimiter;
    return newobj;
}


Stack.prototype.constructor=Stack;


Stack.prototype.append=function( value )
{
    if( !value || value==='\n' )return this;

    if( this.hasListener('addStackBefore') && !this.dispatcher('addStackBefore', value) )
    {
        return this;
    }

    if( value instanceof Stack )
    {
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

var map_delimiter={
    '(':')',
    '{':'}',
    '[':']',
    '"':'"',
    "'":"'",
}

Stack.prototype.switch=function( stack )
{
    if( stack instanceof Stack)
    {
        if (this.hasListener('switchBefore'))this.dispatcher('switchBefore', stack);
        Stack.next = stack;
        if (stack.hasListener('switchAfter'))stack.dispatcher('switchAfter', this );
    }
    return this;
}

Stack.prototype.execute=function()
{
    var code = this.lastCode;
    var delimiter = this.lastDelimiter;

    if( !this.isnew )
    {
        if( this.keyword==='function' && typeof this.name === "undefined" && this.balance.length===0 )
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
        if ( !/[\(\[\{\n\;\}\]\)]/.test(delimiter) )this.append(delimiter);
    }

    this.isnew=false;

    if( /[\(\{\[\]\}\)]/.test(delimiter) )
    {
        var tag = this.balance.pop();
        if ( delimiter !== tag )
        {
            if( tag )
            {
                if( /[\)\}\]]/.test(delimiter) )
                {
                    throw new Error('Not the end of the delimiter 2');
                }
                this.balance.push(tag);
            }
            this.balance.push( map_delimiter[delimiter] );
            return 1;
        }

        if( this.balance.length===0 )
        {
            this.closer=true;
            if( this.parent )
            {
               this.switch( this.parent );
            }
        }
        return -1;

    }else if( this.name==='var' && delimiter ===';' && !this.closer )
    {
        this.closer=true;
        if( this.parent )
        {
            this.switch( this.parent );
        }
        return -1;
    }
    return 0;
}




/**
 * 平衡器
 * @param context
 * @param delimiter
 * @returns {number}
 */
function balance(context, delimiter, val )
{
    if( !context.closer && /[\(\{\[\'\"\]\}\)]/.test(delimiter) )
    {
        var tag = context.balance.pop();
        if ( delimiter !== tag )
        {
            if( tag )
            {
                if( /[\)\}\]]/.test(delimiter) || /[\'\"]/.test(tag) )
                {
                    console.log( context , tag, '====', delimiter )
                    throw new Error('Not the end of the delimiter 2');
                }
                context.balance.push(tag);
            }
            context.balance.push(map_delimiter[delimiter]);
            return 1;
        }

        if( context.balance.length===0 )
        {
            context.closer=true;
        }
        return -1;

    }else if( delimiter===';' && context.name==='var' )
    {
        if( context.balance.pop()!==';' )
        {
            throw new Error('Not the end of the delimiter 1');
        }
        context.closer=true;
    }
    return 0;
}

/**
 * 切换上下文
 * @param context
 * @returns {*}
 */
function switchcontext( context )
{
    return  context.closer ? context.parent : context;
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
 * 返回新的上下文
 * @param tag
 * @returns {}
 */
function context( context, val , tag , queues)
{
    var obj = context;

    //如果是一个换行函数或者表达式
    if( !obj.closer && obj.balance.length===0 && ( tag==='(' || tag==='{' )
        && (obj.keyword==='function' || obj.keyword==='condition') )
    {
        return obj;
    }

    if( val && /^function(\s+\w+)?$/.exec( val ) )
    {
        obj= newcontext(context, RegExp.$1, 'function');
        obj.defvar=[];
        obj.parent.content.push( obj );

        if( tag !=='(' )
        {
            queues.after.push(function (val, tag) {
                if (tag === '\n' && !val )return false;
                if (tag !== '(' || val )throw new SyntaxError('invalid function');
                return true;
            })
        }
        queues.after.push(function(val, tag)
        {
            if( tag ==='\n' || !obj.closer )return false;
            if( tag !=='{')throw new SyntaxError('Statement of the function must have the function body');
            return true;
        })

    }else if( val && /^(var)(\s+\w+|$)/.test( val ) )
    {

        //如果上一个变量没有关闭
        if( context.name==='var' && !context.closer )
        {
            balance(context, ';' );
            obj.parent = switchcontext( context );
        }

        obj = newcontext(context, 'var', 'var' );
        obj.parent.content.push( obj );
        obj.keyword='var';
        obj.balance.push(';');

        val = val.replace(/^var\s*/,'');
        syntax(obj, obj.content, val , tag );

    }else if( val && /^(if|else\s+if|else|do|while|switch|try|catch)$/.exec( val ) )
    {
        obj = newcontext(context, RegExp.$1, 'condition' );
        obj.parent.content.push( obj );

        if (obj.name === 'do')
        {
            queues.after.push(function (val, tag)
            {
                if (tag === '\n' || !obj.closer)return false;
                if (val !== 'while')throw new SyntaxError('the "do" after must be "while" end');
                return true;
            });

        } else if (obj.name === 'while' || obj.name === 'switch')
        {
            queues.before.push(function (val, tag)
            {
                if (!obj.closer)return false;
                if (obj.content.length < 1)throw new SyntaxError('Missing parameter in "' + obj.name + '" ');
                return true;
            });

        } else if (obj.name === 'else if' || obj.name === 'if' || obj.name === 'else')
        {
            if (obj.name !== 'else')
            {
                queues.before.push(function ()
                {
                    if (!obj.closer)return false;
                    if ( obj.content.length < 1)throw new SyntaxError('Missing parameter in "' + obj.name + '" ');
                    return true;

                });
            }

            if( tag !=='(')
            {
                queues.after.push(function (val, tag) {
                    if (tag === '\n')return false;
                    if ('(')return true;
                    throw new SyntaxError('invalid "' + obj.name + '"');
                });
            }

            queues.after.push(function (val, tag)
            {
                if( tag === '\n' || !obj.closer )return false;
                if ( obj.closer && ( tag === '{' || val || tag === ';' ) )return true;
                throw new SyntaxError('invalid "' + obj.name + '"');

            });
        }

    }else if( /[\{\[\(]/.test( tag ) )
    {
        obj = newcontext(context, tag, tag );
        obj.parent.content.push( obj );
        if( val && tag !== '{' )
        {
            obj.keyword='referred';
        }
        syntax(obj, obj.content, val , tag );

    }else if( context.name !== tag && /[\'\"]/.test( tag ) )
    {
        obj = newcontext(context, tag, 'string' );
        syntax( obj.parent,  obj.parent.content, val , tag );
        obj.parent.content.push( obj );
    }

     //case or default 必须在switch块中
    if( val==='case' || val==='default' )
    {
        if( getItem(context, 'parent.content.name', -2 ) !=='switch' )
        {
            throw new SyntaxError('The keyword "' + val + '" must appear in the switch');
        }

        if ( tag !== ':')
        {
            queues.after.push(function (val, tag) {

                if (tag === '\n' || tag === '"' || tag === "'")return false;
                if ( tag !== ':' )throw new SyntaxError('Missing delimiter for ":"');
                return true;
            });
        }
    }

    return obj;
}

/**
 * 执行队列任务
 * @param queues
 * @param action
 * @param val
 * @param tag
 */
function execQueue(queues, action, val, tag )
{
    if( queues[action] && typeof queues[action][0] === "function" && queues[action][0](val, tag)  )
    {
        queues[action].splice(0,1);
    }
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


/**
 * 保存正文
 * @param context
 * @param body
 * @param val
 * @param tag
 */
function syntax( context ,body , val, tag )
{
    if (val) body.push(val);
}


var task_list={

    'getStackName':function(optons){

        this.name =optons.value ? optons.value.replace( /^function\s*/ ,'') : null;
        if (optons.delimter !== '(' && optons.delimter !== '\n') {
            throw new Error('Invalid delimter function');
        }
        if ( this.name || optons.delimter === '(') {
            this.removeListener('task', task_list.getStackName);
        }
    },

    'checkVariable':function (optons)
    {
        if( !optons instanceof Stack )return ;
        var val =optons.value;
        var delimter =  optons.delimter;
        if( this.content.length === 0 )
        {
            val.replace( /var\s+/ ,'');
        }
    },
    'variableAddContentBefore':function (optons) {
        if( !optons instanceof Stack )return true;
        return false;
    }
}


function start( content )
{
    var global_error = false;
    var ret;
    var pos = 0;
    var len = content.length;
    var current;
    var num=1;
    var root;

    while ((ret = newline.exec(content)) && !global_error && pos < len)
    {
        var tag = ret[0];
        var val = trim(content.substr(pos, ret.index - pos));
        pos += ret.index - pos + tag.length;

        current = Stack.next;
        var stack = Stack.getInstance(val, tag);
        if( !root )root=stack;
        stack.execute();
        current = stack;

    }

    if( current.balance.length !==0 )
    {
       // console.log( current )
       // throw new SyntaxError('Not the end of the syntax in '+num+' line');
    }
    console.log( root.content[2] )
    return root;
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
    ret=[]\n\
     var s = typeof strainer === \"string\" ? function(){return Breeze.querySelector(strainer, null , null, [this]).length > 0 } : \n\
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

var  rootcontext = start( content );

//console.log( toString( rootcontext ) )

//console.log( rootcontext.content[1].content[2].content[3].content[1].content )
//console.log( rootcontext.content[1].content )


