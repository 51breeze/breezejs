/*
 * BreezeJS TouchEvent class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

define('events/TouchEvent',['./BreezeEvent'],function(BreezeEvent){

    function TouchEvent(type, bubbles,cancelable  ){ BreezeEvent.call(this,type, bubbles,cancelable );};
    TouchEvent.prototype.constructor=TouchEvent ;
    TouchEvent.prototype=new BreezeEvent();
    TouchEvent.TOUCH_START='touchStart';
    TouchEvent.TOUCH_MOVE='touchMove';
    TouchEvent.TOUCH_END='touchEnd';
    TouchEvent.TOUCH_CANCEL='touchCancel';

    function TouchPinchEvent(type, bubbles, cancelable ){ TouchEvent.call(this,type, bubbles,cancelable );};
    TouchPinchEvent.prototype.constructor=TouchPinchEvent ;
    TouchPinchEvent.prototype=new TouchEvent();
    TouchPinchEvent.prototype.moveX=NaN;
    TouchPinchEvent.prototype.moveY=NaN;
    TouchPinchEvent.prototype.startX=NaN;
    TouchPinchEvent.prototype.startY=NaN;
    TouchPinchEvent.prototype.scale=NaN;
    TouchPinchEvent.prototype.previousScale=NaN;
    TouchPinchEvent.prototype.moveDistance=NaN;
    TouchPinchEvent.prototype.startDistance=NaN;
    TouchPinchEvent.TOUCH_PINCH_START='touchPinchStart';
    TouchPinchEvent.TOUCH_PINCH_MOVE='touchPinchMove';
    TouchPinchEvent.TOUCH_PINCH_END='touchPinchEnd';

    function TouchDragEvent(type, bubbles, cancelable ){ TouchEvent.call(this,type, bubbles,cancelable );};
    TouchDragEvent.prototype.constructor=TouchDragEvent;
    TouchDragEvent.prototype=new TouchEvent();
    TouchDragEvent.prototype.startX=NaN;
    TouchDragEvent.prototype.startY=NaN;
    TouchDragEvent.prototype.moveX=NaN;
    TouchDragEvent.prototype.moveY=NaN;
    TouchDragEvent.prototype.lastMoveX=NaN;
    TouchDragEvent.prototype.lastMoveY=NaN;
    TouchDragEvent.prototype.startDate=NaN;
    TouchDragEvent.prototype.moveDate=NaN;
    TouchDragEvent.prototype.velocity=NaN;
    TouchDragEvent.prototype.held=false;
    TouchDragEvent.TOUCH_DRAG_START='touchDragStart';
    TouchDragEvent.TOUCH_DRAG_MOVE='touchDragMove';
    TouchDragEvent.TOUCH_DRAG_END='touchDragEnd';

    function TouchSwipeEvent(type, bubbles, cancelable ){ TouchEvent.call(this,type, bubbles,cancelable );};
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
    TouchSwipeEvent.SWIPE_START='touchSwipeStart';
    TouchSwipeEvent.SWIPE_MOVE='touchSwipeMove';
    TouchSwipeEvent.SWIPE_END='touchSwipeEnd';



    var getDistance=function(startX,endX,startY,endY)
    {
        return endX === startX && endY === startY ? 0 : Math.sqrt( Math.pow( (endX - startX), 2 ) + Math.pow( (endY - startY), 2 ) );
    }

    TouchEvent.setting =
    {
        longpress: {
            requiredTouches: 1,
            msThresh: 800,
            triggerStartPhase: false
        },
        rotate: {
            requiredTouches: 1
        }
    };

    //=============================== DragEvent ===============================

    var type={};
    type[TouchDragEvent.TOUCH_DRAG_START] = [TouchEvent.TOUCH_START];
    type[TouchDragEvent.TOUCH_DRAG_MOVE]  = [TouchEvent.TOUCH_MOVE,TouchEvent.TOUCH_START];
    type[TouchDragEvent.TOUCH_DRAG_END]   = [TouchEvent.TOUCH_END];
    EventDispatcher.SpecialEvent( [TouchDragEvent.TOUCH_DRAG_START,TouchDragEvent.TOUCH_DRAG_MOVE, TouchDragEvent.TOUCH_DRAG_END ] ,function(listener, dispatch, add, remove)
    {
         var t = type[ listener.type ];
         for( var i =0; i< t.length; i++)
         {

            // add(t[])
         }



        var dataName='__touch_drag_data__';
        var settings=TouchEvent.setting['drag'],
            x=0,
            y= 0,
            data=this[dataName],
            touches=event.targetTouches,
            type=event.type.toLowerCase() ;

        if( touches.length > 0 )
        {
            x=touches[0].pageX
            y=touches[0].pageY
        }
        if( touches.length === 1 )
        {
            switch( listener.type )
            {
               case TouchEvent.TOUCH_START.toLowerCase() :
               {
                   data=this[dataName]={};
                   data.startX=x;
                   data.startY=y;
                   data.lastMoveX=x;
                   data.lastMoveY=y;
                   data.startDate=event.timeStamp;
                   data.held=false;
                   event= new TouchDragEvent( event ,data);
                   event.type = TouchDragEvent.TOUCH_DRAG_START;
                   this.dispatchEvent( event );
               }break;
               case TouchEvent.TOUCH_MOVE.toLowerCase() :
               {
                   data.lastMoveX= data.moveX!==undefined ? data.moveX : data.startX;
                   data.lastMoveY= data.moveY!==undefined ? data.moveY : data.startY;
                   data.lastMoveDate=data.moveDate !==undefined ? data.moveDate : data.startDate;
                   data.moveDate=event.timeStamp;
                   data.moveX=x;
                   data.moveY=y;
                   data.held=( data.held || (data.moveDate - data.lastMoveDate) > 100 );
                   var distance = getDistance( data.lastMoveX,data.moveX,data.lastMoveY,data.moveY ),
                       ms = data.moveDate - data.lastMoveDate;
                   data.velocity = ms === 0 ? 0 : distance / ms;
                   if( data.held )
                   {
                       event = new TouchDragEvent( event,data);
                       event.type = TouchDragEvent.TOUCH_DRAG_MOVE;
                       this.dispatchEvent( event );
                   }
               }break;
            }

        }else if( type===TouchEvent.TOUCH_END.toLowerCase() && data )
        {
            event= new TouchDragEvent( event ,data);
            event.type = TouchDragEvent.TOUCH_DRAG_END;
            delete this[dataName];
            this.dispatchEvent( event );
        }
    })

    //=============================== PinchEvent ===============================

    type={};
    type[TouchPinchEvent.TOUCH_PINCH_START] = TouchEvent.TOUCH_START;
    type[TouchPinchEvent.TOUCH_PINCH_MOVE]  = [TouchEvent.TOUCH_MOVE,TouchEvent.TOUCH_START];
    type[TouchPinchEvent.TOUCH_PINCH_END]   = TouchEvent.TOUCH_END;
    EventDispatcher.expandHandle(type,function(event)
    {
        var dataName='__touch_pinch_data__';
            data=this[dataName],
            touches=event.targetTouches,
            type=event.type.toLowerCase() ;

        if( touches &&  touches.length === 2 )
        {
            var points = {
                x1: touches[0].pageX,
                y1: touches[0].pageY,
                x2: touches[1].pageX,
                y2: touches[1].pageY
            }
            points.centerX = (points.x1 + points.x2) / 2;
            points.centerY = (points.y1 + points.y2) / 2;

            switch( type )
            {
                case TouchEvent.TOUCH_START.toLowerCase() :
                {
                   data=this[dataName]={
                        'startX' : points.centerX,
                        'startY' : points.centerY,
                        'startDistance': getDistance( points.x1,points.x2,points.y1,points.y2 )
                    }
                    event=new TouchPinchEvent( event , data );
                    event.type=TouchPinchEvent.TOUCH_PINCH_START;
                    this.dispatchEvent( event );
                }break;
                case TouchEvent.TOUCH_MOVE.toLowerCase() :
                {
                    data.previousScale = data.scale || 1;
                    var moveDistance =  getDistance( points.x1,points.x2,points.y1,points.y2 ),
                        startDistance = data.startDistance;
                    data.scale = moveDistance / startDistance;
                    data.moveDistance=moveDistance;
                    data.moveX=points.centerX;
                    data.moveY=points.centerY;
                    if( data.scale * startDistance > 0 )
                    {
                        event=new TouchPinchEvent( event ,data );
                        event.type=TouchPinchEvent.TOUCH_PINCH_MOVE;
                        this.dispatchEvent( event );
                    }

                }break;
            }

        }else if( type===TouchEvent.TOUCH_END.toLowerCase() && data )
        {
            event = new TouchPinchEvent( event , data );
            event.type =  TouchPinchEvent.TOUCH_PINCH_END;
            delete this[dataName];
            this.dispatchEvent( event );
        }
    })

    //=============================== SwipeEvent ===============================
    type={};
    type[TouchSwipeEvent.TOUCH_SWIPE_START] = TouchEvent.TOUCH_START;
    type[TouchSwipeEvent.TOUCH_SWIPE_MOVE]  = [TouchEvent.TOUCH_MOVE,TouchEvent.TOUCH_START];
    type[TouchSwipeEvent.TOUCH_SWIPE_END]   = TouchEvent.TOUCH_END;
    EventDispatcher.expandHandle(type,function(event)
    {
        var dataName='__touch_swipe_data__';
        var settings=TouchEvent.setting['swipe'],
            x=0,
            y= 0,
            data=this[dataName],
            touches=event.targetTouches,
            type=event.type.toLowerCase() ;

        if( touches &&  touches.length === 1 )
        {
            if( touches.length > 0 )
            {
                x=touches[0].pageX
                y=touches[0].pageY
            }

            if( data === undefined )
            {
                data=this[dataName]={};
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

            switch( type )
            {
                case TouchEvent.TOUCH_START.toLowerCase() :
                {
                    event= new TouchSwipeEvent(event,data);
                    event.type=TouchSwipeEvent.TOUCH_SWIPE_START;
                    this.dispatchEvent( event );

                }break;
                case TouchEvent.TOUCH_MOVE.toLowerCase() :
                {
                    if( data.swiped )
                    {
                        var distance = getDistance( data.lastMoveX,data.moveX,data.lastMoveY,data.moveY ),
                            velocity = ms === 0 ? 0 : distance / ms,
                            direction=null;

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
                            event= new TouchSwipeEvent(event,data);
                            event.type=TouchSwipeEvent.TOUCH_SWIPE_MOVE;
                            this.dispatchEvent( event ,data);
                            this[dataName]={};
                        }
                    }

                }break;
            }

        }else if( type===TouchEvent.TOUCH_END.toLowerCase() && data )
        {
            delete this[dataName];
            event= new TouchSwipeEvent(event,data);
            event.type=TouchSwipeEvent.TOUCH_SWIPE_END;
            this.dispatchEvent( event ,data);
        }
    })

    define('events/TouchDragEvent',['./TouchEvent'], function(){ return TouchDragEvent } );
    define('events/TouchPinchEvent',['./TouchEvent'], function(){ return TouchPinchEvent } );
    define('events/TouchSwipeEvent',['./TouchEvent'], function(){ return TouchSwipeEvent } );
    return TouchEvent;

});