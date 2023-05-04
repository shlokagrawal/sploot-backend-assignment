const mongoose = require('mongoose');

// Article Schema
const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    authorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    authorAge: {
        type: Number,
        min: 1
    }
});

module.exports = mongoose.model('Article', articleSchema);