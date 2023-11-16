require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const dns = require('node:dns');
const urlParser = require('url-parse');

const urlSchema = new mongoose.Schema({
  originUrl: {
    type: String
  },
  shortUrl: {
    type: Number,
    unique: true
  },
})
let url = mongoose.model('url', urlSchema)


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Basic Configuration
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"));
const port = process.env.PORT || 3000;

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

app.get('/api/shorturl/:url', async function (req, res) {
  let sUrl = await url.findOne({ shortUrl: req.params.url })
  console.log(sUrl)
  return res.redirect(sUrl.originUrl)
})

app.post('/api/shorturl', async function (req, res) {
  let urlDns = urlParser(req.body.url)
  dns.lookup(urlDns.hostname, async (err, addresses) => {
    if (!addresses) {
      res.json({ error: 'invalid url' })
    } else {
      // const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
      // if (urlRegex.test(req.body.url)) {
      //   let eUrl = await url.findOne({ originUrl: req.body.url })
      //   if (eUrl) {
      //     console.log(eUrl)
      //     return res.json({ original_url: eUrl.originUrl, short_url: eUrl.shortUrl })
      //   }
      let counter = await url.estimatedDocumentCount();
      let bodyUrl = new url({ originUrl: req.body.url, shortUrl: counter + 1 })
      bodyUrl.save().then((err) => {
        if (err) {
          console.log(err)
        }
        console.log('se guardo la url')
        console.log(bodyUrl)
        res.json({ original_url: `${bodyUrl.originUrl}`, short_url: bodyUrl.shortUrl })
      })
    }
  })
});


