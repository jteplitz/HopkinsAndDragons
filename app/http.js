(function() {
  "use strict";

  var https = require('https'),
      http  = require('http'),
      qs    = require('querystring'),
      _     = require('underscore');

  var formatters = {
    json : function json_formatter( str ) { return JSON.parse( str ) }
  };

  //options is host:, port:?, path:, method:
  var request = function http_request( options, data, retformat, cb) {
    var transport = options.scheme === 'https' ? https : http,
        postdata;

    if(      data && _.isString( data ) ) { postdata = data }
    else if( data && _.isObject( data ) ) { postdata = qs.stringify(data) }

    var req = transport.request(
      options,
      function( res ) {
        var chunks = [],
            errmsg;
        res.on( 'data', function( chunk ) { chunks.push( chunk ) } );
        res.on( 'end', function() {
          if( res.statusCode !== 200 ) {
            errmsg = 'Request failed with error (' + res.statusCode + ')';
            return cb( new Error( errmsg ) );
          }

          if( retformat && formatters.hasOwnProperty( retformat ) ) {
            var jsonobj, jsonstr;
            try {
              jsonstr = chunks.join('');
              jsonobj = formatters[ retformat ]( jsonstr );
            }
            catch( e ) {
              errmsg = "Failed to format as " + retformat + ": " + e;
              return cb( new Error( errmsg ) );
            }

            cb( null, jsonobj );
          }
          else {
            cb( null, chunks.join('') );
          }
        });
      }
    );

    req.on( 'error', cb );
    if( postdata ) {
      req.setHeader( 'Content-Length', postdata.length );
      req.setHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
      req.write( postdata );
    }
    req.end();
  };

  exports.request = request;
}());
