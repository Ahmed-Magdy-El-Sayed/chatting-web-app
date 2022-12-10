export const forLoggedOut = (req, res, next)=>{
    res.locals.isLoggedIn? res.status(301).redirect('/') : next();
}