const express = require('express');
const mysql = require('mysql');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
var multer  = require('multer');
const res = require('express/lib/response');

const port = '4000';


// create connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'listings'
})

//connect
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log("Mysql Connected.....");
})

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname + '/views'));
app.use('/uploads',express.static('uploads'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '.png') 
    }
  })

var upload = multer({ storage: storage });
var type = upload.single('profileImage');
 
//home
app.get('/', (req, res) => {

    db.query(sql, (err, result) => {
        if (err) throw err;
        res.render("index.html");
    })

})

app.get('/Login', (req, res) => {

    if (req.cookies.id) {
        res.redirect("/account/" + req.cookies.id)
    } else {
        res.render("Login.html", { error: "" });
    }

})

app.post('/Login', (req, res) => {
    if (req.cookies.id) {
        res.redirect("/account/" + req.cookies.id)
    } else {

        let sql = "select Count(*), id from usersNode where email ='" + req.body.email_value + "' and password='" + req.body.password_value + "'";

        db.query(sql, (err, results) => {
            if (err) throw err;
            if (results[0]['Count(*)'] > 0) {
                res.cookie('id', results[0]['id']);                
                res.redirect("/Login")
            } else {
                res.render("Login.html", { error: "Incorrect Username or Password" });
            }
        })
    }

})

app.get('/SignUp', (req, res) => {

    if (req.cookies.id) {
        res.redirect("/account/" + req.cookies.id)
    } else {
        
        res.render("sign Up.html", { error: "", created: false });

    }

})

app.post('/SignUp', (req, res) => {
    if (req.cookies.id) {
        res.redirect("/account/" + req.cookies.id)
    } else {

        let error = "";
        let created = false;

        if (req.body.password_value === req.body.confirmPassword) {
            let sql = "select Count(*) from usersNode where email='" + req.body.email_value + "'";

            db.query(sql, (err, results) => {
                if (err) throw err;
                if (results[0]['Count(*)'] > 0) {
                    error = "Email already in use";
                    created = false;
                    res.render("sign Up.html", { error: error, created: created });
                } else {
                    let sql2 = "insert into usersNode(displayname,password,email) values ('" + req.body.displayname + "','" + req.body.password_value + "','" + req.body.email_value + "')";
                    db.query(sql2, (err2, results2) => {
                        if (err2) throw err2;
                        created = true;
                        res.render("sign Up.html", { error: error, created: created });
                    });

                }

            });

        } else {
            error = "Passwords do not match";
            res.render("sign Up.html", { error: error, created: created });
        }
    }

})

app.get('/account/:id', (req, res) => {
    if (req.cookies.id) {
        let sql = "select * from usersNode where id='"+req.cookies.id+"'";
        db.query(sql,(err,results)=>{
            if (err) throw err;
            if (results.length>0)
                res.render("Account.html", {displayName: results[0]['displayname'], picture:  results[0]['picture'], description:  results[0]['description']});
            else{
                res.clearCookie("id");
                res.redirect("/Login");
            }
        })
    }else{
        res.redirect("/Login");
    }
})

app.post('/account/:id', type, (req, res) => {

    if (req.cookies.id) {
        let sql = "select * from usersNode where id='"+req.cookies.id+"'";
        db.query(sql,(err,results)=>{
            if (err) throw err;
            if (results.length>0){             
                let picture = req.file?"http://localhost:"+port+"/uploads/"+req.file.filename:null;
                if (picture != null){
                    let sql2 = "update usersNode set picture='"+picture+"', description='"+req.body.description+"' where id="+req.cookies.id;
                    db.query(sql2,(err2,results2)=>{
                        if (err2) throw err2;
                        db.query(sql,(err3,results3)=>{
                            if (err3) throw err3;
                            res.render("Account.html", {displayName: results3[0]['displayname'], picture:  results3[0]['picture'], description:  results3[0]['description']});
                        })
                    })
                }
                else{
                    let sql2 = "update usersNode set description='"+req.body.description+"' where id="+req.cookies.id;
                    db.query(sql2,(err2,results2)=>{
                        if (err2) throw err2;
                        db.query(sql,(err3,results3)=>{
                            if (err3) throw err3;
                            res.render("Account.html", {displayName: results3[0]['displayname'], picture:  results3[0]['picture'], description:  results3[0]['description']});
                        })
                    })
                }

            }else{
                res.clearCookie("id");
                res.redirect("/Login");
            }
        })
    }else{
        res.redirect("/Login");
    }
})

app.listen(port, () => {
    console.log('server started on port 4000');
    
});