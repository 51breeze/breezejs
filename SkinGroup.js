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
    var notattr = /<(\w+)(?!=\{attributes\s+([\w\s\+\.]+)\s*\})>/;
    var blank=/\s+/g;
    var isselector=/^[\.\#]?\w+/;

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

        for (var name in this.elements)
        {
            this.elements[name] = this.elements[name].replace(notattr, "<$1$2 {attributes " + name + "}>");
            this.attributes[ name ] || (this.attributes[ name ]={});
            if( !this.attributes[ name ]['data-skin'] )
            {
                this.attributes[ name ]['data-skin']= name;
            }
        }
        return this.elements.container.replace(refvalue,parser);
    }


    /**
     * @param selector
     * @param context
     * @returns {SkinGroup}
     * @constructor
     */
    function SkinGroup( selector , context , container )
    {
        if( !(this instanceof SkinGroup) )
            return new SkinGroup( selector, context , container );

        /**
         * @private
         */
        var _skin={};

        /**
         * @param string skinName
         * @returns {*|null}
         */
        this.getSkin=function( skinName )
        {
            if( !_skin[skinName] )
            {
                var ret = Sizzle('[data-skin="' + skinName + '"]', this.getContext() );
                if( ret.length === 0 )
                    throw new Error('Not found skin element is '+skinName );
                _skin[skinName]=ret[0];
            }
            return _skin[skinName];
        }

        if( ( typeof selector === "string" && isselector.test(selector) ) || Utils.isHTMLContainer(selector) )
        {
            Breeze.call(this, selector, context );
            this.index(0).property('data-skin','container');
            _skin.container=this[0];

        }else if( context && selector )
        {
            if( typeof selector === "object" )
            {
                if( typeof selector.elements === "undefined" )
                   throw new Error('invalid selector');
                if( typeof container === "string" )
                    selector.elements.container=container;
                selector=toString.call(selector);
            }

            this.add( context );
            this.addChild( selector );
            var container = this.getSkin('container');
            this.splice(0,this.length);
            if( Utils.isHTMLElement(container) )
                this.splice(0, 0, container);
        }

        if( this.length < 1 )
        {
            throw new Error('Need to match at least one element. in param selector, context');
        }
    }

    SkinGroup.prototype=new Breeze();
    SkinGroup.prototype.constructor=SkinGroup;
    window.SkinGroup=SkinGroup;

})( window )
