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
     * PropertyEvent
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function PropertyEvent( type, bubbles,cancelable ){ event.call(this, type, bubbles,cancelable );}
    PropertyEvent.prototype=new event();
    PropertyEvent.prototype.property=null;
    PropertyEvent.prototype.newValue=null;
    PropertyEvent.prototype.oldValue=null;
    PropertyEvent.prototype.constructor=PropertyEvent;
    PropertyEvent.CHANGE='propertyChange';
    PropertyEvent.COMMIT='propertyCommit';
    if( typeof window !== "undefined" )window.PropertyEvent=PropertyEvent;
    BreezeEvent.fix.map[ PropertyEvent.CHANGE ] = 'input';
    return PropertyEvent;
})