(function(global,factory){

    if( typeof define === "function" )
    {
        define(['./BreezeEvent'] , function(){
            return factory( global );
        });

    }else if( typeof module === "object" && typeof module.exports === "object"  )
    {
        module.exports = factory( global );

    }else
    {
        factory( global );
    }

})(typeof window !== "undefined" ? window : this,function(){

    /**
     * MouseEvent
     * @param src
     * @param props
     * @constructor
     */
    function MouseEvent( type, bubbles,cancelable  ){ BreezeEvent.call(this,  type, bubbles,cancelable );}
    MouseEvent.prototype=new BreezeEvent();
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

    if( navigator.userAgent.match(/firefox\/([\d.]+)/i) )
    {
       BreezeEvent.fix[ MouseEvent.MOUSE_WHEEL ] = 'DOMMouseScroll';
    }

    if( typeof window.document !== "undefined" )window.MouseEvent=MouseEvent;
    return MouseEvent;
})