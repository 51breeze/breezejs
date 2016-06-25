(function(factory){

    if( typeof define === "function" )
    {
        define( ['events/Event'] , factory );

    }else if (typeof exports === 'object')
    {
        module.exports = factory;

    }else
    {
        factory();
    }

})(function(event){

    function HttpEvent( type, bubbles,cancelable ){ event.call(this,  type, bubbles,cancelable );}
    HttpEvent.prototype=new event();
    HttpEvent.prototype.data=null;
    HttpEvent.prototype.url=null;
    HttpEvent.SUCCESS = 'httpSuccess';
    HttpEvent.ERROR   = 'httpError';
    HttpEvent.CANCELED  = 'httpCanceled';
    HttpEvent.TIMEOUT = 'httpTimeout';
    HttpEvent.DONE    = 'httpDone';
    if( typeof window !== "undefined" )window.HttpEvent=HttpEvent;
    return HttpEvent;
})