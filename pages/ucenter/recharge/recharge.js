var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');

var app = getApp();

Page({
    data: {
        rechargeList: [],
        allrechargeList: [],
        page: 1,
        allCount: 0,
        size: 10,
        hasPrint: 1,
        money:'0'
    },
    //查找充值记录
    getRecharge() {
        let that = this;
        util.request(api.findRecharge, {
            customer:{id:wx.getStorageSync('openId')},
            page:that.data.page,
            rowsCount:that.data.size
        }).then(function (res) {
            if (res.data.length > 0) {
                that.setData({
                    rechargeList: that.data.rechargeList.concat(res.data),//查询出来的数据
                    allCount:res.total//总记录数
                });
            }else{
                that.setData({ 
                        hasPrint: 0
                    });
            }
        });
    },
    onLoad: function (options) {
        this.getRecharge();//页面加载时，查询浏览历史
    },
    onBottom: function () {
        console.log(55)
        let that = this;
        if (that.data.allCount / that.data.size < that.data.page) {
            that.setData({
                showNoMore: 0
            });
            return false;
        }
        that.setData({
            allPage: that.data.allPage + 1
        });
        this.getRecharge();//查询充值记录
    }
})