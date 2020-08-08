const mongoose = require("mongoose");

const User = mongoose.model("User", {
    first_name: String,
    last_name: String,
    email: { type: String, unique: true, index: true },
    password: String,
});

module.exports = User;
