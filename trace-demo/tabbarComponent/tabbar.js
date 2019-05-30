// tabBarComponent/tabBar.js
const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    tabbar: {
      type: Object,
      value: {
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
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
   
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})
