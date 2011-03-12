pt.Tuner.Wireless = pt.Tuner.extend({
	
	// Constructor
	init: function(id, params) {
		this.degree_increment = 3.0;
		this.degree_max = 216.0;
		this.degree_min = 144.0;
		this.radius = 378;
	
		this._super(id, params);
		
		this.activeIndex = 12;
	},
	
	_createBars: function(maxDuration) {
		var bars = $('.pt-bars', this.node);
		var degrees = 141.0;
		
		var self = this;
		jQuery.each(this.podcasts, function(index, value) {
			var height = this.durationInSeconds * self.bars.maxHeight/maxDuration;
			var genre = (this.genres) ? 'pt-genre-' + this.genres[0].toLowerCase() : '';
			
			var bar = $('<div>', {
				id: 'pt-bar-' + this.id
			}).appendTo(bars);
			bar.css("height", height + "px");
			//bar.css({'height': height + "%"});
			bar.addClass(genre);
			
			degrees = degrees + self.degree_increment;
			bar.transform({rotate: degrees + 'deg', translate: ['0', self.radius + 'px'], origin: ['50%', '0']});

			if (degrees > self.degree_max) {
				bar.hide();
			}									
		});		
	},
	
	_updateDOM: function(event) {
		this._super(event);
		
		if (event) {
			if (event.type == 'previous') {
				this._rotate(3);
			} else if (event.type == 'next') {
				this._rotate(-3);
			}
		}
	},
	
	_rotate: function(degrees) {
		var self = this;
		var rotation = (degrees > 0) ? '+=' + degrees : '-=' + -degrees;
		$('.pt-bars > div').each(function(index) {
			$(this).animate({rotate: rotation + 'deg'});
			var deg = self._getRotation($(this)) + degrees;
			if (deg < self.degree_min || deg > self.degree_max) {
				$(this).hide();
			} else {
				$(this).show();
			}
		});
	},
	
	_getRotation: function(node) {
		var transformStr = $(node).attr('data-transform');
		var match = /rotate\((.*)deg\)/i.exec(transformStr);
		if (match && match.length > 1) {
			return parseFloat(match[1]);
		} else {
			console.log('unable to detect rotation..', node);
			return 0;
		}
	}
	
});