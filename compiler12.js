/**
 * 去掉两边的空白
 * @param str
 * @returns {string|void|XML}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
}


var logic_operator=['\\=\\=\\=','\\=\\=','\\!\\=\\=','\\!\\=','\\<\\=','\\>\\=', '\\|\\|' , '\\&\\&', '\\!+','\\<','\\>','instanceof'];
var logic_operator_regexp = new RegExp( '^\s*'+logic_operator.join('|')+'\s*$' );
var math_arithmetic=['\\|', '\\&','\\+', '\\-','\\*','\\/', '\\%', '\\^','\\~','\\<\\<','\\>\\>' ,'\\='];
var math_arithmetic_regexp = new RegExp( '^\s*'+math_arithmetic.join('|')+'\s*$' );
var black_delimiter= ['\\(','\\{','\\[','\\]','\\}','\\)','\\"','\\\''];
var annotation_delimiter=['\\/\\*','\\*\\/','\\/\\/'];
var separate = ['\\?','\\n','\\;','\\:','\\,'/*,'\\.'*/];

var code_regex = [].concat( black_delimiter, annotation_delimiter, separate ,'\\/.*\\/','[\\=]+','[\\=\\!\\<\\>\\|\\&\\%\\^\\~\\/\\*\\+\\-]+', '$' );
//var newline =new RegExp('(\\/\\*|\\(|\\{|\\[|\\]|\\}|\\)|\\*\\/|\\/\\/|\\?|\\n|\\;|\\:|\\,|\\"|\\\'|\\!?\\+?\\=+|\\+|\\|+|\\&+|\\<+\\=?|\\>+\\=?|\\!+|$)','g');
var newline =new RegExp('('+code_regex.join('|')+')','g');

function isLogicOperator( val )
{
    return typeof val === "string" && logic_operator_regexp.test( val );
}

function isMathArithmetic( val )
{
    if( typeof val !== "string" ) return false;
    if( val.charAt(1)==='=' )
    {
        val= val.substr(0,1);

    }else if( val.charAt(2)==='=' )
    {
        val= val.substr(0,2);
    }
    return math_arithmetic_regexp.test( val );
}

function checkVariableName( val, exclude )
{
    return val===exclude || ( typeof val ==="string" && /^\w+([\d\w]+)?$/.test(val) && !isProtectedKeyword(val) );
}

function checkPropName( val )
{
    return ( typeof val==='object' && val.keyword==='string') || checkVariableName( val );
}

//验证引用的值是否定义，不验证引用的对象中的属性是否定义
function checkRefValue(context, val)
{
    if( typeof val === "object" && (val.keyword==='string' || val.keyword==='object' || val.keyword==='array' ||
        val.keyword==='express' || val.keyword==='ternary' || val.keyword==='function') )
    {
        return true;
    }else if( typeof val === "string"  )
    {
        if( /^typeof|new/.test(val) )
        {
            val = val.replace(/^(typeof|new)\s*/i, '');

        }else if( isLogicOperator(val) || isMathArithmetic(val) )
        {
            return true;
        }
        var pos = val.indexOf('.');
        if( pos >=0 )
        {
            if( pos===0 )return true;
            val=val.substr(0,pos);
        }
    }
    return isScalarValue( val ) || (context.define.indexOf(val)>=0 || context.param.indexOf(val)) >= 0;
}

function isScalarValue( val )
{
   return typeof val==='string' && /^(\-?[\d\.]+|null|true|false|nan|this|undefined)$/i.test(val);
}

var protected_keywords=['if','else','var','do','while','for','switch','case','break','default','try','catch','finally','throw','instanceof','typeof','function','return','new','this'];
var protected_keyword_regex=new RegExp('^('+protected_keywords.join('|')+')$');

/**
 * 检查是否保护的关键字
 * @param val
 */
function isProtectedKeyword( val, exclude )
{
   return typeof val === "string" && exclude !== val && protected_keyword_regex.test( val );
}

