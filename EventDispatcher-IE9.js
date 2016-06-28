(function( EventDispatcher, undefined )
{

    /**
     * 监测加载对象上的就绪状态
     * @param event
     * @param type
     */
    var readyState=function( event , type )
    {
        var target=  event.srcElement || event.getEventTarget;
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
            EventDispatcher.dispatchEvent( event );
            EventDispatcher.removeEventListener.call(target, type  );
        }
    }

    //定义 load 事件
    EventDispatcher.SpecialEvent(BreezeEvent.LOAD,
    function(element,listener,type)
    {
        var handle=function(event)
        {
            event= BreezeEvent.create( event );
            if( event )
            {
                event.currentTarget= element;
                event.getEventTarget=element;
                readyState.call(this,event,BreezeEvent.LOAD );
            }
        };

        //HTMLIFrameElement
        if( element.contentWindow )
        {
            this.addEventListener( BreezeEvent.READY, listener ,true, 10000 );
        }
        else
        {
            EventDispatcher.addEventListener.call(element, BreezeEvent.READY ,listener, handle );
            EventDispatcher.addEventListener.call(element, type,listener,handle );
        }
        return true;
    });

    // 定义ready事件
    EventDispatcher.SpecialEvent(BreezeEvent.READY,
    function(element,listener,type)
    {
        var doc = element.contentWindow ?  element.contentWindow.document : element.ownerDocument || element.document || element,
            win= doc && doc.nodeType===9 ? doc.defaultView || doc.parentWindow : window;

        if( !win || !doc )return;
        var handle=function(event)
        {
            event= BreezeEvent.create( event )
            if( event )
            {
                event.currentTarget= doc;
                event.getEventTarget=doc;
                readyState.call(this,event,BreezeEvent.READY);
            }
        }

        EventDispatcher.addEventListener.call(win,'DOMContentLoaded', listener, handle );
        EventDispatcher.addEventListener.call(doc, type , listener, handle );

        //ie9 以下，并且是一个顶级文档或者窗口对象
        if( eltie9 && !element.contentWindow )
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

})( EventDispatcher )