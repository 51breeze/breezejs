var jscodeReg = /^\s*(if|foreach|for|else|do|switch|case|break|var|function|while|{|})(.*)?/,
funReg = /^([\w\.]+)\s*\(/,
foreachReg  = /(\w+)\s+as\s+(\w+)(\s+(\w+))?/i,
replace = function( code , flag )
{
    code=code.replace(/[\r\n\t]+/g,'');
    if( code.replace(/\s+/,'') == "" )
        return "";

    var _result=jscodeReg.exec(code);
    if( flag===true && _result )
    {
        if( _result[1] === 'foreach' )
        {
            var isforeach=foreachReg.exec( _result[2] );
            if( typeof _result[2] ==='string' && isforeach )
            {
                var data = isforeach[1];
                var key  ='key';
                var item = isforeach[2];
                if(  typeof isforeach[3] === 'string' )
                {
                    key=isforeach[2];
                    item=isforeach[3];
                }
                code = 'if( this.isObject('+data+') )for(var '+key+' in '+data+'){\n';
                code += 'var '+item+'='+data+'['+key+'];\n';
                code += 'var forIndex='+key+';\n';
                code += 'var forItem='+item+';\n';
                return code;
            }
            code='\n';
        }
        return code+='\n';
    }
    return '___code___+="' + code.replace(/"/g, '\\"') + '";\n';
},
make = function(template, variable)
{
    var split = this.__split__;
    var code = 'var ___code___="";\n',
        match,cursor = 0;

    if( variable instanceof Variable)
    {
        var dataGroup = variable.get();
        for( var v in dataGroup )
        {
            code+='var '+v+'= this.get("'+v+'");\n';
        }
    }

    while( match = split.exec(template) )
    {
        code += replace( template.slice(cursor, match.index) );
        if( match[2] !==undefined && match[2] !='' )
        {
            var val=match[2].replace(/(^\s+|\s+$)/g,'');
            var result = funReg.exec( val );
            if( result )
            {
                code +='___code___+= typeof '+result[1]+' === "function" ? '+val+' : this.error();\n';
            }else{
                code +='___code___+= typeof '+val+' !== "undefined" ? '+val+' : this.error();\n';
            }

        }else
        {
            code += replace(match[1], true);
        }
        cursor = match.index + match[0].length;
    }
    code += replace( template.substr(cursor, template.length - cursor) );
    code += 'return ___code___;';
    return new Function( code ).call( variable , template );
};

/**
 * @private
 */
var _options={
    'left':"<\\?",
    'right':"\\?>",
    'shortLeft':"\\{",
    'shortRight':"\\}"
};

/**
 * 模板编译器
 * @param target
 * @returns {Template}
 * @constructor
 * @require RegExp,Object,EventDispatcher,Element,TemplateEvent
 */
function Template( options )
{
    if( !(this instanceof Template) )return new Template( options );
    if( typeof options !=="undefined" && System.isObject(options) )
    {
        var o = Object.merge({}, _options,options);
        // _split=new RegExp(o.left+'([^'+o.right+']+)'+o.right+'|'+o.shortLeft+'([^'+o.shortRight+']+)'+o.shortRight,'gi');
        this.__split__=new RegExp(o.left+'(.*?)'+o.right+'|'+o.shortLeft+'(.*?)'+o.shortRight,'gi');
    }
    EventDispatcher.call(this);
}

Template.prototype = Object.create(EventDispatcher.prototype);
Template.prototype.constructor = Template;
Template.prototype.__variable__=null;
Template.prototype.__viewport__=null;
Template.prototype.__split__=  new RegExp(_options.left+'(.*?)'+_options.right+'|'+_options.shortLeft+'(.*?)'+_options.shortRight,'gi');

/**
 * @param container
 * @param context
 * @returns {Template|Element}
 * @public
 */
Template.prototype.viewport=function viewport( container , context )
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
 * @returns {Template}
 */
Template.prototype.variable=function variable(name,value)
{
    if (this.__variable__ === null)this.__variable__ = new Variable();
    if( name == null )return this.__variable__;
    this.__variable__.set(name, value);
    return this;
};

/**
 * @private
 */
Template.prototype.__view__='<p>No view</p>';

/**
 * 获取设置要渲染的视图
 * @param view
 * @returns {*}
 */
Template.prototype.view=function view( html )
{
    var t = typeof html;
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
Template.prototype.fetch=function fetch( view )
{
    var event = new TemplateEvent( TemplateEvent.START );
    event.template = this.view( view );
    event.viewport = this.viewport();
    if( this.dispatchEvent( event ) )
    {
        event.html = make.call(this, event.template , this.variable() );
        event.type = TemplateEvent.DONE;
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
Template.prototype.display=function display( view )
{
    var html = this.fetch( view );
    var viewport = this.viewport();
    viewport.html( html );
    var event = new TemplateEvent( TemplateEvent.REFRESH );
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
 * 发生错误时的返回值
 * @returns {string}
 */
Variable.prototype.error=function(){return '';};

System.Template=Template;
