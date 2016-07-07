(function(window){

    function KeyboardEvent( type, bubbles,cancelable  ){ BreezeEvent.call(this,  type, bubbles,cancelable );}
    KeyboardEvent.prototype=new BreezeEvent();
    KeyboardEvent.prototype.constructor=KeyboardEvent;
    KeyboardEvent.KEY_PRESS='keypress';
    KeyboardEvent.KEY_UP='keyup';
    KeyboardEvent.KEY_DOWN='keydown';
    window.KeyboardEvent=KeyboardEvent;
}(window))