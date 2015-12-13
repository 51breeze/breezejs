/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
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
     * @param selector
     * @param context
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

        if( this.length < 1 )
            throw new Error('Create skinContainer failed');

        /**
         * @private
         */
        var _skin={};

        /**
         * @param string skinName
         * @returns {HTMLElement}
         */
        this.getSkin=function( skinName )
        {
            if( typeof _skin[skinName] === "undefined" )
            {
                var ret = Sizzle(  Utils.sprintf('[%s="%s"]', SkinGroup.NAME, skinName ) , this[0] );
                _skin[skinName]=ret[0] || null;
            }
            return _skin[skinName];
        }

        /**
         * @param skinName
         * @returns {SkinGroup}
         */
        this.currentSkin=function( skinName )
        {
            var skin = this.getSkin( skinName );
            if( !skin ) throw new Error('Not found skin element is '+skinName );
            this.current( skin )
            return this;
        }
    }

    SkinGroup.NAME='skin';
    SkinGroup.prototype=new Breeze();
    SkinGroup.prototype.constructor=SkinGroup;
    window.SkinGroup=SkinGroup;

})( window )
