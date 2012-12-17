(function() {
var clef_width = 17;
var clef_spacing = 5;
var treble_clef_height = 43;
var bass_clef_height = 22;
var spacing = treble_clef_height/7;

var treble_clef_spacing = 1*spacing;

var index_where = function(arr, obj, eq_check) {
	for(var i = 0; i<arr.length; i++) {
		if(eq_check(obj, arr[i])) { return i; }
	}
	return -1;
};
var eqeqeq = function(a,b) { return a === b; };
var simple_map = function(eq_check) {
	eq_check = eq_check || eqeqeq;
    var keys = [];
    var values = [];
    return {
        set: function(key, value) {
            var key_index = index_where(keys, key, eq_check);
            if(key_index < 0) {
                keys.push(key);
                values.push(value);
            } else {
                values[key_index] = value;
            }
        }
        , unset: function(key) {
            var key_index = index_where(keys, key, eq_check);
            while(key_index >= 0) {
                keys.splice(key_index, 1);
                values.splice(key_index, 1);
                key_index = _.indexOf(keys, key);
            }

        }
        , get: function(key) {
            var key_index = index_where(keys, key, eq_check);
            if(key_index >= 0) {
                return values[key_index];
            }
        }
        , each: function(callback, context) {
            context = context || this;
            for(var i = 0; i<keys.length; i++) {
                var key = keys[i], value = values[i];
                callback.call(context, value, key, i);
            }
        }
		, has: function(key) {
            var key_index = index_where(keys, key, eq_check);
			return key_index >= 0;
		}
    };
};

var note_eq_check = function(a, b) {
	if(a instanceof Note && b instanceof Note) {
		return a.equals(b);
	} else {
		return a === b;
	}
};

$.widget("smhero.staff_view", {
	
	options: {
		y: 10
		, x: 1
		, staff_width: 90
		, width: 200 
		, height: 100
		, scale: 1
		, treble_staff_y: 7 
		, clef_x: 10
		, paper: null
	}

	, _create: function() {
		this.note_displays = simple_map(note_eq_check);
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

	, show_note: function(note, options) {
		var staff = note.getStaffLocation() >= 28 ? "treble" : "bass";
		var path = this.get_note_path(staff, note, options);

		this.remove_note(note);
		this.note_displays.set(note, path);
	}
	, remove_note: function(note, options) {
		options = _.extend({animated: false}, options);
		var path = this.note_displays.get(note);
		if(path) {
			this.note_displays.unset(note);
			if(options.animated) {
				path.animate({
					opacity: 0
				}, 100, "ease-in");
				path.forEach(function(el) {
					el.animate({
						transform: el.attr("transform") + "r10,0,0"
					}, 100, "ease-in");
				});
				window.setTimeout(function() {
					path.remove();
				}, 100);
			} else {
				path.remove();
			}
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
		var treble_start = this.option("treble_staff_y");

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

	, get_note_path: function(staff, note, options) {
		if(note.getValue() === 4) {
			var note_location = note.getStaffLocation();

			var note_location_base;
			var note_location_multiplier = -(spacing/2);


			var treble_note_location_base = this.option("y") + this.option("treble_staff_y");
			var bass_note_location_base = this.option("y") + treble_clef_height + treble_clef_spacing;

			var lines_path = "";
			var note_x = (this.option("x") + this.option("clef_x") + clef_width + clef_spacing);
			var note_y;
			var line_h_spacing = 5;
			if(staff === "treble") {
				note_y = treble_note_location_base + note_location_multiplier*(note_location-38);
				if(note_location <= 33) {
					path_type = "a";
				} else {
					path_type = "d";
				}
				if(note_location <= 28) {
					var y = treble_note_location_base + 5*spacing;
					while(y < note_y+1) {
						lines_path += "M"+(note_x-line_h_spacing)+","+y+"H"+(note_x+line_h_spacing);
						y += spacing;
					}
				} else if(note_location >= 40) {
					var y = treble_note_location_base - 1*spacing;
					while(y > note_y-1) {
						lines_path += "M"+(note_x-line_h_spacing)+","+y+"H"+(note_x+line_h_spacing);
						y -= spacing;
					}
				}
			} else {
				note_y = bass_note_location_base + note_location_multiplier*(note_location-26);
				if(note_location <= 21) {
					path_type = "a";
				} else {
					path_type = "d";
				}
				if(note_location <= 16) {
					var y = bass_note_location_base + 5*spacing;
					while(y < note_y+1) {
						lines_path += "M"+(note_x-line_h_spacing)+","+y+"H"+(note_x+line_h_spacing);
						y += spacing;
					}
				} else if(note_location >= 28) {
					var y = bass_note_location_base - 1*spacing;
					while(y > note_y-1) {
						lines_path += "M"+(note_x-line_h_spacing)+","+y+"H"+(note_x+line_h_spacing);
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

			var sharp_flat_text = note.getAccidentalName();

			var marking = this.paper.text(note_x + 7, note_y, sharp_flat_text)
									.attr({
										fill: opts.fill
										, "text-align": "start"
									});

			var set = this.paper.set();
			set.push(note_path);
			set.push(lines);
			set.push(marking);
			return set;
		}
	}
});

}());
