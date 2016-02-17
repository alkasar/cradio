// Server requirements
var express = require('express');
var app = express();
var http = require('http').createServer(app);
app.use(express.static('public'));
var io = require('socket.io')(http);

// node modules fo daaaayz
// load in the main cradio app
var cradioApp = require('./cradioApp.js');
// load in the youtube manager, and set the api key
var youtubeManager = require('./youtubeManager.js');
var youtubeApiKey = '';

// TODO load the api key from a config
youtubeManager.init(youtubeApiKey); // myke's key, from google dev dash api project

// Youtube/mp3 requirements
// var fs = require('fs');

// Networking requirements
var getExternalIP = require('external-ip')();
var getInternalIP = require('ip');

// Run node server over this port
var port = 1112;
/*
 * to allow access if using a VM/linux:
 *   sudo ufw allow 1112/tcp
 * tip - to show all ports that are open:
 *   sudo ufw show added
 */
/**
 * app variables
 * ....there has to be a better way to do this....fucking javascript
 */
var connectedUsersCount = 0;
var finishedVideoUsersCount = 0;

var ip = "127.0.0.1";

http.listen(port);
console.log("\n Server running at: "+ip+":"+port);

getExternalIP(function (err, ip) {
	if (err) {
		throw err;
	}
	console.log(" External address:  "+ip+":"+port);
	console.log(" (Accessible only if that port is forwarded)\n");
});
console.log(" Internal address:  "+getInternalIP.address()+":"+port);

// When a user is connecting (via client.js)
io.on('connection', function(socket) {
	// (Don't bother with assigning client IDs and stuff, doesn't need to be personal)

	console.log("CONNECTION FROM: "+socket.request.connection.remoteAddress+"\n\n");

	connectedUsersCount++;

	console.log("Total Users: " + connectedUsersCount);

	// Send them the playlist (just them, not everyone)
	
	socket.emit('playlist', cradioApp.getPlaylist());

	// Send a welcome message to client.js
	socket.emit('message', 'Welcome!');

	// User disconnected
	socket.on('disconnect', function () {
		console.log("USER DISCONNECT");
		connectedUsersCount--;
		console.log("Total Users: " + connectedUsersCount);
	});

	/**
	 *   Socket events, try and keep these as separate functions for readability
	 **/

	// If someone is submitting a youtube search
	socket.on('youtube-search', function(query) {
		if (!query) {
			query = "Adele Hello - Leo Moracchioli";
		}
			
		youtubeManager.search(query, function(results) {
			socket.emit('results', results);
		});
	});

	// If someone wants to add to the playlist
	socket.on('addToPlaylist', function(songInfo) {
		// add the song
		cradioApp.addSongToPlaylist(songInfo);
		// then emit the playlist
		socket.emit('playlist', cradioApp.getPlaylist());
	});

	// If someone wants to start the playlist
	socket.on('startPlaylist', function() {
		console.log("Starting Playlist");
		playlist = cradioApp.getPlaylist();
		if (playlist.length) {
			io.sockets.emit('playSong', playlist[0]);
			// setPlaylistCurrent(0);
		} else {
			console.log("No songs yet..");
		}
	});
	
	// reorder the playlist
	socket.on('reorderPlaylist', function(songData) {
		cradioApp.setPlaylist(songData);
	});
	
	// a request to pause the playlist
	socket.on('playlistPause', function() {
		io.sockets.emit('playlistPause');
	});
	
	// a request to resume the playlist
	socket.on('playlistResume', function() {
		io.sockets.emit('playlistResume');
	});	
	
	socket.on('playlistBackward', function() {
		playlistBackward();
	});	
	
	socket.on('playlistForward', function() {
		playlistForward();
	});

	// If someone wants to empty the playlist
	socket.on('playlistEmpty', function() {
		playlistEmpty();
	});

	// if someone has finished playing, report that
	socket.on('report-finished-playing', function() {
		finishedVideoUsersCount++;

		console.log("Total Users Count: " + connectedUsersCount);
		console.log("Finished Users Count: " + finishedVideoUsersCount);

		if (finishedVideoUsersCount === connectedUsersCount) {
			// advance the video
			//advancePlaylist();
			playlistForward();
			// reset the count of finished users
			finishedVideoUsersCount = 0;
		}
	})
});

