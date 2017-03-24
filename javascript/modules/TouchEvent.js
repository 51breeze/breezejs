/*
* BreezeJS TouchEvent class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Event,Object;
*/
function TouchEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchEvent) )return new TouchEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
System.TouchEvent=TouchEvent;
TouchEvent.prototype.constructor=TouchEvent ;
TouchEvent.prototype=Object.create( Event.prototype );
TouchEvent.TOUCH_START='touchStart';
TouchEvent.TOUCH_MOVE='touchMove';
TouchEvent.TOUCH_END='touchEnd';
TouchEvent.TOUCH_CANCEL='touchCancel';
TouchEvent.setting = {
    longpress: {
        requiredTouches: 1,
        msThresh: 800,
        triggerStartPhase: false
    },
    rotate: {
        requiredTouches: 1
    }
};


//触摸拖动事件
Event.registerEvent(function ( type ,target, originalEvent ) {
    switch ( type ){
        case TouchEvent.TOUCH_START :
        case TouchEvent.TOUCH_MOVE :
        case TouchEvent.TOUCH_END :
        case TouchEvent.TOUCH_CANCEL :
            var event =new TouchEvent( type );
            event.originalEvent = originalEvent;
            return event;
    }
});