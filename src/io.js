const server = require( 'http' ).createServer( app );
const express = require( 'express' );
const app = express();
const socket = require( 'socket.io' );

const port = process.env.PORT || 4201;

server.listen( port, () => {
  try {
    console.clear();
  } catch ( e ) {}

  console.log( `Serving server on localhost:${port}` );
} );

export const arduino = socket( server );

export const backend = require( 'socket.io-client' ).connect( process.env.BACKEND_URL, { path: '/raspberry' } );
