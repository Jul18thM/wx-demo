import Dialog from "../../wxcomponents/vant/dist/dialog/dialog";

// pages/trace/index.js
const app = getApp();
const url = app.globalData.globalUrl;
 /**
  * 日期格式转换
  */
  function formatDate(time) {
    let date = new Date(time);
    let y = date.getFullYear(); 
    let m = date.getMonth() + 1; 
    m = m < 10 ? ('0' + m) : m; 
    let d = date.getDate(); 
    d = d < 10 ? ('0' + d) : d; 
    let h = date.getHours(); 
    h = h < 10 ? ('0' + h) : h; 
    let minute = date.getMinutes(); 
    let second = date.getSeconds(); 
    minute = minute < 10 ? ('0' + minute) : minute; 
    second = second < 10 ? ('0' + second) : second; 
    date = y + '-' + m + '-' + d + '\n' + h + ':' + minute + ':' + second; 
    return date;
  };
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // tabbar 
    tabbar:{},
    // 产品码
    code :'', 
    //二维码相关信息
    codeInfo:'',
    steps:[],
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
   * 点击扫描事件
   */
  
  scanCode: function(){
    let that = this;
    wx.scanCode({
      success:(res) =>{
        let code = res.result.substring(res.result.length - 32, res.result.length);
        that.setData({
          code: code
        })
      }
    })
  },
  /**
   * 获取输入码
   */
  writeIn:function(e){
    this.setData({
      code: e.detail
    })
  },
  /**
   * 追溯
   */
  trace: function(e){
    app.getNetWorkType();
    let that = this;
    let code = this.data.code;
    let steps = this.data.steps;
    if(code.length<=0){
      Dialog.alert({
        message:'请先输入或扫描二维码信息'
      })
      return;
    }
    // 初始化
    steps = [];
    if(code.length <= 0){
      wx.showToast({
        title:'请输入或扫描二维码',
        icon:'none'
      })
    }else{
      wx.request({
        method:'GET',
        url: url + "/api/trace/find",
        data: {
          code: code
        },
        header:app.globalData.header,
        success:function(e){
          if(e.data.code === app.globalData.overtime){
            app.refreshToken(that.trace())
            return;
          }
          if(e.data.result.length<=0){
            Dialog.alert({
              message:'未知二维码'
            })
            return;
          }
          let codeDetail = e.data.result.codeDetail;
          if(codeDetail === null){
            wx.showToast({
              title:'暂无相关信息',
              icon:'none'
            })
            return;
          }
          let codeInfo = e.data.result.codeBase;
          codeInfo.billCode = codeDetail[codeDetail.length-1].billCode;
          // 判断单据当前状态
          if(codeInfo.currentWarehouseId === "-1"){
            codeInfo.status = "运输中";
          }else{
            codeInfo.status = codeDetail[codeDetail.length-1].billStatus;
          }
          // 对单据列表按时间戳排序
          codeDetail = codeDetail.sort((a,b)=>b.date-a.date);
          // 日期格式转换
          for(let i in codeDetail){
            codeDetail[i].date = formatDate(codeDetail[i].date);
            // 二维码追溯列表
            let text = '';
            let desc = '';
            if(codeDetail[i].billStatus === '已出货'){
              text = '运输中'
              desc = codeDetail[i].date;
              steps.push({text,desc});
              text = codeDetail[i].billType + '[' + codeDetail[i].sendName + ']' + codeDetail[i].billStatus;
              desc = codeDetail[i].date;
              steps.push({text,desc});   
            }else{
              text = codeDetail[i].billType + '[' + codeDetail[i].receiveName + ']' + codeDetail[i].billStatus;
              desc = codeDetail[i].date;
              steps.push({text,desc});   
            } 
          }
          codeInfo.codeDetail = codeDetail;
          that.setData({
            codeInfo:codeInfo,
            steps:steps
          })
        }
      })
    }
  },
  /**
   * 返回
   */
  return(){
    wx.switchTab({
      url:'/pages/home/index'
    })
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
    this.setData({
      // 产品码
      code :'', 
      //二维码相关信息
      codeInfo:'',
      steps:[]
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.setData({
      // 产品码
      code :'', 
      //二维码相关信息
      codeInfo:'',
      steps:[]
    })
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
})