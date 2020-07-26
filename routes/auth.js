const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', passport.authenticate('local', {
	failureRedirect: '/login',
    failureFlash: 'Invalid Id or password. Try again!!'
}), (req, res) => {
	let role = req.user.role

	if(role == 1 ) { //admin
        res.redirect('/employee/administrator')
	}else if(role == 2) { //teachers
 		res.redirect('/teacher')
	}else if(role == 3) { // students
		res.redirect('/student')
	}
})

router.get('/employee/administrator', (req, res) => {
    res.render('administrator');
});

router.get('/teacher/dashboard', (req, res) => {
    res.render('teacher')
}); 

router.get('/student/studentPage', (req, res) => {
    res.render('studentPage');
});

module.exports = router