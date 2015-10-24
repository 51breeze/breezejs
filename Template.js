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
            source= Breeze.trim( source );
            if( source.charAt(0) !== '<' )
            {
                container = Breeze( source );
            }

        }else if( Breeze.isHTMLElement(source) )
        {
            container = Breeze( source );
        }

        if( container instanceof Breeze )
        {
            if( !Breeze.nodeName(container[0]).match(/noscript|textarea/) )
            {
                throw new Error('invalid template.')
            }
            template = container.content();

        }else if( typeof template !== 'string' )
        {
            throw new Error('invalid template.')
        }
        return Breeze.trim( template );
    },
    jscodeReg = /^\s*(if|for\s*\(|else|do|switch|case|break|var|function|while|foreach|{|})(.*)?/g,
    funReg = /^([\w\.]+)\s*\(/,
    foreachReg  = /(\w+)\s+as\s+(\w+)(\s+(\w+))?/i,
    replace = function( code , flag )
    {
        code=code.replace(/[\r\n\t]+/g,'');
        if( code.replace(/\s+/,'') == "" )
            return "";

        if( flag===true && code.match(jscodeReg) )
        {
            if( RegExp.$1 === 'foreach' )
            {
                if( typeof RegExp.$2 ==='string' && RegExp.$2.match(foreachReg) )
                {
                    var data = RegExp.$1;
                    var key  ='key';
                    var item = RegExp.$2;
                    if(  typeof RegExp.$3 === 'string' )
                    {
                        key=RegExp.$2;
                        item=RegExp.$3;
                    }
                    code = 'if( this.isObject('+data+') )for(var '+key+' in '+data+'){\n';
                    code += 'var '+item+'='+data+'['+key+'];\n';
                    return code;
                }
                code='\n';
            }
            return code+'\n';
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
            code+=replace( template.slice(cursor, match.index) );
            if( match[2] !==undefined )
            {
                var val=match[2].replace(/(^\s+|\s+$)/g,'');
                if( val.match( funReg ) )
                {
                    code +='___code___+= typeof '+RegExp.$1+' === "function" ? '+val+' : this.error();\n';
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
        //console.log( code );
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
            _options=Breeze.extend( _options, options || {} );
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
                    viewport = Breeze.trim(viewport);
                    if (viewport.charAt(0) !== '<')
                        viewport = Breeze(viewport);

                } else if (Breeze.isHTMLElement(viewport))
                {
                    viewport = Breeze( viewport );
                }

                if (viewport instanceof Breeze && viewport.length < 1) {
                    throw new Error('invalid viewport.')
                }
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

             var event=new TemplateEvent( TemplateEvent.COMPILE_START );
                 event.template = template;
                 event.variable = this.variable();
                 event.viewport = this.viewport();

              if( !this.hasEventListener( TemplateEvent.COMPILE_START ) || this.dispatchEvent( event ) )
              {
                  template=make.call(this, event.template , event.variable , getSplit.call(this) );
                  if( this.hasEventListener( TemplateEvent.COMPILE_DONE ) )
                  {
                      event.type = TemplateEvent.COMPILE_DONE;
                      event.html = template;
                      if( !this.dispatchEvent( event ) )
                      {
                          return false;
                      }
                      template=event.html;
                  }

                  if( !flag && event.viewport instanceof Breeze )
                  {
                      event.viewport.html( template );
                      return true;
                  }
                  return template;
              }
            return false;
        }
    }

    Template.prototype = new EventDispatcher()
    Template.prototype.constructor = Template;

    function TemplateEvent( src, props ){ BreezeEvent.call(this, src, props);}
    TemplateEvent.prototype=new BreezeEvent();
    TemplateEvent.prototype.template=null;
    TemplateEvent.prototype.variable=null;
    TemplateEvent.prototype.viewport=null;
    TemplateEvent.prototype.html='';
    TemplateEvent.prototype.constructor=TemplateEvent;
    TemplateEvent.COMPILE_START='compileStart';
    TemplateEvent.COMPILE_DONE='compileDone';
    TemplateEvent.ADD_TO_CONTAINER='addToContainer';

    window.Template = Template;
    window.TemplateEvent = TemplateEvent;
    window.Variable=Variable;


})(window)
