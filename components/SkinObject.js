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


define('components/SkinObject',['Breeze'],function( Breeze )
{

    /**
     * @type {RegExp}
     */
    var htmlReg=/\{(skins)\s+([\w\s\+\.]+)\s*\}/g;
    var attrReg = /\{(attr)\s+([\w\s\+\.]+)\s*\}/g;
    var isattrReg = /^\s*\<\w+[^\>]*\{attr.*?\}/;
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
                    isstyle = !isstyle ? 'style' === keys[index] : isstyle ;
                    refObject = refObject[ keys[index] ];
                }

                if( typeof refObject === 'function')
                {
                    refObject = refObject.call(options, prop, item);
                }

                if( isstyle ===true )
                {
                    attr.style || (attr.style = {});
                    Breeze.extend(true, attr.style, refObject);

                }else if( typeof refObject === "string" )
                {
                    str+=refObject;
                }else if ( Breeze.isObject(refObject, true) )
                {
                    Breeze.extend(true,attr,refObject);
                }
            }

            if( !Breeze.isEmpty(attr) )
            {
                !Breeze.isObject(attr.style) || ( attr.style = Breeze.serialize(attr.style, 'style') );
                if( typeof attr.style === "string" && attr.style !== '' )
                {
                    attr.style= Breeze.formatStyle( attr.style )
                }
                str += Breeze.serialize(attr, 'attr');
            }
            return str.replace(htmlReg,parser);
        };

        this.skins.container = this.container;
        for (var name in this.skins)
        {
            var attr = this.attr[name] || (this.attr[name]={});
            if( name !== 'container' )
            {
                var val = attr['skin'] || '';
                val = val.replace(new RegExp('(^|\\s+)+'+name+'(\\s+|$)','ig'),' ');
                attr['skin'] = Breeze.trim(val+' '+name);
            }
            if( !isattrReg.test( this.skins[name] ) )this.skins[name] = this.skins[name].replace( addattr, "<$1 {attr "+name+"}" );
            this.skins[name] = this.skins[name].replace(attrReg,parser);
        }

        for (var name in this.skins)
        {
           this.skins[name] = this.skins[name].replace(htmlReg,parser);
        }
        this.container=this.skins.container.replace(htmlReg,parser);
        return this.container;
    };



    /**
     * 皮肤对象.将一个符合皮肤格式的对象转换成HTML格式的字符串
     * @param string|NodeElement container 包裹容器
     * @param object skins 包裹容器中所需要组合的皮肤元素
     * @param object attr 皮肤元素对应属性
     * @returns {SkinObject}
     * @constructor
     */
    function SkinObject( container, skins, styleSheet, attr, requireSkin )
    {
        if( !(this instanceof SkinObject ) )
            return new SkinObject(container,skins, styleSheet, attr, requireSkin );

        if( typeof container !== "string" )
        {
            var nodename = Breeze.nodeName( container );
            if( nodename === 'noscript' || nodename === 'script' || nodename === 'textarea' )
            {
                container =  nodename === 'textarea' ? container.value : container.innerHTML;
            }
        }

        this.container=container;
        this.attr=attr || {};
        this.skins=skins || {};
        this.styleSheet=styleSheet || {};
        this.requireSkin = requireSkin || [];
        this.__styleName__=undefined;
    }

    SkinObject.prototype.constructor= SkinObject;
    SkinObject.prototype.skins= {};
    SkinObject.prototype.attr= {};
    SkinObject.prototype.styleSheet= {};
    SkinObject.prototype.requireSkin= [];
    SkinObject.prototype.container='';
    SkinObject.prototype.created=false;


    /**
     * @private
     */
    SkinObject.prototype.__styleName__=undefined;

    /**
     * 为当前皮肤对象下的样式属性生成到指定样式名的样式表中
     * @param string styleName
     * @returns {SkinObject|string}
     */
    SkinObject.prototype.styleName=function( styleName )
    {
        if( typeof styleName !== "undefined" )
        {
            this.__styleName__ = styleName;
            return this;
        }
        return this.__styleName__;
    };

    /**
     * 将一个皮肤对象生成html格式的字符串
     * @returns {string}
     */
    SkinObject.prototype.createSkin=function()
    {
        if( this.created===true )return this.container;
            this.created=true;
        return toString.call( this );
    };

    /**
     * 获取皮肤对象中的属性。
     * 如果此对象没有传入 attr|skins 参数那么会返回 null。
     * @param name
     * @returns {*}
     */
    SkinObject.prototype.get=function( name )
    {
        var result = this;
        if( typeof name === "string" )
        {
            var keys = name.replace(/\s+/,'').split('.');
            for( var index = 0; index < keys.length && result; index++ )
            {
                result = result[ keys[index] ] || null;
            }
        }
        return result;
    };
    return SkinObject;

});
