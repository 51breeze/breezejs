/**
 * Created by Administrator on 2016/6/21.
 */
/*

require.config({

    paths : {
        'breezeEvent':'./events/BreezeEvent'
        ,'propertyEvent':'./events/PropertyEvent'
        ,'styleEvent':'./events/StyleEvent'
        ,'elementEvent':'./events/ElementEvent'
        ,'mouseEvent':'./events/MouseEvent'
        ,'scrollEvent':'./events/ScrollEvent'
        ,'touchEvent':'./events/TouchEvent'
        ,'httpEvent':'./events/HttpEvent'
        ,'eventDispatcher':'EventDispatcher'
        ,'dataArray':'DataArray'
        ,'breeze':'Breeze'
        ,'http':'Http'
        ,'bindable':'Bindable'
        ,'dataRender':'DataRender'
        ,'dataSource':'DataSource'
        ,'template':'Template'
        ,'component':'./components/Component'
        ,'skinComponent':'./components/SkinComponent'
        ,'skinGroup':'./components/SkinGroup'
        ,'modality':'./components/Modality'
        ,'selection':'./components/Selection'
    },
    shim: {
        'propertyEvent': ['breezeEvent'],
        'elementEvent': ['breezeEvent'],
        'mouseEvent': ['breezeEvent'],
        'touchEvent': ['breezeEvent'],
        'scrollEvent': ['propertyEvent'],
        'styleEvent': ['propertyEvent'],
        'eventDispatcher': ['breezeEvent'],
        'httpEvent': ['breezeEvent'],
        'skinGroup': ['component','breeze'],
        'skinComponent': ['component','breeze'],
        'modality': ['skinComponent','skinGroup'],
        'http':['httpEvent','eventDispatcher'],
        'dataSource':['http'],
        'bindable':['Dictionary'],
        'dataRender':['template','dataSource'],
        'selection': ['skinComponent','skinGroup','dataRender','bindable'],
        'breeze': ['eventDispatcher','dataArray','mouseEvent','scrollEvent','elementEvent','styleEvent','propertyEvent']
    }
});
*/


/*

require(['Breeze'],function(Breeze){


   Breeze.ready(function(){

          console.log( '====' )


      var f= require(['Fed'])

       console.log( f )



        require(['./components/Selection'],function( Selection ){

              var selection = new Selection( '#selection' )
              selection.dataSource( [{'id':1,'label':'张三'},{'id':2,'label':'李四'},{'id':3,'label':'赵三'}] );
              //selection.selectedIndex(2).searchable(true).multiple(false)
              selection.addEventListener( SelectionEvent.CHANGE ,function( event ){
                  console.log( event )
              })
              selection.display();

          })

    })

});
*/


/*
include('aa.cc');
main(function(){




})
*/



function aaa(){




}

console.log('===main.js===')





