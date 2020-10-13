const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const user = require('../../services/user.js');
//获取应用实例
const app = getApp()

Page({
    data: {
        
    },
    onLoad: function (options) {
        
    },
    onShow: function () {
        let userInfo = wx.getStorageSync('userInfo');
        if (userInfo != '') {
            wx.navigateBack();
        };
    },
    getUserInfo: function (e) {
        app.globalData.userInfo = e.detail.userInfo
        user.loginByWeixin().then(res => {
            //授权成功，返回前一个页面
            wx.navigateBack();
        }).catch((err) => {});
    },
    goBack:function(){
        wx.navigateBack();
    }
})