/**
 * @param type
 * @param bubbles
 * @param cancelable
 * @returns {KeyboardEvent}
 * @constructor
 * @require Event
 */
function KeyboardEvent( type, bubbles,cancelable  )
{
    if( !(this instanceof KeyboardEvent) )return new KeyboardEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
System.KeyboardEvent=KeyboardEvent;
KeyboardEvent.prototype=new Event();
KeyboardEvent.prototype.constructor=KeyboardEvent;
KeyboardEvent.prototype.keycode=null;
KeyboardEvent.KEY_PRESS='keypress';
KeyboardEvent.KEY_UP='keyup';
KeyboardEvent.KEY_DOWN='keydown';

//键盘事件
Event.registerEvent(function ( type , target, originalEvent )
{
    switch ( type ){
        case KeyboardEvent.KEY_PRESS :
        case KeyboardEvent.KEY_UP :
        case KeyboardEvent.KEY_DOWN :
            var event =new KeyboardEvent( type );
            event.originalEvent = originalEvent;
            event.keycode = originalEvent.keyCode || originalEvent.keycode;
            return event;
    }
});