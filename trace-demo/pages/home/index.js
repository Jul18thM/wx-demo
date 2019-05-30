// pages/home/index.js
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        //tabbar
        tabbar: {},
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        app.editTabbar();
        wx.hideTabBar();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        wx.hideTabBar();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        wx.hideTabBar();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },

    outStock: function () {
        // 有出库单出库
        wx.redirectTo({
            url: '/pages/warehouse/outOfStock/outOfStock',
        });
        // 无出库单出库
        // wx.redirectTo({
        //   url: '/pages/warehouse/noCodeDeliver/noCodeDeliver',
        // })
    },

    /**
     *   跳转调拨页面
     */
    allocation: function () {
        wx.navigateTo({
            url: '/pages/warehouse/allocation/allocation',
        })
    },

    /**
     * 跳转退货页面
     */
    returnGoods: function () {
        wx.navigateTo({
            url: '/pages/warehouse/returnGoods/returnGoods',
        })
    },

    /**
     * 跳转收货页面
     */
    confirmReceive: function () {
        wx.redirectTo({
            url: '/pages/warehouse/receive/receive'
        })
    }
})