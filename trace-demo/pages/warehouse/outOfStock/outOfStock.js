// pages/warehouse/outOfStock/outOfStock.js
let url = getApp().globalData.globalUrl;
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderId: "",
    orderCode: '请选择出库单号',
    show: false,//控制下拉列表的显示隐藏，false隐藏、true显示
    codeList: '', //单号列表的数据
    list:'',
    actions:[],
    show:false,
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom

  },
  /**
   * 键盘抬起事件,模糊查询
   */
  searchBill:function(e){
    let that = this;
    // 获取name
    let code = e.detail.value;
    let list = this.data.list
    let temp=[];// 临时变量，用来存放模糊匹配数据
    // 根据name模糊查询
    for(let i in list){
      if(list[i].code.includes(code)){
        temp.push(list[i])
      }
    }
    that.setData({
      codeList: temp
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getBillList();
  },
  /**
   * 获取单号列表
   */
  getBillList(){
    app.getNetWorkType();
    let that = this;
    wx.request({
      method: 'GET',
      url: url + '/api/bill/getList/deliver',
      header: getApp().globalData.header,
      success: function (res) {
        if(res.data.code === app.globalData.overtime){
          app.refreshToken(that.getBillList());
          return;
        }
        let actions = []; // vant ActionSheet上拉菜单数据
        for(let r in res.data.result){
            let code =  res.data.result[r].code;
            actions.push({'name': code})
        }
        //将获取的数据放入单号列表
        that.setData({
          codeList: res.data.result,
          list: res.data.result,
          actions:actions
        });
      }
    })
  },
  orderDetail(e){ 
    let order = JSON.stringify(e.currentTarget.dataset.code);
    wx.redirectTo({
      url: '/pages/warehouse/deliverDetail/deliverDetail?order=' + order,  
    })
  },
  /**
   * 返回上一页
   */
  return(){
    wx.reLaunch({
      url:'/pages/home/index'
    })
  },
  /**
   * 显示上拉
   */
  showActionSheet(){
    this.setData({
      show: true
    })
  },
  /**
   * 上拉取消按钮点击事件
   */
  sheetClose(){
      this.setData({
          show: false
      })
  },
  /**
   * 选择出库单
   */
  onSelect(e){
    let that = this;
    let codeList = this.data.codeList;
    for(let i in codeList){
      if(codeList[i].code === e.detail.name){
        let order = JSON.stringify(codeList[i]);
        wx.redirectTo({
          url: '/pages/warehouse/deliverDetail/deliverDetail?order=' + order,  
        })
        that.setData({
          show:false    
        })
         break;
      }
    }
  },
})