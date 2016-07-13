define(['BreezeEvent'],function(BreezeEvent)
{
    function HttpEvent( type, bubbles,cancelable ){ BreezeEvent.call(this,  type, bubbles,cancelable );}
    HttpEvent.prototype=new BreezeEvent();
    HttpEvent.prototype.data=null;
    HttpEvent.prototype.url=null;
    HttpEvent.SUCCESS = 'httpSuccess';
    HttpEvent.ERROR   = 'httpError';
    HttpEvent.CANCELED  = 'httpCanceled';
    HttpEvent.TIMEOUT = 'httpTimeout';
    HttpEvent.DONE    = 'httpDone';
    return HttpEvent;

})