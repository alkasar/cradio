const YouTube = require('youtube-node');
var youtubeNode = null;

exports.init = function(_youtubeApiKey) {
	console.log(youtubeNode);
	youtubeNode = new YouTube();	
	youtubeNode.setKey(_youtubeApiKey); // myke's key, from google dev dash api project
}

exports.search = function(query, callback) {
	var results = [];
	
	youtubeNode.addParam('type', 'video'); //lets stop bringing playlist results back!
	
	youtubeNode.search(query, 6, function(error, result) {
		if (error) {			
			console.log(error);
			return false;
		}
		
		for (var key in result.items) {
			var item = result.items[key];
			results.push({
				'title': item.snippet.title,					
				'youtubeId': item.id.videoId,					
			});
		}
		
		callback(results);
	});
}