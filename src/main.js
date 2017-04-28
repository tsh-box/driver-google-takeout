/*jshint esversion: 6 */
const https = require('https');
const express = require("express");
const databox = require('node-databox');
const bodyParser = require('body-parser');

//Databox Env Vars
const DATABOX_STORE_BLOB_ENDPOINT = process.env.DATABOX_DRIVER_GOOGLE_TAKEOUT_DATABOX_STORE_BLOB_MONGO_ENDPOINT;
const HTTPS_SERVER_CERT = process.env.HTTPS_SERVER_CERT || '';
const HTTPS_SERVER_PRIVATE_KEY = process.env.HTTPS_SERVER_PRIVATE_KEY || '';
const credentials = {
	key:  HTTPS_SERVER_PRIVATE_KEY,
	cert: HTTPS_SERVER_CERT,
};
const PORT = process.env.port || '8080';

const save = (datasourceid,data) => {
  return databox.timeseries.write(DATABOX_STORE_BLOB_ENDPOINT, datasourceid, data);
};

var app = express();

app.use(bodyParser.json({limit:"1mb"}));

app.use('/ui', express.static('./src/www'));
app.set('views', './src/views');
app.set('view engine', 'pug');

app.get('/ui', function(req, res) {
  
    console.log("[/ui render]");   
    res.render('index', {});
    
});

app.post('/ui/uploadBrowsingHistory', function(req, res) {
    if(!req.body) {
      res.status(400).send({status:'error', msg:"Invalid format"});
      return;
    }

    let proms = req.body.map((data) => {
      data.timestamp = parseInt(data.time_usec/1000);
      return save('googleBrowsingHistory',data);
    });
    
    Promise.all(proms)
    .then(()=>{
      res.send({status:'success', msg:"done"});
    });
    
});

app.post('/ui/uploadLocationHistory', function(req, res) {
    if(!req.body) {
      res.status(400).send({status:'error', msg:"Invalid format"});
      return;
    }

    let proms = req.body.map((data) => {
      data.timestamp = parseInt(data.timestampMs/1000);
      return save('googleLocationHistory',data);
    });
    
    Promise.all(proms)
    .then(()=>{
      res.send({status:'success', msg:"done"});
    });
});

app.get("/status", function(req, res) {
    res.send("active");
});


  databox.waitForStoreStatus(DATABOX_STORE_BLOB_ENDPOINT,'active',10)
  .then(() => {
    //register datasources
    proms = [
      databox.catalog.registerDatasource(DATABOX_STORE_BLOB_ENDPOINT, {
        description: 'Google takeout browsing history',
        contentType: 'text/json',
        vendor: 'Google',
        type: 'googleBrowsingHistory',
        datasourceid: 'googleBrowsingHistory',
        storeType: 'databox-store-blob'
      }),
      databox.catalog.registerDatasource(DATABOX_STORE_BLOB_ENDPOINT, {
        description: 'Google takeout location history',
        contentType: 'text/json',
        vendor: 'Google',
        type: 'googleLocationHistory',
        datasourceid: 'googleLocationHistory',
        storeType: 'databox-store-blob'
      })
    ];
    
    return Promise.all(proms);
  })
  .then(()=>{
    console.log("[Creating server]");
    const server = https.createServer(credentials, app).listen(PORT);
  })
  .catch((err) => {
    console.log("[ERROR]",err);
  });

module.exports = app;


