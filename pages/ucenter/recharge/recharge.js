var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');

var app = getApp();

Page({
    data: {
        rechargeList: [],
        allrechargeList: [],
        page: 1,    //当前页
        size: 12,   //每页显示的条数
        total: 0,   //数据库里总共的记录
        hasPrint: 1,
        money:'0',
    },
    //查找充值记录
    getRecharge() {
        let that = this;
        util.request(api.findRecharge, {
            customer:{id:wx.getStorageSync('openId')},
            page:that.data.page, //当前页面
            rowsCount:that.data.size,   //每页显示的条数
        }).then(function (res) {
            if (res.data.length > 0) {
                that.setData({
                    rechargeList: that.data.rechargeList.concat(res.data),//查询出来的数据
                    total:res.total,//总记录数
                    showNoMore: 1,  //1为下一页还有数据了
                });
            }else{
                that.setData({ 
                    hasPrint: 0,
                    showNoMore: 0   //0为下一页没有数据了
                });
            }
        });
    },
    onLoad: function (options) {
        this.getRecharge();//页面加载时，查询浏览历史
    },
    onShow: function(){
    },

    //触底后执行
    onReachBottom: function () {
        let that = this;
        if (that.data.total / that.data.size < that.data.page) {
            that.setData({
                showNoMore: 0 //0为下一页没有数据了
            });
            return false;
        }
        that.setData({
            page: that.data.page + 1  //当前页面的页码加1
        });
        this.getRecharge();//查询充值记录
    }
})