(function(){



    var A = (function () {

        var uid = 123456;
        var A = function () {
            this[uid] = {
                _name: '123 A',
                age:30,
            }
        };

        A.prototype.constructor = A;
        A.prototype.name = function () {
            console.log(this[uid]._name);
        }

        A.prototype.age=30;
        A.prototype.getAge = function () {
            console.log( this[uid].age );
        }

        A.prototype.setAge = function (age) {
            this[uid].age = age;
        }

        return A;

    })()



    console.log( A.prototype.age.call(this) )




})()


