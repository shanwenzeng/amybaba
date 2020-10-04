var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
var app = getApp();
Page({
    data: {
        list: []
    },
    onLoad: function () {
        let that = this;
        util.request(api.RecommendShop, {}, 'POST').then(function(res) {
            console.log(res)
            that.setData({
                list: res
            });
        });
    },
})
