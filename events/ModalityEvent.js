define('events/ModalityEvent',['./BreezeEvent'],function(BreezeEvent)
{
    /**
     * 模态框事件
     * @param src
     * @param props
     * @constructor
     */
    function ModalityEvent(type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    ModalityEvent.prototype=new BreezeEvent();
    ModalityEvent.prototype.constructor=ModalityEvent;

    //取消事件触发时调度
    ModalityEvent.CANCELED='modalityCancel';
    //模态框关闭时调度
    ModalityEvent.CLOSE='modalityClose';
    //提交事件触发时调度
    ModalityEvent.SUBMIT='modalitySubmit';
    return ModalityEvent;

});