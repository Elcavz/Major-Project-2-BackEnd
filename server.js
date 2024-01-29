import express from 'express';
import bcrypt from 'bcrypt';
import mysql from 'mysql';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();

app.use(express.json());
app.use(cors());

const con = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "Elcavz",
    password: "hahaha24",
    database: "project_database"
});

app.post('/register', function(req,res) {
    const userNameFE = req.body.username;
    const emailFE = req.body.email;
    const passwordFE = req.body.password;

    bcrypt.hash(passwordFE , 10 , function(err , hashedPassword) {
        if (err) throw err;
        const existingUsername = `SELECT * FROM project_database.users WHERE username = "${userNameFE}"`;
        con.query(existingUsername , function (err, usernameValue) {
            if (err) throw err;
            if (usernameValue == "") {
                const myQuery = `INSERT INTO project_database.users (Username , Email , Password) VALUES ("${userNameFE}" , "${emailFE}" , "${hashedPassword}")`
                con.query(myQuery, function (err) {
                    if (err) throw err;
                    res.json({"success": true})
                });
            } else {
                res.json({"success": false})
            }
        });
    });
});

app.post('/login', function(req, res) {
    const userNameFE = req.body.username;

    const myQuery = `SELECT * FROM project_database.users WHERE username = "${userNameFE}"`;

    con.query(myQuery , function (err, result) {
        if (err) throw err;
        if (result && result[0] && result[0].idusers) {
            const passwordFE = req.body.password;
            const matched = bcrypt.compareSync(passwordFE, result[0].password);
            if (matched) {
                const token = jwt.sign({id: result[0].idusers, username: userNameFE, email: result[0].email}, 'ito ang aking key' , { expiresIn: '12h' });
                res.json({"success": true, token: token});
            } else {
                res.json({'success': false, 'error': 'Invalid Credentials'})
            }
        } else {
            res.json({'message': 'Invalid Credentials'});
        }
    });
});

app.post('/change-password', function(req, res) {
    const userNameFE = req.body.username;
    const oldPasswordFE = req.body.oldPassword;
    const newPasswordFE = req.body.newPassword;

    const checkOldPasswordQuery = `SELECT * FROM project_database.users WHERE username = "${userNameFE}"`;
    con.query(checkOldPasswordQuery, function (err, userData) {
        if (err) throw err;

        if (userData.length > 0) {
            const hashedOldPassword = userData[0].password;

            bcrypt.compare(oldPasswordFE, hashedOldPassword, function(err, isMatch) {
                if (err) throw err;

                if (isMatch) {
                    bcrypt.hash(newPasswordFE, 10, function(err, hashedNewPassword) {
                        if (err) throw err;

                        const updatePasswordQuery = `UPDATE project_database.users SET Password = "${hashedNewPassword}" WHERE username = "${userNameFE}"`;
                        con.query(updatePasswordQuery, function (err) {
                            if (err) throw err;
                            res.json({"success": true});
                        });
                    });
                } else {
                    res.json({"success": false, "message": "Incorrect old password"});
                }
            });
        } else {
            res.json({"success": false, "message": "User not found"});
        }
    });
});

app.get('/admin', function(req,res) {
    try {
    const header = req.headers
    const authorizationHeader = header.authorization
    if (authorizationHeader !== 'undefined') {
        const token = authorizationHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'ito ang aking key');
        res.json({'success': true, result: decoded})
    }
    } catch(err) {
        res.json({'success': false})
    }
})

app.get('/show-students', function(req, res) {
    const showStudents = `SELECT * FROM project_database.students`;

    con.query(showStudents, function(err, result) {
        if (err) throw err;
        res.json({students: result})
    })
})

app.get('/boy-students', function(req, res) {
    const showStudents = `SELECT * FROM project_database.students where Gender = "male"`;

    con.query(showStudents, function(err, result) {
        if (err) throw err;
        res.json({students: result})
    })
})

app.get('/girl-students', function(req, res) {
    const showStudents = `SELECT * FROM project_database.students where Gender = "female"`;

    con.query(showStudents, function(err, result) {
        if (err) throw err;
        res.json({students: result})
    })
})

