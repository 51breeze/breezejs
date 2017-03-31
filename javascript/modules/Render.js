var syntax_regexp = /^\s*(if|foreach|for|else|do|switch|case|break|var|function|while|code|{|})(.*)?/,
call_regexp = /^([\w\.]+)\s*\(/,
foreach_regexp  = /(\w+)\s+as\s+(\w+)(\s+(\w+))?/i;

function escape( str )
{
    return str.replace(/"/g, '\\"');
}

function foreach( expression)
{
    var result=foreach_regexp.exec( expression );
    if( !result )throw new SyntaxError('Missing expression');
    var data = result[1];
    var key  ='key';
    var item = result[2];
    if( typeof result[3] === 'string' )
    {
        key=result[2];
        item=result[3];
    }
    var code =  'var forIndex=0;\n';
    code += 'var forKey;\n';
    code += 'var forItem;\n';
    code += 'var '+item+';\n';
    code += 'if( this.isObject('+data+') )for(var '+key+' in '+data+'){\n';
    code += item+'=this.forEach('+data+','+key+', forIndex++);\n';
    code += 'forKey='+key+';\n';
    code += 'forItem='+item+';\n';
    return code;
}

function make(template, variable)
{
    var split = this.__split__;
    var code = 'var ___code___="";\n',
        match,
        cursor = 0;
    if( variable instanceof Variable)
    {
        var dataGroup = variable.get();
        for( var v in dataGroup )
        {
            code+='var '+v+'= this.get("'+v+'");\n';
        }
    }
    template = template.replace(/[\r\n\t]+/g,'');
    var begin_code=false;
    while( match = split.exec(template) )
    {
        if( begin_code===true )
        {
            code += template.slice(cursor, match.index);
            code +='\n';
            begin_code=false;

        }else
        {
            //模板元素
            if( cursor!=match.index )
            {
                code +='___code___+="'+escape( template.slice(cursor, match.index) )+'";\n';
            }
            //短语法
            if( match[2] )
            {
                var val=match[2].replace(/(^\s+|\s+$)/g,'');
                var result = call_regexp.exec( val );
                if( result )
                {
                    code +='___code___+= typeof '+result[1]+' === "function" ? '+val+' : this.error();\n';
                }else{
                    code +='___code___+= typeof '+val+' !== "undefined" ? '+val+' : this.error();\n';
                }
            }
            //流程语法
            else if( match[1] )
            {
                var matchSyntax = syntax_regexp.exec( match[1] );
                if( matchSyntax && matchSyntax[1] )
                {
                    var syntax = matchSyntax[1].replace(/\s+/,'');
                    switch ( syntax )
                    {
                        case 'foreach' :
                            code +=  foreach( matchSyntax[2] );
                            break;
                        case 'code' :
                            begin_code = true;
                            break;
                        default :
                            code += escape( matchSyntax[1] );
                            code+='\n';
                    }
                }
            }
        }
        cursor = match.index + match[0].length;
    }
    code += '___code___+="'+escape( template.substr(cursor, template.length - cursor) )+'";\n';
    code += 'return ___code___;';
    return new Function( code ).call( variable , template );
};

/**
 * @private
 */
var _options={
    'left':"<\\?",
    'right':"\\?>",
    'shortLeft':"\\{\\$",
    'shortRight':"\\}"
};

/**
 * 模板编译器
 * @param target
 * @returns {Render}
 * @constructor
 * @require RegExp,Object,EventDispatcher,Element,RenderEvent
 */
function Render( options )
{
    if( !(this instanceof Render) )return new Render( options );
    if( typeof options !=="undefined" && System.isObject(options) )
    {
        var o = Object.merge({}, _options,options);
        // _split=new RegExp(o.left+'([^'+o.right+']+)'+o.right+'|'+o.shortLeft+'([^'+o.shortRight+']+)'+o.shortRight,'gi');
        this.__split__=new RegExp(o.left+'(.*?)'+o.right+'|'+o.shortLeft+'(.*?)'+o.shortRight,'gi');
    }
    EventDispatcher.call(this);
}

Render.prototype = Object.create(EventDispatcher.prototype);
Render.prototype.constructor = Render;
Render.prototype.__variable__=null;
Render.prototype.__viewport__=null;
Render.prototype.__split__=  new RegExp(_options.left+'(.*?)'+_options.right+'|'+_options.shortLeft+'(.*?)'+_options.shortRight,'gi');

/**
 * @param container
 * @param context
 * @returns {Render|Element}
 * @public
 */
Render.prototype.viewport=function viewport(container , context )
{
    if( typeof container === "undefined" )
        return this.__viewport__;
    if( !(container instanceof Element) )container = new Element( container , context );
    if( container.length > 0 )
    {
        this.__viewport__=container;
        return this;
    }
    throw new Error('Invalid viewport');
};


/**
 * 设置变量数据
 * @param name
 * @param value
 * @returns {Render}
 */
Render.prototype.variable=function variable(name, value)
{
    if (this.__variable__ === null)
    {
        this.__variable__ = new Variable();
        this.__variable__.__render__= this;
    }
    if( name == null )return this.__variable__;
    this.__variable__.set(name, value);
    return this;
};

/**
 * @private
 */
Render.prototype.__invoke__=function(item, key, index)
{
   return item[key];
}

/**
 * 一个回调函数。
 * 在渲染每个数据项时调用这个函数来返回一个值
 * @param callback
 */
Render.prototype.setInvoke=function setInvoke( callback )
{
    if( typeof callback !== "function" )
    {
        throw new System.TypeError('is not function');
    }
    this.__invoke__=callback;
    return this;
}

/**
 * @private
 */
Render.prototype.__view__='';

/**
 * 获取设置要渲染的视图
 * @param view
 * @returns {*}
 */
Render.prototype.view=function view( html )
{
    var t =  typeof html;
    if( t !== "undefined" )
    {
        if( t !== "string" )Internal.throwError('type','view is not string');
        this.__view__= html ;
    }
    return this.__view__;
};

/**
 * 解析模板视图并返回
 * @param template
 * @param data
 * @param flag
 * @returns {*}
 */
Render.prototype.fetch=function fetch( view )
{
    var event = new RenderEvent( RenderEvent.START );
    event.view = Render.prototype.view.call(this, view);
    event.viewport = this.viewport();
    event.variable = this.variable();
    event.variable.forEach = this.__invoke__;
    if( this.dispatchEvent( event ) )
    {
        event.html = make.call(this, event.view , event.variable );
        event.type = RenderEvent.DONE;
        this.dispatchEvent( event );
        return event.html;
    }
}

/**
 * 解析模板视图并添加到视口容器中
 * @param template
 * @param data
 * @param flag
 * @returns {*}
 */
Render.prototype.display=function display(view )
{
    var html = this.fetch( view );
    var viewport = this.viewport();
    viewport.html( html );
    var event = new RenderEvent( RenderEvent.REFRESH );
    event.viewport = viewport;
    return this.dispatchEvent( event );
};

/**
 * 模板变量构造器
 * @param data
 * @constructor
 */
function Variable()
{
    if( !(this instanceof Variable) )return new Variable();
    this.__data__ = {};
}
Variable.prototype.constructor = Variable;
Variable.prototype.__data__={};

/**
 *设置变量
 * @param name
 * @param val
 * @returns {Variable}
 */
Variable.prototype.set=function(name,val)
{
    var t = typeof name;
    if( t === 'string' )
    {
        this.__data__[name]=val;
        return this;
    }
    throw new Error('param undefined for val');
};

/**
 * 获取数据
 * @param name
 * @returns {*}
 */
Variable.prototype.get=function(name)
{
    return typeof name === 'undefined' ? this.__data__ : this.__data__[name];
};

/**
 * 删除变量
 * @param name
 * @returns {*}
 */
Variable.prototype.remove=function(name)
{
    var val=this.__data__;
    if( typeof name === "string" )
    {
        if( typeof this.__data__[name] !== "undefined" )
        {
            val=this.__data__[name];
            delete this.__data__[name];
            return val;
        }
        return false;
    }
    return val;
};

/**
 * 判断是否一个对象
 * @param val
 * @returns {boolean}
 */
Variable.prototype.isObject=function(val)
{
    return System.isObject(val);
};

/**
 * 在使用 foreach 时调用此函数来返回一个值
 * @param item
 * @param key
 * @param index
 * @returns {*}
 */
Variable.prototype.forEach=function(item, key, index)
{
    return item[key];
};

/**
 * 发生错误时的返回值
 * @returns {string}
 */
Variable.prototype.error=function(){return '';};

System.Render=Render;
