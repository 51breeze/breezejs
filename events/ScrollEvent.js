(function(global,factory){

    if( typeof define === "function" )
    {
        define(['./PropertyEvent'] , function(){
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
     * PropertyEvent
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function ScrollEvent( type, bubbles,cancelable ){ PropertyEvent.call(this, type, bubbles,cancelable );}
    ScrollEvent.prototype=new PropertyEvent();
    ScrollEvent.prototype.constructor=ScrollEvent;
    ScrollEvent.CHANGE='scrollChange';
    if( typeof window.document !== "undefined" )window.ScrollEvent=ScrollEvent;
    return ScrollEvent;
})