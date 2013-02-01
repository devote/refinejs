/*
 * simple.core.class.js Cross-Browser Accessors for JavaScript v0.5.5.3
 *
 * Copyright 2012-2013, Dmitrii Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/ - https://github.com/devote
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Update: 01-02-2013
 */
(function(window, True, False, Null, undefined) {

    "use strict";

    var
        libID = (new Date()).getTime(),
        toString = Object.prototype.toString,
        defineProperty = Object.defineProperty,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        msie = +(((window["eval"] && eval("/*@cc_on 1;@*/") && /msie (\d+)/i.exec(navigator.userAgent)) || [])[1] || 0),
        VBInc = (defineProperty || Object.prototype.__defineGetter__) && (!msie || msie > 8) ? 0 : 1,
        hasDontEnumBug = !({toString: 1}).propertyIsEnumerable('toString'),
        emptyFunction = function() {},
        dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ];

    /**
     * @namespace Class
     */
    function Class() {

        var
            first = 1,
            accessors = {},
            accessorsActive = 0,
            staticClass = False,
            props = arguments,
            args = props.length - 1,
            _struct = props[args--] || {},
            returnInstance = this instanceof Class,
            _static = typeof props[args] === "object" && props[args] ? props[args--] : {},
            _class = (props[args--] || "").replace(/^[\s]+|[\s](?=\s)|[\s]+$/g, ''),
            _context = props[args--] || window;

        if (typeof _struct !== "function") {
            var originalStruct = _struct;
            _struct = function() {
                return originalStruct;
            }
        }

        /** @ignore */
        var staticConstructor = function() {

            var
                args = arguments,
                obj = new _struct(),
                copy = obj,
                owner = {obj: obj};

            if (accessors !== 0) {

                if (!VBInc) {

                    ownEach(first ? copy : accessors, function(prop, val) {

                        if (val && typeof val === "object" && (val.set || val.get)) {

                            if (first) {
                                accessors[prop] = val;
                                accessorsActive++;
                            }

                            val = copy[prop];

                            if (hasOwnProperty.call(copy, prop)) {
                                delete copy[prop];
                            }

                            var props = {
                                enumerable: 1,
                                configurable: 1,
                                set: function(value){
                                    (val.set || emptyFunction).call(this, value, val);
                                },
                                get: function(){
                                    return (val.get || emptyFunction).call(this, val);
                                }
                            };

                            if (defineProperty) {
                                defineProperty(copy, prop, props);
                            } else {
                                copy.__defineGetter__(prop, props.get);
                                copy.__defineSetter__(prop, props.set);
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
                                propType = prop === "toString" ? 4 :
                                    val && typeof val === "object" && (val.set || val.get) ? 5 : 0;

                            if (propType) {

                                var nm = propType === 4 ? prop : (hasAccessors = 1) && prop;

                                accessors[prop] = val;

                                parts.push(
                                    "Public " + (propType === 4 ? "Default " : "" ) + "Property Get [" + nm + "]",
                                    "Call VBCorrectVal(" + (accessors[prop] && (propType !== 5 ||
                                    accessors[prop].get) ? "[(accessors)].[" + prop + "]" +
                                    (propType === 5 ? ".get" : "") + ".call(me,[(accessors)].[" + prop + "])" :
                                    "window.undefined" ) + ",[" + nm + "])", "End Property"
                                );

                                parts.push(
                                    "Public Property Let [" + nm + "](val)",
                                    propType = (propType === 4 ? "Set [(accessors)].[" + prop + "]=val" :
                                    accessors[ prop ] && (propType !== 5 || accessors[ prop ].set) ?
                                    "Call [(accessors)].[" + prop + "]" + (propType === 5 ? ".set" : "") +
                                    ".call(me,val,[(accessors)].[" + prop + "])" : "") +
                                    "\nEnd Property", "Public Property Set [" + nm + "](val)", propType
                                );
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
                                if (typeof val === "function") {
                                    owner.obj[prop] = function() {
                                        return val.apply(this === copy || this == window ? owner.obj : this, arguments);
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

            var subConstructor = function() {
                if (copy.constructor && copy.constructor !== Object.prototype.constructor) {
                    copy.constructor.apply(copy, args);
                }
                return copy;
            };

            return new subConstructor();
        };

        staticConstructor.toString = function() {
            return toString.toString().replace(/toString/, _class || "Unnamed");
        };

        ownEach(_static, function(prop, val) {
            staticConstructor[prop] = val;
        });

        if (_class) {

            var context = _context;

            props = (args = _class.split(".")).shift();

            do {
                if (args.length === 0) {
                    context[props] = staticConstructor;
                } else {
                    if (!(props in context)) {
                        context[props] = {};
                    }
                    context = context[props];
                }
            } while(props = args.shift());
        }

        return returnInstance ? new staticConstructor : staticConstructor;
    }

    function ownEach(obj, callback, all) {

        var idx, val, len = dontEnums.length;

        for(idx in obj) {

            val = obj[idx];

            if ((all && val !== Object.prototype[idx]) || hasOwnProperty.call(obj, idx)) {
                callback.call(val, idx, val);
            }
        }

        if (len && hasDontEnumBug) {
            for(idx = 0; idx < len; idx++) {

                val = obj[dontEnums[idx]];

                if (hasOwnProperty.call(obj, dontEnums[idx]) ||
                    (all && val != Null && val !== Object.prototype[dontEnums[idx]])) {
                    callback.call(val, dontEnums[idx], val);
                }
            }
        }
    };

    Class.toString = function() {
        return "[object Function]";
    }

    if (VBInc && !("execVBscript" in window)) {
        execScript('Function execVBscript(code) ExecuteGlobal(code) End Function\n' +
            'Function VBCorrectVal(o,r) If IsObject(o) Then Set r=o Else r=o End If End Function', 'VBScript');
    }

    window["Class"] = Class;

})(window, true, false, null);
