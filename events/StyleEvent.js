(function(factory){

    if( typeof define === "function" )
    {
        define( ['events/PropertyEvent'] , factory );

    }else if (typeof exports === 'object')
    {
        module.exports = factory;

    }else
    {
        factory();
    }

})(function(event){

    /**
     * StyleEvent
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function StyleEvent( type, bubbles,cancelable ){ event.call(this, type, bubbles,cancelable );}
    StyleEvent.prototype=new event();
    StyleEvent.prototype.constructor=StyleEvent;
    StyleEvent.CHANGE='styleChange';
    if( typeof window !== "undefined" )window.StyleEvent=StyleEvent;
    return StyleEvent;
})