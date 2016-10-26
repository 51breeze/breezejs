define('events/DataSourceEvent',['./BreezeEvent'],function(BreezeEvent)
{
    function DataSourceEvent(type, bubbles,cancelable){ BreezeEvent.call(this, type, bubbles,cancelable);}
    DataSourceEvent.prototype=new BreezeEvent();
    DataSourceEvent.prototype.constructor=DataSourceEvent;
    DataSourceEvent.prototype.index=NaN;
    DataSourceEvent.prototype.data=null;
    DataSourceEvent.prototype.waiting=false;
    DataSourceEvent.APPEND='dataSourceAppend';
    DataSourceEvent.REMOVE='dataSourceRemove';
    DataSourceEvent.ALTER='dataSourceAlter';
    DataSourceEvent.FETCH = 'dataSourceFetch';
    DataSourceEvent.LOAD_START='dataSourceLoadStart';
    DataSourceEvent.LOAD_COMPLETE='dataSourceLoadComplete';
    DataSourceEvent.WAITING='dataSourceWaiting';
    DataSourceEvent.SYNCH_SUCCESS='dataSourceSynchSuccess';
    DataSourceEvent.SYNCH_FAILED='dataSourceSynchfailed';
    DataSourceEvent.CHANGED='dataSourceChanged';
    return DataSourceEvent;

});




