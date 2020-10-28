var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');

var app = getApp();

Page({
    data: {
        footprintList: [],
        allFootprintList: [],
        page: 1,    //当前页
        size: 8,   //每页显示的条数
        total: 0,   //数据库里总共的记录
        hasPrint: 1,
        showNoMore: 0,
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
    },
    getFootprintList() {
        let that = this;
        util.request(api.FootprintList, { page: that.data.page, size: that.data.size }).then(function (res) {
            if (res.errno === 0) {
                let count = res.data.count;
                let f1 = that.data.footprintList;
                let f2 = res.data.data;
                for (let i = 0; i < f2.length; i++) {
                    let last = f1.length - 1;
                    if (last >= 0 && f1[last][0].add_time == f2[i].add_time) {
                        f1[last].push(f2[i]);
                    }
                    else {
                        let tmp = [];
                        tmp.push(f2[i])
                        f1.push(tmp);
                    }
                }
                that.setData({
                    total: count,
                    allFootprintList: that.data.allFootprintList.concat(res.data.data),
                    page: res.data.currentPage,
                    footprintList: f1,
                });
                if (count == 0) {
                    that.setData({
                        hasPrint: 0,
                        showNoMore: 1
                    });
                }
            }
            // wx.hideLoading();
        });
    },
    //查看浏览历史，即足迹
    getBrowserHistory() {
        let that = this;
        util.request(api.BrowserHistory, {
                customer:{id:wx.getStorageSync('openId')},
                page:that.data.page, //当前页面
                rowsCount:that.data.size,   //每页显示的条数
            }).then(function (res) {
            if (res.data.length > 0) {
                // let count = res.data.length;
                that.setData({
                    total:res.total,//总记录数
                    showNoMore: 1,  //1为下一页还有数据了
                    footprintList: that.data.footprintList.concat(res.data),//查询出来的数据
                    // size:count
                });
                if (res.total == 0) {
                    that.setData({
                        hasPrint: 0,
                        showNoMore: 0
                    });
                }
            }
        });
    },
    onLoad: function (options) {
        this.getBrowserHistory();//页面加载时，查询浏览历史
    },
    //删除浏览记录
    deletetBrowserHistory: function (e) {
        let that = this;
        let id = e.currentTarget.dataset.val;
        util.request(api.deletetBrowserHistory, { id: id }).then(function (res) {
            console.log
            if (res > 0) {
                wx.showToast({
                    title: '删除成功',
                    icon: 'success',
                    mask: true
                });
                that.setData({
                    footprintList: [],
                    allFootprintList: [],
                    page: 1,
                    total: 0,
                    size: 8
                });
                that.getBrowserHistory();//重新加载我的足迹
            }
        });
    },
    toIndexPage: function (e) {
        wx.switchTab({
            url: '/pages/index/index'
        });
    },
    onReachBottom: function () {
        let that = this;
        if (that.data.total / that.data.size < that.data.page) {
            that.setData({
                showNoMore: 0
            });
            return false;
        }
        that.setData({
            page: that.data.page + 1
        });
        that.getBrowserHistory();
    }
})