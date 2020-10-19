var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    money:'',//余额
    choose:''//选择的充值金额
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
5
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      money:wx.getStorageSync('money')//页面显示时，设置余额
    });
  },
  //选择充值的金额
  chooseMoney:function(e){
    let choose = e.currentTarget.dataset.index;
    this.setData({choose:choose});
  },
  //在文本框中输入金额
  inputMoney(event) {
    let choose = event.detail.value;
    this.setData({choose:choose});
},
  //进行充值
  rechangeMoney:function(){
    if(this.data.choose==null || this.data.choose==undefined || this.data.choose==''){
      util.showErrorToast("请选择或输入充值金额");
      return false;
    }
    
    if(this.data.choose<=0){
      util.showErrorToast("请输入正确的充值金额");
      return false;
    }
    let that=this;
      util.request(api.editSettings, {
        id:wx.getStorageSync('openId'),
        money: that.data.choose,
      }).then(function(res) {
        if(res.code>0){
            util.showSuccessToast('充值成功');
            setTimeout(function(){
                  wx.navigateBack();
            },1000);
            that.setData({
              money:parseFloat(wx.getStorageSync('money'))+parseFloat(that.data.choose)//页面显示时，设置余额
            });
        }else{
            util.showErrorToast('充值失败，请联系客服');
        }
    });
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})