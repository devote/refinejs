/*
 * light.core.class.js Library for JavaScript v0.5.3
 *
 * Copyright 2012-2013, Dmitrii Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/ - https://github.com/devote
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Update: 29-01-2013
 */
(function(window, True, False, Null, undefined) {

    "use strict";

    var
        ownEach, classByName,
        libID = (new Date()).getTime(),
        toString = Object.prototype.toString,
        defineProperty = Object.defineProperty,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        msie = +(((window["eval"] && eval("/*@cc_on 1;@*/") && /msie (\d+)/i.exec(navigator.userAgent)) || [])[1] || 0),
        VBInc = (defineProperty || Object.prototype.__defineGetter__) && (!msie || msie > 8) ? 0 : 1,
        hasDontEnumBug = !({toString: 1}).propertyIsEnumerable('toString'),
        emptyFunction = function(prop, type) {
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
            props = arguments,
            constructorName,
            argsLen = props.length - 1,
            _struct = props[argsLen--] || {},
            _type = {"extends": 1, "implements": 1},
            _options = typeof props[argsLen] === "object" && props[argsLen] ? props[argsLen--] : {},
            _static = _options["statics"] || (_options["context"] || _options["extends"] ||
                _options["implements"] || _options["disableStatement"] ? {} : _options),
            _parent = typeof props[argsLen] === "function" || typeof props[argsLen-1] === "string" ? props[argsLen--] : "",
            _names = ((props[argsLen--] || "") + (typeof _parent == "string" ? " extends " + _parent : ""))
                .replace(/^[\s]+|[\s](?=\s)|[\s]+$/g, '').replace(/\s*,\s*/g, ',').split(" "),
            _context = props[argsLen--] || _options["context"] || Class["defaultContext"] || window,
            _class = !( _names[0] in _type) && _names.shift() || "",
            _subs = (argsLen = _names.shift()) in _type && (_type = _names.shift()) ? _type.split(",") : [],
            _extend = argsLen === "extends" ? (argsLen = _names.shift(), _subs.shift()) : "",
            _implement = argsLen === "implements" ? _subs.concat((_type = _names.shift()) ? _type.split(",") : []) : _subs,
            _extends = _options["extends"] || _extend || _parent,
            _mixins = _options["implements"] || _implement,
            _implements = _mixins instanceof Array ?
                (_extends && _mixins.unshift(_extends), _mixins) : _extends && [_extends, _mixins] || [_mixins],
            _implementsLen = _implements.length,
            _disableStatement = _options["disableStatement"];

        if (typeof _struct !== "function") {
            var originalStruct = _struct;
            _struct = function() {
                return originalStruct;
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
                proto = args[2] || Null,
                copy = proto || obj,
                owner = isParent ? args[0] : {obj: obj},
                disableStatement = !isParent || args[1] === undefined ? _disableStatement : args[1];

            for( ; index--; ) {

                if (typeof _implements[index] === "string") {
                    _implements[index] = classByName(_implements[index], _context, staticConstructor);
                }

                props = function() {};
                props.prototype = oParent = _implements[index].call(False, owner, disableStatement, proto);

                if (index > 0) {
                    delete props.prototype['__construct'];
                    delete props.prototype['constructor'];
                }

                copy = proto = new props();
            }

            if (!disableStatement) {
                obj["parent"] = oParent;
            }

            if (_extends || isParent) {

                props = function(o, prop, originalProp) {
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
                        props(copy, prop, originalProp);
                    } else {
                        if (!disableStatement && originalProp && typeof originalProp === "object") {
                            if ("set" in originalProp && typeof originalProp.set === "function") {
                                props(originalProp, 'set', originalProp.set);
                            }
                            if ("get" in originalProp && typeof originalProp.get === "function") {
                                props(originalProp, 'get', originalProp.get);
                            }
                        }
                        copy[prop] = originalProp;
                    }
                });

                owner.obj = isParent ? owner.obj : copy;
            }

            if (isParent && constructorName in copy) {
                copy["constructor"] = copy[constructorName];
            }

            if (!disableStatement) {
                copy["__class__"] = staticConstructor;
            }

            if (!isParent && accessors !== 0) {

                if (!VBInc) {

                    ownEach(first ? copy : accessors, function(prop, val) {

                        var
                            propType = prop.indexOf("$") === 0 ? 1 :
                                prop.indexOf("get ") === 0 ? 2 :
                                prop.indexOf("set ") === 0 ? 3 :
                                val && typeof val === "object" && (val.set || val.get) ? 5 : 0;

                        if (propType) {

                            if (first) {
                                accessors[prop] = val;
                                accessorsActive++;
                            }

                            val = copy[prop];

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
                                    return ((propType === 1 ? copy["__get"] : propType === 5 ? val.get : val) || emptyFunction(nm, 0)).call(
                                        this, propType === 1 ? nm : val
                                    )
                                }
                            }

                            if (propType & 1) {
                                props.set = function(value) {
                                    ((propType === 1 ? copy["__set"] : propType === 5 ? val.set : val) || emptyFunction(nm, 1)).call(
                                        this, propType === 1 ? nm : value, propType === 1 ? value : val
                                    )
                                }
                            }

                            if (defineProperty) {

                                var descr = Object.getOwnPropertyDescriptor(copy, nm);

                                props.get = props.get || descr && descr.get || emptyFunction(nm, 0);
                                props.set = props.set || descr && descr.set || emptyFunction(nm, 1);

                                defineProperty(copy, nm, props);

                            } else {
                                if (propType !== 3) {
                                    copy.__defineGetter__(nm, props.get);
                                }
                                if (propType & 1) {
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

                                accessors[prop] = val;

                                if (propType !== 3) {
                                    parts.push(
                                        "Public " + (propType === 4 ? "Default " : "" ) + "Property Get [" + nm + "]",
                                        "Call VBCorrectVal(" + ( propType === 1 ?
                                        copy["__get"] ? "me.[__get].call(me,\"" + nm + "\")" : "" :
                                        accessors[prop] && ( propType !== 5 || accessors[prop].get) ?
                                        "[(accessors)].[" + prop + "]" + (propType === 5 ? ".get" : "") +
                                        ".call(me,[(accessors)].[" + prop + "])" : "window.undefined" ) +
                                        ",[" + nm + "])", "End Property"
                                    );
                                }
                                if (propType & 1 || propType === 4) {
                                    parts.push(
                                        "Public Property Let [" + nm + "](val)",
                                        propType = (propType === 1 ?
                                        copy["__set"] ? "Call me.[__set].call(me,\"" + nm + "\",val)" : "" :
                                        (propType === 4 ? "Set [(accessors)].[" + prop + "]=val" :
                                        accessors[ prop ] && (propType !== 5 || accessors[ prop ].set) ?
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
                        ownEach(accessors, function(prop, val) {
                            accessorsActive[prop] = copy[prop];
                        });

                        owner.obj = window[staticClass + "Factory"]();

                        ownEach(copy, function(prop, val) {
                            if (!accessors.hasOwnProperty(prop)) {
                                if ((!_extends || disableStatement) && typeof val === "function") {
                                    owner.obj[prop] = function() {
                                        return val.apply(this === copy || this == window ? owner.obj : this, arguments);
                                    };
                                    owner.obj[prop].toString = function() {
                                        return val.toString()
                                    }
                                } else {
                                    owner.obj[prop] = val;
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
                } else if ("__construct" in copy) {
                    copy["__construct"].apply(copy, args);
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

            props = (_names = _class.split(".")).shift();

            do {
                if (_names.length === 0) {
                    context[constructorName = props] = staticConstructor;
                } else {
                    if (!(props in context)) {
                        context[props] = {};
                    }
                    context = context[props];
                }
            } while(props = _names.shift());
        }

        return staticConstructor;
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
