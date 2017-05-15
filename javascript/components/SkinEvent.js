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
SkinEvent.prototype.constructor=SkinEvent;
SkinEvent.prototype.viewport=null;
SkinEvent.prototype.hostComponent=null;
SkinEvent.prototype.skinContent=null;
SkinEvent.prototype.parent=null;

SkinEvent.INSTALLING='skinInstalling';
SkinEvent.ADD='skinAdded';
SkinEvent.REMOVE='skinRemoved';

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof SkinEvent )return originalEvent;
    switch (type){
        case SkinEvent.INSTALLING :
           return new SkinEvent(type);
        case SkinEvent.INSTALLED :
           return new SkinEvent(type);
    }
});