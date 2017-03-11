/**
 * PropertyEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 * @require Event,Object
 */
function PropertyEvent( type, bubbles,cancelable ){
    if( !(this instanceof PropertyEvent) )return new PropertyEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
System.PropertyEvent=PropertyEvent;
PropertyEvent.prototype=Object.create( Event.prototype );
PropertyEvent.prototype.property=null;
PropertyEvent.prototype.newValue=null;
PropertyEvent.prototype.oldValue=null;
PropertyEvent.prototype.constructor=PropertyEvent;
PropertyEvent.CHANGE='propertyChange';
PropertyEvent.COMMIT='propertyCommit';
Event.fix.map[ PropertyEvent.CHANGE ] = 'input';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    switch ( type ){
        case PropertyEvent.CHANGE :
        case PropertyEvent.COMMIT :
            var event =new PropertyEvent( type );
            if( typeof originalEvent.propertyName === "string" )
            {
                event.property = originalEvent.propertyName;
                event.newValue = target[ event.property ];
            }
            return event;
    }
});