(function() {
var get_time = function() { return (new Date()).getTime(); };
var encouragement = ["Nice!", "Good job!", "Great!"]

var random_between = function(from, to) {
	return Math.round(from + (to-from)*Math.random());
};

var SheetMusicHero = function(options) {
	able.make_this_optionable(this, {
		element: document.body
	}, options);

	var midi_client = this.option("midi_client")
		, element = $(this.option("element"));

	this.paper = Raphael(element);
	element.staff_view({
		paper: this.paper
	});

	this.target_response_times = [];
	this.response_time = this.paper.text(95, 30, this.get_response_time_str()).attr({
		fill: "red"
		, "text-anchor": "start"
	});
	this.update_target();

	midi_client.on("note_change", _.bind(function(notes, removed, added, modified) {
		_.each(removed, function(note) {
			element.staff_view("remove_note", note);
			if(note.id === this.target) {
				this.on_note_hit(note);
			}
		}, this);
		_.each(added, function(note) {
			element.staff_view("show_note", note, undefined, {fill: "#777", "fill-opacity": 0.5});
			if(note.id === this.target) {
				this.on_note_hit(note);
			}
		}, this);
	}, this));

};
(function(my) {
	var proto = my.prototype;
	able.make_proto_optionable(proto);
	proto.update_target = function() {
		var old_target = this.target;
		if(old_target) { }
		this.target = random_between(41, 83);
		var element = this.option("element");
		element.staff_view("show_note", {id: this.target}, Math.random() > 0.5 ? "flat" : "sharp", {fill: "red"});
		this.target_show_time = get_time();
	};
	proto.on_note_hit = function(note) {
		var element = this.option("element");
		element.staff_view("remove_note", note);
		this.show_encouragement();
		this.target_response_times.push(get_time() - this.target_show_time);
		this.response_time.attr("text", this.get_response_time_str());
		this.update_target();
	};
	proto.show_encouragement = function() {
		var message = encouragement[random_between(0, encouragement.length-1)];

		var text = this.paper.text(100, 50, message);
		window.setTimeout(function() {
			text.remove();
		}, 900);
	};
	proto.get_average_response_time = function() {
		if(this.target_response_times.length === 0) { return 0; }
		var sum = 0;
		_.each(this.target_response_times, function(time) {
			sum+= time;
		});
		return sum / this.target_response_times.length;
	};
	proto.get_response_time_str = function() {
		var response_time = this.get_average_response_time()/1000;
		return "Response time: " + response_time.toFixed(2);
	};
}(SheetMusicHero));
window.SheetMusicHero = SheetMusicHero;
}());
