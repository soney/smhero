var port = 8000;

var express = require('express');

var app = express();

app.configure(function() {
	app.use(express.static(__dirname + '/client'));
});

var server = app.listen(port);
var io = require('socket.io').listen(server);
io.set('log level', 1);

// Set up a new input.
var midi_input = new (require('midi')).input();

// Configure a callback.
midi_input.on('message', function(deltaTime, message) {
	io.sockets.emit.apply(io.sockets, (["message"]).concat([].splice.call(arguments,0)));
}); 

// Open the first available input port.
midi_input.openPort(0);


// Close the port when done.
process.on('SIGINT', function () {
	console.log("iao...");
	midi_input.closePort();
	process.exit(0);
});
console.log("Visit localhost:"+port);
