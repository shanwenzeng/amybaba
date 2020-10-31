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
        // list: [],
        shops:[], //商家
        good: [], 
        page: 1, //分页的当前页码，默认为1
        total: 0,//数据库中的总商家数
        size: 8, //每页显示的商家数
        hasInfo: 0,
        showNoMore: 0, //状态，0为下一页没有记录，1为下一页还有记录
        loading:0, //0为
        index_banner_img:0,
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
    },
    onLoad: function () {
        this.getCatalog();//获取分类（全部、好评、距离、销量等）
    },
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
        let obj={rowsCount: that.data.size,page: that.data.page,district:wx.getStorageSync("district")};//传递给后台的参数
        let url=api.RecommendShops;//请求地址
        if(condition=="距离"){
            util.request(api.RecommendShops,obj).then(function (res) {
                if (res.data.length> 0) {
                     //将数组按距离由近到远排序好返回
                    util.computeDistance(res.data,function(res){
                        that.setData({shops: res,loading:0});
                    });
                }else{
                    that.setData({loading:0});
                }
            });
        }else{
            if(condition=="销量"){
                url=api.findShopBySale;
            }else if(condition=="好评"){
                obj={star:'5',district:wx.getStorageSync("district")};
            }
            util.request(url,obj).then(function (res) {
                if (res.data.length> 0) {
                      //将数组按距离由近到远排序好返回
                      util.computeDistance(res.data,function(res){
                        that.setData({shops: res,loading:0});
                    });
                }else{
                    that.setData({loading:0});
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
    //查找商家，并进行分页
    findShop: function() {
        this.setData({nowId:0});//页面显示时，设置全部选项卡被选中
        let that = this;
        util.request(api.findShop, {
            district:wx.getStorageSync('district')
        }).then(function(res) {
            if (res.data.length >0) {
                let total=res.total;//总记录数
                 //将数组按距离由近到远排序好返回
               util.computeDistance(res.data,function(res){
                    that.setData({
                        shops: res,
                        loading: 0,
                    });
                });
            }else{
                that.setData({
                    shops: [],
                    loading: 0,
                });
            }
        });
    },
    onShow: function(){
        this.findShop();//查找商家，并进行分页
    },
    switchCate: function(e) {
      let id = e.currentTarget.dataset.id;
      let value = e.currentTarget.dataset.value;
      let nowId = this.data.nowId;
        if (id == nowId) {
            return false;
        } else {
            this.setData({
                shops: [],
                page: 1,
                total: 0,
                size: 8,
                loading: 1
            })
            if (id == 0) {
              this.findShop(0);//商家的分页
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