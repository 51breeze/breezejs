/**
 * 保护的语法关键词 , 不可当参数名， 不可声明为变量
 * @type {string[]}
 */
const reserved = [
    'static','public','private','protected','internal','package','override','final',
    'extends','import','class','var','let','function','new','typeof','const','interface','implements',
    'instanceof','if','else','do','while','for','in','of','switch','case','super',
    'break','default','try','catch','throw','Infinity','this','debugger',
    'finally','return','null','false','true','NaN','undefined','delete',
    /*'export',*/
];

/**
 * 判断是否为一个有效的运算符
 * @param o
 * @returns {boolean}
 */
function isOperator( o )
{
    switch (o) {
        //case ';' :
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
        case '&&=' :
        case '||=' :
        case '<<=' :
        case '>>=' :
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
 * 前置运算符
 * @param o
 * @returns {boolean}
 */
function isLeftOperator(o)
{
    switch (o) {
        case '~' :
        case '--' :
        case '++' :
        case '!' :
        case '!!' :
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
        case '&&=' :
        case '||=' :
        case '&&' :
        case '||' :
        case '!!' :
        case '===' :
        case '!==' :
        case 'instanceof' :
        case 'in' :
            return true;
    }
    return false;
}

/**
 * 逻辑运算符
 * @param o
 * @returns {boolean}
 */
function isLogicOperator(o)
{
    switch (o) {
        case '&&=' :
        case '||=' :
        case '&&' :
        case '||' :
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
    return (o.type==='(identifier)' || o.type==='(string)' || o.type==='(template)' || o.type==='(regexp)' || o.type==='(number)') &&
        ( o.id !== '(keyword)' || isConstant(o.value) );
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
 * @param include 包括这里指定的，不可以再声明
 * @returns {boolean}
 */
function checkStatement(s, include )
{
    return isPropertyName(s) && reserved.indexOf( s )<0 && ( !include || include.indexOf(s)<0 );
}

/**
 * 验证定义的类型是否存在
 * @param s
 * @param defined
 * @returns {boolean}
 */
function checkStatementType( type , scope , globals )
{
    if( type==='*' || type==='void' )return true;
    if( globals && globals[type] && globals[type].id==='class' )return true;
    if( scope )
    {
        scope = rootScope( scope , 'class' );
        if( scope )
        {
            scope=scope.scope();
            var val = scope.define( type );
            if( !val )
            {
                var def = scope.define();
                for (var i in def)if (def[i].fullclassname === type)
                {
                    val= def[i];
                    break;
                }
            }
            return val && val.id==='class' ? val : null;
        }
    }
    return null;

}

/**
 * 获取根作用域
 * @param scope
 * @returns {null}
 */
function rootScope( scope , root )
{
    root = root || 'package';
    while ( scope && scope.keyword() !== root && scope.parent() )scope = scope.parent();
    return scope && scope.keyword() === root ? scope : null;
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
 * 判断是否为一个恒定的值
 * @param val
 * @returns {boolean}
 */
function isConstant(val)
{
    switch ( val )
    {
        case 'null' :
        case 'undefined' :
        case 'true' :
        case 'false' :
        case 'NaN' :
        case 'Infinity' :
        case 'this' :
            return true;
            break;
    }
    return false;
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


/**
 * @param stack
 * @returns {Scope}
 */
function getParentFunction( stack )
{
    stack = stack.parent();
    while ( stack ){
        if( stack.keyword()==='function' || stack.keyword()==='class' )return stack;
        stack = stack.parent();
    }
    return null;
}


// 对称符
var balance={'{':'}','(':')','[':']'};


//语法验证
var syntax={};


syntax["package"]=function (event)
{
    event.prevented=true;
    if( this.scope().keyword() !=='rootblock' )this.error();
    this.add( new Scope('package', '(block)' ) );
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
    var e = new Event('checkPackageName',{value:name.join('')});
    this.dispatcher( e )
    this.scope().name( e.value );
    this.loop(function(){
        if( this.next.id === '}') return false;
        this.step();
        return true;
    });
    this.seek();
    if( this.current.id !=='}' ) this.error('Missing token }');
};


function importClass( classname, filename , scope )
{
    //如果没有指定别名，默认使用类名
    if( classname=== null )
    {
        //取类名
        classname = filename[ filename.length-1 ];

        //如果类名已定义则取全名
        if( scope.define(classname) )classname = filename.join('');
    }

    //检查文件路径名是否有效
    if( !checkSegmentation( filename, true ) )this.error('Invalid import');

    var desc = {'type':'('+classname+')','id':'class','fullclassname':filename.join(""),'classname':classname };

    //防止定义重复的类名
    if( scope.define(classname) )error('class name the "'+classname+'" is already been defined');

    //将类描述信息定义到域中
    scope.define(classname , desc );

    //加入到被保护的属性名中
    //this.config('reserved').push( name );

    var current = Stack.current();
    this.dispatcher( new Event('loadModule',{name:desc.fullclassname}) );
    Stack.__current__=current;
}


/**
 * 引用模块
 * @param event
 */
syntax['import']=function (event)
{
    event.prevented=true;

    // import 只能出现在 package 中
    if( this.scope().keyword() !=='package' )this.error('Unexpected import ', 'syntax');
    var index = this.scope().length();
    this.add( new Stack('import', '(string)' ) );
    var s = this.scope();
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

        //目录下的所有文件
        if( this.current.value==='*' && this.prev.value==='.' )
        {
            filename.pop();
            this.dispatcher( new Event('fetchFiles',{path:filename.join(''),scope:s.scope(),callback:importClass}) );
            filename=[];
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

    //从父级中删除
    s.parent().content().splice(index, s.parent().length()-index);
    if( filename.length > 0 )importClass.call(this, name , filename, s.scope() );
};

syntax['private,protected,internal,static,public,override,final']=function(event)
{
    event.prevented=true;
    var scope = this.scope();
    if( scope.keyword() !=='package' && scope.keyword() !=='class' )this.error();
    var arr = [event.target.value];
    var self= this;
    var n;
    var description={};
    description[event.target.value]=event.target;
    this.loop(function(){
        if( 'private,protected,internal,static,public,override,final'.indexOf( this.next.value )<0 )return false;
        n = this.seek();
        if( arr.indexOf(n.value) >=0  )self.error();
        arr.push( n.value );
        description[n.value]=n;
        return true;
    });

    var q = 'public';
    var s ='';
    var o = '';
    var f = '';
    for (var i =0; i<arr.length; i++)
    {
        switch (arr[i])
        {
            case 'static'  :s='static'  ;break;
            case 'override':o='override';break;
            case 'final'   :
                f='final';
                if( arr.indexOf('override')>=0 )this.error();
                break;
            default:q=arr[i];
        }
    }

    n = this.seek();

    // override 只能出现在函数的修饰符中
    if( o && n.value !== 'function' )this.error('Invalid override.');
    if( o && this.scope().keyword() === 'class' && !this.scope().extends() )this.error('The "override" only can be used in subclasses.');

    //如是静态类，那么整个类不能实例化
    if( scope.keyword() ==='class' && scope.static() )s = scope.static();

    if( n.value==='class' || n.value === 'function' )
    {
        if( n.value==='class' )
        {
            this.add( new Class() );
        }else {
            this.add(new Scope(n.value, '(block)'));
        }
        this.scope().static( s );
        this.scope().qualifier( q );
        this.scope().override( o );
        this.scope().final( f );
        this.scope().description=description;
        this.check();

    }else if( n.value==='var' || n.value==='const' )
    {
        this.add( new Stack(n.value, '(*)' ) );
        this.scope().static( s );
        this.scope().qualifier( q );
        this.scope().override( o );
        this.scope().final( f );
        this.scope().description=description;
        this.check();

    }else
    {
        this.error('Invalid identifier '+n.value );
    }
    return true;
};

syntax['class']=function( event )
{
    event.prevented=true;
    if( this.scope().keyword() !=='class' )this.add( new Class() );
    if( this.scope().parent().keyword() !=='package' )this.error();

    var scope = this.scope();
    var n = this.seek();

    //检查类名是否合法声明
    if( !checkStatement(n.value) )this.error('Invalid class name');

    var e = new Event('checkClassName',{value:n.value});
    this.dispatcher( e );
    var name = e.value;

    //设置类名
    scope.name( name );

    //完整的类名
    var classname = this.scope().parent().name() ? this.scope().parent().name()+'.'+name : name;

    //类名不能与导入的类名相同
    var def = scope.parent().scope().define();
    for (var i in def)if (def[i].fullclassname === classname)
    {
        this.error('class name the "'+name+'" is already been declared',this.current);
    }

    //实例作用域
    scope.scope().define('this', {'type':'('+name+')','id':'class','fullclassname':classname,'classname':name} );

    //静态类作用域
    scope.scope().define(name, {'type':'('+name+')','id':'class','fullclassname':classname ,'classname':name} );

    //将类名加入被保护的属性名中
    //this.config('reserved').push( name );

    n = this.seek();

    //是否有继承
    if( n.id==='(keyword)' && n.value==='extends' )
    {
        //获取完整的类名
        var parent = getTypeName.call(this);

        //是否有导入
        var p = checkStatementType(parent, scope.parent().scope(),  this.config('globals')  );
        if( !p ) this.error('"'+parent+'" is not import');
        scope.extends( p.classname );

        //定义超类引用
        scope.scope().define('super', p );
        this.seek();
    }

    //必须要{开始正文
    if( this.current.id !== '{' )this.error('Missing token {');

    //获取正文
    this.loop(function(){
        if( this.next.id === '}' ) return false;
        this.step();
        return true;
    });

    //必须要}结束正文
    this.seek();
    if( this.current.id !=='}' ) this.error('Missing token }');
};


syntax['var,let']=function (event)
{
    event.prevented=true;
    if(this.scope().keyword() !== event.type )this.add( new Stack( event.type, '(*)' ) );
    this.add( this.current );

    this.scope().name( this.next.value );
    var parent = this.scope().parent();

    //var 只能出现在块级或者for中
    if( !(parent instanceof Scope) )
    {
        while( parent && parent.keyword() !== 'for' )parent = parent.parent();
        if( !parent )this.error();
    }
    if( this.next.type!=='(identifier)' || this.next.id==='(keyword)' )this.error('Invalid identifier for '+this.next.value,  this.next );
    var variable = this.scope();
    var statement =  new Stack('statement' , '(expression)');
    this.add( statement );
    this.step();

    if( parent.keyword()==='for' )
    {
        //end expression
        if( this.scope().keyword()==='expression') this.scope().switch();
        //end statement
        if( this.scope()===statement )this.scope().switch();
        //end var
        if( this.scope()===variable )this.scope().switch();
    }else
    {
        this.end();
    }
};

syntax['const']=function (event)
{
    event.prevented=true;
    if(this.scope().keyword() !== event.type )this.add( new Stack( event.type, '(*)' ) );
    this.add( this.current );
    if( this.next.type!=='(identifier)' || this.next.id==='(keyword)' )this.error('Invalid identifier for '+this.next.value,  this.next );
    if( !(this.scope().parent() instanceof Scope) )this.error('Invalid const');
    this.scope().name( this.next.value );
    var statement =  new Stack('statement' , '(expression)');
    this.add( statement );
    this.step();
};


syntax['function']= function(event){

    event.prevented=true;
    if( this.prev.value === '=' && this.scope().keyword() === 'expression')
    {
        this.scope().type('(Function)');
    }

    if( this.scope().keyword() !=='function' ) this.add( new Scope( event.type, '(*)' ) );
    this.add( this.current );
    var s = this.scope()
    var n = this.seek();
    var name='';
    if( s.parent().keyword() === 'class' && (n.value === 'get' || n.value === 'set') && this.next.id !== '(' )
    {
        s.accessor(n.value);
        n = this.seek();
    }

    if( n.id !== '(' )
    {
        name = n.value;
        if ( !checkStatement( name ) )this.error();
        s.name( name );
        this.add( this.current );
        n = this.seek();
    }

    // 类中定义的方法不能为匿名函数
    if( s.parent().keyword() === 'class' && !s.name() )
    {
        this.error('Missing function name');
    }
    // 方法中的函数只能是匿名
    else if( s.parent().keyword() !== 'class' && s.name() )
    {
        this.error('Can only be an anonymous function');
    }

    this.add( this.current );
    if( n.id !== '(' )this.error('Missing token (');
    var param=null;

    //获取函数声明的参数
    if( this.next.id !==')' )
    {
        param = new Stack('statement', '(expression)');
        this.add( param );
        this.step();
        this.scope().switch();
    }

    var ps = s.scope();

    //类成员属性必须定义在类作用域中
    if( s.parent().keyword() === 'class' )
    {
        ps = s.parent().scope();

        //验证访问器的参数
        if( s.accessor() === 'get' && ( param && param.length() > 0 ) )this.error('getter accessor cannot has parameter');
        if (s.accessor() === 'set' && ( !param || param.length() !== 1 ) )this.error('setter accessor be only one parameter');
    }

    this.add( this.seek() );
    if( this.current.id !==')' ) this.error('Missing token )');

    var type='*';

    //返回类型
    if( this.next.id===':' )
    {
        this.seek();
        type = getTypeName.call(this);
        var currentType = this.current;
        if( !checkStatementType(type, ps , this.config('globals') ) )
        {
            this.error( type+' not is defined');
        }
        if( type !=='void' )
        {
            s.addListener('(switch)', function (e) {
                if (!this.isReturn)error('Must be return','', currentType);
            });
        }
    }

    var is=false;

    //构造函数不能有返回值
    if( s.parent().keyword() ==='class' && s.parent().name() === s.name() )
    {
        type='void';

        is=true;

        //构造函数的修饰符必须为公有的
        if( s.qualifier() !== 'public' )this.error('can only is public qualifier of constructor function');
    }

    s.type('('+type+')');
    var prefix = s.static() ? 'static' : 'proto';

    //定义到作用域中
    if( name )
    {
        //不能重复声明函数
        var val = ps instanceof Class ? ps.defineProps(prefix, name) : ps.define( name );
        if( val )
        {
            if( !s.accessor() || s.accessor() === val.get || s.accessor() === val.set )
            {
                this.error('function "'+name+'" has already been declared');
            }

            //同一访问器的修饰符必须一致
            if( s.accessor() && val.qualifier !== s.qualifier() )
            {
                this.error('The same accessor modifier must be consistent for "'+s.qualifier()+'"', s.description[ s.qualifier() ] );
            }

            if( s.accessor() )val[ s.accessor() ]=s.accessor();

        }else
        {
            var obj = {type: '(' + type + ')', 'id':'function','qualifier':s.qualifier() };
            if( s.accessor() )obj[ s.accessor() ]=s.accessor();
            if( ps instanceof Class )
                ps.defineProps(prefix, name , obj );
            else
                ps.define(name, obj);
        }
    }

    this.add( this.seek() );
    if( this.current.id !=='{' ) this.error('Missing token {');
    this.loop(function(){
        if( this.next.id === '}' ) return false;
        this.step();
        return true;
    });
    this.add( this.next );
    this.seek();
    if( this.current.id !=='}' ) this.error('Missing token }');
};


syntax['else']= function(event)
{
    var p = this.scope().previous();
    if( !(p instanceof Scope) || p.keyword() !=='if' )this.error();
    event.prevented=true;
    this.add( this.current );

    if( this.next.value==='if' )
    {
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

    }else
    {
        this.step();
        this.end();
    }
}

syntax['do,try,finally'] = function(event)
{
    event.prevented = true;
    this.add( new Scope( event.type, '(block)' ) );
    if( this.scope().keyword() !== event.type )this.error();
    this.add( this.current );
    if( event.type==='finally' )
    {
        var p = this.scope().parent().previous(-2);
        if( !(p instanceof Stack) || !(p.keyword() === 'catch' || p.keyword()==='try') ) this.error('Missing try "'+event.type+'"');
    }

    this.add(this.seek());
    if( this.current.id !== '{' ) this.error('Missing token {');
    this.loop(function(){
        if( this.next.id==='}' )return false;
        this.step();
        return true;
    });
    this.add(this.next);
    this.seek();
    if( this.current.id !== '}' ) this.error('Missing token }');
    if( event.type==='do' && this.next.value !== 'while' )this.error('Missing condition "while"');
}

syntax['if,switch,while,for,catch'] = function(event)
{
    event.prevented = true;
    this.add( new Scope( event.type, '(block)' ) );
    var s = this.scope();
    if( s.keyword() !== event.type )this.error();
    if( event.type==='catch' )
    {
        var p = this.scope().parent().previous(-2);
        if( !(p instanceof Scope) || p.keyword() !== 'try' ) this.error('Missing try "'+event.type+'"');
    }
    this.add(this.current);
    this.add( this.seek() );
    if( this.current.id !== '(' ) this.error('Missing token (');
    if( this.next.value===')' )this.error('Missing condition');

    var expre = new Stack('expression','(expression)');
    this.add( expre );

    if( event.type ==='for' )
    {
        var self= this;
        var num=0;
        var seek= function (e) {
            if( e.target.value==='in' )num=2;
            if( e.target.value===';' )num++;
            if( e.target.value===')' )
            {
                if( num !==2 )this.error('Invalid condition in "for"');
                self.removeListener('(seek)', seek );
            }
        }
        this.addListener('(seek)',seek);
    }

    //获取条件表达式
    this.loop(function(){
        if( this.next.value===')' )return false;
        var s =  new Stack('expression','(*)');
        this.add( s );
        this.step();
        if( s === this.scope() )s.switch();
        return true;
    });

    if( expre === this.scope() )this.scope().switch();
    if( event.type !=='for' && expre.length() > 1 )this.error('Invalid condition');

    //跳到下一个结束符 )
    this.add( this.seek() );
    if( this.current.id !== ')' )this.error('Missing token )');

    // switch catch 必须要 {}
    if( ( event.type === 'switch' || event.type === 'catch' ) && this.next.id!=='{' )this.error('Missing token {');
    if( this.next.id==='{' )
    {
        this.add(this.seek());
        this.loop(function () {
            if( this.next.id==='}' )return false;
            this.step();
            return true;
        });
        this.add( this.next );
        this.seek();
        if( this.current.id !== '}' )this.error('Missing token }');

    }else if( event.type ==='while' )
    {
        var p = this.scope().parent().previous(-2);

        //是否需要结束符
        if( !(p instanceof Scope) || p.keyword() !=='do' )
        {
            this.step();
            this.end();
        }
        //手动结束
        else
        {
            this.scope().switch();
            if( this.next.value===';' )this.seek();
        }

    }else
    {
        if( this.next.value !== ';' )this.step();
        this.end();
    }
}

syntax["return"]=function(event)
{
    event.prevented=true;
    if( isOperator(this.next.value) && !isLeftOperator(this.next.value) )this.error();
    if( !(this.scope() instanceof Scope) )this.error();
    this.add( this.current );
    var current = this.current;
    var s = new Stack('expression','(*)');
    this.add( s );
    this.step();

    var scope = s.scope();
   // if( !funScope.returnValues )funScope.returnValues=[];
    scope.isReturn=true;
   // funScope.returnValues.push( s );

    var type = scope.type();
    if( type==='(void)' )this.error('Do not return');
    if( type!=='(*)' && s.type() !== '(*)' && type !== s.type() )
    {
        var ret = false;
        if( s.length()>0 )
        {
            var desc = scope.define(s.type().replace(/^\(|\)$/g,'') );
            if( desc && '('+desc.fullclassname+')' === type ){
                ret=true;
            }
        }
        if( !ret )this.error('Can only return '+type, current,'type' );
    }
    this.end();
}

syntax["case,default"]=function(e)
{
    e.prevented=true;
    if( this.scope().keyword() !=='switch' )this.error();
    if( !(this.prev.value===';' || this.prev.value==='}' || this.prev.line !== this.current.line ) )this.error();
    if( this.next.value===':' && e.type==='case' ) this.error('Missing expression');
    if( this.next.value!==':' && e.type==='default' ) this.error();
    var s =  new Stack('expression','(*)');
    this.add( s );
    this.add( this.current );
    this.step();
}

syntax["break,continue"]=function(e)
{
    e.prevented=true;
    var id = this.scope().keyword();
    if( e.type==='continue' )
    {
        if ( !(id=== 'for' || id==='while') )this.error();
    }else if( e.type ==='break' )
    {
        if ( !(id=== 'for' || id==='while' || id==='switch') )this.error();
    }
    if( this.scope().keyword()==='expression' )this.error();
    if( !(this.scope() instanceof Scope) )this.error();
    this.add( new Stack('expression','(*)') );
    this.add( this.current );
    this.end();
}

syntax["debugger"]=function (e)
{
    if( !(this.prev.value===';' || this.prev.value==='}' || this.prev.line !== this.current.line ) )this.error();
    this.add( new Stack('expression','(*)') );
    this.add( this.current );
    this.end();
}

syntax["throw"]=function (e)
{
    e.prevented=true;
    this.add( this.current );
    this.add( new Stack('expression','(*)') );
    this.step();
    this.end();
}

syntax["this"]=function (e)
{
    e.prevented=true;
    if( this.scope().keyword()!=='expression' )this.add( new Stack('expression','(*)') );
    var fun = getParentFunction( this.scope() );
    if( fun.parent().keyword() ==='class' && fun.static() )this.error('this is not defined in static function');
    if( fun.parent().keyword() ==='class' )
    {
        this.scope().type( this.scope().scope().define('this').type );
    }
    this.add( this.current );
    if( !isDelimiter( this.next.value ) )
    {
        this.step();
    }
    this.end();
}

syntax["super"]=function (e)
{
    e.prevented=true;
    if( this.scope().keyword()!=='expression' )this.add( new Stack('expression','(*)') );
    var fun = getParentFunction( this.scope() );
    if( !fun || fun.parent().keyword() !=='class' || fun.static() )this.error();
    if( !fun.parent().extends() )this.error('No parent class inheritance');

    //构造函数中有调用超类
    if( fun.parent().keyword() ==='class' && fun.name()===fun.parent().name() )
    {
        fun.called=true;
    }

    this.add( this.current );
    if( !isDelimiter( this.next.value ) || balance[ this.next.value ] )
    {
        this.step();
    }
    this.end();
}

syntax["in"]=function(e)
{
    e.prevented=true;
    this.add( this.current );
    var p = this.scope().parent().parent();
    this.scope().type('(Boolean)');
    if( p.keyword()==='var' || p.keyword()==='left' )this.scope().type('(String)');
    if( !(this.next.type ==='(identifier)' && this.next.id !=='(keyword)' || this.next.value==='this') )this.error('',this.next);
    this.step();
}

syntax["typeof"]=function(e)
{
    e.prevented=true;
    if( isOperator(this.next.value) )this.error();
    if( this.scope().keyword()!=='expression')
    {
        this.add( new Stack('expression', '(String)' ) );
    }
    this.scope().type('(String)');
    if( isBoolOperator(this.prev.value) ) this.scope().type('(Boolean)');
    this.add( this.current );
    this.step();
}

syntax["delete"]=function(e)
{
    e.prevented=true;
    if( this.next.type !==' (identifier)' || this.next.id==='(keyword)' )this.error();
    if( !(this.scope() instanceof Scope) )this.error('Delete operator can only appear in the block scope');
    this.add( new Stack('expression', '(boolean)' ) );
    if( typeof objects[ this.next.value ] !== "undefined" )this.error('Invalid operator the "delete" on the global object', this.next );
    this.add( this.current );
    this.step();
    this.end();
}

syntax["new"]=function(e)
{
    e.prevented=true;
    var s = this.scope();

    //如果上一个是标识并且当前未换行
    if( (this.prev.type==='(identifier)' || this.prev.id==='(keyword)') &&
        this.prev.value!=='throw' && this.prev.line===this.current.line )this.error();

    if( s.keyword()!=='expression')
    {
        var current =  this.current;
        s = new Stack('expression', '(*)' );
        s.addListener('(switch)',function(){

            if( this.type() !=='(Class)' && this.type()!=='(*)' )
            {
                error('"'+current.value+'" is not class', 'type', current);
            }
        })
        this.add( s );
    }
    this.add( this.current );
    this.step();
    this.end();
}

syntax['(seek)']=function( e )
{
   /* if( this.current.value===';' && !(this.scope() instanceof Scope) )
    {
        var p = this.scope().parent();
        while(p && !(p instanceof Scope) && p.keyword()!=='object' )p=p.parent();
        if(p && p.keyword()==='object')this.error();
    }*/


    if( this.current.type==='(operator)' && this.current.value === this.next.value )this.error('',this.next);
    if( this.next.value===';' || this.current.value ===';' )return;
    //if( this.next.value!==';' && this.current.value !==';' && isIdentifier(this.current) && isIdentifier(this.next) )this.error('',this.next);
}

var jsontag={',':':',':':','}
syntax['(delimiter)']=function( e )
{
    var id = this.current.value;
    if( balance[id] )
    {
        e.prevented=true;
        var ps = this.scope();
        if( ps.keyword() !=='expression' )
        {
            this.add( new Stack('expression', '(*)') );
        }

        var s = new Stack('object', id==='(' ? '(expression)' : id==='[' ? '(Array)' : '(Object)');
        if( this.prev.value === '=' && s.type()==='(Array)' )
        {
            ps.type( s.type() );
        }

        var self= this;
        if( s.type()==='(Object)' )
        {
            s.addListener('(add)',function (e) {
                if( e.target.value==='{' ||  e.target.value==='}' )return;
                if( !(e.target instanceof Stack)  )
                {
                    var id = e.target.value;
                    var p = this.previous(-2);
                    if( ( p && jsontag[id]===p.value ) || ( id ===':' && this.length()<3 ) )return ;
                    self.error();
                }
            });

        }else if( s.type()==='(Array)' )
        {
            var is=false;
            if( this.prev.id==='(identifier)' || this.prev.value==='this' )
            {
                is=true;
                s.type('(property)');
                ps.type('(*)');
            }

            s.addListener('(add)',function (e) {
                if( e.target.value==='[' ||  e.target.value===']' )return;
                //数组中的元素只能用','隔开
                if( !(e.target instanceof Stack) && e.target.value !==',' )self.error();
                if( is=== true && e.target.value===',')self.error();
            });
        }

        this.add( s );
        this.add( this.current );
        this.loop(function () {
            var nid = this.next.value;
            if( nid===')' || nid==='}' || nid===']' ) return false;
            this.step();
            return true;
        });

        this.add( this.seek() );
        if( this.current.value !== balance[id] )this.error();
        s.switch();

        if( s.type() ==='(Object)' && this.next.value==='.' )this.error('', this.next );

        // 如果下一个是运算符或者是一个定界符
        if( isOperator(this.next.value) || balance[this.next.value] )
        {
            this.step();
            return;
        }
        this.end();
    }
}

syntax['(operator)']=function( e )
{
    var id = this.current.value;
    e.prevented=true;

    //逗号操作符
    if( id===',' )
    {
        if( this.scope().keyword()==='expression' )this.scope().switch();

        //(1,) 不允许
        if( this.next.value===')' )this.error(null,this.next);

        //[1,] {key:1,} 允许
        if( !(this.next.value ===']' || this.next.value ==='}') )
        {
            this.add(this.current);
            this.step();
        }
        return;
    }

    if( id==='!' || id==='!!' )
    {
        if( this.scope().keyword()!=='expression' )this.add( new Stack('expression','(Boolean)') );
        this.scope().type('(Boolean)');
        this.add(this.current);
        if( isBoolOperator(this.next) || this.next.value===';' )this.error();
        this.step();
        return;
    }

    //如果是点运算符
    if( id==='.' )
    {
        this.add( this.current );

        //数字后面不能有点运算符
        if( this.prev.type==='(number)' ) this.error();

        //点运算符后面只能是属性名
        if( !isPropertyName(this.next.value) ) this.error();
        this.scope().type('(*)');
        this.step();
        return;
    }
    //三元运算符
    else if( id==='?' || id===':' )
    {
        //结束当前的表达式
        if( this.scope().keyword()==='expression' )this.scope().switch();

        //json object
        if( id===':' && this.scope().type()==='(Object)')
        {
            this.add( this.current );
            if( !(this.prev.type === '(string)' || isPropertyName(this.prev.value) ) )this.error('Invalid property name', this.prev );
            this.step();
            return;
        }
        //switch case condition :
        else if( id===':' && this.scope().keyword()==='switch' )
        {
            this.add( this.current );
            if( this.next.value==='{' )
            {
                this.seek();
                this.loop(function () {
                    if( this.next.value==='}')return false;
                    this.step();
                    return true;
                });
                this.seek();
                if( this.current.value !=='}' )this.error('Missing token }');

            }else{
                this.loop(function () {
                    if( this.next.value==='case' || this.next.value==='default' || this.next.value==='}' )return false;
                    this.step();
                    return true;
                });
            }
            return;
        }

        var self = this;
        if( id==='?' )
        {
            var s = new Stack('ternary', '(*)');
            var a = this.scope().content().pop();
            a.__parent__ = s;
            s.content().push( a );
            this.add(s);
            s.addListener('(add)',function(){
                if( this.length()>5 )self.error('Not end expression');
            }).addListener('(switch)',function(){
                var p = this.previous(-2);
                if( !p || p.id !==':' ){
                    self.error('Missing token :');
                }
            });

        }else if( id===':' && this.scope().keyword()==='ternary' )
        {
            if( this.scope().length()===5 )this.scope().switch();
            if( this.scope().keyword() !== 'ternary' )this.error();
        }


        //三元运算表达式
        var scope = this.scope();
        if( this.scope().keyword() ==='ternary' )
        {
            // ? or :
            this.add(this.current);

            //添加表达式
            this.add(new Stack('expression', '(*)').addListener('(switch)', function () {
                if (this.length() < 1)self.error('empty expression');
            }));

            //获取表达式
            this.step();

            //设置三元表达式返回的类型
            scope.type( this.scope().type() );

            //如果当前是函数并且下一个是三元运算
            if (this.next.value === ':' || this.next.value === '?')
            {
                this.step();

                //不确定的类型
                if( scope.type() !== this.scope().type() )scope.type('(*)');
            }

            //未结束继续
            if( scope.length()!==5 )return;
        }
    }
    //如果是数学运算符
    else if( id==='-' || id==='+' || id==='*' || id==='/' || id==='%' )
    {
        if( this.next.type === '(delimiter)' )this.error();
        if( (id==='-' || id==='+') && this.scope().keyword() !== 'expression' )this.add(new Stack('expression', '(Number)'));
        this.add( this.current );
        this.scope().type('(Number)');
        if( id !=='+' )
        {
            //左边是引用或者数字
            if (!(this.prev.type === '(number)' || this.prev.type === '(identifier)' && this.prev.id !== '(keyword)'))this.error();

            //右边是引用或者数字
            if (!(this.next.type === '(number)' || this.next.type === '(identifier)' && this.next.id !== '(keyword)'))this.error();

        }else if( this.next.type ==='(string)' || this.next.value==='typeof' )
        {
            this.scope().type('(String)');
        }

        this.step();
        return;
    }
    //运算并赋值
    else if( id==='+=' || id==='-=' || id==='*=' || id==='/=' || id==='%=')
    {
        this.add( this.current );
        if( this.prev.type !=='(identifier)' || this.prev.id==='(keyword)' )this.error();
        this.scope().type('(Number)');

        //下一个必须是数字或者引用的数字(+=)除外
        if( id !=='+=' )
        {
            var v = this.next.value;
            var is =  v==='!' || v==='!!' || v==='-' || v==='+' || v==='~';
            if( !is && !(this.next.type==='(number)' || this.next.type==='(identifier)' && this.next.id!=='(keyword)') )
                this.error();
        }
        this.step();
        return;
    }
    //自增减运算
    else if( id==='++' || id==='--' )
    {
        //自增减运算只能是引用
        if( this.prev.type==='(number)')this.error();
        if( this.next.type==='(number)')this.error('',this.next);
        var left= this.prev.type==='(identifier)' && this.prev.id !=='(keyword)' && this.prev.value !==';';
        var right= this.next.type==='(identifier)' && this.next.id !=='(keyword)' && this.next.value !==';';
        if( !left )
        {
            var p = this.scope().previous();
            left = p instanceof Stack && p.type()==='(property)';
        }
        if( left && right )this.error();
        if( !left && !right )this.error();

        if( this.scope().keyword()!=='expression' )this.add( new Stack('expression','(Number)') );
        this.add( this.current );
        this.scope().type('(Number)');
        if( left && this.next.value ===',' || !left && right )
        {
            this.step();
            return;
        }
    }
    //赋值
    else if( id==='=' )
    {
        this.add( this.current );
        if( (this.prev.type !=='(identifier)' || this.prev.id==='(keyword)' ) && this.prev.value!==']' )this.error();
        if( !this.next || this.next.value===';' || isBoolOperator(this.next.value) )
        {
            this.error('Missing expression');
        }
        this.step();
        return;
    }
    //反转操作数的比特位
    else if( id==='~' )
    {
        if( this.scope().keyword()!=='expression' )this.add( new Stack('expression','(Number)') );
        this.scope().type('(Number)');
        this.add( this.current );
        this.step();
        return;

    } else
    {
        var v = this.next.value;
        var is = v==='-' ||  v==='+' || isLeftOperator(v);
        this.add( this.current );
        this.scope().type('(Number)');
        if( isBoolOperator(this.current.value) )
        {
           this.scope().type('(Boolean)');
        }
        if( is || balance[ v ] || isIdentifier( this.next ) )
        {
            this.step();
            return;
        }
    }
    this.end();
}

/**
 * 获取类型名
 * @returns {string}
 */
function getTypeName()
{
    var type=[];
    this.loop(function(){
         this.seek();
         type.push(this.current.value);
         if( !(this.next.value==='.' || this.next.id==='(identifier)') )return false;
         return true;
    });
    if( !checkSegmentation(type, true) )this.error('Invalid type name');
    return type.join('');
}

/**
 * 声明属性
 */
function statement()
{
    var type = '*';
    var name = this.current.value;
    var ps = this.scope().parent();
    var id = ps.keyword();
    var prefix = ps.static() ? 'static' : 'proto';

    //获取声明的类型
    if( this.next.id===':' )
    {
        var current = this.current;
        var prev = this.prev;
        this.seek();
        type= getTypeName.call(this);
        this.current= current;
        this.prev = prev;

        //检查声明的类型是否定义
        if( !checkStatementType(type, ps.scope() , this.config('globals') ) )this.error( type+' not is defined');
    }

    //检查属性名是否可以声明
    if( !checkStatement(name, this.config('reserved') ) )
    {
        this.error(reserved.indexOf( name )>0 ? 'Reserved keyword not is statemented for '+name : 'Invalid statement for '+name);
    }

    //如是函数声明的参数
    if( id==='function' )
    {
        id='var';
        ps.param( type );

    }else if( id ==='var' || id==='const' || id==='let')
    {
        ps.type( type );
    }

    var desc = {'type':'('+type+')','id':id};

    //类成员属性
    if( ps.parent() instanceof Class )
    {
        if( ps.parent().defineProps(prefix, name) )this.error('Identifier "'+name+'" has already been declared');
        ps.parent().defineProps(prefix, name, desc);

    }else
    {
        var val = ps.scope().define( name , desc);
        var pscope = getParentScope( this.scope() );
        if( val && val.pid === pscope.keyword() )this.error('Identifier "'+name+'" has already been declared');
        desc.pid = pscope.keyword();
        ps.scope().define( name , desc);
    }

    //声明的属性后面只能是 '=','in' 或者 ','操作符
    if( isOperator(this.next.value) && !(this.next.value==='=' || this.next.value===',' || this.next.value==='in') )
        this.error('',this.next);

    if( this.next.type ==='(identifier)' && this.next.value !==';' )this.error();

    //常量必须指定默认值
    if( id==='const' && this.next.value !=='=' )this.error('Missing default value in const',this.next);
    this.add( new Stack('expression', '('+type+')' ) );
}

/**
 * 根据当前的语法标识符返回对应的类型
 * @param o
 * @returns {*}
 */
function toType( o , scope )
{
    if ( isConstant(o.value) )
    {
        switch (o.value) {
            case 'NaN' :
            case 'Infinity' :
                return '(Number)';
                break;
            case 'null' :
                return '(Object)';
                break;
            case 'true' :
            case 'false' :
                return '(Boolean)';
                break;
            case 'this' :
                return scope.scope().define('this').type;
                break;
        }

    } else
    {
        switch (o.type) {
            case '(template)' :
            case '(string)' :
                return '(String)';
                break;
            case '(number)' :
                return '(Number)';
                break;
            case '(regexp)' :
                return '(RegExp)';
                break;
        }
    }
    return null;
}


syntax['(identifier)']=function( e )
{
    e.prevented=true;
    if( this.current.value===';')return;

    var id = this.scope().keyword();

    // 获取声明的类型
    if( id ==='statement' )
    {
        var val = this.prev.value;
        if( val ==='var' || val ==='const' || val ==='let' || val===',' || this.scope().length()<1 )
        {
            statement.call(this, e);
        }
    }

    //如果不是表达式
    if( this.scope().keyword() !=='expression' )
    {
        this.add( new Stack('expression','(*)') );
    }

    //检查所有的引用属性是否为先声明再使用。对象中的属性不会检查
    if( this.prev.value !=='.' )
    {
        //Json 对象中的键名不检查
        var iskey = this.scope().parent().keyword()==='object' && this.scope().parent().type()==='(Object)' && this.next.value ===':';
        if( !iskey )
        {
            var type = toType( this.current, this.scope() );
            if( !type )
            {
                var ps = this.scope().scope();

                //是否有声明
                var desc = ps.define( this.current.value );

                //是否为全局对象
                if ( !desc )
                {
                    var global = this.config('globals');
                    desc = global[ this.current.value ];
                }
                if ( !desc )this.error(this.current.value + ' not is defined', this.current, 'reference');

                //如果对此表达式进行赋值则检查引用的类型是否与表达式的类型一致
                if (this.next.value === '=')
                {
                    var current = this.current;

                    //如果修改常量
                    if (desc.id === 'const' && id !== 'statement')
                        this.error('constant can not be alter for "' + current.value + '"', current, 'syntax');

                    //类引用不能修改
                    if (desc.id === 'class')
                        this.error('class can not be alter for "' + current.value + '"', current, 'syntax');

                    //如果引用的类型不一致
                    this.scope().addListener('(switch)', function (e) {
                        if (desc.type !== '(*)') {
                            if ( this.type() !=='(*)' && this.type() !== desc.type && this.type() !=='(Object)')
                                error('type is not consistent, can only be ' + desc.type, 'type', current);
                        } else {
                            desc.type = this.type();
                        }
                    });
                }

                type = desc.type;
                if( desc.id==='class' && this.current.value !=='this' )
                {
                    type='(Class)';
                }
            }
            //字面量获得类型后面不能有点运算符
            else if( (type==='(Boolean)' || type==='(Number)' || type==='(Object)' ) &&  this.next.value==='.' )
            {
                this.error('', this.next );
            }
            //设置当前表达式返回的类型
            this.scope().type(type);
        }
    }

    this.add( this.current );
    if( this.next.type === '(operator)' || this.next.value==='(' || this.next.value==='[' )
    {
        var left = this.prev.value;
        var right = this.next.value;
        if( isLeftOperator(left) && isLeftOperator(right) )this.error('',this.next);
        this.step();
        return;
    }
    this.end();
}

syntax['(string),(number),(regexp)']=syntax['(identifier)'];

/**
 * 抛出错误信息
 * @param msg
 * @param type
 */
function error(msg, type, obj )
{
    if( obj )
    {
        console.log( obj );
        console.log('error line:',obj.line, ' characters:', obj.cursor );
    }
    switch ( type )
    {
        case 'syntax' :
            throw new SyntaxError(msg);
            break;
        case 'reference' :
            throw new ReferenceError(msg);
            break;
        case 'type' :
            throw new TypeError(msg);
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
    var obj = this.events[type] instanceof Array ? this.events[type] : ( this.events[type]=[] );
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
    this.__qualifier__='public';
    this.__static__   = '' ;
    this.__override__= '' ;
    this.__final__   = '' ;
    this.__scope__   = null ;
    this.__define__  ={};
    Listener.call(this);

    this.addListener('(end)', function (e) {
        if( e.target && e.target.id === '}' && this instanceof Scope )
        {
            this.switch();
        }else if( e.target && e.target.id===';' && !(this instanceof Scope) )
        {
            this.switch();
            this.parent().dispatcher( e );
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
        Stack.__current__ = new Stack('rootblock','(rootblock)');
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
 * 所在的作用域
 * @param keyword
 * @returns {*}
 */
Stack.prototype.scope=function()
{
   if( this.__scope__===null )
   {
       this.__scope__ = this;
       if ( this.keyword() === 'function' || this.keyword() === 'class' || this.keyword() === 'package' )
       {
           var parent = this.parent();
           if( parent )
           {
               while (parent && !(parent.keyword() === 'function' || parent.keyword() === 'class' || parent.keyword() === 'package') && parent.parent() )
               {
                   parent = parent.parent();
               }
               merge(this.__define__, parent.scope().__define__);
           }

       }else if( this.parent() )
       {
           this.__scope__ = this.parent().scope();
       }
   };
   return this.__scope__;
}

/**
 * 设置获取已声明的引用描述
 * @param prefix  proto | static
 * @param prop 属性名称
 * @param desc 属性描述
 * @returns {*}
 */
Stack.prototype.define=function( prop , desc )
{
    if( typeof prop === "string" )
    {
        if( typeof desc === 'undefined' )return this.scope().__define__[prop];
        this.scope().__define__[prop]=desc;
        return this;
    }
    return this.scope().__define__;
}

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
        error('stack is end','', val );
    }
    if( !val )error('Invalid val')
    var event = new Event('(add)', {target:val} );
    this.dispatcher( event );
    val = event.target;

    var p = this.previous();
    if( p instanceof Stack && !p.close() )error('Syntax not end');

    if( !event.prevented )
    {
        if( val instanceof Stack )
        {
            if( val === this )error('Invalid child');

            //堆叠器中不能添加结构体 比如 if else switch do while try for catch finally
            if( this.keyword() !== 'rootblock' && val.type() ==='(block)' && !(this instanceof Scope) )
            {
                error('Invalid syntax ' + val.keyword() );
            }

            //指定的子级的父级对象的引用
            val.__parent__ = this;
            Stack.__current__ = val;
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

    }else if( this.keyword() === 'rootblock' )
    {
        this.__close__ = true;
        return true;
    }
    return false;
}

/**
 * 设置对外接口的限定附
 * @param qualifier
 * @returns {*}
 */
Stack.prototype.qualifier=function(qualifier )
{
    if( typeof qualifier === 'undefined' )return this.__qualifier__;
    this.__qualifier__=qualifier;
    return this;
}


/**
 * 设置不可改变
 * @param qualifier
 * @returns {*}
 */
Stack.prototype.final=function( val )
{
    if( typeof val === 'undefined' )return this.__final__;
    this.__final__=val;
    return this;
}


/**
 * 设置可修改
 * @param qualifier
 * @returns {*}
 */
Stack.prototype.override=function( val )
{
    if( typeof val === 'undefined' )return this.__override__;
    this.__override__=val;
    return this;
}

/**
 * 标记是动态还是静态模块
 * @param flag  true是静态，否则为动态
 * @returns {*}
 */
Stack.prototype.static=function( val )
{
    if( typeof val !== "undefined" ){
        this.__static__=val;
        return this;
    }
    return this.__static__;
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
    this.__accessor__= '' ;
    this.__extends__='';
    Stack.call(this,keyword,type);
}
Scope.prototype = new Stack();
Scope.prototype.constructor=Scope;


/**
 * 添加参数的类型
 * @param type
 * @returns {*}
 */
Scope.prototype.param=function( type )
{
    if( typeof name !== 'undefined' )
    {
        this.__param__.push( type );
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
 * 代码块的作用域
 * @param type
 * @constructor
 */
function Class()
{
    if( !(this instanceof Scope) )return new Class();
    Scope.call(this,'class','(block)');
    this.__extends__='';
    this.__defineProps__={'proto':{},'static':{}}
}
Class.prototype = new Scope();
Class.prototype.constructor=Class;

/**
 * 定义成员属性
 * @param name
 * @param prop
 * @param desc
 * @returns {*}
 */
Class.prototype.defineProps=function(name, prop, desc)
{
    if( typeof desc === "undefined" )
    {
        return this.__defineProps__[name][prop];
    }
    this.__defineProps__[name][prop] = desc;
    return this;
};

/**
 * 是否有继承
 * @param name
 * @returns {*}
 */
Class.prototype.extends=function( name )
{
    if( typeof name === 'undefined' )return this.__extends__;
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
 * @param config
 * @constructor
 */
function Ruler( content, config )
{
    this.lines=content.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split(/\n/);
    this.line=0;
    this.cursor=0;
    this.input='';
    this.skip=false;
    this.current=null;
    this.prev=null;
    this.next=null;
    this.__end__=false;
    this.__balance__=[];
    this.__config__= merge(default_config,config || {});
    Stack.__current__=null;
    Listener.call(this);
    for (var type in syntax )this.addListener( type.split(','), syntax[type] ) ;
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
        var s = '';
        this.line++;
        this.cursor=0;
        if( !this.skip  )
        {
            var n ;
            //多行注释
            if ( (n=/\/\*/.exec( this.input )) )
            {
                s = this.input.substr(0, n.index);
                this.skip = true;
            }
            //单行注释
            else if( ( n= /\/\//.exec( this.input ) ) )
            {
                this.input = this.input.substr(0, n.index);
            }
        }

        //是否跳过
        if( this.skip )
        {
            var e=/\*\//.exec( this.input );
            if( e ){
                this.skip=false;
                s = s + this.input.substr(e.index+2);
            }
            this.input=s;
        }

        //空行继续
        if( !this.input )return this.move();
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
Ruler.prototype.error=function (msg, o, type )
{
    o = o || this.current;
    msg =  msg || 'Unexpected token '+o.value;
    type = type || 'syntax'
    error(msg , type , o);
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
            }
            s.dispatcher( new Event('(begin)', {target:o, ruler:this} ) );
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
            o = this.number(s) || this.keyword(s) || this.identifier(s) || this.operator(s) ;
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
    else if( this.current.id===';' )
    {
        if( this.current.id===';' )
        {
            this.scope().dispatcher( new Event('(end)',  {target:this.current, ruler:this} ) );
            this.add( this.current );
        }
    }
    return this.current;
}

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

    var id = stack.keyword();

    //块级必须用定界符结束(if,else,for,while)除外
    if( stack.close() || (stack instanceof Scope && !(id==='if' || id==='else' || id==='for' || id==='while' ) ) )return true;

    //是定界符开始的并且紧跟着的是结束定界符
    if( stack.keyword()==='object' && (this.next.value===')' || this.next.value===']'|| this.next.value==='}') ){
        return true;
    }

    if( this.current.value === ';')
    {
        stack.switch();
        return true;

    }else if( this.next.value===';' )
    {
        this.seek();
        return this.end( stack );

    }else if( stack.keyword()==='expression' /*|| stack.keyword()==='object'*/ || stack.keyword()==='ternary' )
    {
        if( this.next.value===')' || this.next.value===']' )
        {
            stack.switch();
            return true;
        }
        // 如果父级是一个对象
        else if( this.next.value==='}' )
        {
            var p = stack.parent();
            while (p && p.keyword() !== 'object' && !(p instanceof Scope))p = p.parent();
            if (p && p.keyword() === 'object'){
                stack.switch();
                return true;
            };
        }
    }
    this.error('syntax not end');
}


/**
 * 步进
 * @param flag
 * @returns {*|null}
 */
Ruler.prototype.step=function()
{
    this.seek();
    var s = this.scope();
    var index = this.scope().length();
    var event = this.check();
    if( !event.prevented && event.target )
    {
        s.add( event.target , index );
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
        // console.log( this.scope()  , val )
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
 * @type {RegExp}
 */
var number_regexp = /^(0x[0-9a-f]+|o[0-7]+|[\-\+]?[\d\.]+)/i;

/**
 * 获取数字类型
 * @param s
 * @returns {*}
 */
Ruler.prototype.number=function(s)
{
    if( s.charAt(0)==='.' && !/\d/.test( s.charAt(1) ) )return null;
    if( number_regexp.exec(s) )
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

            // 正则表达式的前面不能是任务标识符
            if( this.next.type==='(number)' || this.next.type==='(identifier)' )return null;
            var i=1;
            while ( i<s.length && i<500 )
            {
                if( s.charAt(i) ==='/' )
                {
                    if( s.charAt(i-1) !=='\\' )break;
                    var b = i-1;
                    var t = 0;
                    while( b>0 && s.charAt( b-- ) ==='\\' )t++;
                    if( t%2 === 2 || t%2===0 )break;
                }
                i++;
            }
            var j = s.substr(0,++i);
            if( s.charAt(0) !== j.charAt(j.length-1) )this.error('Missing identifier end for '+s.charAt(0) );
            var g='';
            while ( /[a-zA-Z]/.test( s.charAt( i ) ) )g+=s.charAt( i++ );
            if(j.length < 3)this.error('Invalid regexp expression');
            new RegExp( j, g );
            return describe('(regexp)', j+g , j+g );
    }
    return null;
}

//@private
var operator_reg = /[\.\:\?\!\|\&\+\-\*\/\>\<\%\~\=\^]/;

/**
 * 获取运算符
 * @param s
 * @returns {*}
 */
Ruler.prototype.operator=function(s)
{
    var index = 0;
    while( operator_reg.test( s.charAt( index ) ) )index++;

    //',' 不能组合
    if( index===0 && s.charAt( index )===',' )index++;
    if( index === 0 )return null;

    s = s.substr(0, index);

    //等号后可以跟的其它前置运算符
    if(s.length>1 && s.charAt(0)==='=' && (s.charAt(1)==='!' || s.charAt(1)==='-' || s.charAt(1)==='+') )s=s.charAt(0);

    //声明的类型 var name:*=123;
    if( s==='*=' && this.next.id===':' )
    {
        return describe('(operator)', s.charAt(0), s.charAt(0) );

    }else if( s===':*=' || s===':*' || s==='.*' )
    {
        return describe('(operator)', s.charAt(0), s.charAt(0) );
    }

    if( s )
    {
        if( !isOperator(s) )this.error('Unexpected identifier '+s);
        return describe('(operator)', s, s);
    }
    return null;
}

Ruler.getParentScope=getParentScope;
Ruler.getParentFunction=getParentFunction;
Ruler.SCOPE=Scope;
Ruler.STACK=Stack;
module.exports = Ruler;
