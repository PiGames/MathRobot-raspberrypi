import { backend, arduino } from './io.js';
import NodeWebcam from 'node-webcam';
import img from './img';

let currentEquation;
let uno;
let equationQueue;
let equationQueueHumanReadable;
let currentEquationStep;

const getDate = () => {
  const d = new Date;
  return `${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}_${d.getDate()}-${d.getMonth()}-${d.getFullYear()}`;
};

const click = () => {
  backend.emit( 'robot step', `Reaching to ${ equationQueueHumanReadable[ currentEquationStep ] }` );
  console.log( 'Emitted click on', equationQueue[ currentEquationStep ] );
  uno.emit( 'click', equationQueue[ currentEquationStep ] );
};

const createEquationQueue = () => {
  equationQueue = [ { x: 0, y: 0 }, { x: 10, y: 10 } ];
  equationQueueHumanReadable = [ '1', '2' ];
  currentEquationStep = 0;
};

const takePhoto = ( cb ) => {
  NodeWebcam.capture( `imgs/${getDate()}`, { callbackReturn: 'base64', sleep: 20 }, ( err, data ) => {
    console.log( data );
    if ( err ) {
      console.error( err );

      cb( img );
      return;
    }

    cb( data );
  } );
};

backend.on( 'connect', () => {
  console.log( 'Raspberry connected to backend' );
} );

backend.on( 'evaluate equation', ( equation ) => {
  if ( currentEquation ) {
    return backend.emit( 'evaluate error', 'Robot is already processing an equation' );
  }

  currentEquation = equation;
  console.log( 'Evaluating ', currentEquation );

  createEquationQueue();
  click();

  uno.emit( 'evaluate equation', currentEquation );
} );

arduino.on( 'connection', ( unoClient ) => {
  console.log( 'Arduino connected' );
  uno = unoClient;

  uno.on( 'clicked', () => {
    currentEquationStep++;
    if ( currentEquationStep < equationQueue.length ) {
      click();
    } else {
      takePhoto( ( img ) => {
        backend.emit( 'robot done', { img } );
        currentEquation = null;
      } );
    }
  } );
} );
