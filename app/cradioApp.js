/**
 * think of this as the "model" - it doesnt deal with the sockets, only with data coming in
 * and data going out
 * 
 * therefore, this file (cradioApp.js) would hold the playlist itself, as well as methods for
 * manipulating the playlist
 * 
 * this way, the main "controller" (server.js) never mucks around with arrays and things - seperation
 * of concerns, baby #softwareEngineering
 */

/**
 * tldr of node modules; setting a function to the global "exports" object is like doing a "public" function
 * in PHP - these functions can be accessed via the object wherever this module is require()'d
 */

var playlist = [];

exports.getPlaylist = function() {
	return playlist;
}

exports.setPlaylist = function(playlist) {
	this.playlist = playlist;
}

exports.addSongToPlaylist = function(songInfo) {
	// Add song to array (and grab the index)
	songInfo = JSON.parse(songInfo);
	
	console.log("Adding song to server playlist: " + songInfo.title);
	playlist.push(songInfo);

	return playlist.length;
}

exports.playlistForward = function() {
	console.log("Forward Playlist");
	// Change playlist index variable
	if (playlistCurrent < playlist.length - 1) {
		playlistCurrent++;
	}
	setPlaylistCurrent(playlistCurrent);

	// Broadcast playlist as it will report the active song
	broadcastPlaylist();

	// Start the video playing
	io.sockets.emit('playSong', playlist[playlistCurrent]);
}

exports.clearPlaylist = function() {
	playlist.length = 0; // the proper way to clear an array apparently
	return true;
}

exports.getAllCommentsThenProcess = function(socket, songInfo, callback) {
	youTube.comments(songInfo.youtubeId, function(error, result) {
		if (error) {
			console.log(error);
			return false;
		} else {
			var comments = [];
			for (var key in result.items) {
				var item = result.items[key];
				// If a valid comment exists, wack it in the comments array
				if (item.snippet.topLevelComment.snippet.authorDisplayName.length &&
					 item.snippet.topLevelComment.snippet.textDisplay.length &&
					 typeof item.snippet.topLevelComment.snippet.likeCount != 'undefined') { // could be 0
						comments.push({
							'author': item.snippet.topLevelComment.snippet.authorDisplayName,
							'content': item.snippet.topLevelComment.snippet.textDisplay,
							'likes': item.snippet.topLevelComment.snippet.likeCount
						});
				}
			}
			//return comments;
			callback(socket, songInfo, comments);
		}
	});
}

/**
 * This is a lot of functions, but it has to deal with the fact that
 * the youtube api query is asynchronous as fuck, so callback it mawfk
 **/

exports.commentsProcess = function(socket, songInfo, comments) {
	var topComment = findTopComment(comments);
	addCommentToPlaylist(songInfo, topComment);
	broadcastPlaylist();
}

exports.findTopComment = function(comments) {
	//console.log(comments);

	// Sort the comments by order of likes
	comments.sort(function(a, b) {
		return b.likes - a.likes
	})

	// Pick out the topmost one. NB: not necessarily the most liked of all time
	// But *I think* it's from within the most recent 100 comments.
	return comments[0];
}

exports.addCommentToPlaylist = function(songInfo, comment) {
	/** songInfo should still have the songIndex value at this point
	 *  and hopefully it'll still be accurate if users add songs at the same time.
	 *  Otherwise we'll have to hunt out the playlist item by its youtubeId
	 **/
	playlist[songInfo.songIndex].comment = comment;

	broadcastPlaylist();

	// Echo playlist in console
	console.log("\n**** Playlist ****:");
	console.log(playlist);
	console.log("******************:\n");
}


// No need to remove the song from the playlist! Just use playlistForward() and stuff :)
// function advancePlaylist() {
// 	// so we need to, in order
// 	// - pop the current video off the playlist
// 	// - send the playlist to all users
// 	// - start the playlist
// 	console.log(playlist);
// 	playlist.shift();
// 	if (playlist.length) {
// 		broadcastPlaylist();
// 		io.sockets.emit('playSong', playlist[0]);
// 	} else {
// 		console.log("we're out of videos!");
// 	}
// }

/*
function startPlaylist() {
	console.log("Starting Playlist");
	if (playlist.length) {
		io.sockets.emit('playSong', playlist[0]);
		setPlaylistCurrent(0);
	} else {
		console.log("No songs yet..");
	}
}

function playlistPause() {
	console.log("Pausing Playlist");
	io.sockets.emit('playlistPause');
}

function playlistResume() {
	console.log("Resuming Playlist");
	io.sockets.emit('playlistResume');
}

function playlistBackward() {
	console.log("Backward Playlist");
	// Change playlist index variable
	if (playlistCurrent > 0) {
		playlistCurrent--;
	}
	setPlaylistCurrent(playlistCurrent);

	// Broadcast playlist as it will report the active song
	broadcastPlaylist();

	// Start the video playing
	io.sockets.emit('playSong', playlist[playlistCurrent]);
}

function playlistForward() {
	console.log("Forward Playlist");
	// Change playlist index variable
	if (playlistCurrent < playlist.length - 1) {
		playlistCurrent++;
	}
	setPlaylistCurrent(playlistCurrent);

	// Broadcast playlist as it will report the active song
	broadcastPlaylist();

	// Start the video playing
	io.sockets.emit('playSong', playlist[playlistCurrent]);
}

function playlistEmpty() {
	// Empty playlist array and send it out
	playlist.length = 0; // the proper way to clear an array apparently
	broadcastPlaylist();
}

// Send playlist to CURRENT user
function emitPlaylist(socket) {
	socket.emit('playlist', playlist);
}

// Send playlist to ALL users
function broadcastPlaylist() {
	io.sockets.emit('playlist', playlist);
}

// Set playlist current variable and flag it in the playlist array
function setPlaylistCurrent(index) {
	playlistCurrent = index;

	// Set all items as inactive
	for (var i in playlist) {
		playlist[i].active = false;
	}

	// Set given item as active
	playlist[index].active = true;
}

function parseTehJson(string) {
	// Parse json or error
	try {
		var string = JSON.parse(string);
		return string;
	} catch (e) {
		console.log(songInfo);
		return console.error(e);
	}
}
*/