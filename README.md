# breezejs
BreezeJS 1.0.0 Beta

# BreezeJS 是一个需要编译后才能正常运行的JS语法<br/>

那为什么要编译？<br/>

1、语法标准化，兼容不同的平台，独立上下文与原生的javascript没有任何冲突。
2、完全面向对象编程并提供接口支持。
3、getter/setter 访问器的实现，类成员可见度控制。
4、事件驱动增强，任何数据的变化都可以实现捕捉。
5、可以自动生成服务端业务逻辑，不需要使用使用其它编辑语言去实现服务端的工作（暂未实现）
...

# BreezeJS 希望能做到一次编程，实现多个端口通用，您说有可能吗？ <br/>
# example
package
{
    //自定义数据接口
    import com.Iproxy;
    public class Main extends EventDispatcher implements Iproxy
    {
            private var name:String = 'Ye Jun' ;
            function Main()
            {
                log('Hello '+this.name+'!');
                log( this is Iproxy ) // true
            }
    }
}

欢迎交流：664371281@qq.com

