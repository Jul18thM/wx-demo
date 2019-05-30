// pages/updateUser/index.js
const app = getApp();
const url = app.globalData.globalUrl;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      user: getApp().globalData.userInfo
    })
  },

  /**
   * 表单提交事件
   */
  formSubmit: function (e) {
    wx.request({
      url: url + '/api/user/update',
      method: "GET",
      data: {
        username: e.detail.value.username,
        password: e.detail.value.password
      },
      header: getApp().globalData.header,
      success: function (res) {
        if ("000000" == res.data.code) {
          wx.showToast({
            title: '成功',
            icon: 'success',
            duration: 1000
          })
          setTimeout(function () {
            wx.switchTab({
              url: '../mine/index',
            })
          }, 1000)
        } else {
          wx.showToast({
            title: res.data.message,
            icon: 'none',
          })
        }
      }
    })

  },
  /**
   * 返回上一页
   */
  return(){
    wx.navigateBack();
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})