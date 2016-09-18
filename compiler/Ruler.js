/**
 * 保护的关键词 , 不可当参数名， 不可声明为变量
 * @type {string[]}
 */
var reserved = [
    'static','public','private','protected','internal','package',
    'extends','import','class','var','function','new','typeof',
    'instanceof','if','else','do','while','for', 'switch','case',
    'break','default','try','catch','throw','Infinity','this',
    'finally','return','null','false','true','NaN','undefined',
];

var objects = [
    'Number','String','Object','RegExp','Error','EvalError','RangeError',
    'ReferenceError','SyntaxError','TypeError','URIError','Math','Function',
    'Arguments','Date','Boolean','Array',
];

/**
 * 系统全局属性
 * @type {string[]}
 */
var globals=[
    'window','document','location','setInterval','clearInterval','setTimeout',
    'clearTimeout','console','alert','confirm','eval','parseInt','parseFloat',
    'isNaN','isFinite','decodeURI','decodeURIComponent','encodeURI','encodeURIComponent',
];

/**
 * 获取组合运算符
 * @param s
 * @returns {*}
 */
function getOperator(s)
{
    switch( s.charAt(0) )
    {
        case '!' :
        case '|' :
        case '&' :
        case '+' :
        case '-' :
        case '*' :
        case '/' :
        case '=' :
        case '>' :
        case '<' :
        case '^' :
        case '%' :
        case '~' :
            return s.substr(0,1) + getOperator( s.substr(1) );
        break;
    }
    return '';
}

/**
 * 判断是否为一个有效的运算符
 * @param o
 * @returns {boolean}
 */
function isOperator( o )
{
    switch (o) {
        case '=' :
        case '&' :
        case '|' :
        case '<' :
        case '>' :
        case '-' :
        case '+' :
        case '*' :
        case '/' :
        case '%' :
        case '!' :
        case '^' :
        case '==' :
        case '&&' :
        case '||' :
        case '<=' :
        case '>=' :
        case '--' :
        case '++' :
        case '+=' :
        case '-=' :
        case '*=' :
        case '/=' :
        case '%=' :
        case '^=' :
        case '&=' :
        case '|=' :
        case '!!' :
        case '<<' :
        case '>>' :
        case '===' :
        case '!==' :
            return true;
    }
    return false;
}

/**
 * 判断是为一个数字类型
 * @param s
 * @returns {boolean}
 */
function isNumber(s)
{
    return /^(0x[0-9a-fA-F]+|o[0-7]+|[\-\+]?[\d\.]+)/.test(s);
}

/**
 * 验证是否可以声明为参数名或者变量名
 * @param s 准备声明的变量名或者参数名
 * @param defined 已经声明的，不可以再声明
 * @returns {boolean}
 */
function checkStatement(s, defined )
{
    return isPropertyName(s) && reserved.indexOf( s )<0 && ( !defined || defined.indexOf(s)<0 );
}

/**
 * 是否为一个有效的属性名
 * @param s
 * @returns {boolean}
 */
function isPropertyName(s)
{
    return /^([a-z_$]+[\w+]?)/i.test( s );
}


/**
 * 判断在引用前是否定义过
 * @param scope 当前作用域
 * @param obj 引用的值
 * @returns {boolean}
 */
function isReference( scope, obj )
{
    if( obj.type==='(regexp)' || obj.type==='(string)' || obj.type==='(number)' )return true;
    if( scope.define( obj.value ) )return true;
    if( globals.indexOf(obj.value)>=0 )return true;
    return isConstant(obj.value);
}

/**
 * 判断是否为一个恒定的值
 * @param val
 * @returns {boolean}
 */
function isConstant(val)
{
    return /^(null|undefined|true|false|NaN|Infinity|this)$/i.test(val);
}

/**
 * 判断是否为一个标识符
 * @param s
 * @returns {boolean}
 */
function isIdentifier( s )
{
    switch( s )
    {
        case '{' :
        case '}' :
        case '(' :
        case ')' :
        case '[' :
        case ']' :
        case ';' :
        case ':' :
        case '.' :
        case ',' :
        case '?' :
            return true;
    }
    return false;
}

