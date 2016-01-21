/**
 * Created by Administrator on 2016/1/20.
 */


(function(window){

    var themes={

        'default':{

            //主题颜色
              'subject':{
                   'backgroud':'#353535',
                   'text':'#DFDFDF',
                   'border':'#353535',
                   'shadow':'none',
                   'radius':'3px'
              },
            //辅助颜色
              'secondary':{
                   'backgroudColor':'#DFDFDF',
                   'color':'#8C8C8C',
                   'border':'',
                   'shadow':''
              },
             //标准颜色
             'standard':{
                   'backgroud':'#FFFFFF',
                   'text':'#5E5E5E',
                   'border':'',
                   'shadow':''
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

