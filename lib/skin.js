const libxml = require('D:/node/node-global/node_modules/libxmljs');
const utils  = require('./utils.js');
const PATH = require('path');

//private
function __toString(skin, notContainer , parent, separation )
{
    if( typeof skin === "string" )return skin;
    var tag = skin.name;
    var children = skin.children || [];
    var attr = skin.attr || {};
    var content=[];
    separation = separation || "";

    //如果组件在子级中
    if( (skin.isComponent === true || skin.id ) && parent )
    {
        throw new TypeError('Component cannot be converting to string for "'+skin.fullclassname+'"');
    }
    for (var c in children)
    {
        var child = children[c];
        if ( child+"" === "[object Object]" )
        {
            content.push( __toString(child, false, skin, separation) );
        } else
        {
            content.push( child.toString() );
        }
    }
    content = content.join( separation );
    if( notContainer===true )
    {
        return content;
    }

    if( tag==='text' )return content;
    if( skin.namespace )
    {
        var syntax = 'default';
        syntax = template_syntax[ syntax ];
        if( !syntax[skin.name] )throw new SyntaxError('Syntax tag is not supported for "'+skin.name+'"');
        return syntax[skin.name](attr,content);
    }

    var str = '<' + tag;
    for (var p in attr)
    {
        if( p !=='id' )
        {
            var v = attr[p].replace(/([\"\'])/g,'\\$1');
            str += " "+p+'="'+v+'"';
        }
    }

    if( skin.appendAttr )
    {
        str += " "+skin.appendAttr+"";
    }
    str += '>' + content + '</' + tag + '>';
    return str;
}

function __toItem(skin, flag )
{
    if( typeof skin === "string" )return flag===true ? '[]' : '{}';
    var children = skin.children || [];
    var content=[];
    var hash={};
    var forceToArr = false;
    for (var c in children)
    {
        var child = children[c];
        if( child.id )
        {
            content.push( child.id );
            forceToArr = true;
            continue;
        }

        if( typeof child === "string" )
        {
            content.push( child );
            forceToArr = true;
            continue;
        }
        var name  = child.attr.name || child.name;
        var value = child.attr.value;
        var type  = child.attr.type;
        if( child.children.length>0 )
        {
            value = __toString(child, true );
        }
        if( flag ===true )
        {
            if( !type || type.toLowerCase()==='string' )
            {
                content.push( '"'+value+'"' );
            }else
            {
                content.push( value );
            }

        }else
        {
            if( hash[name]===true )
            {
                throw new Error('"' + name + '" has already been declared');
            }
            hash[name]=true;
            if( !type || type.toLowerCase()==='string' )
            {
                content.push('"' + name + '":"' + value + '"');
            }else
            {
                content.push('"'+ name+'":'+value);
            }
        }
    }
    if( forceToArr && !flag )
    {
        if( content.length===1 )
        {
            return content[0];
        }
        flag = true;
    }
    return flag === true ? '['+ content.join(',')+']' : '{'+ content.join(',')+'}';
}

var operation_hash={
    'gt':'>',
    'lt':'<',
    'egt':'>=',
    'elt':'<=',
    'eq':'==',
    'eqt':'===',
    'and':'&&',
    'or':'||',
};

function replace_condition( condition )
{
   return condition.replace(/\s+(gt|lt|egt|elt|eq|and|or)\s+/ig,function (a,b) {
       return operation_hash[ b.toLowerCase() ];
    });
}


//private
var template_syntax={
    'default': {
        'foreach': function (attr, content) {
            return '<? foreach(' + attr.name + ' as ' + (attr.key || 'key') + ' ' + (attr.value || 'item') + '){ ?>' + content + '<?}?>';
        },
        'for': function (attr, content) {
            return '<? for(' + replace_condition(attr.condition) +'){ ?>' + content + '<?}?>';
        },
        'if': function (attr, content) {
            return '<? if(' + replace_condition(attr.condition) + '){ ?>'+content+'<?}?>';
        },
        'elseif': function (attr, content) {
            return '<? elseif(' +  replace_condition(attr.condition) + '){ ?>'+content+'<?}?>';
        },
        'else': function (attr, content) {
            return '<? }else{ ?>'+content+'<?}?>';
        },
        'do': function (attr, content) {
            return '<? do{ ?>'+content+'<?}?>';
        },
        'switch': function (attr, content) {
            return '<? switch(' +  replace_condition(attr.condition) + '){ ?>'+content+'<?}?>';
        },
        'case': function (attr, content) {
            content = '<? case "' +  replace_condition(attr.condition) + '": ?>'+content;
            if( attr["break"]==='true' )content+='<? break; ?>';
            return content;
        },
        'default': function (attr, content) {
            content='<? default: ?>'+content;
            if( attr["break"]==='true' )content+='<? break; ?>';
            return content;
        },
        'break': function (attr, content) {
            return '<? break; ?>'+content;
        },
        'while': function (attr, content) {
            return '<? while(' +  replace_condition(attr.condition) + '){ ?>'+content+'<?}?>';
        },
        'code': function (attr, content) {
            return '<? code{ ?>'+content+' <? } ?>';
        },'script': function (attr, content) {
            return '<? code{ ?>'+content+' <? } ?>';
        }
    }
};


function getSkinObject(name)
{
    return {
        "name":name,
        "attr":{},
        "hash":{},
        "children":[],
    };
}

function makeSkinObject(skin, attach  )
{
    if( typeof skin === "string" )return "'"+skin+"'";
    if( skin.name==='text' || skin.name==='cdata' )
    {
        return skin.children.join(',');
    }
    var content=[];
    content.push('"name":"'+skin.name+'"');
    content.push('"attr":'+JSON.stringify( skin.attr ) );
    var child=[];
    for( var i in skin.children )
    {
        if( skin.children[i].id )
        {
            child.push( skin.children[i].id );
        }else
        {
            child.push( makeSkinObject(skin.children[i])  );
        }
    }
    content.push('"children":['+child.join(',')+']');
    if( attach )
    {
        content = content.concat(attach);
    }
    return '{'+content.join(',')+'}';
}

var __uid__=1;
function uid(){return __uid__++;}


/**
 * 获取元素引用的命名空间
 * @param elem
 * @returns {*}
 */
function getNamespace(elem)
{
    var namespace = elem.namespace();
    if( namespace )
    {
        namespace = utils.trim( namespace.href() );
        if( namespace.charAt(0) === '@')
        {
            namespace = namespace.substr(1);
        }
        return namespace;
    }
    return '';
}

function getImportClassName(name, imports)
{
    if( imports )
    {
        if( imports.hasOwnProperty(name) )return imports[name];
        for(var i in imports )
        {
            if( imports[i] === name )return name;
        }
    }
    return null;
}

/**
 * 获取模块的类型
 */
function getModuleType( context, description, types )
{
    var getDescriptionAndGlobals = context.config.$getDescriptionAndGlobals;
    while ( description && description.id==='class' )
    {
        var classname = description.classname || description.type;
        var fullname = description.package ? description.package+'.'+classname : classname;
        if( types.indexOf( fullname ) >=0 )
        {
            return fullname;
        }
        if( !description.inherit )return null;
        fullname = getImportClassName(description.inherit, description.import );
        if( fullname )
        {
            description = getDescriptionAndGlobals( context.syntax, fullname );
        }else
        {
            return null;
        }
    }
    return null;
}

/**
 * 获取类中成员信息。
 * 如果是继承的类，成员信息不存在时则会逐一向上查找，直到找到或者没有父级类为止。
 * @param it
 * @param refObj 引用类模块
 * @param name 原型链名
 * @param classmodule 当前类模块
 * @returns {*}
 */

$has = Object.prototype.hasOwnProperty;
function getClassPropertyDesc(name, currentModule, context , isset )
{
    if( currentModule.description )
    {
        var currentModule = currentModule.description;
        var parent = currentModule;
        var desc;
        var last = parent;
        var parentClass;
        do{
            var proto = $has.call(parent,'proto') ? parent['proto'] : null;
            if( proto )
            {
                if ( $has.call(proto,name) )
                {
                    desc = proto[name];
                    if ( currentModule !== parent && !checkPrivilege(desc, parent, currentModule) )
                    {
                        return null;
                    }
                    if( !isset || !desc.isAccessor )return desc;
                    if( isset && desc.value && desc.value.set ) return desc;
                }
            }
            var xml = parent['xml'];
            if( xml && xml.hasOwnProperty(name) )
            {
                 return { param:xml[name], isXMLProperty:true };
            }

            last = parent;
            if( parent.inherit )
            {
                parentClass = parent.inherit;
                if( parent.nonglobal === true && parent.import )
                {
                    parentClass = parent.import.hasOwnProperty( parent.inherit ) ? parent.import[ parent.inherit ] : parent.inherit;
                }
                parent = context.loadModuleDescription(context.syntax, parentClass , context.config, context.project, context.filepath );

            }else
            {
                parent = null;
            }
        }while ( parent && parent.id==='class' && last !== parent );
    }
    return null;
}

/**
 * 检查所在模块中的属性，在当前场景对象中的访问权限
 * @param desc 属性描述
 * @param inobject 查找的类对象
 * @param currobject 当前类对象
 */
function checkPrivilege(desc, inobject, currobject )
{
    //非全局模块需要检查
    if ( typeof desc.privilege !== "undefined" )
    {
        //包内访问权限
        var internal = inobject.package === currobject.package && desc.privilege === 'internal';

        //子类访问权限
        var inherit = inobject.fullclassname === currobject.import[ currobject.inherit ] && desc.privilege === 'protected';

        //判断访问权限
        if ( !(internal || inherit || desc.privilege === 'public') )
        {
            return false;
        }
    }
    return true;
}

function getAttributeValue( attrValue, type , context)
{
    if( attrValue.charAt(0)==='@' )
    {
        attrValue = attrValue.substr(1);
        var metaData = utils.executeMetaType( attrValue );
        if( metaData )
        {
            switch ( metaData.type )
            {
                case 'Skin':
                    var source = metaData.param.source;
                    start(source, context.config, context.project, context.syntax, context.loadModuleDescription);
                    if (context.imports.indexOf(source) < 0)context.imports.push(source);
                    attrValue = source;
                    break;
            }
        }

    }else
    {
        switch( type.toLowerCase() )
        {
            case 'class' :
                start(attrValue, context.config, context.project, context.syntax, context.loadModuleDescription);
                if (context.imports.indexOf(attrValue) < 0)context.imports.push(attrValue);
                break;
            case 'array' :
                attrValue='["'+attrValue.split(',').join('","')+'"]';
                break;
            case 'number' :
            case 'boolean' :
                return attrValue;
                break;
            default:
                attrValue='"'+attrValue+'"';
        }
    }
    return attrValue;
}

//绑定属性
function parseBinable(attrValue, attrName, skinObject, context )
{
    if(attrValue && attrValue.slice(0,2) === '{{' && attrValue.slice(-2) === '}}' )
    {
        attrValue = attrValue.slice(2,-2);
        attrValue = attrValue.split('|');
        skinObject.isComponent=true;
        skinObject.isBindable=true;
        var bindname = attrValue[0].replace(/\s/g,'');
        bindname = bindname.split('.');
        if( bindname[0] !== 'this' )bindname.unshift('this');
        var refname = bindname.pop();
        var refobj =  bindname.join('.');
        var binding = context.bindable[ refobj ] || (context.bindable[ refobj ]={name:[],bind:[]});
        if( binding.name.indexOf(refname) < 0 ){
            binding.name.push(refname)
        }

        var param = {id:skinObject,attr:attrName,name:refname,flag:(attrValue[1]||'').toLowerCase()!=="false"};
        if( skinObject.module.description )
        {
            var desc = getClassPropertyDesc(attrName, skinObject.module, context);
            if( desc && desc.id==='function' && !(desc.value && desc.value.set) )
            {
                throw new TypeError('Invalid binding for "'+attrName+'"');
            }
        }
        binding.bind.push( param );
        return "";
    }
    return attrValue;
}

/**
 * 获取一个元素的属性
 * @param elem
 * @param root
 * @param description
 * @param referenceModule
 */
function parseAttributes(attrs, skinObject, module, context )
{
    var isNew = skinObject===module;
    for(var p in attrs)
    {
        var attrName = p;
        var attrValue = attrs[p];

        //绑定属性
        attrValue = parseBinable(attrValue, attrName, skinObject, context );

        //如果不是id并且有描述则检查
        if( attrValue && ( isNew || skinObject.isProperty===true ) && attrName !=='id' && module.description )
        {
            if( skinObject.isProperty===true )
            {
                //调用函数属性， 合并参数
                var type = (skinObject.description.paramType || skinObject.description.param)[0] || '';
                ( skinObject.param || (skinObject.param = []) ).push(getAttributeValue(attrValue, type, context));
                continue;

            }else
            {
                var desc = getClassPropertyDesc(attrName, module, context, true );
                if( desc )
                {
                    var type = (desc.paramType || desc.param)[0] || '';
                    attrValue = getAttributeValue(attrValue, type, context);
                    setPropertyMethod(attrName, attrValue, skinObject, context, desc );
                    continue;

                }else if( !(module.ignorePropertyNotExists === true || module.description.ignorePropertyNotExists ===true) )
                {
                    throw new ReferenceError(attrName + ' is not defined');
                }
            }
        }
        if( attrValue )
        {
            skinObject.attr[attrName] = attrValue;
        }
    }
}

function parse(elem, context, module , parent )
{
    var name = elem.name();
    if( name==null )
    {
        context.script.push( utils.trim( elem.text() ) );
        return null;

    }else if( name.toLowerCase()==='script' )
    {
        context.script.push( elem.text() );
        return null;
    }
    else if( name.toLowerCase()==='style' )
    {
        context.style.push( utils.trim( elem.text() ) );
        return null;
    }
    //文本直接返回
    else if( name.toLowerCase() === 'text' )
    {
        return utils.trim( elem.text() );
    }
    //备注跳过
    else if( name.toLowerCase()==='comment' )
    {
        return null;
    }

    //获取一个皮肤对象
    var skinObject=getSkinObject(name);
    var attrs = elem.attrs();
    var attrdata = {};
    for(var p in attrs)
    {
        var attrName = attrs[p].name();
        var attrValue = utils.trim(attrs[p].value());
        var hash = '@id';

        //@表示公开此组件
        if( attrName.toLowerCase()==='id' )
        {
            if( attrValue.charAt(0)==='@' )
            {
                attrValue = attrValue.substr(1);
                skinObject.id = attrValue;
                skinObject.isComponent=true;
                module = skinObject;
                hash = true;
            }
            if( !/^[a-zA-Z\$\_]\w+$/.test(attrValue) )
            {
                throw new Error('"'+attrValue+'" is not valid id');
            }
            var refObject = hash === true ? context : module;
            if ( refObject.hash.hasOwnProperty(attrValue) )
            {
                throw new Error('"' + attrValue + '" has already been declared');
            }
            refObject.hash[ attrValue ] = hash
        }
        if( hash !== true )
        {
            attrdata[attrName] = attrValue;
        }
    }

    //root
    if(module == null)
    {
        skinObject = module = context;
        skinObject.isSkin=true;
        skinObject.isComponent = true;
    }
    //有命名空间，不是属性就是组件
    else if( elem.namespace() )
    {
        var namespace = getNamespace( elem );
        var fullname = namespace ? namespace+'.'+name : name;
        skinObject.namespace=fullname;
        var desc = getClassPropertyDesc(name, module, context);

        //一个属性
        if (desc)
        {
            if( desc.isXMLProperty !== true )
            {
                skinObject.isProperty = true;
                skinObject.param = [];
                skinObject.description = desc;
            }

        } else
        //尝试使用组件
        {
            skinObject.fullclassname = fullname;
            skinObject.classname = fullname;
            skinObject.isComponent = true;
            skinObject.description = context.loadModuleDescription(context.syntax, fullname, context.config, context.project, context.filepath , undefined , true );
            if( getModuleType(context, skinObject.description , ['Skin'] ) )
            {
                skinObject.isSkin = true;
                if( attrdata.name)
                {
                    skinObject.name = attrdata.name;
                    delete attrdata.name;
                }
                module = skinObject;

            }else
            {
                   var viewport_desc = getClassPropertyDesc('viewport', skinObject, context);
                   if (viewport_desc && viewport_desc.id==='function' )
                   {
                       skinObject.nonChild = parent.isProperty !==true ;
                       if ( !parent.id && module !== context )
                       {
                           parent.id = '__var' + uid() + '__';
                           parent.isPrivate = true;
                           parent.isComponent = true;
                       }
                       if( skinObject !== module )
                       {
                           attrdata['viewport'] = '@' + (module.id || 'this');
                       }else
                       {
                           attrdata['viewport'] = '@' + (parent.id || 'this');
                       }
                   }
                   module = skinObject;
            }
        }
    }
    skinObject.module = module;
    skinObject.context = context;

    //如果是一个组件，就必须设置id
    if( skinObject.isComponent ===true )
    {
        if( skinObject.id && !skinObject.classname )
        {
            skinObject.classname = 'Skin';
            skinObject.isSkin=true;
            if( !skinObject.description )
            {
                skinObject.description  = context.loadModuleDescription(context.syntax, 'Skin', context.config, context.project, context.filepath );
            }
        }

        if( !skinObject.id && skinObject !== context )
        {
            skinObject.id = '__var' + uid() + '__';
            skinObject.isPrivate = true;
        }
    }

    //解析属性
    parseAttributes(attrdata, skinObject, module, context);

    //子级
    var nodes = elem.childNodes();
    if( nodes.length > 0 )
    {
        var child;
        for (var i in nodes)
        {
            child= parse(nodes[i], context, module , skinObject );

            //如果是属性稍后会参数处理
            if( child && child.isProperty !== true  && child.nonChild !==true )
            {
                if( child.id && !skinObject.id )
                {
                   skinObject.isComponent=true;
                }
                skinObject.children.push( child );
            }
        }
    }

    //为组件设置一个私有变量
    if( skinObject.isComponent ===true && skinObject.isProperty !==true )
    {
        if( !skinObject.id && skinObject !== context )
        {
            skinObject.id = '__var'+uid()+'__';
            skinObject.isPrivate=true;
        }

        if( !skinObject.classname )
        {
            skinObject.classname = 'Skin';
            skinObject.isSkin=true;
            if( !skinObject.description )
            {
                skinObject.description  = context.loadModuleDescription(context.syntax, 'Skin', context.config, context.project, context.filepath );
            }
        }

        if( skinObject !== context )
        {
            context.components.push( skinObject );
        }
    }

    var param;
    if( skinObject.isProperty===true )
    {
        var type = (skinObject.description.paramType || skinObject.description.param)[0];
        param = skinObject.param.concat( getValueByType(skinObject, type) );
        setPropertyMethod(name, param, skinObject, context);

    }else if( skinObject.isComponent==true && skinObject !== context )
    {
        if( skinObject.description && skinObject.isSkin !==true )
        {
            //把所有子级内容转换成数据
            if( skinObject.children.length > 0 )
            {
                param = getValueByType(skinObject, skinObject.description.type);
            }

        }else
        {
            //构建一个皮肤对象
            param = makeSkinObject( skinObject );
        }
        skinObject.param = param;

    }else if( skinObject.namespace && module.isSkin )
    {
        switch( skinObject.name )
        {
            case 'attr' :
                parent.appendAttr = __toString(skinObject, true, undefined, " ");
                return null;
            break;
        }
    }

    //皮肤设置属性
    if( skinObject.appendAttr )
    {
        //只有一个皮肤对象才可以追加皮肤属性
        if( skinObject.namespace && !skinObject.module.isSkin )
        {
            parent.appendAttr = skinObject.appendAttr;
            delete skinObject.appendAttr;
        }
    }
    return skinObject;
}

/**
 * 设置初始化组件的属性
 * @param name
 * @param value
 * @param skinObject
 * @param context
 */
function setPropertyMethod( name, value, skinObject, context , desc )
{
    desc = desc || skinObject.description;
    if( desc )
    {
        var isset = !!(desc.value && desc.value.set);
        //自定义类必须要有setter
        if( !isset && skinObject.module.description.nonglobal===true )
        {
            throw new ReferenceError(name+' is not setter');
        }

        var id = skinObject.module.id;
        if( skinObject.module === context )
        {
            id = 'this';
        }
        var ref = id==='this' || value==='this' ? context.initSelfProperty : context.initProperty;
        if (isset)
        {
            ref.push(id + '.' + name + '=' + value);
        } else
        {
            if( value instanceof Array )
            {
                ref.push(id + '.' + name + '(' + value.join(',') + ')');
            }else{
                ref.push(id + '.' + name + '(' + value + ')');
            }
        }
    }
}

/**
 * 根据当前指定的类型获取数据
 * @param skinObject
 * @param type
 * @returns {*}
 */
function getValueByType( skinObject, type )
{
    var value;
    switch ( type.toLowerCase() )
    {
        case 'boolean':
            value = utils.trim( __toString( skinObject, true ) );
            value=( value && value !=='false' ? 'true' : 'false' );
            skinObject.notNewInstance = true;
            break;
        case 'number':
            value=parseFloat( utils.trim( __toString(skinObject, true ) ) ) ;
            skinObject.notNewInstance = true;
            break;
        case 'array' :
            value=__toItem(skinObject, true);
            skinObject.notNewInstance = true;
            break;
        case 'object' :
            value=__toItem(skinObject);
            skinObject.notNewInstance = true;
            break;
        default :
        case 'string':
            value="'"+__toString(skinObject,true)+"'";
            skinObject.notNewInstance = true;
    }
    return value;
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

function start(view , config, project, syntax, loadModuleDescription )
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

   // console.log( view, filename  )
   //PATH.relative( config.project_path, project.config.project_skin_path )

    var filepath = utils.getResolvePath( project_path , view );
    filepath = filepath+config.skin_file_suffix;
    if( !utils.isFileExists(filepath) )throw new Error('not found skin. for "'+filepath+'"');
    var content = utils.getContents( filepath );
    utils.info('Checking file '+filepath);

    var xml = libxml.parseXmlString( content ,{noblanks:false,nocdata:false} );
    config.loadedSkins[ filename ] = true;

    var element = xml.root();
    var name = element.name();
    var context=getSkinObject('div');
    var namespace = getNamespace(element);
    var fullname =  namespace ? namespace+'.'+name : name;
    var index = filename.lastIndexOf('.');
    context.components=[];
    context.imports=[];
    context.style=[];
    context.script=[];
    context.hash={};
    context.initProperty = [];
    context.initSelfProperty = [];
    context.fullclassname = filename;
    context.filepath = filepath;
    context.extends = fullname;
    context.namespace = fullname;
    context.classname = filename.substr(index+1);
    context.package = filename.substr(0,index);
    context.bindable=[];
    context.config = config;
    context.isSkin=true;
    context.loadModuleDescription = loadModuleDescription;
    context.project = project;
    context.syntax = syntax;
    context.ignorePropertyNotExists = true;
    context.description = loadModuleDescription( syntax, context.extends, config, project, filepath);



    //解析
    parse(element, context);
    if( context.attr.name )
    {
        context.name = context.attr.name;
        delete context.attr.name;
    }
    var classModule = createModulObject(fullname,filepath,filepath);
    classModule.script = makeScript( context );

    //console.log( classModule.script );

    moduleContents.push( classModule );
    return classModule;
}

function makeScript( classModule )
{
    var imports = classModule.imports;
    var body=[];
    var inherit = classModule.extends || '';
    var content = ['package ', classModule.package ,'{'];
    var property=[];
    var setProperty=[];
    var attach =  getHash( classModule );
    var components = classModule.components;
    var scriptContent = utils.trim( classModule.script.join("\n") );
    var styleContent = utils.trim( classModule.style.join("\n") );

    //嵌套的组件
    for (var classname in components )
    {
        var component=components[classname];
        var value=component.classname;
        var param = component.param || '';

        //需要加载的组件
        if( component.fullclassname && classModule.fullclassname !==component.fullclassname && imports.indexOf(component.fullclassname)<0 )
        {
            imports.push( component.fullclassname );
        }
        if( component.notNewInstance )
        {
            if( param )
            {
                body.push('var ' + component.id + '=' + param + ';\n');
            }
        }else
        {
            body.push('var ' + component.id + ':' + value + '= new ' + value + '(' + param + ');\n');
        }
        if( component.isPrivate !== true )
        {
            property.push('public var '+component.id+';\n' );
            setProperty.push('this.'+component.id+'='+component.id );
            attach.push('"'+component.id+'":'+component.id);
        }
        attach = attach.concat( getHash(component) );
    }

    if( classModule.initProperty.length > 0 )
    {
        body = body.concat( classModule.initProperty.join(";\n")+';\n' );
    }

    if( inherit )imports.push( inherit );
    if( imports.length > 0 )
    {
        content.push( 'import '+imports.join(';\nimport ') +';\n' );
    }

    scriptContent = scriptContent.replace(/\b(import\s+[\w\.\s]+)([\;\n])/g, function (a,b,c) {
        content.push(b+';\n');
        return '';
    });

    content.push( ' public class ');
    content.push( classModule.classname );
    if( inherit )
    {
        content.push(' extends ');
        content.push( inherit );
        body.push('super('+makeSkinObject( classModule, ['"hash":{'+attach.join(',')+'}'] )+');\n');
    }

    setProperty = setProperty.concat( classModule.initSelfProperty );
    if( setProperty.length > 0 )
    {
        body = body.concat( setProperty.join(";\n")+';\n' );
    }

    //绑定元标签
    if( classModule.bindable )
    {
        var bindableContent = [];
        var index = 0;
        for( var p in classModule.bindable )
        {
             var item =classModule.bindable[ p ];
             var varname = '__bind'+(index++)+'__';
             bindableContent.push('var '+varname+' = new Bindable('+p+','+JSON.stringify(item.name)+');\n' );
             for(var i in item.bind )
             {
                 var flag = !item.bind[i].flag ? '",false' : '"';
                bindableContent.push( varname+'.bind('+item.bind[i].id.id+',"'+item.bind[i].attr+'","'+item.bind[i].name+flag+');\n' );
             }
        }
        if( bindableContent.length > 0 )
        {
            body.push(
                'this.addEventListener( SkinEvent.CREATE_CHILDREN_COMPLETED ,function(event){\n' +
                bindableContent.join("") +
                '});\n'
            );
        }
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
        if( !classModule.attr.hasOwnProperty(prop) )
        {
            throw new SyntaxError('property name is not defined of binding');
        }
        return classModule.attr[prop];
    });
    styleContents.push( styleContent );

    makeSetProperty(body, classModule.attr, 'this', classModule.config );

    content.push( 'function '+classModule.classname+'(skinObject)'+'{'+body.join("")+'}' );
    content.push( scriptContent );
    content.push( '}}' );
    return content.join("");
}

function getHash( skinObj ) {

    var attach = [];
    if( skinObj.hash )
    {
        for(var p in skinObj.hash )
        {
            if( skinObj.hash[p] === '@id')
            {
                attach.push('"'+p+'":"@id"');
            }
        }
    }
    return attach;
}

function makeSetProperty(body, attr, ref, config )
{
    for( var p in attr )
    {
        if( p === 'id' || p==='class')
        {
            continue;
        }
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



function makeSkin(view , config, project, syntax, loadModuleDescription )
{
    if( typeof config.loadedSkins !== "object" )config.loadedSkins={};

    //初始化皮肤对象
    moduleContents=[];
    styleContents=[];

    //开始解析皮肤
    start(view , config , project, syntax, loadModuleDescription );

    return {
        styleContents:styleContents,
        moduleContents:moduleContents,
    };
}

module.exports = makeSkin;


