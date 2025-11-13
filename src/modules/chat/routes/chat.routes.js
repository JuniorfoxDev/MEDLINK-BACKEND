const express = require("express");
const router = express.Router();
const chatCtrl = require("../controllers/chat.controller");
const auth = require("../../../middlewares/auth.middleware");

// create / get conv between two users
router.post("/conversations", auth, chatCtrl.getOrCreateConversation);

// list convos for current user
router.get("/conversations", auth, chatCtrl.listConversations);

// get messages
router.get("/messages/:id", auth, chatCtrl.getMessages);

// send message to conversation
router.post("/messages/:id", auth, chatCtrl.sendMessage);

module.exports = router;
