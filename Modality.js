/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{
    function Modality()
    {
        if( !(this instanceof Modality) )
            return new Modality();
        Breeze.apply(this, arguments );


        /**
         * @private
         */
        var _options={
            'template':{
                head: '<div {attr}>{template.lable}{template.close}</div>',
                lable: '<lable {attr}></lable>',
                close: '<span {attr}>关闭</span>',
                body:'<div {attr}></div>',
                footer: '<div {attr}></div>',
                skin:'{template.head}{template.body}{template.footer}',
                container:'<div {attr}>{template.skin}</div>'
            },
            'attr':{
                head:{ 'style':{'width':'100%',height:'25px'} },
                lable:{ 'style':{'width':'auto',lineHeight:'25px','display':'block',cursor:'pointer'} },
                close:{ 'style':{'width':'auto',height:'25px',padding:"0px",margin:'0px',cursor:'pointer'} },
                body:{ 'style':{display:'none',zIndex:999,position:'absolute',backgroundColor:'#ffffff',border:'solid #333333 1px',padding:'0px'} },
                footer:{ 'style':{'width':'100%',height:'35px',border:'solid #999 1px','display':'block',backgroundColor:'#ffff00'} }
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
        this.display=function( flag )
        {





            Breeze.prototype.display.call(this, flag );

           // Template.factory( options );
            //this.dataRender().display( options.template.container );
            return this;
        }

    }

    Modality.prototype=Breeze.prototype
    Modality.prototype.constructor=Modality;
    window.Modality=Modality;

})( window )
