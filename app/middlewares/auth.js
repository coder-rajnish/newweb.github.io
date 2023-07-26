function auth(req,res,next)
{
    
    if(req.isAuthenticated() && req.user.role=="User")
    {
        return next()
    }
    if(req.isAuthenticated() && req.user.role=="Admin")
    {
        res.redirect('/adminhome')
    }
    return res.redirect('/login')

}
module.exports=auth