

/**
 * ElementEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 */

(function(window){

    function ElementEvent( type, bubbles,cancelable ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    ElementEvent.prototype=new BreezeEvent();
    ElementEvent.prototype.parent=null;
    ElementEvent.prototype.child=null;
    ElementEvent.prototype.constructor=ElementEvent;
    ElementEvent.ADD='elementAdd';
    ElementEvent.REMOVE='elementRemove';
    window.ElementEvent=ElementEvent;
}(window))