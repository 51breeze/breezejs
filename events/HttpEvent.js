(function(global,factory){

    if( typeof define === "function" )
    {
        define(['./BreezeEvent'] , function(){
            return factory( global );
        });

    }else if( typeof module === "object" && typeof module.exports === "object"  )
    {
        module.exports = factory( global );

    }else
    {
        factory( global );
    }

})(typeof window !== "undefined" ? window : this,function(event){

    function HttpEvent( type, bubbles,cancelable ){ event.call(this,  type, bubbles,cancelable );}
    HttpEvent.prototype=new event();
    HttpEvent.prototype.data=null;
    HttpEvent.prototype.url=null;
    HttpEvent.SUCCESS = 'httpSuccess';
    HttpEvent.ERROR   = 'httpError';
    HttpEvent.CANCELED  = 'httpCanceled';
    HttpEvent.TIMEOUT = 'httpTimeout';
    HttpEvent.DONE    = 'httpDone';
    if( typeof window.document !== "undefined" )window.HttpEvent=HttpEvent;
    return HttpEvent;
})