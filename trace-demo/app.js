//app.js
App({
  onLaunch: function() {
    //隐藏系统tabbar
    wx.hideTabBar();

    wx.getSystemInfo({
      success: e => {
        this.globalData.statusBar = e.statusBarHeight; //状态栏高度
        let custom = wx.getMenuButtonBoundingClientRect();//菜单按钮
        this.globalData.custom = custom;
        this.globalData.customBar = custom.bottom + custom.top - e.statusBarHeight;
        //计算得到定义的状态栏高度
      }
    })
  },
  onShow: function () {
    //隐藏系统tabbar
    wx.hideTabBar();
  },
  editTabbar: function () {
    let tabbar = this.globalData.tabBar;
    let currentPages = getCurrentPages();
    let _this = currentPages[currentPages.length - 1];
    let pagePath = _this.route;
    (pagePath.indexOf('/') != 0) && (pagePath = '/' + pagePath);
    for (let i in tabbar.list) {
      tabbar.list[i].selected = false;
      (tabbar.list[i].pagePath == pagePath) && (tabbar.list[i].selected = true);
    }
    _this.setData({
      tabbar: tabbar
    });
  },
  /**
   * 刷新token
   */
  refreshToken(event){
    const url = getApp().globalData.globalUrl;
    let username = wx.getStorageSync('username');
    let password = wx.getStorageSync('password');
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
        event;
      }
    })
  },
  /**
   * 获取网络状态
   */
  getNetWorkType(){
    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType
        if(networkType === 'none' || networkType === 'unknown'){
          wx.showToast({
            title:'网络异常',
            icon:"none"
          })
          return;
        }
      }
    })
  },
  globalData: {
    overtime:'401',// 认证超时
    tokenTime:null,
    userInfo: null,
    header: {
      'Authorization': '',
      'content-type': 'application/json'
    },
    globalUrl: "http://10.5.0.201/trace-api",
    // globalUrl: "http://localhost:8080",
    tabBar: {
      "color": "#8a8a8a",
      "selectedColor": "#515151",
      "list": [
        {
          "pagePath": "/pages/home/index",
          "text": "首页",
          "iconPath": "/icon/home.png",
          "selectedIconPath": "/icon/home_fill.png"
        },
        {
          "pagePath": "/pages/trace/index",
          "text": "追溯",
          "iconPath": "/icon/track.png",
          "selectedIconPath": "/icon/track_fill.png"
        },
        {
          "pagePath":'/pages/h5/h5',
          "iconPath": "/icon/icon_release.png",
          "isSpecial": true,
        },
        {
          "pagePath": "/pages/message/message",
          "text": "消息",
          "iconPath": "/icon/message.png",
          "selectedIconPath": "/icon/message_fill.png"
        },
        {
          "pagePath": "/pages/mine/index",
          "text": "设置",
          "iconPath": "/icon/setting.png",
          "selectedIconPath": "/icon/setting_fill.png"
        }
      ]
    },
  }
})


