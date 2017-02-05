var objects = {
    'Class':{'id':'class', 'type':'Class', 'inherit':'Object'},
    'Number':{'id':'class', 'type':'Number', 'inherit':'Object'},
    'String':{
        'id':'class', 'type':'String', 'inherit':'Object','constructor':String,
        'proto': {
          'replace':{ 'id':'function','qualifier':'public', 'type':'String' }
        }
    },
    'Json':{'id':'object', 'type':'Json','inherit':'Object'},
    'System':{
        'id':'object', 'type':'System','inherit':'Object',
        'static': {
            'new': {type: '*', id: 'function', param: ['...']},
        }
    },
    'Object':{
        'id':'class',
        'type':'Object',
        'static': {
            'assign': {'type': 'Object', 'id': 'function', param: []},
            'create': {'type': 'Object', 'id': 'function', param: []},
            'defineProperty': {'type': 'Object', 'id': 'function', param: []},
            'defineProperties': {'type': 'Object', 'id': 'function', param: []},
            'entries': {'type': 'Object', 'id': 'function', param: []},
            'freeze': {'type': 'Object', 'id': 'function', param: []},
            'getOwnPropertyDescriptor': {'type': 'Object', 'id': 'function', param: []},
            'getOwnPropertyNames': {'type': 'Object', 'id': 'function', param: []},
            'getOwnPropertySymbols': {'type': 'Object', 'id': 'function', param: []},
            'getPrototypeOf': {'type': 'Object', 'id': 'function', param: []},
            'is': {'type': 'Object', 'id': 'function', param: []},
            'isExtensible': {'type': 'Object', 'id': 'function', param: []},
            'isFrozen': {'type': 'Object', 'id': 'function', param: []},
            'isSealed': {'type': 'Object', 'id': 'function', param: []},
            'preventExtensions': {'type': 'Object', 'id': 'function', param: []},
            'seal': {'type': 'Object', 'id': 'function', param: []},
            'setPrototypeOf': {'type': 'Object', 'id': 'function', param: []},
        },
        'proto':{
            'constructor':{'type': 'Function', 'id': 'var'},
            'hasOwnProperty': {'type': 'Boolean', 'id': 'function', param: []},
            'isPrototypeOf': {'type': 'Boolean', 'id': 'function', param: []},
            'propertyIsEnumerable': {'type': 'Boolean', 'id': 'function', param: []},
            'setPropertyIsEnumerable': {'type': 'void', 'id': 'function', param: []},
            'toSource': {'type': 'String', 'id': 'function', param: []},
            'toLocaleString': {'type': 'String', 'id': 'function', param: []},
            'toString': {'type': 'String', 'id': 'function', param: []},
            'valueOf': {'type': 'String', 'id': 'function', param: []},
            'keys': {'type': 'Object', 'id': 'function', param: []},
            'values': {'type': 'Object', 'id': 'function', param: []}
       }
    },
    'RegExp':{'id':'class', 'type':'RegExp'},
    'Error':{'id':'class', 'type':'Error'},
    'EvalError':{'id':'class', 'type':'EvalError'},
    'RangeError':{'id':'class', 'type':'RangeError'},
    'ReferenceError':{'id':'class', 'type':'ReferenceError'},
    'SyntaxError':{'id':'class', 'type':'SyntaxError'},
    'TypeError':{'id':'class', 'type':'TypeError'},
    'URIError':{'id':'class', 'type':'URIError'},
    'Function':{
        'id':'class', 'type':'Function','inherit':'Object',
        'proto':{
            'call':{'id':'function','type':'*','param':['Object'] },
            'apply':{'id':'function','type':'*','param':['Object','Array']},
        }
    },
    'Date':{'id':'class', 'type':'Date'},
    'Boolean':{
        'id':'class',
        'type':'Boolean',
        'proto':{
            'valueOf':{'type':'Boolean','id':'function','param':[]}
        }
    },
    'Symbol':{'id':'class', 'type':'Symbol'},
    'Atomics':{'id':'class', 'type':'Atomics'},
    'DataView':{
        'id':'class',
        'type':'DataView',
        'static':{},
        'properties':{
            'buffer':'ArrayBuffer',
            'byteLength':'Number',
            'byteOffset':'*',
        },
        'methods':{
            'getInt8':'*',
            'getUint8':'*',
            'getInt16':'*',
            'getUint16':'*',
            'getInt32':'*',
            'getUint32':'*',
            'getFloat32':'*',
            'getFloat64':'*',
            'setInt8':'*',
            'setUint8':'*',
            'setInt16':'*',
            'setUint16':'*',
            'setInt32':'*',
            'setUint32':'*',
            'setFloat32':'*',
            'setFloat64':'*',
        },
    },
    'Array':{
        'id':'class',
        'type':'Array',
        'static':{
            'from':'Array',
            'isArray':'Boolean',
            'of':'Array',
        },
        'proto':{
            'length':{'type':'Number','id':'const'},
            'concat':'Array',
            'copyWithin':'Array',
            'entries':'Iterator',
            'every':'Boolean',
            'fill':'Array',
            'filter':'Array',
            'find':'*',
            'findIndex':'Number',
            'forEach':'undefined',
            'includes':'Boolean',
            'indexOf':'Number',
            'join':'String',
            'keys':'Iterator',
            'lastIndexOf':'Number',
            'map':'Array',
            'pop':'*',
            'push':{'type':'Number','id':'function','param':['...']},
            'reduce':'*',
            'reduceRight':'*',
            'reverse':'Array',
            'shift':'*',
            'slice':'Array',
            'some':'Boolean',
            'sort':'Array',
            'splice':{'type':'Array','id':'function','param':['...']},
            'toLocaleString':'String',
            'toSource':'String',
            'toString':'String',
            'unshift':'Number',
            'values':'Iterator',
        },
    },
    'ArrayBuffer':{},
    'Float32Array':{},
    'Float64Array':{},
    'Int16Array':{},
    'Int32Array':{},
    'Int8Array':{},
    'Intl':{
        'static':{
            'DateTimeFormat':'*',
            'NumberFormat':'*',
            'Collator':'*',
        },
        'properties':{},
        'methods':{},
    },
    'Iterator':{},
    'JSON':{},
    'ParallelArray':{},
    'Promise':{},
    'Proxy':{},
    'Reflect':{},
    'SIMD':{
        'static':{
            'Bool16x8':'*',
            'Bool32x4':'*',
            'Bool64x2':'*',
            'Bool8x16':'*',
            'Float32x4':'*',
            'Float64x2':'*',
            'Int16x8':'*',
            'Int32x4':'*',
            'Int8x16':'*',
            'Uint16x8':'*',
            'Uint32x4':'*',
            'Uint8x16':'*',
        },
        'properties':{},
        'methods':{},
    },
    'Set':{},
    'SharedArrayBuffer':{},
    'StopIteration':{},
    'TypedArray':{},
    'URIError':{},
    'Uint16Array':{},
    'Uint32Array':{},
    'Uint8Array':{},
    'Uint8ClampedArray':{},
    'WeakMap':{},
    'WeakSet':{},


    //系统全局方法
    'decodeURI':{type:'String',id:'function',param:['String']},
    'decodeURIComponent':{type:'String',id:'function',param:['String']},
    'encodeURI':{type:'String',id:'function',param:['String']},
    'encodeURIComponent':{type:'String',id:'function',param:['String']},
    'escape':{type:'String',id:'function',param:['String']},
    'eval':{type:'*',id:'function',param:['String']},
    'isFinite':{type:'Boolean',id:'function',param:['*']},
    'isNaN':{type:'Boolean',id:'function',param:['*']},
    'parseFloat':{type:'Number',id:'function',param:['*']},
    'parseInt':{type:'Number',id:'function',param:['*']},
    'unescape':{type:'String',id:'function',param:['String']},
    'uneval':{type:'String',id:'function',param:['*']},
    'Math':{
         'id':'object',
         'type':'Math',
         'static': {
            'E': {type: 'Number', id: 'const'},
            'LN10': {type: 'Number', id: 'const'},
            'LN2': {type: 'Number', id: 'const'},
            'LOG10E': {type: 'Number', id: 'const'},
            'LOG2E': {type: 'Number', id: 'const'},
            'PI': {type: 'Number', id: 'const'},
            'SQRT1_2': {type: 'Number', id: 'const'},
            'SQRT2': {type: 'Number', id: 'const'},
            'abs': {type: 'Number', id: 'function', param: ['Number']},
            'acos': {type: 'Number', id: 'function', param: ['Number']},
            'asin': {type: 'Number', id: 'function', param: ['Number']},
            'atan2': {type: 'Number', id: 'function', param: ['Number']},
            'ceil': {type: 'Number', id: 'function', param: ['Number']},
            'cos': {type: 'Number', id: 'function', param: ['Number']},
            'exp': {type: 'Number', id: 'function', param: ['Number']},
            'floor': {type: 'Number', id: 'function', param: ['Number']},
            'log': {type: 'Number', id: 'function', param: ['Number']},
            'max': {type: 'Number', id: 'function', param: ['Number']},
            'min': {type: 'Number', id: 'function', param: ['Number']},
            'pow': {type: 'Number', id: 'function', param: ['Number']},
            'random': {type: 'Number', id: 'function', param: ['Number']},
            'round': {type: 'Number', id: 'function', param: ['Number']},
            'sin': {type: 'Number', id: 'function', param: ['Number']},
            'sqrt': {type: 'Number', id: 'function', param: ['Number']},
            'tan': {type: 'Number', id: 'function', param: ['Number']},
         }
    },
    'arguments':{
        'id':'object',
        'type':'arguments',
        'static': {
            'callee': {type: '*', id: 'function'},
            'caller': {type: '*', id: 'function', 'state': 'delete'},
            'length': {type: 'Number', id: 'const'},
        }
    },
    'console':{
        'id':'object',
        'type':'console',
        'static': {
            'log': {type: 'void', id: 'function', param: ['...']},
            'error': {type: 'void', id: 'function', param: ['...']},
            'info': {type: 'void', id: 'function', param: ['...']},
            'warn': {type: 'void', id: 'function', param: ['...']},
            'dir': {type: 'void', id: 'function', param: ['*']},
            'trace': {type: 'void', id: 'function', param: ['*']},
            'time': {type: 'void', id: 'function', param: ['String']},
            'timeEnd': {type: 'void', id: 'function', param: ['String']},
            'assert': {type: 'void', id: 'function', param: ['*']},
        }
    },
};

module.exports  = objects;