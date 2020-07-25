const express = require('express');
const app = express();

const path = require('path');
const dotenv = require('dotenv');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const logger = require('morgan');
const async = require("async");

const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const employeeRoutes = require('./routes/employees');

const studentRoutes = require('./routes/students');

const teacherRoutes = require('./routes/teachers');

const authRoutes = require('./routes/auth')

const student = require('./models/student');
const Employee = require('./models/employ');

const User = require('./models/user');

dotenv.config({path : './config.env'});
 
mongoose.connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true
});

app.use(logger('dev'))
app.use(bodyParser.urlencoded({extended:true}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(methodOverride('_method'));

app.use(session({
    secret : "nodejs",
    resave : true,
    saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(flash());

app.use((req,res,next) => {
    res.locals.success_msg = req.flash(('success_msg'));
    res.locals.error_msg = req.flash(('error_msg'));
    res.locals.error = req.flash(('error'));
    res.locals.currentUser = req.user;
    next();
});



app.use(authRoutes);
app.use(employeeRoutes);
app.use(studentRoutes);
app.use(teacherRoutes);

const port = process.env.PORT
app.listen(port, ()=>{
    console.log('server has started')
});
