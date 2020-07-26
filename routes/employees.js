const express = require('express');
const router = express.Router();
const passport = require('passport');
const async = require("async");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const Employee = require('../models/employ');
const student = require('../models/student');
const User = require('../models/user')

//checks if user is authenticated
function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please login to access this page');
    res.redirect('/login');
}

//get routes starts here

router.get('/', (req, res) => {
    Employee.find({}).populate('user')
        .then(employees => {
            res.render('database', { employees: employees });
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR :' + err)
            res.redirect('/');
        })
});



router.get("/employee/Add", (req, res) => {
    res.render("Add")
});

router.get('/employee/Search', (req, res) => {
    res.render('search', { employee: "" });
});

router.get('/employee', (req, res) => {
    let searchQuery = { username: req.query.username };

    Employee.findOne(searchQuery).populate('user')
        .then(employee => {
            res.render('search', { employee: employee });
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR :' + err)
            res.redirect('/');
        })
})

router.get('/edit/:id', (req, res) => { 
    let searchQuery = { _id: req.params.id };
    Employee.findOne(searchQuery).populate('user')
        .then(employee => {
            res.render('edit', { employee: employee });
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR :' + err)
            res.redirect('/');
        });

});

router.get('/employee/logout', (req, res) => {
    req.logOut();
    req.flash('success_msg', 'You have been logged out successfully ');
    res.redirect('/login');
});

router.get("/forgot", (req,res) => {
    res.render("forgot")
});

