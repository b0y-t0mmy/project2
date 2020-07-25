const mongoose = require('mongoose');

let employeeScheme = new mongoose.Schema({
    designation : String,
    salary : Number,
    class : String,
    courseName : String,
    allStudents : [{type : mongoose.Schema.Types.ObjectId, ref : 'Student'}],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Employee', employeeScheme);

