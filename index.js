const backend = require('socket.io-client').connect('https://mathrobot.herokuapp.com/')
const app = require('express')();
const http = require('http').Server(app);
const socket = require('socket.io')(http);
const NodeWebcam = require( "node-webcam" );
const getDate = () => {
  const d = new Date
  return `${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}_${d.getDate()}-${d.getMonth()}-${d.getFullYear()}`
}

let equation = []
let currentProcessedCharacterIndex = -1

backend.on('connect', () => {
  console.log('connected to the server')
});

backend.on('equation incoming', eq => {
	if(equation) {
		backend.emit('error', 'Robot is already processing one equation')
		return
	}

	equation = eq
	startProccesingEquation()
})

const eqationMap = require('./buttonsLocationMap.js')

let arduino;


io.on('connection', socket =>{
  arduino = socket

  arduino.on('clicked', ()=>{
    clickNext(arduino)
  })

  arduino.on('end', resultImg => {
      NodeWebcam.capture( `imgs/${getDate()}`, {callbackReturn: "base64"}, ( err, data ) =>
        backend.emit('equation calculated', resultImg)
      );
  })
})


function startProccesingEquation() {
  if(!arduino) {
    console.log('arduino not connected')
    return;
  }

  currentProcessedCharacterIndex = 0;
  arduino.emit('click', eqationMap[equation[0]])
}


function clickNext() {
  arduino.emit('click', eqationMap[equation[++currentProcessedCharacterIndex]])
}
