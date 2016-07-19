define('events/SelectionEvent',['./BreezeEvent'],function(BreezeEvent)
{
    function SelectionEvent( type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    SelectionEvent.prototype=new BreezeEvent();
    SelectionEvent.prototype.constructor=SelectionEvent;
    SelectionEvent.prototype.selectedIndex=NaN;
    SelectionEvent.prototype.selectedItem=null;
    SelectionEvent.CHANGE='selectionChanged';
    return SelectionEvent;

})