app.post('/students', function(req,res) {
    const firstName = req.body.firstname;
    const lastName = req.body.lastname;
    const age = req.body.age;
    const gender = req.body.gender;
    const grade = req.body.grade;
    const contactNo = req.body.contactnumber;
    const address = req.body.address;
    const dateEnrolled = req.body.date;

    const phoneDuplicate = `SELECT * FROM project_database.students WHERE ContactNumber = ${contactNo}`;

    con.query(phoneDuplicate , (err, phoneResult) => {
        if (err) throw err;
        if (phoneResult == '') {
            const studentsRegistration = `INSERT INTO project_database.students (FirstName , LastName , Age , Gender , Grade , ContactNumber , Address , Date_Enrolled) VALUES ("${firstName}" ,"${lastName}" ,"${age}" ,"${gender}" , "${grade}" , "${contactNo}" , "${address}" , "${dateEnrolled}")`

            con.query(studentsRegistration , function (err) {
                if (err) throw err;
                res.json({success: true})
             });
        } else {
            res.json({success: false})
        }
    })
});

app.post('/validation' , function(req,res) {
    const contactNo = req.body.contactnumber;

    const studentValidation = `SELECT * FROM project_database.students WHERE ContactNumber = ${contactNo}`;

    con.query(studentValidation, function(err, result) {
        if (err) throw err;
        res.json({idresult: result[0].StudentId , grade: result[0].Grade})
    })
})

app.post('/students-count', function(req, res) {
    const gradeLevel1 = `SELECT COUNT(*) AS count FROM project_database.students WHERE Gender = 'Male'`;
    const totalGirlsQuery = `SELECT COUNT(*) AS count FROM project_database.students WHERE Gender = 'Female'`;

    con.query(gradeLevel1, function(err, totalBoysResult) {
        if (err) throw err;

        con.query(totalGirlsQuery, function(err, totalGirlsResult) {
            if (err) throw err;

            const totalBoysCount = totalBoysResult.length > 0 ? totalBoysResult[0].count : 0;
            const totalGirlsCount = totalGirlsResult.length > 0 ? totalGirlsResult[0].count : 0;
            res.json({ TotalBoys: totalBoysCount, TotalGirls: totalGirlsCount });
        });
    });
});

app.get('/grade-count', function(req, res) {
    const gradeLevel1 = `SELECT COUNT(*) AS count FROM project_database.students WHERE Grade = '1'`;
    const gradeLevel2 = `SELECT COUNT(*) AS count FROM project_database.students WHERE Grade = '2'`;
    const gradeLevel3 = `SELECT COUNT(*) AS count FROM project_database.students WHERE Grade = '3'`;
    const gradeLevel4 = `SELECT COUNT(*) AS count FROM project_database.students WHERE Grade = '4'`;
    const gradeLevel5 = `SELECT COUNT(*) AS count FROM project_database.students WHERE Grade = '5'`;
    const gradeLevel6 = `SELECT COUNT(*) AS count FROM project_database.students WHERE Grade = '6'`;

    const response = {};

    con.query(gradeLevel1, function(err, gradeLevel1Result) {
        response.GradeLevel1 = gradeLevel1Result[0].count;

        con.query(gradeLevel2, function(err, gradeLevel2Result) {
            response.GradeLevel2 = gradeLevel2Result[0].count;

            con.query(gradeLevel3, function(err, gradeLevel3Result) {
                response.GradeLevel3 = gradeLevel3Result[0].count;

                con.query(gradeLevel4, function(err, gradeLevel4Result) {
                    response.GradeLevel4 = gradeLevel4Result[0].count;

                    con.query(gradeLevel5, function(err, gradeLevel5Result) {
                        response.GradeLevel5 = gradeLevel5Result[0].count;

                        con.query(gradeLevel6, function(err, gradeLevel6Result) {
                            response.GradeLevel6 = gradeLevel6Result[0].count;
                            
                            res.json(response);
                        });
                    });
                });
            });
        });
    });
});


app.post('/allstudents', function(req,res) {
    const allStudents = `SELECT * FROM project_database.students`

    con.query(allStudents, function(err, result) {
        if (err) throw err;
        res.json({All: result[0].Age})
    })
})

con.connect(function(err) {
    if (err) throw err;
    console.log('MYSQL DB CONNECTION SUCCESS!')
    app.listen(3000)
    console.log('App is now running on port' , 3000)
});