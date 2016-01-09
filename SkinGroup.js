/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

/*
 @example
 var skinObject={
     html: {
         head: '<div>{elements label+close}</div>',
         label: '<label>Title</label>',
         close: '<span>关闭</span>',
         body:  '<div></div>',
         cancel:'<button {attributes button}>取消</button>',
         submit:'<button {attributes button}>确认</button>',
         container:'<div>{elements head+body+footer}</div>',
         footer:'<div><div style="width: auto; height: auto; float: right;">{elements cancel+submit}</div></div>'
     } ,
     attr:{
         head:{ 'style':{'width':'100%',height:'30px',lineHeight:'30px','display':'block',backgroundColor:'#3a3a3a',color:'#d6d6db','fontSize':'14px'}  },
         label:{ 'style':{'width':'auto','display':'block',cursor:'pointer','float':'left',margin:'0px 10px'} },
         close:{ 'style':{'width':'auto',height:'25px',padding:"0px",margin:'0px',cursor:'pointer','float':'right',margin:'0px 10px'} },
         body:{ 'style':{padding:'10px','width':'100%',height:'auto','display':'block',overflow:'auto',backgroundColor:'#ffffff'} },
         button:{ 'style':{margin:'0px 5px', width:'auto',height:'25px',padding:"0px 10px"} },
         container:{ 'style':{'width':'800px',height:'550px','display':'none',overflow:'hidden','position':'absolute','zIndex':999,'backgroundColor':'#3a3a3a','shadow':'0px 0px 10px 2px #444444','radius':'5px'}},
         footer:{ 'style':{'width':'100%',height:'35px',lineHeight:'30px','display':'block',backgroundColor:'#d6d6db'}}
     }
 }
  new SkinGroup( skinObject,  document.body );
 */


