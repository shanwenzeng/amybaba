const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const user = require('../../services/user.js');
//获取应用实例
const app = getApp()

Page({
    data: {
        floorGoods: [],
        openAttr: false,
        showChannel: 0,
        showBanner: 0,
        showBannerImg: 0,
        goodsCount: 0,
        recommendShops:[],
        banner: [],
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
    },
    onHide:function(){
        this.setData({
            autoplay:false
        })
    },
    goSearch: function () {
        wx.navigateTo({
            url: '/pages/search/search',
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
            title: '艾米巴巴',
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
        util.request(api.IndexUrl).then(function (res) {
            if (res.errno === 0) {
                that.setData({
                    // floorGoods: res.data.categoryList,
                    // banner: res.data.banner,
                    //channel: res.data.channel,
                    // notice: res.data.notice,
                    loading: 1,
                });
            }
        });
        //商品轮播
        util.request(api.GoodsCarouselUrl,{},'POST').then(function (res) {
            if (res.data.length> 0) {
               that.setData({
                   banner: res.data,
                   loading: 1
               });
           }
       });
        //广告或通知
        util.request(api.Advert,{},'POST').then(function (res) {
            if (res.data.length> 0) {
                that.setData({
                    notice: res.data,
                    show_notice:1,
                    loading: 1
                });
            }
        });
       //推荐好物
       util.request(api.recommendGoods,{},'POST').then(function (res) {
            if (res.data.length> 0) {
                that.setData({
                    channel: res.data,
                    show_channel:1,
                    loading: 1
                });
            } 
        });  
        //推荐商家        
        util.request(api.RecommendShops,{isRecommend:'是',star:'5'}).then(function (res) {
            if (res.data.length> 0) {
                //向数组中添加距离
                 for (let i = 0; i < res.data.length; i++) {
                    util.findXy(res.data[i].latitude,res.data[i].longitude,function(dis){
                        res.data[i].distance=dis;
                        if((i+1)==res.data.length){//最后一次循环，进行冒泡排序
                            //冒泡排序法，按距离从近到远排序
                            for(let index = res.data.length-1;index>0;index--){
                                for(let j=0;j<index;j++){
                                    if(parseFloat(res.data[j].distance)>parseFloat(res.data[j+1].distance)){
                                        var temp = res.data[j];
                                        res.data.splice(j,1,res.data[j+1]);
                                        res.data.splice(j+1,1,temp);
                                    }
                                }
                            }
                            that.setData({recommendShops: res.data,loading:0});//所有的距离计算完毕后，进行赋值
                        }
                    });
                }
            }
        });
       
    },
    onLoad: function (options) {
        let systemInfo = wx.getStorageSync('systemInfo');
        var scene = decodeURIComponent(options.scene);
    },
    onShow: function () {        
        this.getIndexData();//获得首页数据
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

})