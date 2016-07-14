define(['./BreezeEvent'],function(BreezeEvent)
{

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
    return PropertyEvent;

})