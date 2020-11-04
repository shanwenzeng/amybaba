var util = require('../../utils/util.js');
var api = require('../../config/api.js');
//获取应用实例
const app = getApp()
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
        page: 1,
        total: 0,
        size: 8,
        hasInfo: 0,
        showNoMore: 0,
        loading:0,
        index_banner_img:0,
        shopId:0,
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
    },
    onLoad: function(options) {
        this.data.shopId=options.id;//保存商家id
        this.findGoods();//查询商品类别
        this.findProduct(options.id);//根据商家id和分类进行商品查询
    },
    // onLoad: function(options) {
        
    // },
    getChannelShowInfo: function (e) {
        let that = this;
        util.request(api.ShowSettings).then(function (res) {
            if (res.errno === 0) {
                let index_banner_img = res.data.index_banner_img;
                that.setData({
                    index_banner_img: index_banner_img
                });
            }
        });
    },
    onPullDownRefresh: function() {
        wx.showNavigationBarLoading()
        this.getCatalog();
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
    },
    //查询商品类别
    findGoods: function() {
        let that = this;
        util.request(api.findGoods,{shop:{id:this.data.shopId.toString()}}).then(function(res) {
            that.setData({
                navList: res.data
            });
        });
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
        util.request(api.GetProduct,{
            rowsCount: that.data.size,//每次显示的数量
            page: that.data.page,//页码
        }).then(function(res) {
            if (res.data.length > 0) {
                let count = res.total;//总记录数
                that.setData({
                    total: count,
                    page: 1,
                    list: that.data.list.concat(res.data),
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
    //根据商家id和分类进行商品查询
    findProduct: function(shopId,categoryId) {
        let that = this;
        let obj={id:shopId};
        if(categoryId!=undefined && categoryId!=0){//categoryId不等于0，代表按分类进行查询
            //传递商家的id，分类id
            obj={id:shopId,categoryId:categoryId};
        }else if(categoryId==0){//点击全部
            //传递商家的id
            obj={id:shopId};
        }
        util.request(api.FindProduct,obj).then(function(res) {
            if (res.data.length > 0) {//查询到产品
                that.setData({
                    list:res.data,
                    loading: 0, 
                });
            }else{//没有查询到商品
                that.setData({
                        hasInfo: 0,
                        showNoMore: 0,
                        list:[], 
                    });
            }
        });
    },
    onShow: function() {
        // this.getChannelShowInfo();
        // this.getCurrentList(0);
        let id = this.data.nowId;
        let nowId = wx.getStorageSync('categoryId');
        if(id == 0 && nowId === 0){
            return false
        }
        wx.setStorageSync('categoryId', nowId)
    },
    //按分类查询产品
    switchCate: function(e) {
        let shopId = this.data.shopId;//商家id
        let categoryId = e.currentTarget.dataset.id;//分类id
        wx.setStorageSync('categoryId', categoryId);//将分类id存储在缓存中
        let nowId = this.data.nowId;//当前选中的分类id
        if (categoryId == nowId) {//当前选中的分类id与你单击的分类id相同，则不再进行查询
            return false;
        } else{
            this.setData({
                list:[],  //清空集合里的数据
                nowId: categoryId,
            })
            this.findProduct(shopId,categoryId);
            // this.setData({
            //     nowId: categoryId
            // })
        }
    },
    switchCate2: function(e) {
        let id = e.currentTarget.dataset.id;
        let nowId = this.data.nowId;
        if (id == nowId) {
            return false;
        } else {
            this.setData({
                list: [],
                page: 1,
                total: 0,
                size: 8,
                loading: 1
            })
            if (id == 0) {
                this.getCurrentList(0);
                this.setData({
                    currentCategory: {}
                })
            } else {
                wx.setStorageSync('categoryId', id)
                this.getCurrentList(id);
                this.getCurrentCategory(id);
            }
            wx.setStorageSync('categoryId', id)
            this.setData({
                nowId: id
            })
        }
    },
    //点击搜索商品，将该商家的id传递给search页面
    setShopId: function(){
        wx.setStorageSync('shopId', this.data.shopId);
        console.log(this.data.shopId)
    }
})