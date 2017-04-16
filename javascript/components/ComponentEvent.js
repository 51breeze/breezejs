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
ComponentEvent.INITIALIZING='componentInitializing';
ComponentEvent.INITIALIZED='componentInitialized';
System.ComponentEvent = ComponentEvent;

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof ComponentEvent )return originalEvent;
    switch (type){
        case ComponentEvent.INITIALIZING :
        case ComponentEvent.INITIALIZED :
            return new ComponentEvent(type);
    }
});

