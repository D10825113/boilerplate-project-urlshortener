require('dotenv').config();//just to load the env variables
const mongoose = require("mongoose");
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const contactSchema = {
  email: String,
  query: String,
}; 
const Contact = mongoose.model("Contact", contactSchema);

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//create a new URL Schema
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true }
});

//create a new URL model
const Url = mongoose.model('URL', urlSchema);

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

app.post('/api/shorturl', async function(req, res) {
  const original_url = req.body.url;

  // 檢查 URL 是否存在
  if (!original_url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  // 定義協議正則表達式
  const protocol = /^https?:\/\//i;
  if (!protocol.test(original_url) || !isValidUrl(original_url)) {
    return res.status(200).json({ error: 'Invalid URL' });}
  // 去除協議部分
  const short_url = generateRandomString(5);

  try {
    // 創建一個新的 Url 文檔
    const urlDoc = new Url({ original_url, short_url });

    // 保存文檔到 MongoDB
    await urlDoc.save();

    // 返回結果
    res.json({ original_url, short_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while saving the URL' });
  }
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  try {
    const doc = await Url.findOne({ short_url: req.params.short_url });
    
    if (!doc) {
      return res.status(404).send('URL not found');
    }
    
    // 查找到文檔，重定向到原始 URL
    res.redirect(doc.original_url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
