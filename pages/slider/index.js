Page({
  data: {
    slider1: 1,
    slider2: 1,
    slider3: 1,
    slider4: 1
  },
  changeSlider1(e) {
    this.setData({ slider1: e.detail.value })
  },
  changeSlider2(e) {
    this.setData({ slider2: e.detail.value })
  },
  changeSlider3(e) {
    this.setData({ slider3: e.detail.value })
  },
  changeSlider4(e) {
    this.setData({ slider4: e.detail.value })
  },
  changescoeff(e){
    var app = getApp();
    var getscoeff = app.globalData.score_coeff;
    app.globalData.score_coeff = slider3;
  },
   go: function () {
     wx.navigateTo({
      url: '../index/index',
    })
  },

})

