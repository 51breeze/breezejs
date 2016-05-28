(function(module){

    if( typeof module !== "undefined" )
    {
        throw new Error('invaild module');
    }

    var fix = Breeze.fix();
    var cssOpacity = /opacity=([^)]*)/;
    var cssAalpha = /alpha\([^)]*\)/i;
    fix.cssMap['alpha']='opacity';
    fix.cssHooks.opacity={
        get: function( style )
        {
            return cssOpacity.test( style.filter || "" ) ? parseFloat( RegExp.$1 ) / 100 : 1;
        },
        set: function( style, value )
        {
            value=isNaN(value) ? 1 : Math.max( ( value > 1 ? ( Math.min(value,100) / 100 ) : value ) , 0 )
            var opacity = "alpha(opacity=" + (value* 100) + ")", filter = style.filter || "";
            style.zoom = 1;
            style.filter = Breeze.trim( filter.replace(cssAalpha,'') + " " + opacity );
            return true;
        }
    };

    //获取元素样式
    fix.fnHooks.style.get=function( name )
    {
        var hook=fix.cssHooks[name],style =  elem.currentStyle || elem.style || {};
        if( typeof name === "undefined" ) return style;
        if( name==='cssText' )return (style.style || {} ).cssText || '';

        name=Breeze.styleName( name );
        if( name==='' )return '';
        var ret = style[ name ] || '';
        if( hook && typeof hook.get === "function" )ret=hook.get.call(elem,style,name) || '';

        if( /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i.test( ret ) )
        {
            var left = style.left;
            var rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;
            if ( rsLeft )elem.runtimeStyle.left = left;
            style.left = name === "fontSize" ? "1em" : ret;
            ret = style.pixelLeft + "px";
            style.left = left;
        }
        return ret;
    }

    if( Breeze.isBrowser(Breeze.BROWSER_IE,8,'<') )
    {
        fix.cssHooks.height={
            set: function( style, value )
            {
                if( /(\d+[^\%]+)\s*$/.test(value) )
                {
                    value = parseInt( value );
                    var top = parseInt( Breeze.style(this,'paddingTop') ) || 0;
                    var bottom = parseInt(  Breeze.style(this,'paddingBottom' ) ) || 0;
                    value = (value-top-bottom)+'px';
                }
                style['height']=value
                return true;
            }
        };

        fix.cssHooks.width={
            set: function( style, value )
            {
                if( /(\d+[^\%]+)\s*$/.test(value) )
                {
                    value = parseInt( value );
                    var top = parseInt( Breeze.style(this,'paddingLeft') ) || 0;
                    var bottom = parseInt(  Breeze.style(this,'paddingRight' ) ) || 0;
                    value = (value-top-bottom)+'px';
                }
                style['width']=value;
                return true;
            }
        };
    }

})(Breeze)

