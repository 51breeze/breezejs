/**
 * HttpEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @returns {HttpEvent}
 * @constructor
 * @require Event,Object
 */
function HttpEvent( type, bubbles,cancelable ){
    if( !(this instanceof HttpEvent) )return new HttpEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};
System.HttpEvent=HttpEvent;
HttpEvent.prototype=Object.create( Event.prototype );
HttpEvent.prototype.data=null;
HttpEvent.prototype.url=null;
HttpEvent.LOADING = 'httpLoading';
HttpEvent.SUCCESS = 'httpSuccess';
HttpEvent.ERROR   = 'httpError';
HttpEvent.CANCELED  = 'httpCanceled';
HttpEvent.TIMEOUT = 'httpTimeout';
HttpEvent.DONE    = 'httpDone';
HttpEvent.prototype.toString=function toString(){
    return '[object HttpEvent]';
}
HttpEvent.prototype.valueOf=function valueOf(){
    return '[object HttpEvent]';
}

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof HttpEvent )return originalEvent;
});