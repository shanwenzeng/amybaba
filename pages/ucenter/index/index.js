var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
var user = require('../../../services/user.js');

// TODO 订单显示数量在图标上

const app = getApp()

Page({
    data: {
        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        status: {},
        money:'0',//;余额
    },
    goProfile: function (e) {
        let res = util.loginNow();
        if (res == true) {
            wx.navigateTo({
                url: '/pages/ucenter/settings/index',
            });
        }
    },
    toOrderListTap: function(event) {
        let res = util.loginNow();
        if (res == true) {
            let showType = event.currentTarget.dataset.index;
            wx.setStorageSync('showType', showType);
            wx.navigateTo({
                url: '/pages/ucenter/order-list/index?showType=' + showType,
            });
        }
    },
    //查找消费者余额
    getMoney(){
        let that = this;
        util.request(api.FindCustomer,{id:wx.getStorageSync('openId')}).then(function(res) {
            if (res!='') {
                that.setData({
                   money:res.money
                });
                wx.setStorageSync("money",res.money);//将我的余额存入缓存
            }
        });
    },
    //前往充值中心
    toMoney: function(e) {
        let res = util.loginNow();
        if (res == true) {
            wx.navigateTo({
                url: '/pages/ucenter/money/money',
            });
        }
    },
    //前往地址管理
    toAddressList: function(e) {
        let res = util.loginNow();
        if (res == true) {
            wx.navigateTo({
                url: '/pages/ucenter/address/index?type=0',
            });
        }
    },
    toAbout: function () {
        wx.navigateTo({
            url: '/pages/ucenter/about/index',
        });
    },
    toFootprint: function(e) {
        let res = util.loginNow();
        if (res == true) {
            wx.navigateTo({
                url: '/pages/ucenter/footprint/index',
            });
        }
    },
    goAuth: function(e) {
        wx.navigateTo({
            url: '/pages/app-auth/index',
        });
    },
    onLoad: function(options) {
    },
    onShow: function() {
        let userInfo = wx.getStorageSync('userInfo');
        if(userInfo == ''){
            this.setData({
                hasUserInfo: 0,
            });
        }
        else{
            this.setData({
                hasUserInfo: 1,
            });
        }
        this.setData({
            userInfo: userInfo,
        });
        this.getMoney();//获取余额
        this.getOrderInfo();
        wx.removeStorageSync('categoryId');
    },

    onPullDownRefresh: function() {
        wx.showNavigationBarLoading()
        this.getOrderInfo();
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
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
})