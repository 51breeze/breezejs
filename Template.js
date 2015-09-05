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

    }
    Variable.prototype.constructor = Variable;
    Variable.prototype.length=0;
    Variable.prototype.error=function()
    {
        console.log('error')
        return '';
    }

    var template_contents={};

    function Template( target , cache )
    {
        if( !(this instanceof Template) )
           return  new Template(context);

        var  context = null;
        var  cacheEnable = (cache!==false);
        if( typeof target === 'string' )
        {
            target= Breeze.trim( target );
            if( target.charAt(0) !== '<' )
                context=Breeze( target );

        }else if( Breeze.isHTMLElement(target) )
        {
            context=Breeze( target );
        }

        if( context instanceof Breeze && context.length < 1 )
        {
            throw new Error('invalid context.')
        }

        var left="<\\?",
            right="\\?>",
            shortLeft="\\{",
            shortRight="\\}",
            splitReg= new RegExp(left+'([^'+right+']+)'+right+'|'+shortLeft+'([^'+shortRight+']+)'+shortRight,'gi'),
            jscodeReg = /(^\s*(if|for|else|do|switch|case|break|{|}))(.*)?/g,
            funReg = /^([\w\.]+)\s*\(/,
            variable=null,
            replace = function( code , flag )
            {
                code=code.replace(/(^\s+|\s+$)/g,'').replace(/[\r\n\t\s]+/g,' ');
                if( code == "" )
                  return "";
                if( flag===true && code.match(jscodeReg) )
                {
                    return code+'\n';
                }
                return '___code___+="' + code.replace(/"/g, '\\"') + '";\n';
            },
            make = function(template, variable )
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

                while( match = splitReg.exec(template) )
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

               console.log( code )


                return new Function( code ).call( variable , template );
            }

        /**
         * 指定一个变量名的值
         * @param name
         * @param value
         * @returns {Template}
         */
        this.assign=function(name,value)
        {
            this.variable().set(name,value)
            return this;
        }

        /**
         * 获取变量构造器
         * @returns {*}
         */
        this.variable=function()
        {
            if( variable=== null )
            {
                variable = new Variable()
            }
            return variable;
        }

        var template,
        container,
        content=function( source )
        {
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
                if( container.length > 1 || !Breeze.nodeName(container[0]).match(/noscript|textarea/) )
                {
                    throw new Error('invalid template.')
                }

                if( template_contents[ container.toString() ] )
                {
                    template=template_contents[ container.toString() ];

                }else
                {
                    template = container.content();
                    if( cacheEnable )
                        template_contents[ container.toString() ]=template;
                }

            }else if(  typeof template !== 'string' )
            {
                throw  new Error('invalid template.')
            }
            return Breeze.trim( template );
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
              var template = content( source );

              if( template.charAt(0) === '<' )
              {
                 if( this.hasEventListener( TemplateEvent.COMPILE_START ) )
                 {
                     var event =  new TemplateEvent( TemplateEvent.COMPILE_START )
                         event.data = template;
                     this.dispatchEvent( event )
                 }
                 template=make(template, variable );
              }

              if( !flag )
              {
                  if( context instanceof Breeze )
                  {
                      context.addElementAt( template );

                  }else if(container instanceof Breeze )
                  {
                      container.addElementAt(template, container[0] );
                  }
                  return true;
              }
              return template;
        }
    }

    Template.prototype = new EventDispatcher()
    Template.prototype.constructor = Template;

    function TemplateEvent( src, props ){ BreezeEvent.call(this, src, props);}
    TemplateEvent.prototype=new BreezeEvent();
    TemplateEvent.prototype.constructor=TemplateEvent;
    TemplateEvent.COMPILE_READY='compileReady';
    TemplateEvent.COMPILE_START='compileStart';
    TemplateEvent.COMPILE_END='compileEnd';

    window.Template = Template;
    window.TemplateEvent = TemplateEvent;


})(window)
