/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

/*
 @example
 var defaultSkin={
     elements: {
         head: '<div>{elements label+close}</div>',
         label: '<label>Title</label>',
         close: '<span>关闭</span>',
         body:  '<div></div>',
         cancel:'<button {attributes button}>取消</button>',
         submit:'<button {attributes button}>确认</button>',
         footer:'<div><div style="width: auto; height: auto; float: right;">{elements cancel+submit}</div></div>'
     } ,
     attributes:{
         head:{ 'style':{'width':'100%',height:'30px',lineHeight:'30px','display':'block',backgroundColor:'#3a3a3a',color:'#d6d6db','fontSize':'14px'}  },
         label:{ 'style':{'width':'auto','display':'block',cursor:'pointer','float':'left',margin:'0px 10px'} },
         close:{ 'style':{'width':'auto',height:'25px',padding:"0px",margin:'0px',cursor:'pointer','float':'right',margin:'0px 10px'} },
         body:{ 'style':{padding:'10px','width':'100%',height:'auto','display':'block',overflow:'auto',backgroundColor:'#ffffff'} },
         button:{ 'style':{margin:'0px 5px', width:'auto',height:'25px',padding:"0px 10px"} },
         container:{ 'style':{'width':'800px',height:'550px','display':'none',overflow:'hidden','position':'absolute','zIndex':999,'backgroundColor':'#3a3a3a','shadow':'0px 0px 10px 2px #444444','radius':'5px'}},
         footer:{ 'style':{'width':'100%',height:'35px',lineHeight:'30px','display':'block',backgroundColor:'#d6d6db'}}
     }
 }
  new SkinGroup( "<div>{elements head+body+footer}</div>" , defaultSkin,  document.body );
 */


(function(window,undefined )
{

    /**
     * @type {RegExp}
     */
    var refvalue=/\{(\w+)\s+([\w\s\+\.]+)\s*\}/g;
    var notattr = /\{attributes\s+([\w\s\+\.]+)\s*\}/;
    var blank=/\s+/g;
    var isselector=/^[\.\#]?\w+/;
    var addattr=/\<(\w+)/;

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
                    isstyle = 'style' === keys[index];
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
                if ( Utils.isObject(attr.style, true) )
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
            return str.replace(refvalue,parser);
        }

        var regname=new RegExp(SkinGroup.NAME,'i');
        for (var name in this.elements)
        {
            if( !regname.test(this.elements[name]) )
                this.elements[name] = this.elements[name].replace( addattr, '<$1 '+SkinGroup.NAME+'="'+name+'"');
            if( !notattr.test( this.elements[name] ) )
                this.elements[name] = this.elements[name].replace( addattr, "<$1 {attributes " + name + "}");
        }
        return this.elements.container.replace(refvalue,parser);
    }


    /**
     * 皮肤组件
     * @extends Breeze
     * @param string skinContainer 皮肤包裹容器。 如果此参数是一个选择器或者是一个完整的HTML格式的字符串将会忽略 skinParts 的参数，直接将此参数当作是一个完整的皮肤组件。
     * @param object skinParts 皮肤组成部件。一个完整的皮肤部件必须为以下格式。
     *  {
     *       //每个皮肤部件对应的HTML元素
     *        elements: {
     *            //body 皮肤对应的HTML元素
     *            body:  '<div></div>',
     *            label:  '<label>Label</label>',
     *            //皮肤包裹容器中引用皮肤部件 body 元素
     *            container:  '<div>{elements body}</div>'
     *        } ,
     *        //指定皮肤的属性
     *        attributes:{
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
     * @param selector|HTMLElement context 皮肤上的父容器。皮肤组装完成后将要添加到的父容器。
     * @returns {SkinGroup}
     * @constructor
     */
    function SkinGroup( skinContainer, skinParts, context )
    {
        if( !(this instanceof SkinGroup) )
            return new SkinGroup( skinContainer, skinParts, context);

        if( typeof skinContainer === "string" )
        {
            if( isselector.test(skinContainer) )
            {
               skinContainer=Sizzle(skinContainer,context)[0];

            }else
            {
                if( typeof skinParts === "object" )
                {
                    skinParts.elements || (skinParts.elements={})
                    skinParts.elements.container=skinContainer;
                    skinContainer=toString.call(skinParts);
                }
                skinContainer=Utils.createElement( skinContainer );
            }
        }

        if( Utils.isHTMLElement(skinContainer) )
        {
            Breeze.call(this,skinContainer,context);
        }

        if( this.length != 1 )
            throw new Error('Create skinContainer failed');
        this.__skin__={'container': this[0]};
    }

    /**
     * 将一个符合皮肤格式的对象转换成HTML格式的字符串
     * @param string skinContainer html包裹容器
     * @param object skinParts 皮肤组成部分
     * @returns {*}
     */
    SkinGroup.toString=function(skinContainer,skinParts)
    {
        if( Utils.isObject(skinParts) )
        {
            skinParts.elements || (skinParts.elements={})
            skinParts.elements.container=skinContainer;
            return toString.call(skinParts);
        }
        return skinContainer;
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
