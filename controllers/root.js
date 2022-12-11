import { createUser, authUser, getUser, getAllUsers, deleteNotificatons, makeOffline, updateProfile } from '../models/users.js';
import { getMessages, deleteMsgdb, saveMsg } from '../models/chats.js';

const getHome = (req, res)=>{
    if(res.locals.isLoggedIn)
        res.redirect(301,'/profile/'+req.session.user._id)
    else res.render('index')
}

const redirect =(req, res, next)=>{
    res.redirect(301,'/profile/'+req.session.user._id)
}

const getUsers = (req, res, next)=>{
    getAllUsers().then(users=>{
        res.json(JSON.stringify(users));
    }).catch(()=>{
        next({status:'500'});
    })
}

const userProfile =async (req, res, next)=>{
    let info ={hisAccount: req.params.id === String(req.session.user._id)} 
    if(!info.hisAccount){
        await getUser(req.params.id).then(user=>{
            let chatId ;
            user.chats.map(chat=>{
                if(chat.friendId === String(req.session.user._id)) 
                    chatId = chat.chatId;
            })
            info.userProfile = {
                userId: String(user._id), 
                name: user.name, 
                image: user.image,
                chatId
            }
        }).catch(()=>{
            next({status:'500'});
        })
        info.hisFriend = req.session.user.friends.map(friend=>{
            return req.params.id === friend.userId
        }).includes(true);
        if(!info.hisFriend){
            info.friendReq = req.session.user.friendsReqs.find(friendReq=>{
                return req.params.id === friendReq.userId
            });
        }
    }
    res.render('index',{
        user: req.session.user,
        info
    })
}

const sessionUpdate =(req,res)=>{
    const type = req.body.type;
    const value = req.body.value;
    if(type === 'sendReq' || type === 'receiveReq'){
        req.session.user.friendsReqs.push(value);
        req.session.save(()=>{res.sendStatus(200)})
    }else if(type === 'deleteReq' || type === 'rejectReq'){
        req.session.user.friendsReqs = req.session.user.friendsReqs.filter(freq=>{
            return String(freq.userId) !== String(value.userId)
        })
        req.session.save(()=>{res.sendStatus(200)})
    }else if(type === 'acceptReq'){
        req.session.user.friendsReqs = req.session.user.friendsReqs.filter(freq=>{
            return String(freq.userId) !== String(value.userId)
        })
        req.session.save(()=>{})
        req.session.user.friends.push(value);
        req.session.save(()=>{res.sendStatus(200)})
    }else if(type === 'unfriend'){
        req.session.user.friends = req.session.user.friends.filter(friend=>{
            return String(friend.userId) !== String(value.userId)
        })
        req.session.save(()=>{res.sendStatus(200)})
    }else if (type === 'addChatId') {
        req.session.user.chats.push({
            friendId:req.body.friendId,
            chatId:req.body.chatId
        })
        req.session.save(()=>{res.sendStatus(200)})
    }
    else return res.sendStatus(500);
}

// function for signup page
const getSignup =(req,res)=>{
    res.render('signup')
}

const postUser = (req, res, next) =>{
    createUser(req.body).then(()=>{
        res.redirect(301,'/login')
    }).catch(()=>{
        next({status:'500',msg:'Failed to create account'});
    })
}

let loginErr;
// functions for login page
const getLogin =(req,res)=>{
    res.render('login',{
        error: loginErr
    })
    loginErr = null;
}

const checkUser = (req, res, next) =>{
    const user = req.body;
    authUser(user).then(result=>{
        if(typeof result === 'string') {
            loginErr = result;
            res.redirect(301,'/login');
        }else {
            req.session.user = result;
            res.redirect(301,'/profile/'+result._id);
        }
    }).catch(()=>{
        next({status:'500'})
    })
}

// function for logout
const logout =(req, res) =>{
    const id = req.session.user._id;
    req.session.destroy(()=>{
        makeOffline(id);
        res.status(301).redirect('/login')
    })
}

const removeNotificatons = (req, res)=>{
    if(req.session.user.notifications.length){
        deleteNotificatons(req.session.user._id).then(()=>{
            req.session.user.notifications = [];
            res.sendStatus(200);
        }).catch(()=>{
            res.sendStatus(500);
        });
    }else res.sendStatus(404);
}

const storeMsg =async (senderId, receiverId, msg)=>{
    return await saveMsg(senderId, receiverId, msg).then(res=>{
        return res
    }).catch(()=>{
        throw 'internal server error'
    });
}

const getChatPage = (req, res, next) => {
    getMessages(req.params.id).then(msg=>{
    let friendId
        msg.usersIds.map(id=>{
            if(String(req.session.user._id) !== id)
                friendId = id;
        })
        res.render('messages',{user:req.session.user, friendId, chatId: req.params.id,messages: msg.messages})
    }).catch(()=>{
        next({status:'500'});
    })
}

const deleteMsg = (req, res, next)=>{
    deleteMsgdb({chatId:req.body.chatId, msgId:req.body.msgId}).then(()=>{
        res.redirect(302, '/chats/'+req.body.chatId)
    }).catch(()=>{
        next({status:'500'})
    })
}

const changeProfile = (req, res, next)=>{
    updateProfile({filename:req.file?.filename,...req.body}).then(values=>{
        if(values && Object.keys(values).length) req.session.user = {...req.session.user, ...values};
        req.session.save(()=>{
            res.redirect(302,'/')
        })
    }).catch(err=>{
        err? next({status:401, msg:err}) : next({status:500});
    })
}

export {
    getHome,
    getSignup,
    postUser,
    getUsers,
    getLogin,
    checkUser,
    logout,
    redirect,
    userProfile,
    sessionUpdate,
    removeNotificatons,
    storeMsg,
    getChatPage,
    changeProfile,
    deleteMsg
}