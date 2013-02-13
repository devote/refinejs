/*
 * light.core.class.js Library for JavaScript v0.5.7
 *
 * Copyright 2012-2013, Dmitrii Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/ - https://github.com/devote
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Update: 13-02-2013
 */
(function(window, True, False, Null, undefined) {

    "use strict";

    var
        Array = window["Array"],
        ownEach, classByName,
        libID = (new Date()).getTime(),
        toString = Object.prototype.toString,
        defineProperty = Object.defineProperty,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        msie = +(((window["eval"] && eval("/*@cc_on 1;@*/") && /msie (\d+)/i.exec(navigator.userAgent)) || [])[1] || 0),
        VBInc = (defineProperty || Object.prototype.__defineGetter__) && (!msie || msie > 8) ? 0 : 1,
        hasDontEnumBug = !({toString: 1}).propertyIsEnumerable('toString'),
        emptyFunction = function(){},
        errorFunction = function(prop, type) {
            return function() {
                throw new Error("'" + prop + "' property is " + (type ? "read" : "write") + "-only");
            }
        },
        dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ];

    function Class() {

        var
            first = 1,
            accessors = {},
            accessorsActive = 0,
            staticClass = False,
            constructorName,
            argv = arguments,
            argn = argv.length - 1,
            _struct = argv[argn--] || {},
            returnInstance = this instanceof Class,
            o = !argv[argn] || argv[argn] instanceof Array || typeof argv[argn] !== "object" ? {} : argv[argn--],
            _extends = o['extends'], _compact = o['compact'], _mixins = o['implements'], _ns = o['context'],
            _static = o['statics'] || (_ns || _extends || _mixins || _compact !== undefined ? {} : o),
            _p2 = typeof argv[argn] === "function" ? [argv[argn--]] : argv[argn] instanceof Array ? argv[argn--] :
                typeof argv[argn-1] === "string" && (""+argv[argn--]).replace(/(^|\s)(extends|implements)(\s|$)/g, ',')
                        .replace(/^[\s,]+|\s(?=\s)|[\s,]+$/g, '').replace(/\s*,\s*/g, ',').split(",") || [],
            _names = typeof argv[argn] === "string" && argv[argn--].split(/extends|implements|,/g) || [],
            _context = argv[argn--] || _ns || Class["defaultContext"] || window,
            _class = (_names.shift() || "").replace(/^\s+|\s+$/g, '' ),
            _p3 = _extends instanceof Array ? _extends : _extends ? [_extends] : [],
            _p4 = _mixins instanceof Array ? _mixins : _mixins ? [_mixins] : [],
            _p1 = (o = _names.join(",").replace(/^[\s,]+|[\s,]+$/g, '').replace(/\s*,\s*/g, ',')) ? o.split(",") : [],
            _implements = _p1.concat.apply(_p1, _p2.concat.apply(_p2, _p3.concat.apply(_p3, _p4)) ),
            _implementsLen = _implements.length;

        if (typeof _struct !== "function") {
            var originalStruct = _struct;
            _struct = function() {
                emptyFunction.prototype = originalStruct.constructor.prototype;
                argv = new emptyFunction();
                ownEach(originalStruct, function(prop, val){argv[prop] = val});
                return argv;
            }
        }

        /** @ignore */
        var staticConstructor = function() {

            var
                index = _implementsLen,
                isParent = +this === 0,
                args = arguments,
                oParent = Null,
                obj = new _struct(),
                proto = oParent && args[2] || Null,
                copy = proto || obj,
                owner = isParent ? args[0] : {obj: obj},
                disableStatement = !isParent || args[1] === undefined || _compact !== undefined ? _compact : args[1];

            for( ; index--; ) {

                if (typeof _implements[index] === "string") {
                    _implements[index] = classByName(_implements[index], _context, staticConstructor);
                }

                emptyFunction.prototype = oParent = _implements[index].call(False, owner, disableStatement, proto);

                if (index > 0 && !disableStatement) {
                    // cannot auto execute constructor in implements
                    oParent['constructor'] = function(){};
                }

                copy = proto = new emptyFunction;
            }

            if (!disableStatement) {
                obj["parent"] = oParent;
            }

            if (_implementsLen || isParent) {

                argv = function(o, prop, originalProp) {
                    o[prop] = function() {
                        var p = owner.obj["parent"], c = owner.obj["__class__"];
                        owner.obj["parent"] = obj["parent"];
                        owner.obj["__class__"] = copy["__class__"];
                        var result = originalProp.apply(this === copy || this == window ? owner.obj : this, arguments);
                        owner.obj["__class__"] = c;
                        owner.obj["parent"] = p;
                        return result;
                    };
                    o[prop].toString = function() {
                        return originalProp.toString()
                    }
                };

                ownEach(obj, function(prop, originalProp) {
                    if (typeof originalProp === "function" && !disableStatement) {
                        argv(copy, prop, originalProp);
                    } else {
                        if (!disableStatement && originalProp && typeof originalProp === "object") {
                            if ("set" in originalProp && typeof originalProp.set === "function") {
                                argv(originalProp, 'set', originalProp.set);
                            }
                            if ("get" in originalProp && typeof originalProp.get === "function") {
                                argv(originalProp, 'get', originalProp.get);
                            }
                        }
                        copy[prop] = originalProp;
                    }
                });

                owner.obj = isParent ? owner.obj : copy;
            }

            if (!disableStatement) {
                if (isParent && constructorName in copy) {
                    copy["constructor"] = copy[constructorName];
                }

                copy["__class__"] = staticConstructor;
            }

            if (!isParent && accessors !== 0) {

                if (!VBInc) {

                    ownEach(first ? copy : accessors, function(prop, val) {

                        var
                            propType = !first ? val : prop.indexOf("$") === 0 ? 1 :
                                prop.indexOf("get ") === 0 ? 2 :
                                prop.indexOf("set ") === 0 ? 3 :
                                val && typeof val === "object" && (val.set || val.get) ? 5 : 0;

                        if (propType) {

                            if (first) {
                                accessors[prop] = propType;
                                accessorsActive++;
                            }

                            val = copy[prop];

                            if (propType === 5) {
                                emptyFunction.prototype = val;
                                val = new emptyFunction;
                            }

                            if (hasOwnProperty.call(copy, prop)) {
                                delete copy[prop];
                            }

                            var
                                nm = propType === 1 ? prop.substring(1) : propType === 5 ? prop : prop.split(" ").pop(),
                                props = {
                                    enumerable: 1,
                                    configurable: 1,
                                    set: Null,
                                    get: Null
                                };

                            if (propType !== 3) {
                                props.get = function() {
                                    return ((propType === 1 ? copy["__get"] : propType === 5 ? val.get : val) || errorFunction(nm, 0)).call(
                                        this, propType === 1 ? nm : val
                                    )
                                }
                            }

                            if (propType !== 2) {
                                props.set = function(value) {
                                    ((propType === 1 ? copy["__set"] : propType === 5 ? val.set : val) || errorFunction(nm, 1)).call(
                                        this, propType === 1 ? nm : value, propType === 1 ? value : val
                                    )
                                }
                            }

                            if (defineProperty) {

                                var descr = Object.getOwnPropertyDescriptor(copy, nm);

                                props.get = props.get || descr && descr.get || errorFunction(nm, 0);
                                props.set = props.set || descr && descr.set || errorFunction(nm, 1);

                                defineProperty(copy, nm, props);

                            } else {
                                if (propType !== 3) {
                                    copy.__defineGetter__(nm, props.get);
                                }
                                if (propType !== 2) {
                                    copy.__defineSetter__(nm, props.set);
                                }
                            }
                        }

                    }, first ? 1 : 0);

                    if (first && !(first = 0) && accessorsActive === 0) {
                        accessors = 0;
                    }

                } else if (msie) {

                    if (staticClass === False) {

                        staticClass = "StaticClass" + libID + VBInc++;

                        var
                            names = [], hasAccessors = 0,
                            parts = ["Class " + staticClass];

                        ownEach(copy, function(prop, val) {

                            var
                                propType = prop.indexOf("$") === 0 ? 1 :
                                    prop.indexOf("get ") === 0 ? 2 :
                                    prop.indexOf("set ") === 0 ? 3 :
                                    prop === "toString" ? 4 :
                                    val && typeof val === "object" && (val.set || val.get) ? 5 : 0;

                            if (propType) {

                                var
                                    nm = propType === 4 ? prop : (hasAccessors = 1) && propType === 1 ?
                                        prop.substring(1) : propType === 5 ? prop : prop.split(" ").pop();

                                accessors[prop] = propType;

                                if (propType !== 3) {
                                    parts.push(
                                        "Public " + (propType === 4 ? "Default " : "" ) + "Property Get [" + nm + "]",
                                        "Call VBCorrectVal(" + ( propType === 1 ?
                                        copy["__get"] ? "me.[__get].call(me,\"" + nm + "\")" : "" :
                                        val && ( propType !== 5 || val.get) ?
                                        "[(accessors)].[" + prop + "]" + (propType === 5 ? ".get" : "") +
                                        ".call(me,[(accessors)].[" + prop + "])" : "window.undefined" ) +
                                        ",[" + nm + "])", "End Property"
                                    );
                                }
                                if (propType !== 2) {
                                    parts.push(
                                        "Public Property Let [" + nm + "](val)",
                                        propType = (propType === 1 ?
                                        copy["__set"] ? "Call me.[__set].call(me,\"" + nm + "\",val)" : "" :
                                        (propType === 4 ? "Set [(accessors)].[" + prop + "]=val" :
                                        val && (propType !== 5 || val.set) ?
                                        "Call [(accessors)].[" + prop + "]" + (propType === 5 ? ".set" : "") +
                                        ".call(me,val,[(accessors)].[" + prop + "])" : "")) +
                                        "\nEnd Property", "Public Property Set [" + nm + "](val)", propType
                                    );
                                }
                            }

                            if (!propType) {
                                // VBScript up to 60 multiple dimensions may be declared.
                                if (names.length === 50) { // flush 50 items
                                    parts.push("Public [" + names.join("],[") + "]");
                                    names.length = 0;
                                }
                                names[names.length] = prop;
                            }

                        }, 1);

                        if (hasAccessors) {

                            parts.push(
                                (names.length ? "Public [" + names.join("],[") + "]\n" : "") + "Private [(accessors)]",
                                "Private Sub Class_Initialize()",
                                "Set [(accessors)]=" + staticClass + "FactoryJS()",
                                "End Sub",
                                "End Class",
                                "Function " + staticClass + "Factory()",
                                "Set " + staticClass + "Factory=New " + staticClass,
                                "End Function"
                            );

                            window[staticClass + "FactoryJS"] = function() {
                                return accessorsActive;
                            };

                            execVBScript(parts.join("\n"));
                        } else {
                            accessors = 0;
                            staticClass = Null;
                        }

                        names = parts = Null;
                    }

                    if (staticClass) {

                        accessorsActive = {};

                        owner.obj = window[staticClass + "Factory"]();

                        ownEach(copy, function(prop, val) {
                            if (!accessors.hasOwnProperty(prop)) {
                                if ((!_implementsLen || disableStatement) && typeof val === "function") {
                                    owner.obj[prop] = function() {
                                        return val.apply(this === copy || this == window ? owner.obj : this, arguments);
                                    };
                                    owner.obj[prop].toString = function() {
                                        return val.toString()
                                    }
                                } else {
                                    owner.obj[prop] = val;
                                }
                            } else {
                                if (accessors[prop] === 5) {
                                    emptyFunction.prototype = copy[prop];
                                    accessorsActive[prop] = new emptyFunction;
                                } else {
                                    accessorsActive[prop] = copy[prop];
                                }
                            }
                        }, 1);

                        copy = owner.obj;
                    }
                }
            }

            var subConstructor = isParent ? function() {
                return copy;
            } : function() {
                if (constructorName in copy) {
                    copy[constructorName].apply(copy, args);
                } else if (copy.constructor && copy.constructor !== Object.prototype.constructor) {
                    copy.constructor.apply(copy, args);
                }
                return copy;
            };

            return new subConstructor();
        };

        staticConstructor.toString = function() {
            return "[class " + (_class || "Object") + "]";
        };

        ownEach(_static, function(prop, val) {
            staticConstructor[prop] = val;
        });

        if (staticConstructor.className = _class) {

            var context = _context;

            argv = (_names = _class.split(".")).shift();

            do {
                if (_names.length === 0) {
                    context[constructorName = argv] = staticConstructor;
                } else {
                    if (!(argv in context)) {
                        context[argv] = {};
                    }
                    context = context[argv];
                }
            } while(argv = _names.shift());
        }

        return returnInstance ? new staticConstructor : staticConstructor;
    }

    /**
     * Ищет и возвращает класс по его имени
     *
     * @param {String} name
     * @param {Object} [context]
     * @return {Function}
     */
    Class["classByName"] = classByName = function(name, context) {

        var
            nm,
            _name = name,
            _context = context = (context || Class["defaultContext"] || Class);

        if (typeof _name === "string") {
            _name = _name.split(".");
            while((nm = _name.shift()) && (_context = _context[nm])) {}
            _name = _context;
        }

        if (!_name && arguments[2]) {
            if (!(typeof Class["autoload"] === "function" &&
                (_name = (Class["autoload"].call(context, name, arguments[2]) ||
                    classByName(name, context)))))
            {

                throw new Error("Parent class '" + name + "' not Initialized or Undefined");
            }
        }

        return _name;
    };

    /**
     * Производит итерацию элементов объекта с запуском callback функции
     *
     * @param {Object|Array} obj
     * @param {Function} callback
     * @param {Boolean} all
     */
    Class["ownEach"] = ownEach = function(obj, callback, all) {

        var idx, val, len = dontEnums.length;

        if (toString.call(obj) === "[object Array]") {

            len = obj.length;

            for(idx = 0; idx < len; idx++) {

                val = obj[idx];

                if (callback.call(obj[idx], all ? val : idx, all ? idx : val) === False) {
                    break;
                }
            }

            return;
        }

        for(idx in obj) {

            val = obj[idx];

            if (((all && val !== Object.prototype[idx]) || hasOwnProperty.call(obj, idx)) &&
                callback.call(val, idx, val) === False) {
                len = False;
                break;
            }
        }

        if (len && hasDontEnumBug) {
            for(idx = 0; idx < len; idx++) {

                val = obj[dontEnums[idx]];

                if ((hasOwnProperty.call(obj, dontEnums[idx]) ||
                    (all && val != Null && val !== Object.prototype[dontEnums[idx]])) &&
                    callback.call(val, dontEnums[idx], val) === False) {
                    break;
                }
            }
        }
    };

    /**
     * Проверяет принадлежность объекта конструктору
     *
     * @param {Object} object
     * @param {Function} constructor
     * @return {Boolean}
     */
    Class["instanceOf"] = function(object, constructor) {

        while(object && object["__class__"] != Null) {

            if (object["__class__"] === constructor) {
                return True;
            }
            object = object["parent"];
        }
        return False;
    };

    ownEach("classByName ownEach instanceOf".split(" "), function(i, name) {
        Class[name].toString = Class.toString = function() {
            return "[object Function]";
        }
    });

    if (VBInc && !("execVBscript" in window)) {
        execScript('Function execVBscript(code) ExecuteGlobal(code) End Function\n' +
            'Function VBCorrectVal(o,r) If IsObject(o) Then Set r=o Else r=o End If End Function', 'VBScript');
    }

    /**
     * Конструктор классов
     *
     * @public
     * @name Class
     * @type {Function}
     */
    window["Class"] = Class;

})(window, true, false, null);
