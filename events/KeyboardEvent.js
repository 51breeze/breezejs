(function(factory){

    if( typeof define === "function" )
    {
        define( ['events/BreezeEvent'] , factory );

    }else if (typeof exports === 'object')
    {
        module.exports = factory;

    }else
    {
        factory();
    }

})(function(event){

    function KeyboardEvent( type, bubbles,cancelable  ){ event.call(this,  type, bubbles,cancelable );}
    KeyboardEvent.prototype=new event();
    KeyboardEvent.prototype.constructor=KeyboardEvent;
    KeyboardEvent.KEY_PRESS='keypress';
    KeyboardEvent.KEY_UP='keyup';
    KeyboardEvent.KEY_DOWN='keydown';
    if( typeof window !== "undefined" )window.KeyboardEvent=KeyboardEvent;
    return KeyboardEvent;
})