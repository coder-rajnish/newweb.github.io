function adminAuth(req,res,next)
{
    if(req.isAuthenticated() && req.user.role=="Admin")
    {
        return next()
    }
      if(req.isAuthenticated() && req.user.role=="User")
    {
        return res.redirect('/')
    }
    return res.redirect('/login')

}
module.exports=adminAuth