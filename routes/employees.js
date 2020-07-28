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