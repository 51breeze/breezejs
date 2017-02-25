
function HttpEvent( type, bubbles,cancelable ){
    if( !(this instanceof HttpEvent) )return new HttpEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}
HttpEvent.prototype=new Event();
HttpEvent.prototype.data=null;
HttpEvent.prototype.url=null;
HttpEvent.SUCCESS = 'httpSuccess';
HttpEvent.ERROR   = 'httpError';
HttpEvent.CANCELED  = 'httpCanceled';
HttpEvent.TIMEOUT = 'httpTimeout';
HttpEvent.DONE    = 'httpDone';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof HttpEvent )return originalEvent;
});