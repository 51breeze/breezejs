//var o = new Console();
"use strict";


var date =  new Date();
var rinningTime = date.getTime();
var ccc = [1,2,3];

function A() {

}
A.prototype.test = function() {}
A.prototype.f = function() {}
A.prototype.b = function() {}
A.prototype.h = function() {}

function B() {

}
B.prototype=new A()
B.prototype.fc = function() {}
B.prototype.bcc = function() {}
B.prototype.hty = function() {}



var b=new B();



for(var i=0; i<100000 ; i++ )
{
   b['test']();
}

var _d =  new Date();
console.log( _d.getTime() - rinningTime  );