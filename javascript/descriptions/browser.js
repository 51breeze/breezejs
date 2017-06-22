/**
 * 浏览器全局对象
 * @type {string[]}
 */
var descriptor = {
    'window': {
        'type': '*',
        'id': 'object',
        'inherit':'EventDispatcher',
        'static': {
            'setInterval': {type: 'Number', id: 'function', param: ['Function', 'Number']},
            'clearInterval': {type: 'Boolean', id: 'function', param: ['Number']},
            'setTimeout': {type: 'Number', id: 'function', param: ['Function', 'Number']},
            'clearTimeout': {type: 'Boolean', id: 'function', param: ['Number']},
            'alert': {type: 'void', id: 'function', param: ['*']},
            'confirm': {type: 'void', id: 'function', param: ['*']},
            'blur': {type: 'void', id: 'function', param: []},
            'close': {type: 'void', id: 'function', param: []},
            'confirm': {type: 'Boolean', id: 'function', param: ['String']},
            'createPopup': {type: 'void', id: 'function', param: ['*']},
            'focus': {type: 'void', id: 'function', param: []},
            'moveBy': {type: 'void', id: 'function', param: ['Number', 'Number']},
            'moveTo': {type: 'void', id: 'function', param: ['Number', 'Number']},
            'open': {type: 'void', id: 'function', param: ['[String]', '[String]', '[String]', '[String]']},
            'print': {type: 'void', id: 'function', param: []},
            'prompt': {type: 'void', id: 'function', param: ['[String]', '[String]']},
            'resizeBy': {type: 'void', id: 'function', param: ['Number', 'Number']},
            'resizeTo': {type: 'void', id: 'function', param: ['Number', 'Number']},
            'scrollBy': {type: 'void', id: 'function', param: ['Number', 'Number']},
            'scrollTo': {type: 'void', id: 'function', param: ['Number', 'Number']},
            'frames': {type: 'Array', 'id': 'const'},
            'closed': {type: 'Boolean', 'id': 'const'},
            'defaultStatus': {type: 'String', 'id': 'const'},
            'document': {type: 'Document', 'id': 'const'},
            'history': {type: 'history', 'id': 'const'},
            'innerheight': {type: 'Number', 'id': 'const'},
            'innerwidth': {type: 'Number', 'id': 'const'},
            'innerwidth': {type: 'Number', 'id': 'const'},
            'length': {type: 'Number', 'id': 'const'},
            'location': {type: 'location', 'id': 'const'},
            'name': {type: 'String', 'id': 'var'},
            'navigator': {type: 'navigator', 'id': 'const'},
            'opener': {type: 'window', 'id': 'const'},
            'outerheight': {type: 'Number', 'id': 'const'},
            'outerwidth': {type: 'Number', 'id': 'const'},
            'pageXOffset': {type: 'Number', 'id': 'const'},
            'pageYOffset': {type: 'Number', 'id': 'const'},
            'parent': {type: 'window', 'id': 'const'},
            'screen': {type: 'screen', 'id': 'const'},
            'self': {type: 'window', 'id': 'const'},
            'status': {type: 'String', 'id': 'const'},
            'top': {type: 'window', 'id': 'const'},
            'screenX': {type: 'Number', 'id': 'const'},
            'screenY': {type: 'Number', 'id': 'const'},
            'document': {type: 'Document', 'id': 'const'},
        },
        'proto':{
            'dispatchEvent':{'id':'function','type':'Boolean','param':['Event']},
            'removeEventListener':{'id':'function','type':'Boolean','param':['String']},
            'addEventListener':{'id':'function','type':'EventDispatcher','param':['String','Function']},
            'hasEventListener':{'id':'function','type':'Boolean','param':['String']},
        }
    },
    'document': {
        'type': '*',
        'id': 'object',
        'static': {
            'all': {type: 'Array', 'id': 'const'},
            'anchors': {type: 'Array', 'id': 'const'},
            'applets': {type: 'Array', 'id': 'const'},
            'forms': {type: 'Array', 'id': 'const'},
            'images': {type: 'Array', 'id': 'const'},
            'links': {type: 'Array', 'id': 'const'},
            'body': {type: 'Element', 'id': 'const'},
            'cookie': {type: 'String', 'id': 'var'},
            'domain': {type: 'String', 'id': 'const'},
            'lastModified': {type: 'String', 'id': 'const'},
            'referrer': {type: 'String', 'id': 'const'},
            'title': {type: 'String', 'id': 'const'},
            'URL': {type: 'String', 'id': 'const'},
            'close': {type: 'void', 'id': 'function', param: []},
            'getElementById': {type: 'Element', 'id': 'function', param: ['String']},
            'getElementsByName': {type: 'Element', 'id': 'function', param: ['String']},
            'getElementsByTagName': {type: 'Element', 'id': 'function', param: ['String']},
            'open': {type: 'void', 'id': 'function', param: []},
            'write': {type: 'void', 'id': 'function', param: ['...']},
            'writeln': {type: 'void', 'id': 'function', param: ['...']},
        }
    },
    'navigator ': {
        'type': 'Object',
        'id': 'object',
        'static': {
            'plugins': {type: 'Array', 'id': 'const'},
            'appCodeName': {type: 'Boolean', 'id': 'const'},
            'appMinorVersion': {type: 'String', 'id': 'const'},
            'appName': {type: 'Document', 'id': 'const'},
            'appVersion': {type: 'history', 'id': 'const'},
            'browserLanguage': {type: 'Number', 'id': 'const'},
            'cookieEnabled': {type: 'Number', 'id': 'const'},
            'cpuClass': {type: 'Number', 'id': 'const'},
            'onLine': {type: 'Number', 'id': 'const'},
            'platform': {type: 'String', 'id': 'const'},
            'systemLanguage': {type: 'String', 'id': 'const'},
            'userAgent': {type: 'String', 'id': 'const'},
            'userLanguage': {type: 'String', 'id': 'const'},
            'javaEnabled': {type: 'Boolean', 'id': 'function', param: []},
            'taintEnabled': {type: 'Boolean', 'id': 'function', param: []},
        }
    },
    'location': {
        'type': 'Object',
        'id': 'object',
        'static': {
            'hash': {type: 'String', 'id': 'const'},
            'host': {type: 'String', 'id': 'const'},
            'hostname': {type: 'String', 'id': 'const'},
            'href': {type: 'String', 'id': 'const'},
            'pathname': {type: 'String', 'id': 'const'},
            'port': {type: 'Number', 'id': 'const'},
            'protocol': {type: 'String', 'id': 'const'},
            'search': {type: 'String', 'id': 'const'},
            'assign': {type: 'void', 'id': 'function', param: []},
            'reload': {type: 'void', 'id': 'function', param: []},
            'replace': {type: 'void', 'id': 'function', param: []},
        }
    },
    'Element': {
        'type': 'Element',
        'id': 'class',
        'inherit':'EventDispatcher',
        'static':{
          'querySelector':{type: 'Array', 'id': 'function', param:['String'] }
        },
        'proto': {
            'forEach': {type: '*', 'id': 'function',param:['Function']},
            'property': {type: 'String', 'id': 'function',param:[]},
            'html': {type: 'String', 'id': 'function',param:['String']},
            'length': {type: 'Number', 'id': 'const'},
            'slice': {type: 'Number', 'id': 'function', param:['Number'] },
            'style': {type: 'Element', 'id': 'function', param:[] },
            'width': {type: '*', 'id': 'function', param:[] },
            'height': {type: '*', 'id': 'function', param:[] },
            'current': {type: 'Object', 'id': 'function', param:[] },
            'addChild': {type: 'Object', 'id': 'function', param:[] },
            'addChildAt': {type: 'Object', 'id': 'function', param:[] },
        }

    },
    'StyleEvent':{
        'id':'class', 'type':'StyleEvent','inherit':'PropertyEvent',
        'static':{
            "CHANGE":{'id':'const','type':'String'},
        },
        'proto':{
            "property":{'id':'const','type':'String'},
            "newValue":{'id':'const','type':'Object'},
            "oldValue":{'id':'const','type':'Object'},
        }
    },
    'PropertyEvent':{
        'id':'class', 'type':'PropertyEvent','inherit':'Event',
        'static':{
            "CHANGE":{'id':'const','type':'String'},
        },
        'proto':{
            "property":{'id':'var','type':'String'},
            "newValue":{'id':'var','type':'Object'},
            "oldValue":{'id':'var','type':'Object'},
        }
    },
    'ElementEvent':{
        'id':'class', 'type':'ElementEvent','inherit':'Event',
        'static':{
            "ADD":{'id':'const','type':'String'},
            "REMOVE":{'id':'const','type':'String'},
        },
        'proto':{
            "parent":{'id':'const','type':'Object'},
            "child":{'id':'const','type':'Object'},
        }
    },
    'MouseEvent':{
        'id':'class', 'type':'MouseEvent','inherit':'Event',
        'static':{
            "MOUSE_DOWN":{'id':'const','type':'String'},
            "MOUSE_UP":{'id':'const','type':'String'},
            "MOUSE_OVER":{'id':'const','type':'String'},
            "MOUSE_OUT":{'id':'const','type':'String'},
            "MOUSE_OUTSIDE":{'id':'const','type':'String'},
            "MOUSE_MOVE":{'id':'const','type':'String'},
            "MOUSE_WHEEL":{'id':'const','type':'String'},
            "CLICK":{'id':'const','type':'String'},
            "DBLCLICK":{'id':'const','type':'String'},
            "MOUSE_OVER":{'id':'const','type':'String'},
        },
        'proto':{
            "pageX":{'id':'const','type':'Number'},
            "pageY":{'id':'const','type':'Number'},
            "offsetX":{'id':'const','type':'Number'},
            "offsetY":{'id':'const','type':'Number'},
            "screenX":{'id':'const','type':'Number'},
            "screenY":{'id':'const','type':'Number'},
        }
    },
    'KeyboardEvent':{
        'id':'class', 'type':'KeyboardEvent','inherit':'Event',
        'static':{
            "KEY_PRESS":{'id':'const','type':'String'},
            "KEY_UP":{'id':'const','type':'String'},
            "KEY_DOWN":{'id':'const','type':'String'},
        },
        'proto':{
            "keycode":{'id':'const','type':'Number'},
        }
    },
    'ScrollEvent':{
        'id':'class', 'type':'ScrollEvent','inherit':'PropertyEvent',
    },

    'TouchEvent':{
        'id':'class', 'type':'TouchEvent','inherit':'MouseEvent',
        'static':{
            "TOUCH_START":{'id':'const','type':'String'},
            "TOUCH_MOVE":{'id':'const','type':'String'},
            "TOUCH_END":{'id':'const','type':'String'},
            "TOUCH_CANCEL":{'id':'const','type':'String'},
        },
        'proto':{
            "pageX":{'id':'const','type':'Number'},
            "pageY":{'id':'const','type':'Number'},
            "offsetX":{'id':'const','type':'Number'},
            "offsetY":{'id':'const','type':'Number'},
            "screenX":{'id':'const','type':'Number'},
            "screenY":{'id':'const','type':'Number'},
        }
    },

    'TouchDragEvent':{
        'id':'class', 'type':'TouchDragEvent','inherit':'TouchEvent',
        'static':{
            "TOUCH_DRAG_START":{'id':'const','type':'String'},
            "TOUCH_DRAG_MOVE":{'id':'const','type':'String'},
            "TOUCH_DRAG_END":{'id':'const','type':'String'},
        },
        'proto':{
            "startX":{'id':'const','type':'Number'},
            "startY":{'id':'const','type':'Number'},
            "moveX":{'id':'const','type':'Number'},
            "moveY":{'id':'const','type':'Number'},
            "lastMoveX":{'id':'const','type':'Number'},
            "lastMoveY":{'id':'const','type':'Number'},
            "startDate":{'id':'const','type':'Number'},
            "moveDate":{'id':'const','type':'Number'},
            "velocity":{'id':'const','type':'Number'},
            "held":{'id':'const','type':'Number'},
        }
    },

    'TouchPinchEvent':{
        'id':'class', 'type':'TouchPinchEvent','inherit':'TouchEvent',
        'static':{
            "TOUCH_PINCH_START":{'id':'const','type':'String'},
            "TOUCH_PINCH_MOVE":{'id':'const','type':'String'},
            "TOUCH_PINCH_END":{'id':'const','type':'String'},
        },
        'proto':{
            "startX":{'id':'const','type':'Number'},
            "startY":{'id':'const','type':'Number'},
            "moveX":{'id':'const','type':'Number'},
            "moveY":{'id':'const','type':'Number'},
            "scale":{'id':'const','type':'Number'},
            "previousScale":{'id':'const','type':'Number'},
            "moveDistance":{'id':'const','type':'Number'},
            "startDistance":{'id':'const','type':'Number'},
        }
    },
    'TouchSwipeEvent':{
        'id':'class', 'type':'TouchSwipeEvent','inherit':'TouchEvent',
        'static':{
            "TOUCH_SWIPE_START":{'id':'const','type':'String'},
            "TOUCH_SWIPE_MOVE":{'id':'const','type':'String'},
            "TOUCH_SWIPE_END":{'id':'const','type':'String'},
        },
        'proto':{
            "startX":{'id':'const','type':'Number'},
            "startY":{'id':'const','type':'Number'},
            "moveX":{'id':'const','type':'Number'},
            "moveY":{'id':'const','type':'Number'},
            "lastMoveX":{'id':'const','type':'Number'},
            "lastMoveY":{'id':'const','type':'Number'},
            "startDate":{'id':'const','type':'Number'},
            "moveDate":{'id':'const','type':'Number'},
            "velocity":{'id':'const','type':'Number'},
            "vDistance":{'id':'const','type':'Number'},
            "hDistance":{'id':'const','type':'Number'},
            "swiped":{'id':'const','type':'Number'},
        }
    },
    'DataArray':{
        'id':'class',
        'type':'DataArray',
        'inherit':'Array',
        'static':{
            'DESC': {type: 'Number', id: 'const',value:'desc'},
            'ASC': {type: 'Number', id: 'const',value:'asc'},
        },
        'proto':{
            'orderBy':{'type':'DataArray','id':'function','param':['String','*']},
            'sum':{'type':'Number','id':'function','param':[]},
        },
    },
    'DataGrep':{
        'id':'class',
        'type':'DataSource',
        'inherit':'DataArray',
        'proto':{
            'filter':{'type':'Function','id':'function','param':[]},
            'clean':{'type':'DataSource','id':'function','param':[]},
            'execute':{'type':'Array','id':'function','param':['*']},
            'range':{'type':'DataGrep','id':'function','param':['String', 'Number', 'Number', '*']},
            'index':{'type':'DataGrep','id':'function','param':['Number', 'Number', '*']},
            'eq':{'type':'DataGrep','id':'function','param':['String','Object','*']},
            'not':{'type':'DataGrep','id':'function','param':['String','Object','*']},
            'gt':{'type':'DataGrep','id':'function','param':['String','Object','*']},
            'lt':{'type':'DataGrep','id':'function','param':['String','Object','*']},
            'egt':{'type':'DataGrep','id':'function','param':['String','Object','*']},
            'elt':{'type':'DataGrep','id':'function','param':['String','Object','*']},
            'like':{'type':'DataGrep','id':'function','param':['String','String','Object','*']},
            'notLike':{'type':'DataGrep','id':'function','param':['String','String','Object','*']},
        },
    },
    'Http':{
        'id':'class',
        'type':'Http',
        'inherit':'EventDispatcher',
        'static':{
            'METHOD':{'id':'const','type':'*'},
            'TYPE':{'id':'const','type':'*'},
        },
        'proto':{
            'abort':{'type':'Boolean','id':'function','param':[]},
            'send':{'type':'Boolean','id':'function','param':['String', 'Object', 'Object']},
            'setRequestHeader':{'type':'Http','id':'function','param':['String', 'Object']},
            'getResponseHeader':{'type':'String','id':'function','param':['String']},
        },
    },
    'Bindable':{
        'id':'class',
        'type':'Bindable',
        'inherit':'EventDispatcher',
        'static':{},
        'proto':{
            'bind':{'type':'Bindable','id':'function','param':['Object','String','*']},
            'unbind':{'type':'Bindable','id':'function','param':['Object']},
            'property':{'type':'Bindable','id':'function','param':['String', 'Object']},
            'hasProperty':{'type':'Boolean','id':'function','param':['String']},
        },
    },
    'HttpEvent':{
        'id':'class', 'type':'HttpEvent','inherit':'Event',
        'static':{
            "SUCCESS":{'id':'const','type':'String'},
            "ERROR":{'id':'const','type':'String'},
            "CANCELED":{'id':'const','type':'String'},
            "TIMEOUT":{'id':'const','type':'String'},
            "LOAD_START":{'id':'const','type':'String'},
            "PROGRESS":{'id':'const','type':'String'},
        },
        'proto':{
            "data":{'id':'const','type':'Object'},
            "url":{'id':'const','type':'String'},
        }
    },
    'DataSource':{
        'id':'class',
        'type':'DataSource',
        'inherit':'EventDispatcher',
        'proto':{
            'isRemote':{'type':'Boolean','id':'function','param':[]},
            'options':{'type':'DataSource','id':'function','param':['Object']},
            'source':{'type':'DataSource','id':'function','param':['*']},
            'pageSize':{'type':'Number','id':'function','param':[]},
            'maxBuffer':{'type':'Number','id':'function','param':['Number']},
            'totalPage':{'type':'Number','id':'function','param':[]},
            'realSize':{'type':'Number','id':'function','param':[]},
            'totalSize':{'type':'Number','id':'function','param':[]},
            'grep':{'type':'DataGrep','id':'function','param':[]},
            'filter':{'type':'DataSource','id':'function','param':['Object']},
            'current':{'type':'Number','id':'function','param':[]},
            'offsetAt':{'type':'Number','id':'function','param':['Number']},
            'append':{'type':'DataSource','id':'function','param':['Object']},
            'remove':{'type':'DataSource','id':'function','param':[]},
            'update':{'type':'Boolean','id':'function','param':['Object']},
            'select':{'type':'DataSource','id':'function','param':[]},
        },
    },
    'DataSourceEvent':{
        'id':'class', 'type':'DataSourceEvent','inherit':'Event',
        'static':{
            "APPEND":{'id':'const','type':'String'},
            "REMOVE":{'id':'const','type':'String'},
            "UPDATE":{'id':'const','type':'String'},
            "SELECT":{'id':'const','type':'String'},
            "CHANGED":{'id':'const','type':'String'},
        },
        'proto':{
            "data":{'id':'const','type':'Object'},
            "index":{'id':'const','type':'Number'},
            "oldValue":{'id':'const','type':'Object'},
            "newValue":{'id':'const','type':'Object'},
            "current":{'id':'const','type':'Number'},
            "condition":{'id':'const','type':'Object'},
            "offset":{'id':'const','type':'Number'},
            "waiting":{'id':'const','type':'Boolean'},
        }
    },
    'Render': {
        'type': 'Render',
        'id': 'class',
        'inherit':'EventDispatcher',
        'proto': {
            'variable': {type: 'Object', 'id': 'function',param:['Object']},
            'template': {type: 'String', 'id': 'function',param:['String']},
            'fetch': {type: 'String', 'id': 'function',param:[]},
        },
        "xml":{
            'foreach':{name:'String',value:"String"},
            'if': {condition:'String'},
            'elseif': {condition:'String'},
            'else': {},
            'switch': {condition:'String'},
            'case': {condition:'String'},
            'default': {},
            'break':{},
            'do': {},
            'while':{condition:'String'},
            'code':{},
            'script':{},
        },
    },
    'RenderEvent':{
        'id':'class', 'type':'RenderEvent','inherit':'Event',
        'static':{
            "START":{'id':'const','type':'String'},
            "DONE":{'id':'const','type':'String'},
            "REFRESH":{'id':'const','type':'String'},
        },
        'proto':{
            "view":{'id':'const','type':'String'},
            "viewport":{'id':'const','type':'Element'},
            "html":{'id':'const','type':'String'},
        }
    }, 'ComponentEvent':{
        'id':'class', 'type':'ComponentEvent','inherit':'Event',
        'static':{
            "INITIALIZED":{'id':'const','type':'String'},
        },
    }, 'SkinEvent':{
        'id':'class', 'type':'SkinEvent','inherit':'Event',
        'static':{
            "INSTALLING":{'id':'const','type':'String'},
            "INSTALLED":{'id':'const','type':'String'},
            "CREATE_CHILDREN_COMPLETED":{'id':'const','type':'String'},
        },
        'proto':{
            "viewport":{'id':'var','type':'Object'},
            "hostComponent":{'id':'var','type':'Component'},
            "skinContent":{'id':'var','type':'Object'},
        }
    },
    'Component': {
        'type': 'Component',
        'id': 'class',
        'inherit':'EventDispatcher',
        'proto': {
            'hostComponent': {type: 'Component', 'id': 'function',param:[]},
            //'display': {type: 'Boolean', 'id': 'function',param:[]},
        }
    },
    'Skin': {
        'type': 'Skin',
        'id': 'class',
        'inherit':'Element',
        'ignorePropertyNotExists':true,
        'proto': {
            'getChildById': {type: 'Object', 'id': 'function',param:['String']},
            'initializing': {type: 'Object', 'id': 'function',param:[]},
            'initialized': {type: 'Object', 'id': 'function',param:[]},
            'createChildren': {type: 'void', 'id': 'function',param:[]},
            'render': {type: 'Render', 'id': 'function',param:[]},
            'hostComponent': {type: '*', 'id': 'function',param:['Object']},
            'updateDisplayList': {type: 'void', 'id': 'function',param:[]},
            'variable': {type: 'Object', 'id': 'function',param:['Object']},
            'template': {type: 'String', 'id': 'function',param:['String']},
            'states': {type: 'Skin', 'id': 'function',param:['Array']},
            'currentState': {type: 'Skin', 'id': 'function',param:['String']},
        },
        "xml":{
            'foreach':{name:'String',value:"String"},
            'if': {condition:'String'},
            'elseif': {condition:'String'},
            'else': {},
            'switch': {condition:'String'},
            'case': {condition:'String'},
            'default': {},
            'break':{},
            'do': {},
            'while':{condition:'String'},
            'code':{},
            'script':{},
        },
    },
    'SkinComponent': {
        'type': 'SkinComponent',
        'id': 'class',
        'inherit':'Component',
        'proto': {
            'dataSource': {type: 'DataSource', 'id': 'function',param:[]},
            'source': {type: 'DataRender', 'id': 'function',param:['Object']},
            'dataProfile': {type: 'Object', 'id': 'function',param:[]},
            'display': {type: 'Boolean', 'id': 'function',param:[]},
        }
    },

    'DataGrid': {
        'type': 'DataGrid',
        'id': 'class',
        'inherit':'SkinComponent',
        'proto': {
            'dataSource': {type: 'DataSource', 'id': 'function',param:[]},
            'source': {type: 'DataRender', 'id': 'function',param:['Object']},
            'dataProfile': {type: 'Object', 'id': 'function',param:[]},
            'display': {type: 'Boolean', 'id': 'function',param:[]},
        }
    },
    'Pagination': {
        'type': 'Pagination',
        'id': 'class',
        'inherit':'SkinComponent',
        'proto': {
            'dataSource': {type: 'DataSource', 'id': 'function',param:[]},
            'source': {type: 'DataRender', 'id': 'function',param:['Object']},
            'dataProfile': {type: 'Object', 'id': 'function',param:[]},
            'display': {type: 'Boolean', 'id': 'function',param:[]},
        }
    },'State': {
        'type': 'State',
        'id': 'class',
        'inherit':'Object',
        'proto': {
            'stateGroup': {type: 'Array', 'id': 'function',param:['Array']},
            'name': {type: 'String', 'id': 'function',param:['name']},
            'includeIn': {type: 'Boolean', 'id': 'function',param:['String']},
        }
    },
};
module.exports=descriptor;


