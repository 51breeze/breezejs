define('events/TemplateEvent',['./BreezeEvent'],function(BreezeEvent)
{
    function TemplateEvent(type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    TemplateEvent.prototype=new BreezeEvent();
    TemplateEvent.prototype.template=null;
    TemplateEvent.prototype.variable=null;
    TemplateEvent.prototype.viewport=null;
    TemplateEvent.prototype.html='';
    TemplateEvent.prototype.constructor=TemplateEvent;
    TemplateEvent.START='templateStart';
    TemplateEvent.DONE='templateDone';
    TemplateEvent.REFRESH='templateRefresh';
    return TemplateEvent;
});