import Dialog from "../../../wxcomponents/vant/dist/dialog/dialog";
import publicFunction from '../../../publicFunction/request'
// pages/warehouse/deliverDetail/deliverDetail.js
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
        title:'操作成功',
        icon:'success', 
        duration:2000, 
        success() { 
          setTimeout(function () { 
            wx.redirectTo({ 
              url: '/pages/warehouse/outOfStock/outOfStock' 
            }) 
          },2000); 
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
    codeInfo:'',// 二维码详细信息
    exist:'', // 验证是否重复扫码
    scanType:'',// 扫码类型
    scanList: [],
    detail:'',
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    // 获取上个页面传过来的出库单详情
    that.setData({
      order: JSON.parse(options.order),
      billId: JSON.parse(options.order).id,
      orgId: JSON.parse(options.order).orgId
    })
    // 设置出库单号
    this.billId = JSON.parse(options.order).id;
    let id = JSON.parse(options.order).id;
    // 产品列表
    this.getProductList(id);
  },
  /**
   * 获取产品列表
   */
  getProductList(id){
    app.getNetWorkType();
    let that = this;
    let productList;
    let request = new publicFunction;
    request.getRequest(url + '/api/bill/getProductInfo/deliver/' + id,null,getApp().globalData.header).then(res =>{
      productList = res.data.result;
      // 计算之前已扫箱托单码数量
      for(let index in productList){
        let scanCodes = productList[index].scanCodeList;
        for(let i in scanCodes){
          productList[index].scanCount = productList[index].scanCount;
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
        productList: res.data.result,
      })
    })
  },
  // 按钮触摸开始触发的事件
  touchStart: function(e) {
    this.touchStartTime = e.timeStamp
  },
  // 按钮触摸结束触发的事件
  touchEnd: function(e) {
    this.touchEndTime = e.timeStamp
  },
  /**
   * 扫码
   */
  click: function () {
    let that = this;
    // 扫描类型
    let scanType = this.data.scanType;
    if (that.touchEndTime - that.touchStartTime < 350) {
      if(scanType !== ''){
        that.scanCode(scanType);
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
          that.scanCode(scanType);
        }
      })
      return;
    }           
  },
  scanCode(scanType){
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
  /**
   * 扫码验证
   */
  getVerify:function(scanType){
    let code = this.data.code;
    app.getNetWorkType();
    let that = this;
    // 获取出库单单号
    let id = this.billId;
    // 获取Data产品列表
    let productList = this.data.productList;
    let scan = {};
    let scanList = this.data.scanList;
    // 扫码成功后访问后台
    wx.request({
      method: "POST",
      url: url + '/api/bill/validation/deliver',
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
              // 判断是否超出计划
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
              scanList.push(code);
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
              productList[index].scanCodeList.push(scan)
              productList[index].scanCount = productList[index].scanCount + result.data.result.singleNum;
              scanList.push(code);
            }
          }
          // 重新设置产品列表productList
          that.setData({
            productList: productList,
            codeInfo: scan,
            scanType:scanType,
            scanList: scanList
          })
        }else if(app.globalData.overtime === result.data.code ){
          app.refreshToken(that.getVerify(scanType))
        } else { //扫码校验失败
          Dialog.alert({
            message:result.data.message
          }).then(() => {
          // on close
          });
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
    let code = this.data.codeInfo;
    // 获取产品列表
    let productList = this.data.productList;
    for (let index in productList) {
      let codeList = productList[index].scanCodeList;
      for (let i in codeList) {
        if (code.code === codeList[i].code) {
          // 扫描数更改
          productList[index].scanCount = productList[index].scanCount - code.singleNum;
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
    let scanList = this.data.scanList;
    Dialog.confirm({
      message: '重置后当前单号所有扫描信息将被清空，确认重置该单号扫描？',
      confirmButtonText:'确认重置',
      cancelButtonText:'我再想想',
      showCancelButton:true
    }).then(() => {
      // on confirm
      // 重置所有产片扫描数量
      for (let index in productList) {
        let scanCodeList = productList[index].scanCodeList;
        for(let s in scanCodeList){
          for(let l in scanList){
            if(scanList[l] === scanCodeList[s].code){
              productList[index].scanCount = productList[index].scanCount - scanCodeList[s].singleNum;
              productList[index].scanCodeList.splice(s,1);
            }
          }
        }
        // productList[index].scanCount = 0;
        // productList[index].scanCodeList = [];
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
   * 返回上一页
   */
  return() {
    Dialog.confirm({
      message:'您的当前出库单还有产品未保存或上传，退出后未上传码将不被记录，确定要退出该页面吗？',
      confirmButtonText:'去意已决',
      cancelButtonText:'我再想想',
      showCancelButton:true
    }).then(() =>{
      wx.redirectTo({
        url: '/pages/warehouse/outOfStock/outOfStock'
      })
    }).catch(()=>{
      Dialog.close();
    })
  },
   /**
    * 点击产品，查看扫码详情
    */
   showList: function (e) {
     let product = e.currentTarget.dataset.code;
     let that = this;
     // 如果已扫码列表为空，则显示提醒
     if (product.scanCodeList.length === 0){
       wx.showToast({
         title: '请先扫码',
         icon:'none'
       })
       return;
     }
     product.showModal = true;
     that.setData({
        detail:product
      })
    },
    /**
     * 弹窗点击确认事件
     */
    onClose() {
      let detail = this.data.detail;
      detail.showModal =false;
      this.setData({
        detail: detail
      })
    },
    /**
     * 保存按钮点击事件
     */
    save:function(){
      app.getNetWorkType();
      let that = this;
      Dialog.confirm({
        message:'保存后当前单号下次还能进行处理，确认进行保存？',
        confirmButtonText:'确认保存',
        cancelButtonText:'我再想想',
        showCancelButton:true
      }).then(()=>{// 点击确认
        that.saveStock();
      }).catch(()=>{
        Dialog.close();
      })   
    },
  saveStock(){
    let that = this;
    let detailList = [];//详细信息列表
     // 保存所需数据
     let id = this.data.billId;
     let org = this.data.orgId;
     let productList = this.data.productList;
     let data = {
       billId: id,
       detailList: detailList,
       orgId: org,
       remark:''
     }
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
     if(data.detailList.length <= 0){
         wx.showToast({
           title: '请先扫码',
           icon: 'none'
         })
     }else {
       wx.request({
         method: 'POST',
         url: url + '/api/bill/save/deliver',
         data: data,
         header: {
           "Authorization": getApp().globalData.header.Authorization
         },
         success: function (e) {
           if ("000000" === e.data.code) {
            let taskId = e.data.result.businessId;
            getTaskStatus(taskId);
           }else if(app.globalData.overtime === e.data.code){
             app.refreshToken(that.saveStock());
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
   * 上传按钮点击事件
   */
  upload: function(){
    app.getNetWorkType();
    let that = this;
    Dialog.confirm({
      message:'上传后当前单号不能再进行操作，确认上传？',
      confirmButtonText:'确认上传',
      cancelButtonText:'我再想想',
      showCancelButton:true
    }).then(()=>{
      that.outStock();
    }).catch(()=>{
      Dialog.close();
    })
  },
  outStock(){
    let that = this;
    let detailList = [];//详细信息列表
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
        url: url + '/api/bill/upload/deliver',
        data: data,
        header: {
          "Authorization": getApp().globalData.header.Authorization
        },
        success: function(e) {
          if("000000" === e.data.code){
            let taskId = e.data.result.businessId;
            getTaskStatus(taskId);
          }else if(e.data.code === app.globalData.overtime){
            app.refreshToken(that.outStock())
          }else {
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
   * 剔除扫码
   */
  scan: function(){
    let that = this;
    let eliminateCode; // 初始化code
    wx.scanCode({
      success: (res) =>{
        eliminateCode = res.result.substring(res.result.length - 32, res.result.length);
        let exist = 0;
        let productList  = this.data.productList;
        for(let index in productList){
          let codeList = productList[index].scanCodeList;
          for (let i in codeList) {
            if (eliminateCode === codeList[i].code) {
             exist++
            }
          }
        }
        that.setData({
          eliminateCode:eliminateCode,
          exist:exist
        })
      }
    })
  },
  /**
   * 获取输入剔除嘛
   */
  getEliminateCode(e){
    let exist = 0;
    let productList  = this.data.productList;
    for(let index in productList){
      let codeList = productList[index].scanCodeList;
      for (let i in codeList) {
        if (e.detail.value === codeList[i].code) {
         exist++
        }
      }
    }
    this.setData({
      eliminateCode:e.detail.value,
      exist: exist
    })
  },
  /**
   * 剔除按钮点击事件
   */
  eliminate: function(){
    let that = this;
    // 获取产品列表
    let productList  = this.data.productList;
    // 获取要剔除的码
    let code = this.data.eliminateCode;
    if(this.data.exist === 0){
      wx.showToast({
        title:'请输入或扫描已扫的二维码',
        icon:'none'
      })
      that.setData({
        eliminateCode: ''
      });
      return;
    }
    for (let index in productList) {
      let codeList = productList[index].scanCodeList;
      for (let i in codeList) {
        if (code === codeList[i].code) {
          // 扫描数更改
          productList[index].scanCount = productList[index].scanCount - codeList[i].singleNum;
          // 从codeList中删除对应的code
          codeList.splice(i, 1);
        }
      }
    }
    wx.showToast({
      title:'剔除成功'
    })
    // 更新产品列表
    that.setData({
      eliminateCode: '',
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
  show: function(){
    this.setData({
      showInfo: true
    })
  },

  /**
   * 弹出层
   */
  close: function(){
    this.setData({
      eliminateCode:'',
      showInfo: false
    })
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
            that.scanCode(scanType)
        }
    })
  }, 
})