// pages/mine/index.js
import publicFunction from '../../publicFunction/request'
const app = getApp();
const url = app.globalData.globalUrl;
// 缓存大小转换 kb mb
function conver(limit){  
  var size = "";  
  if( limit < 1024 ){ //如果小于0.1KB转化成B  
    size = limit.toFixed(2) + "KB";    
  }else{
    size = (limit / 1024 ).toFixed(2) + "MB";
  }
  var sizestr = size + "";   
  var len = sizestr.indexOf("\.");  
  var dec = sizestr.substr(len + 1, 2);  
  if(dec == "00"){//当小数点后为00时 去掉小数部分  
      return sizestr.substring(0,len) + sizestr.substr(len + 3,2);  
  }  
  return sizestr;  
}  
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // tabbar 
    tabbar:{},
    // 缓存大小
    storageSize:'',
    // 版本号
    version:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    
  },

  /**
   * 清理数据缓存
   */
  clearStorage: function(e){
    let myThis = this;
    wx.showModal({
      title:'请确认是否清除本地缓存',
      confirmText:'是',
      cancelText:'否',
      success(e){
        if(e.confirm){
          wx.clearStorage({
            success(res){
              wx.getStorageInfo({
                success(result){
                  myThis.setData({
                    storageSize: conver(result.currentSize)
                  })
                }
              })
            }
          });
        }
      }
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
    let myThis = this;
    app.editTabbar();
    this.getUserInfo();
    // 获取当前系统缓存数据大小
    wx.getStorageInfo({
      success: function(e){
        myThis.setData({
          storageSize: conver(e.currentSize)
        })
      }
    });
    // 获取当前版本号
    wx.getSystemInfo({
      success(e){
        myThis.setData({
          version:'v' + e.SDKVersion
        })
      }
    })
  },

  /**
   * 获取用户信息
   */
  getUserInfo(){
    app.getNetWorkType()
    let myThis = this;
    let request = new publicFunction;
    request.getRequest(url + '/api/user/userInfo',null,getApp().globalData.header,this.getUserInfo()).then(res =>{
      getApp().globalData.userInfo = res.data.result;
      myThis.setData({
        user: res.data.result
      })
      return;
    });
  },
  /**
   * 关于我们
   */
  aboutUs: function(){
    wx.navigateTo({
      url:'/pages/aboutUs/aboutUs'
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.setData({
      storageSize:'',
      version:''
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.setData({
      storageSize:'',
      version:''
    })
  },

  /**
   * 跳转修改用户页面
   */
  updateUser: function () {
    wx.navigateTo({
      url: '../updateUser/index',
    })
  },

  /**
   * 登出
   */
  click: function () {
    wx.reLaunch({
      url: '../login/index'
    })
    getApp().globalData.header.Authorization == '';
    // wx.clearStorageSync();
  }
})