(function() {
var notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "B#"];

var isAccidental = function(note_id) {
	return _.indexOf([1,3,6,8,10], note_id) >= 0;
};

var Note = function(options) {
	var opts = _.extend({
		note_id: 0
		, octave: 4
		, value: 4
		, accidental: Note.NATURAL
	}, options);

	this.getNoteID = function() { return opts.note_id; };
	this.getOctave = function() { return opts.octave; };
	this.getValue = function() { return opts.value; };
	this.getAccidental = function() { return opts.accidental; };
};

(function(my) {
	var proto = my.prototype;

	my.FLAT = -1;
	my.NATURAL = 0;
	my.SHARP = 1;

	my.fromMIDIEvent = function(message, options) {
		var note_id = message[1]%12;
		var accidental = my.NATURAL;

		if(isAccidental(note_id)) {
			note_id--;
			accidental = my.SHARP;
		}

		var octave = Math.round((message[1]-note_id)/12)-1;

		while(note_id < 0) {
			note_id += 12;
			octave--;
		}

		var opts = _.extend({
			value: 4
		}, options);

		return new Note({
			note_id: note_id
			, octave: octave
			, value: opts.value
			, accidental: accidental
		});
	};

	var regex_str = "([A-G,a-g])([#bn])?((-?[0-9])+)?(/([0-9]+))?";
	var regex = new RegExp(regex_str);

	my.fromString = function(str) {
		var match = str.match(regex);

		return new my({
			note_id: _.indexOf(notes, match[1].toUpperCase())
			, accidental: match[2] === "b" ? my.FLAT : (match[2] === "#" ? my.SHARP : my.NATURAL)
			, octave: parseInt(match[3]) || 4
			, value: parseInt(match[6]) || 4
		});
	};

	proto.getAccidentalName = function() {
		var accidental = this.getAccidental();
		if(accidental===-1) { return "b"; }
		else if(accidental===1) { return "#"; }
		else { return ""; }
	};

	proto.getShortName = function() {
		return notes[this.getNoteID()] + this.getAccidentalName();
	};

	proto.getName = function(sharp_or_flat) {
		return this.getShortName() + this.getOctave();
	};

	// In Hertz
	proto.getFrequency = function() {
		var n = this.intervalTo(my.fromString("A4"));
		return 440 * Math.pow(2, n/12);
	};

	proto.interval = function(interval) {
		var id_diff = interval % 12;
		var accidental = my.NATURAL;

		var note_id = this.getNoteID() + id_diff + this.getAccidental();


		var octave_diff = Math.round((interval - id_diff) / 12);
		var octave = this.getOctave() + octave_diff;

		while(note_id < 0) {
			note_id += 12;
			octave--;
		}

		if(isAccidental(note_id)) {
			if (this.getAccidental() === my.FLAT) {
				note_id++;
				accidental = my.FLAT;
			} else {
				note_id--;
				accidental = my.SHARP;
			}
		}

		while(note_id < 0) {
			note_id += 12;
			octave--;
		}
		while(note_id >= 12) {
			note_id -= 12;
			octave++;
		}

		return new Note({
			note_id: note_id
			, octave: octave
			, value: this.getValue()
			, accidental: accidental
		});
	};

	proto.intervalTo = function(note) {
		var octave_diff = this.getOctave() - note.getOctave();
		var id_diff = this.getNoteID() - note.getNoteID();
		var accidental_diff = this.getAccidental() - note.getAccidental();
		return 12 * octave_diff + id_diff + accidental_diff;
	};

	proto.getNoteID = function() {
		return this._note_id;
	};

	proto.equals = function(note) {
		if(!(note instanceof Note)) { return false; }
		return 12*this.getOctave() + this.getNoteID() + this.getAccidental() 
				=== 12*note.getOctave() + note.getNoteID() + note.getAccidental();
	};
	proto.getStaffLocation = function() {
		var note_location = 7*this.getOctave();

		var note_id = this.getNoteID();
		for(var i = 0; i<note_id; i++) {
			if(!isAccidental(i)) {
				note_location++;
			}
		}
		return note_location;
	};
}(Note));

var NoteGroup = function(options) {
	var opts = _.extend({
		notes: []
	}, options);

	this.getNotes = function() { return opts.notes; };
};

(function(my) {
	var proto = my.prototype;

	my.fromString = function(str) {
		return new my({
			notes: _.map(str.split(" "), function(s) {
				return Note.fromString(s);
			})
		});
	};
}(NoteGroup));

window.Note = Note;
window.NoteGroup = NoteGroup;
}());
