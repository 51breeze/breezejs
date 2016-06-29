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
     * PropertyEvent
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function PropertyEvent( type, bubbles,cancelable ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    PropertyEvent.prototype=new BreezeEvent();
    PropertyEvent.prototype.property=null;
    PropertyEvent.prototype.newValue=null;
    PropertyEvent.prototype.oldValue=null;
    PropertyEvent.prototype.constructor=PropertyEvent;
    PropertyEvent.CHANGE='propertyChange';
    PropertyEvent.COMMIT='propertyCommit';

    BreezeEvent.fix.map[ PropertyEvent.CHANGE ] = 'input';
    if( typeof window.document !== "undefined" )window.PropertyEvent=PropertyEvent;
    return PropertyEvent;
})