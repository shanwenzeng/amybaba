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
        this.getGoodsList(options.id,options.status);
    },
    getGoodsList: function(productId,status) {
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
    }
})