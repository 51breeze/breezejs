

/**
 * ElementEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 */

define(['BreezeEvent'],function(BreezeEvent)
{

    function ElementEvent( type, bubbles,cancelable ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    ElementEvent.prototype=new BreezeEvent();
    ElementEvent.prototype.parent=null;
    ElementEvent.prototype.child=null;
    ElementEvent.prototype.constructor=ElementEvent;
    ElementEvent.ADD='elementAdd';
    ElementEvent.REMOVE='elementRemove';
    return ElementEvent;

})