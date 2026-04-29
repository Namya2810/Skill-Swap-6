const mongoose = require('mongoose');

const endorsementSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill:    { type: String, required: true, trim: true },
  // Must have a completed session to endorse
  session:  { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  createdAt:{ type: Date, default: Date.now },
});

// One endorsement per skill per user pair (unique constraint)
endorsementSchema.index({ fromUser: 1, toUser: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model('Endorsement', endorsementSchema);
