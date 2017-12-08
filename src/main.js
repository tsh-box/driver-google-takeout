/*jshint esversion: 6 */
const https = require('https');
const express = require("express");
const databox = require('node-databox');
const bodyParser = require('body-parser');
const fs = require('fs');

//Databox Env Vars
const DATABOX_ZMQ_ENDPOINT = process.env.DATABOX_ZMQ_ENDPOINT

let tsc = databox.NewTimeSeriesClient(DATABOX_ZMQ_ENDPOINT, false);

const credentials = databox.getHttpsCredentials();

const PORT = process.env.port || '8080';

const save = (datasourceid,data) => {
  return tsc.WriteAt(datasourceid, data.timestamp, data);
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

    //
    // The ZMQ lib id blocking so we must wait for promises to resolve before writing to the store.
    // see https://github.com/Toshbrown/nodeZestClient/issues/1 for more info.
    //
    /*let proms = req.body.map((data) => {
      data.timestamp = parseInt(data.time_usec/1000);
      return save('googleBrowsingHistory',data);
    });

    Promise.all(proms)
    .then(()=>{
      res.send({status:'success', msg:"done"});
    })
    .catch((err)=>{
      console.warn("Error writing to store ",err);
      res.send({status:'Error', msg:"done"});
    });*/

    //This solution works but is very verbose and fiddly!!
    let writeAndWait = (data,resolve,reject) => {
      if (data.length === 0) {
        resolve();
        return;
      }
      let d = data.shift();
      d.timestamp = parseInt(d.time_usec/1000);
      save('googleBrowsingHistory',d)
      .then(()=>{
        writeAndWait(data,resolve,reject);
      })
      .catch((err)=>{
        reject(err);
        return;
      });
    };

    let prom = (data) => {
      return new Promise((resolve, reject) => {
        writeAndWait(data,resolve,reject);
      });
    };

    prom(req.body)
    .then(()=>{
      res.send({status:'success', msg:"done"});
    })
    .catch((err)=>{
      res.send({status:'error', msg:err});
    });


});

app.post('/ui/uploadLocationHistory', function(req, res) {
    if(!req.body) {
      res.status(400).send({status:'error', msg:"Invalid format"});
      return;
    }

    //
    // The ZMQ lib id blocking so we must wait for promises to resolve before writing to the store.
    // see https://github.com/Toshbrown/nodeZestClient/issues/1 for more info.
    //
    /*let proms = req.body.map((data) => {
      data.timestamp = parseInt(data.timestampMs/1000);
      return save('googleLocationHistory',data);
    });

    Promise.all(proms)
    .then(()=>{
      res.send({status:'success', msg:"done"});
    })
    .catch((err)=>{
      console.warn("Error writing to store ",err);
      res.send({status:'Error', msg:"done"});
    });*/

    //This solution works but is very verbose and fiddly!!
    let writeAndWait = (data,resolve,reject) => {
      if (data.length === 0) {
        resolve();
        return;
      }
      let d = data.shift();
      d.timestamp = parseInt(d.timestampMs/1000);
      save('googleLocationHistory',d)
      .then(()=>{
        writeAndWait(data,resolve,reject);
      })
      .catch((err)=>{
        reject(err);
        return;
      });
    };

    let prom = (data) => {
      return new Promise((resolve, reject) => {
        writeAndWait(data,resolve,reject);
      });
    };

    prom(req.body)
    .then(()=>{
      res.send({status:'success', msg:"done"});
    })
    .catch((err)=>{
      res.send({status:'error', msg:err});
    });


});

app.get("/status", function(req, res) {
    res.send("active");
});


  Promise.resolve()
  .then(() => {
    //register datasources
    proms = [
      tsc.RegisterDatasource({
        Description: 'Google takeout browsing history',
        ContentType: 'text/json',
        Vendor: 'Google',
        DataSourceType: 'googleBrowsingHistory',
        DataSourceID: 'googleBrowsingHistory',
        StoreType: 'ts'
      }),
      tsc.RegisterDatasource({
        Description: 'Google takeout location history',
        ContentType: 'text/json',
        Vendor: 'Google',
        DataSourceType: 'googleLocationHistory',
        DataSourceID: 'googleLocationHistory',
        StoreType: 'ts'
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
