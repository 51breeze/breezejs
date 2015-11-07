/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{

    function Selection()
    {
        if( !(this instanceof DataGrid) )
            return new DataGrid();

        EventDispatcher.call(this);

        /**
         * @private
         */
        var _options={
            'type':type || Editable.TEXT,
            'targets':target,
            'profile':{'index':'',lable:''},
            'template':{
                searchInput: '<input {style} {attr} {className} />',
                searchBox: '<div {style} {attr} {className}><span>{searchInput}</span>{group}</div>',
                lable: '<span {style} {attr} {className}>{current}</span>',
                group: '<ul {style} {attr} {className}>{list}</ul>',
                list: '<?foreach(dataGroup as index item){ ?><li {style} {attr} {className}>{item}</li><?}?>'
            },
            'style':{
                searchbox:{'borderCollapse':'collapse'},
                lable:{'backgroundColor':'#ccc','border':'solid #333 1px'},
                list:{'border':'solid #333 1px'}
            },
            'attr':{
                searchbox:{'cellspacing':'1','cellpadding':'1', 'border':'0'},
                lable:{'height':'40'},
                list:{'height':'25'}
            },
            'className':{},
            'needmake':true,
            skin:'<div {style} {attr} {className}>{lable}{searchbox}{list}</div>'
        };


        /**
         * @param options
         * @returns {*}
         */
        this.options=function( options )
        {
            if( typeof options !== "undefined" )
            {
                _options = Breeze.extend(true, _options, options)
                return this;
            }
            return _options;
        }

        /**
         * @private
         */
        var _dataSource=null;

        /**
         * @param source
         * @param options
         * @returns {*}
         */
        this.dataSource=function(source,options)
        {
            if( _dataSource === null )
            {
                _dataSource = new DataSource();
            }
            if( typeof source !== "undefined" )
            {
                _dataSource.source(source,options);
                return this;
            }
            return _dataSource;
        }

        this.display=function()
        {

        }

        this.skin=function( skin )
        {
            var options =  this.options();
            if( !options.skin )
            {
                switch( options.type )
                {
                    case Editable.TEXTAREA :
                        options.skin='<textarea>{value}</textarea>';
                        break;
                    case Editable.SELECT :
                        options.skin='<select><?foreach(dataGroup as index value){<option value="{index}">{value}</option>}?></select>';
                        break;
                    default :
                        options.skin='<input type="'+options.type+'" />';

                }
            }
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
