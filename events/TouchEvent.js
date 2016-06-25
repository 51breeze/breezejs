/*
 * BreezeJS TouchEvent class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */

(function( window, undefined ){

    var TouchEvent=function(type, bubbles,cancelable  ){ BreezeEvent.call(this,type, bubbles,cancelable );};
        TouchEvent.prototype.constructor=TouchEvent ;
        TouchEvent.prototype=new BreezeEvent();
        TouchEvent.TOUCH_START='touchStart';
        TouchEvent.TOUCH_MOVE='touchMove';
        TouchEvent.TOUCH_END='touchEnd';
        TouchEvent.TOUCH_CANCEL='touchCancel';

    var PinchEvent=function(type, bubbles,cancelable ){ BreezeEvent.call(this,type, bubbles,cancelable );};
        PinchEvent.prototype.constructor=PinchEvent ;
        PinchEvent.prototype=new BreezeEvent();
        PinchEvent.prototype.moveX=NaN;
        PinchEvent.prototype.moveY=NaN;
        PinchEvent.prototype.startX=NaN;
        PinchEvent.prototype.startY=NaN;
        PinchEvent.prototype.scale=NaN;
        PinchEvent.prototype.previousScale=NaN;
        PinchEvent.prototype.moveDistance=NaN;
        PinchEvent.prototype.startDistance=NaN;

        PinchEvent.TOUCH_PINCH_START='pinchStart';
        PinchEvent.TOUCH_PINCH_MOVE='pinchMove';
        PinchEvent.TOUCH_PINCH_END='pinchEnd';

    var DragEvent=function(type, bubbles,cancelable ){ BreezeEvent.call(this,type, bubbles,cancelable );};
        DragEvent.prototype.constructor=DragEvent;
        DragEvent.prototype=new BreezeEvent();
        DragEvent.prototype.startX=NaN;
        DragEvent.prototype.startY=NaN;
        DragEvent.prototype.moveX=NaN;
        DragEvent.prototype.moveY=NaN;
        DragEvent.prototype.lastMoveX=NaN;
        DragEvent.prototype.lastMoveY=NaN;
        DragEvent.prototype.startDate=NaN;
        DragEvent.prototype.moveDate=NaN;
        DragEvent.prototype.velocity=NaN;
        DragEvent.prototype.held=false;

        DragEvent.TOUCH_DRAG_START='dragStart';
        DragEvent.TOUCH_DRAG_MOVE='dragMove';
        DragEvent.TOUCH_DRAG_END='dragEnd';

    var SwipeEvent=function(type, bubbles,cancelable ){ BreezeEvent.call(this,type, bubbles,cancelable );};
    SwipeEvent.prototype.constructor=SwipeEvent;
    SwipeEvent.prototype=new BreezeEvent();
    SwipeEvent.prototype.startX=NaN;
    SwipeEvent.prototype.startY=NaN;
    SwipeEvent.prototype.moveX=NaN;
    SwipeEvent.prototype.moveY=NaN;
    SwipeEvent.prototype.lastMoveX=NaN;
    SwipeEvent.prototype.lastMoveY=NaN;
    SwipeEvent.prototype.startDate=NaN;
    SwipeEvent.prototype.moveDate=NaN;
    SwipeEvent.prototype.velocity=NaN;
    SwipeEvent.prototype.vDistance=NaN;
    SwipeEvent.prototype.hDistance=NaN;
    SwipeEvent.prototype.swiped=NaN;

    SwipeEvent.TOUCH_SWIPE_START='swipeStart';
    SwipeEvent.TOUCH_SWIPE_MOVE='swipeMove';
    SwipeEvent.TOUCH_SWIPE_END='swipeEnd';

    window.TouchDragEvent=DragEvent;
    window.TouchPinchEvent=PinchEvent;
    window.TouchSwipeEvent=SwipeEvent;
    window.TouchEvent=TouchEvent;

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
    type[DragEvent.TOUCH_DRAG_START] = TouchEvent.TOUCH_START;
    type[DragEvent.TOUCH_DRAG_MOVE]  = [TouchEvent.TOUCH_MOVE,TouchEvent.TOUCH_START];
    type[DragEvent.TOUCH_DRAG_END]   = TouchEvent.TOUCH_END;
    EventDispatcher.SpecialEvent(type,function(element,listener,type)
    {
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
            switch( type )
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
                   event= new DragEvent( event ,data);
                   event.type = DragEvent.TOUCH_DRAG_START;
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
                       event = new DragEvent( event,data);
                       event.type = DragEvent.TOUCH_DRAG_MOVE;
                       this.dispatchEvent( event );
                   }
               }break;
            }

        }else if( type===TouchEvent.TOUCH_END.toLowerCase() && data )
        {
            event= new DragEvent( event ,data);
            event.type = DragEvent.TOUCH_DRAG_END;
            delete this[dataName];
            this.dispatchEvent( event );
        }
    })

    //=============================== PinchEvent ===============================

    type={};
    type[PinchEvent.TOUCH_PINCH_START] = TouchEvent.TOUCH_START;
    type[PinchEvent.TOUCH_PINCH_MOVE]  = [TouchEvent.TOUCH_MOVE,TouchEvent.TOUCH_START];
    type[PinchEvent.TOUCH_PINCH_END]   = TouchEvent.TOUCH_END;
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
                    event=new PinchEvent( event , data );
                    event.type=PinchEvent.TOUCH_PINCH_START;
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
                        event=new PinchEvent( event ,data );
                        event.type=PinchEvent.TOUCH_PINCH_MOVE;
                        this.dispatchEvent( event );
                    }

                }break;
            }

        }else if( type===TouchEvent.TOUCH_END.toLowerCase() && data )
        {
            event = new PinchEvent( event , data );
            event.type =  PinchEvent.TOUCH_PINCH_END;
            delete this[dataName];
            this.dispatchEvent( event );
        }
    })

    //=============================== SwipeEvent ===============================
    type={};
    type[SwipeEvent.TOUCH_SWIPE_START] = TouchEvent.TOUCH_START;
    type[SwipeEvent.TOUCH_SWIPE_MOVE]  = [TouchEvent.TOUCH_MOVE,TouchEvent.TOUCH_START];
    type[SwipeEvent.TOUCH_SWIPE_END]   = TouchEvent.TOUCH_END;
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
                    event= new SwipeEvent(event,data);
                    event.type=SwipeEvent.TOUCH_SWIPE_START;
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
                            event= new SwipeEvent(event,data);
                            event.type=SwipeEvent.TOUCH_SWIPE_MOVE;
                            this.dispatchEvent( event ,data);
                            this[dataName]={};
                        }
                    }

                }break;
            }

        }else if( type===TouchEvent.TOUCH_END.toLowerCase() && data )
        {
            delete this[dataName];
            event= new SwipeEvent(event,data);
            event.type=SwipeEvent.TOUCH_SWIPE_END;
            this.dispatchEvent( event ,data);
        }
    })

})( window );