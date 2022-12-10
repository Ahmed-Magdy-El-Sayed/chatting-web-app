export const isAdmin = (req,res,next)=>{
    req.session.user? req.session.user.isAdmin ? next() : res.redirect(301,'/') : res.status(301).redirect('/login');
}