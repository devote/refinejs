/*
 * core.class.js Library for JavaScript v0.3.2
 *
 * Copyright 2012, Dmitriy Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Update: 17-07-2012
 */

(function( global, True, False, Null, undefined ) {

	"use strict";

	var
		msie = eval("/*@cc_on (@_jscript_version+'').replace(/\\d\\./, '');@*/"),
		libID = ( new Date() ).getTime(),
		VBInc = ( Object.defineProperty || Object.prototype.__defineGetter__ ) && ( !msie || msie > 8 ) ? 0 : 1,
		importedModules = {},
		hasOwnProperty = Object.prototype.hasOwnProperty,
		toString = Object.prototype.toString,
		hasDontEnumBug = !( { toString: Null } ).propertyIsEnumerable( 'toString' ),
		dontEnums = [
			'toString',
			'toLocaleString',
			'valueOf',
			'hasOwnProperty',
			'isPrototypeOf',
			'propertyIsEnumerable',
			'constructor'
		],

	rootPath = (function(){

		if ( VBInc && !( "execVBscript" in window ) ) {
			execScript('Function execVBscript(code) ExecuteGlobal(code) End Function\n'+
				'Function VBCorrectVal(o,r) If IsObject(o) Then Set r=o Else r=o End If End Function', 'VBScript');
		}

		var scripts = document.getElementsByTagName( 'script' );

		return ( scripts[ scripts.length - 1 ] || { src: "/" } ).src.replace( /[^\/]+$/g, "" );
	})();

	/*
	*  Class( context, "className", parentClass, staticObject, classStructure )
	*  Class( context, "className", parentClass, classStructure )
	*  Class( context, "className", staticObject, classStructure )
	*  Class( context, "className", classStructure )
	*
	*  Class( "className", parentClass, staticObject, classStructure )
	*  Class( "className", parentClass, classStructure )
	*  Class( "className", staticObject, classStructure )
	*  Class( "className", classStructure )
	*
	*  Class( parentClass, staticObject, classStructure )
	*  Class( parentClass, classStructure )
	*  Class( staticObject, classStructure )
	*  Class( classStructure )
	*/
	function Class( context, rule, parentClass, statical, struct ) {

		var
			nm, rules = [], className,
			first = 1, accessors = [],
			staticClass = False,
			emptyFunction = function(){},
			args = arguments;

		if ( arguments.length < 3 || typeof context === "string" ||
			( typeof context === "function" && typeof rule === "object" ) ) {
			struct = statical;
			statical = parentClass;
			parentClass = rule;
			rule = context;
			context = Class;
		}

		if ( typeof rule === "string" ) {
			rules = rule.replace( /^[\s]+|[\s](?=\s)|[\s]+$/g, '' ).split( " " );
			className = rules[ 0 ] && rules[ 0 ] !== "extends" && rules.shift() || 0;
		} else {
			struct = statical;
			statical = parentClass;
			parentClass = rule;
			rule = Null;
		}

		if ( !struct ) {
			if ( !( struct = statical ) ) {
				struct = parentClass;
				parentClass = statical = Null;
			} else if ( typeof parentClass === "object" ) {
				statical = parentClass;
				parentClass = null;
			} else {
				statical = Null;
			}
		}

		if ( typeof parentClass === "string" ) {
			nm = parentClass;
		}

		if ( struct && ( nm || rules.shift() === "extends" || typeof rule === "function" ) ) {
			if ( ( nm || ( nm = rules.shift() ) ) && !( rule = context[ nm ] ) ) {
				parentClass = nm;
			} else {
				parentClass = rule;
			}
		}

		if ( typeof struct !== "function" ) {
			var originalStruct = struct;
			struct = function() {
				return originalStruct;
			}
		}

		var staticConstructor = function() {

			var
				isParent = +this === 0,
				args = arguments,
				obj = new struct(),
				copy = obj,
				owner = isParent ? args[ 0 ] : { obj: obj };

			obj.parent = Null;

			if ( parentClass ) {

				if ( typeof parentClass === "string" ) {

					if ( !( parentClass = context[ copy = parentClass ] ||
						typeof Class["autoload"] === "function" &&
						Class["autoload"].call( context, copy ) ||
						context[ copy ] ) ) {
						throw new Error( "Parent class '" + copy + "' not Initialized or Undefined" );
					}
				}

				obj.parent = parentClass.call( False, owner );

				var Fn = function(){}
				Fn.prototype = obj.parent;
				copy = new Fn();
			} else {
				copy["shared"] = {}
			}

			if ( parentClass || isParent ) {

				Class["ownEach"]( obj, function( prop, originalProp ) {
					if ( typeof originalProp === "function" ) {
						copy[ prop ] = function() {
							var p = owner.obj.parent, c = owner.obj["Class"];
							owner.obj.parent = obj.parent;
							owner.obj["Class"] = copy["Class"];
							var result = originalProp.apply( this === copy || this == global ? owner.obj : this, arguments );
							owner.obj["Class"] = c;
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

			copy["Class"] = staticConstructor;

			if ( !isParent && accessors !== 0 ) {

				if ( !VBInc ) {

					Class["ownEach"]( first ? copy : accessors, function( prop, val ) {

						var
							propType = prop.indexOf( "$" ) === 0 ? 1 :
								prop.indexOf( "get " ) === 0 ? 2 :
								prop.indexOf( "set " ) === 0 ? 3 : 0;

						if ( propType ) {

							first && ( accessors[ accessors.length ] = prop );

							var
								nm = propType === 1 ? prop.substring( 1 ) : prop.split( " " ).pop(),
								props = {
									enumerable: 1,
									configurable: 1,
									set: Null,
									get: Null
								};

							if ( propType === 1 || propType === 2 ) {
								props.get = function() {
									return (copy[propType === 1 ? "__get" : prop] || emptyFunction).call(
										this, propType === 1 ? nm : undefined
									)
								}
							}

							if ( propType === 1 || propType === 3 ) {
								props.set = function( value ) {
									(copy[propType === 1 ? "__set" : prop] || emptyFunction).call( this,
										propType === 1 ? nm : value, propType === 1 ? value : undefined
									)
								}
							}

							if ( Object.defineProperty ) {

								var descr = Object.getOwnPropertyDescriptor( copy, nm );

								props.get = props.get || descr && descr.get || emptyFunction;
								props.set = props.set || descr && descr.set || emptyFunction;

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

					}, 1 );

					if ( first && !( first = 0 ) && accessors.length === 0 ) {
						accessors = 0;
					}

				} else if ( msie ) {

					if ( staticClass === False ) {

						staticClass = "StaticClass" + libID + VBInc++;

						var
							names = [], hasAccessors = 0,
							parts = [ "Class " + staticClass ];

						Class["ownEach"]( copy, function( prop, val ) {

							var
								propType = prop.indexOf( "$" ) === 0 ? 1 :
									prop.indexOf( "get " ) === 0 ? 2 :
									prop.indexOf( "set " ) === 0 ? 3 :
									prop === "toString" ? 4 : 0;

							if ( propType ) {

								var
									nm = propType === 4 ? "(" + prop + ")" : ( hasAccessors = 1 ) &&
									propType === 1 ? prop.substring( 1 ) : prop.split( " " ).pop();

								if ( propType === 1 || propType === 2 || propType === 4 ) {
									parts.push(
										"Public " +
										( propType === 4 ? "Default " : "" ) + "Property Get [" + nm + "]",
										"Call VBCorrectVal(" +
										( propType === 1 ?
										copy["__get"] ? "me.[__get].call(me,\"" + nm + "\")" : "" :
										copy[ prop ] ? "me.[" + prop + "].call(me)" : "" ) + ",[" + nm + "])",
										"End Property"
									);
								}
								if ( propType === 1 || propType === 3 ) {
									parts.push(
										"Public Property Let [" + nm + "](val)",
										propType === 1 ?
										copy["__set"] ? "Call me.[__set].call(me,\"" + nm + "\",val)" : "" :
										copy[ prop ] ? "Call me.[" + prop + "].call(me,val)" : "",
										"End Property",
										"Public Property Set [" + nm + "](val)",
										propType === 1 ?
										copy["__set"] ? "Call me.[__set].call(me,\"" + nm + "\",val)" : "" :
										copy[ prop ] ? "Call me.[" + prop + "].call(me,val)" : "",
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
								accessors[ accessors.length ] = prop;
							}

						}, 1 );

						if ( hasAccessors ) {

							parts.push(
								"Public [" + names.join("],[") + "]",
								"End Class",
								"Function " + staticClass + "Factory()",
								"Set " + staticClass + "Factory=New " + staticClass,
								"End Function"
							);

							execVBScript( parts.join( "\n" ) );
						} else {
							accessors = 0;
							staticClass = Null;
						}

						names = parts = Null;
					}

					if ( staticClass ) {

						owner.obj = window[ staticClass + "Factory" ]();

						for( var i = accessors.length; nm = accessors[ --i ]; ) {
							owner.obj[ nm ] = copy[ nm ];
						}

						copy = owner.obj;
					}
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

		if ( statical ) {
			Class["ownEach"]( statical, function( prop ) {
				staticConstructor[ prop ] = statical[ prop ];
			});
		}

		if ( className ) {
			context[ className ] = staticConstructor;
			context[ className ].className = className;
		}

		return staticConstructor;
	}

	Class["ownEach"] = function( obj, callback, all ) {

		var idx, val, len = dontEnums.length;

		if ( toString.call( obj ) === "[object Array]" ) {

			len = obj.length;

			for( idx = 0; idx < len; idx++ ) {

				val = obj[ idx ];

				if ( callback.call( obj[ idx ], all ? val : idx, all ? idx : val ) === False ) {
					break;
				}
			}

			return;
		}

		for( idx in obj ) {

			val = obj[ idx ];

			if ( ( ( all && val !== Object.prototype[ idx ] ) || hasOwnProperty.call( obj, idx ) ) &&
					callback.call( val, idx, val ) === False ) {
				len = False;
				break;
			}
		}

		if ( len && hasDontEnumBug ) {
			for( idx = 0; idx < len; idx++ ) {

				val = obj[ dontEnums[ idx ] ];

				if ( ( hasOwnProperty.call( obj, dontEnums[ idx ] ) ||
					( all && val != Null && val !== Object.prototype[ dontEnums[ idx ] ] ) ) &&
						callback.call( val, dontEnums[ idx ], val ) === False ) {
					break;
				}
			}
		}
	}

	Class["instanceOf"] = function( object, constructor ) {

		while( object && object["Class"] != Null ) {

			if ( object["Class"] === constructor ) {
				return True;
			}
			object = object.parent;
		}
		return False;
	}

	Class["include"] = function( path, callback ) {

		path = /^(?:http\:)?\/[\/]?/i.test( path ) ? path : rootPath + path;

		if ( importedModules[ path ] ) {

			callback && callback();

			return;
		}

		var req = new XMLHttpRequest(),
		    async = !!callback;

		req.open( 'GET', path, async );
		req.onreadystatechange = function() {

			if ( req.readyState === 4 ) {

				if ( req.status >= 200 && req.status < 300 || req.status === 304 ) {

					importedModules[ path ] = 1;

					try {
						( window.execScript || function( data ) {
							window[ "eval" ].call( window, data );
						} )( req.responseText );
					} catch( _e_ ) {

						delete importedModules[ path ];

						throw new Error( 'Error executing module "' + path + '". ' + _e_ );
					}

					callback && callback();
				} else {

					throw new Error( 'Module ' + path + ' not found' );
				}
			}
		}

		req.send( Null );
	}

	Class["ownEach"].toString = Class["instanceOf"].toString = Class["include"].toString = Class.toString = function() {
		return "[object Function]";
	}

	global["Class"] = Class;

})( window, true, false, null );
