const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); 
const User = require('./models/User'); 
const passport = require('passport'); 
const {ensureAuthenticated} = require('./authentication/ensuredauth'); 
const {isPasswordCorrect, isEmailTaken, isUsernameTaken} = require("./authentication/registration");
const crypto = require("crypto");
const nodemailer = require("nodemailer"); 
module.exports = function(app){
	app.route('/').get((req, res)=>{
 		res.render('index')
	})
	
	//Register Route
	app.route('/register').get((req, res)=>{
		res.render('registration')
	})

	app.route('/register').post(isPasswordCorrect, isEmailTaken, isUsernameTaken, 
		(req, res)=>{
		const {email, fullname, username, password} = req.body; 
		const newUser = new User({email, fullname, username, password, connected:false});  
		const saltRounds = 10; 
		// Hash password and save new use in the database 
		bcrypt.genSalt(saltRounds, (err, salt)=>{
    		bcrypt.hash(newUser.password, salt, (err, hash)=>{
        		newUser.password = hash;
        		newUser.save()
        	    	.then(user=>{
        	    		req.flash("success_msg", "You are now registered and can log in")
        	    		res.redirect('/')
        			})
        			.catch(err=>console.log(err)); 
    		});
		});
	})

	//Logout Route 
	app.route('/logout').get((req, res)=>{
		req.logOut(); 
		res.redirect('/')
	})

	//Home Route 
	app.route('/home').get(ensureAuthenticated, (req, res)=>{
		const {fullname} = req.user; 
		res.render('home', {fullname})
	}); 

	//Login Route 
	app.route('/login').post((req, res, next)=>{
		passport.authenticate('local', {
			successRedirect: '/home', 
			failureRedirect: '/', 
			failureFlash: true
		})(req, res, next); 
	}); 

	//Identity route
	app.route('/identity').get((req, res)=>{
		res.render("identity")
	})
	app.route('/identity').post((req, res)=>{
		const {email} = req.body; 
		crypto.randomBytes(32, (err, buffer)=>{
			const token=buffer.toString("hex"); 
			User.findOne({email})
				.then(data=>{
					data.token = token; 
					data.tokenExpires = Date.now() + 60*60*1000
					data.save()
						.then(savedData=>{
							req.flash("success_msg", "Email has been sent")

							//Send email with nodemailer 
							var transporter = nodemailer.createTransport({
								service:"Yahoo", 
								auth:{
									user:process.env.YAHOO_USERNAME, 
									pass:process.env.YAHOO_PASSWORD
								}, 
								tls: {
    								rejectUnauthorized: false
  								}

							})
							console.log(email)
							var mailOptions = {
								from:process.env.YAHOO_USERNAME, 
								to: email, 
								subject:'Sending Email using Node.js', 
								html:`<p>Click <a href="http://localhost:5000/reset/${token}">here</a> to reset your password</p>`
							}
							transporter.sendMail(mailOptions, (err, info)=>{
								if (err){
									console.log(err)
								}
								else{
									console.log("Email sent: " + info.response)
								}
							})

							//Refresh the page 
							res.redirect("/identity"); 

						})
						.catch(err=>console.log(err))
				})
				.catch(err=>console.log(err))
		})
	})

	//Reset Route 
	app.route('/reset/:token').get((req, res)=>{
		const {token} = req.params; 
		User.findOne({token})
			.then(user=>{
				if (user && Date.now()<user.tokenExpires){
					res.render("reset") 
				}
				else{
					res.send("<p>Page not found</p>")
				}	
			})
			.catch(err=>console.log(err))		
	})
	app.route('/reset/:token').post((req, res)=>{
		const {token} = req.params; 
		const {password, confirmPassword} = req.body; 
		if (password===confirmPassword){
			const saltRounds = 12; 
			bcrypt.genSalt(saltRounds, (err, salt)=>{
    		bcrypt.hash(password, salt, (err, hash)=>{
    				User.findOne({token})
    					.then(user=>{
    						user.password = hash; 
    						user.token = ""; 
    						user.save()
    							.then(savedUser=>{
    								req.flash("success_msg", "Password has been updated!")
    								res.redirect("/")
    							})
    							.catch(err=>console.log(err))
    					}) 
    					.catch(err=>console.log(err));
    			});
			});
		}
		else{
			req.flash("error_msg", "Passwords do not match")
			res.redirect("/reset/:token"); 
		}
	})

}