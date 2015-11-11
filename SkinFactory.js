/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{

    function SkinFactory( options )
    {
        var getElement = function( name )
        {
            if( typeof options.elements[ name ] !== "string" )
                return null;
            var element = options.elements[ name ];
            var attr = options.attr && options.attr[name] ? options.attr[name] : '';
            if( attr !='' && Breeze.isObject( attr , true ) )
            {
                attr = Breeze.serialize( attr , 'attr' );
            }
            return element.replace(/\{include\.(\w)+\}/,getElement).replace('{attr}', attr )
        }
        for(var name in options.elements )
        {
            options.elements[ name ] = getElement( name );
        }
        return options;
    }

    window.SkinFactory=SkinFactory;


})( window )
