(function() {
var clef_width = 17;
var clef_spacing = 5;
var treble_clef_height = 43;
var bass_clef_height = 22;
var treble_clef_spacing = 10;
var spacing = treble_clef_height/7;

$.widget("smhero.staff_view", {
	
	options: {
		y: 10
		, x: 1
		, staff_width: 90
		, width: 200 
		, height: 100
		, scale: 1
		, clef_x: 10
		, paper: null
	}

	, _create: function() {
		this.note_displays = {};
		this.paper = this.option("paper");
		this.treble_clef = this.paper.path(paths.treble_clef).attr({
			stroke: "none"
			, fill: "black"
		});

		this.bass_clef = this.paper.path(paths.bass_clef).attr({
			stroke: "none"
			, fill: "black"
		});

		this.treble_staff = this.paper.path("M0,0");
		this.bass_staff = this.paper.path("M0,0");

		this.update_staff();
	}
	
	, _destroy: function() {
		this.treble_staff.remove();
		this.bass_staff.remove();
		this.treble_clef.remove();
		this.bass_clef.remove();
		this.paper.remove();
	}

	, show_note: function(note, flat_sharp, options) {
		var staff = note.id >= 60 ? "treble" : "bass";
		var path = this.get_note_path("quarter", staff, note.id, flat_sharp, options);

		this.remove_note(note);
		this.note_displays[note.id] = path;
	}
	, remove_note: function(note, options) {
		if(this.note_displays[note.id]) {
			var path = this.note_displays[note.id];
			path.remove();
			delete this.note_displays[note.id];
		}
	}
	
	// _setOptions is called with a hash of all options that are changing
	// always refresh when changing options
	, _setOptions: function() {
		// _super and _superApply handle keeping the right this-context
		this._superApply(arguments);
		this.update_staff();
	}

	, update_staff: function() {
		this.bass_clef.attr({
			 transform:	"t" + (this.option("x") + this.option("clef_x")) + "," + this.option("y")
							+ "s"+this.option("scale")+","+this.option("scale")+",0,0"
							+ "t0," + (treble_clef_height + treble_clef_spacing)
							+ "t-230.9546,-533.6597"
		});
		this.treble_clef.attr({
			transform:	"t" + (this.option("x") + this.option("clef_x")) + "," + this.option("y")
							+ "s"+this.option("scale")+","+this.option("scale")+",0,0"
		});

		var treble_path = "";
		var bass_path = "";

		var bass_start = treble_clef_height + treble_clef_spacing;
		var treble_start = 7;

		var start_x = 0;
		var end_x = this.option("staff_width");
		for(var i = 0; i<5; i++) {
			treble_path += "M" + start_x + "," + (treble_start + (i*spacing)) + " H" + end_x;
			bass_path += "M" + start_x + "," + (bass_start + (i*spacing)) + " H" + end_x;
		}
		treble_path += "M" + start_x + "," + treble_start + "V" + (treble_start + 4 * spacing)
		bass_path += "M" + start_x + "," + bass_start + "V" + (bass_start + 4 * spacing)
		this.treble_staff.attr("path", treble_path);
		this.bass_staff.attr("path", bass_path);
		this.treble_staff.attr({
			transform: "s"+this.option("scale")+","+this.option("scale")+",0,0"
						+ "t"+this.option("x")+","+this.option("y")
		});
		this.bass_staff.attr({
			transform: "s"+this.option("scale")+","+this.option("scale")+",0,0"
						+ "t"+this.option("x")+","+this.option("y")
		});
		this.paper.setSize(this.get_width(), this.option("y") + this.get_height());
	}

	, get_width: function() {
		return this.option("width");
	}

	, get_height: function() {
		return this.option("height");
	}

	, get_note_path: function(note_type, staff, note_id, sharp_or_flat, options) {
		sharp_or_flat = sharp_or_flat || "sharp";
		if(note_type === "quarter") {
			var note_location_id = note_id;

			var id_mod_12 = note_id%12;
			var key = (note_id - id_mod_12)/12;

			var note_location_id = key * 7;
			for(var i = 0; i<id_mod_12; i++) {
				var is_black_key = _.indexOf([1,3,6,8,10], i) >= 0;
				if(!is_black_key) {
					note_location_id++;
				}
			}
			var is_black_key = _.indexOf([1,3,6,8,10], id_mod_12) >= 0;
			if(is_black_key && sharp_or_flat === "sharp") {
				note_location_id--;
			}

			var note_location_base;
			var note_location_multiplier = -3;
			var treble_note_location_base = this.option("y") + 142.5;
			var lines_path = "";
			var note_x = (this.option("x") + this.option("clef_x") + clef_width + clef_spacing);
			var note_y;
			var line_spacing = 5;
			if(staff === "treble") {
				note_location_base = treble_note_location_base;
				note_y = note_location_base + note_location_multiplier*note_location_id;
				if(note_location_id <= 40) {
					path_type = "a";
				} else {
					path_type = "d";
				}
				if(note_location_id <= 35) {
					var y = 47.5;
					while(y < note_y+1) {
						lines_path += "M"+(note_x-line_spacing)+","+y+"H"+(note_x+line_spacing);
						y += spacing;
					}
				} else if(note_location_id >= 47) {
					var y = 47.5 - 5*spacing;
					while(y > note_y+1) {
						lines_path += "M"+(note_x-line_spacing)+","+y+"H"+(note_x+line_spacing);
						y -= spacing;
					}
				}
			} else {
				note_location_base = treble_note_location_base  + treble_clef_spacing;
				note_y = note_location_base + note_location_multiplier*note_location_id;
				if(note_location_id <= 28) {
					path_type = "a";
				} else {
					path_type = "d";
				}
				if(note_location_id <= 23) {
					var y = 87.5;
					while(y < note_y+1) {
						lines_path += "M"+(note_x-line_spacing)+","+y+"H"+(note_x+line_spacing);
						y += spacing;
					}
				} else if(note_location_id >= 35) {
					var y = 87.5 -5*spacing;
					while(y > note_y-1) {
						lines_path += "M"+(note_x-line_spacing)+","+y+"H"+(note_x+line_spacing);
						y -= spacing;
					}
				}
			}

			var path_str = paths[path_type + "_quarter"];
			var scale = 0.25;
			var transform = "t" + note_x + "," + note_y;
			transform += "s"+scale+","+scale+",0,0";
			transform += "s"+this.option("scale")+","+this.option("scale")+",0,0";

			if(path_type === "a") {
				transform += "t-40,-70";
			} else {
				transform += "t-150,-40";
			}

			var opts = _.extend({
				stroke: "none"
				, fill: "black"
				, transform: transform
			}, options);
			var note_path = this.paper.path(path_str).attr(opts);
			var lines = this.paper.path(lines_path);

			var sharp_flat_text = "";
			if(is_black_key) {
				if(sharp_or_flat === "sharp") {
					sharp_flat_text = "#";
				} else {
					sharp_flat_text = "b";
				}
			}

			var marking = this.paper.text(note_x + line_spacing+2, note_y, sharp_flat_text)
									.attr({
										fill: opts.fill
									});

			var set = this.paper.set();
			set.push(note_path);
			set.push(lines);
			set.push(marking);
			return set;
		}
	}
});

$.widget("smhero.note_view", {
	
	options: {
		type: "quarter"
	}

	, _create: function() {
	}
	
	, _destroy: function() {
		this.treble_staff.remove();
		this.bass_staff.remove();
		this.treble_clef.remove();
		this.bass_clef.remove();
		this.paper.remove();
	}
	
	// _setOptions is called with a hash of all options that are changing
	// always refresh when changing options
	, _setOptions: function() {
		// _super and _superApply handle keeping the right this-context
		this._superApply(arguments);
	}

	, update_staff: function() {
	}
});

}());
