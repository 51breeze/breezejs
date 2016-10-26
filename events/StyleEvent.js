define('events/StyleEvent',['./PropertyEvent'],function(PropertyEvent)
{
    /**
     * StyleEvent
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function StyleEvent( type, bubbles,cancelable ){ PropertyEvent.call(this, type, bubbles,cancelable );}
    StyleEvent.prototype=new PropertyEvent();
    StyleEvent.prototype.constructor=StyleEvent;
    StyleEvent.CHANGE='styleChange';
    return StyleEvent;

});