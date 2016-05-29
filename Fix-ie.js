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
        var currentStyle = document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle( this , null ) : this.currentStyle || this.style;
        var ret='';

        if( fix.cssHooks[name] && typeof fix.cssHooks[name].get === "function" )
        {
            ret = fix.cssHooks[name].get.call(this,currentStyle,name);

        }else
        {
            name=Breeze.styleName( name );
            ret = currentStyle[name] ?  currentStyle[name] : this.style[name];
        }

        if( name === 'cssText' && ret.length > 0 && ret.indexOf(';', -1) != ';' )
        {
             ret+=';';

        }else if( /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i.test( ret ) )
        {
            var left = currentStyle.left;
            var rsLeft = this.runtimeStyle && this.runtimeStyle.left;
            if ( rsLeft )this.runtimeStyle.left = left;
            currentStyle.left = name === "fontSize" ? "1em" : ret;
            ret = currentStyle.pixelLeft + "px";
            currentStyle.left = left;
        }
        return ret;
    }

    if( Breeze.isBrowser(Breeze.BROWSER_IE,8,'<') )
    {
        fix.cssHooks.height.set=function( style, value )
        {
            if( /(\d+[^\%]+)\s*$/.test(value) )
            {
                value = parseInt( value );
                var top = parseInt( style['paddingTop'] ) || 0;
                var bottom = parseInt( style['paddingBottom'] ) || 0;
                value = (value-top-bottom)+'px';
            }
            style['height']=value;
            return true;
        }

        fix.cssHooks.width.set=function( style, value )
        {
            if( /(\d+[^\%]+)\s*$/.test(value) )
            {
                value = parseInt( value );
                var top = parseInt( style['paddingLeft'] ) || 0;
                var bottom = parseInt( style['paddingRight'] ) || 0;
                value = (value-top-bottom)+'px';
            }
            style['width']=value;
            return true;
        }
    }

})(Breeze)

