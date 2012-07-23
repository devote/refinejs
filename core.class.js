/*
 * core.class.js Library for JavaScript v0.4.2
 *
 * Copyright 2012, Dmitriy Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Update: 23-07-2012
 */

(function( window, True, False, Null, undefined ) {

	"use strict";

	var
		document = window.document,
		html = document.documentElement,
		libID = ( new Date() ).getTime(),
		toString = Object.prototype.toString,
		defineProperty = Object.defineProperty,
		hasOwnProperty = Object.prototype.hasOwnProperty,
		scripts = document.getElementsByTagName( 'script' ),
		rootPath = ( scripts[ scripts.length - 1 ] || { src: "/" } ).src.replace( /[^\/]+$/g, "" ),
		msie = eval("/*@cc_on (@_jscript_version+'').replace(/\\d\\./, '');@*/"),
		VBInc = ( defineProperty || Object.prototype.__defineGetter__ ) && ( !msie || msie > 8 ) ? 0 : 1,
		hasDontEnumBug = !( { toString: Null } ).propertyIsEnumerable( 'toString' ),
		importedModules = {},
		dontEnums = [
			'toString',
			'toLocaleString',
			'valueOf',
			'hasOwnProperty',
			'isPrototypeOf',
			'propertyIsEnumerable',
			'constructor'
		];

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
			nm, rules = [], className = "",
			first = 1, accessors = [],
			staticClass = False,
			emptyFunction = function(){},
			getParent = function( context, name, nm ) {
				name = name.split( "." );
				while( ( nm = name.shift() ) && ( context = context[ nm ] ) ) {}
				return context;
			};

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
			className = rules[ 0 ] && rules[ 0 ] !== "extends" && rules.shift() || "";
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
				parentClass = Null;
			} else {
				statical = Null;
			}
		}

		if ( typeof parentClass === "string" ) {
			nm = parentClass;
		}

		if ( struct && ( nm || rules.shift() === "extends" || typeof rule === "function" ) ) {
			if ( ( nm || ( nm = rules.shift() ) ) && !( rule = getParent( context, nm ) ) ) {
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

					if ( !( parentClass = getParent( context, copy = parentClass ) ||
						typeof Class["autoload"] === "function" &&
						Class["autoload"].call( context, copy ) ||
						getParent( context, copy ) ) ) {
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
							var result = originalProp.apply( this === copy || this == window ? owner.obj : this, arguments );
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

							if ( defineProperty ) {

								var descr = Object.getOwnPropertyDescriptor( copy, nm );

								props.get = props.get || descr && descr.get || emptyFunction;
								props.set = props.set || descr && descr.set || emptyFunction;

								defineProperty( copy, nm, props );

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

							// VBScript up to 60 multiple dimensions may be declared.
							if ( names.length === 50 ) { // flush 50 items
								parts.push( "Public [" + names.join("],[") + "]" );
								names.length = 0;
							}
							names[ names.length ] = prop;
							accessors[ accessors.length ] = prop;

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

		staticConstructor.className = className;

		if ( className ) {
			nm = context;
			rule = ( rules = className.split( "." ) ).shift();
			do {
				if ( rules.length === 0 ) {
					nm[ rule ] = staticConstructor;
				} else {
					if ( !( rule in nm ) ) {
						nm[ rule ] = {};
					}
					nm = nm[ rule ];
				}
			} while( rule = rules.shift() );
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

	Class["absoluteURL"] = (function( a ) {
		return function( url, root ) {

			if ( root && !/^(?:https?:)?\/[\/]?/.test( url ) ) {
				url = ( typeof root === "string" ? root : rootPath ) + url;
			}

			root = window.location;

			var
				protocol,
				pathname = root.pathname,

			// convert relative link to the absolute
			url = /^(?:[a-z]+\:)?\/\//.test( url ) ?
				url : root.protocol + "//" + root.host + (
				url.indexOf( "/" ) === 0 ? url :
				url.indexOf( "?" ) === 0 ? pathname + url :
				url.indexOf( "#" ) === 0 ? pathname + root.search + url :
				pathname.replace( /[^\/]+$/g, '' ) + url
			);

			a.href = url;

			protocol = a.protocol;
			pathname = a.pathname;

			url = ( protocol === ":" ? root.protocol : protocol ) + "//";

			// Internet Explorer adds the port number to standard protocols
			if ( ( protocol === "http:" && a.port == 80 ) ||
				( protocol === "https:" && a.port == 443 ) ) {
				url += a.hostname;
			} else {
				url += a.host;
			}

			// Internet Explorer removes the slash at the beginning the way, we need to add it back
			return url + ( pathname.indexOf( "/" ) === 0 ? pathname : "/" + pathname ) + a.search + a.hash;
		}
	})( document.createElement( "A" ) );

	Class["imports"] = (function() {

		var queue = [],
			hasLocal = new RegExp( "^((?:" + location.protocol + ")?//" + location.host + "(?:/|$)|/[^/]|(?!(?:https?:)?//))", "i" ),
			isSupportPseudo_NOT = False;

		try {
			document.querySelectorAll( 'html:not(a)' );
			isSupportPseudo_NOT = True;
		} catch( _e_ ) {}

		function throwError( status, url ) {
			if ( Class["imports"]["onerror"] ) {
				Class["imports"]["onerror"]( status, url );
			} else {
				throw new Error( status == 404 ? 'Module ' + url + ' not found' : 'Error executing module "' + url + '".' );
			}
		}

		function xhrLoad( url, async, onLoad, onError ) {

			if ( url in importedModules ) {
				return onLoad( url );
			}

			var
				noCacheURL = url + ( url.indexOf( "?" ) > 0 ? "&" : "?" ) + ( new Date() ).getTime(),
				req = new XMLHttpRequest();

			req.open( 'GET', Class["imports"]["disableCaching"] ? noCacheURL : url, async );

			req.onreadystatechange = function() {
				if ( req.readyState === 4 ) {

					var status = ( req.status === 1223 ) ? 204 :
						( req.status === 0 && ( self.location || {} ).protocol == 'file:' ) ? 200 : req.status;

					if ( status >= 200 && status < 300 || status === 304 ) {
						try {
							( window.execScript || function( data ) {
								window[ "eval" ].call( window, data );
							} )( req.responseText + ( !msie ? "\n//@ sourceURL=" + url : "" ) );
						} catch( _e_ ) {
							return onError( status, url );
						}
						onLoad( url );
					} else {
						onError( status, url );
					}
				}
			}

			req.send( Null );
		}

		function asyncLoad( data ) {

			if ( data ) {

				queue.unshift( data );

				if ( queue.length > 1 ) {
					return;
				}
			} else if ( queue.length === 0 ) {

				return;
			}

			data = queue[ 0 ];

			var
				script,
				dispatched = False,
				url = data.scripts.shift(),
				onLoad = function( url ) {

					if ( !dispatched ) {

						dispatched = True;

						importedModules[ url ] = 1;

						while( queue.length && queue[ 0 ].scripts.length === 0 ) {

							data = queue.shift();

							data.onLoad && data.onLoad.call( data.scope || Class );
						}

						asyncLoad();
					}
				},

				onError = function( status, url ) {

					if ( data.onError && data.onError.call( data.scope || Class, status, url ) ) {

						if ( queue[ 0 ].scripts.length === 0 ) {
							queue.shift();
						}

					} else {

						if ( !data.onError ) {
							throwError( status, url );
						}

						queue.shift();
					}

					asyncLoad();
				},

				cleanupScript = function( prop ) {

					if ( script ) {

						script.onload = script.onreadystatechange = script.onerror = Null;
						script.parentNode.removeChild( script );

						for( prop in script ) {
							try {
								script[ prop ] = Null;
								delete script[ prop ];
							} catch( _e_ ) {}
						}

						script = Null;
					}
				};

			if ( data.isLocal && msie && msie < 9 ) {

				// Internet Explorer < 9 fast load and execute script via XHR
				xhrLoad( url, True, onLoad, onError );

			} else if ( url in importedModules ) {

				// if the module was previously loaded
				onLoad( url );

			} else {

				// inject script
				script = document.createElement( 'script' );

				script.type = 'text/javascript';

				script.onerror = function() {
					cleanupScript();
					onError( 404, url );
				}

				if ( "onload" in script || !( "readyState" in script ) ) {
					script.onload = function() {
						cleanupScript();
						onLoad( url );
					}
				} else {
					script.onreadystatechange = function() {
						if ( this.readyState == "loaded" || this.readyState == "complete" ) {
							cleanupScript();
							onLoad( url );
						}
					}
				}

	            script.src = url + ( Class["imports"]["disableCaching"] ? ( url.indexOf( "?" ) > 0 ? "&" : "?" ) + ( new Date() ).getTime() : "" );

	            (html.firstChild || document.getElementsByTagName('head')[0]).appendChild( script );
			}
		}

		return function( scripts, onLoad, onError, scope ) {

			scripts = typeof scripts === "string" ? [ scripts ] : scripts;

			var
				i = 0,
				script,
				isLocal = True,
				async = !!onLoad,
				length = scripts.length,
				queueModules = {},
				loadedScripts = isSupportPseudo_NOT ?
					document.querySelectorAll( 'script[src]:not([data-calmjs="1"])' ) :
					document.getElementsByTagName( 'script' );

			for( ; script = loadedScripts[ i++ ]; ) {

				script.setAttribute( "data-calmjs", "1" );

				if ( script = script.getAttribute( "src" ) ) {
					importedModules[ Class["absoluteURL"]( script, rootPath ) ] = 1;
				}
			}

			for( ; length--; ) {

				if ( !hasLocal.test( scripts[ length ] = Class["absoluteURL"]( scripts[ length ], rootPath ) ) ) {
					isLocal = False;
				}

				if ( scripts[ length ] in importedModules || scripts[ length ] in queueModules ) {
					scripts.splice( length, 1 );
				} else {
					queueModules[ scripts[ length ] ] = 1;
				}
			}

			if ( scripts.length === 0 ) {
				return onLoad && onLoad.call( scope || Class );
			}

			if ( isLocal && !async ) {

				// synchronous loading
				while( script = scripts.shift() ) {

					xhrLoad( script, False, function( url ) {

						importedModules[ url ] = 1;

						isLocal = False;

					}, function( status, url ) {

						if ( onError && onError.call( scope || Class, status, url ) ) {
							isLocal = False;
						} else if ( !onError ) {
							throwError( status, url );
						}
					});

					if ( isLocal ) {
						return;
					}

					isLocal = True;
				}

				return onLoad && onLoad.call( scope || Class );

			} else {

				// asynchronous loading
				asyncLoad({
					scope: scope || Class,
					isLocal: isLocal,
					scripts: scripts,
					onLoad: onLoad || Null,
					onError: onError || Null
				});
			}
		}
	})();

	Class["ownEach"].toString = Class["instanceOf"].toString = Class["absoluteURL"].toString = Class["imports"].toString = Class.toString = function() {
		return "[object Function]";
	}

	if ( VBInc && !( "execVBscript" in window ) ) {
		execScript('Function execVBscript(code) ExecuteGlobal(code) End Function\n'+
			'Function VBCorrectVal(o,r) If IsObject(o) Then Set r=o Else r=o End If End Function', 'VBScript');
	}

	window["Class"] = Class;

})( window, true, false, null );
