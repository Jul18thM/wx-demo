import Dialog from "../../../wxcomponents/vant/dist/dialog/dialog";
// pages/warehouse/receive/receive.js
let url = getApp().globalData.globalUrl;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderId: "",
    orderCode: '请选择收货单号',
    show: false,//控制下拉列表的显示隐藏，false隐藏、true显示
    codeList: '', //单号列表的数据
    list:'',
    actions:[],
    shwo:false,
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom
  },

  /**
   * 获取下拉
   */
  dropDownBox() {
    this.setData({
      select: !this.data.select
    })
  },
  /**
   * 选单号跳转
   */
  mySelect(e) {
    let myThis = this;
    let bill = e.currentTarget.dataset.bill;
    myThis.setData({
      orderCode: bill.code,
      select: false,
    });
    wx.redirectTo({
      url: '/pages/warehouse/deliverDetail/deliverDetail?order=' + JSON.stringify(bill),  
    })
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
   * 获取收货列表
   */
  getBillList(){
    app.getNetWorkType();
    let that = this
    wx.request({
      method: 'GET',
      url: url + '/api/bill/getList/receive',
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
          actions: actions
        });
      }
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
     * 直接收货
     */
    receiveNow: function (e) {
      app.getNetWorkType();
      let that = this;
        Dialog.alert({
            message:'直接收货后将不能再操作单号，确认直接收货此单号？',
            confirmButtonText:'确认收货',
            cancelButtonText:'我再想想',
            showCancelButton:true
        }).then(()=>{
            wx.request({
                method:'POST',
                url: url + '/api/bill/handReceive/' + e.currentTarget.dataset.id,
                header: getApp().globalData.header,
                success(e) {
                  if("000000" === e.data.code){
                    let taskId = e.data.result.businessId;
                    that.getTaskStatus(taskId);
                  } else if(e.data.code === app.globalData.overtime){
                    app.refreshToken(that.receiveNow());
                    return;
                  }else {
                    wx.showToast({
                      title: e.data.message,
                      icon: 'none'
                    })
                  }
                }
            })
        }).catch(()=>{
            Dialog.close();
        })   
    },
    //扫描收货
    orderBtn: function (e) {
        let order = JSON.stringify(e.currentTarget.dataset.bill);
        wx.redirectTo({
          url: '/pages/warehouse/receive/receiveScan/receiveScan?order=' + order,  
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
   * 选择收货单
   */
  onSelect(e){
    let that = this;
    let codeList = this.data.codeList;
    for(let i in codeList){
      if(codeList[i].code === e.detail.name){
        let order = JSON.stringify(codeList[i]);
        wx.redirectTo({
          url: '/pages/warehouse/receive/receiveScan/receiveScan?order=' + order,  
        })
        that.setData({
          show:false    
        })
         break;
      }
    }
  },
  getTaskStatus(taskId){
    app.getNetWorkType();
    let that = this;
    wx.request({
      method:'GET',
      url:url + '/api/bill/getTaskStatus/' + taskId,
      header: app.globalData.header,
      success:function(res){
        if(res.data.result === '处理中'){
           that.getTaskStatus(taskId);
        }else if(res.data.result === '处理成功'){
         wx.showToast({ 
           title:'直接收货成功', 
           icon:'success', 
           duration:2000, 
           success() { 
             that.onLoad();
           } 
         }) 
        }else{
         Dialog.alert({
           title:res.data.message
         }).then(() => {
         // on close
         });
        }
      }
     })
   }
})