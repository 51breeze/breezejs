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
        if( !(this instanceof Selection) )
            return new Selection();

        Manager.call(this);

        /**
         * @private
         */
        var _options={
            'template':{
                input: '<input {attr.input} />',
                lable: '<span {attr.lable}>{current}</span>',
                list: '<?foreach(dataGroup as index item){ ?><li {attr.list}>{item["name"]}</li><?}?>',
                container:'<div {attr.container}>{template.lable}</div>{template.group}',
                group: '<div {attr.group}><ul style="padding: 0px;list-style-type:none;-webkit-margin-before:0px;-webkit-margin-after:0px;">{template.list}</ul></div>',
                searchbox:'<div {attr.searchbox}><span>{template.input}</span>{template.group}</div>'
            },
            'attr':{
                searchbox:{'style':{'width':'100%',height:'300px'}},
                lable:{ 'style':{'width':'100%',lineHeight:'35px','display':'block',cursor:'pointer'}, "data-component":"selection.lable" },
                list:{ 'style':{'width':'100%',height:'25px',padding:"0px",margin:'0px',cursor:'pointer'},"data-index":"{index}","data-component":"group.list"},
                group:{ 'style':{display:'none',zIndex:999,position:'absolute',backgroundColor:'#ffffff',border:'solid #333333 1px',padding:'0px'}, "data-component":"selection.group" },
                container:{ 'style':{'width':'100%',height:'35px',border:'solid #999 1px'}, "data-component":"selection",tabindex:"-1" }
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
        var _lableProfile='lable';

        /**
         * @param profile
         * @returns {*}
         */
        this.lableProfile=function( profile )
        {
            if( typeof profile === "string" )
            {
                _lableProfile = profile
                return this;
            }
            return _lableProfile;
        }

        /**
         * @private
         */
        var _valueProfile='id';

        /**
         * @param profile
         * @returns {*}
         */
        this.valueProfile=function( profile )
        {
            if( typeof profile === "string" )
            {
                _valueProfile = profile
                return this;
            }
            return _valueProfile;
        }

        /**
         * @param viewport
         * @returns {*}
         */
        this.viewport=function( viewport )
        {
            if( typeof viewport === "undefined" )
              return this.dataRender().viewport();
            this.dataRender().viewport( viewport );
            return this;
        }

        /**
         * @private
         */
        var _dataRender=null;

        /**
         * @param source
         * @param options
         * @returns {*}
         */
        this.dataRender=function()
        {
            if( _dataRender === null )
            {
                _dataRender = new DataRender();
                _dataRender.dataProfile('dataGroup');
                var self = this;
                _dataRender.dataSource().addEventListener(DataSourceEvent.FETCH,function(event){

                    var index = self.selectedIndex();
                    if( typeof index === "function" )
                        index=index.call(self);
                    var item = this[index] || this[0];
                    self.dataRender().template().variable('current', item['name'] || item );

                },true,200);

                _dataRender.template().addEventListener(TemplateEvent.REFRESH,function(event){

                    var viewport =  event.viewport;
                    var left = viewport.left()
                    var top  = viewport.top()
                    var selection= Breeze('[data-component="selection"]',viewport);
                    var group = Breeze('[data-component="selection.group"]',viewport);
                    self.splice(0,0,group[0]);

                    Breeze(document).addEventListener(MouseEvent.CLICK,function(event){
                        if(group.display() && (event.pageX < group.left() || event.pageY < group.top() || event.pageX > group.left() + group.width() ||  event.pageY > group.top()+group.height()) )
                            group.display(false);
                    },true)

                    selection.addEventListener(MouseEvent.CLICK,function(event){

                            group.width( viewport.width() )
                            group.left( left )
                            group.top( top + viewport.height() );
                            Breeze('[data-component="group.list"]',group).addEventListener([MouseEvent.MOUSE_OVER,MouseEvent.MOUSE_OUT,MouseEvent.CLICK],function(event){

                                if( event.type === MouseEvent.MOUSE_OVER )
                                {
                                    this.style('backgroundColor', '#ccc');

                                }else if(event.type === MouseEvent.MOUSE_OUT)
                                {
                                    this.style('background', 'none');
                                }else
                                {
                                    var index = this.property('data-index');
                                    self.selectedIndex( index );
                                    group.display(false);
                                }
                            })
                           group.display(true);

                    },true)
                })
            }
            return _dataRender;
        }

        /**
         * @param source
         * @param options
         * @returns {Selection}
         */
        this.dataSource=function(source,options)
        {
            if( typeof source === "undefined" )
                return  this.dataRender().dataSource();
            this.dataRender().dataSource( source , options )
            return this;
        }

        /**
         * @private
         */
        var _index=0;

        /**
         * @param value
         * @returns {*}
         */
        this.selectedIndex=function( index )
        {
            if( typeof index === "number" )
            {
                if( _index !== index )
                {
                    _index = index;
                    var dataSource = this.dataSource();
                    if( dataSource.length > 0 && dataSource[ index ] )
                    {
                        var event = new SelectionEvent(SelectionEvent.CHANGED);
                        event.selectedIndex = index;
                        event.selectedItem = dataSource[ index ];
                        this.dispatchEvent( event );
                    }
                }
                return this;
            }
            return _index;
        }

        /**
         * @returns {Selection}
         */
        this.display=function()
        {
            var options = this.options()
            Template.factory( options );
            this.dataRender().display( options.template.container );
            return this;
        }

    }

    Selection.prototype=new Manager();
    Selection.prototype.constructor=Selection;

    function SelectionEvent( src, props ){ BreezeEvent.call(this, src, props);}
    SelectionEvent.prototype=new BreezeEvent();
    SelectionEvent.prototype.constructor=SelectionEvent;
    SelectionEvent.prototype.selectedIndex=NaN;
    SelectionEvent.prototype.selectedItem=null;
    SelectionEvent.CHANGED='selectionChanged';

    window.SelectionEvent=SelectionEvent;
    window.Selection=Selection;

})( window )
