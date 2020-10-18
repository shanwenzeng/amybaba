var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
var app = getApp();
Page({
    data: {
        name: '',
        phone: '',
        openId:'',
        status: 0,
        photo:'/images/icon/add.png'
    },
    phoneChange(e) {
        let phone = e.detail.value;
        if (util.testPhone(phone)) {
            this.setData({
                phone: phone,
                status: 1
            });
        }
    },
    bindinputName(event) {
        let name = event.detail.value;
        this.setData({
            name: name,
        });
    },
    //选择图片
    chooseImages:function(){
        let that =this;
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success (res) {
              // tempFilePath可以作为img标签的src属性显示图片
              const tempFilePaths = res.tempFilePaths
              that.setData({photo:tempFilePaths});
            }
          })
    },
     /**
   * 上传照片
   */
  uploadImg: function() {
    var that = this
    wx.uploadFile({
        url: api.uploadImage, //上传图片请求地址
        filePath: that.data.photo[0],
        name: 'file',
        formData: {
          'user': '黑柴哥'
        },
        success: function (res) {
          var data = res.data
          console.log(res)
          if(res.data!="error"){
              //成功，保存路径到数据库，res.data为返回的路径
              util.showSuccessToast("图片上传成功！")
          }else{
              util.showErrorToast("图片上传失败！，请联系客服")
          }
        }
      })
},

    //查找消费者消息，赋值给文本框
    FindCustomer(){
        let that = this;
        util.request(api.FindCustomer,{id:wx.getStorageSync('openId')}).then(function(res) {
            if (res!='') {
                that.setData({
                    name: res.name,
                    phone: res.phone,
                });
                if (res.name == '' || res.phone == ''){
                    util.showErrorToast('请填写姓名和手机');
                }
            }
        });
    },
    onLoad: function(options) {
        this.FindCustomer();//查找消费者消息，赋值给文本框
    },
    saveInfo() {
        let name = this.data.name;
        let phone = this.data.phone;
        let openId = wx.getStorageSync('openId');
        let status = this.data.status;
        let isExists=false;//是否存在
        let that = this;
        if (name == '') {
            util.showErrorToast('请输入姓名');
            return false;
        }
        if (phone == '') {
            util.showErrorToast('请输入手机号码');
            return false;
        }
        //判断是否存在
        util.request(api.isExist,{id:openId}).then(function(res){
            var url=api.addSettings;//默认为新增
            if(res.code>0){//已存在，执行修改
                url=api.editSettings
            }
            util.request(url, {
                    id:openId,
                    name: name,
                    phone: phone,
                }).then(function(res) {
                    if(res.code>0){
                        util.showSuccessToast('保存成功');
                       setTimeout(function(){
                            wx.navigateBack();
                       },2000);
                    }else{
                        util.showErrorToast('保存失败，请联系客服');
                    }
                });
        });
    },
})