import express from 'express';
import http from 'http'
import {Server} from 'socket.io'
import session from 'express-session';
import {default as connectMongoDBSession} from 'connect-mongodb-session'
import {isLoggedIn} from './middlewares/isLoggedIn.js'
import rootRouter from './routes/root.js'
import {
    remove,
    pullReq,
    acceptReq,
    rejectReq,
    add,
    storeNewMsgNotify
} from './controllers/user.js'
import {storeMsg} from './controllers/root.js';
import mongoose from 'mongoose';
mongoose.set('strictQuery', false);

const MongoDBStore = connectMongoDBSession(session)
const STRORE = new MongoDBStore({
    uri:"mongodb+srv://AhmedMagdy:1YLcRgPR4L0fPQzW@cluster0.kbcoecs.mongodb.net/chatting-web?retryWrites=true&w=majority",
    collection:'sessions'
})

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const io = new Server(server);

app.use(session({
    secret:'856a68f543db2fc9ed5a298876b9b61efc1835440aa358555afa37742caf499b325cb4212abe45f417a9c208e7b663be4c9967d9cd97d1e6a51f4976e6a81834',
    resave:false,
    saveUninitialized:false,
    store: STRORE
}))
app.use(express.static('assets'))
app.use(express.static('assets/images'))
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.set('view engine','pug')
app.set('views','./views')
app.use(isLoggedIn)

io.onlineUsers = {}

io.on('connection', socket=>{

    socket.on('makeRoom',id=>{
        socket.join(id);
    })

    socket.on('refrechOnlines',()=>{
        io.emit('onlineUsers',io.onlineUsers)
    })

    socket.on('makeOnline',id=>{
        io.onlineUsers[id] = true;
        socket.on("disconnect",()=>{
            io.onlineUsers[id] = false;
            io.emit('onlineUsers',io.onlineUsers)
        })
        io.emit('onlineUsers',io.onlineUsers)
    })

    socket.on("send-add-friend-Notify", (friend, me)=>{
        add(io, friend, me);
    })
    socket.on("send-accept-Notify", (friend, me)=>{
        acceptReq(io, friend, me)
    })
    socket.on("send-reject-Notify", (friend, me)=>{
        rejectReq(io, friend, me)
    })
    socket.on("send-unfriend-Notify", (friend, me)=>{
        remove(io, friend, me)
    })
    socket.on("send-cancel-req-Notify", (friend, me)=>{
        pullReq(io, friend, me)
    })
    socket.on('sendMsg',async (sender, receiverId, msg)=>{
        storeMsg(sender._id, receiverId, msg).then(res=>{
            io.onlineUsers[receiverId]?
                io.to(receiverId).emit("receiveMsg", sender, res.msg, res.chatId)
                :
                storeNewMsgNotify(sender, receiverId, msg).catch(()=>{});
            io.to(sender._id).emit("receiveMsg", null, res.msg, res.chatId)
        }).catch(err=>{
            io.to(sender._id).emit('notify',err)
        });
    })
})

app.use('/',rootRouter)

app.use((err, req, res, next)=>{
    if(err.status === '404') res.status(404).render("error",{user:res.session?.user, err:'404'})
    else if(err.status === '500') res.status(500).render("error",{user:res.session?.user, err:{status:'500', msg: err.msg? err.msg : 'Internal server error'}})
    else {
        res.status(isNaN(parseInt(err.status)) ? 500 : parseInt(err.status)).render("error",{user:res.session?.user, err:{...err}})
    }
})

app.all('/*',(req,res,next)=>{next({status:'404'})})

server.listen(port,err=>{
    err? next({status:'500'}) :
    console.log('server run on port '+port );
})