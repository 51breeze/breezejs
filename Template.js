(function(window,undefined)
{

    /**
     * 模板变量构造器
     * @param data
     * @constructor
     */
    function Variable(data)
    {
        data = data || {};
        var keys=[];

        this.length = 0;
        function setKey( data )
        {
            if( typeof data ==='object' ) for(var key in data )
            {
                keys.push( key );
            }
            this.length = keys.length;
        }

        /**
         * 获取所有变量名
         * @returns {Array}
         */
        this.toKeys=function()
        {
            return keys;
        }

        /**
         * 获取变量
         * @param name
         * @param val
         * @returns {Variable}
         */
       this.set=function(name,val)
       {
           var t = typeof name;
           if( t === 'string' )
           {
               data[name]=val;
               keys.push( name );
               this.length = keys.length;

           }else if( t === 'object' && typeof val === 'undefined' )
           {
               data=name;
               setKey( data );
           }
           return this;
       }

        /**
         * 获取数据
         * @param name
         * @returns {*}
         */
       this.get=function(name)
       {
          return typeof name === 'undefined' ? data : data[name];
       }

       this.isObject=function( object )
       {
           if( object instanceof Array )
             return true;
           var prop = typeof object;
           if( object === null || prop === 'undefined' ||  prop !=='object' )
                return false;
           return true;
       }

    }
    Variable.prototype.constructor = Variable;
    Variable.prototype.length=0;
    Variable.prototype.error=function()
    {
        return '';
    }


    var template_contents={};
    var getTemplateContent=function( source )
    {
        var template,container;
        template = container = source;

        if( typeof source === 'string' )
        {
            source= Utils.trim( source );
            if( source.charAt(0) !== '<' )
            {
                container = Breeze( source );
            }

        }else if( Utils.isHTMLElement(source) )
        {
            container = Breeze( source );
        }

        if( container instanceof Breeze )
        {
            if( !Utils.nodeName(container[0]).match(/noscript|textarea/) )
            {
                throw new Error('invalid template.')
            }
            template = container.content();

        }else if( typeof template !== 'string' )
        {
            throw new Error('invalid template.')
        }
        return Utils.trim( template );
    },
    jscodeReg = /^\s*(if|for\s*\(|else|do|switch|case|break|var|function|while|foreach|{|})(.*)?/g,
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
                var foreach=foreachReg.exec( _result[2] )
                if( typeof _result[2] ==='string' && foreach )
                {
                    var data = foreach[1];
                    var key  ='key';
                    var item = foreach[2];
                    if(  typeof foreach[3] === 'string' )
                    {
                        key=foreach[2];
                        item=foreach[3];
                    }
                    code = 'if( this.isObject('+data+') )for(var '+key+' in '+data+'){\n';
                    code += 'var '+item+'='+data+'['+key+'];\n';
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

        if( variable instanceof Variable && variable.length > 0)
        {
            var keys = variable.toKeys();
            for( var v in keys )
            {
                code+='var '+keys[v]+'= this.get("'+keys[v]+'");\n';
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
     * 模板编译器
     * @param target
     * @returns {Template}
     * @constructor
     */
    function Template()
    {
        if( !(this instanceof Template) )
        {
           return new Template();
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
         * 获取设置模板选项
         * @param options
         * @returns {{left: string, right: string, shortLeft: string, shortRight: string}}
         */
        this.options=function( options )
        {
            if( typeof options === "undefined" )
            {
                return _options;
            }
            _options=Utils.extend( _options, options || {} );
        }

        /**
         * @private
         */
        var _split=null;

        /**
         * @private
         * @returns {RegExp}
         */
        var getSplit=function()
        {
            if( _split === null )
            {
                var o = this.options();
               // _split=new RegExp(o.left+'([^'+o.right+']+)'+o.right+'|'+o.shortLeft+'([^'+o.shortRight+']+)'+o.shortRight,'gi');
                _split=new RegExp(o.left+'(.*?)'+o.right+'|'+o.shortLeft+'(.*?)'+o.shortRight,'gi');
            }
            return _split;
        }

        var self = this;
        var dispatch=function(event)
        {
           var ev = new TemplateEvent( TemplateEvent.REFRESH );
               ev.originalEvent=event;
               ev.viewport = this
               ev.html = makeTemplate;
               ev.variable = self.variable()
               self.dispatchEvent(  ev  );
        }

        /**
         * @private
         */
        var _viewport=null;

        /**
         * 获取设置目标容器
         * @param target
         * @returns {*}
         */
        this.viewport=function( viewport )
        {
            if( typeof viewport !== "undefined" )
            {
                if (typeof viewport === 'string')
                {
                    viewport = Utils.trim(viewport);
                    if (viewport.charAt(0) !== '<')
                        viewport = Breeze(viewport);

                } else if (Utils.isHTMLElement(viewport))
                {
                    viewport = Breeze( viewport );
                }

                if (viewport instanceof Breeze && viewport.length < 1) {
                    throw new Error('invalid viewport.')
                }
                viewport.removeEventListener(ElementEvent.ADDED,dispatch);
                viewport.addEventListener( ElementEvent.ADDED ,dispatch);
                _viewport = viewport;
            }
            return _viewport;
        }

        /**
         * @private
         */
        var _variable=null;

        /**
         * 获取此模板的作用域
         * @returns {*}
         */
        this.variable=function(name,value)
        {
            if( name instanceof Variable )
            {
                _variable=name;
                return this;
            }

            if (_variable === null)
            {
                _variable = new Variable();
            }

            if( typeof name === "undefined" )
            {
                return _variable;
            }
            _variable.set(name, value);
            return this;
        }

        /**
         * 渲染模板视图
         * @param template
         * @param data
         * @param flag
         * @returns {*}
         */
        this.render=function(source,flag )
        {
              flag = !!flag;
              var template = getTemplateContent( source );
              if( template.charAt(0) !== '<' )
                return false;

             var event=new TemplateEvent( TemplateEvent.START );
                 event.template = template;
                 event.variable = this.variable();
                 event.viewport = this.viewport();

              if( !this.hasEventListener( TemplateEvent.START ) || this.dispatchEvent( event ) )
              {
                  template=make.call(this, event.template , event.variable , getSplit.call(this) );
                  if( this.hasEventListener( TemplateEvent.DONE ) )
                  {
                      event.type = TemplateEvent.DONE;
                      event.html = template;
                      if( !this.dispatchEvent( event ) )
                      {
                          return false;
                      }
                      template=event.html;
                  }
                  makeTemplate=template;
                  if( !flag && event.viewport instanceof Breeze )
                  {
                      event.viewport.html( template );
                      return true;
                  }
                  return template;
              }
            return false;
        }
        var makeTemplate='';
    }

    Template.prototype = new EventDispatcher()
    Template.prototype.constructor = Template;

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

    function TemplateEvent( src, props ){ BreezeEvent.call(this, src, props);}
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