/**
 * 判断是否一个块级符
 * @param s
 * @returns {boolean}
 */
function isBlack( s )
{
    switch( s )
    {
        case '{' :
        case '}' :
        case '(' :
        case ')' :
        case '[' :
        case ']' :
            return true;
    }
    return false;
}

// 验证分段是否有效
function checkSegmentation( arr )
{
    return arr instanceof Array && arr.length > 0 ? arr.length % 2 === 1 : false ;
}

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
 * 合并对象到指定的第一个参数
 * @returns {*}
 */
function merge()
{
    var target = arguments[0];
    var len = arguments.length;
    for(var i=1; i<len; i++ )
    {
        var item = arguments[i];
        for( var p in item )
        {
            if( Object.prototype.isPrototypeOf( item[p] ) && Object.prototype.isPrototypeOf( target[p] ) )
            {
                target[p] = merge( target[p],  item[p] );
            }else{
                target[p] = item[p];
            }
        }
    }
    return target;
}

// 对称符
var balance={'{':'}','(':')','[':']'};


//语法验证
var syntax={};
syntax['(addBefore)']=function (c)
{
    var s = this.scope();
    if( s.type() === 'class' || s.type() === 'package' )
    {
        return false;
    }
    if( c.id==='(keyword)' && c.value==='function')return false;
    if( c.type==='(newline)' )
    {
        var p = this.previous(-1);
        if(p && p.type==='(newline)')p = this.previous(-2);
        if( p && ( p.type==='(number)' || p.type==='(regexp)' || p.id==='}' || isPropertyName(p.value) ) )
        {
            this.endSemicolon();

        }else if( p && ( p.id===')' || p.id===']' ) &&
            !( this.next.id ==='.' || this.next.id ===')' || this.next.id ===']' || this.next.id==='{') )
        {
            this.endSemicolon();
        }
    }
};

syntax['(identifier)']=function( c )
{
    if( c.id === '.' )
    {
        var p = this.previous(function (p) {
            return p && p.type === '(newline)';
        });
        if( p && p.id==='(keyword)' && p.value ==='this' )return true;
        if( !p || p.id==='(keyword)' )this.error();
        if( !( p.type==='(identifier)' && ( p.id === ']' || p.id === ')' ) ) && !isPropertyName(p.value) )
        {
            this.error();
        }
        p = this.next;
        if( p.id==='(keyword)' )p = this.seek(true);
        if( !isPropertyName(p.value) )this.error();

    } else if( c.id === ',' || c.id===':' )
    {
        var p = this.previous(function (p) {
            return p && p.type === '(newline)';
        });
        if( ( p.type =='(identifier)' && ( p.id === '.' || p.id === ',' || p.id === ':' || p.id===';' ||
            p.id==='?' || isOperator(p.id) ) ) )
        {
            this.error();
        }

    }else if( c.id==='?' )
    {
        this.expect(function (r) {
            return r.id !== ':';
        });
        if( this.current.id !== ':' )this.error();
        this.expect(function (r) {
            return !this.hasSemicolon();
        });
        this.endSemicolon();

    }else if( c.id==='(' || c.id==='{' || c.id==='[')
    {
        this.expect(function (r) {
            return r.id !== balance[c.id];
        });

    } else if( c.id ===';' )
    {

    }else if( c.id ===')' || c.id==='}' || c.id===']' )
    {

    }
    else if( c.id !=='(keyword)' )
    {

        if( this.prev.value==='package' || this.prev.value==='import' || this.prev.id==='.' )return true;

        var p = this.previous(function (p) {
            return p && p.type==='(newline)';
        });

        if( ( !p || p.id !=='.' ) && !isReference( this.scope(), c ) )
        {
            console.log( this.scope().type() )
            this.error(c.value+' not is defined');
        }
    }
};

