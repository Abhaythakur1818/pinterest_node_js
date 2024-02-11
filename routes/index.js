var express = require('express');
var router = express.Router();
const userSchema = require('./users');
const postSchema = require('./posts');
const passport = require('passport');
const localStrategy = require('passport-local')
const upload = require("./multer");

passport.use(new localStrategy(userSchema.authenticate()));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/login', function(req, res, next) {
  res.render('login', {error: req.flash('error')});
});

router.get('/feed', function(req, res, next) {
  res.render('feed');
});

router.post('/upload',isloggedin , upload.single("file"), async function(req, res, next) {
  if(!req.file){
    return res.status(404).send("No files are given");
  }
  const user = await userSchema.findOne({username : req.session.passport.user});
  const post =  await postSchema.create({
    image : req.file.filename,
    imageText : req.body.filecaption,
    user: user._id
  })
  user.posts.push(post._id)
  await user.save();
  res.redirect("/profile");
});


router.get('/profile' ,isloggedin,  async function(req , res , next){
  const user = await userSchema.findOne({
    username : req.session.passport.user
  }).populate("posts")
  
  res.render("profile" ,{user});
});

router.post('/register' , function(req,res){
  const { username, email, fullname } = req.body;
  const newUser = new userSchema({ username, email, fullname});

  userSchema.register(newUser , req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res, function(){
      res.redirect("/profile");
    })
  })
})

router.post('/login' ,passport.authenticate("local" , {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash : true
}), function(req,res){}
) 

router.get("/logout" , function(req , res){
    req.logout(function(err){
      if(err) {return next(err) ;}
      res.redirect('/login');
    });
})

function isloggedin(req , res , next){
    if(req.isAuthenticated()) return next();
    res.redirect("/login");
}

module.exports = router;