(function(window,undefined )
{

    /**
     * @type {RegExp}
     */
    var htmlReg=/\{(html)\s+([\w\s\+\.]+)\s*\}/g;
    var attrReg = /\{(attr)\s+([\w\s\+\.]+)\s*\}/g;
    var isattrReg = /^\s*\<\w+[^\>]*\{attr.*?\}/;
    var blank=/\s+/g;
    var isselector=/^[\.\#]?\w+/;
    var addattr=/\<(\w+)/;
    var hasskinname=null;

    /**
     * @returns {string}
     */
    var toString=function()
    {
        var options = this;
        var parser = function(all, prop, item )
        {
            item= item.replace(blank,'').replace( new RegExp(prop+'.','g'),'').split('+');
            var length=0;
            var attr={},str='';

            for( ; length < item.length ; length++ )
            {
                var refObject = options;
                var keys  = [ prop ].concat( item[ length ].split('.') );
                var isstyle=false;
                for (var index in keys)
                {
                    if( !refObject[ keys[index] ] )
                    {
                        refObject='';
                        break;
                    }
                    isstyle = !isstyle ? 'style' === keys[index] : isstyle ;
                    refObject = refObject[ keys[index] ];
                }

                if( typeof refObject === 'function')
                {
                    refObject = refObject.call(options, prop, item);
                }

                if( isstyle ===true )
                {
                    attr.style || (attr.style={});
                    Utils.extend(true,attr.style,refObject);

                }else if( typeof refObject === "string" )
                {
                    str+=refObject;
                }else if ( Utils.isObject(refObject, true) )
                {
                    Utils.extend(true,attr,refObject);
                }
            }

            if( !Utils.isEmpty(attr) )
            {
                if ( Utils.isObject(attr.style) )
                {
                    var style = attr.style;
                    if( typeof attr['class'] !== "undefined" )
                    {
                        var props = ['width','height'], style={};
                        for( var i in props )if( typeof attr.style[ props[i] ] !== "undefined" )style[ props[i] ]=attr.style[ props[i] ];
                    }
                    attr.style = Utils.serialize(style, 'style');
                }

                str += Utils.serialize(attr, 'attr');
            }

            return str.replace(htmlReg,parser);
        }

        if( hasskinname === null )
        {
           hasskinname=new RegExp('^\s*\<\w+[^\>]*'+SkinGroup.NAME+'\s*\=','i');
        }

        for (var name in this.html)
        {
            if( !hasskinname.test(this.html[name]) )
                this.html[name] = this.html[name].replace( addattr, '<$1 '+SkinGroup.NAME+'="'+name+'"');

            if( !isattrReg.test( this.html[name] ) )
                this.html[name] = this.html[name].replace( addattr, "<$1 {attr " + name + "}");
            this.html[name] = this.html[name].replace(attrReg,parser);
        }

        for (var name in this.html)
        {
           this.html[name] = this.html[name].replace(htmlReg,parser);
        }
        this.html.container=this.html.container.replace(htmlReg,parser);
        return this.html.container;
    }


    /**
     * 皮肤组件
     * @extends Breeze
     * @param string|object skinObject 皮肤对象。 如果此参数是一个选择器或者是一个完整的HTML格式的字符串，将直接将此参数当作是一个完整的皮肤组件。
     *    一个完整的皮肤对象必须为以下格式。其html中必须设置container属性
     *  {
     *       //每个皮肤部件对应的HTML元素
     *        html: {
     *            //body 皮肤对应的HTML元素
     *            body:  '<div></div>',
     *            label:  '<label>Label</label>',
     *            //皮肤包裹容器中引用皮肤部件 body 元素
     *            container:  '<div>{elements body}</div>'
     *        } ,
     *        //指定皮肤的属性
     *        attr:{
     *            body:{ 'style':{padding:'10px'}，'id':'body'}
     *        }
     *    }
     *
     *  在 elements 皮肤元素中可以直接引用多个属性或者皮肤。
     *  比如： container：'<div {attributes body.style}>{elements body}</div>' 这样 container 皮肤就拥有了body 皮肤的样式。
     *         container：'<div {attributes body.style}>{elements body+label}</div>' 这样在 container 皮肤下显示 body 和 label元素
     *
     *  注意：在elements对象下的所有键名默认为皮肤名，如果需要操作指定的的皮肤组件只需要使用 currentSkin(skinName)。
     *     使用完后必须调用current(null) 回滚到皮肤主容器，否则将有可能得不到正确的结果。
     *     当皮肤组件解析完成后会自动添加到context中。
     *
     * @param selector|HTMLElement context 皮肤上的父容器。皮肤组装完成后添加到的父容器。
     * @param function callback 如果是一个模板皮肤通过此回调方法解析后返回。
     * @returns {SkinGroup}
     * @constructor
     */
    function SkinGroup( skinObject, context ,callback)
    {
        if( !(this instanceof SkinGroup) )
            return new SkinGroup( skinObject, context,callback);

        if( typeof skinObject === "string" )
        {
           skinObject= isselector.test(skinObject) ? Sizzle(skinObject,context)[0] : Utils.createElement( skinObject ) ;

        }else if( Utils.isObject(skinObject) )
        {
            if( !skinObject.html || typeof skinObject.html.container !== "string" )
            {
                throw new Error('invaild skinObject');
            }
            skinObject= toString.call( skinObject );
            skinObject=Utils.createElement(  typeof callback === "function" ? callback( skinObject ) : skinObject )
        }

        if( Utils.isNodeElement(skinObject) && !Utils.isDocument(skinObject) )
        {
            var nodename = Utils.nodeName( skinObject );
            if( nodename === 'noscript' ||  nodename === 'textarea')
            {
                context = typeof context === "undefined" ? skinObject.parentNode : context;
                skinObject = nodename === 'textarea' ? skinObject.value : skinObject.innerHTML;
                skinObject= typeof callback === "function" ? callback( skinObject ) : skinObject;
            }
        }
        Breeze.call(this,skinObject,context);
        if( this.length != 1 )
            throw new Error('Create skinObject failed');
        this.__skin__={'container': this[0]};
    }

    /**
     * 将一个符合皮肤格式的对象转换成HTML格式的字符串
     * @param object skinObject 皮肤对象
     * @returns {*}
     */
    SkinGroup.toString=function(skinObject)
    {
        if( Utils.isObject(skinObject) )
        {
            if( !skinObject.html || typeof skinObject.html.container !== "string" )
            {
                throw new Error('invaild skinObject');
            }
            return toString.call( skinObject );
        }
        return '';
    }

    /**
     * 创建一个皮肤对象
     * @param skinContainer
     * @param skinParts
     * @param skinAttr
     * @returns {{html: *, attr: *}}
     */
    SkinGroup.createSkinObject=function(skinContainer,skinParts,skinAttr)
    {
        if( typeof skinContainer !=="string" )
            throw new Error('invaild skinContainer');
        skinParts || (skinParts={})
        skinAttr || (skinAttr={})
        skinParts.container=skinContainer;
        return {
            'html':skinParts,
            'attr':skinAttr
        };
    }

    SkinGroup.NAME='skin';
    SkinGroup.prototype=new Breeze();
    SkinGroup.prototype.__skin__={};
    SkinGroup.prototype.constructor=SkinGroup;


    /**
     * 获取指定皮肤名的元素
     * @param string skinName
     * @returns {HTMLElement}
     */
    SkinGroup.prototype.getSkin=function( skinName )
    {
        if( typeof this.__skin__[skinName] === "undefined" )
        {
            var ret = Sizzle(  Utils.sprintf('[%s="%s"]', SkinGroup.NAME, skinName ) , this.__skin__.container );
            this.__skin__[skinName]=ret[0] || null;
        }
        return this.__skin__[skinName];
    }

    /**
     * 设置指定皮肤名为当前操作的元素
     * @param skinName
     * @returns {SkinGroup}
     */
    SkinGroup.prototype.currentSkin=function( skinName )
    {
        var skin = this.getSkin( skinName );
        if( !skin ) throw new Error('Not found skin element is '+skinName );
        this.current( skin )
        return this;
    }

    window.SkinGroup=SkinGroup;


})( window )
