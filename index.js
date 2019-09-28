'use strict';
const path = require('path')
var express = require('express');
var multer = require('multer');
require('dotenv').config()
var fs = require('fs');
const bodyParser = require('body-parser');
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, path.basename(file.originalname, path.extname(file.originalname)) + path.extname(file.originalname)) //Appending extension
  }
})

var uploading = multer({ storage: storage })




var TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
let textToSpeech;

if (process.env.TEXT_TO_SPEECH_IAM_APIKEY && process.env.TEXT_TO_SPEECH_IAM_APIKEY !== '') {
    textToSpeech = new TextToSpeechV1({
    url: process.env.TEXT_TO_SPEECH_URL || 'https://stream.watsonplatform.net/text-to-speech/api',
    iam_apikey: process.env.TEXT_TO_SPEECH_IAM_APIKEY || '<iam_apikey>',
    iam_url: 'https://iam.bluemix.net/identity/token',
  });
} else {
  textToSpeech = new TextToSpeechV1({
    url: process.env.TEXT_TO_SPEECH_URL || 'https://stream.watsonplatform.net/text-to-speech/api',
    username: process.env.TEXT_TO_SPEECH_USERNAME || '<username>',
    password: process.env.TEXT_TO_SPEECH_PASSWORD || '<password>',
  });

}



const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
const toneAnalyzer = new ToneAnalyzerV3({
  version: '2017-09-21',
  iam_apikey: process.env.TONE_ANALYZER_IAM_APIKEY || '<iam_apikey>',
  url: 'https://gateway-lon.watsonplatform.net/tone-analyzer/api'
});


app.get('/toneanalyzer', function(req,res){
  const text = 'Team, I know that times are tough! Product '
  + 'sales have been disappointing for the past three '
  + 'quarters. We have a competitive product, but we '
  + 'need to do a better job of selling it!';

  const toneParams = {
    tone_input: { 'text': text },
    content_type: 'application/json',
  };

  toneAnalyzer.tone(toneParams)
    .then(toneAnalysis => {
      // console.log(JSON.stringify(toneAnalysis, null, 2));
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(toneAnalysis, null, 2))
    })
    .catch(err => {
      console.log('error:', err);
    });
})


  var NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js');
  var nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: process.env.NATURAL_LANGUAGE_IAM_APIKEY || '<iam_apikey>',
    version: '2018-04-05',
    url: process.env.NATURAL_LANGUAGE_URL || 'https://gateway.watsonplatform.net/natural-language-understanding/api/',
  });


