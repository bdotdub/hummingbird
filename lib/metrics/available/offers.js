var OffersMetric = {
  name: 'offers',
  defaultData: { offers: {} },
  interval: 500,
  addValueCallback: function(view) {
    if(view.urlKey()) {
      if(this.data.offers[view.urlKey()]) {
        this.data.offers[view.urlKey()] += 1;
      } else {
        this.data.offers[view.urlKey()] = 1;
      }
    }
  }
};

for (var i in OffersMetric)
  exports[i] = OffersMetric[i];
