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
                const token = jwt.sign({id: result[0].idusers, username: userNameFE, email: result[0].email}, 'ito ang aking key' , { expiresIn: '1h' });
                console.log('token: ', token)
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
        console.log(decoded)
        res.json({'success': true, result: decoded})
    }
    } catch(err) {
    // err
        res.json({'success': false})
    }
})

app.post('/students', function(req,res) {
    const firstName = req.body.firstname;
    const lastName = req.body.lastname;
    const age = req.body.age;
    const gender = req.body.gender;
    const contactNo = req.body.contactnumber;
    const address = req.body.address;

    const phoneDuplicate = `SELECT * FROM project_database.students WHERE ContactNumber = ${contactNo}`;

    con.query(phoneDuplicate , (err, phoneResult) => {
        if (err) throw err;
        console.log(phoneResult)
        if (phoneResult == '') {
            const studentsRegistration = `INSERT INTO project_database.students (FirstName , LastName , Age , Gender , ContactNumber , Address) VALUES ("${firstName}" ,"${lastName}" ,"${age}" ,"${gender}" , "${contactNo}" , "${address}")`

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
        res.json({idresult: result[0].StudentId})
    })
})

app.post('/totalboys', function(req, res) {
    const totalBoys = `SELECT COUNT(*) As count FROM project_database.students WHERE Gender = 'Male'`

    con.query(totalBoys, function(err, result) {
        if (err) throw err;
        if (result.length === 0) {
            res.json({ TotalBoys: 0 })
        } else (
            res.json({ TotalBoys: result[0].count })
        )
    });
});

app.post('/totalgirls', function(req, res) {
    const totalBoys = `SELECT COUNT(*) AS count FROM project_database.students WHERE Gender = 'Female'`

    con.query(totalBoys, function(err, result) {
        if (err) throw err;
        if (result.length === 0) {
            res.json({ TotalGirls: 0 })
        } else (
            res.json({ TotalGirls: result[0].count })
        )
    });
});

// app.post('/totalstudents', function(req, res) {
//     const totalStudents = `SELECT
//         CASE WHEN gender = 'male' THEN 'Male'
//             WHEN gender = 'female' THEN 'Female'
//             WHEN gender = 'other' THEN 'Other'
//             ELSE 'Unknown'
//         END as gender,
//         COUNT(*) as gender_count
//         FROM students
//         GROUP BY gender;`

//     con.query(totalStudents, function(err, result) {
//         if (err) throw err;
//         console.log(result[0].gender_count + result[1].gender_count)
//         const genderCount = result[0].gender_count + result[1].gender_count
//         if (result.length === 0) {
//             res.json({ TotalStudents: 0})
//         } else (
//             res.json({ TotalStudents: genderCount})
//         )
//     });
// });

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