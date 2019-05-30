// pages/warehouse/allocation/allocationScanCode/allocationScanCode.js
import Dialog from "../../../../wxcomponents/vant/dist/dialog/dialog";
var that = [];
const app = getApp();
const url = app.globalData.globalUrl;

/**
 * 循环查询任务单状态
 */
function getTaskStatus(taskId) {
  app.getNetWorkType();
  wx.request({
    method: 'GET',
    url: url + '/api/bill/getTaskStatus/' + taskId,
    header: app.globalData.header,
    success: function(res) {
      if (res.data.result === '处理中') {
        getTaskStatus(taskId);
      } else if (res.data.result === '处理成功') {
        wx.showToast({
          title: '操作成功',
          duration: 2000,
          success() {
            setTimeout(function() {
              wx.redirectTo({
                url: '/pages/warehouse/allocation/allocation'
              }, 2000)
            });
          }
        });
        return;
      } else {  
        Dialog.confirm({
          message: res.data.message,
          showCancelButton: false
        }).then(() => {}).catch(() => {
          Dialog.close();
        })
        return;
      }
    }
  })
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    billCode: '',
    orgName: '',
    orgId: '', //收货方机构ID
    orgAddress: '',
    createDate: '',
    billStatus: '', //调拨状态
    detail:'',
    productList: '', //产品列表
    billId: '', // 单号id
    code: '', // 二维码
    allProducts: '', //所有产品
    showModal: false, //是否显示模态框
    eliminateCode: '', //剔除扫码
    showInfo: false, // 是否显示提示
    scanType:'',//扫码等级
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    that = this;
 
    //获取订单详情,然后删除
    wx.getStorage({
      key: 'order',
      success(e) {
        that.setData({
          billId: e.data.id,
          billStatus: e.data.billstatus,
          billCode: e.data.code,
          createDate: e.data.createdate,
          orgAddress: e.data.orgaddress,
          orgName: e.data.orgname,
        });
        that.getProductList(e);
      },
    });
    wx.removeStorage({
      key: 'order'
    });
  },

  /**
   * 获取单号列表
   */
  getProductList: function(e) {
    //获取产品列表
    let productList;
    app.getNetWorkType();
    wx.request({
      method: 'GET',
      url: url + '/api/bill/getProductInfo/allocation/' + e.data.id,
      header: getApp().globalData.header,
      success: function(res) {
        if (res.data.code === app.globalData.overtime) {
          app.refreshToken(that.getProductList(e));
          return;
        }
        productList = res.data.result;
        // 计算之前已扫箱托单码数量
        for (let index in productList) {
          // 初始化
          let pcs = 0; //单品
          let scanCodes = productList[index].scanCodeList;
          for (let i in scanCodes) {
            if (scanCodes[i].scanCount === '' || scanCodes[i].scanCount === null) {
              productList[index]['pcs'] = 0;
            } else {
              productList[index]['pcs'] = 0 + productList[index].scanCount;
            }
            if (scanCodes[i].packLevel === '1') { // 单品
              scanCodes[i].scanType = '1';
            } else if (scanCodes[i].packLevel === '3') { // 箱
              scanCodes[i].scanType = '3';
            } else if (scanCodes[i].packLevel === '4') { // 托
              scanCodes[i].scanType = '4';
            }
            delete scanCodes[i].packLevel;
          }
        }
        that.setData({
          productList: res.data.result
        })
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
      wx.redirectTo({
        url: '/pages/warehouse/allocation/allocation',
      })
    }).catch(() => {
      Dialog.close();
    })
  },
  /// 按钮触摸开始触发的事件
  touchStart: function (e) {
    that.touchStartTime = e.timeStamp
  },

  /// 按钮触摸结束触发的事件
  touchEnd: function (e) {
    that.touchEndTime = e.timeStamp
  },
  // 扫码长按
  longTap: function () {
    let scanType = that.data.scanType;
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
        that.setData({
          scanType: scanType
        })
        wx.scanCode({
          success:function(res){
            that.scanFunction(res)
          }
        })
      }
    })
  },
  scanCode: function() {
    let that = this;
    // 获取调拨单单号
    let id = this.data.billId;
    // 获取Data产品列表
    let productList = this.data.productList;
    // 扫描类型
    let scanType= this.data.scanType;
    let scan = {};
    if (that.touchEndTime - that.touchStartTime < 350) {
      if (scanType != '') {
        wx.scanCode({
          success: (res) => {
            that.scanFunction(res);
          }
        })
        return;
      }
      wx.showActionSheet( {
        itemList: ['单品扫码', '按箱扫码', '按托扫码'],
        success: function(e) {
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
          that.setData({
            scanType:scanType
          })
          wx.scanCode({
            success: (res) => {
              that.scanFunction(res);
            }
          })
        }
      })
    }
  },

  scanFunction: function(res) {
    let that = this;
    // 获取出库单单号
    let id = this.data.billId;
    // 获取Data产品列表
    let productList = this.data.productList;
    let scan = {};
    let code = res.result.substring(res.result.length - 32, res.result.length);
      // 扫码成功后访问后台
    app.getNetWorkType();
    wx.request({
      method: "POST",
      url: url + '/api/bill/validation/allocation',
      header: getApp().globalData.header,
      data: {
        billId: id,
        code: code,
        scanType: that.data.scanType
      },
      success: function(result) {
        if (result.data.code === app.globalData.overtime) {
          app.refreshToken(that.scanFunction(res));
          return;
        }
        // 校验通过执行的操作
        if (result.data.code === "000000") {
          // 循环遍历productList列表
          for (let index in productList) {
            let codeList = productList[index].scanCodeList;
            var expectCount = productList[index].expectCount;
            // 判断当前码的产品ID从属于productList中哪个产品
            if (result.data.result.productId !== productList[index].productId) {
              continue;
            }
            // 判断码是否已经扫了
            // 第一次扫码
            if (Object.keys(codeList).length === 0) {
              if (result.data.result.singleNum > expectCount) {
                wx.showToast({
                  title: '单品数超出规定数量!',
                  icon: 'none'
                })
                return;
              }
              // 本地新增已扫码列表
              scan.code = code; // 扫描码
              scan.parentCode = result.data.result.parentCode; // 该码的所有父级码
              scan.scanType = that.data.scanType; // 扫描类型
              scan.singleNum = result.data.result.singleNum; // 单品数
              //判断数量是否超过总数
             
              // 设置二维码，页面显示已扫二维码
              that.setData({
                code: code
              })
              productList[index].scanCodeList.push(scan)
              productList[index]['pcs'] = scan.singleNum;
            } else { // 第一次之后的扫码是否重复验证
              let exist = 0;
              let pcode = result.data.result.parentCode; // 父码
              if(pcode==null){
                pcode = 0;
              }
              for (let i in codeList) {
                // 判断这个码是否重复 或 验证父码是否重复
                if (codeList[i].code.includes(code) || (pcode.length > 0 && pcode.includes(codeList[i].code))) {
                  exist++;
                  break;
                }
              }
              if (exist > 0) {
                wx.showToast({
                  title: '重复二维码！',
                  icon: 'none'
                })
              } else {
                //本地新增已扫码列表
                scan.code = code;
                scan.parentCode = result.data.result.parentCode;
                scan.scanType = that.data.scanType;
                scan.singleNum = result.data.result.singleNum;
                let pcs = productList[index]['pcs'];
                
                if (pcs + scan.singleNum > expectCount) {
                  wx.showToast({
                    title: '单品数超出规定数量!',
                    icon: 'none'
                  })
                  return;
                }
                productList[index]['pcs'] = pcs + scan.singleNum;
                // 设置二维码，页面显示已扫二维码
                that.setData({
                  code: code
                })
                codeList.push(scan)
              }
            }
          }
          // 重新设置产品列表productList
          that.setData({
            productList: productList,
            scanType:that.data.scanType
          })
        } else { //扫码校验失败
          Dialog.confirm({
            message: result.data.message,
            showCancelButton: false
          }).then(() => {}).catch(() => {
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
    let productList = this.data.productList;
    for (let index in productList) {
      let codeList = productList[index].scanCodeList;
      for (let i in codeList) {
        if (code === codeList[i].code) {
          productList[index]['pcs'] -= productList[index].scanCodeList[i].singleNum;
          // 从codeList中删除对应的code
          codeList.splice(i, 1);
        }
      }
    }
    // 更新产品列表
    that.setData({
      code: '',
      productList: productList
    })
  },

  /**
   * 重置按钮点击事件
   */
  reset: function() {
    let that = this;
    let productList = this.data.productList;
    Dialog.confirm({
      message: '重置后当前单号所有扫描信息将被清空，确认重置该单号扫描？',
      confirmButtonText: '确认重置',
      cancelButtonText: '我再想想',
      showCancelButton: true
    }).then(() => {
      // on confirm
      // 重置所有产片扫描数量
      for (let index in productList) {
        productList[index].pcs = 0;
        productList[index].ctn = 0;
        productList[index].plt = 0;
        productList[index].scanCodeList = [];
      }
      that.setData({
        productList: productList,
        code: ''
      })
    }).catch(() => {
      // on cancel
      Dialog.close();
    });

  },

  /**
   * 保存按钮点击事件
   */
  save: function() {
    // 保存所需数据
    let id = this.data.billId;
    let org = this.data.orgId;
    let productList = this.data.productList;
    let detailList = [];//详细信息列表
    let data = {
      billId: id,
      detailList: detailList,
      orgId: org
    }
    Dialog.confirm({
      message: '保存后当前单号下次还能进行处理，确认进行保存？',
      confirmButtonText: '确认保存',
      cancelButtonText: '我再想想',
      showCancelButton: true
    }).then(() => { // 点击确认
      // 封装detailList
      for (let a in productList) {
        let billpro = new Object();
        billpro.productId = productList[a].productId;
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
      // 判断是否已扫码
      if (data.detailList.length <= 0) {
        wx.showToast({
          title: '请先扫码',
          icon: 'none'
        })
      } else {
        app.getNetWorkType();
        wx.request({
          method: 'POST',
          url: url + '/api/bill/save/allocation',
          data: data,
          header: {
            "Authorization": getApp().globalData.header.Authorization
          },
          success: function(e) {
            getTaskStatus(e.data.result.businessId);
          }
        })
      }
    }).catch(() => {
      Dialog.close();
    })
  },

  //上传
  upload: function() {
    let id = this.data.billId;
    let org = this.data.orgId;
    let productList = this.data.productList;
    let detailList = [];//详细信息列表
    // 上传所需数据
    let data = {
      billId: id,
      detailList: detailList,
      orgId: org
    }
    Dialog.confirm({
      message: '上传后当前单号不能再进行操作，确认上传？',
      confirmButtonText: '确认上传',
      cancelButtonText: '我再想想',
      showCancelButton: true
    }).then(() => {
      // 封装detailList
      for (let a in productList) {
        let billpro = new Object();
        billpro.productId = productList[a].productId;
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
        app.getNetWorkType();
        wx.request({
          method: 'POST',
          url: url + '/api/bill/upload/allocation',
          data: data,
          header: {
            "Authorization": getApp().globalData.header.Authorization
          },
          success: function(e) {
            getTaskStatus(e.data.result.businessId);
          }
        })
      }
    }).catch(() => {
      Dialog.close();
    })
  },
  /**
   * 点击产品，查看扫码详情
   */
  showList: function(e) {
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
      this.setData({
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
  /**
   * 剔除扫码
   */
  scan: function() {
    let that = this;
    let eliminateCode; // 初始化code
    wx.scanCode({
      success: (res) => {
        eliminateCode = res.result.substring(res.result.length - 32, res.result.length);
        that.setData({
          eliminateCode: eliminateCode
        })
      }
    })
  },
  getEliminateCode(e) {
    this.setData({
      eliminateCode: e.detail.value
    })
  },
  /**
   * 剔除按钮点击事件
   */
  eliminate: function(e) {  
    let that = this;
    let exsit = false;
    // 获取产品列表
    let productList = this.data.productList;
    // 获取要剔除的码
    let code = this.data.eliminateCode;
    for (let index in productList) {
      let codeList = productList[index].scanCodeList;
      for (let i in codeList) {
        if (code === codeList[i].code) {
          exsit = true;
          //扫描数更改
          productList[index].pcs -= codeList[i].singleNum
          // 从codeList中删除对应的code
          codeList.splice(i, 1);
        }
      }
    }
    if (!exsit) {
      wx.showToast({
        title: '已扫码中无此码',
        icon: 'none'
      })
      return;
    } else {
      wx.showToast({
        title: '剔除成功!',
      })
    }
    // 更新产品列表
    that.setData({
      code: '',
      productList: productList,
      showInfo: false
    });

    // 成功后关闭模态框
    this.setData({
      showInfo: false
    })
  },
  /**
   * 弹出层
   */
  show: function() {
    let productList = that.data.productList;
    let flag = true;
    for(let i in productList){
      let codeList = productList[i].scanCodeList;
      if(codeList.length > 0){
        flag = false;
        break;
      }
    }
    if(flag){
      wx.showToast({
        title: '请先扫码再剔除',
        icon:'none',
      })
    }else{
      this.setData({
        showInfo: true,
        eliminateCode:''
      })
    }
    
  },

  /**
   * 弹出层
   */
  close: function() {
    this.setData({
      showInfo: false
    })
  }
})