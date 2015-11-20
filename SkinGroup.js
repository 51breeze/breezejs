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

    function SkinGroup( group )
    {
        if( !(this instanceof SkinGroup) )
            return new SkinGroup( group );

        if( typeof group === "object" )
        {
            group.elements && ( this.elements = group.elements );
            group.attributes && ( this.attributes = group.attributes );
        }
    }

    SkinGroup.prototype.constructor=SkinGroup;
    SkinGroup.prototype.elements={};
    SkinGroup.prototype.attributes={};

    /**
     * @param string container
     * @returns {*}
     */
    SkinGroup.prototype.container=function( container )
    {
        if( typeof container === "string") {
            this.elements.container = container;
            return this;
        }
        return this.elements.container || '';
    }

    /**
     * @returns {string}
     */
    SkinGroup.prototype.toString=function()
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
                    if( typeof attr.class !== "undefined" )
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

        if( !this.attached )
        {
            for (var name in this.elements)
            {
                this.elements[name] = this.elements[name].replace(notattr, "<$1 {attributes " + name + "}$2>");
                if( this.attributes[ name ] && !this.attributes[ name ]['data-skin'] )
                {
                    this.attributes[ name ]['data-skin']= name;
                }
            }
            this.attached=true;
        }
        return this.container().replace(refvalue,parser);
    }

    window.SkinGroup=SkinGroup;

})( window )
