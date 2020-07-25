const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

let userSchema = new mongoose.Schema({
    username :String ,
    email : String,
    password : {
        type : String,
        select : false
    },
    role: Number, // 1-admin 2-teachers 3-students
    resetPasswordToken : String,
    resetPasswordExpires : Date,
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', userSchema);
