/**
 * DataSourceEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 * @require Event,Object
 */
function DataSourceEvent(type, bubbles,cancelable)
{
    if( !(this instanceof DataSourceEvent) )return new DataSourceEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}
System.DataSourceEvent=DataSourceEvent;
DataSourceEvent.prototype=new Event();
DataSourceEvent.prototype.constructor=DataSourceEvent;
DataSourceEvent.prototype.index=NaN;
DataSourceEvent.prototype.data=null;
DataSourceEvent.prototype.waiting=false;
DataSourceEvent.APPEND='dataSourceAppend';
DataSourceEvent.REMOVE='dataSourceRemove';
DataSourceEvent.UPDATE='dataSourceUpdate';
DataSourceEvent.SELECT = 'dataSourceSelect';
DataSourceEvent.LOAD_START='dataSourceLoadStart';
DataSourceEvent.LOAD_COMPLETE='dataSourceLoadComplete';
DataSourceEvent.WAITING='dataSourceWaiting';
DataSourceEvent.SYNCH_SUCCESS='dataSourceSynchSuccess';
DataSourceEvent.SYNCH_FAILED='dataSourceSynchfailed';
DataSourceEvent.CHANGED='dataSourceChanged';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof DataSourceEvent )return originalEvent;
    switch ( type ){
        case DataSourceEvent.APPEND :
        case DataSourceEvent.REMOVE :
        case DataSourceEvent.UPDATE :
        case DataSourceEvent.SELECT :
        case DataSourceEvent.LOAD_START :
        case DataSourceEvent.LOAD_COMPLETE :
        case DataSourceEvent.WAITING :
        case DataSourceEvent.SYNCH_SUCCESS :
        case DataSourceEvent.SYNCH_FAILED :
        case DataSourceEvent.CHANGED :
            return new DataSourceEvent( type );
    }
});



