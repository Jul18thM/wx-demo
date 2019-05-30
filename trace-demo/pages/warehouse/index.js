// pages/warehouse/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   
  },
  outGoods: function(){
    wx.navigateTo({
      url: '/pages/warehouse/returnGoods/returnGoods',
    })
  },
  //跳转调拨页面
  allocationGoods: function () {
    wx.navigateTo({
      url: '/pages/warehouse/allocation/allocation',
    })
  }
})