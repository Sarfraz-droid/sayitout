//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const app = express();

app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "istillgotthestuffedunicorn",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost/sayItOut", { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true });

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  confessions: Array
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.get("/home", (req, res) => {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    //   console.log(req.user)
      User.findById(req.user.id, function (err, user) {
          if(err){
              console.log(err)
          }
          else{
              console.log(user.confessions.length)
             return user;
          }
      })
    
    .then((user) => {
        console.log(user)
       
        res.render("home", { confessions: user.confessions, username: user.username });


    });  
  } else {
    res.redirect("login");
  }
});

app.post("/register", (req, res) => {
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register-failed");
    } else {
      console.log(user);

      passport.authenticate("local")(req, res, function () {
        console.log(req);
        res.redirect("/home");
      });
    }
  });
});

app.get("/login", (req, res) => {
  res.render("login", { failed: false });
});

app.get("/login-failed", (req, res) => {
  res.render("login", { failed: true });
});
app.get("/register", (req, res) => {
  res.render("signup", { failed: false });
});
app.get("/register-failed", (req, res) => {
  res.render("signup", { failed: true });
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local", { failureRedirect: "/login-failed" })(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.post("/confess", (req, res) => {
  let toUser = req.body.toUser;
  confessionMsg = req.body.confession;
  User.findOne({ username: toUser }, (foundUser) => {
    return foundUser;
  }).then((foundUser) => {
    console.log(foundUser);
    confession = {
        msg: confessionMsg,
        date: Date.now()
    }
    foundUser.confessions.push(confession);
    foundUser.save(err=>{
        if(!err) {
            res.redirect("home")
        }
    });
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/login");
});

app.get("/post/:username", (req, res) => {
  let username = req.params.username;

  res.render("confess", { toUser: username });
});
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
