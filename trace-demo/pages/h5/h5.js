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
            request.postRequest(url + '/api/queryFake/findCodeList',data,header).then(res => {
              res.data.result.qresult = "合格";
              myThis.setData({
                product: res.data.result
              })
            })
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
  }
})