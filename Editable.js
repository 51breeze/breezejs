/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{

    function Editable()
    {
        if( !(this instanceof DataGrid) )
            return new DataGrid();

        EventDispatcher.call(this);

        /**
         * @private
         */
        var _width=120;

        /**
         * @param height
         * @returns {*}
         */
        this.width=function(width)
        {
            if( typeof width !== "undefined")
            {
                _width=width;
                return this;
            }
            return _width;
        }

        /**
         * @private
         */
        var _height=120;

        /**
         * @param height
         * @returns {*}
         */
        this.height=function(height)
        {
            if( typeof height !== "undefined" )
            {
                _height=height;
                return this;
            }
            return _height;
        }

        var _skin;

        /**
         * @param skin
         * @returns {string}
         */
        this.skin=function( skin )
        {
            if( typeof skin === "string" )
            {
                _skin=skin;
                return this;
            }
            return _skin;
        }

        /**
         * @param skin
         * @returns {string}
         */
        this.skinClass=function( className )
        {
            if( typeof className  === "string" )
            {
                _options.className.skin=className;
                return this;
            }
            return _options.className.skin;
        }

        this.dataSource=function(source,options)
        {

        }

    }

    Editable.TEXT='text';
    Editable.TEXTAREA='textarea';
    Editable.PASSWORD='password';
    Editable.CHECKBOX='checkbox';
    Editable.RADIO='radio';
    Editable.SELECT='select';

    Editable.prototype=new EventDispatcher();
    Editable.prototype.constructor=Editable;

    function EditableEvent( src, props ){ BreezeEvent.call(this, src, props);}
    EditableEvent.prototype=new BreezeEvent();
    EditableEvent.prototype.constructor=EditableEvent;
    EditableEvent.PLUS_INITIALIZED='dataGridPlusInitialized';
    EditableEvent.REFRESH='dataGridRefresh';

    window.EditableEvent=EditableEvent;
    window.Editable= Editable;

})( window )
