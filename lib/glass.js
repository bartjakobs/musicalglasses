module.exports = (function(){
	var Board = require('firmata')
	var MIDIUtils = require('./midiutils.js')
	var MIDI = require('midi');
	var fs = require('fs');
	var midiConverter = require('midi-converter');


	function Glass(port, json, onLoad){
		this.board = new Board(port);
		if(typeof json == 'object'){
			this.servos = json;
		}else{
			this.servos = JSON.parse(json);
		}
		this.board.on("ready", this._start.bind(this));
		this.returnSpeed = 100;

		this.midi = false;
		this.onLoad = onLoad;
	}

	Glass.prototype._start = function(){
		for(var i = 0; i < this.servos.length; i++){
			var servo = this.servos[i];
			this.board.pinMode(servo.pin, this.	board.MODES.SERVO);
			this.board.servoWrite(servo.pin, servo.angles.center);
		}
		this.onLoad();

	}

	Glass.prototype.loadMidi = function(path){
		var midiData = fs.readFileSync(path, 'binary');

		this.midi = {};
		this.midi.data = midiConverter.midiToJson(midiData);
		this.midi.microsecondsPerBeat = 700000;
		this.midi.track = this.midi.data.tracks[0];
		this.midi.timeSignature = {
			"numerator": 4,
			"denominator": 4,
			"metronome": 24,
			"thirtyseconds": 8
		};
		this.midi.index = 0;
	}

	Glass.prototype.play = function(){
		this.midi.index = 0;
		this.midi.startTime = new Date;
		this._nextMessages();
	}

	Glass.prototype.stopPlaying = function(){
		clearTimeout(this.midi.timeout);
	}

	Glass.prototype._nextMessages = function () {
		var message = this.midi.track[this.midi.index]
		this._sendMessage(message);
		this.midi.index++;
		if(this.midi.index >= this.midi.track.length) return console.log("Playback finished");
		this.midi.timeout = setTimeout(this._nextMessages.bind(this), this._deltaTimeToMs(this.midi.track[this.midi.index].deltaTime))
	};

	Glass.prototype._sendMessage = function (m){
		if(m.type == 'meta' && m.subtype == 'setTempo'){
			//tempo = m.microsecondsPerBeat;
			return
		}
		if(m.type == 'meta' && m.subtyupe == 'timeSignature'){
			//signature = m;
			return;
		}
		if(m.subtype == 'noteOn'){
			this.note(m.noteNumber)
			console.log("noteOn")
		}
		if(m.subtype == 'noteOff'){
			//noteOff(m.noteNumber)
			//console.log("noteOff")
		}
	}

	Glass.prototype.note = function(n){
		var note = MIDIUtils.noteNumberToName(n);
		var found = false;
		for(var i = 0; i < this.servos.length; i++){
			var servo = this.servos[i];
			if(servo.tones.left == note){
				this.board.pinMode(servo.pin, this.board.MODES.SERVO);
				this.board.servoWrite(servo.pin, servo.angles.left);
				setTimeout(reset.bind({servo: servo, board: this.board}), 100);
				found = true;
				break;
			}
			else if(servo.tones.right == note){
				this.board.pinMode(servo.pin, this.board.MODES.SERVO);

				this.board.servoWrite(servo.pin, servo.angles.right);
				setTimeout(reset.bind({servo: servo, board: this.board}), 100);
				found = true;
				break;
			}

		}
		if(!found){
			console.log("no "+n+" "+note);
		}
	};

	function reset() {
		this.board.servoWrite(this.servo.pin, this.servo.angles.center);
	}

	Glass.prototype._deltaTimeToMs = function(dt){
		var oneMinuteInMicroseconds = 60000000;
		var BPM = ( oneMinuteInMicroseconds / this.midi.microsecondsPerBeat ) * ( this.midi.timeSignature.denominator / this.midi.timeSignature.numerator );
		var secondsPerQuarterNote = this.midi.microsecondsPerBeat / 1000000;
		var secondsPerTick = secondsPerQuarterNote / this.midi.data.header.ticksPerBeat;
		return dt * secondsPerTick * 1000;
	}

	return Glass;
})()
