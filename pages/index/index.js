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
        isChooseLocation:'否',//是否选择了位置，默认为否
    },
    onHide:function(){
        this.setData({
            autoplay:false
        })
        // wx.offLocationChange((result) => {
        //     util.showErrorToast(result)
        // })
        //停止位置更新
        // wx.stopLocationUpdate({
        //   success: (res) => {
        //       console.log(res)
        //   },
        // })
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
    //查询商家
    findShop:function(){
        let that=this;
        this.getLocation(function(res){
            let district=res.result.ad_info.district;//当前位置的区县
            wx.setStorageSync('district', district);//将区县保存在缓存中，方便根据位置查询商家
            if(district!=undefined && district.length>0){
                that.findRecommendShop(district);//查询当前区县所在的商家
            }            
        })
    },
    onLoad: function (options) {
        let that=this;
        let systemInfo = wx.getStorageSync('systemInfo');
        var scene = decodeURIComponent(options.scene);
        this.getIndexData();//获得首页数据
        // this.findShop();//查询商家
    },
    onShow: function () {    
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
        if(this.data.isChooseLocation=='否'){
            this.findShop();
        }else{
            this.setData({
                isChooseLocation: '否',
            });
        }
        //60秒后获取位置
        // setTimeout(() => {
        //     //    this.getLocation(function(res){});
        //     this.findShop();
        // }, 3000);
        //开启小程序进入前后台时均接收位置消息
        // wx.startLocationUpdateBackground({
        //     success(res) {                
        //         wx.startLocationUpdate({
        //           success: (res) => {console.log(res)},
        //         })
        //         //位置变化时，改变首页最上面的当前位置
        //         wx.onLocationChange(function(res) {
        //             util.getPosition(res.latitude,res.longitude,function(res){
        //             console.log(res)
        //                 that.setData({
        //                     currentLocation:res.result.address
        //                 });
        //                 util.showErrorToast(res.result.address)
        //             })
        //         })
        //     },
        //     fail(res) {
        //       console.log('开启后台定位失败', res)
        //     }
        // })
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
             district:district,
             status:'正常'
            }).then(function (res) {
            if (res.data.length> 0) {
               //将数组按距离由近到远排序好返回
               util.computeDistance(res.data,function(res){
                   that.setData({recommendShops: res,loading:1});
               });
            }else{
                util.showErrorToast("您的位置没有商家信息")
                that.setData({recommendShops: []});
            }
        });

    },
    //获取位置
    getLocation:function(callback){
        let that=this;
        util.getLocation(function(res){
            if(res.result.address!=null && res.result.address.length>16){
                res.result.address=res.result.address.substr(0,16)+"...";
            }
            that.setData({
                currentLocation:res.result.address
            });
            callback(res);//回调函数
        });        
    },
    //选择位置
    chooseLocation:function () {
        let that=this;
        wx.chooseLocation({
            latitude: wx.getStorageSync('latitude'),//默认打开的位置
            longitude: wx.getStorageSync('longitude'),
            success: (result) => {
                if(result.address!=null && result.address.length>16){
                    result.address=result.address.substr(0,16)+"...";
                }
                that.setData({
                    currentLocation:result.address,
                    isChooseLocation:'是'
                });
                wx.setStorageSync("latitude",result.latitude);//保存玮度到缓存中
                wx.setStorageSync("longitude",result.longitude);//保存经度到缓存中
                //根据经纬度查询该地址所在区县
                util.getPosition(result.latitude,result.longitude,function(res){
                    wx.setStorageSync("district",res.result.ad_info.district);//将区县保存到缓存中
                    that.findRecommendShop(res.result.ad_info.district)//根据区县查询商家
                })
            },
        })        
    },
    //打开位置
    openLocation:function(e){
        let latitude=parseFloat(e.currentTarget.dataset.latitude);
        let longitude=parseFloat(e.currentTarget.dataset.longitude);
        wx.openLocation({
            latitude,
            longitude,
            scale: 15//缩放比例
          })
    }
})