/**
 * Created by Administrator on 2016/1/20.
 */


(function(window){


    var themes={


        'default':{

             'backgroud': {
                 'subject': '',  //主题颜色
                 'secondary': '', //辅助颜色
                 'standard': ''   //标准颜色
             },
            'text': {
                 'subject': '',  //主题颜色
                 'secondary': '', //辅助颜色
                 'standard': ''   //标准颜色
             },
            'border': {
                 'subject': '',  //主题颜色
                 'secondary': '', //辅助颜色
                 'standard': ''   //标准颜色
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

    window.SkinThemes=SkinThemes


})(window)

