/*
 * BreezeJS : JavaScript framework
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function( factory ){

    if( typeof define === "function" )
    {
        define( ['Breeze','EventDispatcher','BreezeEvent'] , factory);
    }else
    {
        factory();
    }

})(function(undefined){

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
            style.filter = Breez.trim( filter.replace(cssAalpha,'') + " " + opacity );
            return true;
        }
    };


    if( Breeze.isBrowser( Breeze.BROWSER_IE, 9 ,'<') )
    {
        (fix.cssHooks.width || (fix.cssHooks.width={}) ).get= function (style,name)
        {
            var val = parseInt(fix.getsizeval.call(this, 'Width') || style['width']) || 0;
            val -= (parseFloat(style["borderTopWidth"]) || 0);
            val -= (parseFloat(style["borderBottomWidth"]) || 0);
            return val;
        }

        (fix.cssHooks.height || (fix.cssHooks.height={}) ).get=function (style,name)
        {
            var val = parseInt( fix.getsizeval.call(this, 'Height') || style['height'] ) || 0;
            val -= (parseFloat(style["borderTopWidth"]) || 0);
            val -= (parseFloat(style["borderBottomWidth"]) || 0);
            return val;
        }
    }

    if( Breez.isBrowser(Breez.BROWSER_IE,8,'<') )
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

        //获取元素样式
        fix.fnHooks.style.get=function( name )
        {
            var getter = fix.cssHooks[name] && typeof fix.cssHooks[name].get === "function" ? fix.cssHooks[name].get : null;
            var currentStyle = document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(this, null) : this.currentStyle || this.style;
            name = Breeze.styleName(name);
            var ret = getter ? getter.call(this, currentStyle, name) : currentStyle[name];
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
    }


    /**
     * 监测加载对象上的就绪状态
     * @param event
     * @param type
     */
    var readyState=function( event , type , dispatch, add, remove )
    {
        var target=  event.srcElement || event.target;
        var readyState=target.readyState;
        var eventType= event.type || null;
        if( eltie9 )
        {
            //iframe
            if( target.nodeName.toLowerCase()==='iframe' )
            {
                readyState=target.contentWindow.document.readyState;

            }//window
            else if( target.window && target.document )
            {
                readyState=target.document.readyState;
            }
        }
        //ie9以下用 readyState来判断，其它浏览器都使用 load or DOMContentLoaded
        if( ( eventType && /load/i.test(eventType) )  || ( readyState && /loaded|complete|4/.test( readyState ) ) )
        {
            event.type = type;
            dispatch( event );
            remove.call(target, type);
        }
    }

    //定义 load 事件
    EventDispatcher.SpecialEvent(BreezeEvent.LOAD,
        function(listener, dispatch, add, remove)
        {
            var handle=function(event)
            {
                event= BreezeEvent.create( event );
                if( event )
                {
                    event.currentTarget= element;
                    event.target=element;
                    readyState.call(this,event,BreezeEvent.LOAD, dispatch, add, remove );
                }
            };

            //HTMLIFrameElement
            if( element.contentWindow )
            {
                this.addEventListener( BreezeEvent.READY, handle ,true, 10000 );
            }
            else
            {
                add.call(element, BreezeEvent.READY ,listener, handle );
                add.call(element, listener.type,listener,handle );
            }
            return true;
        });

    // 定义ready事件
    EventDispatcher.SpecialEvent(BreezeEvent.READY,
        function(listener, dispatch, add, remove)
        {
            var doc = element.contentWindow ?  element.contentWindow.document : element.ownerDocument || element.document || element,
                win= doc && doc.nodeType===9 ? doc.defaultView || doc.parentWindow : window;

            var type = listener.type;
            if( !win || !doc )return;
            var handle=function(event)
            {
                event= BreezeEvent.create( event )
                if( event )
                {
                    event.currentTarget= doc;
                    event.getProxyTarget=doc;
                    readyState.call(this,event,BreezeEvent.READY, dispatch, add, remove );
                }
            }

            add.call(win,'DOMContentLoaded', listener, handle );
            add.call(doc, type , listener, handle );

            //ie9 以下，并且是一个顶级文档或者窗口对象
            if( !element.contentWindow )
            {
                var toplevel = false;
                try {
                    toplevel = window.frameElement == null;
                } catch(e) {}

                if ( toplevel && document.documentElement.doScroll )
                {
                    var doCheck=function()
                    {
                        try {
                            document.documentElement.doScroll("left");
                        } catch(e) {
                            setTimeout( doCheck, 1 );
                            return;
                        }
                        handle( {'srcElement':doc,'type':type} );
                    }
                    doCheck();
                }
                handle({'srcElement':doc,'type':type});
            }
            return true;
        });

})

