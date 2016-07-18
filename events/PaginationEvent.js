define('events/PaginationEvent',['./BreezeEvent'],function(BreezeEvent)
{
    function PaginationEvent(type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    PaginationEvent.prototype=new BreezeEvent();
    PaginationEvent.prototype.constructor=PaginationEvent;
    PaginationEvent.prototype.currentPage=NaN;
    PaginationEvent.CHANGED='paginationChanged';
    return PaginationEvent;

})