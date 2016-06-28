(function(factory){

    if( typeof define === "function" )
    {
        define( ['events/BreezeEvent'] , factory );

    }else if (typeof exports === 'object')
    {
        module.exports = factory;

    }else
    {
        factory();
    }

})(function(event){

    /**
     * MouseEvent
     * @param src
     * @param props
     * @constructor
     */
    function MouseEvent( type, bubbles,cancelable  ){ event.call(this,  type, bubbles,cancelable );}
    MouseEvent.prototype=new event();
    MouseEvent.prototype.constructor=MouseEvent;
    MouseEvent.prototype.pageX= NaN
    MouseEvent.prototype.pageY= NaN
    MouseEvent.prototype.offsetX=NaN
    MouseEvent.prototype.offsetY=NaN;
    MouseEvent.prototype.screenX= NaN;
    MouseEvent.prototype.screenY= NaN;
    MouseEvent.MOUSE_DOWN='mousedown';
    MouseEvent.MOUSE_UP='mouseup';
    MouseEvent.MOUSE_OVER='mouseover';
    MouseEvent.MOUSE_OUT='mouseout';
    MouseEvent.MOUSE_OUTSIDE='mouseoutside';
    MouseEvent.MOUSE_MOVE='mousemove';
    MouseEvent.MOUSE_WHEEL='mousewheel';
    MouseEvent.CLICK='click';
    MouseEvent.DBLCLICK='dblclick';
    if( typeof window !== "undefined" )window.MouseEvent=MouseEvent;
    if( navigator.userAgent.match(/firefox\/([\d.]+)/i) )
    {
       BreezeEvent.fix[ MouseEvent.MOUSE_WHEEL ] = 'DOMMouseScroll';
    }
    return MouseEvent;
})