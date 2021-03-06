/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
* @require Object,Event
*/

package breeze.components
{
    public class PaginationEvent extends Event
    {
        static var CHANGE = 'paginationChange';
        public var newValue=null;
        public var oldValue=null;
        public function PaginationEvent(type, bubbles, cancelable)
        {
            super(type, bubbles, cancelable);
        };
    }
}

