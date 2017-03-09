(function (System, console){
    var __container__=null;
    function panel() {
        if( System.Element && !__container__ )
        {
            var container = System.Element('<div />');
            container.style('border','solid 1px #ccc');
            container.width('100%');
            container.height(200);
            container.style('position','absolute');
            container.style('left','0px');
            container.style('bottom','0px');
            container.style('overflow','auto');
            // container.bottom(0);
            // container.left(0);
            __container__ = container;
            System.EventDispatcher( document ).addEventListener( System.Event.READY , function (e) {
                System.Element( document.body ).addChild( container );
            })
        }
        return __container__;
    }
    System.console= console || {
        log:function log() {
            var container = panel();
            if( container ) {
                container.addChild( '<p style="line-height: 12px; font-size:12px;color:#333333; font-family: Arial; padding: 5px 0px;margin: 0px;">' + System.Array.prototype.slice.call(arguments,0).join(' ') +'</p>' );
            }
        },
        info:function info() {
            System.console.log.apply(this, arguments);
        },
        trace:function trace() {
            System.console.log.apply(this, arguments);
        },
        warn:function warn() {
            System.console.log.apply(this, arguments);
        },
        error:function error() {
            System.console.log.apply(this, arguments);
        },
        dir:function dir() {},
        assert:function assert() {},
        time:function time() {},
        timeEnd:function timeEnd() {}
    }

}(System, typeof Console !== "undefined" ? Console : null));