app.get('/nlu', function(req,resp){
  var options = {
    text: `In the rugged Colorado Desert of California, there lies buried a treasure ship sailed there hundreds of years ago by either Viking or Spanish explorers. Some say this is legend; others insist it is fact. A few have even claimed to have seen the ship, its wooden remains poking through the sand like the skeleton of a prehistoric beast. Among those who say they’ve come close to the ship is small-town librarian Myrtle Botts. In 1933, she was hiking with her husband in the Anza-Borrego Desert, not far from the border with Mexico. It was early March, so the desert would have been in bloom, its washed-out yellows and grays beaten back by the riotous invasion of wildflowers. Those wildflowers were what brought the Bottses to the desert, and they ended up near a tiny settlement called Agua Caliente. Surrounding place names reflected the strangeness and severity of the land: Moonlight Canyon, Hellhole Canyon, Indian Gorge. To enter the desert is to succumb to the unknowable. One morning, a prospector appeared in the couple’s camp with news far more astonishing than a new species of desert flora: He’d found a ship lodged in the rocky face of Canebrake Canyon. The vessel was made of wood, and there was a serpentine figure carved into its prow. There were also impressions on its flanks where shields had been attached—all the hallmarks of a Viking craft. Recounting the episode later, Botts said she and her husband saw the ship but couldn’t reach it, so they vowed to return the following day, better prepared for a rugged hike. That wasn’t to be, because, several hours later, there was a 6.4 magnitude earthquake in the waters off Huntington Beach, in Southern California. Botts claimed it dislodged rocks that buried her Viking ship, which she never saw again.There are reasons to doubt her story, yet it is only one of many about sightings of the desert ship. By the time Myrtle and her husband had set out to explore, amid the blooming poppies and evening primrose, the story of the lost desert ship was already about 60 years old. By the time I heard it, while working on a story about desert conservation, it had been nearly a century and a half since explorer Albert S. Evans had published the first account. Traveling to San Bernardino, Evans came into a valley that was “the grim and silent ghost of a dead sea,” presumably Lake Cahuilla. “The moon threw a track of shimmering light,” he wrote, directly upon “the wreck of a gallant ship, which may have gone down there centuries ago.” The route Evans took came nowhere near Canebrake Canyon, and the ship Evans claimed to see was Spanish, not Norse. Others have also seen this vessel, but much farther south, in Baja California, Mexico. Like all great legends, the desert ship is immune to its contradictions: It is fake news for the romantic soul, offering passage into some ancient American dreamtime when blood and gold were the main currencies of civic life. The legend does seem, prima facie, bonkers: a craft loaded with untold riches, sailed by early-European explorers into a vast lake that once stretched over much of inland Southern California, then run aground, abandoned by its crew and covered over by centuries of sand and rock and creosote bush as that lake dried out…and now it lies a few feet below the surface, in sight of the chicken-wire fence at the back of the Desert Dunes motel, $58 a night and HBO in most rooms. Totally insane, right? Let us slink back to our cubicles and never speak of the desert ship again. Let us only believe that which is shared with us on Facebook. Let us banish forever all traces of wonder from our lives. Yet there are believers who insist that, using recent advances in archaeology, the ship can be found. They point, for example, to a wooden sloop from the 1770s unearthed during excavations at the World Trade Center site in lower Manhattan, or the more than 40 ships, dating back perhaps 800 years, discovered in the Black Sea earlier this year.
    `,
    features: {
      sentiment : {},
      emotion: {},
      keywords: {},
      entities : {},
      categories: {},
      concepts: {},
      syntax : {},
      semantic_roles : {},
    }
  };
  nlu.analyze(options, function(err, res) {
    if (err) {
      resp.send(err)
      return;
    }
    resp.setHeader('Content-Type', 'application/json');
    resp.send(res)
    // console.log(res);
  });
})




