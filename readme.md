# Musical Glasses

This is the code for a installation with glasses and servo motors.
You might not want to look at the code in its current state, if you do, Pull Request the living crap out of it.


It connects through an Arduino (or other board with the Firamata firmware).
The servos.json file is used to map tones to sero motors.
![It works][example]

## Examples:

* play.js plays a midi file (tetris.mid)
* midiin.js takes a midi device as input and plays the tones on your wonderful glass installation
* testIndividualServos.js is used to finetune the servos.json file



[example]: examples/demo.gif "It works."
