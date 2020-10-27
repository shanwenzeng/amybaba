var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
const pay = require('../../../services/pay.js');
const app = getApp()
// 触底上拉刷新 TODO 这里要将page传给服务器，作者没写
Page({
    data: {
        orderList: [],
        allOrderList: [],
        orderDetail:[],
        allPage: 1,
        allCount: 0,
        size: 8,
        showType: '全部',
        hasOrder: 0,
        showTips: 0,
        status: {},
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
    },
    toOrderDetails: function(e) {
        let orderId = e.currentTarget.dataset.id;
        wx.setStorageSync('orderId', orderId)
        wx.navigateTo({
            url: '/pages/ucenter/order-details/index?status=1&id='+orderId,
        })
    },
    payOrder: function(e) {
        let orderId = e.currentTarget.dataset.orderid;
        let that = this;
        pay.payOrder(parseInt(orderId)).then(res => {
            let showType = wx.getStorageSync('showType');
            that.setData({
                showType: showType,
                orderList: [],
                allOrderList: [],
                allPage: 1,
                allCount: 0,
                size: 8
            });
            that.getOrderList();
            that.getOrderInfo();
        }).catch(res => {
            util.showErrorToast(res.errmsg);
        });
    },
    getOrderInfo: function(e) {
        let that = this;
        util.request(api.OrderCountInfo).then(function(res) {
            if (res.errno === 0) {
                let status = res.data;
                that.setData({
                    status: status
                });
            }
        });
    },
    //获取订单信息
    getOrderList() {
        let that = this;
        let showType=wx.getStorageSync('showType');//获取缓存中的订单状态
        let openId=wx.getStorageSync('openId');
        var obj={};//传递给后台的参数
        if(showType==undefined || showType=='全部'){//全部不传递状态，全部查询出来
            obj={customer:{id: openId }};
        }else{//待发货或者待收货
            obj={customer:{id:openId },status:showType};
        }
        util.request(api.OrderList,obj).then(function(res) {
            if (res.length > 0) {
                let count = res.length;
                for(let i=0;i<res.length;i++){
                    res[i].createTime=util.formatTime(new Date(res[i].createTime))//重新设置时间格式
                    if(res[i].allImage!=undefined && res[i].allImage!=null && res[i].allImage.length>0){
                        res[i].allImage=res[i].allImage.split(",");
                    }
                }
                that.setData({
                    allCount: count,
                    // allOrderList: that.data.allOrderList.concat(res),
                    // allPage: res.data.currentPage,
                    orderList: that.data.allOrderList.concat(res)
                });
                let hasOrderData = that.data.allOrderList.concat(res);
                if (count == 0) {
                    that.setData({
                        hasOrder: 1
                    });
                }
            }
        });
    
    },
    toIndexPage: function(e) {
        wx.switchTab({
            url: '/pages/index/index'
        });
    },
    onLoad: function() {
        this.setData({
            showType: wx.getStorageSync('showType')
        });
    },
    onShow: function() {
        let nowShowType = this.data.showType;
        let doRefresh = wx.getStorageSync('doRefresh');
        // if (nowShowType != showType || doRefresh == 1) {
        //     this.setData({
        //         showType: showType,
        //         orderList: [],
        //         allOrderList: [],
        //         allPage: 1,
        //         allCount: 0,
        //         size: 8
        //     });
        //     this.getOrderList();
        //     wx.removeStorageSync('doRefresh');
        // }
        // this.getOrderInfo();
        this.getOrderList();//查询订单
        this.findOrderByStatus();//根据订单状态统计订单各种状态数量
    },
    switchTab: function(event) {
        let showType = event.currentTarget.dataset.index;
        wx.setStorageSync('showType', showType);
        this.setData({
            showType: showType,
            orderList: [],
            allOrderList: [],
            allPage: 1,
            allCount: 0,
            size: 8
        });
        // this.getOrderInfo();
        this.getOrderList();
    },
    // “取消订单”点击效果
    cancelOrder: function(e) {
        let that = this;
        let orderId = e.currentTarget.dataset.index;
        wx.showModal({
            title: '',
            content: '确定要取消此订单？',
            success: function(res) {
                if (res.confirm) {
                    util.request(api.OrderCancel, {
                        orderId: orderId
                    }, 'POST').then(function(res) {
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
                            that.getOrderList();
                        } else {
                            util.showErrorToast(res.errmsg);
                        }
                    });
                }
            }
        });
    },
    onReachBottom: function() {
        let that = this;
        if (that.data.allCount / that.data.size < that.data.allPage) {
            that.setData({
                showTips: 1
            });
            return false;
        }
        that.setData({
            'allPage': that.data.allPage + 1
        });
        that.getOrderList();
    },
    //根据订单状态统计订单各种状态数量
    findOrderByStatus:function(){
        let that = this;
        util.request(api.findOrderByStatus,{customer:{id:wx.getStorageSync('openId')}}).then(function(res) {
            if (res.code > 0) {
                let status={},all=0;
                for(let i=0;i<res.data.length;i++){
                    if(res.data[i].status=="待付款"){
                        status.waitPay=res.data[i].count;
                    }else if(res.data[i].status=="待发货"){
                        status.waitSend=res.data[i].count;
                    }else if(res.data[i].status=="待收货"){
                        status.waitReceive=res.data[i].count;
                    }else if(res.data[i].status=="已收货"){
                        status.Received=res.data[i].count;
                    }
                    all+=res.data[i].count;//统计总数量
                }
                status.all=all;//全部订单数据
                that.setData({status:status});
            }
        });
    }
})