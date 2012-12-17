(function() {
var get_time = function() { return (new Date()).getTime(); };
var MidiClient = function() {
	able.make_this_listenable(this);
	this.held_notes = [];
};

(function(my) {
	var proto = my.prototype;
	able.make_proto_listenable(proto);
	proto.on_message = function (deltaTime, message) {
		var type = message[0], note_id = message[1], intensity = message[2];
		if(note_id === 4) { //sustain pedal
			return;
		}

		var removed = [], added = [], modified = [];
		var found_note = false;
		for(var i = 0; i<this.held_notes.length; i++) {
			if(this.held_notes[i].id === note_id) {
				if(intensity === 0) {
					removed.push(this.held_notes[i]);
					this.held_notes.splice(i, 1);
				} else {
					this.held_notes[i].intensity = intensity;
					this.held_notes[i].updated = get_time();

					modified.push(this.held_notes[i]);
				}
				found_note = true;
				break;
			}
		}

		if(!found_note) {
			var note_info = {
				id: note_id
				, note: Note.fromMIDIEvent(message)
				, intensity: intensity
				, updated: get_time()
			};
			this.held_notes.push(note_info);
			added.push(note_info);
		}

		this._emit("note_change", this.held_notes, removed, added, modified);
	};
}(MidiClient));

window.MidiClient = MidiClient;
}());
