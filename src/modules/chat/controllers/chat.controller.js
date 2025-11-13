const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const User = require("../../auth/models/user.model");

// create or get conversation between two users
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId)
      return res
        .status(400)
        .json({ success: false, message: "otherUserId required" });

    // find existing convo with exactly these two participants (order independent)
    let convo = await Conversation.findOne({
      participants: { $all: [req.user.id, otherUserId], $size: 2 },
    }).populate("participants", "name profilePic role");

    if (!convo) {
      convo = await Conversation.create({
        participants: [req.user.id, otherUserId],
        unreadCounts: { [otherUserId]: 0, [req.user.id]: 0 },
      });
      convo = await Conversation.findById(convo._id).populate(
        "participants",
        "name profilePic role"
      );
    }

    res.json({ success: true, conversation: convo });
  } catch (err) {
    next(err);
  }
};

// list conversations for current user
exports.listConversations = async (req, res, next) => {
  try {
    const convos = await Conversation.find({ participants: req.user.id })
      .populate("participants", "name profilePic role")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name profilePic" },
      })
      .sort({ updatedAt: -1 });

  res.json({ success: true, conversations: convos });
  } catch (err) {
    next(err);
  }
};

// get messages for a conversation
exports.getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const convo = await Conversation.findById(id);
    if (!convo)
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });

    // ensure current user is a participant
    if (!convo.participants.map(String).includes(String(req.user.id))) {
      return res
        .status(403)
        .json({ success: false, message: "Not a participant" });
    }

    const messages = await Message.find({ conversation: id })
      .populate("sender", "name profilePic")
      .sort({ createdAt: 1 });

    // mark unread -> add current user to readBy for any unread messages
    await Message.updateMany(
      { conversation: id, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );

    // reset unread count for this user
    convo.unreadCounts.set(String(req.user.id), 0);
    await convo.save();

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

// send a message to conversation
exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params; // conversation id
    const { text } = req.body;
    const convo = await Conversation.findById(id);
    if (!convo)
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });

    if (!convo.participants.map(String).includes(String(req.user.id))) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // handle attachments if using multer/cloudinary: req.files etc. (left simple)
    const attachments = []; // extend if needed

    const message = await Message.create({
      conversation: id,
      sender: req.user.id,
      text: text || "",
      attachments,
      readBy: [req.user.id], // sender has read it
    });

    convo.lastMessage = message._id;

    // increment unread for all other participants
    convo.participants.forEach((p) => {
      const pid = String(p);
      if (pid !== String(req.user.id)) {
        const prev = convo.unreadCounts.get(pid) || 0;
        convo.unreadCounts.set(pid, prev + 1);
      }
    });

    await convo.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name profilePic"
    );

    // Emit socket events to participants (controller attached to app has io)
    const io = req.app.get("io");
    convo.participants.forEach((p) => {
      io.to(String(p)).emit("newMessage", {
        conversationId: String(convo._id),
        message: populatedMessage,
      });
      // optional: send a notification event
      if (String(p) !== String(req.user.id)) {
        io.to(String(p)).emit("notification", {
          type: "message",
          conversationId: String(convo._id),
          from: { _id: req.user.id, name: req.user.name },
          text: text?.slice(0, 120),
        });
      }
    });

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (err) {
    next(err);
  }
};
