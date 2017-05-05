/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/

/**
 * 所有皮肤组件的基类。
 * 只有需要显示皮肤的组件才需要继承此类。此组件是 Component 的子类，具备 Component 的特性。
 * 有关SkinGroup的用法请查看SkinGroup的说明。
 * @param SkinGroup skinGroup
 * @returns {Component}
 * @constructor
 */

package breeze.components
{

import breeze.components.Component;
import breeze.components.Component;
    import SkinEvent;
    import Skin;
    import breeze.components.ComponentEvent;

    public class SkinComponent extends Component
    {
        public function SkinComponent( viewport )
        {
            super();
            if (viewport)this.viewport=viewport;

            //将组件应用在皮肤类中,并且当host component在安装皮肤时会触发此事件
            //因此，构建在皮肤中的组件都会有一个宿主对象,那就是皮肤
            this.addEventListener(SkinEvent.INSTALLING, function (e) {
                this.hostComponent( e.hostComponent );
                e.skinContent = this.skinInstaller(e);
            });
        }

        /**
         * @inherit
         * @param host
         * @returns {Component}
         */
        override protected function hostComponent(host)
        {
            var oldHost = super.hostComponent( host );
            if (host)
            {
                if (oldHost !== host)
                {
                    super.hostComponent(host);
                    if (oldHost)oldHost.removeEventListener(ComponentEvent.INITIALIZED, this.display);
                    //当宿主对象初始化完成后显示此组件
                    host.addEventListener(ComponentEvent.INITIALIZED, this.display, false, 0, this);
                }
                return host;
            }
            return oldHost;
        }

        /**
         * 安装皮肤。
         * 此阶段为编译阶段将皮肤转化成html
         * 此函数无需要手动调用，皮肤在初始化时会自动调用
         */
        protected function skinInstaller(event):String
        {
            if (!event)
            {
                event = new SkinEvent(SkinEvent.INSTALLING);
                event.viewport = this.viewport;
                event.hostComponent = this;
                event.skinContent = this.skin;
                event.skinContent.dispatchEvent(event);
                return event.skinContent.toString();

            } else if ( event.viewport && !this.viewport )
            {
                //获取视图ID
                //这是从皮肤视图中来调用的皮肤安装器，这个阶段还没有添加到文档中，所以只能先获取一个占位视口。
                //需要等待宿主对象初始化完成后，调用display方法后再创建一个可用的视口元素。
                if (!event.viewport.attr.id)event.viewport.attr.id = System.uid();
                this.viewport='#' + event.viewport.attr.id;
            }
            return this.skin.toString();
        }

        /**
         * 组件初始化进行中
         * @returns {Boolean}
         */
        override protected function initializing():Boolean
        {
            if (super.initializing())
            {
                var viewport = this.viewport;
                if (typeof viewport === "string")
                {
                    viewport = new Element( viewport );
                    this.viewport=viewport;
                }
                if (!viewport || viewport.length < 1)throw new TypeError('viewport is null or undefined');
                return true;
            }
            return false;
        }

        /**
         * 组件初始完成
         * @returns {boolean}
         */
        override protected function initialized():Boolean
        {
            if (!super.initialized())
            {
                return false;
            }
            return true;
        }

        /**
         * @private
         */
        private var __skin__ = null;

        /**
         * 设置皮肤对象
         * @returns {Object}
         */
        public function get skin():Skin
        {
            if (this.__skin__ === null)
            {
                this.__skin__ = new Skin();
            }
            return this.__skin__;
        };

        /**
         * 设置皮肤对象
         * @param skinObj
         * @returns {Object}
         */
        public function set skin(skinObj:Skin):void
        {
            this.__skin__ = skinObj;
            
        };

        /**
         * @private
         */
        private var __viewport__ = null;

        /**
         * @returns {Object}
         */
        public function get viewport():Object
        {
            return this.__viewport__;
        };

        /**
         * @param Object obj
         * @returns {void}
         */
        public function set viewport(obj:Object):void
        {
            log( obj );
            this.__viewport__ = obj;
        };

        private var __render__:Render = null;

        /**
         * 皮肤的渲染器
         * @returns {Render}
         */
        public function get render():Render
        {
            if (this.__render__ === null)
            {
                this.__render__ = new Render();
            }
            return this.__render__;
        }

        /**
         * 设置一个变量到渲染器
         * @param name
         * @param value
         * @returns {Object}
         */
        public function variable(name, value)
        {
            return this.render.variable(name, value);
        }

        /**
         * 渲染显示皮肤
         * @returns {SkinComponent}
         */
        public function display():SkinComponent
        {
            this.initializing();
            var skin = this.skinInstaller(null);
            this.viewport.html( skin );
            this.initialized();
            return this;
        };

    }
}
