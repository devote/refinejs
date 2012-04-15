/*
 * class.core.js Library for JavaScript v0.2.1
 *
 * Copyright 2012, Dmitriy Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Update: 15-04-2012
 */

(function( global, undefined ) {

	"use strict";

	var msie = eval("/*@cc_on (@_jscript_version+'').replace(/\\d\\./, '');@*/"),
		libID = ( new Date() ).getTime(),
		VBInc = ( Object.defineProperty || Object.prototype.__defineGetter__ ) && ( !msie || msie > 8 ) ? 0 : 1,
		hasOwnProperty = Object.prototype.hasOwnProperty,
		hasDontEnumBug = !( { toString: null } ).propertyIsEnumerable( 'toString' ),
		dontEnums = [
			'toString',
			'toLocaleString',
			'valueOf',
			'hasOwnProperty',
			'isPrototypeOf',
			'propertyIsEnumerable',
			'constructor'
		];

	if ( VBInc && !( "execVBscript" in window ) ) {
		execScript('Function execVBscript(code) ExecuteGlobal(code) End Function\n'+
			'Function VBCorrectVal(o,r) If IsObject(o) Then Set r=o Else r=o End If End Function', 'VBScript');
	}

	function Class( context, rule, parentClass, struct ) {

		var nm, rules, className;

		if ( arguments.length < 3 || typeof context === "string" ) {
			struct = parentClass;
			parentClass = rule;
			rule = context;
			context = Class;
		}

		rules = typeof rule === "string" ? rule.replace( /^[\s]+|[\s](?=\s)|[\s]+$/g, '' ).split( " " ) : [];
		className = rules[ 0 ] && rules[ 0 ] !== "extends" && rules.shift() || false;

		if ( !struct ) {
			struct = parentClass;
			parentClass = null;
		} else if ( typeof parentClass === "string" ) {
			nm = parentClass;
		}

		if ( struct && ( nm || rules.shift() === "extends" || typeof rule === "function" ) ) {
			if ( ( nm || ( nm = rules.shift() ) ) && !( rule = context[ nm ] ) ) {
				throw new Error( "Parent class '" + nm + "' not Initialized or Undefined" );
			}
			parentClass = rule;
		}

		if ( typeof ( struct = struct || rule ) !== "function" ) {
			var originalStruct = struct;
			struct = function() {
				return originalStruct;
			}
		}

		var staticConstructor = function() {

			var isParent = +this === 0,
				args = arguments,
				obj = new struct(),
				copy = obj,
				owner = isParent ? args[ 0 ] : { obj: obj };

			obj.parent = null;

			if ( parentClass ) {

				obj.parent = parentClass.call( false, owner );

				var Fn = function(){}
				Fn.prototype = obj.parent;
				copy = new Fn();
			} else {
				copy.shared = {}
			}

			if ( parentClass || isParent ) {

				Class.ownEach( obj, function( prop, originalProp ) {
					if ( typeof originalProp === "function" ) {
						copy[ prop ] = function() {
							var p = owner.obj.parent;
							owner.obj.parent = obj.parent;
							var result = originalProp.apply( owner.obj, arguments );
							owner.obj.parent = p;
							return result;
						}
						copy[ prop ].toString = function(){ return originalProp.toString() }
					} else {
						copy[ prop ] = originalProp;
					}
				});

				owner.obj = isParent ? owner.obj : copy;
			}

			copy.static = staticConstructor;

			if ( !isParent ) {

				if ( !VBInc ) {

					Class.ownEach( copy, function( prop, val ) {

						var propType = prop.indexOf( "$" ) === 0 ? 1 :
								prop.indexOf( "get " ) === 0 ? 2 :
								prop.indexOf( "set " ) === 0 ? 3 : 0;

						if ( propType ) {

							var nm = propType === 1 ? prop.substring( 1 ) : prop.split( " " ).pop(),
								props = {
									enumerable: 1,
									configurable: 1,
									set: null,
									get: null
								};

							if ( propType === 1 || propType === 2 ) {
								props.get = function() {
									return (copy[propType === 1 ? "__get" : prop] || function(){})(
										propType === 1 ? nm : undefined
									)
								}
							}

							if ( propType === 1 || propType === 3 ) {
								props.set = function( value ) {
									(copy[propType === 1 ? "__set" : prop] || function(){})(
										propType === 1 ? nm : value, propType === 1 ? value : undefined
									)
								}
							}

							if ( Object.defineProperty ) {

								var descr = Object.getOwnPropertyDescriptor( copy, nm );

								props.get = props.get || descr && descr.get || function(){};
								props.set = props.set || descr && descr.set || function(){};

								Object.defineProperty( copy, nm, props );

							} else {
								if ( propType === 1 || propType === 2 ) {
									copy.__defineGetter__( nm, props.get );
								}
								if ( propType === 1 || propType === 3 ) {
									copy.__defineSetter__( nm, props.set );
								}
							}
						}

					}, true );

				} else if ( msie ) {

					var staticClass = "StaticClass" + libID + VBInc++,
						parts = [ "Class " + staticClass ],
						props = [], names = [], propType, nm,
						hasAccessors = false;

					Class.ownEach( copy, function( prop, val ) {

						propType = prop.indexOf( "$" ) === 0 ? 1 :
								prop.indexOf( "get " ) === 0 ? 2 :
								prop.indexOf( "set " ) === 0 ? 3 :
								prop === "toString" ? 4 : 0;

						if ( propType ) {

							hasAccessors = true;

							nm = propType === 4 ? "(" + prop + ")" :
								propType === 1 ? prop.substring( 1 ) : prop.split( " " ).pop();

							if ( propType === 1 || propType === 2 || propType === 4 ) {
								parts.push(
									"Public " +
									( propType === 4 ? "Default " : "" ) + "Property Get [" + nm + "]",
									"Call VBCorrectVal(" +
									( propType === 1 ?
									copy.__get ? "me.[__get].call( me, \"" + nm + "\" )" : "" :
									copy[ prop ] ? "me.[" + prop + "].call( me )" : "" ) + ", [" + nm + "])",
									"End Property"
								);
							}
							if ( propType === 1 || propType === 3 ) {
								parts.push(
									"Public Property Let [" + nm + "]( val )",
									propType === 1 ?
									copy.__set ? "Call me.[__set].call( me, \"" + nm + "\", val )" : "" :
									copy[ prop ] ? "Call me.[" + prop + "].call( me, val )" : "",
									"End Property",
									"Public Property Set [" + nm + "]( val )",
									propType === 1 ?
									copy.__set ? "Call me.[__set].call( me, \"" + nm + "\", val )" : "" :
									copy[ prop ] ? "Call me.[" + prop + "].call( me, val )" : "",
									"End Property"
								);
							}
						}

						if ( !propType || propType > 1 ) {
							// VBScript up to 60 multiple dimensions may be declared.
							if ( names.length === 50 ) { // flush 50 items
								parts.push( "Public [" + names.join("],[") + "]" );
								names.length = 0;
							}
							names[ names.length ] = prop;
							props[ props.length ] = prop;
						}

					}, true );

					if ( hasAccessors ) {

						parts.push(
							"Public [" + names.join("],[") + "]",
							"End Class",
							"Function " + staticClass + "Factory()",
							"Set " + staticClass + "Factory=New " + staticClass,
							"End Function"
						);

						execVBScript( parts.join( "\n" ) );

						staticClass = window[ staticClass + "Factory" ]();

						for( var i = 0; parts = props[ i++ ]; ) {
							staticClass[ parts ] = copy[ parts ];
						}

						owner.obj = copy = staticClass;
					}

					props = parts = names = staticClass = null;
				}
			}

			var subConstructor = isParent ? function() {
				return copy;
			} : function() {
				if ( copy.constructor && copy.constructor !== Object.prototype.constructor ) {
					copy.constructor.apply( copy, args );
				}
				return copy;
			}

			return new subConstructor();
		}

		staticConstructor.toString = function() {
			return "[class " + ( className || "Object" ) + "]";
		}

		if ( className ) {
			context[ className ] = staticConstructor;
			context[ className ].className = className;
		}

		return staticConstructor;
	}

	Class.ownEach = function( obj, callback, all ) {

		var idx, val, len = dontEnums.length;

		for( idx in obj ) {

			val = obj[ idx ];

			if ( ( ( all && val !== Object.prototype[ idx ] ) || hasOwnProperty.call( obj, idx ) ) &&
					callback.call( val, idx, val ) === false ) {
				len = false;
				break;
			}
		}

		if ( len && hasDontEnumBug ) {
			for( idx = 0; idx < len; idx++ ) {

				val = obj[ dontEnums[ idx ] ];

				if ( ( hasOwnProperty.call( obj, dontEnums[ idx ] ) ||
					( all && val != null && val !== Object.prototype[ dontEnums[ idx ] ] ) ) &&
						callback.call( val, dontEnums[ idx ], val ) === false ) {
					break;
				}
			}
		}
	}

	Class.instanceOf = function( object, constructor ) {

		while( object && object.static != null ) {

			if ( object.static === constructor ) {
				return true;
			}
			object = object.parent;
		}
		return false;
	}

	Class.toString = function() {
		return "[object Function]";
	}

	Class.msie = msie;

	global.Class = Class;

})( this || window );
