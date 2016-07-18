define('events/ScrollEvent',['./PropertyEvent'],function(PropertyEvent)
{

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
    return ScrollEvent;

})