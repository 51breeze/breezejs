package breeze.components
{

import breeze.components.Component;
import breeze.components.ComponentEvent;
    public class Component extends EventDispatcher
    {
        public function Component()
        {
              super();
        }

        /**
         * @private
         */
        private var __initialized__=false;

        /**
         * 组件初始完成
         * @returns {boolean}
         */
        protected function initialized()
        {
            var ret = this.__initialized__;
            if( ret===false )
            {
                this.__initialized__=true;
                this.dispatchEvent( new ComponentEvent( ComponentEvent.INITIALIZED ) );
            }
            return ret;
        }

        /**
         * 组件初始化进行中
         * @returns {Boolean}
         */
        protected function initializing()
        {
            return !this.__initialized__;
        };


        /**
         * @private
         */
        private var __hostComponent__:Object=null;

        /**
         * 宿主组件对象
         * @param host
         * @returns {Component}
         */
        protected function hostComponent( host:Object ):Object
        {
            if( host is Component )
            {
                this.__hostComponent__ = host;
            }
            return this.__hostComponent__;
        }
    }
}