/**
 * @param item
 * @param exclude
 * @returns {boolean}
 */
function isExistesItem( arr, item, exclude )
{
    return exclude !== item && arr.indexOf( item ) >= 0;
}


function checkRefProp(context, prop, type)
{
    if( typeof prop !=='string' )return false;
    if( type === 'black' )
    {
        prop = prop.replace(/^return\s+/i,'');
    }
    var last = itemByIndexAt(context.content, -1);
    if ( last!=='.' && !checkRefValue(getOwnerContext(context), prop) )
    {
        error(prop + ' is not defined', 'reference');
    }
}


/**
 * @param msg
 * @param type
 */
function error( msg , type )
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

function getOwnerContext( context )
{
    while ( !(context.keyword ==='function' || context.keyword ==='context') && context )
    {
        context = context.parent;
    }
    return context;
}

function create_ternary( context )
{
    var len = context.content.length;
    var last=false;
    var num=0;

    //获取表达式的起始点
    while (len>0)
    {
        len--;
        var item = context.content[ len ];
        if( item==='=' || item===':' )break;
        if( num > 0 )
        {
            var ret = isLogicOperator( item ) || isMathArithmetic(item);
            if( !last && !ret )break;
            last = ret;
        }
        num++;
    }

    //运算符不能成双
    if( num % 2 === 0 )error('Unexpected token ?');

    var obj =  new Stack('ternary', '?' );

    //从指定的起始点开始认为是表达式的参数,并复制到当前对象的参数中
    obj.param =  context.content.splice( context.content.length-num, num );
    obj.state=1;

    //下一个阶段的符号';'
    obj.balance.push(';');
    return obj;
}

function concatPropName(context, propName )
{
    var len = context.content.length;
    var props=[];
    if( propName )

    //获取表达式的起始点
    while (len>0)
    {
        var item = context.content[ len ];
        if( typeof item === "string" && item.keyword !=='reference' )break;
        context.content.pop();
        props.unshift( item );
    }

}


