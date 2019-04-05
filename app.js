const express = require('express');
const fs = require('fs');
const bodyparser = require('body-parser');
const cors = require('cors');
const request = require('request');
const rp = require('request-promise');
const google_config = require('./config/key');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'output.csv',
  header: [
    { id: 'userName', title: 'UserName' },
    { id: 'date', title: 'Date' },
    { id: 'starRating', title: 'StarRating' },
    { id: 'review', title: 'Review' },
    { id: 'link', title: 'Link' }
  ]
});

const app = express();

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

const port = process.env.PORT || 4500;
var API_KEY = google_config.api_key;

app.post('/', (req, res) => {
  let URL = req.body.googlemapurl;
  var splitUrl = URL.split('!3d');
  var latLong = splitUrl[splitUrl.length - 1].split('!4d');
  var longitude;

  if (latLong.indexOf('?') !== -1) {
    longitude = latLong[1].split('\\?')[0];
  } else {
    longitude = latLong[1];
  }
  var latitude = latLong[0];

  request(
    {
      url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`,
      json: true,
      method: 'GET'
    },
    (error, response, body) => {
      if (error) {
        callback('Unable to Connect to Google Servers.');
      } else if (body.status === 'ZERO_REULSTS') {
        callback('Unable to find Geolocation.');
      } else if (body.status === 'OK') {
        // `${body.results[0].place_id}`
        var placeID = JSON.stringify(body.results[0].place_id);
        request(
          {
            url: `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeID}&fields=name,rating,geometry,review&key=${API_KEY}`,
            json: true,
            method: 'GET'
          },
          (error, response, body) => {
            var jsonData = JSON.stringify(body, null, 2);
            csvWriter.writeRecords(jsonData).then(() => {
              res.send('Data is Ready');
            });
          }
        );
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
