function A() {}

A.prototype.constructor=A;
A.prototype.name=function () {
}

function B() {
}

B.prototype=Object.create(A.prototype,{age:{value:function () {
    console.log('====')
}} } );
B.prototype.constructor=B;
var b=new B();
b.bb='123';



console.log( Object.prototype.hasOwnProperty.call(b,'bb') )


