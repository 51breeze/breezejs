/**
 * ElementEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 */
function ElementEvent( type, bubbles,cancelable )
{
    if( !(this instanceof ElementEvent) )return new ElementEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}

ElementEvent.prototype=new Event();
ElementEvent.prototype.parent=null;
ElementEvent.prototype.child=null;
ElementEvent.prototype.constructor=ElementEvent;
ElementEvent.ADD='elementAdd';
ElementEvent.REMOVE='elementRemove';

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof ElementEvent )return originalEvent;
});