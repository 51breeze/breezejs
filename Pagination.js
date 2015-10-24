/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{


    function Pagination()
    {
        if( !(this instanceof  Pagination) )
        {
            return new Pagination();
        }

        /**
         * @private
         */
        var setting={
            'firstPage':'第一页',
            'prevPage' :'上一页',
            'links'    :6,
            'nextPage' :'下一页',
            'lastPage' :'最后页',
            'currentStyle':{'backgoundColor':'green'},
            'hidden':'...',
            'goto':'跳转到',
            'template':
            {
                'button':'<a data-action="{forKeys}" data-index="{{forKeys}}">{value}</a>\r\n',
                'link':'<? foreach(linkButton as key value){ ?><a data-action="link" data-index="{value}" <?if(currentPage==value){?>current<? } ?> >{value}</a><? } ?>',
                'goto':'<span><input data-action="{forKeys}" style="width: 80px; height: 25px;line-height: 25px"/>{value}</span>',
                'hiddenLeft':'<? if(linkButton[0]>1){ ?><span>{value}</span><?}?>',
                'hiddenRight':'<? if(linkButton[linkButton.length]<totalPage){ ?><span>{value}</span><?}?>'
            },
            'skin':'{firstPage}{prevPage}{hidden}{links}{hidden}{nextPage}{lastPage}{goto}',
            'require':false
        }

        /**
         * @private
         */
        var _changed=true;

        /**
         * 设置获取分页模板
         * @param options
         * @returns {*}
         */
        this.options=function( options )
        {
            if( typeof options !== "undefined" )
            {
                setting=Breeze.extend(true,setting,options);
                _changed=true;
                return this;
            }

            if( _changed )
            {
                _changed=false;
                var props = ['firstPage', 'prevPage', 'nextPage', 'lastPage', 'goto'];
                for (var k in props) {
                    var prop = props[k];
                    var tpl = prop === 'goto' ? 'goto' : 'button';
                    var elem = setting.template[tpl].replace(/\{forKeys\}/g, prop).replace('{value}', setting[prop]);
                    setting.skin = setting.skin.replace('{' + prop + '}', elem);
                }

                var hiddenLeft = setting.template.hiddenLeft.replace('{value}', setting.hidden);
                setting.skin = setting.skin.replace('{hidden}', hiddenLeft);

                var hiddenRight = setting.template.hiddenRight.replace('{value}', setting.hidden);
                setting.skin = setting.skin.replace('{hidden}', hiddenRight);
                setting.skin = setting.skin.replace('{links}', setting.template.link);
            }
            return setting;
        }

        /**
         * @private
         */
        this.viewport=function( viewport )
        {
            if( typeof  viewport === "undefined" )
               return this.template().viewport();
            this.template().viewport( viewport );
            return this;
        }

        /**
         * @private
         */
        var _tpl=null;

        /**
         * @param tpl
         * @returns {*|Template}
         */
        this.template=function( tpl )
        {
            return _tpl || ( _tpl = (tpl && tpl instanceof Template) ? tpl : new Template() )
        }


        /**
         * 获取数据渲染项
         * @returns {DataRender}
         */
        this.display=function(totalPages, current, flag )
        {
            var options =  this.options();
            var links = options.links;
            var offset =  Math.max( current - Math.ceil( links / 2 ), 0);
            offset = offset+links > totalPages ? offset-(offset+links - totalPages) : offset;
            var linkButton =[];
            for( var b=1 ; b <= links; b++ )
            {
                linkButton.push( offset+b );
            }

            var tpl=this.template();
            tpl.variable('totalPage', totalPages );
            tpl.variable('firstPage', 1 );
            tpl.variable('prevPage', Math.max( current-1, 1) );
            tpl.variable('nextPage', Math.min( current+1, totalPages) );
            tpl.variable('lastPage', totalPages );
            tpl.variable('currentPage', current );
            tpl.variable('linkButton', linkButton );

            console.log( options.skin )

            if( flag===true )
                return this;
            return tpl.render( options.skin );
        }
    }

    window.Pagination= Pagination;

})( window )
