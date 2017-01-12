
package com{

    class B {

        private static var N=' static var N 123';
        public var six='man';

        static public const uuu='man';
        static public var classname='man 9999';

        public function B()
        {
            console.log(' this is B');
        }
        private var __names__='123';

        public function get names():String{

             console.log(' =====get names======== ', this.__names__ );
             return this.__names__;
        }

        public function set names(val:String){

             this.__names__ = val;
        }

        public function test()
        {
             return '333';
        }

        protected function cre()
        {
            return '333';
        }

    }
}