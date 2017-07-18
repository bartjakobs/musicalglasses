var Board = require('firmata')
var keypress = require('keypress');
var MIDIUtils = require('../midi/midiutils')
var MIDI = require('midi');

var fs = require('fs');
var midiConverter = require('midi-converter');
var midiData = fs.readFileSync('./tetris.mid', 'binary');
var midi = midiConverter.midiToJson(midiData);

var output = new MIDI.output();
output.openPort(0);

var board = new Board("/dev/tty.usbmodem1421");


var servos = JSON.parse(fs.readFileSync('servos.json'))
var returnSpeed = 100;


var testServo = 0;
var testDirection = 'left';

function start(){
	for(var i = 0; i < servos.length; i++){
		var servo = servos[i];
		board.pinMode(servo.pin, board.MODES.SERVO);
		board.servoWrite(servo.pin, servo.angles.center);
	}
	setTimeout(play, 1000);
}


board.on("ready", start);


keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
	if (key && key.ctrl && key.name == 'c') {
	  return process.exit()
	}

});

process.stdin.setRawMode(true);
process.stdin.resume();

var ticksPerBeat = midi.header.ticksPerBeat;
var track = midi.tracks[0];
var timeSignature = {
	"numerator": 4,
	"denominator": 4,
	"metronome": 24,
	"thirtyseconds": 8
};
var microsecondsPerBeat = 600000;
var index = 0;
var startTime
var i = 0;

function deltaTimeToMs(deltaTime){
	var oneMinuteInMicroseconds = 60000000;
	var BPM = ( oneMinuteInMicroseconds / microsecondsPerBeat ) * ( timeSignature.denominator / timeSignature.numerator );
	var secondsPerQuarterNote = microsecondsPerBeat / 1000000;
	var secondsPerTick = secondsPerQuarterNote / midi.header.ticksPerBeat;
	return deltaTime * secondsPerTick * 1000;
}

function play(){
	startTime = new Date
	nextMessages();
}

var nextEventTime;
function nextMessages(){
	var message = track[index]
	sendMessage(message);
	index++;
	setTimeout(nextMessages, deltaTimeToMs(track[index].deltaTime))

	return
}


function sendMessage(m){
	if(m.type == 'meta' && m.subtype == 'setTempo'){
		tempo = m.microsecondsPerBeat;
		return
	}
	if(m.type == 'meta' && m.subtyupe == 'timeSignature'){
		signature = m;
		return;
	}
	if(m.subtype == 'noteOn'){
		noteOn(m.noteNumber-12)
		console.log("noteOn")
	}
	if(m.subtype == 'noteOff'){
		//noteOff(m.noteNumber)
		//console.log("noteOff")
	}
}






function reset(){
	console.log("reset")
	board.servoWrite(this.pin, this.angles.center);
	// setTimeout((function(){
	// 	board.pinMode(this.pin, board.MODES.OUTPUT);
	// }).bind(this), 150);

}



function noteOn(n){
	var note = MIDIUtils.noteNumberToName(n);
	var found = false;
	for(var i = 0; i < servos.length; i++){
		var servo = servos[i];
		if(servo.tones.left == note){
			board.pinMode(servo.pin, board.MODES.SERVO);



			board.servoWrite(servo.pin, servo.angles.left);
			setTimeout(reset.bind(servo), 100);
			found = true;
			break;
		}
		else if(servo.tones.right == note){
			board.pinMode(servo.pin, board.MODES.SERVO);

			board.servoWrite(servo.pin, servo.angles.right);
			setTimeout(reset.bind(servo), 100);
			found = true;
			break;
		}

	}
	if(!found){

		console.log("no "+n+" "+note)

	}
	output.sendMessage([0x90,n,127]);
}
function noteOff(n){
	output.sendMessage([0x80,n,127]);
}
