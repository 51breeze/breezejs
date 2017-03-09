/**
 * StyleEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 * @require Event,PropertyEvent
 */
function StyleEvent( type, bubbles,cancelable ){
    if( !(this instanceof StyleEvent) )return new StyleEvent(type, bubbles,cancelable);
    PropertyEvent.call(this, type, bubbles,cancelable );
    return this;
};
System.StyleEvent =StyleEvent;
    StyleEvent.prototype=new PropertyEvent();
StyleEvent.prototype.constructor=StyleEvent;
StyleEvent.CHANGE='styleChange';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
     if( originalEvent instanceof StyleEvent )return originalEvent;
     if( type === StyleEvent.CHANGE )return new StyleEvent( StyleEvent.CHANGE );
});