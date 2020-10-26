var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');

const app = getApp()

Page({
    data: {
        goodsList: [],
    },
    onLoad: function(options) {
        console.log(options.id)
        this.getGoodsList(options.id);
    },
    getGoodsList: function(id) {
        let that = this;
        util.request(api.findGoods, {
            id: id
        }).then(function(res) {
            if (res.code > 0) {
                that.setData({
                    goodsList: res.data
                });
            }
        });
    }
})