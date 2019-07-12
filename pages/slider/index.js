Page({
  data: {
    slider3: 1,
  },
  changeSlider3(e) {
    this.setData({ slider3: e.detail.value })
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