var syntax={

    'ternary':function( event )
    {
        var child = event.child;
       // if( this.state===0)this.state=1;
        if( child===':' )
        {
            //如果是一个结束阶段
            if( this.state===2 )
            {
                //如是一个子级三元运算就切换到上一级
                if( this.parent && this.parent.keyword==='ternary' )
                {
                    balance(this,';');
                    this.parent.append(':')
                    return false;
                }
                error('Unexpected token :');
            }
            //设置为结束阶段
            this.state=2;
        } else
        {
            checkRefProp(this, child , 'black');
        }
    }
    ,'var':function(event)
    {
        var child = event.child;
        var is_black= child instanceof Stack;
        //if( this.state===0)this.state=1;

        //变量中不能添加变量
        if( is_black && child.keyword==='var')error('Unexpected token var eee','syntax');
        if( typeof this.items === "undefined")this.items=[];

        var refitem = itemByIndexAt(this.items,-1);

        //声明变量或者结束变量，支持使用','声明连续的变量
        if( ( !refitem || refitem.end ) || child===',' )
        {
            //变量不能以','开头
            if( (refitem && refitem.end && child===',' ) || (!refitem && child===',') )
            {
                error('Unexpected token ,');
            }
            //变量'='后面必须要赋值
            else if( refitem && refitem.delimiter && typeof refitem.value === "undefined")
            {
                error('Unexpected token =');
            }

            //是一个新的变量
            if( child !==',' )
            {
                if( !checkVariableName(child) )
                {
                    console.log( this )
                    error('Unexpected variable name');
                }
                var owner = getOwnerContext(this);
                if(owner)owner.define.push(child);
                refitem = {name: child, value: undefined, delimiter: null, end: false}
                this.items.push(refitem);
            }
            //结束上一个变量
            else if( refitem && !refitem.end )
            {
                refitem.end=true;
            }
        }
        //需要设置变量值
        else if( child === '=' )
        {
            refitem.delimiter =  child;
        }
        //设置变量值
        else if( refitem.delimiter && !refitem.end )
        {
            checkRefProp(this, child );
            refitem.value = child;
        }
    }
    ,'function':function( event )
    {
        var child = event.child;
        var is_black= child instanceof Stack;

        //初始阶段
        if( this.state===0 )
        {
            if( this.balance.length === 0 )
            {
                if(  !is_black || child.name !== '(' )error('Missing (', 'syntax');

                //函数(自定义函数)的表达式合并
                event.child = this;
                this.switch(this);
                return false;

            }else if( !this.closer )
            {
                var lastItem = itemByIndexAt(this.content,-1);
                if( is_black || (child === lastItem && child === ',') || !checkVariableName(child,',') )
                {
                    error('Unexpected token illegal', 'syntax');
                }
                if( isExistesItem(this.content, child, ',' ) )error('Unexpected override');
                if( lastItem===',' && child !==',' )this.content.pop();
            }
        }

        //如果是一个正文阶段
        else if (this.state === 1)
        {
            //设置为结束阶段
            this.state = 2;

             //需要 {}
             if ( !is_black ||  child.name !== '{' )
             {
                error('Missing {', 'syntax');
             }

             //合并函数的代码体
             event.child = this;
             this.switch(this);
             return false;

        }else if( this.state===2 )
        {
            checkRefProp(this, child, 'black');
        }
    }
    ,'condition':function( event )
    {
        var child = event.child;
        var is_black= child instanceof Stack;

        //初始阶段
        if( this.state===0 )
        {
            if( this.balance.length === 0 )
            {
                if( !is_black || child.name !== '(' )error('Missing (', 'syntax');
                //函数(自定义函数)的表达式合并
                event.child = this;
                this.switch(this);
                return false;
            }

            // 变量会将 ';' 符号消耗掉，所以在 var 结束后增加 ';'
            if( this.name==='for' && is_black && child.keyword==='var' )
            {
                this.addListener('switchAfter',function (obj) {
                     this.content.push(';');
                    this.removeListener('switchAfter')
                })
            }

            //除了 for 可以有 ',' 其它的表达式不能出现 ','
            if( !(this.name==='for' && child===',') )
                checkRefProp(this,child);
        }
        //如果是一个正文阶段
        else if (this.state === 1)
        {
            //设置为结束阶段
            this.state = 2;

            //合并函数的代码体
            if ( is_black && child.name === '{')
            {
                this.balance.pop();
                event.child = this;
                this.switch(this);
                return false;
            }
            //条件表达式可以不需要 {}， 但需要以 ';' 结束
            else if ( !(this.name === 'if' || this.name === 'elseif' || this.name==='for' || this.name==='while') )
            {
                error('Missing {', 'syntax');
            }

        }else if( this.state===2 )
        {
            if( this.name==='switch' )
            {
                var refobj = this.content[ this.content.length-1 ];
                if( child==='case' || child==='default' )
                {
                    refobj={name:child,content:[],param:[],state:0}
                    this.content.push(refobj);

                }else if( refobj )
                {
                    if( refobj.state===2 )error('Unexpected token illegal', 'syntax');
                    if( is_black )child.parent=this;
                    if ( child === ':' )
                    {
                        refobj.state = 1;
                        if( refobj.name==='case' && refobj.param.length===0 )error('Missing case argument', 'syntax');
                        if( refobj.name==='default' && refobj.param.length>0 )error('Unexpected token default', 'syntax');

                    } else if( refobj.state === 0 &&  refobj.param.length===0 )
                    {
                        checkRefProp(this,child);
                        refobj.param.push(child);

                    }else if (refobj.state === 1)
                    {
                        refobj.content.push(child);
                        if( child==='break' )refobj.state = 2;
                        else checkRefProp(this,child,'black');

                    }else{
                        error('Missing identifier :', 'syntax');
                    }

                }else
                {
                    error('Missing case first switch', 'syntax');
                }
                return false;

            }else
            {
                checkRefProp(this,child,'black');
            }
        }
    }
    ,'black':function( event )
    {
        var child = event.child;
        var is_black= child instanceof Stack;

        // do 后面必须为 while
        if( (this.name === 'do' || this.name==='try' ) && !this.addAfterWhile )
        {
            this.addAfterWhile=true;
            var keyword = this.name;
            var afterWhile = function(event){

                var obj = event.child || event;
                if( keyword==='do' && ( !(obj instanceof Stack) || obj.name!=='while' ) )
                    error('Missing while after do');

                if(  keyword==='try' && ( !(obj instanceof Stack) || obj.name!=='catch' || obj.name!=='finally' ) )
                    error('Missing catch or finally after try');

                this.removeListener('appendBefore', afterWhile );
                this.removeListener('switchBefore', afterWhile );
            };
            this.parent.addListener('appendBefore',afterWhile,10);
            this.parent.addListener('switchBefore',afterWhile,10);
        }

        //初始阶段
        if( this.state === 0 )
        {
            this.state = 2;
            if( is_black && child.name === '{' )
            {
                this.balance.pop();
                event.child = this;
                this.switch(this);
                return false;

            } else if ( this.name === 'else' )
            {
                this.balance.push(';');

            }else if( this.balance[0] !=='}' )
            {
                error('Missing {', 'syntax');
            }

        }else
        {
            checkRefProp(this, child, 'black');
        }
    }
    ,'object':function (event)
    {
        var child = event.child;
        var len = this.content.length;
        var m = len%2;
        if( (child===':' || child===',') && ( m !==1 || len===0) )error('Unexpected identifier '+child, 'syntax');

        if( m===0 && !checkPropName(child) )
        {
           error('Unexpected token key ', 'syntax');
        }
        if( m === 0 && len>0 )
        {
            var last = itemByIndexAt(this.content,-1);
            if( (last !==',' && last !==':') || last===child )error('Unexpected identifier '+child, 'syntax');
            if( last===',' && !checkPropName(child) )error('Unexpected token key ', 'syntax');
            if( last ===':' )checkRefProp(this,child);
        }
    }
    ,'array':function (event)
    {
        var child = event.child;
        if( this.state===0 )
        {
            this.state=1;
            var prev = itemByIndexAt(this.parent.content,-1);
            if( prev && prev !== '=' )
            {
                this.type='reference';
            }

        }else if( this.state===1  )
        {
            if( this.type==='reference' && this.content.length > 0 )error('Unexpected token [', 'reference');
        }
        if( child !==',' )checkRefProp(this,child);
    }
    ,'express':function (event)
    {
        var child = event.child;
        if( this.state===0 )
        {
            this.state=1;
            var prev = itemByIndexAt(this.parent.content,-1);
            if( prev && prev !== '=' )
            {
                this.type='reference';
            }
        }
        if( child !==',' )checkRefProp(this,child);
    }
   /* ,'reference':function (event)
    {
        var child = event.child;
        if( this.state===0 )
        {
            this.state=1;
            var len = this.parent.content.length-1;
            while(len>0)
            {
                var item= this.parent.content[--len];
                if( typeof item === "string" )break;
            }
            this.content=this.parent.content.splice(i,len-i);
            console.log( this.content, this.name     )
        }
        if( !(this.name==='(' && child===',') )checkRefProp(this,child);
    }*/
}

