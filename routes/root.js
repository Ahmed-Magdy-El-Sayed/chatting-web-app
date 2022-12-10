import express from 'express'
import multer from 'multer';
const router = express.Router();
import{
    getHome, getSignup,
    postUser,  getLogin, 
    logout, checkUser,
    redirect,userProfile,
    sessionUpdate, removeNotificatons,
    getChatPage, getUsers,
    changeProfile, deleteMsg
} from '../controllers/root.js';

import {forLoggedOut} from'../middlewares/forLoggedOut.js';
import {forUsers} from'../middlewares/forUsers.js';


router.get('/', getHome)
router.get('/getUsers', getUsers)
router.get('/profile', redirect)
router.get('/profile/:id', forUsers, userProfile)
router.post('/change-profile', multer({
    storage: multer.diskStorage({
        destination:(req, file, cb)=>{
            cb(null, 'assets/images');
        },
        filename:(req, file, cb)=>{
            cb(null, Date.now()+ '.' +file.originalname.split('.')[1])
        }
    })
}).single('img'), changeProfile)
router.post('/sessionUpdate',sessionUpdate)

router.get('/removeNotificatons', forUsers, removeNotificatons)

router.get('/signup',forLoggedOut,getSignup)
router.post('/signup',postUser)

router.get('/login',forLoggedOut,getLogin)
router.post('/login',checkUser)

router.get('/logout', forUsers, logout)

router.get('/chats/:id', forUsers, getChatPage)
router.post('/chats/deleteMsg', deleteMsg)
export default router;