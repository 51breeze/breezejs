

function Class() {}
Class.prototype.uuu=function () {
    console.log('=========')
}


var fClass = new Class();
function f() {}
fClass.constructor = f;
f.prototype = fClass;



var o = new f()



console.log( o , o instanceof Class , fClass instanceof Class , o.constructor === fClass.constructor, Object.getPrototypeOf(o) === Object.getPrototypeOf(fClass) )
console.log(  Object.getPrototypeOf(o) === fClass , Object.getPrototypeOf(fClass) ===  Class.prototype )

o.uuu();

console.log( fClass.constructor.prototype === fClass , o.constructor.prototype === o )
console.log( o === fClass.constructor.prototype  )



