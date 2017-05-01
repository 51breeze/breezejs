const libxml = require('D:/node/node-global/node_modules/libxmljs');
const utils  = require('./utils.js');
const PATH = require('path');

function getSkinObject(name)
{
    return {
        "name":name,
        "attr":{},
        "children":[],
    };
}

function makeSkinObject(skin)
{
    if( typeof skin === "string" )return skin;
    if( skin.name==='text' || skin.name==='cdata' )
    {
        return skin.children.join(',');
    }
    var content=[];
    content.push('"name":"'+skin.name+'"')
    content.push('"attr":'+JSON.stringify( skin.attr ) )
    var child=[];
    for( var i in skin.children )
    {
        child.push( makeSkinObject(skin.children[i]) );
    }
    content.push('"children":['+child.join(',')+']')
    return '{'+content.join(',')+'}';
}

var __uid__=1;
function uid(){return __uid__++;}

function parse( elem, config , root, parent , filepath , filename )
{
    var name = elem.name();
    var element=getSkinObject(name);
    if( !root ){
        root = element;
        root.components=[];
        root.style=[];
        root.container={};
        root.script=[];
    }

    if (name == null)
    {
        //CDATA
        parent.script.push( utils.trim( elem.text() ) );
        return null;
    }

    if( name==='style' )
    {
        root.style.push( utils.trim( elem.text() ) );
        return null;
    }

    var nodes = elem.childNodes();
    var attrs = elem.attrs();
    for(var p in attrs)
    {
        var attrName = attrs[p].name();
        var attrValue =  attrs[p].value();
        if( attrName.toLowerCase()==='id' )
        {
            if( attrValue.charAt(0)==='@' )
            {
                attrValue = attrValue.substr(1);
                element.id = attrValue;
            }
            attrValue=utils.uid();
        }
        element.attr[ attrName ] = attrValue;
    }

    var namespace = elem.namespace();
    if( namespace && element !== root )
    {
        namespace = utils.trim( namespace.href() );
        var classname = namespace ? namespace+'.'+name : name;
        if( classname.charAt(0)==='@' )
        {
            classname = classname.substr(1);
            if( classname.substr(0,10) ==='components' )classname = classname.substr(11);
            if( classname.charAt(0)==='.' )classname = classname.substr(1);
        }

        if( !element.id )element.id = 'var_' + uid();
        var obj = createModulObject(classname, filename+'.'+name+uid(), filepath );
        element.fullclassname = obj.fullclassname;
        element.classname = obj.classname;
        element.extends = obj.extends;
        element.package = obj.package;
        element.filepath = obj.filepath;
        element.script = [];
        element.name='component';
        root.components.push(element);
    }

    if( nodes.length > 0 )
    {
        for (var i in nodes)
        {
            var child= parse( nodes[i], config , root, element, filepath , filename );
            if( child )
            {
                if( child.id )
                {
                    if( child.name !== 'component' )
                    {
                        root.container[ child.id ] = makeSkinObject( child );
                    }
                    element.children.push( child.id );

                }else
                {
                    element.children.push( child );
                }
            }
        }

    }else if( name === 'text' )
    {
        var t = utils.trim( elem.text() );
        if (t){
            return '"'+t+'"';
        }else{
            return null;
        }
    }
    return element;
}

function createModulObject(inherit, fullclassname , filepath )
{
    var skinModule={};
    var index = fullclassname.lastIndexOf('.');
    skinModule.fullclassname = fullclassname;
    skinModule.extends = inherit;
    skinModule.classname = fullclassname.substr(index+1);
    skinModule.package = fullclassname.substr(0,index);
    skinModule.filepath = filepath;
    return skinModule;
}

