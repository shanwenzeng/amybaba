var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');

var app = getApp();

Page({
    data: {
        rechargeList: [],
        allrechargeList: [],
        allPage: 1,
        allCount: 0,
        size: 8,
        hasPrint: 1,
        money:'0'
    },
    //查找余额
    getRecharge() {
        let that = this;
        util.request(api.findRecharge, {customer:{id:wx.getStorageSync('openId')}}).then(function (res) {
            if (res.data.length > 0) {
                let count = res.data.length;
                that.setData({
                    allCount: count,
                    allPage: 1,
                    rechargeList: res.data,
                    size:count
                });
            }else{
                that.setData({ 
                        hasPrint: 0
                    });
            }
        });
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
    onLoad: function (options) {
        this.getRecharge();//页面加载时，查询浏览历史
        // this.getMoney();//获取余额
    },
})