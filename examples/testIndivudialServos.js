var Board = require('firmata')
var keypress = require('keypress');
var MIDIUtils = require('../midi/midiutils')
var midi = require('midi');
var output = new midi.output();
output.openPort(0);
var fs = require('fs')

var board = new Board("/dev/tty.usbmodem1421");

var servos = JSON.parse(fs.readFileSync('servos.json'))
var returnSpeed = 100;


// g b d f#
// d b c# f#
//


//1: g b               b
//2:   d    a       a  d
//3:   f# D f#      f# f#
//4:        c#   F# C#
//
//

var testServo = 0;
var testDirection = 'left';

function start(){
	for(var i = 0; i < servos.length; i++){
		var servo = servos[i];
		board.pinMode(servo.pin, board.MODES.SERVO);
		board.servoWrite(servo.pin, servo.angles.center);
	}
	console.log("Started")

}


function tab(){
	if(testDirection == 'right'){
		testServo++;
		if(testServo == servos.length) testServo = 0;
		testDirection = 'left';
	}else{
		testDirection = 'right';
	}
	test();
}

function test(){
	var servo = servos[testServo];
	board.servoWrite(servo.pin, servo.angles[testDirection]);
	hearNote(MIDIUtils.noteNameToNoteNumber(servo.tones[testDirection]))
	setTimeout(function(){
		board.servoWrite(servo.pin, servo.angles.center);

	}, returnSpeed);
	console.log(servo)
}

function reset(i){
	var servo = servos[i];
	board.servoWrite(servo.pin, servo.angles.center);
}
function up(){
	servos[testServo].angles[testDirection] += 1;
	console.log(servos[testServo].angles[testDirection])
}
function down(){
		servos[testServo].angles[testDirection] -= 1;
	console.log(servos[testServo].angles[testDirection])
}
board.on("ready", start);


keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
	if (key && key.ctrl && key.name == 'c') {
	  return process.exit()
	}
	if(!'name' in key) return;
  if(key.name == 'space'){
	 test();
  }if(key.name == 'up'){
	  up();
  }
  if(key.name == 'down'){
	  down();
  }
  if(key.name == 'tab'){
	  tab();
  }
  if(key.name == 'return'){
	  fs.writeFileSync('servos.json', JSON.stringify(servos));
	  console.log("SAVING");
  }
  });




process.stdin.setRawMode(true);
process.stdin.resume();


function hearNote(n){
	n+=12;
	noteOn(n);
	setTimeout((function(){
		noteOff(this.note)
	}).bind({note: n}), 500);
}

function noteOn(n){
	output.sendMessage([0x90,n,127]);
}
function noteOff(n){
	output.sendMessage([0x80,n,127]);
}
