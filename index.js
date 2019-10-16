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


const { IamAuthenticator } = require('ibm-watson/auth');
  const PersonalityInsightsV3 = require('ibm-watson/personality-insights/v3');

  
  const personalityInsights = new PersonalityInsightsV3({
    authenticator: new IamAuthenticator({ apikey: process.env.P_INSIGHTS_IAM_APIKEY }),
    version: '2016-10-19',
    url: process.env.P_INSIGHTS_URL  || 'https://gateway.watsonplatform.net/personality-insights/api/'
  });
  /*
  personalityInsights.profile(
    {
      content: 'Enter more than 100 unique words here...',
      contentType: 'text/plain',
      consumptionPreferences: true
    })
    .then(response => {
      console.log(JSON.stringify(response.result, null, 2));
    })
    .catch(err => {
      console.log('error: ', err);
    });
*/


//const AuthorizationV1 = require('ibm-watson/authorization/v1');





const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
 
const textToSpeech = new TextToSpeechV1({
  authenticator: new IamAuthenticator({ apikey: process.env.TEXT_TO_SPEECH_IAM_APIKEY }),
  url: process.env.TEXT_TO_SPEECH_URL || 'https://gateway-wdc.watsonplatform.net/text-to-speech/api',
});
  //Begin speech to text


  

  

  const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
  
  
  const speechToText = new SpeechToTextV1({
    authenticator: new IamAuthenticator({ apikey: process.env.SPPECH_TO_TEXT_IAM_APIKEY }),
    url: process.env.SPPECH_TO_TEXT_URL || 'https://stream.watsonplatform.net/speech-to-text/api/'
  });


   
  // speechToText.recognize(params,function (error, transcript) {
  //   if (error)
  //        console.log('Error:', error);
  //   else
  //      console.log(transcript.results[0].alternatives[0].transcript);
  //    })
  //End speech to text



// const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
// const toneAnalyzer = new ToneAnalyzerV3({
//   version: '2017-09-21',
//   iam_apikey: process.env.TONE_ANALYZER_IAM_APIKEY,
//   url: 'https://gateway.watsonplatform.net/tone-analyzer/api/'
// });

const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');

 
const toneAnalyzer = new ToneAnalyzerV3({
  authenticator: new IamAuthenticator({ apikey: process.env.TONE_ANALYZER_IAM_APIKEY }),
  version: '2017-09-21',
  url: 'https://gateway.watsonplatform.net/tone-analyzer/api/'
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
  
  const nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({ apikey: process.env.NATURAL_LANGUAGE_IAM_APIKEY }),
    version: '2018-04-05',
    url: process.env.NATURAL_LANGUAGE_URL || 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
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
  authenticator: new IamAuthenticator({ apikey: process.env.LT_IAM_APIKEY }),
  url: process.env.LT_URL || 'https://gateway.watsonplatform.net/language-translator/api/',
  version: '2019-01-10'
});
  // console.log(languageTranslator)


  

  
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


 
  const VisualRecognitionV3 = require('ibm-watson/visual-recognition/v3');
 
  const visualRecognition = new VisualRecognitionV3({
    url: process.env.VISUAL_RECOGNITION_URL,
    version: '2018-03-19',
    authenticator: new IamAuthenticator({ apikey: process.env.VISUAL_RECOGNITION_IAM_APIKEY })
  });
 

 
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
  console.log('params ' + params)
    visualRecognition.classify(params)
    .then(result => {
      //res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(result, null, 2));
      
    })
    .catch(err => {
      console.log('err');
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
    // const synthesizeParams = {
    //   text: req.body.text,
    //   accept: 'audio/mp3',
    //   voice: req.body.name,
    // };
    
    const synthesizeParams = {
      text: 'Hello world',
      accept: 'audio/wav',
      voice: 'en-US_AllisonVoice',
    };
    
    textToSpeech.synthesize(synthesizeParams, function(err, audio) {
      if (err) {
        console.log(err);
        return;
      }
      textToSpeech.repairWavHeader(audio);
      fs.writeFileSync('audio.wav', audio);
      console.log('audio.wav written with a corrected wav header');
    })
  // .then(audio => {
  //   audio.pipe(fs.createWriteStream('hello_world.wav'));
  // })
  // .catch(err => {
  //   console.log('error:', err);
  // });
      // .then(response => {
      //   console.log(response)
      //   const audio = response.result;
      //   return textToSpeech.repairWavHeaderStream(audio);
      // })
      // .then(repairedFile => {
      //   fs.writeFileSync('audio.wav', audio);
      //   console.log('audio.wav written with a corrected wav header');
      // })
      // .catch(err => {
      //   console.log(err);
      // });
    
  });

  

app.listen(8088);

console.log("server started...")