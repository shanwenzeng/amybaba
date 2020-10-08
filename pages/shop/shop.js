var util = require('../../utils/util.js');
var api = require('../../config/api.js');

Page({
    data: {
        navList: [],
        categoryList: [],
        currentCategory: {},
        goodsCount: 0,
        nowIndex: 0,
        nowId: 0,
        list: [],
        shops:[],
        good: [],
        allPage: 1,
        allCount: 0,
        size: 8,
        hasInfo: 0,
        showNoMore: 0,
        loading:0,
        index_banner_img:0,
    },
    onLoad: function () {
    },
    // onLoad: function(options) {
        
    // },
    onPullDownRefresh: function() {
        wx.showNavigationBarLoading()
        this.getCatalog();
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
    },
    //获取分类（全部、好评、距离、销量等）
    getCatalog: function() {
        let that = this;
        util.request(api.CatalogList,{type:'商家分类'}).then(function(res) {
            that.setData({
                navList: res
            });
        });
    },
    //获取商家
    getShop:function(condition){
        let that=this;
        let obj={};//传递给后台的参数
        if(condition=="销量")
        {
            util.request(api.findShopBySale,obj).then(function (res) {
                if (res.data.length> 0) {
                    that.setData({shops: res.data,loading:0});
                }
            });
        }
        else{
            if(condition!=undefined && condition=="好评"){
                obj={star:'5'};
            }
            util.request(api.RecommendShops,obj).then(function (res) {
                if (res.data.length> 0) {
                    that.setData({shops: res.data,loading:0});
                }
            });
        }
    },
    getCurrentCategory: function(id) {
        let that = this;
        util.request(api.CatalogCurrent, {
            id: id
        }).then(function(res) {
            that.setData({
                currentCategory: res.data
            });
        });
    },
    getCurrentList: function(id) {
        let that = this;
        util.request(api.GetCurrentList, {
            size: that.data.size,
            page: that.data.allPage,
            id: id
        }, 'POST').then(function(res) {
            if (res.errno === 0) {
                let count = res.data.count;
                that.setData({
                    allCount: count,
                    allPage: res.data.currentPage,
                    // list: that.data.list.concat(res.data.data),
                    showNoMore: 1,
                    loading: 0,
                });
                if (count == 0) {
                    that.setData({
                        hasInfo: 0,
                        showNoMore: 0
                    });
                }
            }
        });
    },
    onShow: function() {
        let id = this.data.nowId;
        let nowId = wx.getStorageSync('categoryId');
        if(id == 0 && nowId === 0){
            return false
        }
        else if (nowId == 0 && nowId === '') {
            this.setData({
                list: [],
                allPage: 1,
                allCount: 0,
                size: 8,
                loading: 1
            })
            this.getCurrentList(0);
            this.setData({
                nowId: 0,
                currentCategory: {}
            })
            wx.setStorageSync('categoryId', 0)
        } else if(id != nowId) {
            this.setData({
                list: [],
                allPage: 1,
                allCount: 0,
                size: 8,
                loading: 1
            })
            this.getCurrentList(nowId);
            this.getCurrentCategory(nowId);
            this.setData({
                nowId: nowId
            })
            wx.setStorageSync('categoryId', nowId)
        }
        
        this.getCatalog();//获取分类（全部、好评、距离、销量等）
        this.getShop();//获取商家
    },
    switchCate: function(e) {
      let id = e.currentTarget.dataset.id;
      let value = e.currentTarget.dataset.value;
      let nowId = this.data.nowId;
        if (id == nowId) {
            return false;
        } else {
            this.setData({
                list: [],
                allPage: 1,
                allCount: 0,
                size: 8,
                loading: 1
            })
            if (id == 0) {
              this.getShop();//根据类型查询商家
            } else {
                wx.setStorageSync('categoryId', id)
                this.getShop(value);//根据类型查询商家
            }
            wx.setStorageSync('categoryId', id)
            this.setData({
                nowId: id
            })
        }
    },
    onBottom: function() {
        let that = this;
        if (that.data.allCount / that.data.size < that.data.allPage) {
            that.setData({
                showNoMore: 0
            });
            return false;
        }
        that.setData({
            allPage: that.data.allPage + 1
        });
        let nowId = that.data.nowId;
        if (nowId == 0 || nowId == undefined) {
            that.getCurrentList(0);
        } else {
            that.getCurrentList(nowId);
        }
    }
})