var last_identifier;
function checkIdentifier()
{
    var ident = this.delimiter;
    if( isLogicOperator(ident) || isMathArithmetic(ident) )
    {
        if( last_identifier && !this.code )error('Unexpected token '+last_identifier );
        last_identifier=ident;

    }else if( last_identifier && !this.code && /[\;\)\}\]\?]/.test(ident) )
    {
        error('Unexpected token '+last_identifier );

    }else
    {
        last_identifier='';
    }
}

/**
 * 在执行检查语法之前
 */
function executeBefore()
{
    if( this.name==='for' )
    {
        if( this.delimiter===';' || this.delimiter===')' )
        {
            if( this.code )this.append( this.code );
            var index = this.content.indexOf(';');
            if( index>=0 ){
                this.content.splice(index,1);
                index--;
            }
            var item = this.content.splice(index+1, this.content.length-index+1 );
            this.content.push( item );
            if( this.delimiter===')' )
            {
                if( this.content.length !== 3)
                {
                    error('Unexpected token )','syntax');
                }
                this.removeListener('executeBefore',executeBefore);
                balance(this,this.delimiter);
                return false;
            }
            this.content.push(';')
            return false;
        }
    }
}


/**
 * 结束语法之前
 * @param setcontext
 * @returns {boolean}
 */
