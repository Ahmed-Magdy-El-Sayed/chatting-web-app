import express  from "express";
import {
    remove,
    pullReq,
    acceptReq,
    rejectReq,
    add
} from '../controllers/user.js'
const router = express.Router();

router.post('/remove-friend',remove)
router.post('/pull-req',pullReq)
router.post('/accept-req',acceptReq)
router.post('/reject-req',rejectReq)
router.post('/add-friend',add)

export default router;