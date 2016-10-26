define('events/PopupEvent',['./BreezeEvent'],function(BreezeEvent)
{
    /**
     * 模态框事件
     * @param src
     * @param props
     * @constructor
     */
    function PopupEvent(type, bubbles,cancelable  ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    PopupEvent.prototype=new BreezeEvent();
    PopupEvent.prototype.constructor=PopupEvent;

    //取消事件触发时调度
    PopupEvent.CANCELED='popupCancel';
    //模态框关闭时调度
    PopupEvent.CLOSE='popupClose';
    //提交事件触发时调度
    PopupEvent.SUBMIT='popupSubmit';
    return PopupEvent;

});