function endSyntaxBefore( setcontext )
{
    //如果三元运算操作未到结束的阶段
    if( this.keyword === 'ternary' && this.state !== 2  )
    {
        error('Unexpected token ;', 'syntax');
    }

    //如果声明的变量
    if( this.keyword === 'var' )
    {
        var last = itemByIndexAt(this.items,-1);
        if( !last || ( last.delimiter && typeof last.value=== "undefined" ) )error('Unexpected token var', 'syntax');
        last.end=true;
        return true;
    }

    // 检查 case default 是否有 : 符号
    if( this.state===2 && this.name==='switch' && this.delimiter==='}' && getItem(this,'content.state',-1) === 0 )
    {
        error('Missing identifier :', 'syntax');
    }

    //表达式中至少需要有一个参数
    if( this.keyword==='express' )
    {
        if( this.content.length === 0 )error('Missing argument ', 'syntax');
    }

    //如果还是在初始阶段
    if( this.state===0 )
    {
        //是否可以进入到正文阶段
        if ( ( this.keyword === 'condition' || this.keyword === 'function' ) && this.param.length === 0 && this.closer )
        {
            this.state = 1;
            this.param = this.content.splice(0, this.content.length);

            //条件表达式至少需要一个
            if (this.keyword === 'condition' )
            {
                if( this.param.length === 0 )error('Missing argument', 'syntax');
                if( this.name==='while' || this.name==='catch' || this.name==='finally' )
                {
                    var lastname = getItem(this, 'parent.content.name', -2);
                    //do 之后的 while 不需要{}
                    if (this.name === 'while' && lastname === 'do')return true;
                    if (this.name === 'catch' && lastname !== 'try')error('Missing try before catch', 'syntax');
                    if (this.name === 'finally' && !( lastname === 'catch' || lastname === 'try'))error('Missing try or catch before finally', 'syntax');
                }

                //条件表达式可以不需要 {}， 但需要以 ';' 结束
                if( this.name==='if' || this.name==='elseif' || this.name==='for' || this.name==='while' )
                {
                    this.balance.push(';');
                }
            }
            //函数可以不需要参数
            if (this.param.length === 0)this.param.push(null);
            this.closer = false;
            return false;
        }
    }
}



/**
 *
 *  四种块级类型 function condition black ternary
 *  function 函数域块级在此域中声明的变量外部不可访问反之外面声明的变量内部可以引用，允许是匿名函数，参数允许为空。
 *  condition 条件表达式块级，是函数体无作用域，参数必须至少一个
 *  black    块级代码体, 无参数，无左右括号'()'
 *  ternary  三元运算表达式
 *
 *  三个阶段 0、1、2 三个阶段
 *  0 初始阶段(获取参数或者获取表达式)
 *  1 为正文阶段
 *  2 为结束阶段
 *
 * 代码堆叠器
 * @param keyword
 * @param name
 * @constructor
 */
