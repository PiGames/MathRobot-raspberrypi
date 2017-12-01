const backend = require('socket.io-client').connect('http://localhost:4200', {path:'/raspberry'})
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const NodeWebcam = require( "node-webcam" );
const getDate = () => {
  const d = new Date
  return `${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}_${d.getDate()}-${d.getMonth()}-${d.getFullYear()}`
}

let equation
let currentProcessedCharacterIndex = -1

backend.on('connect', () => {console.log('connected')});

backend.on('equation incoming', eq => {
  console.log(eq, 'just got equation')
  
	if(equation) {
		backend.emit('error', 'Robot is already processing one equation')
		return
	}
	equation = []
	startProccesingEquation()
})

const eqationMap = require('./buttonsLocationMap.js')

let arduino;


io.on('connection', socket =>{
  arduino = socket

  arduino.on('clicked', ()=>{
    // TODO uncomment and delete the copy from startProcessingEquation after setting up arduino

    // if(currentProcessedCharacterIndex === equation.length - 1){
    //   NodeWebcam.capture( `imgs/${getDate()}`, {callbackReturn: "base64", sleep: 20}, ( err, data ) =>{
    //   if(err) {
    //     console.log(err)
    //     return
    //   }
    //   backend.emit('equation calculated', data)
    // });
    // }
    clickNext(arduino)
  })
})


function startProccesingEquation() {
  if(currentProcessedCharacterIndex === equation.length - 1){
    console.log('take a pic')
    NodeWebcam.capture( `imgs/${getDate()}`, {callbackReturn: "base64", sleep: 20}, ( err, data ) =>{
    if(err) {
      console.log(err)
      return
    }
    console.log('pic sent ')
    backend.emit('equation calculated', data)
  });
  }
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
