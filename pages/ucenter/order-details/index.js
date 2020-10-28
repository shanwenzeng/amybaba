var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
var timer = require('../../../utils/wxTimer.js');
var remaintimer = require('../../../utils/remainTime.js');
const pay = require('../../../services/pay.js');
const app = getApp()

// TODO 拼团订单不能退款
Page({
    data: {
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
        discount:'0',//优惠
        orderId: 0,
        orderInfo: {},
        orderGoods: [],
        handleOption: {},
        textCode: {},
        goodsCount: 0,
        goods_price:0,
        ship:0,
        addressId: 0,
        postscript: '',
        hasPay: 0,
        success: 0,
        imageUrl: '',
        wxTimerList: {},
        express: {},
        onPosting: 0,
        userInfo:{},
        address:{
            name:'',
            phone:'',
            province:'',
            city:'',
            district:'',
            address:''
        }
    },
    reOrderAgain: function () {
        let orderId = this.data.orderId
        wx.redirectTo({
            url: '/pages/order-check/index?addtype=2&orderFrom=' + orderId
        })
    },
    copyText: function (e) {
        let data = e.currentTarget.dataset.text;
        wx.setClipboardData({
            data: data,
            success(res) {
                wx.getClipboardData({
                    success(res) {}
                })
            }
        })
    },
    toGoodsList: function (e) {
        let productIds = this.data.orderInfo.productIds;
        wx.navigateTo({
            url: '/pages/ucenter/goods-list/index?status=1&id=' + productIds,
        });
    },
    toExpressInfo: function (e) {
        let orderId = this.data.orderId;
        wx.navigateTo({
            url: '/pages/ucenter/express-info/index?id=' + orderId,
        });
    },
    toRefundSelect: function (e) {
        wx.navigateTo({
            url: '/pages/refund-select/index',
        });
    },
    payOrder: function (e) {
        let that = this;
        pay.payOrder(parseInt(that.data.orderId)).then(res => {
            that.getOrderDetail();
        }).catch(res => {
            util.showErrorToast(res.errmsg);
        });
    },
    toSelectAddress: function () {
        let orderId = this.data.orderId;
        wx.navigateTo({
            url: '/pages/ucenter/address-select/index?id=' + orderId,
        });
    },
    onLoad: function (options) {
        this.data.orderId=wx.getStorageSync('orderId');
    },
    onShow: function () {
        var orderId = wx.getStorageSync('orderId');
        let userInfo = wx.getStorageSync('userInfo');
        this.setData({
            orderId: orderId,
            userInfo:userInfo
        });
        wx.showLoading({
            title: '加载中...',
        })
        this.getOrderDetail();//查询订单详情
        // this.getExpressInfo();
    },
    onUnload: function () {
        let oCancel = this.data.handleOption.cancel;
        if (oCancel == true) {
            let orderTimerID = this.data.wxTimerList.orderTimer.wxIntId;
            clearInterval(orderTimerID);
        }
    },
    onHide: function () {
        let oCancel = this.data.handleOption.cancel;
        if (oCancel == true) {
            let orderTimerID = this.data.wxTimerList.orderTimer.wxIntId;
            clearInterval(orderTimerID);
        }
    },
    orderTimer: function (endTime) {
        let that = this;
        var orderTimerID = '';
        let wxTimer2 = new timer({
            endTime: endTime,
            name: 'orderTimer',
            id: orderTimerID,
            complete: function () {
                that.letOrderCancel();
            },
        })
        wxTimer2.start(that);
    },
    bindinputMemo(event) {
        let postscript = event.detail.value;
        this.setData({
            postscript: postscript
        });
    },
    getExpressInfo: function () {
        this.setData({
            onPosting: 0
        })
        let that = this;
        util.request(api.OrderDetail, {
            orderId: that.data.orderId
        }).then(function (res) {
            if (res.data.length > 0) {
                let express = res.data;
                // express.traces = JSON.parse(res.data.traces);
                that.setData({
                    onPosting: 1,
                    express: express
                });
            }
        });
    },
    getOrderDetail: function () {
        let that = this;
        let amount=0;
        let price=0;
        let orderInfo={};
        util.request(api.OrderList, {
            customer:{id:wx.getStorageSync('openId')},
            id: that.data.orderId
        }).then(function (res) {
            if (res.length > 0) {
                res[0].createTime=util.formatTime(new Date(res[0].createTime))//重新设置时间格式
                //将图片拆分成数组
                if(res[0].allImage!=undefined && res[0].allImage!=null && res[0].allImage.length>0){
                    res[0].allImage=res[0].allImage.split(",");
                }
                that.setData({
                    address:{
                        name:res[0].name,
                        phone:res[0].phone,
                        province:res[0].province,
                        city:res[0].city,
                        district:res[0].district,
                        address:res[0].address
                    },
                    orderInfo:{
                        allImage:res[0].allImage,
                        amount: res[0].amount,
                        price:res[0].price,
                        createTime:res[0].createTime,
                        number:res[0].number,
                        status:res[0].status,
                        productIds:res[0].productIds.split(",")
                    }
                });
                if(res[0].status == "待付款"){
                    that.setData({
                        handleOption:{
                            cancel: true,
                            pay: true
                        }
                    })
                }
                if(res[0].status == "待发货" || res[0].status == "待收货"){
                    that.setData({
                        handleOption:{
                            confirm: true
                        }
                    })
                }
            }
        });
        wx.hideLoading();
    },
    letOrderCancel: function () {
        let that = this;
        util.request(api.OrderCancel, {
            orderId: that.data.orderId
        }, 'POST').then(function (res) {
            if (res.errno === 0) {
                that.getOrderDetail();
            } else {
                util.showErrorToast(res.errmsg);
            }
        });
    },
    // “删除”点击效果
    deleteOrder: function () {
        let that = this;
        wx.showModal({
            title: '',
            content: '确定要删除此订单？',
            success: function (res) {
                if (res.confirm) {
                    util.request(api.OrderDelete, {
                        orderId: that.data.orderId
                    }, 'POST').then(function (res) {
                        if (res.errno === 0) {
                            wx.showToast({
                                title: '删除订单成功'
                            });
                            wx.removeStorageSync('orderId');
                            wx.setStorageSync('doRefresh', 1);
                            wx.navigateBack();
                        } else {
                            util.showErrorToast(res.errmsg);
                        }
                    });
                }
            }
        });
    },
    // “确认收货”点击效果
    confirmOrder: function () {
        let that = this;
        wx.showModal({
            title: '',
            content: '收到货了？确认收货？',
            success: function (res) {
                if (res.confirm) {
                    util.request(api.OrderConfirm, {
                        orderId: that.data.orderId
                    }, 'POST').then(function (res) {
                        if (res.errno === 0) {
                            wx.showToast({
                                title: '确认收货成功！'
                            });
                            wx.setStorageSync('doRefresh', 1);
                            that.getOrderDetail();
                        } else {
                            util.showErrorToast(res.errmsg);
                        }
                    });
                }
            }
        });
    },
    // “取消订单”点击效果
    cancelOrder: function (e) {
        let that = this;
        wx.showModal({
            title: '',
            content: '确定要取消此订单？',
            success: function (res) {
                if (res.confirm) {
                    util.request(api.OrderCancel, {
                        orderId: that.data.orderId
                    }, 'POST').then(function (res) {
                        if (res.errno === 0) {
                            wx.showToast({
                                title: '取消订单成功'
                            });
                            that.setData({
                                orderList: [],
                                allOrderList: [],
                                allPage: 1,
                                allCount: 0,
                                size: 8
                            });
                            wx.setStorageSync('doRefresh', 1);
                            let orderTimerID = that.data.wxTimerList.orderTimer.wxIntId;
                            clearInterval(orderTimerID);
                            that.getOrderDetail();
                        } else {
                            util.showErrorToast(res.errmsg);
                        }
                    });
                }
            }
        });
    },
})