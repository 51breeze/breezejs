/**
 * Created by Administrator on 2016/1/20.
 */


(function(window){


    var themes={

        'default':{
            //主要的颜色
            'primary':{
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },
            //辅助的颜色
            'secondary':{
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },
            //阅读的颜色
            'standard':{
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },

            //成功颜色
            'success' :{
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },

            //错误颜色
            'error' :{
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },

            //警告颜色
            'warn' :{
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },

            //提示颜色
            'prompt' :{
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },
            //滑过颜色
            'over' :{
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },
            //滑出颜色
            'out'  : {
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },
            //松开颜色
            'up': {
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },
            //按下颜色
            'down' : {
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },
            //当前活动的颜色
            'active' :{
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            },
            //禁用颜色
            'disable' : {
                backgroud:'',
                text:'',
                border:'',
                gradient:'',
                shadow:''
            }
        }
    };


    var SkinThemes={

        'get':function(name)
        {

        },
        'set':function(name, skinObject )
        {
            themes[name]=skinObject;
        }
    }

    window.SkinThemes=SkinThemes;

})(window)

