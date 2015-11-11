/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{


    function SkinFactory( options )
    {
        var getElement = function( name )
        {
            if( typeof options.elements[ name ] !== "string" )
                return null;

            var element = options.elements[ name ];
            var attr = options.attr && options.attr[name] ? options.attr[name] : '';
            if( attr !='' && Breeze.isObject( attr , true ) )
            {
                attr = Breeze.serialize( attr , 'attr' );
            }
            return element.replace(/\{include\.(\w+)\}/g,function(a,b){return getElement(b)}).replace('{attr}', attr )
        }
        for(var name in options.elements )
        {
            options.elements[ name ] = getElement( name );
        }
        return options;
    }

    function Selection()
    {
        if( !(this instanceof Selection) )
            return new Selection();

        EventDispatcher.call(this);

        /**
         * @private
         */
        var _options={
            'elements':{
                searchInput: '<input {attr} />',
                searchBox: '<div {attr}><span>{searchInput}</span>{include.group}</div>',
                lable: '<span {attr}>{current}</span>',
                list: '<?foreach(dataGroup as index item){ ?><li {attr}>{item}</li><?}?>',
                group: '<ul {attr}>{include.list}</ul>',
                container:'<div {attr}>{include.lable}{include.searchBox}{include.list}</div>'
            },
            'attr':{
                searchbox:{
                    'cellspacing':'1',
                    'cellpadding':'1',
                    'border':'0',
                    'style':{'borderCollapse':'collapse'}
                },
                lable:{'height':'40'},
                list:{'height':'25'}
            }
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
            SkinFactory( this.options() )
            console.log( this.options() )
        }

    }

    window.Selection=Selection;

})( window )
