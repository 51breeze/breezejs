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
     * @param string|NodeElement container 包裹容器
     * @param object part 包裹容器中所需要组合的皮肤元素
     * @param object attr 皮肤元素对应属性
     * @returns {SkinObject}
     * @constructor
     */
    function SkinObject( container, part, attr )
    {
        if( !(this instanceof SkinObject ) )
            return new SkinObject(container,part,attr);

        if( typeof container !== "string" )
        {
            var nodename = Utils.nodeName( container );
            if( nodename === 'noscript' || nodename === 'script' || nodename === 'textarea' )
            {
                container =  nodename === 'textarea' ? container.value : container.innerHTML;
            }
        }
        this.container=container;
        this.attr=attr || {};
        this.part=part || {};
    }

    SkinObject.prototype.constructor= SkinObject;
    SkinObject.prototype.part= {};
    SkinObject.prototype.attr= {};
    SkinObject.prototype.container='';
    SkinObject.prototype.created=false;

    /**
     * 将一个皮肤对象生成html格式的字符串
     * @returns {string}
     */
    SkinObject.prototype.createSkin=function()
    {
        if( this.created===true )return this.container;
        this.created=true;
        return toString.call( this );
    }

    /**
     * 获取皮肤对象中的属性。
     * 如果此对象没有传入 attr|part 参数那么会返回 null。
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
     * @returns {SkinGroup}
     * @constructor
     */
    function SkinGroup( viewport, context )
    {
        if( !(this instanceof SkinGroup) )
            return new SkinGroup( viewport,context );
        Breeze.call(this, viewport instanceof Breeze ? viewport[0] : viewport , context );
        if (this.length != 1)
            throw new Error('invalid viewport');

        var nodename = this.nodeName();
        if( nodename === 'noscript' || nodename === 'script' || nodename ==='textarea' )
        {
            var index = this[0];
            var skinContainer =  Utils.createElement( nodename==='textarea' ? this[0].value : this[0].innerHTML );
            this.parent().addChildAt( skinContainer, index );
            this.splice(0,this.length,skinContainer);
        }
    }

    SkinGroup.NAME='skin';
    SkinGroup.prototype=new Breeze();
    SkinGroup.prototype.__skin__={};
    SkinGroup.prototype.__skinObject__=null;
    SkinGroup.prototype.__validated__=null;
    SkinGroup.prototype.constructor=SkinGroup;

    /**
     * 验证是否为一个完整的皮肤
     * @returns {boolean}
     */
    SkinGroup.prototype.validateSkin=function()
    {
        if( this.__validated__ === null )
        {
            this.__validated__=false;
            var skinObject = this.skinObject();
            for( var name in skinObject.part )if( name !=='container' &&  getSkin(name, this.getContext() )  )
            {
                this.__validated__=true;
                break;
            }
        }
        return this.__validated__;
    }

    /**
     * 生成皮肤对象并添加到当前容器中。
     * @returns {boolean}
     * @public
     */
    SkinGroup.prototype.createSkin=function()
    {
        if( !this.validateSkin() )
        {
            var skinObject = this.skinObject();
            if (!(skinObject instanceof SkinObject))throw new Error('invalid skinObject');

            var html = skinObject.createSkin();
            if(  html != '' )
            {
                var container = Utils.createElement(  skinObject.createSkin() );
                this.html( container );
            }
        }
        return this;
    }

    /**
     * 获取设置皮肤组对象
     * @param SkinObject skinObject
     * @returns {SkinObject}
     * @public
     */
    SkinGroup.prototype.skinObject=function( skinObject )
    {
        if( skinObject instanceof SkinObject )
        {
            this.__skinObject__= skinObject;
        }
        return this.__skinObject__;
    }

    /**
     * 添加子级皮肤到当前皮肤组
     * @param string childSkin 一个有效的html格式的字符串
     * @param string skinName 皮肤名
     * @param number|nodeElement index  一个数字或者是一个当前视口下的节点元素
     * @returns {SkinGroup}
     */
    SkinGroup.prototype.addChildSkin=function( childSkin , skinName, index )
    {
        index = isNaN(index) ? -1 : index ;
        childSkin = Utils.createElement( childSkin );
        this.addChildAt(  childSkin , index );
        if( typeof skinName === "string" )
        {
            Utils.property(childSkin,SkinGroup.NAME, skinName);
        }
        return childSkin;
    }


    /**
     * @private
     * @param skinName
     * @param context
     * @returns {*|null}
     */
    function getSkin(skinName,context)
    {
        return Utils.sizzle( Utils.sprintf('[%s="%s"]',SkinGroup.NAME,skinName), context )[0] || null;
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
            if( skinName === 'container' )
                this.__skin__[skinName] = this[0];
            else this.__skin__[skinName] =  getSkin(skinName, this.getContext() );
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
        var skin = this.getSkinAndValidate( skinName );
        this.current( skin );
        return this;
    }

    /**
     * 获取皮肤对象。如果不存在则报错
     * @param skinName
     * @returns {HTMLElement}
     */
    SkinGroup.prototype.getSkinAndValidate=function( skinName )
    {
        var skin = this.getSkin( skinName );
        if( !skin ) throw new Error('Not found skin for '+skinName );
        return skin;
    }

    /**
     * 获取指定的皮肤并以Breeze对象返回
     * @param skinName 皮肤名
     * @param flag 始终重新建立
     * @returns {Breeze}
     */
    SkinGroup.prototype.getSkinGroup=function( skinName , flag )
    {
        var key = 'group_'+skinName.replace(/\s+/,'');
        if(  !this.__skin__[ key ] || flag===true )
        {
            skinName = skinName.replace(/(\w+)\s+?(\>?)\s+?(.*)/, function (all, a, b, c) {
                return c === '' ? " return Breeze(this.getSkinAndValidate('" + a + "'))" : "Breeze('" + c + "',this.getSkinAndValidate('" + a + "'))";
            })
            try {
                this.__skin__[key] = eval(skinName + ';');
            }catch ( e )
            {
                throw new Error('invalid skin name');
            }
        }
        return this.__skin__[ key ].current(null);
    }
    window.SkinGroup=SkinGroup;
    window.SkinObject=SkinObject;

})( window )
