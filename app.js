require('dotenv').config()
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const ejs=require("ejs");
const passport=require("passport");
const cookieSession = require('cookie-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

app.set("view engine","ejs");
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-shyam:shyampaul4041@cluster0.kodas.mongodb.net/finaltodoDB",{useNewUrlParser:true,useUnifiedTopology:true,useFindAndModify:false});

app.use(express.urlencoded({extended:true}))

const itemSchema=new mongoose.Schema({
  name:String
})

const Item=mongoose.model("Item",itemSchema);



const userSchema=new mongoose.Schema({
    name:String,
    googleId:String,
    items:[itemSchema]
})
const User=mongoose.model("User",userSchema);

app.get("/",(req,res)=>{
    res.render("login")
})


passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/good"
  },
  function(accessToken, refreshToken, profile, cb) {

    
    
    User.findOne({googleId:profile.id},(err,res)=>{
     if(res){
        return cb(null,res)
      }else{
        new User({
          googleId:profile.id,
          name:profile.displayName
        }).save().then((user)=>{
            cb(null,user)
        })
       
      }
    })
   }
));



//Configure Session Storage
app.use(cookieSession({
  name: 'session-name',
  keys: ["key1","key2"]
}))

//Configure Passport
app.use(passport.initialize());
app.use(passport.session());



app.get('/failed', (req, res) => {
  res.send('<h1>Log in Failed :(</h1>')
});

// Middleware - Check user is Logged in
const checkUserLoggedIn = (req, res, next) => {
  if(req.user){
     next();
  }else{
    res.redirect("/auth/google");
  }
}

//Protected Route.
app.get('/good', checkUserLoggedIn, (req, res) => {
 
  res.render("list",{listTitle:req.user.name,newListItems:req.user.items})
});

app.post("/good",(req,res)=>{
    const itemName=req.body.newItem;
    const item=new Item({
      name:itemName
    })
    User.findById({_id:req.user._id},(err,foundList)=>{
         if(!err){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/good");
         }
     })
})


app.post("/delete",(req,res)=>{
  const itemId=req.body.del;
  
  User.findOneAndUpdate({_id:req.user._id},{$pull:{items:{_id:itemId}}},(err,foundList)=>{
    if(!err){
      res.redirect("/good");
    }
  });
})

app.post("/exit",(req,res)=>{
  res.redirect("/logout");
})


// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/good', passport.authenticate('google', { failureRedirect: '/failed' }),
  function(req, res) {
    res.redirect('/good');
  }
);

//home
app.get("/",(req,res)=>{
  res.send("please login to continue");
})

//Logout
app.get('/logout', (req, res)=>{
  
    req.logout();
    res.redirect("/");
    
})


app.post("/auth/google",(req,res)=>{
    res.redirect("/auth/google")
})



















// let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 3000;
// }









app.listen(3000,()=>{
    console.log("server is up and running ");
})




