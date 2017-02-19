//var o = new Console();
"use strict";

var x = {p: 1};

Object.defineProperty(x,'foo',{
   "get":function() {
      console.log( this )
      return "foo bar";
   },
   "@qu":'public'
})


function A() {

}

/*
Object.defineProperty(A.prototype,'constructor',{
   enumerable:false,
   value:A
})
*/

(function (_Reflect) {





})(Reflect);








