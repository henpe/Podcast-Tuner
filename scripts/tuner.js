pt = {
    version: '1.0.0'
};

pt.Tuner = function(id, params) {
	this.feedURL = (params.feedURL) ? params.feedURL : "http://thewireless.deepcobalt.com/podslicer/feed.php?callback=?";
	this.theme = (params.theme) ? params.theme : "minimal";
	this.startIndex = 0;
	this.bars = {maxHeight: 100, number: 10};
	this.keys = [];
	this.podcasts = {};
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
		var maxDuration = 0;
		var rootNode = $('.pt-programmes', this.node).first();
		jQuery.each(data, function(index, value) {
			var podcast = new pt.Podcast(rootNode, this);
			
			self.keys.push(podcast.id);
			self.podcasts[podcast.id] = podcast;
			
			if (podcast.durationInSeconds > maxDuration) { 
				maxDuration = podcast.durationInSeconds;
			}
		});
		
		this._createBars(maxDuration);
		
		// Attach key event 
		$(document).bind('keyup', {tuner : this}, this._onKeyUp);
	};

	this.start = function() {
		// Set the starting podcast
		this.activePodcast = this.podcasts[this.activeIndex];
		this.activePodcast.preview();
		
		// Preload audio for next item
		var nextPodcast = this._getPodcast(this.activeIndex++);
		if (nextPodcast) {
			nextPodcast.load();
		}
	};

	this.stop = function() {

	};

	this.mute = function() {
		if (this.activePodcast) this.activePodcast.mute();
	};

	this.previous = function () {
		this.activeIndex--;
		if (this.activeIndex < 0) return;

		if (this.activePodcast) {
			this.activePodcast.pause();
		}

		this.activePodcast = this._getPodcast(this.activeIndex);
		this.activePodcast.play();
		
		this._updateDOM();
	};

	this.next = function() {
		this.activeIndex++;
		if (this.activeIndex > this.keys.length) return;
		
		if (this.activePodcast) {
			this.activePodcast.pause();
		}
		
		this.activePodcast = this._getPodcast(this.activeIndex);
		this.activePodcast.play();
		
		this._updateDOM();
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
		this.node.addClass('pt-tuner');
		var programmes = $('<div class="pt-programmes"></div>').prependTo(this.node);
		var previous = $('<div class="pt-previous"><span>Previous</span></div>').prependTo(this.node);
		var next = $('<div class="pt-next"><span>Next</span></div>').prependTo(this.node);
		var progress = $('<div class="pt-progressbar"><div class="pt-location"></div></div>').prependTo(this.node);
		var bars = $('<div class="pt-bars"></div>').prependTo(this.node);
	};
	
	this._createBars = function(maxDuration) {
		var bars = $('.pt-bars', this.node);
		
		var self = this;
		jQuery.each(this.podcasts, function(index, value) {
			var height = this.durationInSeconds * self.bars.maxHeight/maxDuration;
			var genre = (this.genres) ? 'pt-genre-' + this.genres[0].toLowerCase() : '';
			
			var bar = $('<div>', {
				id: 'pt-bar-' + this.id
			}).appendTo(bars);
			bar.css({'height': height + "%"});
			bar.addClass(genre);
		});
	};
	
	this._updateDOM = function() {
		// Move bars
		
		// Update programme info (maybe animate?)
		$('.pt-programmes .pt-active', this.node).removeClass('pt-active');
		this.activePodcast.node.addClass('pt-active');
		
		// Move progressbar location
		var progressWidth = $('.pt-progressbar').width();
		var ratio = progressWidth / this.activePodcast.durationInSeconds;
		var leftPos = this.activePodcast.audio.trim.start * ratio;
		var width = (this.activePodcast.audio.trim.end - this.activePodcast.audio.trim.start) * ratio;
		$('.pt-location').css('display', 'block').animate({
			'left': leftPos,
	        'width': width
		});
	};
	
	this._getPodcast = function(index) {
		var key = this.keys[index];
		
		if (this.podcasts[key]) {
			return this.podcasts[key];
		} else {
			return false;
		}
	};
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
			this._render();
		}
	};
	
	this.mute = function() {
		if (this.player) {
			this.player.muted = (this.player.muted) ? false : true;
		}
	};
	
	this._render = function() {
		this.node = $('<div>', {
			id : 'pt-programme-' + this.id,
			class: 'pt-programme'
		}).appendTo(this.rootNode);
		
		// Create player
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
		
		this.node.append(this.player);
		
		// Create programme info
		$('<h2>', {
			html: this.title
		}).appendTo(this.node);
		
		$('<p>', {
			html: this.description,
			class: 'pt-p-description'
		}).appendTo(this.node);
		
		$('<p>', {
			html: this.genres[0],
			class: 'pt-p-genre'
		}).appendTo(this.node);
		
		$('<p>', {
			html: this.duration,
			class: 'pt-p-duration'
		}).appendTo(this.node);
		
		$('<img>', {
			src: this.image
		}).appendTo(this.node);
	};
};