var skinContents = {};
function start(view , config)
{
    //工程路径
    var project_path = config.project.path;
    if( view.charAt(0)==='@' )
    {
        view = view.substr(1);
        //获取系统路径
        project_path = config.root_path;
    }

    //格式化皮肤文件路径
    view = PATH.relative( project_path , view.replace(/\./g,'/') ).replace(/\\/g,'/');
    var filename = view.replace(/\//g,'.');

    //如果是已经加载过
    if( config.loadedSkins[ filename ] === true )
    {
        return;
    }

    var filepath = utils.getResolvePath( project_path , view );
    filepath = filepath+config.skin_file_suffix;
    if( !utils.isFileExists(filepath) )throw new Error('not found skin. for "'+filepath+'"');
    var content = utils.getContents( filepath );
    utils.info('Checking file '+filepath);
    var xml = libxml.parseXmlString( content ,{noblanks:false,nocdata:false} );
    config.loadedSkins[ filename ] = true;

    var skinObj= parse( xml.root() , config , null, null, filepath, filename );
    if( skinObj.name !=='Skin' )
    {
        throw new Error('Invalid skin object "'+skinObj.name+'"' );
    }

    var skinModule=  createModulObject(skinObj.name, filename, filepath );
    if( skinObj.attr.nodeName )
    {
        skinObj.name = skinObj.attr.nodeName;
        delete skinObj.attr.nodeName;

    }else
    {
        skinObj.name='div';
    }

    var originScript=[];
    for (var p in skinObj.container )
    {
        var value=skinObj.container[p];
        originScript.push('var '+p+'= new Skin('+value+');\n' );
        if( p.substr(0,4) !== 'var_' )
        {
            skinObj.script.unshift('public var '+p+';\n' );
            originScript.push('Reflect.set(this, "'+p+'", '+p+');\n' );
        }
    }

    var body=[];

    //皮肤中使用了组件
    for (var classname in skinObj.components)
    {
        var component=skinObj.components[classname];

        //需要加载的组件
        var value=component.classname;
        body.push('var '+component.id+':'+value+'= new '+value+'();\n' );
        if( component.id.substr(0,4) !== 'var_' )
        {
            skinObj.script.unshift('public var '+component.id+';\n' );
            body.push('this.'+component.id+'='+component.id+';\n' );
        }
        if( component.attr.id )delete component.attr.id;
        for(var p in component.attr )
        {
            var v = component.attr[p];
            if( p==="skin" )
            {
                start(v, config);
                v = "new " + v + "()";
            }
            body.push(component.id+'.'+p+'='+v+';\n' );
        }
    }

    originScript.push( 'Reflect.apply( Internal.define("'+skinModule.extends+'"), this,['+makeSkinObject( skinObj )+'])' );
    skinModule.script=skinObj.script;
    skinModule.style=skinObj.style;
    skinModule.components=skinObj.components;
    skinModule.container=skinObj.container;
    skinModule.constructor={};
    skinModule.constructor.param='';
    skinModule.constructor.body = body.join('');
    skinModule.originScript =originScript.join('');

    //解析皮肤对象
    skinContents[ filename ]=skinModule;
    return skinModule;
}

function makeClass(classname,inherit,body,proto,requirements )
{
    var index = classname.lastIndexOf('.');
    var name = classname.substr(index+1);
    inherit = inherit || 'Object';
    requirements = ['Object',inherit].concat( requirements || [] );
    var refName = requirements.map(function (e)
    {
        return e.replace(/\./g,'_');
    });

    var _class = "(function("+refName.join(",")+"){function "+name+"( skinObject ){"+body+"}\n";
    _class+=name+'.prototype=Internal["Object.create"]('+inherit.replace(/\./g,'_')+'.prototype);\n';
    _class+=name+'.prototype.constructor='+name+';\n';
    _class+=name+'.toString=function toString(){return "[class '+classname+']";};\n';
    if( proto )for (p in proto)
    {
        _class+=name+'.prototype.'+p+'='+proto[p]+';\n';
    }
    _class+='return '+name+';\n}(Internal.define("'+requirements.join('"),Internal.define("')+'")))';
    return 'Internal.define("'+classname+'",'+_class+');\n';
}

function makeSkin(view , config )
{
    if( typeof config.requirements !== "object" )config.requirements={};
    if( typeof config.loadedSkins !== "object" )config.loadedSkins={};
    config.requirements.Skin=true;

    //初始化皮肤对象
    skinContents={};

    //开始解析皮肤
    start(view , config );

    return skinContents;

    var requirements= {};
    var skinModules=[];
    var styleContents=[];
    var scriptContents=[];

    for( var skinName in skinContents )
    {
        var initialize = [];
        var skinObj = skinContents[ skinName ];

        //皮肤中使用了组件
        for (var classname in skinObj.components)
        {
            var component=skinObj.components[classname];
            var scriptStr =utils.trim( component.script.join('\n') );

            if( scriptStr )
            {
                //自定义的组件
                classname = view+'.'+classname;
                scriptContents.push({"classname":classname,"content":scriptStr,'extends':component.extends,'filepath':skinObj.path});

            }else
            {
                //需要加载的组件
                requirements[ component.extends ]=true;
                classname = component.extends;
            }

            var ref='';
            if( component.id.substr(0,4) === 'var_' )
            {
                ref=component.id;
                initialize.push('var '+component.id+' = Reflect.construct( Internal.define("'+classname+'") )');

            }else
            {
                ref='this.'+component.id;
                initialize.push(ref+'=Reflect.construct( Internal.define("'+classname+'") )');
            }

            if( component.attr.id )delete component.attr.id;
            for(var p in component.attr )
            {
                var n=p;
                if( p==='skin' )n='skin';
                initialize.push('Reflect.set('+ref+', "'+n+'", '+component.attr[p]+')' );
            }
        }

        for (var p in skinObj.container )
        {
            var value=skinObj.container[p];
            if( skinObj.container[p]+""==="[object Object]")
            {
                value = 'new Skin('+makeSkinObject( skinObj.container[p] )+')';
            }
            if( p.substr(0,4) === 'var_' )
            {
                initialize.push('var '+p+'='+value );
            }else
            {
                initialize.push('this.' + p + '=' + value );
            }
        }

        console.log( skinObj.script )

        initialize.push(skinObj.extends.replace(/\./g,'_')+".call(this,"+makeSkinObject( skinObj )+")");
        initialize.push("if(skinObject+''==='[object Object]'){this.addChild( new Skin(skinObject) );}\n");
        styleContents.push( skinObj.style.join("\n") );
        skinModules.push( makeClass(skinName, skinObj.extends ,initialize.join(';\n') ) );
    }
    return {
        "skins":skinModules,
        "styles":styleContents,
        "scripts":scriptContents,
        "requirements":requirements,
    };
}

module.exports = makeSkin;


