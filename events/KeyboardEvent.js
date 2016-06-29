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

    function KeyboardEvent( type, bubbles,cancelable  ){ BreezeEvent.call(this,  type, bubbles,cancelable );}
    KeyboardEvent.prototype=new BreezeEvent();
    KeyboardEvent.prototype.constructor=KeyboardEvent;
    KeyboardEvent.KEY_PRESS='keypress';
    KeyboardEvent.KEY_UP='keyup';
    KeyboardEvent.KEY_DOWN='keydown';
    if( typeof window.document !== "undefined" )window.KeyboardEvent=KeyboardEvent;
    return KeyboardEvent;
})