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
        'proto': {
            'forEach': {type: '*', 'id': 'function',param:['Function']},
            'property': {type: 'String', 'id': 'function',param:[]},
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
    'HttpEvent':{
        'id':'class', 'type':'HttpEvent','inherit':'Event',
        'static':{
            "SUCCESS":{'id':'const','type':'String'},
            "ERROR":{'id':'const','type':'String'},
            "CANCELED":{'id':'const','type':'String'},
            "TIMEOUT":{'id':'const','type':'String'},
            "DONE":{'id':'const','type':'String'},
        },
        'proto':{
            "data":{'id':'const','type':'Object'},
            "url":{'id':'const','type':'String'},
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
            "property":{'id':'const','type':'String'},
            "newValue":{'id':'const','type':'Object'},
            "oldValue":{'id':'const','type':'Object'},
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
};
module.exports=descriptor;


