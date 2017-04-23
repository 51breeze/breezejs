/**
 * DataSourceEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 * @require Event,Object
 */

package breeze.components
{
    public class DataSourceEvent extends Event
    {
        static var CHANGE = 'paginationChange';
        static var APPEND='dataSourceAppend';
        static var REMOVE='dataSourceRemove';
        static var UPDATE='dataSourceUpdate';
        static var SELECT = 'dataSourceSelect';
        static var CHANGED='dataSourceChanged';

        public var condition=null;
        public var index=NaN;
        public var data=null;
        public var oldValue=null;
        public var newValue=null;
        public var current = NaN;
        public var offset = NaN;
        public var waiting=false;

        public function DataSourceEvent(type, bubbles, cancelable)
        {
            super(type, bubbles, cancelable);
        };
    }
}



