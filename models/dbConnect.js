import mongoose from "mongoose";

export default cb=>{
    return new Promise(async (resolve, reject)=>{
        await mongoose.connect('mongodb+srv://AhmedMagdy:1YLcRgPR4L0fPQzW@cluster0.kbcoecs.mongodb.net/chatting-web?retryWrites=true&w=majority')
        .then(()=>{
            return cb()
            .then( resalt =>{
                resalt? resolve(resalt) : resolve();
            }).catch(err=>{
                err? reject(err) : reject()
            })
        })
        .catch(err=>{
            err? reject(err) : reject()
        })
        // mongoose.disconnect();
    })
}