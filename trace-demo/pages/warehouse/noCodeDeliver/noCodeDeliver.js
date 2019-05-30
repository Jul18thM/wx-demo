import Dialog from "../../../wxcomponents/vant/dist/dialog/dialog";

// pages/warehouse/noCodeDeliver/noCodeDeliver.js
const url = getApp().globalData.globalUrl;
const app = getApp();
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
           title:'出库成功', 
           icon:'success', 
           duration:2000, 
           success() { 
            let timer = setTimeout(function () { 
               wx.reLaunch({ 
                 url: '/pages/home/index'
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
    allProducts: '', //所有产品
    code: '', // 二维码
    products:'',// 产品
    orgList:'',// 下属机构对象集合
    searchList:'',// 查询下属机构对象集合
    receiveName:'请选择出库方',// 收货方
    receiveTel:'', //收货电话
    receiveAddress:'', // 收货地址
    receiveId:'',//收货方ID
    actions:[], // vant ActionSheet上拉菜单数据
    show:false,
    eliminateCode:'',
    showInfo: false ,// 是否显示提示
    sendOrgId:'',
    scanType:'',
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom,
    detail:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取所有产品
    this.getAllProducts();
    // 获取所有经销商
    this.getAllDeadler();
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
        success: function (e) {
          if(e.data.code == app.globalData.overtime){
              app.refreshToken(that.getAllProducts())
              return;
          }
          // 加入扫码列表对象
          for(let i in e.data.result){
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
   * 获取所有经销商
   */
  getAllDeadler(){
    app.getNetWorkType();
    let that = this;
    wx.request({
        url: url + '/api/org/getDealerList/all',
        method: 'GET',
        header: getApp().globalData.header,
        success(e) {
            if(e.data.code === app.globalData.overtime){
                app.refreshToken(that.getAllDeadler());
                return;
            }
          let actions = []; // vant ActionSheet上拉菜单数据
          for(let r in e.data.result){
              if(e.data.result[r].id === app.globalData.userInfo.orgId){
                  continue;
              }
              let name =  e.data.result[r].name;
              actions.push({'name': name})
          }
          that.setData({
            orgList: e.data.result,
            searchList:e.data.result,
            actions: actions
          })
        }
      })
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
    }).then(()=>{
        wx.reLaunch({
            url:'/pages/home/index'
          })
    }).catch(()=>{
        Dialog.close();
    })
  },
  /**
   * 根据name模糊查询对应产品,键盘抬起事件
   */
  searchProduct:function(e){
    let that = this;
    // 获取name
    let name = e.detail.value;
    let allProducts = this.data.allProducts
    let temp=[];// 临时变量，用来存放模糊匹配数据
    // 根据name模糊查询
    for(let i in allProducts){
      if(allProducts[i].name.includes(name)){
        temp.push(allProducts[i])
      }
    }
    that.setData({
      products: temp
    })
  },
    /**
     * 模糊查询收货方
     */
    searchReceiver:function(e){
        let that = this;
        // 获取name
        let name = e.detail;
        let orgList = this.data.orgList
        let temp=[];// 临时变量，用来存放模糊匹配数据
        // 根据name模糊查询
        for(let i in orgList){
            if(orgList[i].name.includes(name)){
                temp.push({'name':orgList[i].name})
            }
        }
        that.setData({
            actions: temp
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
     * 选择机构
     */
    onSelect(e){
        let that = this;
        let orgList = this.data.orgList;
        for(let i in orgList){
            if(orgList[i].name === e.detail.name){
                that.setData({
                    receiveId:orgList[i].id,
                    receiveName:e.detail.name,
                    receiveTel:orgList[i].tel, //收货电话
                    receiveAddress:orgList[i].address,
                    show:false    
                })
                break;
            }
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
    /**
     * 扫码
     */
    scanCode: function (longTap) {
        let that = this;
        if(this.data.receiveName === '请选择出库方'){
            wx.showToast({
                title:'请先选择出库方',
                icon:'none'
            })
            return;
        }
        // 扫描类型
        let scanType = this.data.scanType;
        if (that.touchEndTime - that.touchStartTime < 350) {
            if(scanType != ''){
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
     * @param {扫码类型} scanType 
     */
    getVerify:function(scanType){
        app.getNetWorkType();
        let that = this;
        // 获取所有产品信息
        let allProducts = this.data.allProducts;
        let scan = {};
        let list=[];
        let code = this.data.code;
        // 扫码成功后访问后台
        wx.request({
            method: "POST",
            url: url + '/api/bill/validation/deliver?XDEBUG_SESSION_START=1',
            header: getApp().globalData.header,
            data: {
                billId: '',
                code: code,
                scanType: scanType
            },
            success: function (result) {
                // 校验通过执行的操作
                if (result.data.code === "000000") {
                    // 循环遍历allProducts列表
                    for (let index in allProducts) {
                        let codeList = allProducts[index].scanCodeList;
                        // 判断当前码的产品ID从属于productList中哪个产品
                        if(result.data.result.productId !== allProducts[index].id) {
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
                            allProducts[index].scanCodeList.push(scan);
                        } else { // 第一次之后的扫码是否重复验证
                            let exist = 0;
                            let pcode = result.data.result.parentCode;
                            for (let i in codeList) {
                                // 判断这个码是否在已扫码列表中 或 判断这个码的父码是否已经扫了
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
                            }else {
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
                    for(let a in allProducts){ 
                        // 判断产品列表中的已扫码列表不为空
                        if(allProducts[a].scanCodeList.length > 0){
                            let scanNum = 0
                            for(let s in allProducts[a].scanCodeList){
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
                } else if(result.data.code === app.globalData.overtime){
                    app.refreshToken(that.getVerify(scanType))

                }else { //扫码校验失败
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
            if(productList[index].scanNum === 0){
                productList.splice(index,1);
            }
        }
        // 更新产品列表
        that.setData({
            code: '',
            products: productList
        })
    },

    /**
     * 重置按钮点击事件
     */
    reset: function () {
        let that = this;
        Dialog.confirm({
            message:'重置后当前单号所有扫描信息将被清空，确认重置该单号扫描？',
            confirmButtonText:'确认重置',
            cancelButtonText:'我再想想',
            showCancelButton:true
        }).then(()=>{
            let allProducts =  that.data.allProducts;
            for(let i in allProducts){
                allProducts[i].scanCodeList = [];
                allProducts[i].scanNum = 0;  
            }
            // 重置所有产片扫描数量
            that.setData({
                allProducts:allProducts,
                products: '',
                code: ''
            })
        }).catch(()=>{
            Dialog.close();
        })
    },
    /**
     * 上传按钮点击事件
     */
    upload: function(){
        let that = this;
        app.getNetWorkType(); 
        Dialog.confirm({
            message:'当前扫描码将会上传，确认登记出库信息？',
            confirmButtonText:'确认出库',
            cancelButtonText:'我再想想',
            showCancelButton:true
        }).then(()=>{
           that.outStock();
        }).catch(()=>{
            Dialog.close();
        })
    },

    outStock(){
        let detailList = [];//详细信息列表
        let that = this;
        let orgId = this.data.receiveId;
        let productList  = this.data.products;
        // 上传所需数据
        let data = {
            billId:'',
            detailList:detailList,
            orgId: orgId,
            remark:''
        }
         // 封装detailList
        for(let a in productList){
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
                        app.refreshToken(that.outStock());
                        return;
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
     * 点击产品，查看扫码详情
     */
   showList: function (e) {
    let that = this;
    let product = e.currentTarget.dataset.code;
    // 如果已扫码列表为空，则显示提醒
    if (product.scanCodeList.length === 0){
      wx.showToast({
        title: '请先扫码',
        icon:'none'
      })
      return
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
   /**
   * 剔除扫码
   */
  scan: function(){
    let that = this;
    let exist = 0;
    let eliminateCode; // 初始化code
    wx.scanCode({
      success: (res) =>{
        eliminateCode = res.result.substring(res.result.length - 32, res.result.length);
        let productList = this.data.products;
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
   * 获取输入剔除码
   */
  getEliminateCode(e){
    let exist = 0;
    let productList = this.data.products;
    for(let index in productList){
      let codeList = productList[index].scanCodeList;
      for (let i in codeList) {
        if (e.detail === codeList[i].code) {
         exist++
        }
      }
    }
    this.setData({
      eliminateCode:e.detail,
      exist: exist
    })
  },
  /**
   * 剔除按钮点击事件
   */
  eliminate: function(){
    let that = this;
    // 获取产品列表
    let productList  = this.data.products;
    // 获取要剔除的码
    let code = this.data.eliminateCode;
    if(code == ''){
        wx.showToast({
            title:'请输入或扫描码',
            icon:'none'
        })
    }
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
                // 判断类型，扫描数更改
                productList[index].scanNum = productList[index].scanNum - codeList[i].singleNum;
                // 从codeList中删除对应的code
                codeList.splice(i, 1);
            }
        }
        // 如果哪个产品的扫码数量为0 则不显示这个产品的相关信息
        if(productList[index].scanNum === 0){
            productList.splice(index,1);
        }
    }
    wx.showToast({
        title:'剔除成功'
    })
    // 更新产品列表
    that.setData({
        eliminateCode: '',
        products: productList,
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
    if(this.data.receiveName === '请选择出库方'){
        wx.showToast({
            title:'请先选择出库方',
            icon:'none'
        })
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
            that.getScanCode(scanType)
        }
    })
  }, 
})