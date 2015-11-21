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
    var isselector=/^([\.\#]\w+[\>\+\~\s])+$/;

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
                this.elements[name] = this.elements[name].replace(notattr, "<$1$2 {attributes " + name + "}>");
                this.attributes[ name ] || (this.attributes[ name ]={});
                if( !this.attributes[ name ]['data-skin'] )
                {
                    this.attributes[ name ]['data-skin']= name;
                }
            }
            this.attached=true;
        }
        return this.elements.container.replace(refvalue,parser);
    }


    /**
     * @param selector
     * @param context
     * @returns {SkinGroup}
     * @constructor
     */
    function SkinGroup( selector , context )
    {
        if( !(this instanceof SkinGroup) )
            return new SkinGroup( selector, context );

        if( !Utils.isHTMLElement(selector) )

        if( selector )

        Breeze.call(this, selector, context );

        /**
         * @private
         */
        var _viewport=null;

        /**
         * @param viewport
         * @returns {*}
         */
        this.viewport=function( viewport )
        {
            if( typeof viewport === "undefined" )
               return _viewport;
            _viewport=viewport;
            return this;
        }
    }

    SkinGroup.prototype=new Breeze();
    SkinGroup.prototype.elements={};
    SkinGroup.prototype.attributes={};
    SkinGroup.prototype.constructor=SkinGroup;

    /**
     * @param string container
     * @returns {*}
     */
    SkinGroup.prototype.container=function( container )
    {
        if( typeof container === "string" )
        {
            this.elements.container=container;
            return this;
        }
        return this.elements.container;
    }

    /**
     * @returns {SkinGroup}
     */
    SkinGroup.prototype.render=function()
    {
         var viewport = this.viewport();


        console.log( this.length , this[0] )

         if( this.length < 1  && viewport)
         {

             this.add( viewport );



             this.addChild( toString.call(this) );
         }

         if( this.hasEventListener( SkinGroupEvent.RENDER ) )
         {
            this.dispatchEvent( new SkinGroupEvent(SkinGroupEvent.RENDER) )
         }
         return this;
    }

    /**
     * @param string skinName
     * @returns {*|null}
     */
    SkinGroup.prototype.getSkin=function( skinName )
    {
        var ret = Sizzle('[data-skin="'+skinName+'"]',this.getContext() );
        return ret[0] || null;
    }

    function SkinGroupEvent( src, props ){ BreezeEvent.call(this, src, props);}
    SkinGroupEvent.prototype=new BreezeEvent();
    SkinGroupEvent.prototype.constructor=SkinGroupEvent;
    SkinGroupEvent.RENDER='skinGroupRender';

    window.SkinGroup=SkinGroup;

})( window )
