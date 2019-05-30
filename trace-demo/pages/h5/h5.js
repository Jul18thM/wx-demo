// pages/h5/h5.js
import publicFunction from '../../publicFunction/request';
const app = getApp();
const url = app.globalData.globalUrl;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // tabbar 
    tabbar:{},
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.editTabbar();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.scan();
  },
  /**
   * 扫码查询信息
   */
  scan(){
    app.getNetWorkType();
    let myThis = this;
    let header = {
      "Authorization": getApp().globalData.header.Authorization,
      "Content-Type": "application/x-www-form-urlencoded"
    };
    // 扫码查询产品码信息
    wx.scanCode({
      success: (res) => {
        let code = res.result.substring(res.result.length-32, res.result.length)
        wx.getLocation({
          success: function(result) {
            let latitude = result.latitude
            let longitude = result.longitude
            let data = {
              lat: latitude,
              lng: longitude,
              code: code
            }
            let request = new publicFunction;
            request.postRequest(url + '/api/queryFake/findCodeList',data,header).then(res => console.log(res.data))
            // wx.request({
            //   method:"POST",
            //   url: url + '/api/queryFake/findCodeList',
            //   data:{
            //     lat: latitude,
            //     lng: longitude,
            //     code: code
            //   },
            //   header: {
            //     "Authorization": getApp().globalData.header.Authorization,
            //     "Content-Type": "application/x-www-form-urlencoded"
            //   },
            //   success:function(result1){
            //     if("000000" == result1.data.code){
            //       result1.data.result.qresult = "合格";
            //       myThis.setData({
            //         product: result1.data.result
            //       })
            //     }else if(app.globalData.overtime === result1.data.code){
            //       app.refreshToken(myThis.scan());
            //     }else{
            //       wx.showToast({
            //         title: result1.data.message,
            //         icon:'none'
            //       })
            //     }
            //   }
            // })
          },
        })
      }
    })
  },
  /**
   * 返回首页
   */
  return(){
    wx.switchTab({
      url:'/pages/home/index'
    })
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

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
   
  }
})