syntax['(operator)']=function (o)
{
    var p = this.prev;
    if( o.value ==='--' || o.value==='++' )
    {
        if( isPropertyName(p.value) )
        {
            p = this.seek();
        }else if( p.type==='(newline)' || p.id===';' )
        {
            p = this.seek();
            if ( !isPropertyName(p.value) )this.error();
            p = this.seek();
        }else
        {
            this.error();
        }
        return true;

    }else if( !(o.id==='!' || o.id==='!!') )
    {
        if( p.id === '.' || p.id === ',' || p.id===';' || p.id==='?' || p.id==='(' || p.id==='{' || p.id==='[' ||
            isOperator(p.id)  ){
            this.error();
        }

        p= this.next;
        if( p.id === '.' || p.id === ',' || p.id===';' || p.id==='?' || p.id===')' || p.id==='}' || p.id===']' ||
            isOperator(p.id) ){
            this.error();
        }
    }
};







syntax["package"]=function ()
{
    var s = this.createScope( new Package() );
    var name=[];
    this.loop(function(){
        this.seek(true);
        if( this.current.id==='{' || this.next.id ==='(keyword)' )return false;
        if( this.current.id !=='.' && !isPropertyName(this.current.value) )this.error();
        name.push( this.current.value );
        return true;
    });
    if( name.length > 0 && !checkSegmentation(name) )this.error('Invalid package name');
    name = name.join('');
    s.name( name );
    if( this.current.id !=='{' ) this.error('Missing token {');
    return false;
};

syntax['import']=function (o)
{
    var s = this.scope();
    if( s.type() !=='package' )this.error('Unexpected import ', 'syntax');
    var a,name=[];

    this.loop(function () {
        this.seek(true);
        if( this.current.id === ';' || ( this.next.id==='(keyword)' && this.next.value.toLowerCase() !== 'as' ) )return false;
        if( this.current.value.toLowerCase() === 'as' )
        {
            this.seek(true);
            a = this.current.value;
            return false;
        }
        if( this.current.id !=='.' && !isPropertyName(this.current.value) )this.error('Invalid filename');
        name.push( this.current.value );
        return true;
    });
    this.endSemicolon();

    if( !checkSegmentation(name) )this.error('Invalid import filename');
    name = name.join('');

    if( !a )
    {
        a = name.match( /\w+$/ );
        a = a[0];
    }

    if( s.define(a) )error('The filename '+a+' of the conflict.')
    s.define(a, name );
    this.config('reserved').push(a);
    return false;
};

syntax['private,protected,internal,static,public']=function(c)
{
    var s = this.scope();
    var n = this.seek(true);
    if( (s.type() !=='package' && s.type() !=='class') || ( c.value === n.value ) || n.id !=='(keyword)' )this.error();

    var type ='dynamic';
    var qualifier = c.value;

    if( !(n.value === 'function' || n.value === 'var' || n.value==='class') )
    {
        type='static';
        if( c.value==='static' && 'public,private,protected,internal'.indexOf( n.value )>=0 )
        {
            qualifier = n.value;
        }
        n = this.seek();
    }

    if( n.value==='class' || n.value === 'function' || n.value==='var' )
    {
        syntax[n.value].call(this,n);
        var s= this.scope();
        s.static( type === 'static' );
        s.qualifier( qualifier );

    }else
    {
        this.error();
    }
    return false;
};

syntax['class']=function()
{
    var s = this.scope();
    if( s.type() !=='package' )this.error();
    s = this.createScope( new Module() );

    var n = this.seek(true);
    if( !isPropertyName( n.value) )
    {
        this.error('Invalid class name');
    }

    if( s.define(n.value) )error('The class '+n.value+' of the conflict.');

    s.define(n.value, true );
    this.config('reserved').push( n.value );

    n = this.seek(true);
    if( n.id==='(keyword)' && n.value==='extends' )
    {
        n = this.seek(true);
        s.extends( n.value );
        this.seek(true);
    }
    if(n.id !=='{')this.error('Missing token {');
    return false;
};

