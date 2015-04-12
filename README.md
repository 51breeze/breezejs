# breezejs
BreezeJS 1.0.0 Beta

这个框架使用了JQuery Sizzle 元素选择器，那么对于在元素的选择/操作和整个的使用流程上可以说是同曲异工。

此框架与JQuery的不同点在于：<br/>
1、在不失功能的前题下尽量减小文件大小（目前源文件两千多行代码breeze.js ）;<br/>
2、把可以脱离的功能分离成独立的类，在使用中可以根据项目的需求按需要使用;<br/>
3、在源文件的功能封装上清晰可见，即使不看文档都能随心所欲;<br/>
4、只要使用此框架进行元素添加/删除操作都能触发事件。对一些组件的开发都提供了很好的监控能力;<br/>
5、统一了事件驱动类，如果你愿意扩展一些功能那么它可以让你大展身手;<br/>
6、减少了重复创建对象来访问元素造成的效率问题;<br/>
   比如:<br/>
   
   //为元素设置属性<br/>
   JQuery('div').each(function(){
   
      //这里会创建一个新的JQuery对象
      JQuery(this).attr('name'，'name')
   })
   
   Breeze('div').each(function(){
   
       //这里是直接从当前遍历的元素中进行操作
       this.property('name','name')
   })<br/>
7、提供了数据双向绑定的功能。<br/>
   
当然还有很多的想法，这只是一个起点...<br/>
后续将会扩展为一个基于B/S的应用框架，让使用这个框架的开发者轻松搞定每一项需求。<br/>
<br/>
由于此框架还不是很完善，还需要强有力的测试，用者谨慎。<br/>
当然此框架也不一定符合您的要求，只是提供学习与交流使用，如果您有好的建议就请不吝赐教！<br/>