function Stack(keyword, name, delimiter )
{
    this.name=name;
    this.keyword=keyword;
    this.content=[];
    this.balance=[];
    this.state=0;
    this.delimiter = delimiter;

    if( keyword==='function' ||  keyword==='condition' || keyword==='context' )
    {
        this.param=[];
    }

    if( keyword==='function' || keyword==='context' )this.define=[];

    this.closer=false;
    this.parent=null;
    this.events={};
    this.switch( this );

    if( this.name==='for' )
    {
        this.addListener('executeBefore',executeBefore);
    }

    //切换上下文之前
    this.addListener('switchBefore',endSyntaxBefore);

    //添加之前检查语法
    if( typeof syntax[keyword] === 'function' )
    {
        this.addListener('appendBefore',syntax[keyword]);
    }

    this.addListener('executeAfter',checkIdentifier);

    //变量必须要以';'结束
    if( keyword ==='var' || keyword==='property' )this.balance.push(';');
}


Stack.current=null;
Stack.getInstance=function( code, delimiter )
{
    var current = Stack.current;
    var name,keyword;
    if( code && code.charAt(code.length-1)==='\\' && /^[\'\"]$/.test( delimiter ) )
    {
        current.content.push(code+delimiter)
        current.code='';
        current.delimiter='';
        return current;
    }

    if( code && /^(case|default)/i.exec(code) )
    {
        current.append( RegExp.$1 );
        code=code.replace(/^(case|default)\s*/i,'');
    }

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

    }else if( code && /^(if|else\s+if|do|while|switch|try|catch|for|finally)$/.test( code ) )
    {
        name = code.replace(' ','');
        keyword = 'condition';
        if( /^(do|try|finally)$/.test(code) )
        {
            keyword='black';
        }
        code= code.replace( /^(if|else\s+if|do|while|switch|try|catch|for|finally)$/,'' );
        if( code ){
            console.log( code )
            throw new Error('syntax invalid');
        }

    }else if( code && /^else/.test( code ) )
    {
        name = 'else'
        keyword = 'black';
        code= code.replace( /^else\s*/,'' );
        if( code )
        {
            var obj = new Stack(keyword, name, delimiter );
            current.append( obj );
            return Stack.getInstance( code, delimiter);
        }

    }else if( /^[\{\[\(]$/.test( delimiter ) )
    {
        name=delimiter;
        keyword='object';
        if( delimiter==='[' )keyword='array';
        if( delimiter==='(' )keyword='express';

        // if(code)current.append(code);
        // code='';
        if( code || (current && current.keyword!=='var') )
        {

            if(code)current.append(code);
            keyword = 'reference';
            console.log(  itemByIndexAt(current.content,-1) ,'====', itemByIndexAt(current.content,-2)  )

        }




    }else if(  ( !current || current.name!==delimiter ) && /^[\'\"]$/.test( delimiter ) )
    {
        name=delimiter;
        keyword='string';
        if( code )error('syntax invalid');
    }
    //三元运算操作
    else if( delimiter==='?' )
    {
        keyword='ternary';
        if( current && code )current.append( code );
        delimiter='';
        code='';

    }
    //设置属性
    else if( ( delimiter === '=' ) && current && (current.keyword !=='var' || current.closer ) )
    {
        keyword='property';
    }
    //正则对象
    else if( delimiter.length > 1 && delimiter.charAt(0)==='/' && delimiter.charAt(delimiter.length-1)==='/' )
    {
        var obj= new Stack('object','regexp' )
        obj.content.push( delimiter);
        obj.state=2;
        obj.closer=true;
        obj.switch(current);
        current.append( obj );
        delimiter='';
        code='';
    }

    newobj =current;
    if( keyword )
    {
        newobj = keyword==='ternary' ? create_ternary(current) : new Stack(keyword, name, delimiter );
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
    var event = {child:value,parent:this};
    if( this.hasListener('appendBefore') && !this.dispatcher('appendBefore', event) )
    {
        return event.child;
    }

    value =  event.child;
    var parent = event.parent;
    var is = value instanceof Stack;
    if( is )
    {
        if( value === this )throw new Error('the child and parent is same');
        if( value.parent )throw new Error('child added.');
        value.parent=this;

        //如果一个作用域，引用定义的值
        if( value.keyword==='function' )
        {
            var owner = getOwnerContext( this );
            if( owner ){
                value.define= value.define.concat(owner.param.slice(),owner.define);
            }
        }
    }

    if( parent.closer )
    {
        console.log( this , value );
        throw new Error('this is closered');
    }

    if( value )
    {
        parent.content.push( value );
        if( is && value.hasListener('added') )value.dispatcher('added')
    }
    return value;
}

Stack.prototype.dispatcher=function( type, options )
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

Stack.prototype.switch=function( stackObject )
{
    if( stackObject instanceof Stack && Stack.current !== stackObject )
    {
        if ( this.hasListener('switchBefore') && !this.dispatcher('switchBefore', stackObject) )return false;
        Stack.current = stackObject;
        if (stackObject.hasListener('switchAfter'))stackObject.dispatcher('switchAfter', this );
        return true;
    }
    return false;
}

Stack.prototype.execute=function()
{
    if ( this.hasListener('executeBefore') && !this.dispatcher('executeBefore') )return false;
    var code = this.code;
    var delimiter = this.delimiter;

    //获取函数名称
    if( this.keyword==='function' && typeof this.name === "undefined" )
    {
        code = trim( code );
        this.name= code ? code : delimiter==='(' ? '' : undefined;
        code='';
    }

    if (code)this.append(code);
    //如果是运算符
    if( delimiter && balance(this,delimiter)===0 )this.append(delimiter);
    if( this.hasListener('executeAfter') ) this.dispatcher('executeAfter');
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
function balance(context, delimiter , fake )
{
    if( delimiter && /^[\(\{\[\'\"\;\]\}\)]$/.test(delimiter) )
    {
        var tag = context.balance.pop();

        var endIdentifier = /^[\)\}\]]$/.test(delimiter);

        //在表达式中的三元运算操作可以用 ')' 结束
        if( context.keyword==='ternary' && context.state===2 && endIdentifier )
        {
            context.closer=true;
            context.switch( context.parent , delimiter );
            return balance( context.parent , delimiter);
        }
        // 变量可以用 } 结束
        if( context.keyword==='var' && delimiter === '}' )
        {
            context.closer=true;
            context.switch( context.parent , delimiter );
            return balance( context.parent , delimiter);
        }

        if ( delimiter !== tag )
        {
            if( tag )
            {
                if( endIdentifier || /^[\'\"]$/.test( tag ) )
                {
                    console.log( context, delimiter, tag )
                    throw new Error('Unexpected identifier '+delimiter);
                }
                context.balance.push(tag);
            }

            if( map_delimiter[delimiter] )
            {
                context.balance.push( map_delimiter[delimiter] );
            }

            if( context.balance.length === 0 )
            {
                throw new Error('Unexpected identifier '+delimiter );
            }
            return 1;
        }

        if( context.balance.length===0 )
        {
             //关闭上下文并切换到父级上下文
            context.closer=true;
            var ret = context.switch( context.parent );

            if( ret )
            {
                //如果当前是一个子级三元运算域就向上切换。
                if (context.keyword === 'ternary' && context.parent.keyword === 'ternary' && context.parent.state === 2 && !context.parent.closer)
                {
                    balance(context.parent, ';', true);
                }
                //如果当前是用';'结束的上下文并且父上下文是'var'
                else if (!fake && delimiter === ';' && context.parent )
                {
                    if( itemByIndexAt(context.parent.balance,-1)===';' )
                    {
                        balance(context.parent, ';');
                    }
                }
            }
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
function getItem( obj , name , index )
{
    if( !name )return obj;
    var prop = name.split('.');
    var n = prop.pop();
    var i=0;
    while (i < prop.length && obj)
    {
        obj = obj[ prop[i++] ];
    }
    if( typeof index === "number" && obj instanceof Array )
    {
        obj = itemByIndexAt( obj , index ) || {}
    }
    return typeof obj[n]=== "undefined" ? null : obj[n];
}

function itemByIndexAt( arr , index )
{
    if( typeof index === "number" && arr instanceof Array )
    {
        index = index<0 ? arr.length + index : index;
        return arr[ index ] || null;
    }
    return null
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

        //try {
            var stack = Stack.getInstance(val, tag);
            stack.execute();
      //  }catch (e)
       // {
           // console.log(val, tag )
          // throw new SyntaxError(e.message + ' in line '+num );
       // }

        if( len === pos ){
            current.closer=true;
        }
        if( tag==='\n')num++;
    }

    if( current.balance.length !==0 )
    {
       // console.log( current )
       // throw new SyntaxError('Not the end of the syntax in '+num+' line');
    }

   // console.log( current.content[0].content[2].content[3].content[0].content[0] )
   // console.log( current.content[0].content[0].content[.content3] )
    console.log( current.content[0].content[2] )
   // console.log( current.content )
   // return current;
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


var content = " function doRecursion( propName,strainer, deep,Breeze )\n\
{\n\
    var currentItem={ppp:78,\n\
    'uuu':'kkkk',\
    \nttt: 123,\
    }\n\
    ,bbb,\
    ret=[];\n\
     var s = typeof strainer === \"string\" ? function(){return Breeze\n\
     .querySelector\n\
     (strainer, null , null, [this]).length > 0; } : \n\
        (typeof strainer === \"undefined\" + \"sdf\\\"sdf\" ? function(){return this.nodeType===1; } : strainer);\n\
    var uuu = this['yyy'](function(elem)\n\
    {\n\
        if\n\
        ( elem && elem.nodeType )\n\
        {\n\
            currentItem=elem;\n\
            do{\n\
                currentItem = currentItem[propName];\n\
                if( currentItem && s.call(currentItem,'cccc') )ret = ret.concat( currentItem  );\n\
            }while(1)\n\
            var oooo=function(){ var bb=123; }\
        }\n\
        else uuu=123;\n\
        \
        switch(1)\n{\
          case '1' : \
             var ccc=1;\n\
             break;\
           default :\
        \
        }\n \
        var c=0;\n\
        for( ;; )\n{\
        \
       \n}\
        \
        \
    });\n\
    ret = 11.4444;\
    var reg=/(\\/\\*|\\(|\\{|\\[|\\]|\\}|\\)|\\*\\/|\\/\\/|\\?|\\'|\\\"|\\n|\\;|\\:|\\,|\\!?\\+?\\=+|\\+|\\|+|\\&+|\\<+\\=?|\\>+\\=?|\\!+|$)/;\n\
    ret=new ddssss();\
    return ret;\n\
}";


/*content = " function doRecursion( propName,strainer, deep )\n\
{\n\
  var cccc={lll:999};\
  if\
  \n(888){\n\
        do\n{\n\
                currentItem = currentItem[propName];\n\
                if( currentItem && s.call(currentItem) )ret = ret.concat( currentItem );\n\
            }while(1)\n\
   \n}\n\
}";*/

/*content = "var s = typeof strainer === \"string\" ? (typeof strainer === \"undefined\" + \"sdfsdf\" ? function(){return this.nodeType===1; } : strainer) : \n\
 function(){return Breeze.querySelector(strainer, null , null, [this]).length > 0; };\n\
";*/



var rootcontext = start( content );

//console.log( toString( rootcontext ) )

//console.log( rootcontext.content[1].content[2].content[3].content[1].content )
//console.log( rootcontext.content[1].content )

