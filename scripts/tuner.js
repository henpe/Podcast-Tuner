pt = {
    version: '1.0.0'
};

pt.Tuner = function(id, params) {
	this.feedURL = (params.feedURL) ? params.feedURL : "http://thewireless.deepcobalt.com/podslicer/feed.php?callback=?";
	this.theme = (params.theme) ? params.theme : "minimal";
	this.podcasts = [];
	this.activeIndex = 0;
	this.activePodcast;
	this.node = $("#" + id);
	
	// Get podcast feed
	var self = this;
	$.getJSON(this.feedURL, function(data) {
		self.init(data);
	});
	
	this.init = function(data) {
		// Render tuner
		this._render();
		
		// Create a podcast object for each item in the feed
		var self = this;
		jQuery.each(data, function(index, value) {
			var podcast = new pt.Podcast(self.node.filter('.pt-players').first(), this);
			self.podcasts.push(podcast);
		});
		
		console.log(this.podcasts);
		
		// Attach key event 
		$(document).bind('keyup', {tuner : this}, this._onKeyUp);
	};

	this.start = function() {
		// Set the starting podcast
		this.activePodcast = this.podcasts[this.activeIndex];
		this.activePodcast.preview();
		
		// Preload audio for next item
		if (this.podcasts[this.activeIndex++]) {
			this.podcasts[this.activeIndex++].load();
		}
	};

	this.stop = function() {

	};

	this.mute = function() {
		if (this.activePodcast) this.activePodcast.mute();
	};

	this.previous = function () {
		if (this.activePodcast) this.activePodcast.pause();
		
		this.activeIndex--;
		if (this.activeIndex < 0) return;

		this.activePodcast = this.podcasts[this.activeIndex];
		this.activePodcast.play();
		
		this._updateDOM();
	};

	this.next = function() {
		if (this.activePodcast) this.activePodcast.pause();
		
		this.activeIndex++;
		if (this.activeIndex > this.podcasts.length) return;
		
		this.activePodcast = this.podcasts[this.activeIndex];
		this.activePodcast.play();
		
		this._updateDOM(); // Change to event
	};
	
	this._onKeyUp = function(e) {
		var tuner = e.data.tuner;
		
		switch (e.keyCode) {
			case 39: // Right arrow
				tuner.next();
				break;
			case 37: // Left arrow
				tuner.previous();
				break;
			case 38: // Up arrow
				break;
			case 40: // Down arrow
				tuner.mute()
				break;
			case 32: // Space
				tuner.play()
				break;	
		}
	};
	
	this._render = function() {
		var players = $('<div class="pt-players"></div>').prependTo(this.node);
		var previous = $('<div class="pt-previous"><span>Previous</span></div>').prependTo(this.node);
		var next = $('<div class="pt-next"><span>Next</span></div>').prependTo(this.node);
		var progress = $('<div class="pt-progressbar"><span></span><div class="pt-location"></div></div>').prependTo(this.node);
		var info = $('<div class="pt-description"></div>').prependTo(this.node);
		var programmes = $('<div class="pt-programmes"></div>').prependTo(this.node);
	};
	
	this._updateDOM = function() {
		console.log(this.node);
		var description = $('div.pt-description', this.node);
		
		description.first().html(this.activePodcast.title);
	}
};

pt.Podcast = function(rootNode, params) {
	this.id = params.id || "";
	this.title = params.title || "";
	this.description = params.description || "";
	this.brand = params.brand || "";
	this.network = params.network || "";
	this.image = params.image || "";
	this.link = params.link || "";
	this.genres = params.genres || [];
	this.audio = params.audio;
	this.duration = params.duration;
	this.durationInSeconds = params.durationSecs;
	this.epoch = params.epoch;
	this.pubDate = params.pubDate || "";
	this.rootNode = rootNode;
	
	this.play = function(params) {
		this.load();
		if (this.player) {
			console.log(this.player);
			this.player.play();
		}
	};
	
	this.pause = function() {
		if (this.player) {
			this.player.pause();
		}
	};
	
	this.load = function() {
		if (!this.player) {
			this._createAudioElement();
		}
	};
	
	this.mute = function() {
		if (this.player) {
			this.player.muted = (this.player.muted) ? false : true;
		}
	};
	
	this._createAudioElement = function() {
		this.player = $('<audio>', {
			id : 'pt-player-' + this.id,
			autobuffer : 'autobuffer',  
			preload  : 'auto'
		})[0]; 
		
		// Add OGG source
		$('<source>', {
			src: this.audio.ogg,
			type: 'audio/ogg'
		}).appendTo(this.player);
		
		// Add MPEG source
		$('<source>', {
			src: this.audio.mpeg,
			type: 'audio/mpeg'
		}).appendTo(this.player);
		
		this.rootNode.append(this.player);
	};
};