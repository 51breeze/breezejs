/*
 * BreezeJS TouchEvent class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 * @require Event,Object;
 */
function TemplateEvent(type, bubbles,cancelable  ){
    if( !(this instanceof TouchEvent) )return new TemplateEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}
TemplateEvent.prototype= Object.create(Event.prototype);
TemplateEvent.prototype.template=null;
TemplateEvent.prototype.variable=null;
TemplateEvent.prototype.viewport=null;
TemplateEvent.prototype.html='';
TemplateEvent.prototype.constructor=TemplateEvent;
TemplateEvent.START='templateStart';
TemplateEvent.DONE='templateDone';
TemplateEvent.REFRESH='templateRefresh';
System.TemplateEvent=TemplateEvent;

//触摸拖动事件
Event.registerEvent(function ( type ,target, originalEvent )
{
    if(originalEvent instanceof TemplateEvent)return originalEvent;
    switch ( type ){
        case TemplateEvent.START :
        case TemplateEvent.DONE :
        case TemplateEvent.REFRESH :
            var event =new TemplateEvent( type );
            event.originalEvent = originalEvent;
            return event;
    }
});
