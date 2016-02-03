(function(window,undefined)
{

    /**
     * 模板变量构造器
     * @param data
     * @constructor
     */
    function Variable(data)
    {
        if( !(this instanceof Variable) )
        {
            return new Variable( data )
        }
        this.__data__ = data || {};
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
    }

    /**
     * 获取数据
     * @param name
     * @returns {*}
     */
    Variable.prototype.get=function(name)
    {
        return typeof name === 'undefined' ? this.__data__ : this.__data__[name];
    }

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
    }
    Variable.prototype.isObject=Utils.isObject;
    Variable.prototype.error=function(){return '';}

    var getTemplateContent=function( source )
    {
        var template,container;
        template = container = source;
        if( typeof source === 'string' )
        {
            source= Utils.trim( source );
            if( source.charAt(0) !== '<' )
            {
                container = Sizzle( source )[0] || '';
                template=null;
            }

        }else if( container instanceof Breeze )
        {
            container=container[0];
            template=null;
        }

        if( typeof container !== "string" )
        {
            var nodename = Utils.nodeName(container);
            template = nodename === 'noscript' ? nodename.innerHTML : container.value;
        }

        if( typeof template !== 'string' )
        {
            throw new Error('invalid template.')
        }
        return Utils.trim( template );
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
                var isforeach=foreachReg.exec( _result[2] )

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
                    code = 'if( this.isObject('+data+', true) )for(var '+key+' in '+data+'){\n';
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
    make = function(template, variable, split )
    {
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
    }

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
     */
    function Template( options )
    {
        if( !(this instanceof Template) )
        {
           return new Template( view, options );
        }

        if( typeof options !=="undefined" && Utils.isObject(options) )
        {
            var o = Utils.extend({}, _options,options);
            // _split=new RegExp(o.left+'([^'+o.right+']+)'+o.right+'|'+o.shortLeft+'([^'+o.shortRight+']+)'+o.shortRight,'gi');
            this.__split__=new RegExp(o.left+'(.*?)'+o.right+'|'+o.shortLeft+'(.*?)'+o.shortRight,'gi');
        }
        EventDispatcher.call(this);
    }

    Template.prototype = new EventDispatcher();
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

        if( !(viewport instanceof Breeze) )
            viewport = Breeze( viewport , context );

        if( viewport.length > 0 )
        {
            this.__viewport__=viewport;
            return this;
        }
        throw new Error('invalid viewport');
    }

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
    }

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
    }

    /**
     * 渲染模板视图
     * @param template
     * @param data
     * @param flag
     * @returns {*}
     */
    Template.prototype.render=function( view,flag )
    {
        flag = !!flag;
        var event = new TemplateEvent( TemplateEvent.START );
        event.template =  this.view( view );
        event.variable = this.variable();
        event.viewport = this.viewport();

        if(typeof event.template !== "string" )
         throw new Error('invalid view');

        if( !this.hasEventListener( TemplateEvent.START ) || this.dispatchEvent( event ) )
        {
            event.html=make.call(this, event.template , event.variable , this.__split__ );
            event.type = TemplateEvent.DONE;
            if( this.hasEventListener( TemplateEvent.DONE ) && !this.dispatchEvent( event ) )
            {
                return false;
            }
            if( !flag && event.viewport instanceof Breeze )
            {
                event.viewport.html( event.html );
                event.type=TemplateEvent.REFRESH;
                if( !this.hasEventListener(TemplateEvent.REFRESH) || this.dispatchEvent( event ) )
                    return true;
            }
            return event.html;
        }
        return false;
    }


    /**
     * @type {RegExp}
     */
    var tplReg=/\{\s*((\w+\s*\.\s*\w+)+)\s*\}/g;

    /**
     * @param options
     * @returns {*}
     */
    Template.factory=function( options )
    {
        var data={};
        var parser = function( a,b,c )
        {
            var prop =key=b.replace(/\s+/g,'');
            prop=prop.split('.');
            if( data[key] )
            {
                return data[key];
            }
            var item = options;
            for( var index in prop ) {
                item = item[ prop[index] ];
                if( !item )return '';
            }
            if( item !='' && Utils.isObject( item ,true) )
            {
                if( Utils.isObject(item.style,true) )
                {
                    item.style=Utils.serialize( item.style , 'style')
                }
                item = Utils.serialize( item , 'attr' );
            }
            data[key]=item;
            return item.replace(tplReg,parser);
        }

        for(var name in options.template )
        {
            options.template[ name ]=options.template[ name ].replace(tplReg,parser);
        }
        return options;
    }

    function TemplateEvent(type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    TemplateEvent.prototype=new BreezeEvent();
    TemplateEvent.prototype.template=null;
    TemplateEvent.prototype.variable=null;
    TemplateEvent.prototype.viewport=null;
    TemplateEvent.prototype.html='';
    TemplateEvent.prototype.constructor=TemplateEvent;
    TemplateEvent.START='templateStart';
    TemplateEvent.DONE='templateDone';
    TemplateEvent.REFRESH='templateRefresh';

    window.Template = Template;
    window.TemplateEvent = TemplateEvent;
    window.Variable=Variable;


})(window)
