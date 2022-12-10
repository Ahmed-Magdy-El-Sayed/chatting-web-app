export const forUsers = (req,res,next)=>{
    res.locals.isLoggedIn?
        next() : res.status(301).redirect('/login');
}