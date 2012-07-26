/*
 * core.class.js Library for JavaScript v0.4.5
 *
 * Copyright 2012, Dmitriy Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Update: 26-07-2012
 */

(function( window, True, False, Null, undefined ) {

	"use strict";

	var
		document = window.document,
		emptyFunction = function(){},
		html = document.documentElement,
		libID = ( new Date() ).getTime(),
		toString = Object.prototype.toString,
		defineProperty = Object.defineProperty,
		hasOwnProperty = Object.prototype.hasOwnProperty,
		liveScripts = document.getElementsByTagName( 'script' ),
		rootPath = ( liveScripts[ liveScripts.length - 1 ] || { src: "/" } ).src.replace( /[^\/]+$/g, "" ),
		msie = eval("/*@cc_on (@_jscript_version+'').replace(/\\d\\./, '');@*/"),
		VBInc = ( defineProperty || Object.prototype.__defineGetter__ ) && ( !msie || msie > 8 ) ? 0 : 1,
		hasDontEnumBug = !( { toString: 1 } ).propertyIsEnumerable( 'toString' ),
		ownEach, classByName, absoluteURL, importedModules = {},
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
			accessors = [],
			staticClass = False,
			args = arguments,
			argsLen = args.length - 1,
			_struct = args[ argsLen-- ] || {},
			_options = typeof args[ argsLen ] === "object" ? args[ argsLen-- ] : {},
			_static = _options["static"] || ( _options["context"] || _options["extends"] || _options["implements"] ? {} : _options ),
			_parent = typeof args[ argsLen ] === "function" || typeof args[ argsLen - 1 ] === "string" ? args[ argsLen-- ] : "",
			_names  = ( args[ argsLen-- ] || "" ).replace( /^[\s]+|[\s](?=\s)|[\s]+$/g, '' ).replace( /\s*,\s*/g, ',' ).split( " " ),
			_context = args[ argsLen-- ] || _options["context"] || Class["defaultContext"] || Class,
			_class = _names[ 0 ] !== "extends" && _names.shift() || "",
			_subs = ( _names.shift() === "extends" && _names.shift() || "" ).split( "," ),
			_extends = _options["extends"] || _parent || _subs.shift(),
			_mixins = _options["implements"] || _subs,
			_implements = _mixins instanceof Array ? _mixins : [ _mixins ],
			_implementsLen = _implements.length;

		if ( typeof _struct !== "function" ) {
			var originalStruct = _struct;
			_struct = function() {
				return originalStruct;
			}
		}

		var staticConstructor = function() {

			var
				isParent = +this === 0,
				args = arguments,
				obj = new _struct(),
				copy = obj,
				owner = isParent ? args[ 0 ] : { obj: obj };

			obj.parent = Null;

			if ( _extends ) {

				_extends = classByName( _extends, _context, staticConstructor );

				obj.parent = _extends.call( False, owner );

				var Fn = function(){}
				Fn.prototype = obj.parent;
				copy = new Fn();

			} else {
				copy["shared"] = {}
			}

			if ( _extends || isParent ) {

				ownEach( obj, function( prop, originalProp ) {
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

			for( var i = 0; i < _implementsLen; i++ ) {

				_implements[ i ] = classByName( _implements[ i ], _context, staticConstructor );

				ownEach( _implements[ i ].call( False, owner ), function( prop, value ) {
					if ( copy[ prop ] === undefined ) {
						copy[ prop ] = value;
					}
				}, 1 );
			}

			if ( !isParent && accessors !== 0 ) {

				if ( !VBInc ) {

					ownEach( first ? copy : accessors, function( prop, val ) {

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

						ownEach( copy, function( prop, val ) {

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
										propType = ( propType === 1 ?
										copy["__set"] ? "Call me.[__set].call(me,\"" + nm + "\",val)" : "" :
										copy[ prop ] ? "Call me.[" + prop + "].call(me,val)" : "" ) +
										"\nEnd Property", "Public Property Set [" + nm + "](val)", propType
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

						for( var i = accessors.length; first = accessors[ --i ]; ) {
							owner.obj[ first ] = copy[ first ];
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
			return "[class " + ( _class || "Object" ) + "]";
		}

		ownEach( _static, function( prop, val ) {
			staticConstructor[ prop ] = val;
		});

		if ( staticConstructor.className = _class ) {

			var
				context = _context,
				prop = ( _names = _class.split( "." ) ).shift();

			do {
				if ( _names.length === 0 ) {
					context[ prop ] = staticConstructor;
				} else {
					if ( !( prop in context ) ) {
						context[ prop ] = {};
					}
					context = context[ prop ];
				}
			} while( prop = _names.shift() );
		}

		return staticConstructor;
	}

	Class["classByName"] = classByName = function( name, context ) {

		var
			nm,
			_name = name,
			_context = context = (context || Class["defaultContext"] || Class);

		if ( typeof _name === "string" ) {
			_name = _name.split( "." );
			while( ( nm = _name.shift() ) && ( _context = _context[ nm ] ) ) {}
			_name = _context;
		}

		if ( !_name && arguments[ 2 ] ) {
			if ( !( typeof Class["autoload"] === "function" &&
				( _name = ( Class["autoload"].call( context, name, arguments[ 2 ] ) ||
				classByName( name, context ) ) ) ) ) {

				throw new Error( "Parent class '" + name + "' not Initialized or Undefined" );
			}
		}

		return _name;
	}

	Class["ownEach"] = ownEach = function( obj, callback, all ) {

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

	Class["absoluteURL"] = absoluteURL = (function( a ) {
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

	            html.firstChild.appendChild( script );
			}
		}

		return function( scripts, onLoad, onError, scope ) {

			scripts = ( typeof scripts === "string" ? [ scripts ] : scripts ) || [];

			var
				i = 0,
				script,
				isLocal = True,
				async = !!onLoad,
				length = scripts.length,
				queueModules = {},
				loadedScripts = isSupportPseudo_NOT ?
					document.querySelectorAll( 'script[src]:not([data-calmjs="1"])' ) : liveScripts;

			for( ; script = loadedScripts[ i++ ]; ) {

				script.setAttribute( "data-calmjs", "1" );

				if ( script = script.getAttribute( "src" ) ) {
					importedModules[ absoluteURL( script, rootPath ) ] = 1;
				}
			}

			for( ; length--; ) {

				if ( !hasLocal.test( scripts[ length ] = absoluteURL( scripts[ length ], rootPath ) ) ) {
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

	ownEach( "classByName ownEach instanceOf absoluteURL imports".split( " " ), function( i, name ) {
		Class[ name ].toString = Class.toString = function() {
			return "[object Function]";
		}
	});

	if ( VBInc && !( "execVBscript" in window ) ) {
		execScript('Function execVBscript(code) ExecuteGlobal(code) End Function\n'+
			'Function VBCorrectVal(o,r) If IsObject(o) Then Set r=o Else r=o End If End Function', 'VBScript');
	}

	window["Class"] = Class;

})( window, true, false, null );