syntax['var']=function (c)
{
    var type = this.scope().type();

    if( type === 'var' )this.error('Statement var unclosed');
    var old = this.scope();
    this.createScope( new Statement('var') );
    var s = this.scope();

    var n = this.seek(true);
    if( !checkStatement(n.value, this.config('reserved') ) )this.error();
    if( s.define(n.value) )error('cannot define repeat the variables');
    s.name( n.value );

    //定义到作用域中
    old.define(n.value,true);

    if( this.next.type==='(newline)')this.seek(true);
    if( this.next.id==='=' )
    {
        this.seek(true);
        this.check();
        this.expect(function (n) {
            return n.id!==',' && !this.hasSemicolon();
        });
    }

    //结束当前声明的变量
    s.close=true;
    s.switch();

    //函数中可以用 ',' 同时声明多个属性
    if( this.current.id===',' )
    {
        //在类中声明的属性不能同时声明多个
        if( type === 'module' )this.error();

        //继续声明变量
        syntax['var'].call(this);
        return false;
    }

    this.endSemicolon();
    return false;
};

syntax['function']= function(){

    var type = this.scope().type();
    var s = this.createScope( new Statement('function') );
    var n = this.seek(true);
    if( type === 'module' && (n.value === 'get' || n.value === 'set') && this.next.id !== '(' )
    {
        s.accessor(n.value);
        n = this.seek(true);
    }

    if( n.id !== '(' )
    {
        //类中的属性台台允许与引入的类名相同
        if( type === 'module' )
        {
            if ( !checkStatement(n.value) )this.error();

        }else
        {
            if (!checkStatement(n.value, this.config('reserved')))this.error();
        }
        s.name( n.value );
        n = this.seek(true);
    }

    // 类中定义的方法不能为匿名函数
    if( type === 'module' && !s.name() )this.error('Missing function name');
    if( n.id !== '(' )this.error();

    this.loop(function(){
        var n = this.seek(true);
        if( n.id ===')' )return false;
        if( n.id !== ',' && !checkStatement( n.value, this.config('reserved') ) )this.error('Invalid param name');
        s.param( n.value );
        if( n.id !== ',' )s.define( n.value , true );
        return true;
    });

    if (s.accessor() === 'get' && s.param().length > 0)this.error('Invalid accessor of get.');
    if (s.accessor() === 'set' && s.param().length !== 1)this.error('Invalid accessor of set.');

    if( s.param().length > 0 && !checkSegmentation( s.param() ) )this.error();
    if( this.seek(true).id !== '{' )this.error( "Missing token {" );
    return false;
};

function error(msg, type)
{
    switch ( type )
    {
        case 'syntax' :
            throw new SyntaxError(msg);
            break;
        case 'reference' :
            throw new ReferenceError(msg);
            break;
        default :
            throw new Error(msg);
    }
}

/**
 * 事件侦听器
 * @constructor
 */
function Listener() {
    this.events={};
}

/**
 * 指定构造函数为事件侦听器
 * @type {Listener}
 */
Listener.prototype.constructor = Listener;

/**
 * 调度事件
 * @param type 事件类型
 * @param options 引用的对象
 * @returns {boolean}
 */
Listener.prototype.dispatcher=function( type, options )
{
    if( this.events[type] && this.events[type].length > 0 )
    {
        var listener = this.events[type].slice();
        var len = listener.length;
        for ( var i =0; i<len; i++)
        {
            if( listener[i].callback.call(this, options) === false )
            {
                return false;
            }
        }
    }
    return true;
}

/**
 * 添加事件侦听器
 * @param type 事件类型
 * @param callback  回调函数
 * @param priority  优先级
 * @returns {Listener}
 */
Listener.prototype.addListener=function(type, callback, priority)
{
    if( type instanceof Array )
    {
        for (var i in type )this.addListener( type[i], callback, priority);
        return this;
    }
    var obj = this.events[type] || ( this.events[type]=[] );
    obj.push({callback:callback, priority:priority || 0});
    if( obj.length > 1 )obj.sort(function(a,b)
    {
        return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
    })
    return this;
}


/**
 * 是否存在指定类型的侦听器
 * @param type 事件类型
 * @param callback  可选， 如果指定则判断回调函数必须相同
 * @returns {boolean}
 */
