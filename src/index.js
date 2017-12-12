const { JSDOM } = require( 'jsdom' );
import cmd from 'node-cmd';
import { parser } from 'mathrobot-parser';

import { backend, arduino } from './io.js';
import img from './img';
import buttonsMap from './buttonsLocationMap.js';

let currentEquation;
let uno;
let equationQueue;
let equationQueueHumanReadable;
let currentEquationStep;
let lastTimeClicked = Date.now();
let isArduinoDead = true;

const getDate = () => {
  const d = new Date;
  return `${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}_${d.getDate()}-${d.getMonth()}-${d.getFullYear()}`;
};

const click = () => {
  console.log( 'click' );
  backend.emit( 'robot step', equationQueueHumanReadable[ currentEquationStep ] );
  console.log( 'Emitted click on', equationQueue[ currentEquationStep ] );
  uno.emit( 'click', equationQueue[ currentEquationStep ] );
};

const createEquationQueue = () => {
  console.log( 'create' );
  const { document } = ( new JSDOM( currentEquation ) ).window;
  const mathml = document.querySelector( 'math' );
  let parsed = false;
  try {
    parsed = parser( mathml );
    console.log( parsed );
  } catch ( e ) {
    console.log( 'Parsing failed', e );
  }

  if ( !parsed ) {
    return;
  }

  equationQueue = parsed.map( btn => buttonsMap[ btn.toString() ] );
  equationQueueHumanReadable = parsed.map( btn => `Reaching to ”${btn.toString()}”` );

  equationQueue = [
    ...equationQueue,
    buttonsMap[ '=' ],
  ];

  equationQueueHumanReadable = [
    ...equationQueueHumanReadable,
    'Reaching to ’=’',
  ];

  if ( lastTimeClicked + 1000 * 60 * 5 < Date.now() ) {
    equationQueueHumanReadable = [
      'Turning calculator on',
      ...equationQueueHumanReadable,
    ];

    equationQueue = [
      buttonsMap[ 'on' ],
      ...equationQueue,
    ];
  } else {
    equationQueueHumanReadable = [
      'Clearing...',
      ...equationQueueHumanReadable,
    ];

    equationQueue = [
      buttonsMap[ 'ac' ],
      ...equationQueue,
    ];
  }

  currentEquationStep = 0;
};

const turnOff = () => {

};

const takePhoto = ( cb ) => {
  backend.emit( 'robot step', 'Taking photo...' );
  cmd.get(
    'echo $(fswebcam -d /dev/video0 -F 20 --no-banner - | base64)',
    function( err, data, stderr ) {
      const img = `data:image/jpeg;base64,${data}`;
      cb( img );
    }
  );
};

backend.on( 'connect', () => {
  console.log( 'Raspberry connected to backend' );
  if ( isArduinoDead ) {
    console.log( 'arduino is dead' );
    isArduinoDead = true;
    backend.emit( 'rpi is dead' );
  }
} );

backend.on( 'evaluate equation', ( equation ) => {
  // if ( currentEquation ) {
  //   return backend.emit( 'evaluate error', 'Robot is already processing an equation' );
  // }

  currentEquation = equation;
  console.log( 'Evaluating ', currentEquation );

  createEquationQueue();
  click();

  uno.emit( 'evaluate equation', currentEquation );
} );

arduino.on( 'connection', ( unoClient ) => {
  isArduinoDead = false;
  backend.emit( 'rpi is alive' );

  console.log( 'Arduino connected' );
  uno = unoClient;

  uno.on( 'clicked', () => {
    console.log( 'Robot clicked on', equationQueue[ currentEquationStep ] );
    currentEquationStep++;
    if ( currentEquationStep < equationQueue.length ) {
      click();
    } else {
      uno.emit( 'take photo', buttonsMap[ 'camera' ] );
    }
  } );

  uno.on( 'photo taken', () => {
    takePhoto( ( img ) => {
      console.log( 'Robot evaluated', currentEquation );
      backend.emit( 'robot done', { img } );
      currentEquation = null;

      lastTimeClicked = Date.now();
    } );
  } );

  uno.on( 'disconnect', () => {
    backend.emit( 'arduino error' );

    if ( Object.keys( arduino.sockets.clients().connected ).length === 0 ) {
      console.log( 'arduino is dead' );
      isArduinoDead = true;
      backend.emit( 'rpi is dead' );
    }
  } );
} );
