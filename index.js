'use strict';
const path = require('path')
var Stream = require('stream').Transform;
var express = require('express');
var multer = require('multer');
const vcapServices = require('vcap_services');
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



const AuthorizationV1 = require('ibm-watson/authorization/v1');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');

const sttCredentials = Object.assign(
  {
    iam_apikey: process.env.SPEECH_TO_TEXT_IAM_APIKEY, // if using an RC service
    url: process.env.SPEECH_TO_TEXT_URL ? process.env.SPEECH_TO_TEXT_URL : SpeechToTextV1.URL
  },
  vcapServices.getCredentials('speech_to_text') // pulls credentials from environment in bluemix, otherwise returns {}
);

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

  //Begin speech to text


  

  let speechToText;
  if (process.env.SPPECH_TO_TEXT_IAM_APIKEY && process.env.SPPECH_TO_TEXT_URL !== '') {
    speechToText = new SpeechToTextV1({
    url: process.env.SPPECH_TO_TEXT_URL || 'https://stream.watsonplatform.net/speech-to-text/api/',
    iam_apikey: process.env.SPPECH_TO_TEXT_IAM_APIKEY || '<iam_apikey>',
    iam_url: 'https://iam.bluemix.net/identity/token',
  });
} else {
  speechToText = new SpeechToTextV1({
    url: process.env.SPPECH_TO_TEXT_URL || 'https://stream.watsonplatform.net/speech-to-text/api/',
    username: process.env.TEXT_TO_SPEECH_USERNAME || '<username>',
    password: process.env.TEXT_TO_SPEECH_PASSWORD || '<password>',
  });
  
  }

  const params = {
    // From file
    model: 'en-US_BroadbandModel',
    content_type : 'audio/mp3',
    audio: fs.createReadStream('./public/waves/1570814035961.mp3')
  };
   
  // speechToText.recognize(params,function (error, transcript) {
  //   if (error)
  //        console.log('Error:', error);
  //   else
  //      console.log(transcript.results[0].alternatives[0].transcript);
  //    })
  //End speech to text



const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
const toneAnalyzer = new ToneAnalyzerV3({
  version: '2017-09-21',
  iam_apikey: process.env.TONE_ANALYZER_IAM_APIKEY || '<iam_apikey>',
  url: 'https://gateway-lon.watsonplatform.net/tone-analyzer/api'
});


app.post('/toneanalyzer', function(req,res){
  let text = req.body.source
  

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


app.post('/nlu', function(req,resp){
  let text = req.body.source
  var options = {
    text: text,
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


  app.use('/api/speech-to-text/token', function(req, res) {
    const sttAuthService = new AuthorizationV1(sttCredentials);
    sttAuthService.getToken(function(err, response) {
      if (err) {
        console.log('Error retrieving token: ', err);
        res.status(500).send('Error retrieving token');
        return;
      }
      const token = response.token || response;
      if (process.env.SPEECH_TO_TEXT_IAM_APIKEY) {
        res.json({ accessToken: token, url: sttCredentials.url });
      } else {
        res.json({ token: token, url: sttCredentials.url });
      }
    });
  });

  
  app.post('/lt', function(req,res){
    let source = req.body.source;
    let from = req.body.from;
    let to = req.body.to;
    console.log(source)
    const params = {
      text: source,
      source: from,
      target: to,
    }
    res.setHeader('Content-Type', 'application/json');
    
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

   console.log(req.file.path);

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



    app.post('/stt', uploading.single('audio'),function(req, res) {

        const params = {
          // From file
          model: 'en-US_BroadbandModel',
          content_type : 'audio/mp3',
          audio: fs.createReadStream(req.file.path)
        };
         
        speechToText.recognize(params,function (error, transcript) {
          if (error)
               res.send('Error:', error);
          else
            //  res.send(transcript.results[0].alternatives[0].transcript);
             res.send(JSON.stringify(transcript.results[0],null,2));
           })

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