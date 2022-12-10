export const isLoggedIn = (req,res,next)=>{
    if(req.session.user) res.locals.isLoggedIn = true;
    else res.locals.isLoggedIn = false;
    next();
}