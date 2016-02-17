var connected = false, socket;

$(function() {

	// Connect to the node server with the same IP as the page url,
	// so it assumes the public page is served from the same place as the node server
	socket = io.connect('http://'+window.location.host); // ip and port of the node server

	// Connected event
	socket.on('connect', function() {
		console.log("SocketIO : Connected.");
		connected = true;
	});

	// Message received from server.js
	socket.on('message', function(message) {
		console.log('Server says: ' + message);
		$('#message').html(message);
	});

	// Results received
	socket.on('results', function(results) {
		outputResults(results);
	});

	// Receiving an updated playlist
	socket.on('playlist', function(playlist) {
		var html = '';
		$.each(playlist, function(i, e) { // (index, element)
			html += '<div class="playlist__song ';
			if (e.active) html += 'active';
			html += '" data-youtubeId="'+e.youtubeId+'">';
			// cheeky little youtube thumbanil thing - youtube keeps these urls alive
			html += '<img class="playlist__song__image" src="http://img.youtube.com/vi/'+e.youtubeId+'/3.jpg" />';
			html += '<div class="playlist__song__title">'+e.title+'</div>';
			html += '</div>';
		});

		$('#playlist').html(html);
	});

	socket.on('playSong', function(songInfo) {
		playSong(songInfo);
	});

	socket.on('playlistResume', function() {
		playAnEmbeddedYoutubeVideo(getCurrentVideoIframe());
	});

	socket.on('playlistPause', function() {
		stopAnEmbeddedYoutubeVideo(getCurrentVideoIframe());
	});

	// Disconnected from server.js for some reason
	socket.on('disconnect', function() {
		console.log("Disconnected.");
		connected = false;
	});
});

$(window).ready(function() {
	// initialise the sortable stuff
	var list = document.getElementById("playlist");
	Sortable.create(list, {
		onUpdate: function() {
			// get all the songs
			var songData = [];
			$('.playlist__song').each(function(i, e) {
				console.log(e);
				var title = $(e).find('.playlist__song__title').html();
				var youtubeId = $(e).data('youtubeid');
				songData.push({
					'title' : title,
					youtubeId : youtubeId
				});
			});
			// then emit the socket out with that data as an array
			socket.emit('reorderPlaylist', JSON.stringify(songData));
		}
	});
	
	// add to playlist click
	$('body').on('click', '.js-add-to-playlist', function() {
		var json = {
			'title' : $(this).data('title'),
			'youtubeId' : $(this).data('youtube-id'),
		};

		socket.emit('addToPlaylist', JSON.stringify(json));
	});

	// youtube search
	$('.js-submit').submit(function(e) {
		e.preventDefault();
		socket.emit('youtube-search', $('#youtube').val());
	});

	/**
	 * playlist controls
	 */
	$('#js-playlist-play').on('click', function() {
		// need to check here if we've already started the playlist
		if (getCurrentVideoIframe().length) {
			socket.emit('playlistResume');
			playAnEmbeddedYoutubeVideo(getCurrentVideoIframe());
		} else {
			socket.emit('startPlaylist');
		}
	});
	$('#js-playlist-pause').on('click', function() {
		stopAnEmbeddedYoutubeVideo(getCurrentVideoIframe());
		socket.emit('playlistPause');
	});
	$('#js-playlist-backward').on('click', function() {
		socket.emit('playlistBackward');
	});
	$('#js-playlist-forward').on('click', function() {
		socket.emit('playlistForward');
	});
	$('#js-playlist-empty').on('click', function() {
		socket.emit('playlistEmpty');
	});
});

function outputResults(results) {
	if (!results) { $('#results').html("No results."); return; }

	$('#resultsMessage').show();

	$('#results').empty();

	var html = '';
	$.each(results, function(i, e) { // (index, element)

		// Remove any quotes and such, it just can't handle it as escape data attrs
		e.title = e.title.replace(/'/g, '').replace(/"/g, '');

		if (i % 2===0) html += '<div class="row">';

		html += '<div class="col-sm-6">';

		html += '<div class="results__video_wrapper">';
		html += '<div class="results__video_wrapper__video">';
		html += '<div class="embed-responsive embed-responsive-16by9" style="background-image:url(http://img.youtube.com/vi/'+e.youtubeId+'/1.jpg)">';
		/* // Alteratively, load in iframes::
		html += '<div class="embed-responsive embed-responsive-16by9">';
		html += '<iframe width="100%" src="https://www.youtube.com/embed/'+e.youtubeId+'?enablejsapi=1&version=3&playerapiid=ytplayer&showinfo=0&controls=0&autohide=1&modestbranding=1" frameborder="0" allowfullscreen></iframe>';
		*/
		html += '<i data-title="'+e.title+'" data-youtube-id="'+ e.youtubeId +'" class="fa fa-plus-circle js-add-to-playlist"></i>';
		html += '</div>';
		html += '<h3>'+e.title+'</h3>';
		html += '</div>';
		html += '</div>';
		html += '</div>';

		if (i%2!==0) html += '</div>';
	});
	// Append the html in one big go, or it gets fucky and auto closes divs
	$('#results').append(html);
}

/**
 * given an iframe thats an embedded youtube video, set the video playing
 */
function playAnEmbeddedYoutubeVideo(iframe) {
	iframe[0].contentWindow.postMessage('{"event":"command","func":"' + 'playVideo' + '","args":""}', '*');
	// Unhide the "Now Playing" area
	$('#now-playing__wrapper').slideDown();
	return;
}

/**
 * given an iframe thats an embedded youtube video, pause that video
 */
function stopAnEmbeddedYoutubeVideo(iframe) {
	iframe[0].contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
	return;
}

function playSong(songInfo) {
	console.log("Starting to play song with id: " + songInfo.youtubeId);
	// Create 'Now Playing' youtube iframe
	var html = '';
	
	html += '<iframe width="100%" height="100%" id="now-playing__iframe" src="https://www.youtube.com/embed/'+songInfo.youtubeId+'?enablejsapi=1&version=3&iv_load_policy=3&playerapiid=ytplayer&showinfo=0&autohide=1&modestbranding=1" frameborder="0" allowfullscreen></iframe>';

	$('#now-playing').html(html);

	new YT.Player('now-playing__iframe', {
		events: {
			'onStateChange': function(event) {
				switch(event.data) {
					case YT.PlayerState.ENDED:
						socket.emit('report-finished-playing');
						console.log('Video has ended.');
						break;
					case YT.PlayerState.PLAYING:
						console.log('Video is playing.');
						break;
					case YT.PlayerState.PAUSED:
						console.log('Video is paused.');
						break;
					case YT.PlayerState.BUFFERING:
						console.log('Video is buffering.');
						break;
					case YT.PlayerState.CUED:
						console.log('Video is cued.');
						break;
					default:
						console.log('Unrecognized state.');
						break;
				}
			}
		}
	});

	// Set the iframe playing!
	$('#now-playing iframe').load(function() {
		playAnEmbeddedYoutubeVideo($(this));
	});

	// Stick the top comment in
	html = '<div class="now-play__comment">';
	html += '<span class="now-play__comment__author">'+songInfo.comment.author+'</span>';
	html += '<span class="now-play__comment__likes"> ('+songInfo.comment.likes+' likes)</span>';
	html += '<div class="now-play__comment__content">'+songInfo.comment.content+'</div>';
	html += '</div>';
	$('#now-playing__wrapper').append(html);
}

/*
helper function to always grab the iframe that is the main playlist video
 */
function getCurrentVideoIframe() {
	return $('#now-playing').find('iframe').first();
}
