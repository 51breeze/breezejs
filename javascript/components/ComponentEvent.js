/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,Event
*/
function ComponentEvent( type, bubbles,cancelable )
{
    if( !System.instanceOf(this,ComponentEvent) )return new ComponentEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
ComponentEvent.prototype= Object.create(Event.prototype);
ComponentEvent.prototype.constructor=ComponentEvent;
ComponentEvent.INITIALIZE_COMPLETED='ComponentInitializeCompleted';
ComponentEvent.INITIALIZE_START='ComponentInitializeStart';
System.ComponentEvent = ComponentEvent;
