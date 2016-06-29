

/**
 * ElementEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 */

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

    function ElementEvent( type, bubbles,cancelable ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    ElementEvent.prototype=new BreezeEvent();
    ElementEvent.prototype.parent=null;
    ElementEvent.prototype.child=null;
    ElementEvent.prototype.constructor=ElementEvent;
    ElementEvent.CHILD_ADD='elementChildAdd';
    ElementEvent.CHILD_REMOVE='elementChildRemove';
    ElementEvent.BEFORE_CHILD_ADD='elementBeforeChildAdd';
    ElementEvent.BEFORE_CHILD_REMOVE='elementBeforeChildRemove';

    if( typeof window.document !== "undefined" )window.ElementEvent=ElementEvent;
    return ElementEvent;
})