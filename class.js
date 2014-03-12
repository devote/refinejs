/*
 * jClass - class definition for JavaScript v1.2.0
 *
 * Copyright 2012-2014, Dmitrii Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/ - https://github.com/devote
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Update: 03/12/2014
 */
(function(window, True, False, Null, undefined) {

    "use strict";

    var // for advanced mode compilation in GCC
        Array = window['Array'],
        Object = window['Object'],
        Boolean = window['Boolean'],
        toString = Object.prototype.toString,
        defineProperty = Object.defineProperty,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        emptyFunction = function() {
        },
        errorFunction = function(prop, type) {
            return function() {
                throw new Error("'" + prop + "' property is " + (type ? "read" : "write") + "-only");
            }
        };

    var
        libID = (new Date()).getTime(), // Identifier for library, it is will be necessary for the classes in VBScript
        hasDontEnumBug = !({toString: 1}).propertyIsEnumerable('toString'), // is enumerable properties?
        dontEnums = [
            // not enumerated properties in IE <9
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ];

    /**
     * Class definition
     *
     * @param {*} [context] The context in which to create a new class
     * @param {*} [className] Name of the class can have a namespace dividing point
     * @param {*} [extend] One or a list of names/constructors classes from which inherit property
     * @param {*} [options] Object contains static properties and other options
     * @param {*} [structure] The structure of the class
     * @return {Function|Object} Returns constructor or an instance
     */
    window['jClass'] = function jClass(context, className, extend, options, structure) {
        var
            p1, p2, p3,
            VB = VBInc,
            firstPass = 1,
            argv = arguments,
            argn = argv.length - 1,
            constructorName = 'constructor',
            staticClass = Null,
            staticClassParts = [],
            staticClassNames = [],
            accessorsActive = 0,
            accessors = VBInc === Null ? 0 : {},
            element, parts, statics, compact, extendCount,
            returnInstance = this instanceof jClass;

        // get a reference to the class structure
        structure = argv[argn--] || {};

        if (argv[argn] && typeof argv[argn] === 'object' && !(argv[argn] instanceof Array) &&
            argv[argn].constructor && argv[argn].constructor !== Object.prototype.constructor) {
            if (VBInc && defineProperty) {
                try {
                    defineProperty(argv[argn], 't' + libID, {configurable: 1, set: function(a){VB = a}});
                    argv[argn]['t' + libID] = 0;
                    delete argv[argn]['t' + libID];
                } catch (_e_) {}
            }
            element = VB ? Null : (compact = True, argv[argn--]);
        }

        // option can only be stored in the object
        options = !argv[argn] || argv[argn] instanceof Array || typeof argv[argn] !== 'object' ? {} : argv[argn--];

        // inclusion of compact mode
        compact = compact || options['compact'];

        // Save references on the properties
        p1 = options['context'];
        p2 = options['extend'];
        p3 = options['mixins'];

        // static properties
        statics = options['statics'] || (p1 || p2 || p3 || compact !== undefined ? {} : options);

        // construct an array of inherited classes
        extend = argv[argn] instanceof Array ? argv[argn--] : typeof argv[argn] === 'function' ? [argv[argn--]] :
            typeof argv[argn - 1] === 'string' && ('' + argv[argn--]).replace(/(^|\s)(extends|implements)(\s|$)/g, ',')
                .replace(/^[\s,]+|\s(?=\s)|[\s,]+$/g, '').replace(/\s*,\s*/g, ',').split(',') || [];

        // additional array of inherited classes
        parts = typeof argv[argn] === 'string' && argv[argn--].split(/extends|implements|,/g) || [];

        // get the context in which to add the class constructor
        context = argv[argn--] || p1 || jClass['NS'] || (jClass['NS'] = window);

        // name of the new class
        className = (parts.shift() || '').replace(/^\s+|\s+$/g, '');

        // lists of classes from which inherit properties
        p1 = (parts = parts.join(',').replace(/^[\s,]+|[\s,]+$/g, '').replace(/\s*,\s*/g, ',')) ? parts.split(',') : [];
        p2 = (p2 = (p2 || [])) instanceof Array ? p2 : [p2];
        p3 = (p3 = (p3 || [])) instanceof Array ? p3 : [p3];

        // obtain a complete list of parent classes
        extend = p1.concat.apply(p1, extend.concat.apply(extend, p2.concat.apply(p2, p3)));

        // parent classes numbers
        extendCount = extend.length;

        if (typeof structure !== 'function') {
            // if the structure is not a function
            var originalStructure = structure;
            structure = function() {
                // make a copy of an object
                emptyFunction.prototype = originalStructure.constructor.prototype;
                parts = new emptyFunction;
                each(originalStructure, function(prop, val) {
                    parts[prop] = val
                });
                return parts;
            }
        }

        // this will be the constructor for the generated class
        var classConstructor = function() {
            var
                index = extendCount,
                isParent = this instanceof Boolean,
                args = arguments,
                oParent = Null,
                obj = new structure,
                proto = isParent && args[2] || Null,
                copy = element || proto || obj,
                owner = isParent ? args[0] : {o: obj},
                compactMode = !isParent || args[1] === undefined || compact !== undefined ? compact : args[1];

            // copy the static properties
            each(statics, function(prop, val) {
                obj[prop] = val;
            });

            for(; index--;) {
                if (typeof extend[index] === 'string') {
                    // get the class by its name
                    extend[index] = getClassByName(extend[index], context);
                }
                emptyFunction.prototype = oParent = extend[index].call(new Boolean, owner, compactMode, proto);
                if (index > 0) {
                    // cannot auto execute constructor in implements
                    owner['i'] = Null;
                }
                copy = proto = new emptyFunction;
            }

            if (extendCount || isParent || element) {
                // proxy method to wrap functions
                var bindMethod = function(value) {
                    return typeof value === 'function' ? function() {
                        var object = owner.o, _parent = object['parent'];
                        !compactMode && (object['parent'] = oParent);
                        var result = value.apply(this === copy || this == window ? object : this, arguments);
                        !compactMode && (object['parent'] = _parent);
                        return result;
                    } : value;
                };

                // wrap all the functions of a class in the proxy
                each(obj, function(prop, value) {
                    if (value && typeof value === 'object') {
                        if ('set' in value) {
                            value.set = bindMethod(value.set);
                        }
                        if ('get' in value) {
                            value.get = bindMethod(value.get);
                        }
                    }
                    copy[prop] = bindMethod(value);
                });

                owner.o = isParent ? owner.o : copy;
            }

            if (!compactMode) {
                // adds special statements
                copy['__class__'] = classConstructor;
                copy['parent'] = oParent;
            }

            // if supported accessors
            if (!isParent && accessors !== 0) {
                // first initialization of the class or if the browser supports accessors in ordinary objects
                if (!VB || firstPass) {
                    each(firstPass ? copy : accessors, function(prop) {
                        // search accessors
                        var value = copy[prop],
                            subName = prop,
                            type = !firstPass ? accessors[prop]
                                : value && typeof value === 'object' && prop !== 'parent' && (value.set || value.get) ? 1
                                : prop.indexOf('get ') === 0 ? 2
                                : prop.indexOf('set ') === 0 ? 3
                                : VB && prop === 'toString' ? 4 : 0;

                        if (type) {
                            // if has found an accessors and not toString property
                            if (firstPass && (accessors[prop] = type) !== 4) {
                                accessorsActive++;
                            }

                            if (type === 1) {
                                emptyFunction.prototype = value;
                                value = new emptyFunction;
                            } else {
                                // trimmed prefix set/get
                                subName = prop.split(' ').pop();
                            }

                            if (!VB) {
                                // for browsers supported accessors to ordinary objects
                                var descriptorSet = function(val) {
                                    // proxy for setter
                                    ((type === 1 ? value.set : value) || errorFunction(subName, 1)).call(this, val, value);
                                };

                                var descriptorGet = function() {
                                    // proxy for getter
                                    return ((type === 1 ? value.get : value) || errorFunction(subName, 0)).call(this, value);
                                };

                                if (hasOwnProperty.call(copy, prop)) {
                                    // remove original property
                                    delete copy[prop];
                                }

                                if (defineProperty) {
                                    // w3c standard
                                    var descr = Object.getOwnPropertyDescriptor(copy, subName);
                                    defineProperty(copy, subName, {
                                        enumerable: VBInc ? 0 : 1,
                                        configurable: 1,
                                        set: type === 2 && descr && descr.set || descriptorSet,
                                        get: type === 3 && descr && descr.get || descriptorGet
                                    });
                                } else {
                                    // Mozilla standard
                                    copy.__defineSetter__(subName, type === 2 && copy.__lookupSetter__(subName) || descriptorSet);
                                    copy.__defineGetter__(subName, type === 3 && copy.__lookupGetter__(subName) || descriptorGet);
                                }
                            } else {
                                // for Internet Explorer VisualBasic Script accessors
                                if (type !== 3) {
                                    // create getter in VB Class
                                    staticClassParts.push(
                                        'Public ' + (type === 4 ? 'Default ' : '' ) + 'Property Get [' + subName + ']',
                                        'Call VBCorrectVal(' + ( value && ( type !== 1 || value.get) ?
                                            '[(accessors)].[' + prop + ']' + (type === 1 ? '.get' : '') +
                                                '.call(me,[(accessors)].[' + prop + '])' : 'window.undefined' ) +
                                            ',[' + subName + '])', 'End Property'
                                    );
                                }
                                if (type !== 2) {
                                    // create setter in VB Class
                                    staticClassParts.push(
                                        'Public Property Let [' + subName + '](val)',
                                        type = (type === 4 ? 'Set [(accessors)].[' + prop + ']=val' :
                                            value && (type !== 1 || value.set) ?
                                                'Call [(accessors)].[' + prop + ']' + (type === 1 ? '.set' : '') +
                                                    '.call(me,val,[(accessors)].[' + prop + '])' : '') +
                                            '\nEnd Property', 'Public Property Set [' + subName + '](val)', type
                                    );
                                }
                            }
                        } else if (VB) {
                            // VBScript up to 60 multiple dimensions may be declared.
                            if (staticClassNames.length === 50) { // flush 50 items
                                staticClassParts.push('Public [' + staticClassNames.join('],[') + ']');
                                staticClassNames.length = 0;
                            }
                            staticClassNames[staticClassNames.length] = prop;
                        }
                    }, firstPass);
                }

                if (firstPass && !(firstPass = 0) && accessorsActive === 0) {
                    staticClassNames = staticClassParts = accessors = 0;
                } else if (VB) {
                    if (accessorsActive) {
                        // once initialize VB Class for later use
                        staticClass = 'StaticClass' + libID + VBInc++;
                        staticClassParts.unshift('Class ' + staticClass);
                        staticClassParts.push(
                            (staticClassNames.length
                                ? 'Public [' + staticClassNames.join('],[') + ']\n' : '') + 'Private [(accessors)]',
                            'Private Sub Class_Initialize()',
                            'Set [(accessors)]=' + staticClass + 'FactoryJS()',
                            'End Sub',
                            'End Class',
                            'Function ' + staticClass + 'Factory()',
                            'Set ' + staticClass + 'Factory=New ' + staticClass,
                            'End Function'
                        );
                        window[staticClass + 'FactoryJS'] = function() {
                            return staticClassParts;
                        };
                        window['execVBScript'](staticClassParts.join('\n'));
                        accessorsActive = staticClassNames = staticClassParts = Null;
                    }

                    staticClassParts = {};
                    owner.o = window[staticClass + "Factory"]();

                    // copy all values into new VB Class object
                    each(copy, function(prop, val) {
                        if (!accessors.hasOwnProperty(prop)) {
                            if ((!extendCount || compactMode) && typeof val === 'function' && prop !== '__class__') {
                                owner.o[prop] = function() {
                                    return val.apply(this === copy || this == window ? owner.o : this, arguments);
                                }
                            } else {
                                owner.o[prop] = val;
                            }
                        } else {
                            if (accessors[prop] === 1) {
                                emptyFunction.prototype = copy[prop];
                                staticClassParts[prop] = new emptyFunction;
                            } else {
                                staticClassParts[prop] = copy[prop];
                            }
                        }
                    }, 1);
                    // new link to VB Class object
                    copy = owner.o;
                }
            }

            // keep a reference to the class constructor
            if (hasOwnProperty.call(copy, constructorName)) {
                owner['i'] = copy[constructorName];
            } else if (hasOwnProperty.call(copy, 'constructor')) {
                owner['i'] = copy['constructor'];
            }

            // create class
            return new function() {
                if (!isParent && typeof owner['i'] === 'function') {
                    owner['i'].apply(copy, args);
                }
                return copy;
            };
        };

        classConstructor.toString = function() {
            return "[class " + (className || "Object") + "]";
        };

        // copy the static properties
        each(statics, function(prop, val) {
            classConstructor[prop] = val;
        });

        // if the name of the class is defined, put it into context
        if (classConstructor.className = className) {

            var _context = context;

            // The name can be a namespace
            argv = (parts = className.split('.')).shift();

            do {
                if (parts.length === 0) {
                    _context[constructorName = argv] = classConstructor;
                } else {
                    if (!(argv in _context)) {
                        _context[argv] = {};
                    }
                    _context = _context[argv];
                }
            } while(argv = parts.shift());
        }

        // return an instance of Class if summoned by the operator new, otherwise return the constructor
        return returnInstance ? new classConstructor : classConstructor;
    };

    /**
     * Returns the class constructor by name
     *
     * @param {String} name Name of the class that will search
     * @param {Object} context Context where it is necessary to find a constructor
     * @return {Function} Returns constructor
     */
    function getClassByName(name, context) {
        var subName, construct = name;
        if (typeof name === 'string') {
            construct = name.split('.');
            while((subName = construct.shift()) && (context = context[subName])) {
            }
            construct = context;
        }
        if (typeof construct !== 'function') {
            throw new Error("Parent class '" + name + "' not Initialized or Undefined");
        }
        return construct;
    }

    /**
     * Iterates through each property of the object by calling the callback
     * with the parameters of the property name and value
     *
     * @param {Object|Array} object The object or array to iterate properties
     * @param {Function} callback Function that will be called for each property
     * @param {Boolean|Number} [all] If true/1 will list all the properties of an object, including parent
     */
    function each(object, callback, all) {
        var index, length = dontEnums.length, value;
        for(index in object) {
            value = object[index];
            if (((all && value !== Object.prototype[index]) || hasOwnProperty.call(object, index)) &&
                callback.call(value, index, value) === False) {
                length = False;
                break;
            }
        }
        if (length && hasDontEnumBug) {
            for(index = 0; index < length; index++) {
                value = object[dontEnums[index]];
                if ((hasOwnProperty.call(object, dontEnums[index]) ||
                    (all && dontEnums[index] in object && value !== Object.prototype[dontEnums[index]])) &&
                    callback.call(value, dontEnums[index], value) === False) {
                    break;
                }
            }
        }
    }

    /**
     * Whether an object is an instance of class
     *
     * @param {Object} object
     * @param {Function} constructor
     * @return {Boolean}
     */
    jClass['instanceOf'] = function(object, constructor) {

        while(object && object['__class__'] != Null) {

            if (object['__class__'] === constructor) {
                return True;
            }
            object = object['parent'];
        }
        return False;
    };

    /**
     * The function determines the capabilities of the browser. If your browser supports
     * accessors to ordinary objects, VBInc will be zero, otherwise returns 1
     */
    var VBInc = (function(object) {
        var setter = function(value) {
            object = value;
        };

        try {
            // test w3c standard
            defineProperty(object, 't', {set: setter});
        } catch(error) {
            try {
                // test Mozilla standard
                object.__defineSetter__('t', setter);
            } catch(error) {
            }
        }
        // test setter
        object['t'] = 0;

        // if setter not supports
        if (object) {

            object = 1; // Maybe VBScript classes supports???

            if (!('execVBscript' in window)) {
                // for IE only, if VisualBasic script compiler supports
                if ('execScript' in window) {
                    window['execScript'](
                        'Function execVBscript(code) '
                            + 'ExecuteGlobal(code) '
                            + 'End Function\n'
                            + 'Function VBCorrectVal(o,r) '
                            + 'If IsObject(o) Then '
                            + 'Set r=o Else r=o '
                            + 'End If '
                            + 'End Function',
                        'VBScript'
                    );
                } else {
                    // if not supported any accessors :(
                    object = Null;
                }
            }
        }

        return object;
    })({});

    // default namespace for the Classes
    jClass['NS'] = jClass['NS'] || window;

})(window, true, false, null);
