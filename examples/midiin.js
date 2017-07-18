var Board = require('firmata')
var keypress = require('keypress');
var MIDIUtils = require('../midi/midiutils')
var midi = require('midi');
var fs = require('fs')
// Set up a new input.
var input = new midi.input();
input.on('message', function(deltaTime, message) {
  if(message[0] == 144){
	  var note = message[1];
	  noteOn(note)
  }
});
input.openPort(1);



var board = new Board("/dev/tty.usbmodem1411");


var servos = JSON.parse(fs.readFileSync('servos.json'))
var returnSpeed = 100;



function start(){
	for(var i = 0; i < servos.length; i++){
		var servo = servos[i];
		board.pinMode(servo.pin, board.MODES.SERVO);
		board.servoWrite(servo.pin, servo.angles.center);
	}
	console.log("Started")

}


board.on("ready", start);


function reset(){
	console.log("reset")
	board.servoWrite(this.pin, this.angles.center);
	// if(this.timeout )
	// this.timeout = setTimeout((function(){
	// 	board.pinMode(this.pin, board.MODES.OUTPUT);
	// }).bind(this), returnSpeed*2);

}



function noteOn(n){
	var note = MIDIUtils.noteNumberToName(n);
	var found = false;
	for(var i = 0; i < servos.length; i++){
		var servo = servos[i];
		if(servo.tones.left == note){
			//board.pinMode(servo.pin, board.MODES.SERVO);

			board.servoWrite(servo.pin, servo.angles.left);
			setTimeout(reset.bind(servo), 100);
			found = true;
			break;
		}
		else if(servo.tones.right == note){
			//board.pinMode(servo.pin, board.MODES.SERVO);

			board.servoWrite(servo.pin, servo.angles.right);
			setTimeout(reset.bind(servo), 100);
			found = true;
			break;
		}

	}
	if(!found){

		console.log("no "+n+" "+note)

	}
}
