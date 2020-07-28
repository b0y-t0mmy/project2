const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const async = require("async");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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
 		res.redirect('/teacher/dashboard')
	}else if(role == 3) { // students
		res.redirect('/student/dashboard')
	}
})

router.get('/employee/administrator', (req, res) => {
    res.render('administrator');
});

router.get('/teacher/dashboard', (req, res) => {
    res.render('teacher')
}); 

router.get('/student/dashboard', (req, res) => {
	res.send("<h1>go to auth.js file in the routes directory and make this endpoint render the necessary page</h1>")
   
});


router.get("/password/change", (req,res) => {
    res.render("changePassword")
})

router.post("/password/change", (req, res) => {
	
    if(req.body.password !== req.body.confirmPassword){
        req.flash("error_msg", "Password does not match. Try again");
        return res.redirect("/password/change");
    }

    (async function() {
        let user = await User.findOne({_id: req.user.id})

        if(!user){
          res.redirect('/login')
        }

        await user.setPassword(req.body.password)
        await user.save()

        req.flash("success_msg", "Password has been changed successfully.")
      
	    if(user.role == 1) {
	        return res.redirect('/employee/administrator')
	    }else if(user.role == 2) {
	      	return res.redirect("/teacher/dashboard");
	    }else if(user.role == 3) {
	    	// return res.send("<h1>go to auth.js file in the routes directory and make this endpoint render the necessary page</h1>")
	      	// return res.redirect("/student/studentPage");
	    }
        
      }())     

});


router.get("/forgot", (req,res) => {
    res.render("forgot")
});

router.get("/reset/:token", (req, res) => {
    User.findOne({resetPasswordToken : req.params.token, resetPasswordExpires : {$gt : Date.now()}}).populate('user')
    .then(employee => {
        if(!employee){
            req.flash("error_msg", "Password token is invalid or has expired.");
            res.redirect("/forgot");
        }
        res.render("newpassword", {token: res.params.token});
    })
    .catch(err => {
        req.flash("error_msg", "ERROR :" + err);
        res.redirect("/forgot");
    });
});


   //routes for forgot password
router.post("/forgot", (req, res, next) => {
    let recoveryPassword = "";
    async.waterfall([
       (done) => {
           crypto.randomBytes(30, (err, buf) => {
               let token = buf.toString("hex");
               done(err, token);
           });
       },
       (token, done) => {

           User.findOne({email : req.body.email})
           .then(employee => {
               if (!employee){
                   req.flash("error_msg", "User with this email does not exist.");
                   return res.redirect("/forgot");
               }

               employee.resetPasswordToken = token;
               employee.resetPasswordExpires = Date.now() + 1800000;

               employee.save(err => {
                   done(err, token, employee);
               });
           })
           .catch(err => {
               req.flash("error_msg", "ERROR: " + err);
               res.redirect("/forgot");
           })
       },
       (token, employee) => {
           let smtpTransport = nodemailer.createTransport({
               service : "GMAIL",
               auth : {
                   user : process.env.GMAIL_EMAIL,
                   pass : process.env.GMAIL_PASSWORD
               },
               debug : true,
               logger : true
           });


           let mailOptions = {
               to : employee.email,
               from : "Treshold Buckler treshold001@gmail.com",
               subject : "Recovery email from Glorious Shining Star International School",
               text : "Please click on the following link to recover your password: \n\n"+ 
                      "http://" + req.headers.host + "/reset/" + token + "\n\n" + 
                      "If you did not request this, please ignore this email."             
       };
         smtpTransport.sendMail(mailOptions, err => {
             req.flash("success_msg", "An email with further instructions has been sent to you. Please check your email.");
             res.redirect("/forgot");
         });
       }
    ], err => {
        if (err) res.redirect("/forgot")
    });
});

router.post("/reset/:token", (req, res) => {
    async.waterfall([
         (done) => {
           User.findOne({resetPasswordToken : req.params.token, resetPasswordExpires : {$gt : Date.now() }})
           .then(employee => {
            if(!employee){
                req.flash("error_msg", "Password token is invalid or has expired.");
                res.redirect("/forgot");
            }
            if(req.body.password !== req.body.confirmPassword ){
                req.flash("error_msg", "Password does not match.");
                return res.redirect("/forgot");
            }
            employee.setPassword(req.body.password, err => {
                res.resetPasswordToken = undefined;
                res.resetPasswordExpires = undefined;

                employee.save(err => {
                    req.logIn(employee, err => {
                      done(err, employee);
                    })
                });
            });
         })
         .catch(err => {
             req.flash("error_msg", "ERROR:" + err)
             res.redirect("/forgot");
         });
        },
        (employee) => {
            let smtpTransport = nodemailer.createTransport({
                service : "GMAIL",
                auth : {
                    user : process.env.GMAIL_EMAIL,
                    PASS : process.env.GMAIL_PASSWORD 
                }
            });

            let mailOptions = {
                to : employee.email,
                from : "treshold001@gmail.com",
                subject : "Your password has been changed",
                text : "Hello" + employee.name+ "\n\n"+
                       "This is a confirmation that your password for your account " + employee.email + "has been changed"
            };

            smtpTransport.sendMail(mailOptions, err => {
                req.flash("succes_msg", "Your password has been changed successfully.");
                res.redirect("/login");
            })
        }
    ],err => {
        res.redirect("/login")
    }
    )
})

module.exports = router