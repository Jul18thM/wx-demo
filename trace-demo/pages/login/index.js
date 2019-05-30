import Dialog from "../../wxcomponents/vant/dist/dialog/dialog";
// pages/login/index.js
const app  = getApp();
let url = getApp().globalData.globalUrl;
Page({ 
  /**
   * 页面的初始数据
   */
  data: {
      username:'',
      password:'',
      remember:false,
      checked:'',
      inputType:true,
      icon:'eye-o'
      
  },
  checkboxChange(e){
    if(e.detail.value[0] === 'remember'){
      this.setData({
        remember: true
      })   
    }else{
      this.setData({
        remember:false
      })
    }
  },
  /**
   * 登录
   */
  login: function (e) {
    app.getNetWorkType();
    let username  = e.detail.value.username;
    let password  = e.detail.value.password;
    let remember  = this.data.remember;
    if(username == '' || password == ''){
      wx.showToast({
        title:'账号或密码不能为空',
        icon:'none',
        duration:2000
      })
      return;
    }
    wx.request({
      method: "POST",
      url: url + '/api/login',
      data: {
        username: username,
        password: password,
        type: '2'
      },
      dataType: 'json',
      header: {
        'content-type': 'application/json',
      },
      success: function (res) {
        getApp().globalData.header.Authorization = res.data.result; //设置token令牌
        if ("000000" === res.data.code) {
          // 记住密码
          if(remember){
            wx.removeStorageSync('username')
            wx.removeStorageSync('password')
            wx.removeStorageSync('checked')
            wx.setStorageSync("username",username);
            wx.setStorageSync("password",password);
            wx.setStorageSync('checked','checked');
            wx.setStorageSync('remember',remember);
          }else{
            wx.removeStorageSync('username')
            wx.removeStorageSync('password')
            wx.removeStorageSync('checked')
            wx.removeStorageSync('remember')
          }
          wx.request({
            method: "GET",
            url: url + '/api/user/userInfo',
            header: getApp().globalData.header,
            success: function (res) {
              if ("000000" == res.data.code) {
                getApp().globalData.userInfo = res.data.result;
                getApp().globalData.tokenTime = new Date().getTime() / 1000
              } 
            }
          });
          wx.switchTab({
            url: '../home/index',
            success(res) {
              wx.hideTabBar();
            }
          })         
        } else {
          //弹窗提示登录失败返回信息
          wx.showToast({
            title: res.data.message,
            icon:'none',
            duration: 2000
          })
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 记住密码
    this.setData({
      username: wx.getStorageSync('username'),
      password: wx.getStorageSync('password'),
      checked: wx.getStorageSync('checked'),
      remember:wx.getStorageSync('remember')
    })
  },
  /**
   * 显示密码
   */
  showOrHidden(){
    let inputType = this.data.inputType;
    if(!inputType){
      this.setData({
        inputType:true,
        icon:'eye-o'
      })
      return;
    }
    if(inputType){
      this.setData({
        inputType:false,
        icon:'closed-eye'
      })
      return;
    }
  }
})