const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const languageTranslator = new LanguageTranslatorV3({
  url: process.env.LT_URL || 'https://stream.watsonplatform.net/text-to-speech/api',
  iam_apikey: process.env.LT_IAM_APIKEY || '<iam_apikey>',
  iam_url: 'https://iam.bluemix.net/identity/token',
  version: '2019-01-10'
});
  

  // console.log(languageTranslator)

  app.get('/lt', function(req,res){
    res.setHeader('Content-Type', 'application/json');
    const params = {
      text: "In the rugged Colorado Desert of California, there lies buried a treasure ship sailed there hundreds of years ago by either Viking or Spanish explorers. Some say this is legend; others insist it is fact. A few have even claimed to have seen the ship, its wooden remains poking through the sand like the skeleton of a prehistoric beast. Among those who say they’ve come close to the ship is small-town librarian Myrtle Botts. In 1933, she was hiking with her husband in the Anza-Borrego Desert, not far from the border with Mexico. It was early March, so the desert would have been in bloom, its washed-out yellows and grays beaten back by the riotous invasion of wildflowers. Those wildflowers were what brought the Bottses to the desert, and they ended up near a tiny settlement called Agua Caliente. Surrounding place names reflected the strangeness and severity of the land: Moonlight Canyon, Hellhole Canyon, Indian Gorge. To enter the desert is to succumb to the unknowable. One morning, a prospector appeared in the couple’s camp with news far more astonishing than a new species of desert flora: He’d found a ship lodged in the rocky face of Canebrake Canyon. The vessel was made of wood, and there was a serpentine figure carved into its prow. There were also impressions on its flanks where shields had been attached—all the hallmarks of a Viking craft. Recounting the episode later, Botts said she and her husband saw the ship but couldn’t reach it, so they vowed to return the following day, better prepared for a rugged hike. That wasn’t to be, because, several hours later, there was a 6.4 magnitude earthquake in the waters off Huntington Beach, in Southern California. Botts claimed it dislodged rocks that buried her Viking ship, which she never saw again.There are reasons to doubt her story, yet it is only one of many about sightings of the desert ship. By the time Myrtle and her husband had set out to explore, amid the blooming poppies and evening primrose, the story of the lost desert ship was already about 60 years old. By the time I heard it, while working on a story about desert conservation, it had been nearly a century and a half since explorer Albert S. Evans had published the first account. Traveling to San Bernardino, Evans came into a valley that was “the grim and silent ghost of a dead sea,” presumably Lake Cahuilla. “The moon threw a track of shimmering light,” he wrote, directly upon “the wreck of a gallant ship, which may have gone down there centuries ago.” The route Evans took came nowhere near Canebrake Canyon, and the ship Evans claimed to see was Spanish, not Norse. Others have also seen this vessel, but much farther south, in Baja California, Mexico. Like all great legends, the desert ship is immune to its contradictions: It is fake news for the romantic soul, offering passage into some ancient American dreamtime when blood and gold were the main currencies of civic life. The legend does seem, prima facie, bonkers: a craft loaded with untold riches, sailed by early-European explorers into a vast lake that once stretched over much of inland Southern California, then run aground, abandoned by its crew and covered over by centuries of sand and rock and creosote bush as that lake dried out…and now it lies a few feet below the surface, in sight of the chicken-wire fence at the back of the Desert Dunes motel, $58 a night and HBO in most rooms. Totally insane, right? Let us slink back to our cubicles and never speak of the desert ship again. Let us only believe that which is shared with us on Facebook. Let us banish forever all traces of wonder from our lives. Yet there are believers who insist that, using recent advances in archaeology, the ship can be found. They point, for example, to a wooden sloop from the 1770s unearthed during excavations at the World Trade Center site in lower Manhattan, or the more than 40 ships, dating back perhaps 800 years, discovered in the Black Sea earlier this year.",
      source: 'en',
      target: 'fr',
    }
    
    // return the body - primary use case
    
    languageTranslator.translate(params)
      .then(body => {
        res.send(JSON.stringify(body, null, 2));

      })
      .catch(err => {
        console.log(err);
      });

  
  })

  var VisualRecognitionV3 = require('ibm-watson/visual-recognition/v3');

  let visualRecognition;

  if (process.env.VISUAL_RECOGNITION_IAM_APIKEY && process.env.VISUAL_RECOGNITION_IAM_APIKEY !== '') {
      visualRecognition = new VisualRecognitionV3({
      url: process.env.VISUAL_RECOGNITION_URL || 'https://stream.watsonplatform.net/text-to-speech/api',
      version: '2018-03-19',
      iam_apikey: process.env.VISUAL_RECOGNITION_IAM_APIKEY || '<iam_apikey>',
      iam_url: 'https://iam.bluemix.net/identity/token',
    });
  } else {
    visualRecognition = new VisualRecognitionV3({
      url: process.env.VISUAL_RECOGNITION_URL || 'https://stream.watsonplatform.net/text-to-speech/api',
      username: process.env.VISUAL_RECOGNITION_USERNAME || '<username>',
      password: process.env.VISUAL_RECOGNITION_PASSWORD || '<password>',
    });
  
  }

 

 
app.get('/getvoicedetails/:name',function(req, res){
  let name = req.params.name;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Accept', 'application/json');
  textToSpeech.getVoice(
    {
      voice: name
    },
    function(err, result) {
      if (err) {
        return console.log(err);
      }
      res.send(JSON.stringify(result, null, 2));
    }
  );

})

app.get('/getvoices', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Accept', 'application/json');
  textToSpeech.listVoices({}, function(err, result) {
    if (err) {
      return console.log(err);
    }
    res.send(JSON.stringify(result, null, 2));
    
  });
})



app.post('/upload', uploading.single('image'),function(req, res) {

  // console.log(req.file);

  var params = {
    images_file: fs.createReadStream(req.file.path)
  };
    visualRecognition.classify(params)
    .then(result => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(result, null, 2));
      
    })
    .catch(err => {
      console.log(err);
    });
})


  
    
  app.post('/synthesize', function(req, res) {
    console.log(req.body.name)
    const synthesizeParams = {
      text: req.body.text,
      accept: 'audio/mp3',
      voice: req.body.name,
    };
    
    textToSpeech.synthesize(synthesizeParams)
      .then(audio => {
        const filename = new Date().getTime()+'.mp3';
        audio.pipe(fs.createWriteStream('./public/waves/'+filename));
        res.setHeader('Content-Type', 'Application/json');
        res.send(JSON.stringify ({ 'filename' : filename}));
      })
      .catch(err => {
        console.log('error:', err);
      });
    
  });

  

app.listen(8088);

console.log("server started...")