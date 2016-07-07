(function(window){

    function HttpEvent( type, bubbles,cancelable ){ event.call(this,  type, bubbles,cancelable );}
    HttpEvent.prototype=new event();
    HttpEvent.prototype.data=null;
    HttpEvent.prototype.url=null;
    HttpEvent.SUCCESS = 'httpSuccess';
    HttpEvent.ERROR   = 'httpError';
    HttpEvent.CANCELED  = 'httpCanceled';
    HttpEvent.TIMEOUT = 'httpTimeout';
    HttpEvent.DONE    = 'httpDone';
    window.HttpEvent=HttpEvent;

}(window))