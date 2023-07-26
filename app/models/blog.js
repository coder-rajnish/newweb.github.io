const mongoose = require('mongoose')
const Blog = mongoose.Schema({
    is_active: {
        type: Boolean,
        default: true
    },

    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    body: {

        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            default: "Point",
        },
        coordinates: {
            type: [Number],
            index: "2dsphere"
        }
    },

    category_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "category"
    }],
    tag_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "tag"
    }],
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "model"
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "model"
    }
}, {
    timestamps: true
})
Blog.statics.byActive = function (name) {
    return this.find({
        is_active: name
    })
}

Blog.statics.byUser = function (id, is_active) {
    return this.find({
        user_id: id,
        is_active: is_active
    })
}
Blog.statics.byCategory = function (id, is_active) {
    return this.find({
        category_id: id,
        is_active: is_active
    })
}
Blog.statics.byUserCategory = function (id, user_id, is_active) {
    return this.find({
        category_id: id,
        user_id: user_id,
        is_active: is_active
    })
}

Blog.statics.byUserTag = function (id, user_id, is_active) {
    return this.find({
        tag_id: id,
        user_id: user_id,
        is_active: is_active
    })
}
const blog = mongoose.model('blog', Blog)
module.exports = blog