/**
 * 保护的关键词 , 不可当参数名， 不可声明为变量
 * @type {string[]}
 */
var reserved = [
    'static','public','private','protected','internal','package',
    'extends','import','class','var','let','function','new','typeof','const',
    'instanceof','if','else','do','while','for','in','of','switch','case',
    'break','default','try','catch','throw','Infinity','this',
    'finally','return','null','false','true','NaN','undefined',
];


/**
 * 系统全局对象
 * @type {string[]}
 */
var objects = [
    'Number','String','Object','RegExp','Error','EvalError','RangeError',
    'ReferenceError','SyntaxError','TypeError','URIError','Math','Function',
    'Arguments','Date','Boolean','Array','Symbol'
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
 * 判断是否为一个有效的运算符
 * @param o
 * @returns {boolean}
 */
function isOperator( o )
{
    switch (o) {
        case '.' :
        case ',' :
        case ':' :
        case '?' :
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
        case '~' :
        case '==' :
        case '!=' :
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
        case '>>>' :
        case '===' :
        case '!==' :
        case '>>>=' :
        case 'instanceof' :
        case 'in' :
        case 'new' :
        case 'typeof' :
            return true;
    }
    return false;
}


/**
 * 布尔运算符
 * @param o
 * @returns {boolean}
 */
function isBoolOperator(o)
{
    switch (o) {
        case '<' :
        case '>' :
        case '!' :
        case '<=' :
        case '>=' :
        case '==' :
        case '!=' :
        case '&&' :
        case '||' :
        case '!!' :
        case '===' :
        case '!==' :
        case 'instanceof' :
            return true;
    }
    return false;
}

/**
 * 是否为位运算符
 * @param o
 * @returns {boolean}
 */
function isBitOperator(o)
{
    switch (o) {
        case '~' :
        case '&' :
        case '|' :
        case '^' :
        case '<<' :
        case '>>' :
        case '>>>' :
            return true;
    }
    return false;
}


/**
 * 判断是否为一个标识符
 * @param s
 * @returns {boolean}
 */
function isIdentifier( o )
{
   return (o.type==='(identifier)' ||  o.type==='(string)' ||  o.type==='(regexp)' ||  o.type==='(number)') && ( o.id !== '(keyword)' || isConstant(o.value) );
}

/**
 * 判断是否为一个定界符
 * @param s
 * @returns {boolean}
 */
function isDelimiter( s )
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
 * 验证定义的类型是否存在
 * @param s
 * @param defined
 * @returns {boolean}
 */
function checkStatementType( s , defined )
{
    return s==='*' || (defined && typeof defined[s] !== "undefined" ) || objects.indexOf(s) >=0;
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

// 验证分段是否有效
function checkSegmentation( arr , require )
{
    return arr instanceof Array && arr.length > 0 ? arr.length % 2 === 1 : !require && arr.length===0 ;
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


/**
 * @param stack
 * @returns {Scope}
 */
function getParentScope( stack )
{
    stack = stack.parent();
    while ( stack && !(stack instanceof Scope) )stack = stack.parent();
    return stack;
}


// 对称符
var balance={'{':'}','(':')','[':']'};


//语法验证
var syntax={};


syntax["package"]=function (event)
{
    event.prevented=true;
    if( event.scope.keyword() !== 'package' )this.error();
    var self = this;
    var name = [];
    this.loop(function(){
        this.seek();
        if( this.current.id === '{' || this.current.id === '(keyword)' )return false;
        if( this.current.value !=='.' && !isPropertyName( this.current.value ) )self.error('Invalid package name');
        name.push( this.current.value );
        return true;
    });

    if( this.current.id !=='{' ) this.error('Missing token {');
    if( !checkSegmentation( name ) )this.error('Invalid package name');
    event.scope.name( name.join('') );

    this.loop(function(){
        if( this.next.id === '}') return false;
        this.step();
        return true;
    });
    this.seek();
    if( this.current.id !=='}' ) this.error('Missing token }');
};


/**
 * 引用模块
 * @param event
 */
syntax['import']=function (event)
{
    event.prevented=true;
    var s = event.scope;

    // import 只能出现在 package 中
    if( s.parent().keyword() !=='package' )this.error('Unexpected import ', 'syntax');

    var filename=[];
    var name=null;
    this.loop(function()
    {
         this.seek();

         //如果定义了别名
         if( this.current.value==='as' )
         {
             name = this.seek().value;
             if ( !isPropertyName(name) )this.error('Invalid alias for '+name );
             return false;
         }

         //是否到达结尾
         if( this.current.id === ';' || this.current.id==='(keyword)' || s.close() )return false;

         //是否有效
         if ( this.current.id !== '.' && !isPropertyName(this.current.value) )this.error('Invalid filename of import');
         filename.push( this.current.value );
         return true;
    });

    //关闭此语法
    this.end();

    //如果没有指定别名，默认使用类名
    if( name=== null )name = filename[filename.length-1];

    //检查文件路径名是否有效
    if( !checkSegmentation( filename, true ) )this.error('Invalid import');

    var p = s.parent();

    //防止定义重复的类名
    if( p.define(name) )error('The filename '+name+' of the conflict.')
    p.define( name , filename.join("")  );

    //从父级中删除
    p.content().pop();

    //加入到被保护的属性名中
    this.config('reserved').push( name );
};

syntax['private,protected,internal,static,public']=function(event)
{
    event.prevented=true;
    var s = this.scope();
    var n = this.seek();
    var c = event.target;
    if( (s.keyword() !=='package' && s.keyword() !=='class') || ( c.value === n.value ) || n.id !=='(keyword)' )
    {
        this.error();
    }

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

    if( n.value==='class' || n.value === 'function' )
    {
        this.beginStack();
        this.scope().static( type === 'static' );
        this.scope().qualifier( qualifier );
        this.check();

    }else if( n.value==='var' )
    {
        this.beginStack();
        this.scope().static = type === 'static';
        this.scope().qualifier = qualifier;
        this.check();

    }else
    {
        this.error('Invalid identifier '+ c.value );
    }
    return true;
};


syntax['class']=function( event )
{
    event.prevented=true;
    var s = this.scope();

    if( s.parent().keyword() !=='package' || s.keyword() !=='class' )this.error();

    //获取类名
    var n = this.seek();
    if( !isPropertyName( n.value ) )this.error('Invalid class name');
    if( s.parent().define(n.value) )error('The class '+n.value+' of the conflict.');

    //类名
    s.name( n.value );

    //将类名加入被保护的属性名中
    this.config('reserved').push( n.value );

    n = this.seek();

    //是否有继承
    if( n.id==='(keyword)' && n.value==='extends' )
    {
        n = this.seek();
        s.extends( n.value );
        this.seek();
    }
    if( this.current.id !=='{' )this.error('Missing token {');
    this.loop(function(){
        if( this.next.id === '}' ) return false;
        this.step();
        return true;
    });
    this.seek();
    if( this.current.id !=='}' ) this.error('Missing token }');
};


syntax['var']=function (event)
{
    event.prevented=true;
    var s  = this.scope();
    if( s.keyword() !== event.type ){
       s = new Stack( event.type , '*');
       this.add( s );
    }

    if( s.keyword()==='var' )
    {
        this.add( this.current );
    }

    var type = '*';
    var name = this.seek().value;

    //获取声明的类型
    if( this.next.id===':' )
    {
        var current = this.current;
        var prev = this.prev;
        this.seek();
        type = this.seek().value;
        this.current= current;
        this.prev = prev;
    }

    //检查属性名是否可以声明
    if( !checkStatement(name, this.config('reserved') ) )
    {
        this.error();
    }

    var ps = getParentScope(s);

    //检查声明的类型是否定义
    if( !checkStatementType(type, ps.define() ) )this.error( type+' not is defined');

    if( ps.keyword()==='function' )
    {
        //不能重复声明属性
        if( ps.define( name ) )this.error();
        ps.define(name, type);
    }

    this.add( new Stack('expression', type) );
    this.add( this.current );
    if( this.next.id === '=' )
    {
        this.add( this.seek() );
        this.step();
    }

    if( this.next.id===',' )
    {
        this.scope().switch();
        this.add( this.seek() );
        syntax['var'].call(this,event);
    }
};


syntax['function']= function(event){

    event.prevented=true;
    this.add( this.current );
    var s = this.scope()
    var n = this.seek();
    if( s.parent().keyword() === 'class' && (n.value === 'get' || n.value === 'set') && this.next.id !== '(' )
    {
        s.accessor(n.value);
        n = this.seek();
    }

    if( n.id !== '(' )
    {
        if ( !checkStatement(n.value) )this.error();
        var ps = getParentScope(s);
        if( ps )
        {
            //不能重复声明函数
            if( ps.define( n.value ) )this.error();
            ps.define(n.value,'(function)');
        }
        s.name( n.value );
        this.add( this.current );
        n = this.seek();
    }


    // 类中定义的方法不能为匿名函数
    if( s.parent().keyword() === 'class' && !s.name() )
    {
        this.error('Missing function name');
    }

    //验证访问器的参数
    if( s.parent().keyword() === 'class' )
    {
        if (s.accessor() === 'get' && s.param().length > 0)this.error('Invalid accessor get.');
        if (s.accessor() === 'set' && s.param().length !== 1)this.error('Invalid accessor set.');
    }

    this.add( this.current );
    if( n.id !== '(' )this.error('Missing token (');

    //获取函数声明的参数
    if( this.next.id !==')' )
    {
        this.add( new Stack('param', '*') );
        syntax['var'].call(this,{target:this.current,type:'param'});
        if( this.scope().keyword()==='expression' ) this.scope().switch();
        if( this.scope().keyword()==='param' ) this.scope().switch();
    }

    this.add( this.seek() );
    if( this.current.id !==')' ) this.error('Missing token )');

    //返回类型
    if( this.next.id===':' )
    {
        this.seek();
        var type = this.seek();
        var ps   = getParentScope( s );
        if( checkStatementType(type, ps.define() ) )this.error( type+' not is defined');
        s.type( type.value );
    }

    this.add( this.seek() );
    if( this.current.id !=='{' ) this.error('Missing token {');
    this.loop(function(){
         if( this.next.id === '}' ) return false;
         this.step();
         return true;
    });
    this.add( this.seek() );
    if( this.current.id !=='}' ) this.error('Missing token }');
};


syntax['else']= function(event)
{
    if( this.scope().keyword() !== event.type )this.error();
    var p = this.parent().previous(-2);
    if( p.keyword()!=='if' )this.error();
    event.prevented=true;
    this.add( this.current );

    if( this.next.value==='if' )
    {
        var self= this;
        this.addListener('(add)',function(val){
            if( val.keyword() !=='if' )self.error();
            val.addListener('(switch)',function(){ this.parent().switch()});
        })
        this.step();

    }else if( this.next.id === '{' )
    {
        this.add( this.seek() );
        this.loop(function(){
            if( this.next.id==='}' )return false;
            this.step();
            return true;
        })
        this.add( this.seek() );
        if( this.current.id !=='}' )this.error('Missing token }');
    }
}

syntax['do,try,finally'] = function(event)
{
    event.prevented = true;
    if( this.scope().keyword() !== event.type )this.error();
    this.add( this.current );

    if( event.type==='finally' )
    {
        var p = this.scope().parent().previous(-2);
        if( !p || !(p.keyword() === 'catch' || p.keyword()==='try') ) this.error();
    }

    this.add( this.seek() );
    if( this.current.id !== '{' ) this.error();

    this.loop(function(){
        if( this.next.id==='}' )return false;
        this.step();
        return true;
    });
    this.add( this.seek() );
    if( this.current.id !== '}' ) this.error();
    if( event.type==='do' && this.next.value !== 'while' )this.error();
}


syntax['if,switch,while,for,catch'] = function(event)
{
    event.prevented = true;
    if( this.scope().keyword() !== event.type )this.error();

    if( event.type==='catch' )
    {
        var p = this.scope().parent().previous(-2);
        if( !p || p.keyword() !== 'try' ) this.error();
    }

    this.add(this.current);
    this.add( this.seek() );
    if( this.current.id !== '(' ) this.error('Missing token (');

    var s = this.scope();
    this.add( new Stack('param','*') );

    //获取条件表达式
    this.loop(function(){
        if( this.next.id===')' )return false;
        this.step();
        return true;
    });

    if( this.scope().keyword()==='expression' )this.scope().switch();
    if( this.scope().keyword()==='param' )this.scope().switch();

    //跳到下一个结束符 )
    this.add( this.seek() );
    if( this.current.id !== ')' )this.error('Missing token )');

    // switch catch 必须要 {}
    if( ( event.type === 'switch' || event.type === 'catch' ) && this.next.id!=='{' )this.error('Missing token {');
    if( this.next.id==='{' )
    {
        this.add( this.seek() );
        this.loop(function () {
            if( this.next.id==='}' )return false;
            this.step();
            return true;
        });
        this.add( this.seek() );
        if( this.current.id !== '}' )this.error('Missing token }');

    }else
    {
        this.loop(function(){

            if( this.next.id ===';' || s.close() )return false;
            this.step();
            return true;
        });
        if( this.next.id ===';' )this.add( this.seek() );
        if( this.current.id===';' )this.scope().switch();
        if( !s.close() ){
            this.error('syntax not end');
        }
    }
}

syntax["return"]=function(event)
{
     event.prevented=true;
     if( this.scope().keyword()==='expression' )this.error();
     this.add( new Stack('expression','(*)') );
     this.add( this.current );
     this.step();
}

syntax["in"]=function(e)
{
     //in 运算符 var name in property  'name' in property
     if( !(this.scope().keyword()==='expression' || this.scope().keyword()==='var') )this.error();

     //var 中的 in 只能在 for 表达式中
     if( this.scope().keyword()==='var' && this.scope().parent().keyword() !== 'for' )this.error();

    e.prevented=true;
    this.add( this.current );
    if( !(this.scope().keyword() ==='var' || this.scope().keyword() ==='for') )
       this.step();
}

syntax["typeof"]=function(e)
{
    e.prevented=true;
    if( this.scope().keyword()!=='expression')
    {
        this.add( new Stack('expression', '(string)' ) );
    }
    this.add( this.current );
    this.step();
}

syntax["new"]=function(e)
{
    e.prevented=true;
    if( this.scope().keyword()!=='expression')
    {
        this.add( new Stack('expression', '('+this.next.value+')' ) );
    }
    this.add( this.current )
    this.step();
}

syntax['(delimiter)']=function( e )
{
    var id = this.current.value;
    if( balance[id] )
    {
         e.prevented=true;
         var s = new Stack('expression', id==='(' ? '(expression)' : id==='[' ? '(array)' : '(object)');
         this.add( s );
         this.add( this.current );
         this.loop(function () {
            if (this.next.value === balance[id] ) return false;
            if( this.scope() === s )this.add(  new Stack('expression','(*)') );
            this.step();
            return true;
         });

         this.add( this.seek() );
         if( this.current.value !== balance[id ] )this.error();

         //结束表达式
         if( this.scope().keyword()==='expression')this.scope().switch();
         if( s === this.scope() )this.scope().switch();
         if( !s.close() )this.error();
         if( isOperator(this.next.value) )this.step();
         if(  balance[this.next.value] )this.step();
    }
}

syntax['(operator)']=function( e )
{
    var s = this.scope();
    var id = this.current.value;
    e.prevented=true;
    if( s.keyword() !=='expression' )
    {
        this.add( new Stack('expression','(*)') );
    }
    this.add( this.current );

    //先后运算符
    if( id===','  )
    {
        if( s.keyword() ==='expression' )s.switch();
        this.add( this.current );
        this.step();
    }
    //如果是点运算符
    else if( id==='.' )
    {
        //数字后面不能有点运算符
        if( this.prev.type==='(number)' ) this.error();

        //点运算符后面只能是属性名
        if( !isPropertyName(this.next.value) ) this.error();
        this.step();

    }
    //三元运算符
    else if( id==='?' || id===':' )
    {
        this.scope().content().pop();
        this.scope().switch();
        var s =  this.scope();
        this.add( this.current  );
        this.add( new Stack('expression','(*)')  );
        this.step();
       // if( s.previous(-2).id!==':'  ) this.error('Missing token :');
    }
    //如果是数学运算符
    else if( id==='-' || id==='*' || id==='/' || id==='%' )
    {
        if (!(this.prev.type === '(number)' || this.prev.type === '(identifier)' && this.prev.id !== '(keyword)'))this.error();
        if (!(this.next.type === '(number)' || this.next.type === '(identifier)' && this.next.id !== '(keyword)'))this.error();
        this.step();
    }
    //运算并赋值
    else if( id==='+=' || id==='-=' || id==='*=' || id==='/=' || id==='%=' )
    {
        if( this.prev.type !=='(identifier)' || this.prev.id==='(keyword)' )this.error();

        //下一个必须是数字或者引用的数字(+=)除外
        if( id !=='+=' && !(this.next.type==='(number)' || this.next.type ==='(identifier)' && this.next.id!=='(keyword)') )this.error();
        this.step();

    }
    //赋值
    else if( id==='=' )
    {
        if( this.prev.type !=='(identifier)' || this.prev.id==='(keyword)' )this.error();
        this.step();
    }

    if( this.next.value==='{' && this.current.line===this.next.line )this.error();
    if( this.next.value==='(' || this.next.value==='[' ||  isIdentifier( this.next ) )
    {
        this.step();
    }
}

syntax['(identifier)']=function( e )
{
    var s = this.scope();
    var id = this.current.value;
    e.prevented=true;
    if( id===';' )return;

    //如果不是表达式
    if( s.keyword() !=='expression' )
    {
        s = new Stack('expression','(*)');
        this.add( s );
    }
    this.add( this.current );
    if( this.next.value==='{' && this.current.line===this.next.line )this.error();
    if( this.next.type === '(operator)' || this.next.value==='(' || this.next.value==='[' )
    {
        this.step();
    }
}

syntax['(string),(number),(regexp)']=function( e )
{
    var s = this.scope();
    e.prevented=true;

    //如果不是表达式
    if( s.keyword() !=='expression')
    {
        s = new Stack('expression','(*)');
        this.add( s );
    }

    this.add( this.current );
    if( (this.next.value==='(' || this.next.value==='[') && this.current.line===this.next.line )this.error();
    if( isOperator(this.next.value) )
    {
        this.step();
    }
}


/**
 * 抛出错误信息
 * @param msg
 * @param type
 */
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
 * 事件对象
 * @param type
 * @constructor
 */
function Event( type, props )
{
    if( !(this instanceof Event) )return new Event(type, props )
    if( typeof props === "object" ) merge(this, props);
    this.type = type;
    this.prevented=false;
    this.stopPropagation=false;
}

Event.prototype.constructor=Event;
Event.prototype.type='';
Event.prototype.target=null;
Event.prototype.prevented=false;
Event.prototype.stopPropagation=false;


/**
 * 事件侦听器
 * @constructor
 */
function Listener() {
    if( !(this instanceof Listener) )return new Listener()
    this.events={};
}

/**
 * 指定构造函数为事件侦听器
 * @type {Listener}
 */
Listener.prototype.constructor = Listener;

/**
 * 调度事件
 * @param event 事件对象
 * @param options 引用的对象
 * @returns {boolean}
 */
Listener.prototype.dispatcher=function( event )
{
    var type = event.type || event;
    if( this.events[type] && this.events[type].length > 0 )
    {
        var listener = this.events[type].slice();
        var len = listener.length;
        for ( var i =0; i<len; i++)
        {
            listener[i].callback.call(this, event)
            if( event.stopPropagation )
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
function Stack( keyword, type )
{
    if( !(this instanceof Stack) )return new Stack(keyword, type)
    this.__content__=[];
    this.__parent__ =null;
    this.__type__   = type;
    this.__keyword__ = keyword;
    this.__name__='';
    this.__close__  =false;
    Listener.call(this);

    this.addListener('(end)', function (e) {
        if( !(this instanceof Scope) || e.target.id === '}' )
        {
            if( this.switch() && e.target.id===';' &&  this.parent() )
            {
                this.parent().dispatcher( e );
            }
        }
    });
}

// 全局属性， 保存为当前的代码块的作用域
Stack.__current__=null;

/**
 * 返回当前的作用域
 * @returns {*|null}
 */
Stack.current=function()
{
    if( Stack.__current__=== null )
    {
        Stack.__current__ = new Stack('rootblack','(rootblack)');
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
 * 关键字
 * @param keyword
 * @returns {*}
 */
Stack.prototype.keyword=function()
{
    return this.__keyword__;
}

/**
 * 作用域的名称
 * @param name
 * @returns {*}
 */
Stack.prototype.name=function( name )
{
    if( typeof name === 'string' )
    {
        this.__name__=name;
        return this;
    }
    return this.__name__;
}


/**
 * 设置类型
 * @param name
 * @returns {*}
 */
Stack.prototype.type=function( type )
{
    if( typeof type === 'string' ){
        this.__type__=type;
        return this;
    }
    return this.__type__;
}

/**
 * 是否已关闭
 * @returns {boolean}
 */
Stack.prototype.close=function()
{
    return this.__close__;
}

/**
 * 添加代码语法
 * @param val object | Stack
 * @returns {bool}
 */
Stack.prototype.add=function( val, index )
{
    if( this.close() )
    {
        error('stack is end');
    }
    if( !val )error('Invalid val')
    var event = new Event('(add)', {target:val} );
    this.dispatcher( event );
    val = event.target;
    if( !event.prevented )
    {
        if( val instanceof Stack )
        {
            if( val === this )error('Invalid child');

            //堆叠器中不能添加结构体 比如 if else switch do while try for catch finally
            if( this.keyword() !== 'rootblack' && !(this instanceof Scope) && val.type() ==='(black)' )
            {
                console.log( this )
                error('Invalid syntax ' + val.keyword() );
            }

            //指定的子级的父级对象的引用
            val.__parent__ = this;

            //把添加的子级设置为当前的容器
            Stack.__current__= val;

            //如当前的子级是一个块级作用域则引用父级域中定义的属性
            if( this.type() !== '(rootblack)' && val instanceof Scope )
            {
                var parentScope = getParentScope( val );
                if( parentScope )merge(val.__define__, parentScope.__define__ );
            }
        }

        index = index || this.length();
        this.__content__.splice(index,0,val);
        return true;
    }
    return false;
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
 * 返回上一个在作用域中的语法
 * @param step 可以是一个回调函数， 也可以是一个负数字
 * @returns {*}
 */
Stack.prototype.previous=function ( step )
{
    var c = this.content();
    var index =  typeof step === "number" ? step : -1;
    var i = index < 0 ? c.length+index : index;
    var r = c[ i ];
    if( typeof step === "function"  )
    {
        while ( step.call(this, r ) && ( r=this.previous( --index ) ) );
    }
    return r;
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
 * 切换到父级堆叠容器
 * @param stack
 * @returns {boolean}
 */
Stack.prototype.switch=function()
{
    if( this.close() )return true;
    var stack = this.parent();
    if( stack )
    {
        var event = new Event('(switch)', {parent:stack} );
        this.dispatcher( event );
        stack =  event.parent;
        if( !event.prevented )
        {
            this.__close__ = true;
            Stack.__current__ = stack;
            return true;
        }

    }else if( this.keyword() === 'rootblack' )
    {
        this.__close__ = true;
        return true;
    }
    return false;
}


/**
 * 代码语法个数
 * @returns {Number}
 */
Stack.prototype.toString=function()
{
    var data = this.content();
    var str = [];
    var i = 0;
    var len = data.length;
    for ( ; i< len ; i++ )
    {
        if( data[i] instanceof Stack )
        {
            if( data[i] instanceof Scope )
            {
                str.push('\n');
                str.push( data[i].toString() );
                str.push('\n');

            }else
            {
                str.push( data[i].toString() );
            }

        }else
        {
            str.push(data[i].value);
            if( data[i].value==='{')str.push('\n');
            if( (data[i].type==='(identifier)' || data[i].id==='(keyword)' ) &&
                (data[i+1] && (  data[i+1] instanceof Stack || data[i+1].type==='(identifier)' || data[i+1].id==='(keyword)') ) )
                str.push(' ');

        }
    }

    var p =  this.parent();
    if( p && this.keyword()!=='param' && p instanceof Scope && !(this instanceof Scope) )
    {
        if( this === p.content()[ p.length()-1]  || this.keyword()==='var' )
            str.push(';\n');
    }
    return str.join('');
}


/**
 * 代码块的作用域
 * @param type
 * @constructor
 */
function Scope( keyword, type )
{
    if( !(this instanceof Scope) )return new Scope(keyword, type)
    this.__param__=[];
    this.__define__ ={};
    this.__qualifier__='';
    this.__static__= false ;
    this.__accessor__= '' ;
    this.__extends__='';
    Stack.call(this,keyword,type);
}
Scope.prototype = new Stack();
Scope.prototype.constructor=Scope;


/**
 * 声明和引用属性
 * @param prop 属性名称
 * @param type 属性类型
 * @returns {*}
 */
Scope.prototype.define=function(prop , type )
{
    if( typeof prop === 'undefined' )return this.__define__;
    if( typeof prop === 'string' &&  typeof type === 'undefined' )
    {
        return this.__define__[prop];
    }
    this.__define__[prop]=type;
    return this;
}


/**
 * 添加参数
 * @param name
 * @returns {*}
 */
Scope.prototype.param=function( name )
{
    if( typeof name !== 'undefined' )
    {
        this.__param__.push( name );
        return this;
    }
    return this.__param__;
}



/**
 * 访问器类型
 * @param name get|set
 * @returns {Scope|String}
 */
Scope.prototype.accessor=function( accessor )
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
Scope.prototype.qualifier=function(qualifier )
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
Scope.prototype.static=function(flag )
{
    if( flag=== true ){
        this.__static__=true;
        return this;
    }
    return this.__static__;
}

/**
 * 是否有继承
 * @param name
 * @returns {*}
 */
Scope.prototype.extends=function( name )
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
    Listener.call(this);
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
 * 调度事件
 * @param event 事件对象
 * @param options 引用的对象
 * @returns {boolean}
 */
Ruler.prototype.dispatcher=function(event)
{
    event.target = event.target || this.current;
    return Listener.prototype.dispatcher.call(this, event );
}

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
 * 抛出错误消息
 * @param msg
 * @param type
 */
Ruler.prototype.error=function (msg, o)
{
    o = o || this.current;
    msg =  msg || 'Unexpected token '+o.value;
    console.log( 'error line:', o.line, '  character:', o.cursor, o );
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
    var s = this.scope();
    var tag = b.pop();

    if ( o.id !== tag )
    {
        if( tag )
        {
            if( !balance[o.id] )
            {
                this.error('Unexpected identifier '+o.id );
            }
            b.push(tag);
        }

        if( balance[o.id] )
        {
            if( typeof s.balance === "undefined" )
            {
                s.balance = b.length;
                s.dispatcher( new Event('(begin)', {target:o, ruler:this} ) );
            }
            b.push( balance[o.id] );
        }

        if( b.length === 0 )
        {
            this.error('Unexpected identifier '+o.id );
        }
        return false;
    }

    if( s.balance === b.length )
    {
        s.dispatcher( new Event('(end)',  {target:o, ruler:this} ) );
    }
    return true;
}

/**
 * 获取语法描述
 * @returns {*}
 */
Ruler.prototype.seek=function( flag )
{
    var o;
    if( this.done() )
    {
        o = describe('(end)','','(end)');
        this.scope().dispatcher( new Event('(end)', {target:o, ruler:this}) );

    }else
    {
        if (this.input.length === this.cursor)
        {
            this.move();
            o = describe('(newline)','','(newline)');
            o.line= this.line;
            o.cursor = this.cursor;
            this.hasListener('(newline)') && this.dispatcher( new Event('(newline)', {target:o, ruler:this}) );
            return this.seek( flag );

        } else
        {
            var s = this.input.slice(this.cursor);
            while (s.charAt(0) === " ") {
                this.cursor++;
                s = s.slice(1);
            }
            if (!s)return this.seek();
            o = this.number(s) || this.keyword(s) || this.operator(s) || this.identifier(s);
            if (!o)this.error('Unexpected Illegal ' + s);
            this.cursor += o.value.length;
        }
    }

    //如果当前是空或者没有结束
    if( !this.current || this.current.id !=='(end)' )
    {
        o.line= this.line;
        o.cursor = this.cursor;
        this.prev = this.current;
        this.current = this.next;
        this.next    = o;
        if (this.current === null)return this.seek( flag );
    }

    //seek before dispatch event
    this.hasListener('(seek)') && this.dispatcher(new Event('(seek)', {target: this.current,scope:this.scope()}));

    //检测块级代码堆叠器是否到达结束位置
    if( this.current.type==='(delimiter)' && isDelimiter( this.current.value ) )
    {
        this.balance(this.current);
    }
    //是否可以结束表达式
    else if( this.scope().keyword()==='expression' || this.current.id===';' )
    {
        if( this.current.id===';' )
        {
            this.scope().dispatcher( new Event('(end)',  {target:this.current, ruler:this} ) );

        }else if( this.next.id !== ';' && isIdentifier(this.next) && isIdentifier( this.current ) )
        {
            //如果没有换行
            if( this.current.line === this.next.line )this.error('syntax not end');
            this.scope().dispatcher( new Event('(end)',  {target:this.current, ruler:this} ) );
        }
    }
    return this.current;
}

//上一个语法词
Ruler.prototype.prev=null;

//当前的语法词
Ruler.prototype.current=null;

//下一个语法词
Ruler.prototype.next=null;


/**
 * 返回当前的作用域
 * @returns {Scope}
 */
Ruler.prototype.scope=function()
{
    return Stack.current();
}


/**
 * 指定结束点
 * @returns {*|null}
 */
Ruler.prototype.end=function( stack )
{
    stack = stack || Stack.current();

    //块级必须用定界符结束(if,else,for,while)除外
    if( stack.close() || (stack instanceof Scope && !(stack.keyword()==='if' || stack.keyword()==='else' || stack.keyword()==='for' || stack.keyword()==='while' ) ) )return true;
    if( this.current.id === ';')
    {
        stack.switch();
        return true;

    }else if( this.next.id===';' )
    {
        this.seek();
        return this.end( stack );

    }else if( (this.next.id ===')' || this.next.id ===']' || this.next.id ==='}' || this.next.id ==='?' || this.next.id ===':') && !(stack instanceof Scope) )
    {
        stack.switch();
        return true;
    }
    if( !(stack instanceof Scope) )this.error('is not close syntax');
}

/**
 * 生成代码堆叠器
 * @returns {*}
 */
Ruler.prototype.beginStack = function()
{
    var id =  this.current.id;
    var value = this.current.value;
    var stack = null;
    var type  = '(black)';
    if( id==='(keyword)' )
    {
        switch ( value )
        {
            case 'package' :
            case 'class'   :
                stack = new Scope(value, '(black)' );
                break;
            case 'function':
                stack = new Scope(value, '(function)');
                break;
            case 'do'      :
            case 'while'   :
            case 'for'     :
            case 'if'      :
            case 'else'    :
            case 'switch'  :
            case 'try'     :
            case 'catch'   :
            case 'finally' :
                stack = new Scope(value,type);
                break;
            case 'import'  :
            case 'var'     :
                stack = new Stack(value, '(*)' );
                break;
        }
    }
    if( stack )this.add( stack );
    return stack;
}


/**
 * 步进
 * @param flag
 * @returns {*|null}
 */
Ruler.prototype.step=function()
{
    this.seek();
    this.beginStack();
    var index = this.scope().length();
    var event = this.check();
    if( !event.prevented && event.target )
    {
        this.add( event.target , index );
    }
}

/**
 * 验证语法
 * @param o
 */
Ruler.prototype.check=function( o )
{
    o = o || this.current;
    var type = o.id==='(keyword)' && this.hasListener(o.value) ? o.value : o.type;
    var event= new Event( type, {target:o, scope: this.scope()} );
    this.dispatcher( event );
    return event;
}

/**
 * 开始分析
 * @returns {Scope}
 */
Ruler.prototype.start=function()
{
    do{
       this.step();
    }while( !this.done() )
    return this.scope();
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
Ruler.prototype.add=function( val , index )
{
     if(val.type==='(end)')return false;
     try {
        this.scope().add(val, index);
     }catch (e)
     {
        this.error(e.message);
     }
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
        var type = '(identifier)';
        if( isOperator( s[1] )  )type='(operator)';
        return describe(type, s[1] , index >= 0 ? '(keyword)' : '(identifier)' );
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
    if( s.charAt(0)==='.' && !/\d/.test( s.charAt(1) ) )return null;
    if( /^(0x[0-9a-f]+|o[0-7]+|[\-\+]?[\d\.]+)/i.exec(s) )
    {
        return describe('(number)', RegExp.$1 , RegExp.$1 );
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
    if( s.charAt(0)===';' )
    {
        if( s.charAt(0)==='.' && /\d/.test( s.charAt(1) ) )return null;
        return describe('(identifier)', s.charAt(0) , s.charAt(0) );

    }else if( isDelimiter(s.charAt(0)) )
    {
        return describe('(delimiter)', s.charAt(0) , s.charAt(0) );
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

//@private
var operator_reg = /[\.\,\:\?\!\|\&\+\-\*\/\>\<\%\~\=\^]/;

/**
 * 获取运算符
 * @param s
 * @returns {*}
 */
Ruler.prototype.operator=function(s)
{
    var index = 0;
    while( operator_reg.test( s.charAt( index ) ) )index++;
    if( index === 0 )return null;

    s = s.substr(0, index);

    //有可能是正则对象
    if( s==='/' && !( this.prev.type==='(number)' || isPropertyName(this.prev.value) ) )
    {
        return null;
    }
    //如果不是赋值运算
    else if( s==='/=' && !isPropertyName(this.prev.value) )
    {
         return null;
    }
    //声明的类型 var name:*=123;
    else if( s==='*=' && this.next.id===':' )
    {
        return describe('(operator)', s.charAt(0), s.charAt(0) );
    }

    if( s )
    {
        if( !isOperator(s) )this.error('Unexpected operator '+s);
        return describe('(operator)', s, s);
    }
    return null;
}

module.exports = Ruler;
