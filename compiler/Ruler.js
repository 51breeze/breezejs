/**
 * 保护的关键词 , 不可当参数名， 不可声明为变量
 * @type {string[]}
 */
var reserved = [
    'static','public','private','protected','internal','package',
    'extends','import','class','var','function','new','typeof',
    'instanceof','if','else','do','while','for','in','switch','case',
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
        case '.' :
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
        case '.' :
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
        case 'instanceof' :
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

/**
 * 判断是否为一个标识符
 * @param s
 * @returns {boolean}
 */
function isIdentifier( s )
{
    switch( s )
    {
        case ';' :
        case ':' :
        case ',' :
        case '?' :
            return true;
    }
    return false;
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
    var type = '*';
    var name = this.seek().value;

    // switch 结构体中不能声明变量
    if( s.parent().keyword()==='switch' )this.error();

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

    //检查声明的类型是否定义
    if( !checkStatementType(type, this.config('reserved') ) )this.error( type+' not is defined');

    s.name( name );
    s.type( type );

    //如果当前是函数作用域则定义到域中
    var ps = getParentScope(s);
    if( ps.keyword()==='function' )
    {
        //不能重复声明属性
        if( ps.define( name ) )this.error();
        ps.define(name, type);
    }

    //如果有赋值，跳过赋值符并步进
    if( this.next.id==='=' )
    {
        this.seek();
        this.step();
    }

    //如果是连续声明的变量
    if( this.next.id===',' )
    {
        //在类中声明的属性不能同时声明多个
        if( s.parent().keyword() === 'class' )this.error();

        //跳过','
        this.seek();

        //结束声明的变量
        s.switch();

        //添加一个新变量容器
        this.add( new Stack('var','(*)') );

        //函数中可以用 ',' 同时声明多个属性
        syntax['var'].call(this, event);

    }else
    {
        this.end();
    }
    return true;
};


syntax['function']= function(event){

    event.prevented=true;
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

    if( n.id !== '(' )this.error('Missing token (');

    //获取函数声明的参数
    if( this.next.id !==')' )
    {
        var param = new Stack('param')
        s.add( param );
        syntax['var'].call(this,{target:this.current});
        this.scope().switch();
        param.switch();
        s.__param__ = s.content().splice(0, s.length() );
    }

    this.seek();
    if( this.current.id !==')' ) this.error('Missing token )');

    //返回类型
    if( this.next.id===':' )
    {
        this.seek();
        var type = this.seek();
        if( checkStatementType(type, this.config('reserved') ) )this.error( type+' not is defined');
        s.type=type.value;
    }
    
    if( this.seek().id !=='{' ) this.error('Missing token {');
    this.loop(function(){
         if( this.next.id === '}' ) return false;
         this.step();
         return true;
    });
    this.seek();
    if( this.current.id !=='}' ) this.error('Missing token }');

};


syntax['else']= function(event)
{
    if( this.scope().keyword() !== event.type )this.error();

    var p = this.parent().previous(-2);
    if( p.keyword()!=='if' )this.error();

    if( this.next.value==='if' )
    {
        var self= this;
        this.addListener('(add)',function(val){
            if( val.keyword() !=='if' )self.error();
            val.addListener('(switch)',function(){ this.parent().switch()});
        })
        this.step();

    }else if( this.next.id !== '{' )
    {
        // else 允许用 ; 结束
        this.scope().addListener('(end)',function(e){

            if(e.target.id===';')this.switch();

        },100);
    }
}

syntax['do,try,finally'] = function(event)
{
    event.prevented = true;
    if( this.scope().keyword() !== event.type )this.error();
    if( event.type==='finally' )
    {
        var p = this.scope().parent().previous(-2);
        if( !p || p.keyword() !== 'catch' ) this.error();
    }

    this.seek();
    if( this.current.id !== '{' ) this.error();

    this.loop(function(){
        if( this.next.id==='}' )return false;
        this.step();
        return true;
    });
    this.seek();
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

    this.seek();
    if( this.current.id !== '(' ) this.error('Missing token (');

    var s = this.scope();


    // for 需要有三个条件， 每一个条件需要用';'来结束
    if( event.type==='for' )
    {
        s.addListener('(end)',function(event){
            event.stopPropagation=true;
            if( event.target.id===';' ){
                this.add( event.target );
            }
        });
    }

   // if( event.type==='if')
    //{
        //获取条件表达式
        this.loop(function(){
            if( this.next.id===')' )return false;
            this.step();
            return true;
        });

        s.__param__ = s.content().splice(0, s.length() );



        if(s.param().length===2 )
        {

          //  console.log(s.param());
         //   error();


        }



       // if( s.param().length !== 1 )this.error();

    //}




    //跳到下一个结束符 )
    this.seek();
    if( this.current.id !== ')' )this.error('Missing token )');

    //如果不是当前的 stack 则结束
    if( s !== this.scope() && !this.scope().close() )
    {
        this.scope().switch();
    }



    if( s !== this.scope() ) this.error();


    // switch catch 必须要 {}
    if( ( event.type === 'switch' || event.type === 'catch' ) && this.next.id!=='{' )this.error('Missing token {');
    if( this.next.id==='{' )
    {
        this.seek();
        this.loop(function () {
            if( this.next.id==='}' )return false;
            this.step();
            return true;
        });
        this.seek();
        if( this.current.id !== '}' )this.error('Missing token }');

        //console.log( this.current, this.scope().parent().keyword() );

    }else
    {
        // if while for允许用 ; 结束
        s.addListener('(end)', function (e) {

            if (e.target.id === ';'){
                this.switch();
            }

        }, 100);

        this.step();
        this.end(s);
    }
}

syntax["return"]=function(event)
{
     event.prevented=true;
     var s = new Stack('return','(*)');
     this.add( s );
     this.step();

     console.log( this.current )
     this.end();
}

syntax["in"]=function(event)
{
     event.prevented=true;

     //如果在in之前声明了变量并且没有关闭
     if( this.scope().keyword()==='var' && !this.scope().close() )this.scope().switch();

     //上一个语法
     var prev = this.scope().content().pop();

     // in 之前必须要有定义的属性名
     if( !prev || !(prev instanceof Stack) || !(prev.keyword()==='var' || (prev.keyword()==='reference' && prev.length()===1) ) )this.error();

     // in 只能在for中出现
     if( this.scope().keyword()!=='for' ) this.error();

     this.add( new Stack('in', '(*)') );
     this.add( prev );

     //添加到容器中
     this.add( this.current );

     //步进引用的对象
     this.step();

     //关闭
     this.scope().switch();
}

syntax["this"]=function(event)
{
    syntax['(identifier)'].call(this, event);
}


syntax["typeof"]=function(e)
{
    e.prevented=true;
    var s = new Stack('typeof', '(string)');
    s.add( this.current );
    this.add( s  )
    this.step();
    s.switch();
}

syntax["new"]=function(e)
{
    e.prevented=true;
    var current = this.current;
    var name = this.seek().value;
    var s = new Stack('new', '('+name+')' );
    this.add( s );
    s.add( current );
    s.add( this.current );

    var ps = getParentScope( s );
    if( !checkStatementType(name , ps.define() ) )
    {
        this.error( name + ' not is defined' );
    }

    s.add( this.seek() );

    //必须要有括号
    if( this.current.id !=='(' ) this.error();

    this.loop(function(){
        if( this.next.id===')') return false;
        this.step();
        return  true;
    });
    this.seek();
    if( this.current.id !==')' )this.error();
    s.content().push( this.current );
}

syntax['(delimiter)']=function( e )
{
    var id = this.current.id
    if( id === '(' || id === '{' || id=== '[' )
    {
         e.prevented=true;
         var s = new Stack( id==='(' ? '(expression)' : id==='[' ? '(array)' : '(object)');
         s.add( this.current );
         this.add( s );
         this.loop(function () {
             if( this.next.id === balance[ id ] ) return false;
             this.step();
             return true;
         });
         this.seek();
         if( this.current.id !== balance[id ] )this.error();
         s.content().push( this.current );
         s.switch();
    }
}

//前置或者后置运算符  ++ --
syntax["(operator)"]=function(e)
{
    // 自增减运算
    if( this.current.value==='--' || this.current.value==='++' )
    {
        if( this.next.type==='(number)' || (this.next.type === '(identifier)' && isPropertyName( this.next.value ) ) )
        {
            e.prevented=true;
            var s = new Stack('reference','(number)');
            this.add( s );
            s.add( this.current );
            this.step();
            s.switch();
            return;
        }
        this.error();

    }else if( this.current.value==='!' || this.current.value==='!!' )
    {
        if( this.next.type==='(identifier)' &&  isPropertyName( this.next.value ) )
        {
            e.prevented=true;
            var s = new Stack('reference','(boolean)');
            this.add( s );
            this.add( this.current );
            this.step();
            s.switch();
            return;
        }
        this.error();
    }
}

syntax["(number)"]=function(e)
{
    if( !isOperator(this.next.value) )return;

    e.prevented=true;

    var s= this.scope();
    if( s.keyword()!=='reference' || s.close() )
    {
        s = new Stack('reference','(number)');
        this.add( s );
    }
    s.add( this.current );

    //自增减运算符
    if( this.next.value==='--' || this.next.value==='++' )
    {
        s.add( this.seek() );
        s.switch();
        return;
    }

    this.loop(function(){

        //如果下一个是运算符，直接添加
        if( isOperator(this.next.value) )
        {
            //只有引用的属性才能进行运算并赋值 -= += *= /= 等
            if( this.next.value.length===2 && this.next.value.charAt(1)==='=' )
            {
                var s = this.next.value.charAt(0);
                if( !(s==='=' || s==='>' || s==='<') )this.error();
            }

            this.add( this.seek() );
            this.step();
            return true;
        }
        return false;
    });
    s.switch();
}


syntax["(string)"]=function(e)
{
    if( !isOperator(this.next.value) )return;

    e.prevented=true;
    var s= this.scope();
    if( s.keyword()!=='reference' || s.close() )
    {
        s = new Stack('reference','(string)');
        this.add( s );
    }

    s.add( this.current );
    this.loop(function(){
        if( isOperator( this.next.value ) )
        {
            this.add( this.seek() );
            this.step();
            return true;
        }
        return false;
    });
    s.switch();
}

syntax['(identifier)']=function( e )
{

    //if( !isOperator(this.next.value) && isIdentifier(this.next.value) )return;
    var id = this.current.id;
    var s = this.scope();
    if( s.keyword()==='import' )return false;
    if( id==='(keyword)' && this.current.value !== 'this' )return false;

    if( id==='?' )
    {
        e.prevented=true;
        var p = this.scope().previous();
        if( p instanceof Scope )this.error();


        p = this.scope().previous(-4);
      //  console.log( this.scope().keyword() );

       // error();


        this.add( this.current );
        this.loop(function(){
             this.step();
             return this.current.id !== ':';
        });
        if( this.current.id !==':' )this.error();
        this.step();

    }else if( isPropertyName(this.current.value) )
    {
        e.prevented=true;

        if( s.keyword()!=='reference' || s.close() )
        {
            s = new Stack('reference','(*)');
            this.add( s );
        }


        this.add( this.current );
        this.loop(function(){

            //如果下一个是点运算符，直接添加
            if( this.next.value==='.' )
            {
                this.add( this.seek() );
                this.add( this.seek() );
                if( !isPropertyName(this.current.value) ) this.error();
                return true;

            }else if( this.next.value===',' )
            {
                this.add( this.seek() );
                this.step();
                return true;
            }
            //如果是一个动态属
            else if( this.next.value==='[' )
            {
                this.add( this.seek() );
                this.step();
                this.add( this.seek() );
                if( this.current.id !==']' )this.error();
                return true;

            } //如果是一个动态属
            else if( this.next.value==='(' )
            {
                this.add( this.seek() );
                if( this.next.id !==')')this.step();
                this.add( this.seek() );
                if( this.current.id !==')' )this.error();
                return true;
            }
            //如果是运算符
            else if( isOperator(this.next.value) )
            {
                this.add( this.seek() );

                //自增减运算
                if( this.current.value==='--' || this.current.value==='++' )
                {
                    return false;
                }
                this.step();
                return true;
            }
            return false;
        });
        s.switch();
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
            this.switch();
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
            if( !stack.close() && !(stack instanceof Scope) )
            {
                stack.dispatcher( new Event('(end)') );
            }
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
    for ( var i in data )
    {
        if( data[i] instanceof Stack )
        {
            if( data[i] instanceof Scope )
            {
                str.push( data[i].keyword() );

                var keyword = data[i].keyword();
                if( !(keyword==='do' || keyword==='try' || keyword==='finally' || keyword==='else',keyword==='package' || keyword==='class' ) )
                {
                    if( keyword==='function' )
                    {
                        str.push(' ');
                        str.push(data[i].name());
                    }

                    str.push('(');
                    var param = data[i].param();
                    for (var b in param) {
                        if (param[b] instanceof Stack) {
                            str.push(param[b].toString());
                        } else {
                            str.push(param[b].value);
                        }
                    }
                    str.push(')');
                }

                str.push('{');
                str.push('\n');
                str.push( data[i].toString() );
                str.push('\n');
                str.push('}');
                str.push('\n');

            }else
            {
                if( data[i].keyword()==='var' )
                {
                    str.push('var '+data[i].name() );
                }
                str.push( data[i].toString() );

                //if( data[i].parent() instanceof Scope )
                   // str.push(';\n');
            }

        }else
        {
             str.push( data[i].value);
        }
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

    //检测块级代码堆叠器是否到达结束位置
    if( this.current.type==='(delimiter)' && isDelimiter( this.current.value ) )
    {
        this.balance(this.current);

    }else if( this.current.id===';' )
    {
        this.scope().dispatcher( new Event('(end)',  {target:this.current, ruler:this} ) );
    }

    this.hasListener('(seek)') && this.dispatcher(new Event('(seek)', {target: this.current,scope:this.scope()}));
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
    if( stack.close() || (stack instanceof Scope && !(stack.keyword()==='if' || stack.keyword()==='else' || stack.keyword()==='for' || stack.keyword()==='while' ) ) )return true;
    if( this.current.id === ';' )
    {
        if( !stack.close() )stack.switch();
        return true;

    }else if( this.next.id===';' )
    {
        this.seek();
        return this.end( stack );
    }
    this.error('is not close syntax');
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

Ruler.prototype.start=function()
{
    do{
       this.step();
    }while( !this.done() )
    return this.scope();
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
        if( s[1] === 'instanceof' )
        {
            return describe('(operator)', s[1] , s[1] );
        }
        return describe('(identifier)', s[1] , index >= 0 ? '(keyword)' : '(identifier)' );
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
    }else if( s==='*=' && this.next.id===':' )
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
