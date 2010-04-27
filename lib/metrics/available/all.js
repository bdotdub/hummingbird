var AllViewsMetric = {
  name: 'all_views', 
  defaultData: {total: 0, cartAdds: 0}, 
  interval: 50, 
  addValueCallback: function(view) { 
    this.data.total += 1;

    if(view.event() && view.event() === "cart_add") {
      this.data.cartAdds += 1;
    }
  }
};

for (var i in AllViewsMetric)
  exports[i] = AllViewsMetric[i];