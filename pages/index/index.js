const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const user = require('../../services/user.js');
//获取应用实例
const app = getApp()

Page({
    data: {
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
        floorGoods: [],
        openAttr: false,
        showChannel: 0,
        showBanner: 0,
        showBannerImg: 0,
        goodsCount: 0,
        recommendShops:[],
        banner: ['upload/image/certificate1.png','upload/image/certificate2.png'],
        channel: [],
        index_banner_img: 0,
        userInfo: {},
        imgurl: '',
        sysHeight: 0,
        loading: 0,
        autoplay:true,
        longitude:'',
        latitude:'',
        distance:'',
        currentLocation:'地址获取中......',//当前位置
    },
    onHide:function(){
        this.setData({
            autoplay:false
        })
    },
    goSearch: function () {
        //搜索商家
        wx.navigateTo({
            url: '/pages/searchShop/searchShop',
        })
    },
    goCategory: function (e) {
        let id = e.currentTarget.dataset.cateid;
        wx.setStorageSync('categoryId', id);
        wx.switchTab({
            url: '/pages/category/index',
        })
    },
    getCatalog: function () {
        let that = this;
        util.request(api.GoodsCount).then(function (res) {
            that.setData({
                goodsCount: res.data.goodsCount
            });
        });
    },
    handleTap: function (event) {
        //阻止冒泡 
    },
    onShareAppMessage: function () {
        let info = wx.getStorageSync('userInfo');
        return {
            title: '艾米巴',
            desc: '',
            path: '/pages/index/index?id=' + info.id
        }
    },
    toDetailsTap: function () {
        wx.navigateTo({
            url: '/pages/goods-details/index',
        });
    },
    getIndexData: function () {
        let that = this;
        //商品轮播
        util.request(api.GetProduct,{isCarousel:'是'}).then(function (res) {
            if (res.data.length> 0) {
               that.setData({
                   banner: res.data,
                   loading: 1
               });
           }
       });
        //广告或通知
        util.request(api.Advert).then(function (res) {
            if (res.data.length> 0) {
                that.setData({
                    notice:res.data,
                    show_notice:1,
                    loading: 1
                });
            }
        });
       //产品分类
       util.request(api.recommendGoods).then(function (res) {
            if (res.data.length> 0) {
                that.setData({
                    channel: res.data,
                    show_channel:1,
                    loading: 1
                });
            } 
        });  
       
    },
    //获取消费者当前位置
    getCurrentLocation:function(){
        let that=this;
        util.getLocation(function(res){
            that.setData({
                currentLocation:res.result.address
            });
            let district=res.result.ad_info.district;//当前位置的区县
            wx.setStorageSync('district', district);//将区县保存在缓存中，方便根据位置查询商家
            if(district!=undefined && district.length>0){
                that.findRecommendShop(district);//查询当前区县所在的商家
            }
        });
    },
    onLoad: function (options) {
        let systemInfo = wx.getStorageSync('systemInfo');
        var scene = decodeURIComponent(options.scene);
        this.getIndexData();//获得首页数据
    },
    onShow: function () {    
        this.getCurrentLocation();//获取消费者当前位置
        var that = this;
        let userInfo = wx.getStorageSync('userInfo');
        if (userInfo != '') {
            that.setData({
                userInfo: userInfo,
            });
        };
        let info = wx.getSystemInfoSync();
        let sysHeight = info.windowHeight - 100;
        this.setData({
            sysHeight: sysHeight,
            autoplay:true
        });
        wx.removeStorageSync('categoryId');
    },
    getCartNum: function () {
        util.request(api.CartGoodsCount).then(function (res) {
            if (res.errno === 0) {
                let cartGoodsCount = '';
                if (res.data.cartTotal.goodsCount == 0) {
                    wx.removeTabBarBadge({
                        index: 2,
                    })
                } else {
                    cartGoodsCount = res.data.cartTotal.goodsCount + '';
                    wx.setTabBarBadge({
                        index: 2,
                        text: cartGoodsCount
                    })
                }
            }
        });
    },
    getChannelShowInfo: function (e) {
        let that = this;
        util.request(api.ShowSettings).then(function (res) {
            if (res.errno === 0) {
                let show_channel = res.data.channel;
                let show_banner = res.data.banner;
                let show_notice = res.data.notice;
                let index_banner_img = res.data.index_banner_img;
                that.setData({
                    show_channel: show_channel,
                    show_banner: show_banner,
                    show_notice: show_notice,
                    index_banner_img: index_banner_img
                });
            }
        });
    },
    onPullDownRefresh: function () {
        wx.showNavigationBarLoading()
        this.getIndexData();
        this.getChannelShowInfo();
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
    },
    //查询本区、县推荐商家，并且为5星级    
    findRecommendShop:function(district){
        let that = this;
         util.request(api.RecommendShops,{
             isRecommend:'是',
             star:'5',
             district:district
            }).then(function (res) {
            if (res.data.length> 0) {
               //将数组按距离由近到远排序好返回
               util.computeDistance(res.data,function(res){
                   that.setData({recommendShops: res,loading:1});
               });
            }
        });

    }
})