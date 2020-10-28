var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');

const app = getApp()

Page({
    data: {
        goodsList: [],
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
    },
    onLoad: function(options) {
        console.log(options)
        if(options.order!=undefined && options.order!=''){
            this.findGoodsFromOrderDetail(options.order); //订单号不为空，则查询orderDetail（订单详情表）中的商品数据
        }else{
            this.findGoodsFromShoppingcart(options.id,options.status);//从购物车中查询商品信息
        }
    },
    //从购物车中查询商品信息
    findGoodsFromShoppingcart: function(productId,status) {
        let that = this;
        util.request(api.GetCartList, {
            customer:{id:wx.getStorageSync("openId")},
            productId: productId,
            status:status
        }).then(function(res) {
            if (res.data!=null && res.data.length > 0) {
                that.setData({
                    goodsList: res.data
                });
            }
        });
    },
    //从订单详情表中查询商品信息
    findGoodsFromOrderDetail: function(order) {
        let that = this;
        util.request(api.findOrderDetail, {
            order:order
        }).then(function(res) {
            if (res.data!=null && res.data.length > 0) {
                that.setData({
                    goodsList: res.data
                });
            }
        });
    }
})