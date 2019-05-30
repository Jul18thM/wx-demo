// pages/warehouse/returnGoods.js
import Dialog from "../../../wxcomponents/vant/dist/dialog/dialog";
const app = getApp();
const url = getApp().globalData.globalUrl;
/**
* 循环查询任务单状态
*/
function getTaskStatus(taskId){
  app.getNetWorkType();
  wx.request({
    method:'GET',
    url:url + '/api/bill/getTaskStatus/' + taskId,
    header: app.globalData.header,
    success:function(res){
      if(res.data.result === '处理中'){
         getTaskStatus(taskId);
      }else if(res.data.result === '处理成功'){
       wx.showToast({ 
         title:'确认退货成功', 
         icon:'success', 
         duration:2000, 
         success() { 
            wx.reLaunch({ 
              url: '/pages/home/index' 
            })
         } 
       }) 
      }else{
       Dialog.alert({
        message:res.data.message
       }).then(() => {
       // on close
       });
      }
    }
   })
 }
Page({
  /**
   * 页面的初始数据
   */
  data: {
    allProducts: '', //所有产品
    code: '', // 二维码
    products: '', // 产品
    orgList: '', // 下属机构对象集合
    searchList: '', // 查询下属机构对象集合
    returnName: '请选择退货方', // 退货方
    tel: '', //退货电话
    address: '', // 退货地址
    returnId: '', //退货方ID
    actions: [],
    show: false,
    reason: '', // 退货理由
    orgId: '', // 当前用户机构id
    scanCode:'',
    scanType:'',
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom,
    detail:''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 获取退货方
    this.getReturn();
    // 获取所有产品
    this.getAllProducts();
    // 获取当前用户机构id
    this.getUserOrgId();
  },

  /**
   * 获取所有产品
   */
  getAllProducts(){
    app.getNetWorkType();
    let that = this;
    wx.request({
      url: url + '/api/product/getProductList',
      method: 'GET',
      header: getApp().globalData.header,
      success: function(e) {
        if(e.data.code === app.globalData.overtime){
          app.refreshToken(that.getAllProducts());
          return;
        }
        // 加入扫码列表对象
        for (let i in e.data.result) {
          e.data.result[i].scanCodeList = [];
        }
        that.setData({
          allProducts: e.data.result,
          products: ''
        })
      }
    });
  },
  /**
   * 获取退货方
   */
  getReturn(){
    app.getNetWorkType();
    let that = this;
      // 获取退货方
    wx.request({
      method: 'GET',
      url: url + '/api/org/getDealerList/all',
      header: app.globalData.header,
      success: function(e) {
        if(e.data.code === app.globalData.overtime){
          app.refreshToken(that.getReturn());
          return;
        }
        let actions = []
        for (let i in e.data.result) {
          actions.push({
            'name': e.data.result[i].name
          })
        }
        that.setData({
            orgList: e.data.result,
            actions: actions
        })
       }
    });
  },
  /**
   * 获取当前用户机构id
   */
  getUserOrgId(){
    app.getNetWorkType();
    let that = this;
    wx.request({
      method: "GET",
      url: url + '/api/user/userInfo',
      header: getApp().globalData.header,
      success: function(res) {
        if ("000000" == res.data.code) {
          getApp().globalData.userInfo = res.data.result;
          that.setData({
            orgId: res.data.result.orgId
          })
        }else if(res.data.code === app.globalData.overtime){
          app.refreshToken(that.getUserOrgId());
        }else{
          wx.showToast({
            title:res.data.message
          })
        }
      }
    })
  },
  /**
   * 返回上一页
   */
  return () {
    Dialog.confirm({
      message: '您的当前页还有产品未保存或上传，退出后未上传码将不被记录，确定要退出该页面吗？',
      confirmButtonText: '去意已决',
      cancelButtonText: '我再想想',
      showCancelButton: true
    }).then(() => {
      wx.reLaunch({
        url:'/pages/home/index'
      })
    }).catch(() => {
      Dialog.close();
    })
  },
  /**
   * 原因输入
   * @param e
   */
  inputReason: function(e) {
    this.setData({
      reason: e.detail
    });
  },
  /**
   * 扫码
   */
  scanCode: function() {
    let that = this;
    let scanType = this.data.scanType;
    if (this.data.returnName == '请选择退货方') {
      wx.showToast({
        title: '请先选择退货方!',
        icon: 'none'
      })
      return;
    }
    if (that.touchEndTime - that.touchStartTime < 350) {
      if(scanType !== ''){
        that.getScanCode(scanType);
        return;
      }
      wx.showActionSheet({
        itemList: ['单品扫码', '按箱扫码', '按托扫码'],
        success: function (e) {
          if (e.tapIndex === 0) {
            // 单品扫码
            scanType = "1"
          } else if (e.tapIndex === 1) {
            // 按箱扫码
            scanType = "3"
          } else {
            // 按托扫码
            scanType = "4"
          }
          that.getScanCode(scanType);
        }
      })
      return;
    } 
  },
  getScanCode(scanType){
    let that = this;
    wx.scanCode({
      success: (res) => {
        let code = res.result.substring(res.result.length - 32, res.result.length);
        // 设置二维码，页面显示已扫二维码
        that.setData({
          code: code
        })
        that.getVerify(scanType)
      }
    })
  },
  /**
   * 扫码验证
   */
  getVerify:function(scanType){
    app.getNetWorkType();
    let exist = 0;
    let that = this;
    // 获取所有产品信息
    let allProducts = this.data.allProducts;
    let scan = {};
    let orgId = this.data.returnId;
    let list = [];
    let code = this.data.code;
    // 扫码成功后访问后台
    wx.request({
      method: "POST",
      url: url + '/api/bill/validation/return',
      header: getApp().globalData.header,
      data: {
        billId: '',
        code: code,
        scanType: scanType,
        returnOrgId: orgId
      },
      success: function(result) {
        // 校验通过执行的操作
        if (result.data.code === "000000") {
          // 循环遍历allProducts列表
          for (let index in allProducts) {
            let codeList = allProducts[index].scanCodeList;
            // 判断当前码的产品ID从属于productList中哪个产品
            if (result.data.result.productId !== allProducts[index].id) {
              continue;
            }
            // 判断码是否已经扫了
            if (Object.keys(codeList).length === 0) { // 第一次扫码
              // 本地新增已扫码列表
              scan.code = code; // 扫描码
              scan.parentCode = result.data.result.parentCode; // 该码的父码
              scan.scanType = scanType; // 扫描类型
              scan.singleNum = result.data.result.singleNum; // 单品码数量
              // 存储已扫的码
              allProducts[index].scanCodeList.push(scan)
              allProducts[index]['pcs'] = scan.singleNum;
              break;
            } else { // 第一次之后的扫码是否重复验证
              let pcode = result.data.result.parentCode;
              if(pcode===''||pcode === null){
                pcode='';
              }
              for (let i in codeList) {
                // 判断这个码是否在已扫码列表中 或 判断这个码的父码是否已经扫了
                if (codeList[i].code.includes(code) || (pcode != null && pcode.includes(codeList[i].code))) {
                  exist++;
                  break;
                }
              }
              if (exist > 0) {
                exist = 0;
                wx.showToast({
                  title: '重复二维码！',
                  icon: 'none'
                })
              } else {
                //本地新增已扫码列表
                scan.code = code;
                scan.parentCode = result.data.result.parentCode;
                scan.scanType = scanType;
                scan.singleNum = result.data.result.singleNum;
                allProducts[index].scanCodeList.push(scan)
              }
            }
          }
          // 封装产品列表
          for (let a in allProducts) {
            // 判断产品列表中的已扫码列表不为空
            if (allProducts[a].scanCodeList.length > 0) {
              let scanNum = 0
              for (let s in allProducts[a].scanCodeList) {
                scanNum = scanNum + allProducts[a].scanCodeList[s].singleNum;
              }
              allProducts[a].scanNum = scanNum
              list.push(allProducts[a]);
            }
          }
          // 重新设置产品列表productList
          that.setData({
            products: list,
            scanType:scanType
          });
        }else if(result.data.code === app.globalData.overtime){
          app.refreshToken(that.getVerify(scanType));
        } else { //扫码校验失败
          Dialog.confirm({
            message: result.data.message,
            showCancelButton: false
          }).then(() => {
          }).catch(() => {
            Dialog.close();
          })
        }
      }
    })
  },
  /**
   * 撤销按钮点击事件
   */
  cancel: function() {
    let that = this;
    // 获取code
    let code = this.data.code;
    // 获取产品列表
    let productList = this.data.products;
    for (let index in productList) {
      let codeList = productList[index].scanCodeList;
      for (let i in codeList) {
        if (code === codeList[i].code) {
          // 判断类型，扫描数更改
          productList[index].scanNum = productList[index].scanNum - codeList[i].singleNum;
          // 从codeList中删除对应的code
          codeList.splice(i, 1);
        }
      }
      // 如果哪个产品的扫码数量为0 则不显示这个产品的相关信息
      if (productList[index].scanNum === 0) {
        productList.splice(index, 1);
      }
    }
    let allProducts = this.data.allProducts;
    for(let a in allProducts){
      let codeList = allProducts[a].scanCodeList;
      for(let c in codeList){
        if(code === codeList[c].code){
          allProducts[a].scanNum = allProducts[a].scanNum - codeList[c].singleNum;
          codeList.splice(c,1)
        }
         // 如果哪个产品的扫码数量为0 则不显示这个产品的相关信息
        if (allProducts[a].scanNum === 0) {
          allProducts.splice(a, 1);
        }
      }
    }
    // 更新产品列表
    that.setData({
      code: '',
      products: productList,
      allProducts: allProducts
    })
  },

  /**
   * 重置按钮点击事件
   */
  reset: function() {
    let that = this;
    let products = that.data.products;
    let allProducts = that.data.allProducts;
    Dialog.confirm({
      message: '重置后当前单号所有扫描信息将被清空，确认重置该单号扫描？',
      confirmButtonText: '确认重置',
      cancelButtonText: '我再想想',
      showCancelButton: true
    }).then(() => {
      // 重置所有产品扫描数量
      products.splice(0);
      for(let i in allProducts){
        if(allProducts[i].scanCodeList != null){
          allProducts[i].scanCodeList = [];
        }
      }
      that.setData({
        allProducts:allProducts,
        products: products,
        code: ''
      })
    }).catch(() => {
      Dialog.close();
    })
  },

  /**
   * 确认退货
   */
  confirmReturnGoods: function() {
    app.getNetWorkType();
    let that = this;
    Dialog.confirm({
      message: '当前扫描码将会上传,确认登记退货信息?',
      confirmButtonText: '确认退货',
      cancelButtonText: '我再想想',
      showCancelButton: true
    }).then(() => {
      that.confirm()
    }).catch(() => {
      Dialog.close();
    })
  },
confirm(){
  let detailList = []; //详细信息列表
  let that = this;
  let returnId = this.data.returnId;
  let reason = this.data.reason;
  let productList = this.data.products;
  let data = {
    billId: '',
    detailList: detailList,
    orgId: returnId,
    remark: reason
  }
  // 封装detailList
  for (let a in productList) {
    let billpro = new Object();
    // 判断产品列表中的已扫码列表不为空
    billpro.productId = productList[a].id;
    let codeList = productList[a].scanCodeList;
    for(let b in codeList){// 判断是否是按托扫桶/箱
      if(that.data.scanType === '4' && codeList[b].parentCode != null){
        codeList[b].code = codeList[b].parentCode.substring(0,32);
        codeList[b].parentCode = null;
      }else{
        codeList[b].code = codeList[b].code;
      }
    }
    billpro.codeList = codeList;
    if (billpro.codeList.length > 0) {
      data.detailList.push(billpro);
    }
  }
  if (data.detailList.length <= 0) {
    wx.showToast({
      title: '请先扫码！',
      icon: 'none'
    })
  } else {
    wx.request({
      method: 'POST',
      url: url + '/api/bill/upload/return',
      data: data,
      header: {
        "Authorization": getApp().globalData.header.Authorization
      },
      success: function(e) {
        if ("000000" === e.data.code) {
          let taskId = e.data.result.businessId;
          getTaskStatus(taskId);
        }else if(e.data.code === app.globalData.overtime){
          app.refreshToken(that.confirm())
        } else {
          wx.showToast({
            title: e.data.message,
            icon: 'none'
          })
        }
      }
    })
  }
},

  /**
   * 显示上拉
   */
  showActionSheet() {
    this.setData({
      show: true
    })
  },
  /**
   * 上拉取消按钮点击事件
   */
  sheetClose() {
    this.setData({
      show: false
    })
  },
  /**
   * 选择退货方
   */
  onSelect(e) {
    let that = this;
    let orgList = this.data.orgList;
    for (let i in orgList) {
      if (orgList[i].name === e.detail.name) {
        that.setData({
          returnName: e.detail.name,
          address: orgList[i].address,
          tel: orgList[i].tel,
          returnId: orgList[i].id,
          show: false
        })
        break;
      }
    }
  },
  showList: function(e) {
    let that = this;
    let product = e.currentTarget.dataset.code;
    // 如果已扫码列表为空，则显示提醒
    if (product.scanCodeList.length === 0) {
      wx.showToast({
        title: '请先扫码',
        icon: 'none'
      })
      return;
    }
    product.showModal = true;
    that.setData({
      detail: product
    })
  },
  /**
   * 弹窗点击确认事件
   */
  onClose() {
    let detail = this.data.detail;
    detail.showModal = false;
    this.setData({
      detail: detail
    })
  },

    /// 按钮触摸开始触发的事件
    touchStart: function(e) {
      this.touchStartTime = e.timeStamp
    },
  
    /// 按钮触摸结束触发的事件
    touchEnd: function(e) {
      this.touchEndTime = e.timeStamp
    },
    // 扫码长按
  longTap: function() {
    if (this.data.returnName == '请选择退货方') {
      wx.showToast({
        title: '请先选择退货方!',
        icon: 'none'
      })
      return;
    }
    let that = this;
    let scanType;
    wx.showActionSheet({
        itemList: ['单品扫码', '按箱扫码', '按托扫码'],
        success: function (e) {
            if (e.tapIndex === 0) {
                // 单品扫码
                scanType = "1"
            } else if (e.tapIndex === 1) {
                // 按箱扫码
                scanType = "3"
            } else {
                // 按托扫码
                scanType = "4"
            }
            that.getScanCode(scanType)
        }
    })
  }, 
  onHide: function () {
    this.setData({
      scanType:''
    })
  },
  onUnload: function () {
    this.setData({
      scanType:''
    })
  },
})