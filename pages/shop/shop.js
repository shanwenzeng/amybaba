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
        this.findShop();//查找商家，并进行分页
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
        let obj={rowsCount: that.data.size,page: that.data.page};//传递给后台的参数
        let url=api.RecommendShops;//请求地址
        if(condition=="距离"){
            util.request(api.RecommendShops,obj).then(function (res) {
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
                                that.setData({shops: res.data,loading:0});
                            }
                       });
                    }
                }
            });
        }else{
            if(condition=="销量"){
                url=api.findShopBySale;
            }else if(condition=="好评"){
                obj={star:'5'};
            }
            util.request(url,obj).then(function (res) {
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
    //查找商家，并进行分页
    findShop: function() {
        let that = this;
        util.request(api.shopPage, {
            rowsCount: that.data.size, //每页的数量
            page: that.data.page,    //当前页码
            // id: id
        }, 'POST').then(function(res) {
            if (res.code >= 0) {
                that.setData({
                    total: res.total,//总数
                    shops: that.data.shops.concat(res.data),
                    showNoMore: 1, //1为下一页还有记录
                    loading: 0,
                });
                if (res.total == 0) {
                    that.setData({
                        hasInfo: 0,
                        showNoMore: 0
                    });
                }
            }
        });
    },
    onShow: function(){
        this.getCatalog();//获取分类（全部、好评、距离、销量等）
    },
    // onShow: function() {
        // let id = this.data.nowId;
        // let nowId = wx.getStorageSync('categoryId');
        // if(id == 0 && nowId === 0){
        //     return false
        // }
        // else if (nowId == 0 && nowId === '') {
        //     this.setData({
        //         shops: [],
        //         page: 1,
        //         total: 0,
        //         size: 8,
        //         loading: 1
        //     })
        //     this.shopPage(0);
        //     this.setData({
        //         nowId: 0,
        //         currentCategory: {}
        //     })
        //     wx.setStorageSync('categoryId', 0)
        // } else if(id != nowId) {
        //     this.setData({
        //         shops: [],
        //         page: 1,
        //         total: 0,
        //         size: 8,
        //         loading: 1
        //     })
        //     this.shopPage(nowId);
        //     this.getCurrentCategory(nowId);
        //     this.setData({
        //         nowId: nowId
        //     })
        //     wx.setStorageSync('categoryId', nowId)
        // }
        // this.getCatalog();//获取分类（全部、好评、距离、销量等）
        // // this.getShop();//获取商家
    // },
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
              this.shopPage(0);//商家的分页
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
        if (this.data.total / this.data.size < this.data.page) {
            that.setData({
                showNoMore: 0
            });
            return false;
        }
        this.setData({
            page: that.data.page + 1
        });
        this.findShop();//查找商家，并进行分页
    }
})