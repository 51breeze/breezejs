(function(global,factory){

    if( typeof define === "function" )
    {
        define(['./BreezeEvent'] , function(){
            return factory( global );
        });

    }else if( typeof module === "object" && typeof module.exports === "object"  )
    {
        module.exports = factory( global );

    }else
    {
        factory( global );
    }

})(typeof window !== "undefined" ? window : this,function(){

    /**
     * StyleEvent
     * @param type
     * @param bubbles
     * @param cancelable
     * @constructor
     */
    function StyleEvent( type, bubbles,cancelable ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    StyleEvent.prototype=new BreezeEvent();
    StyleEvent.prototype.constructor=StyleEvent;
    StyleEvent.CHANGE='styleChange';
    if( typeof window.document !== "undefined" )window.StyleEvent=StyleEvent;
    return StyleEvent;
})