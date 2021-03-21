module.exports = {
	//Used for ensuring specific pages are protected
	ensureAuthenticated(req, res, next){
		console.log(req.user);
		if (req.isAuthenticated()){
			next()
		}
		else{
			req.flash('error_msg', 'Please log in to view this resource')
			res.redirect('/')
		}
	}
}