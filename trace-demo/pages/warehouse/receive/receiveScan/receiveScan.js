// pages/warehouse/receive/receiveScan/receiveScan.js
import Dialog from "../../../../wxcomponents/vant/dist/dialog/dialog";
const app = getApp();
const url = app.globalData.globalUrl;
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
         title:'扫码收货成功', 
         icon:'success', 
         duration:2000, 
         success() { 
            wx.redirectTo({ 
              url: '/pages/warehouse/receive/receive'
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
    productList: '',//产品列表
    billId: '',// 单号id
    code: '', // 二维码
    allProducts: '', //所有产品
    showModal: false ,//是否显示模态框
    orgId:'',//机构Id
    eliminateCode:'',//剔除扫码
    showInfo: false ,// 是否显示提示
    codeInfo:'',
    scanType:"",
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom,
    detail:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this
    // 获取上个页面传过来的出库单详情
    that.setData({
      order: JSON.parse(options.order),
      billId: JSON.parse(options.order).id,
      orgId: JSON.parse(options.order).orgId
    })
    // 设置出库单号
    this.billId = JSON.parse(options.order).id;
    let id = JSON.parse(options.order).id;
    //获取产品列表
    this.getProdcutList(id);
  },
  /**
   * 获取产品列表
   */
  getProdcutList(id){ 
    app.getNetWorkType();
    let that = this;
    let productList;
    wx.request({
      method:'GET',
      url: url + "/api/bill/getProductInfo/receive/" + id,
      header: getApp().globalData.header,
      success(res) {
        if(res.data.code === app.globalData.overtime){
          app.refreshToken(that.getBillList());
          return;
        }
        productList = res.data.result;
        // 计算之前已扫箱托单码数量
        for(let index in productList){
          let scanCodes = productList[index].scanCodeList;
          for(let i in scanCodes){
            if(scanCodes[i].packLevel === '1'){ // 单品
              scanCodes[i].scanType = '1';
             
            }else if(scanCodes[i].packLevel === '3'){ // 箱
              scanCodes[i].scanType = '3';
             
            }else{ // 托
              scanCodes[i].scanType = '4';
            }
            delete scanCodes[i].packLevel;
          }
        }
        that.setData({
          productList: productList
        })
      }
    })
  },
  /**
   * 返回上一页
   */
  return() {
    Dialog.confirm({
      message:'您的当前收货单还有产品未保存或上传，退出后未上传码将不被记录，确定要退出该页面吗？',
      confirmButtonText:'去意已决',
      cancelButtonText:'我再想想',
      showCancelButton:true
    }).then(() =>{
      wx.redirectTo({
        url: '/pages/warehouse/receive/receive'
      })
    }).catch(()=>{
      Dialog.close();
    })
  },

  /**
   * 扫码
   */
  scan: function () {
    app.getNetWorkType();
    let that = this;
    // 扫描类型
    let scanType = this.data.scanType;
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
  /**
   * 获取扫描码
   */
  getScanCode(scanType){
    let that = this;
    wx.scanCode({
      success: (res) => {
        let code = res.result.substring(res.result.length - 32, res.result.length);
        // 设置二维码，页面显示已扫二维码
        that.setData({
          code: code
        })
        that.getVerify(scanType);
      }
    })
  },

  getVerify:function(scanType){
    app.getNetWorkType();
    let that = this;
    // 获取出库单单号
    let id = this.billId;
    // 获取Data产品列表
    let productList = this.data.productList;
    let code = this.data.code;
    let scan = {};
    // 扫码成功后访问后台
    wx.request({
      method: "POST",
      url: url + '/api/bill/validation/receive',
      header: getApp().globalData.header,
      data: {
        billId: id,
        code: code,
        scanType: scanType
      },
      success: function (result) {
        // 校验通过执行的操作
        if (result.data.code === "000000") {
          // 循环遍历productList列表
          for (let index in productList) {
            let codeList = productList[index].scanCodeList;
            // 判断当前码的产品ID从属于productList中哪个产品
            if(result.data.result.productId !== productList[index].productId) {
              continue;
            }
            // 判断码是否已经扫了
            if (Object.keys(codeList).length === 0) { // 第一次扫码
              if(result.data.result.singleNum > productList[index].expectCount){
                wx.showToast({
                  title:'扫描单品数已超出计划量',
                  icon:'none'
                })
                return;
              }
              // 本地新增已扫码列表
              scan.code = code; // 扫描码
              scan.parentCode = result.data.result.parentCode; // 该码的所有父级码
              scan.scanType = scanType; // 扫描类型
              scan.singleNum = result.data.result.singleNum; // 单品数
              productList[index].scanCodeList.push(scan);
              productList[index].scanCount = productList[index].scanCount + result.data.result.singleNum;
            } else { // 第一次之后的扫码是否重复验证
              let exist = 0;
              let pcode = result.data.result.parentCode; // 父码
              for (let i in codeList) {
                // 判断这个码是否重复 或 验证父码是否重复
                if (codeList[i].code.includes(code) || (pcode != null && pcode.includes(codeList[i].code))) {
                  exist++;
                  break;
                }
              }
              if(exist > 0){
                wx.showToast({
                  title: '重复二维码！',
                  icon: 'none'
                })
                return;
              }
              // 判断是否超出计划
              if(productList[index].scanCount + result.data.result.singleNum > productList[index].expectCount){
                wx.showToast({
                  title:'扫描单品数已超出计划量',
                  icon:'none'
                })
                return;
              }
              //本地新增已扫码列表
              scan.code = code;
              scan.parentCode = result.data.result.parentCode;
              scan.scanType = scanType;
              scan.singleNum = result.data.result.singleNum;
              productList[index].scanCodeList.push(scan);
              productList[index].scanCount = productList[index].scanCount + result.data.result.singleNum;
            }
          }
          // 重新设置产品列表productList
          that.setData({
            productList: productList,
            codeInfo: scan,
            scanType:scanType
          })
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
  cancel: function () {
    let that = this;
    // 获取code
    let code = this.data.code;
    // 获取产品列表
    let productList = this.data.productList;
    for (let index in productList) {
      let codeList = productList[index].scanCodeList;
      for (let i in codeList) {
        if (code === codeList[i].code) {
          // 判断类型，扫描数更改
          productList[index].scanCount = productList[index].scanCount - codeList[i].singleNum;
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
  reset: function () {
    let that = this;
    let productList = this.data.productList;
    Dialog.confirm({
      message: '重置后当前单号所有扫描信息将被清空，确认重置该单号扫描？',
      confirmButtonText:'确认重置',
      cancelButtonText:'我再想想',
      showCancelButton:true
    }).then(() => {
      // on confirm
      // 重置所有产片扫描数量
      for (let index in productList) {
        productList[index].scanCodeList = [];
        productList[index].scanCount = 0;
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
    * 点击产品，查看扫码详情
    */
   showList: function (e) {
    let product = e.currentTarget.dataset.code;
    // 如果已扫码列表为空，则显示提醒
    if (product.scanCodeList.length === 0){
      wx.showToast({
        title: '请先扫码',
        icon:'none'
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
   upload: function(){
    app.getNetWorkType();
    let that = this;
    Dialog.confirm({
      message:'收货后当前单号不能再进行操作，确认收货？',
      confirmButtonText:'确认上传',
      cancelButtonText:'我再想想',
      showCancelButton:true
    }).then(()=>{
      that.receive();
    }).catch(()=>{
      Dialog.close();
    })
  },

  receive(){
    let detailList = [];//详细信息列表
    let that = this;
    let id = this.data.billId;
    let org = this.data.orgId;
    let productList  = this.data.productList;
    // 上传所需数据
    let data = {
      billId:id,
      detailList:detailList,
      orgId: org,
      remark:''
    }
     // 封装detailList
    for(let a in productList){
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
    if(data.detailList.length <= 0){
        wx.showToast({
          title:'请先扫码！',
          icon:'none'
        })
    }else {
      wx.request({
        method: 'POST',
        url: url + '/api/bill/upload/receive',
        data: data,
        header: {
          "Authorization": getApp().globalData.header.Authorization
        },
        success: function(e) {
          if("000000" === e.data.code){
            let taskId = e.data.result.businessId;
            getTaskStatus(taskId);
          }else if(e.data.code === app.globalData.overtime){
            app.refreshToken(that.receive());
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