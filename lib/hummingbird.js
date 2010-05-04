var sys = require('sys'),
  fs = require('fs'),
  View = require('view').View,
  Metric = require('metric').Metric,
  Aggregates = require('aggregates').Aggregates,
  path = require('path'),
  arrays = require('deps/arrays'),
  querystring = require('querystring');

var Hummingbird = function(db, callback) {
  this.pixel = fs.readFileSync(__dirname + "/../images/tracking.gif", 'binary');
  this.metrics = [];
  this.init(db, callback);
};

Hummingbird.prototype = {
  init: function(db, callback) {
    this.setupDb(db, function() {
      callback();
    });

    this.addAllMetrics(db);
  },

  setupDb: function(db, callback) {
    var self = this;
    db.createCollection('visits', function(err, collection) {
      db.collection('visits', function(err, collection) {
        self.collection = collection;
        callback();
      });
    });
  },

  addAllMetrics: function(db) {
    var files = fs.readdirSync(path.join(__dirname, 'metrics'));

    for(var i = 0; i < files.length; i++) {
      var file = files[i];
      var filename = file.replace(/\.js$/, '');

      var m = require(path.join(__dirname, 'metrics', filename));

      var metric = new Metric(m.name,
                              m.defaultData,
                              m.interval,
                              db,
                              m.addValueCallback);
      this.metrics.push(metric);
    }
  },

  setCollection: function(collection) {
    this.collection = collection;
  },

  addClient: function(client) {
    for(var i = 0; i < this.metrics.length; i++) {
      this.metrics[i].clients.push(client);
    }
  },

  removeClient: function(client) {
    for(var i = 0; i < this.metrics.length; i++) {
      this.metrics[i].clients.remove(client);
    }
  },

  serveRequest: function(req, res) {
    var env = querystring.parse(req.url.split('?')[1]);
    env.timestamp = new Date();
    // sys.log(JSON.stringify(env, null, 2));

    this.writePixel(res);

    var view = new View(env);

    env.url_key = view.urlKey();
    env.product_id = view.productId();

    this.collection.insert(env);

    for(var i = 0; i < this.metrics.length; i++) {
      this.metrics[i].addValue(view);
    }
  },

  writePixel: function(res) {
    res.writeHead(200, { 'Content-Type': 'image/gif',
                         'Content-Disposition': 'inline',
                         'Content-Length': '43' });
    res.write(this.pixel, 'binary');
    res.close();
  },

  serveAggregates: function(client) {
    var aggregates = new Aggregates(this.collection);
    aggregates.lastHour(function(values) {
       client.write(JSON.stringify({ metric: 'lastHour', values: values }));
    });
    /*
    aggregates.lastDay(client, function(values) {
      client.write({ metric: 'lastDay', values: values });
    });
    aggregates.lastWeek(client, function(values) {
      client.write({ metric: 'lastWeek', values: values });
    });
    */
  },

  handleError: function(req, res, e) {
    res.writeHead(500, {});
    res.write("Server error");
    res.close();

    e.stack = e.stack.split('\n');
    e.url = req.url;
    sys.log(JSON.stringify(e, null, 2));
  }
};

exports.Hummingbird = Hummingbird;
