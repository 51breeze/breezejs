/*
* BreezeJS TouchEvent class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Event,TouchEvent,Math,EventDispatcher;
*/
function TouchSwipeEvent(type, bubbles, cancelable)
{
    if( !(this instanceof TouchSwipeEvent) )return new TouchSwipeEvent(type, bubbles,cancelable);
    TouchEvent.call(this, type, bubbles,cancelable );
    return this;
};
System.TouchSwipeEvent = TouchSwipeEvent;
TouchSwipeEvent.prototype.constructor=TouchSwipeEvent;
TouchSwipeEvent.prototype=new TouchEvent();
TouchSwipeEvent.prototype.startX=NaN;
TouchSwipeEvent.prototype.startY=NaN;
TouchSwipeEvent.prototype.moveX=NaN;
TouchSwipeEvent.prototype.moveY=NaN;
TouchSwipeEvent.prototype.lastMoveX=NaN;
TouchSwipeEvent.prototype.lastMoveY=NaN;
TouchSwipeEvent.prototype.startDate=NaN;
TouchSwipeEvent.prototype.moveDate=NaN;
TouchSwipeEvent.prototype.velocity=NaN;
TouchSwipeEvent.prototype.vDistance=NaN;
TouchSwipeEvent.prototype.hDistance=NaN;
TouchSwipeEvent.prototype.swiped=NaN;
TouchSwipeEvent.TOUCH_SWIPE_START='touchSwipeStart';
TouchSwipeEvent.TOUCH_SWIPE_MOVE='touchSwipeMove';
TouchSwipeEvent.TOUCH_SWIPE_END='touchSwipeEnd';

Event.registerEvent(function ( type ,target, originalEvent ) {
    switch ( type ){
        case TouchSwipeEvent.TOUCH_SWIPE_START :
        case TouchSwipeEvent.TOUCH_SWIPE_MOVE :
        case TouchSwipeEvent.TOUCH_SWIPE_END :
            var event =new TouchSwipeEvent( type );
            event.originalEvent = originalEvent;
            return event;
    }
});

function getDistance(startX,endX,startY,endY)
{
    return endX === startX && endY === startY ? 0 : Math.sqrt( Math.pow( (endX - startX), 2 ) + Math.pow( (endY - startY), 2 ) );
};

var dragDataKey='__touch_swipe_data__';
function invoke(listener, dispatchHandle )
{
    var handle = function( event )
    {
        var settings=TouchEvent.setting['swipe'],
            target = event.currentTarget,
            x=0,
            y= 0,
            swipeEvent,
            data=target[dragDataKey],
            touches=event.targetTouches;

        if( touches && touches.length === 1 )
        {
            if( touches.length > 0 )
            {
                x=touches[0].pageX;
                y=touches[0].pageY
            }

            if( !data )
            {
                data=target[dragDataKey]={};
                data.startX=x;
                data.startY=y;
                data.startDate=event.timeStamp;
            }

            data.lastMoveDate = data.moveDate || data.startDate;
            data.lastMoveX    = data.moveX!==undefined ? data.moveX : data.startX;
            data.lastMoveY    = data.moveY!==undefined ? data.moveY : data.startY;
            data.moveDate     = event.timeStamp;
            data.moveX        = x;
            data.moveY        = y;
            data.hDistance    = data.moveX - data.startX;
            data.vDistance    = data.moveY - data.startY;
            var ms = data.moveDate - data.lastMoveDate;

            if(  !data.swiped  &&  Math.abs(data.hDistance) / ms > settings.velocityThresh ||
                Math.abs(data.vDistance) / ms > settings.velocityThresh )
            {
                data.swiped = true;
            }

            switch( event.type )
            {
                case TouchEvent.TOUCH_START :
                    swipeEvent= new TouchSwipeEvent(TouchSwipeEvent.TOUCH_SWIPE_START);
                break;
                case TouchEvent.TOUCH_MOVE:
                    if( data.swiped )
                    {
                        var distance = getDistance( data.lastMoveX,data.moveX,data.lastMoveY,data.moveY );
                        var velocity = ms === 0 ? 0 : distance / ms;
                        var direction=null;
                        if ( velocity > 1 )
                        {
                            if ( Math.abs(data.hDistance) > Math.abs( data.vDistance) )
                                direction = data.hDistance > 0 ? 'right' : 'left';
                            else
                                direction = data.vDistance > 0 ? 'down' : 'up';
                            data.direction=direction;
                            data.velocity=velocity;
                        }
                        if ( !data.swipeExecuted && direction )
                        {
                            data.swipeExecuted = true;
                            swipeEvent= new TouchSwipeEvent(TouchSwipeEvent.TOUCH_SWIPE_MOVE);
                            target[dragDataKey]={};
                        }
                    }
                break;
            }

        }else if( event.type===TouchEvent.TOUCH_END && data )
        {
            delete target[dataName];
            swipeEvent= new TouchSwipeEvent(TouchSwipeEvent.TOUCH_SWIPE_END);
        }

        if( swipeEvent )
        {
            swipeEvent.originalEvent = event;
            Object.merge(swipeEvent, data);
            dispatchHandle(swipeEvent);
        }
    }
    EventDispatcher( this ).addEventListener(TouchEvent.TOUCH_START,handle, false, -1000)
        .addEventListener(TouchEvent.TOUCH_MOVE,handle, false, -1000)
        .addEventListener(TouchEvent.TOUCH_END,handle, false, -1000);
};
Event.fix.hooks[ TouchSwipeEvent.TOUCH_SWIPE_START ] = Event.fix.hooks[ TouchSwipeEvent.TOUCH_SWIPE_MOVE ] = Event.fix.hooks[ TouchSwipeEvent.TOUCH_SWIPE_END ] = invoke;


