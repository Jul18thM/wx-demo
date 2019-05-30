var that = [];
var list = null;
const app = getApp();
const url = app.globalData.globalUrl;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        select: false,
        noResult: false,
        order: '',
        //页面初始列表
        orderList: [],
        code: '',
        inputVal: '',
        actions:[],
        show:false,
        statusBar: app.globalData.statusBar,
        customBar: app.globalData.customBar,
        custom: app.globalData.custom
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        that = this;
         that.getOrderList();
        //修改title
        wx.setNavigationBarTitle({
            title: '调拨管理'
        });

    },

    /**
     * 返回上一页
     */
    return() {
        wx.navigateBack()
    },

    /**
     * 获取单号列表
     */
    getOrderList: function () {
      app.getNetWorkType();
        wx.request({
            method: 'GET',
            url: url + "/api/bill/getList/allocation",
            header: getApp().globalData.header,
            success: function (e) {
              if (e.data.code === app.globalData.overtime) {
                app.refreshToken(that.getOrderList());
                return;
              }
                list = e.data.result;
                let actions = []; // vant ActionSheet上拉菜单数据
                for(let r in list){
                    let code =  list[r].code;
                    actions.push({'name': code})
                }
                //将获取的数据放入单号列表
                that.setData({
                    orderList: list,
                    actions:actions
                });
                if (Object.keys(list).length == 0) {
                    that.setData({
                        noResult: true
                    });
                }
            }
        })
    },

    /**
     * 键盘输入触发事件
     */
    inputOrder: function (e) {
        that.setData({
            select: true,
            inputVal: e.detail.value
        });
      app.getNetWorkType();
        wx.request({
            method: 'POST',
            url: url + "/api/bill/searchList",
            header: getApp().globalData.header,
            data: {
                code: e.detail.value,
                type: 'allocation'
            },
            header: getApp().globalData.header,
            success: function (res) {
                list = res.data.result;
                that.setData({
                    orderList: list,
                    noResult: false
                });
                if (Object.keys(list).length == 0) {
                    that.setData({
                        noResult: true,
                        select: false
                    });
                }
            }
        });
    },

    //第一次点击下拉(最多六条记录)
    firstClick: function (e) {
        //判断是否为第一此点击
        if (e.detail.value != '') {
            return;
        }
        that.getOrderList();
        that.setData({
            select: !that.data.select,
        })

    },

    //选择下拉框的内容
    mySelect(e) {
        var code = e.currentTarget.dataset.code;
        var number = e.currentTarget.dataset.number;
        var selectOrder = that.data.orderList[number];
        var newList = [];
        newList.push(selectOrder);
        that.setData({
            order: code,
            orderList: newList,
            select: false,
            noResult: false
        });
        //获取选择单号对应的数据
    },

    //点击单号详情跳转页面
    orderBtn: function (e) {
        wx.setStorage({
            key: 'order',
            data: e.currentTarget.dataset,
        })
      wx.redirectTo({
            url: '/pages/warehouse/allocation/allocationScanCode/allocationScanCode',
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
   * 选择调拨单
   */
  onSelect(e){
    let that = this;
    let orderList = this.data.orderList;
    for(let i in orderList){
      if(orderList[i].code === e.detail.name){
        let list = {};
        list.id = orderList[i].id;
        list.code = orderList[i].code;
        list.createdate = orderList[i].createDate;
        list.orgid = orderList[i].orgId;
        list.orgaddress = orderList[i].orgAddress;
        list.orgname = orderList[i].orgName;
        list.billstatus = orderList[i].billStatus;
        wx.setStorage({
            key: 'order',
            data: list,
        })
        wx.navigateTo({
            url: '/pages/warehouse/allocation/allocationScanCode/allocationScanCode',
        })
        that.setData({
          show:false    
        })
         break;
      }
    }
  }
})