Listener.prototype.hasListener=function(type, callback)
{
    if( typeof callback === "undefined"  )
    {
        return !!this.events[type];

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

/**
 * 删除指定类型的侦听器
 * @param type 事件类型
 * @param callback  可选， 如果指定则只删除回调函数相同的侦听器
 * @returns {Listener}
 */
Listener.prototype.removeListener=function(type, callback)
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


/**
 * 语法描述
 * @param type
 * @param value
 * @param id
 * @returns {{type: *, value: *, id: *}}
 */
function describe(type,value,id)
{
    return {type:type ,value:value, id:id || value , line:0, cursor:0};
}


/**
 * 代码堆
 * @param type
 * @constructor
 */
function Stack( type )
{
    this.__content__=[];
    this.__type__ = type;
    this.__parent__=null;
    this.close=false;
}

// 全局属性， 保存为当前的代码块的作用域
Stack.__current__=null;

/**
 * 返回当前的作用域
 * @returns {*|null}
 */
Stack.current=function()
{
    if( !Stack.__current__ )
    {
        Stack.__current__ = new Stack('(begin)');
    }
    return Stack.__current__;
}

/**
 * 继承侦听器
 * @type {Listener}
 */
Stack.prototype = new Listener();

/**
 * 设置构造函数为代码块的作用域
 * @type {Scope}
 */
Stack.prototype.constructor = Stack;


/**
 * 设置获取类型
 * @returns {*}
 */
Stack.prototype.type=function( type )
{
    if( typeof type === "string" )
    {
        this.__type__=type;
        return this;
    }
    return this.__type__;
}

/**
 * 添加代码语法
 * @param scope
 * @returns {Scope}
 */
Stack.prototype.add=function( val )
{
    if( val instanceof Stack )
    {
        val.__parent__=this;
        if( this.type()==='var' )val.__parent__=this.parent();
        Stack.__current__ = val;
    }
    if( this.close )error('stack is ended');
    if( this.dispatcher('(add)') )this.__content__.push( val );
    return this;
}

/**
 * 父级
 * @returns {null}
 */
Stack.prototype.parent=function()
{
    return this.__parent__;
}

/**
 * 内容代码
 * @param value
 * @returns {*}
 */
Stack.prototype.content=function()
{
    return this.__content__;
}


/**
 * 代码语法个数
 * @returns {Number}
 */
Stack.prototype.length=function()
{
    return this.__content__.length;
}

/**
 * 切换作用域
 * @param scope
 * @returns {boolean}
 */
Stack.prototype.switch=function( stack )
{
    if( this.close )
    {
        if( stack && !(stack instanceof Stack) )error('Invalid param stack');
        stack = stack || this.parent();
        if( !this.dispatcher('(switch)', stack ) )return false;
        Stack.__current__ = stack;
        return true;
    }
    return false;
}


/**
 * 代码块的作用域
 * @param type
 * @constructor
 */
function Scope( type )
{
    this.__name__='';
    this.__param__=[];
    Stack.call(this,type);
}
Scope.prototype = new Stack();
Scope.prototype.constructor=Scope;

/**
 * 添加参数
 * @param name
 * @returns {*}
 */
Scope.prototype.param=function( name )
{
    if( typeof name === 'undefined' )return this.__param__;
    this.__param__.push( name );
    return this;
}

/**
 * 作用域的名称
 * @param name
 * @returns {*}
 */
Scope.prototype.name=function( name )
{
    if( typeof name === 'undefined' )return this.__name__;
    this.__name__=name;
    return this;
}


/**
 * 添加子级作用域
 * @param scope
 * @returns {Scope}
 */
Scope.prototype.add=function( val )
{
    if( !(val instanceof Stack) )
    {
        error('Invalid val');
    }
    Stack.prototype.add.call(this,val);
    return this;
}

/**
 * 文件包域
 * @constructor
 */
function Package(){
    this.__define__={};
    Scope.call(this,'package');
}
Package.prototype = new Scope('package');
Package.constructor = Package;

/**
 * 声明一些属性
 * @param prop
 * @param value
 * @returns {*}
 */
Package.prototype.define=function(prop , value )
{
    if( typeof prop === 'undefined' )return this.__define__;
    if( typeof prop === 'string' &&  typeof value === 'undefined' )
    {
        return this.__define__[prop];
    }
    this.__define__[prop]=value;
    return this;
}

/**
 * 声明作用域
 * @constructor
 */
function Statement( type ){
    this.__qualifier__='';
    this.__static__= false ;
    this.__accessor__= '' ;
    Package.call(this,type);
    this.__type__ = type;
}
Statement.prototype = new Package('statement');
Statement.constructor = Statement;

/**
 * 访问器类型
 * @param name get|set
 * @returns {Scope|String}
 */
Statement.prototype.accessor=function( accessor )
{
    if( typeof accessor === 'undefined' )return this.__accessor__;
    this.__accessor__=accessor;
    return this;
}

/**
 * 设置对外接口的限定附
 * @param qualifier
 * @returns {*}
 */
Statement.prototype.qualifier=function(qualifier )
{
    if( typeof qualifier === 'undefined' )return this.__qualifier__;
    this.__qualifier__=qualifier;
    return this;
}

/**
 * 标记是动态还是静态模块
 * @param flag  true是静态，否则为动态
 * @returns {*}
 */
Statement.prototype.static=function(flag )
{
    if( flag=== true ){
        this.__static__=true;
        return this;
    }
    return this.__static__;
}


/**
 * 模块作用域
 * @constructor
 */
function Module()
{
    this.__extends__='';
    Statement.call(this,'module');
}

Module.prototype = new Statement('module');
Module.constructor = Module;

/**
 * 是否有继承
 * @param name
 * @returns {*}
 */
Module.prototype.extends=function(name )
{
    if( typeof name === 'undefined' )return this.__extends__;
    if( !this.parent().define(name) )error(name +' not is import');
    this.__extends__=name;
    return this;
}


/**
 * 默认配置
 * @type {}
 */
var default_config = {
    'semicolon':false,
    'reserved':[],
}

/**
 *  语法分析器
 * @param content
 * @param config
 * @constructor
 */
function Ruler( content, config )
{
    this.lines=content.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split(/\n/);
    this.line=0;
    this.cursor=0;
    this.input='';
    this.closer=null;
    this.__end__=false;
    this.__balance__=[];
    this.__config__= merge(default_config,config || {});
    for (var type in syntax )
    {
        this.addListener( type.split(','), syntax[type] ) ;
    }
}

/**
 * 继承侦听器
 * @type {Listener}
 */
Ruler.prototype = new Listener();

/**
 * 指定构造函数为语法分析器
 * @type {Ruler}
 */
Ruler.prototype.constructor = Ruler;

/**
 * 配置选项
 * @param key
 * @returns {*}
 */
Ruler.prototype.config=function(key, value )
{
    if( typeof key === "string" )
    {
        if( typeof value !=="undefined" )
        {
            this.__config__[key]=value;
            return this;
        }
        return this.__config__[key] || null;
    }
    return this.__config__;
}

/**
 * 是否完成语法分析过程
 * @returns {boolean}
 */
Ruler.prototype.done=function()
{
    return this.__end__;
}

/**
 * 需要有指定的语法结束符结束当前的语法
 */
Ruler.prototype.endSemicolon=function()
{
    if( !this.hasSemicolon() )
    {
        this.error('Missing token ;','syntax');
    }
}

/**
 * 是否存在指定的语法结束符
 * @returns {boolean}
 */
Ruler.prototype.hasSemicolon=function()
{
    if( this.current.id ===';' )return true;
    if( this.next.type==='(newline)' )this.seek(true);
    if( this.next.id === ';' ){
        this.seek();
        this.add( this.current );
        return true;
    }
    return false;
}

/**
 * 将代码移动到下一行
 * @returns {*}
 */
Ruler.prototype.move=function()
{
    if ( this.line < this.lines.length )
    {
        this.input = this.lines[ this.line ].replace(/\t/g,'  ');
        var s = trim( this.input );
        this.line++;
        this.cursor=0;

        if( s.indexOf('/*',0) === 0 )this.closer='*/';
        if( this.closer )
        {
            if( s.indexOf( this.closer , s.length-2 )>=0 )this.closer=null;
            return this.move();

        }else if( !s || s.indexOf('//',0)===0 )
        {
            return this.move();
        }
        return this.input;
    }
    this.__end__=true;
    return null;
}

/**
 * 返回上一个在作用域中的内容
 * @param step 可以是一个回调函数， 也可以是一个负数字
 * @returns {*}
 */
Ruler.prototype.previous=function ( step )
{
    var c = this.scope().content();
    var index =  typeof step === "number" ? step : -2;
    var i = index < 0 ? c.length+index : index;
    var r = c[ i ];
    if( typeof step === "function"  )
    {
        while ( step.call(this, r ) && ( r=this.previous( --index ) ) );
    }
    return r;
}

/**
 * 抛出错误消息
 * @param msg
 * @param type
 */
Ruler.prototype.error=function (msg, o)
{
    o = o || this.current;
    msg =  msg || 'Unexpected token '+o.value;
    console.log( 'error line:', o.line, '  character:', o.cursor );
    error(msg , 'syntax');
}

/**
 * 平衡器
 * 主要是检测 () {} [] 是否成对出现
 * @param o
 * @returns {boolean}
 */
Ruler.prototype.balance=function( o )
{
    var b = this.__balance__;
    var tag = b.pop();
    if ( o.id !== tag )
    {
        if( tag )
        {
            if( !balance[o.id] )
            {
                error('Unexpected identifier '+o.id );
            }
            b.push(tag);
        }

        if( balance[o.id] )
        {
            this.dispatcher('(beginBlack)', o );
            b.push( balance[o.id] );
        }

        if( b.length === 0 )
        {
            error('Unexpected identifier '+o.id );
        }
        return false;
    }
    this.dispatcher('(endBlack)', o);
    return true;
}

/**
 * 获取下一个语法词
 * @param flag 如果为 true 则忽略换行
 * @returns {*}
 */
Ruler.prototype.fetch=function( flag )
{
    if( this.done() ){
        return describe('(end)','','(end)');
    }
    var o;
    if( this.input.length === this.cursor )
    {
        this.move();
        o=describe('(newline)','\n','(newline)');

    }else
    {
        var s = this.input.slice(this.cursor);
        while (s.charAt(0) === " ") {
            this.cursor++;
            s = s.slice(1);
        }
        o = this.number(s) || this.keyword(s) || this.operator(s) || this.identifier(s);
        this.cursor += o.value.length;
    }
    if ( !o )throw new SyntaxError('Unexpected Illegal ' + s);
    o.line= this.line;
    o.cursor = this.cursor;
    if( o.type==='(newline)' && flag === true )
    {
        return this.fetch(flag);
    }
    return o;
}

//上一个语法词
Ruler.prototype.prev=null;

//当前的语法词
Ruler.prototype.current=null;

//下一个语法词
Ruler.prototype.next=null;

/**
 * 分析语法并获取下一个语法词
 * @param flag  如果为 true 则忽略换行
 * @returns {*}
 */
Ruler.prototype.seek=function ( flag )
{
    this.prev    = this.current;
    this.current = this.next===null ? this.fetch( true ) : this.next;
    this.next    = this.fetch( this.current.type === '(newline)' );
    if( flag === true && this.current.type==='(newline)' )return this.seek( flag );
    if( this.current.type==='(identifier)' && isBlack( this.current.value ) )
        this.balance( this.current );
    return this.current;
}

/**
 * 创建一个新的代码域
 * @param type
 * @returns {*|null}
 */
Ruler.prototype.createScope=function( scope )
{
    var b = this.__balance__.length;
    var end = function (o) {
        var c = this.__balance__.length;
        if( b===c && o.id==='}' ){
            if( this.scope().type() === 'package' )
            {
                this.scope().close=true;
            }else
            {
                this.scope().switch( this.scope().parent() );
            }
            this.removeListener('(endBlack)', end );
        }
    }
    this.addListener('(endBlack)', end );
    if( Stack.__current__ )
    {
        this.scope().add( scope );
    }
    Stack.__current__ = scope;
    return this.scope();
}

/**
 * 返回当前的作用域
 * @returns {*|null}
 */
Ruler.prototype.scope=function()
{
    return Stack.current();
}

/**
 * 步进
 * @param flag
 * @returns {*|null}
 */
Ruler.prototype.step=function()
{
    this.seek();
    if( this.check() )
    {
        this.add(this.current);
    }
    return this.current;
}

/**
 * 验证语法
 * @param o
 */
Ruler.prototype.check=function(o)
{
    o = o || this.current;
    return this.dispatcher( o.id==='(keyword)' && this.hasListener(o.value) ? o.value : o.type , o );
}

/**
 * 逐个进行语法分析
 * @param callback
 * @returns {*}
 */
Ruler.prototype.expect=function(callback)
{
    var ret = false;
    var r;
    do{
        r =this.step();
        if( callback )ret = callback.call(this,r);
    }while( ret && !this.done() )
    return r;
}

/**
 * 循环执行
 * @param callback
 * @returns {null|*}
 */
Ruler.prototype.loop=function(callback)
{
    while( !this.done() && callback.call(this) );
    return this.current;
}

/**
 * 添加语法到当前的作用域
 * @param val
 * @param index
 * @returns {boolean}
 */
Ruler.prototype.add=function( val )
{
    if(val.type==='(end)')return false;
    this.scope().add( val );
    return true;
}

/**
 * 获取关键词
 * @param s
 * @returns {*}
 */
Ruler.prototype.keyword=function(s)
{
    s = /^([a-z_$]+[\w]*)/i.exec( s )
    if( s )
    {
        var index = reserved.indexOf( s[1] );
        return describe('(identifier)', s[1] , index >= 0 ? '(keyword)' : '(identifier)' );
        return o;
    }
    return null;
}

/**
 * 获取数字类型
 * @param s
 * @returns {*}
 */
Ruler.prototype.number=function(s)
{
    if( isNumber(s) )
    {
        if( s.charAt(0)==='.' && !/\d/.test( s.charAt(1) ) )return null;
        s = /^(0x[0-9a-f]+|o[0-7]+|[\-\+]?[\d\.]+)/i.exec(s);
        return describe('(number)', s[1] , s[1] );
    }
    return null;
}

/**
 * 获取语法定界符
 * @param s
 * @returns {*}
 */
Ruler.prototype.identifier=function(s)
{
    if( isIdentifier( s.charAt(0) ) )
    {
        if( s.charAt(0)==='.' && /\d/.test( s.charAt(1) ) )return false;
        return describe('(identifier)', s.charAt(0) , s.charAt(0) );
    }
    switch( s.charAt(0) )
    {
        case '`' :
        case '"' :
        case '\'':
            var i=1;
            while ( i<s.length && !(s.charAt(0) === s.charAt(i) && s.charAt(i-1) !=='\\') )i++;
            if( s.charAt(0) !== s.charAt(i) )this.error('Missing identifier '+s.charAt(0) );
            return describe(s.charAt(0)==='`' ? '(template)' : '(string)', s.substr(0,i+1), s.charAt(0) );
        case '/':
            var i=1;
            while ( i<s.length )
            {
                var j = s.charAt(i);
                if( ( j ==='.' || j===';' ) && s.charAt(i-1) !=='\\' )break;
                i++;
            }
            var j = trim( s.substr(0,i) );
            var g= j.match(/[a-zA-Z]+$/) || '';
            if( g  )
            {
                g = g[0];
                j = j.substr(0, j.length-g.length );
            }
            if( s.charAt(0) !== j.charAt(j.length-1) )this.error('Missing identifier '+s.charAt(0) );
            new RegExp( j.slice(1,-1), g );
            return describe('(regexp)', s.substr(0,i) , s.charAt(0) );
    }
    return null;
}

/**
 * 获取运算符
 * @param s
 * @returns {*}
 */
Ruler.prototype.operator=function(s)
{
    s = getOperator(s);

    // 有可能是正则对象
    if( s==='/' && !( this.prev.type==='(number)' || isPropertyName(this.prev.value) ) )
    {
        return null;

    }else if( s==='/=' && !isPropertyName(this.prev.value) )
    {
         return null;
    }

    if( s )
    {
        if( !isOperator(s) )this.error('Unexpected operator '+s);
        return describe('(operator)', s, s);
    }
    return null;
}
