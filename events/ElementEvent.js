

/**
 * ElementEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 */
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

    function ElementEvent( type, bubbles,cancelable ){ event.call(this, type, bubbles,cancelable );}
    ElementEvent.prototype=new event();
    ElementEvent.prototype.parent=null;
    ElementEvent.prototype.child=null;
    ElementEvent.prototype.constructor=ElementEvent;
    ElementEvent.CHILD_ADD='elementChildAdd';
    ElementEvent.CHILD_REMOVE='elementChildRemove';
    ElementEvent.BEFORE_CHILD_ADD='elementBeforeChildAdd';
    ElementEvent.BEFORE_CHILD_REMOVE='elementBeforeChildRemove';

    if( typeof window !== "undefined" )window.ElementEvent=ElementEvent;
    return ElementEvent;
})