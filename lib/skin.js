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

function makeSkinObject(skin, attach )
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
    if( attach )
    {
        content = content.concat(attach);
    }
    return '{'+content.join(',')+'}';
}

var __uid__=1;
function uid(){return __uid__++;}

function parse( elem, config , root, parent , filepath , filename )
{
    var name = elem.name();
    var element=getSkinObject(name);
    if( !root )
    {
        root = element;
        root.components=[];
        root.style=[];
        root.container={};
        root.script=[];
        root.fullclassname = filename;
        root.extends = name;
    }

    if (name == null)
    {
        //CDATA
        var script = utils.trim( elem.text() );
        if( script )parent.script.push( script );
        return null;
    }

    if( name==='style' )
    {
        var style = utils.trim( elem.text() );
        if( style )
        {
            root.style.push( style );
        }
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
            continue;
        }
        element.attr[ attrName ] = attrValue;
    }

    var namespace = elem.namespace();
    if( namespace )
    {
        namespace = utils.trim( namespace.href() );
        var classname = namespace ? namespace+'.'+name : name;
        if( element === root  )
        {
            element.fullclassname = filename;
            element.extends = classname;

        }else
        {
            if ( !element.id )
            {
                element.id = '__var'+uid()+'__';
                element.isPrivate=true;
            }

            element.fullclassname = classname;
            element.classname = name;
            element.extends = '';

            //private
            if( !parent.id )
            {
                parent.id = '__var'+uid()+'__';
                parent.isPrivate=true;
            }

            element.attr.viewport= '@'+parent.id+' as Element';
            element.package = namespace;
            element.filepath = filepath;
            element.script = [];
            element.style = [];
            element.isComponent = true;
            root.components.push( element );
        }
    }

    if( nodes.length > 0 )
    {
        for (var i in nodes)
        {
            var child= parse( nodes[i], config , element.isComponent ? element : root, element, filepath , filename );
            if( child )
            {
                if( child.id )
                {
                    if( child.isComponent !== true )
                    {
                        //实例化一个皮肤组件
                        var module = createModulObject('' ,'Skin', '' );
                        module.param = makeSkinObject( child );
                        module.name = child.name;
                        module.id = child.id;
                        module.attr = child.attr;
                        module.isPrivate = child.isPrivate;
                        element.children.push( child.id );
                        root.components.push( module );
                    }

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

    //如果有自定义代码就构建一个新的组件
    if( element.isComponent === true && element.script.length > 0 )
    {
        var obj = createModulObject(element.fullclassname, filename + '.' + name + uid(), filepath);
        element.fullclassname = obj.fullclassname;
        element.classname = obj.classname;
        element.extends = obj.extends;
        element.package = obj.package;
        element.filepath = filepath;
        element.script = makeModuleClass(config, element, {} , element.components || [], element.script.join("") , '');
        moduleContents.push( element );
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

var moduleContents = [];
var styleContents = [];

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
       // throw new Error('Invalid skin object "'+skinObj.name+'"' );
    }

    skinObj.name = 'div';
    if( skinObj.attr.name )
    {
        skinObj.name= skinObj.attr.name;
        delete skinObj.attr.name;
    }
    var skinModule = createModulObject( skinObj.extends, skinObj.fullclassname, filepath );
    skinModule.script = makeModuleClass(config, skinModule ,skinObj.attr, skinObj.components || [],utils.trim( skinObj.script.join("") ) , skinObj.style.join("\n"), skinObj, 'skinObject');

    //解析皮肤对象
    moduleContents.push( skinModule );
    return skinModule;
}

function makeModuleClass(config, classModule, attr, components, scriptContent ,styleContent, skinObject ,paramName )
{
    var imports = [];
    var body=[];
    var inherit = classModule.extends || '';
    var content = ['package ', classModule.package ,'{'];
    var property=[];
    var setProperty=[];
    var attach = [];

    //嵌套的组件
    for (var classname in components )
    {
        var component=components[classname];
        var value=component.classname;
        var param = component.param || '';

        //需要加载的组件
        if( classModule.fullclassname !==component.fullclassname && imports.indexOf(component.fullclassname)<0 )imports.push( component.fullclassname );

        body.push('var '+component.id+':'+value+'= new '+value+'('+param+');\n' );
        if( component.isPrivate !== true )
        {
            property.push('public var '+component.id+';\n' );
            setProperty.push('this.'+component.id+'='+component.id+';\n' );
            attach.push('"'+component.id+'":'+component.id);
        }

        if( component.isComponent===true )
        {
            makeSetProperty(setProperty, component.attr, component.id, config);
        }
    }
    body = body.concat( setProperty );
    if( inherit )imports.push( inherit );
    if( imports.length > 0 )
    {
        content.push( 'import '+imports.join(';\nimport ') +';\n' );
    }

    scriptContent = scriptContent.replace(/\b(import\s+[\w\.\s]+)([\;\n])/g, function (a,b,c) {
        content.push(b+';\n');
        return '';
    });

    content.push( 'class ')
    content.push( classModule.classname );
    if( inherit )
    {
        content.push(' extends ');
        content.push( inherit );
        body.push('super('+makeSkinObject( skinObject, ['"id":{'+attach.join(',')+'}'] )+');\n');
    }
    content.push('{');
    content.push( property.join("") );

    //绑定的属性{{property}}
    styleContent = styleContent.replace(/\{\{([\s\w]+)\}\}/g,function (a,prop){
        prop = utils.trim( prop );
        if( !prop )
        {
            throw new SyntaxError('binding must have a property name');
        }
        if( !attr.hasOwnProperty(prop) )
        {
            throw new SyntaxError('property name is not defined of binding');
        }
        return attr[prop];
    });
    styleContents.push( styleContent );
    makeSetProperty(body, attr, 'this', config );
    content.push( 'function '+classModule.classname+'('+(paramName || '')+')'+'{'+body.join("")+'}' );
    content.push( scriptContent );
    content.push( '}}' );
    return content.join("");
}

function makeSetProperty(body, attr, ref, config )
{
    for( var p in attr )
    {
        if( p === 'id' || p==='class')continue;
        var v = utils.trim(attr[p]);
        var isref = false ;
        if( v.charAt(0) ==='@' )
        {
            isref=true;
            v = v.substr(1);
        }

        if( p==="skin" )
        {
            start(v, config);
            v = "new " + v + "()";

        } else if( !isref && !/^\d+$/.test(v) && /^[\w\#]/.test(v)  )
        {
            v = '"'+v+'"';
        }
        body.push( ref+'.'+p+'='+v+';\n');
    }
}



function makeSkin(view , config )
{
    if( typeof config.loadedSkins !== "object" )config.loadedSkins={};

    //初始化皮肤对象
    moduleContents=[];
    styleContents=[];

    //开始解析皮肤
    start(view , config );

    return {
        styleContents:styleContents,
        moduleContents:moduleContents,
    };
}

module.exports = makeSkin;


