/**
 * SkinEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 * @require System,Event,Object
 */
function SkinEvent( type, bubbles,cancelable )
{
    if( !System.instanceOf(this,SkinEvent) )return new SkinEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};

System.SkinEvent = SkinEvent;
SkinEvent.prototype=Object.create( Event.prototype );
SkinEvent.prototype.viewport=null;
SkinEvent.prototype.skinContent=null;
SkinEvent.prototype.parent=null;
SkinEvent.prototype.constructor=SkinEvent;
SkinEvent.INITIALIZING='skinInitializing';
SkinEvent.INITIALIZED='skinInitialized';

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof SkinEvent )return originalEvent;
    switch (type){
        case SkinEvent.INITIALIZING :
        case SkinEvent.INITIALIZED :
           return new SkinEvent(type);
    }
});