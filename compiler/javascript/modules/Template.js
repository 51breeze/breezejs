var getTemplateContent=function( source )
{
    var template,container;
    template = container = source;
    if( typeof source === 'string' )
    {
        source= System.trim( source );
        if( source.charAt(0) !== '<' )
        {
            container = Element( source )[0] || '';
            template=null;
        }

    }else if( container instanceof Element )
    {
        container=container[0];
        template=null;
    }

    if( typeof container !== "string" )
    {
        var elem = Element(container);
        template = elem.nodeName() === 'noscript' ? elem.html() : elem.value();
    }
    if( typeof template !== 'string' )Internal.throwError('error','Invalid template.')
    return System.trim( template );
},
jscodeReg = /^\s*(if|foreach|for|else|do|switch|case|break|var|function|while|{|})(.*)?/,
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
 * @require RegExp,Object,EventDispatcher,Internal.Variable
 */
function Template( options )
{
    if( !(this instanceof Template) )
    {
       return new Template( view, options );
    }

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
 * @param viewport
 * @returns {Component|Breeze}
 * @public
 */
Template.prototype.viewport=function( viewport , context )
{
    if( typeof viewport === "undefined" )
        return this.__viewport__;
    if( viewport === this.__viewport__ )
        return this;
    if( !(viewport instanceof Element) )
        viewport = new Element( viewport , context );
    if( viewport.length > 0 )
    {
        this.__viewport__=viewport;
        return this;
    }
    throw new Error('Invalid viewport');
};

/**
 * 获取此模板的作用域
 * @returns {*}
 */
Template.prototype.variable=function(name,value)
{
    if( name instanceof Variable )
    {
        this.__variable__=name;
        return this;
    }

    if (this.__variable__ === null)
    {
        this.__variable__ = new Variable();
    }

    if( typeof name === "undefined" )
    {
        return this.__variable__;
    }
    this.__variable__.set(name, value);
    return this;
};

/**
 * @private
 */
Template.prototype.__view__=null;

/**
 * 获取设置要渲染的视图
 * @param view
 * @returns {*}
 */
Template.prototype.view=function( view )
{
    if( typeof view !== "undefined" )
        this.__view__= getTemplateContent( view );
    return this.__view__;
};

/**
 * 渲染模板视图
 * @param template
 * @param data
 * @param flag
 * @returns {*}
 */
Template.prototype.display=function( view, flag )
{
    flag = !!flag;
    var event = new TemplateEvent( TemplateEvent.START );
    event.template =  this.view( view );
    event.variable = this.variable();
    event.viewport = this.viewport();
    if(typeof event.template !== "string" )throw new Error('invalid view');
    if( !this.hasEventListener( TemplateEvent.START ) || this.dispatchEvent( event ) )
    {
        event.html=make.call(this, event.template , event.variable );
        event.type = TemplateEvent.DONE;
        if( this.hasEventListener( TemplateEvent.DONE ) && !this.dispatchEvent( event ) )
        {
            return false;
        }
        if( !flag && event.viewport instanceof Element )
        {
            event.viewport.html( event.html );
            event.type=TemplateEvent.REFRESH;
            if( !this.hasEventListener(TemplateEvent.REFRESH) || this.dispatchEvent( event ) )
                return true;
        }
        return event.html;
    }
    return false;
};
System.Template=Template;
