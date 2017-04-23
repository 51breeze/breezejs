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
    public class ComponentEvent extends Event
    {
        static var INITIALIZING = 'componentInitializing';
        static var INITIALIZED = 'componentInitialized';
        public function ComponentEvent(type, bubbles, cancelable)
        {
            super(type, bubbles, cancelable);
        };
    }
}

