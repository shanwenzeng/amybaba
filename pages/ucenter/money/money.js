var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
const pay = require('../../../services/pay.js');
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
    //调用微信充值功能
    let that=this;
    let orderId="wx_orderId_"+util.formatTimeNum(new Date(),'YMDhms');
    let openId = wx.getStorageSync('openId');  //获取用户的id
    //调用支付功能，需要传递三个参数，分别为：订单id，用户openId，充值金额
    pay.payOrder(orderId,openId,this.data.choose).then(res => {
      //调用后台充值功能，向recharge表中添加数据,同时修改customer表中的money字段
      util.request(api.investMoney, {
        id:openId,
        money: that.data.choose,
        customer:{id:openId},
        type:"余额充值"
      }).then(function(res) {
        if(res.code>0){
          util.showSuccessToast('充值成功');
          that.setData({
            money:parseFloat(money)+parseFloat(that.data.choose)//页面显示时，设置余额
          });
          let money=wx.getStorageSync('money');
          if(money==undefined || money==null || money.length==0){
            money=0;
          }   
        }
      });   
    //设置3秒后返回上一页
      setTimeout(function(){
            wx.navigateBack();
      },3000);
    }).catch(res => {
        util.showErrorToast('充值失败，请联系客服');
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