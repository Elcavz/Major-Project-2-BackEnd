import express from 'express';
import bcrypt from 'bcrypt';
import mysql from 'mysql';
import cors from 'cors';

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
            console.log(usernameValue)
            if (usernameValue == "") {
                const myQuery = `INSERT INTO project_database.users (Username , Email , Password) VALUES ("${userNameFE}" , "${emailFE}" , "${hashedPassword}")`
                con.query(myQuery, function (err) {
                    if (err) throw err;
                    res.send({"success": true})
                });
            } else {
                res.send({"success": false})
            }
        });
    });
});

app.post('/login', function(req, res) {
    const userNameFE = req.body.username;

    const myQuery = `SELECT * FROM project_database.users WHERE username = "${userNameFE}"`;

    con.query(myQuery , function (err, result) {
        if (err) throw err;
        console.log('test ' + result)
        if (result && result[0] && result[0].idusers) {
            const passwordFE = req.body.password;
            const matched = bcrypt.compareSync(passwordFE, result[0].password);
            res.send({"success": matched});
        } else {
            res.send({"success": false});
        }
    });
});

con.connect(function(err) {
    if (err) throw err;
    console.log('MYSQL DB CONNECTION SUCCESS!')
    app.listen(3000)
    console.log('App is now running on port' , 3000)
});