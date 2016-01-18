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
    var htmlReg=/\{(part)\s+([\w\s\+\.]+)\s*\}/g;
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

        this.part.container = this.container;
        for (var name in this.part)
        {
            if( !hasskinname.test(this.part[name]) )
                this.part[name] = this.part[name].replace( addattr, '<$1 '+SkinGroup.NAME+'="'+name+'"');

            if( !isattrReg.test( this.part[name] ) )
                this.part[name] = this.part[name].replace( addattr, "<$1 {attr " + name + "}");
            this.part[name] = this.part[name].replace(attrReg,parser);
        }

        for (var name in this.part)
        {
           this.part[name] = this.part[name].replace(htmlReg,parser);
        }
        this.container=this.part.container.replace(htmlReg,parser);
        return this.container;
    }


    /**
     * 皮肤对象.将一个符合皮肤格式的对象转换成HTML格式的字符串
     * @param container
     * @param part
     * @param attr
     * @returns {SkinObject}
     * @constructor
     */
    function SkinObject( container,part, attr )
    {
        if( !(this instanceof SkinObject ) )
            return new SkinObject(container,part,attr);

        if( typeof container !== "string" )
        {
            var nodename = Utils.nodeName( container );
            var type = container.getAttribute('type');
            if( nodename === 'noscript' ||  nodename === 'textarea' || ( nodename === 'script' && (type==='text/html' || type==='text/plain') ) )
            {
                container = nodename === 'textarea' ? container.value : container.innerHTML;
            }
        }
        this.container=container;
        this.attr=attr;
        this.part=part;
    }

    SkinObject.prototype.constructor= SkinObject;
    SkinObject.prototype.part= {};
    SkinObject.prototype.attr= {};
    SkinObject.prototype.container='';
    SkinObject.prototype.createSkin=function()
    {
        return typeof this.container !== "string" ? this.container : toString.call( this );
    }

    /**
     * 获取对象属性
     * @param name
     * @returns {*}
     */
    SkinObject.prototype.get=function( name )
    {
        var result = this;
        if( typeof name === "string" )
        {
            var keys = name.replace(/\s+/,'').split('.');
            for( var index = 0; index < keys.length ; index++ )
            {
                if( typeof result[ keys[index] ] === "undefined" )
                {
                   throw new Error('invalid property is in SkinObject::get '+ keys[index] )
                }
                result = result[ keys[index] ];
            }
        }
        return result;
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
     * @param selector|HTMLElement viewport 皮肤所要呈现的视口容器。
     * @param selector context 上下文
     * @param SkinObject skinObject 皮肤对象，可以是空。
     * @returns {SkinGroup}
     * @constructor
     */
    function SkinGroup( selector, context ,skinObject )
    {
        if( !(this instanceof SkinGroup) )
            return new SkinGroup( selector,context );

        Breeze.call(this, selector instanceof Breeze ? selector[0] : selector , context );
        if (this.length != 1)
            throw new Error('invalid selector');

        if( !skinObject )
        {
            var child = this.find('script,noscript', true);
            if ( child[0] )
            {
                skinObject = new SkinObject( child[0] );
            }
        }
        this.__skinObject__ = skinObject || null;
    }

    SkinGroup.NAME='skin';
    SkinGroup.prototype=new Breeze();
    SkinGroup.prototype.__skin__={};
    SkinGroup.prototype.__skinObject__=null;
    SkinGroup.prototype.__created__=false;
    SkinGroup.prototype.constructor=SkinGroup;

    /**
     * 初始化皮肤组。此方法在程序内部调用，无需手动调用。
     * @returns {boolean}
     */
    SkinGroup.prototype.createSkin=function()
    {
        if( this.__created__ !==true )
        {
           this.__created__=true;
           var skinObject = this.skinObject();
            if( !(skinObject instanceof SkinObject) )
              throw new Error('invalid skinObject')
           var skin= skinObject.createSkin();
           if( typeof skin === "string" )
           {
              this.html( skin );
              return true;
           }
        }
        return false;
    }

    /**
     * 皮肤组对象
     * @param skinObject
     * @returns {SkinObject|SkinGroup}
     */
    SkinGroup.prototype.skinObject=function( skinObject )
    {
        if( skinObject && skinObject instanceof SkinObject )
        {
            this.__skinObject__=skinObject;
            return this;
        }
        return this.__skinObject__ && typeof this.__skinObject__.container === "string" ? this.__skinObject__ : null;
    }

    /**
     * 添加子级皮肤到当前皮肤组
     * @param childSkin
     * @param skinName
     * @param index
     * @returns {SkinGroup}
     */
    SkinGroup.prototype.addChildSkin=function( childSkin , skinName, index )
    {
        index = isNaN(index) ? -1 : index ;
        childSkin = Utils.createElement( childSkin );
        this.addChildAt(  childSkin , index );
        if( typeof skinName === "string" )
        {
            Utils.property(childSkin, SkinGroup.NAME, skinName);
        }
        return childSkin;
    }

    /**
     * 获取指定皮肤名的元素
     * @param string skinName
     * @returns {HTMLElement}
     */
    SkinGroup.prototype.getSkin=function( skinName )
    {
        if( typeof this.__skin__[skinName] === "undefined" )
        {
            this.__skin__[skinName]= this.find( Utils.sprintf('[%s="%s"]', SkinGroup.NAME, skinName ), true )[0] || null;
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
    window.SkinObject=SkinObject;

})( window )