router.get("/reset/:token", (req, res) => {
    Employee.findOne({resetPasswordToken : req.params.token, resetPasswordExpires : {$gt : Date.now()}}).populate('user')
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

router.get("/password/change", (req,res) => {
    res.render("changePassword")
})

//get routes ends here

//post routes starts here

router.post('/employee/Add', (req, res) => {

let newUser = {
    username: req.body.username,
    email : req.body.email,
    role: 2
  }

  User.register(newUser, req.body.password, (err, user) => {
      if(err) {
          console.log(err)
          req.flash('error_msg', 'ERROR :' + err)
          res.redirect('/');
      }

      if(user) {
        let { designation, salary, courseName } = req.body

        Employee.create({
          designation,
          salary,
          courseName,
          class: req.body.class,
          user: user.id

        }, (err, employee) => {
            if(err) {
              console.log(err)
              req.flash('error_msg', 'ERROR :' + err)
              res.redirect('/');
            }

            if(employee) {
              req.flash('success_msg', 'Employee data added successfully')
              res.redirect('/')
            }
        })
      }
  })
  
})



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
               Employee.findOne({email : req.body.email}).populate('user')
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
               Employee.findOne({resetPasswordToken : req.params.token, resetPasswordExpires : {$gt : Date.now() }}).populate('user')
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

//post routes ends here

//put routes starts here

router.put('/edit/:id', (req, res) => {

    let searchQuery = { _id: req.params.id };

    Employee.updateOne(searchQuery, {
        $set: {
            designation: req.body.designation,
            salary: req.body.salary,
            class : req.body.class
        }
    }).then(result => {
            
        let employee = Employee.findOne(searchQuery).populate('user').then(employee => {
          User.updateOne({_id: employee.user.id}, {username: req.body.username, email: req.body.email}, (err, user) => {
            if(err) {
              req.flash('error_msg', 'ERROR :' + err)
              res.redirect('/edit/'+req.params.id);
            }

                req.flash('success_msg', 'Employee Data Updated Sucessfully.')
                res.redirect('/');
            })
        })

            }).catch(err => {
                console.log(err)
                req.flash('error_msg', 'ERROR :' + err)
                res.redirect('/edit/'+req.params.id);
            })
});

//put routes ends here

//delete routes starts here

router.delete('/delete/:id', (req, res) => {
    let searchQuery = { _id: req.params.id };

    Employee.findOne(searchQuery).populate('user')
        .then(employee => {

            deleteEmp(employee.id, employee.user.id)
            
            req.flash('success_msg', 'Employee Deleted Sucessfully.')
            res.redirect('/');
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR :' + err)
            res.redirect('/');
        });
});

async function deleteEmp(employeeId, userId) {
    await Employee.deleteOne({_id: employeeId})
    await User.deleteOne({_id:  userId})
  }
//delete routes ends here



//FOR TEACHERS
//checks if user is authenticated
function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please login to access this page');
    res.redirect('/login');
}

router.get('/teacher', (req, res) => {
    res.render('teacher')
}); 

router.get('/logout', (req, res) => {
    req.logOut();
    req.flash('success_msg', 'You have been successfully logged out');
    res.redirect('/login');
})

router.get('/profile', (req, res) => {
    res.render('profile')
});

router.get("/password/change", (req,res) => {
    res.render("changePassword")
})

router.post("/password/change", (req, res) => {
    if(req.body.teacherPassword !== req.body.confirmTeacherPassword){
        req.flash("error_msg", "Password does not match. Try again");
        return res.redirect("/password/change");
    }
    Employee.findOne({email : req.employee.email}).populate('user')
    .then(employee => {
        employee.setPassword(req.body.password, err => {
            employee.save()
                .then(employee => {
                    req.flash("success_msg", "Password has been changed successfully.")
                    res.redirect("/teacher");
                })
                .catch(err => {
                    req.flash("error_msg", "ERROR: " + err);
                    res.redirect("/password/change");
                });
        });
    });
});


//get routes starts here


router.get('/studentDatabase', (req, res) => {
    student.find({}).populate('user')
        .then(students => {
            res.render('studentDatabase', { students: students });
        })
        .catch(err => {
            req.flash('error_msg', 'ERROR :' + err)
            res.redirect('/');
        })
});

router.get("/employee/studentAdd", (req, res) => {
    res.render("studentAdd")
});

router.get('/employee/studentSearch', (req, res) => {
    res.render('studentSearch', {student:""});
});

router.get('/student', (req,res) => {
    let searchQuery = { name : req.query.name };

    student.findOne(searchQuery)
     .then(student => {
         res.render('studentSearch', {student : student});
     })
     .catch(err => {
        req.flash('error_msg', 'ERROR :' + err)
        res.redirect('/studentDatabase');
     })
})

router.get('/studentEdit/:id', (req, res) => {
    let searchQuery = {_id : req.params.id};
    student.findOne(searchQuery).populate('user')
     .then(student => {
         res.render('studentEdit', {student : student});
     })
     .catch(err => {
        req.flash('error_msg', 'ERROR :' + err)
        res.redirect('/studentDatabase');
     });
    
});

router.get("/employee/studentPage", (req,res) => {
    res.render("studentPage")
});

router.get("/employee/checkResults", (req,res) => {
    res.render("checkResults")
});

//get routes ends here

//post routes starts here

router.post('/employee/studentAdd', (req, res) => {
     
let newUser = {
    username: req.body.username,
    email : req.body.email,
    role : 3
}

User.register(newUser, req.body.password, (err, user) => {
    if(err) {
        console.log(err)
        req.flash('error_msg', 'ERROR :' + err)
        res.redirect('/studentDatabase');
    }

    if(user) {
      let { studentsId, age, gender } = req.body

      student.create({
        studentsId,
        age,
        gender,
        class: req.body.class,
        user: user.id

      }, (err, student) => {
          if(err) {
            console.log(err)
            req.flash('error_msg', 'ERROR :' + err)
            res.redirect('/studentDatabase');
          }

          if(student) {
            req.flash('success_msg', 'Student data added successfully')
            res.redirect('/studentDatabase')
          }
      })
    }
})
})
//post routes ends here

//put routes starts here
router.put('/studentEdit/:id', (req,res) => {
    let searchQuery = {_id : req.params.id};

    student.updateOne(searchQuery, {
        $set : {
        studentsId: req.body.studentsId,
        age: req.body.age,
        class: req.body.class,
        gender: req.body.gender
    }
}).then(result => {

  req.flash('success_msg', 'Student Data Updated Sucessfully.')
  res.redirect('/studentDatabase');
        
    // let std = student.update(searchQuery).populate('user').then(student => {
    //   User.updateOne({_id: student.user.id}, {username: req.body.name, email: req.body.}, (err, user) => {
    //     if(err) {
    //       console.log(err)
    //       req.flash('error_msg', 'ERROR :' + err)
    //       res.redirect('/studentEdit/'+req.params.id);
    //     }

    //         req.flash('success_msg', 'Student Data Updated Sucessfully.')
    //         res.redirect('/studentDatabase');
    //     })
    // })

    //     }).catch(err => {
    //         console.log(err)
    //         req.flash('error_msg', 'ERROR :' + err)
    //         res.redirect('/studentEdit/'+req.params.id);
    //     })
  });

});

//put routes ends here

//delete routes starts here
router.delete('/studentDelete/:id', (req,res) => {
    let searchQuery = {_id : req.params.id};

    student.findOne(searchQuery).populate('user')
    .then(student => {

        deleteStu(student.id, student.user.id)

        req.flash('success_msg', 'Student Data Deleted Sucessfully.')
        res.redirect('/studentDatabase');
    })
    .catch(err => {
        req.flash('error_msg', 'ERROR :' + err)
        res.redirect('/studentDatabase');
    });
});

async function deleteStu(studentId, userId) {
    await student.deleteOne({_id: studentId})
    await User.deleteOne({_id:  userId})
  }
//delete routes ends here


module.exports = router;