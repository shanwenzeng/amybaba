var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
var model = require('../../../utils/model/model.js')
var app = getApp();
var show = false;
var item = {};
Page({
    data: {
        item: {
            show: show
          },
        addressId: 0,
        shop:{
            id:0,
            name:'',
            boss:'',
            phone:'',
            province:'',
            city:'',
            district:'',
            address:'',
        }
    },
    phoneChange(e) {
        let phone = e.detail.value;
        let shop = this.data.shop;
        if (util.testPhone(phone)) {
            shop.phone = phone;
            this.setData({
                shop: shop
            });
        }
    },
    bindinputName(event) {
        let shop = this.data.shop;
        shop.name = event.detail.value;
        this.setData({
            shop: shop
        });
    },
    bindinputBoss(event) {
        let shop = this.data.shop;
        shop.boss = event.detail.value;
        this.setData({
            shop: shop
        });
    },
    bindinputAddress(event) {
        let shop = this.data.shop;
        shop.address = event.detail.value;
        this.setData({
            shop: shop
        });
    },
    //获取地址，赋值给文本框
    getAddressDetail() {
        let that = this;
        util.request(api.AddressDetail, {
            id: that.data.addressId
        }).then(function(res) {
            if (res!='') {
                that.setData({
                    address: res
                });
            }
        });
    },
    deleteAddress: function() {
        let id = this.data.addressId;
        wx.showModal({
            title: '提示',
            content: '您确定要删除么？',
            success: function(res) {
                if (res.confirm) {
                    util.request(api.DeleteAddress, {
                        id: id
                    }).then(function(res) {
                        if (res > 0) {
                            wx.removeStorageSync('addressId');
                            util.showSuccessToast('删除成功');
                            setTimeout(function(){
                                wx.navigateBack();
                            },2000)
                        } else {
                            util.showErrorToast(res.errmsg);
                        }
                    });
                }
            }
        })
    },
    setRegionDoneStatus() {
        let that = this;
        let doneStatus = that.data.selectRegionList.every(item => {
            return item.id != 0;
        });

        that.setData({
            selectRegionDone: doneStatus
        })

    },
    chooseRegion() {
        let that = this;
        this.setData({
            openSelectRegion: !this.data.openSelectRegion
        });

        //设置区域选择数据
        let address = this.data.address;
        if (address.province_id > 0 && address.city_id > 0 && address.district_id > 0) {
            let selectRegionList = this.data.selectRegionList;
            selectRegionList[0].id = address.province_id;
            selectRegionList[0].name = address.province_name;
            selectRegionList[0].parent_id = 1;

            selectRegionList[1].id = address.city_id;
            selectRegionList[1].name = address.city_name;
            selectRegionList[1].parent_id = address.province_id;

            selectRegionList[2].id = address.district_id;
            selectRegionList[2].name = address.district_name;
            selectRegionList[2].parent_id = address.city_id;

            this.setData({
                selectRegionList: selectRegionList,
                regionType: 3
            });

            this.getRegionList(address.city_id);
        } else {
            this.setData({
                selectRegionList: [{
                        id: 0,
                        name: '省份',
                        parent_id: 1,
                        type: 1
                    },
                    {
                        id: 0,
                        name: '城市',
                        parent_id: 1,
                        type: 2
                    },
                    {
                        id: 0,
                        name: '区县',
                        parent_id: 1,
                        type: 3
                    }
                ],
                regionType: 1
            })
            this.getRegionList(1);
        }

        this.setRegionDoneStatus();

    },
    onLoad: function(options) {
        // 页面初始化 options为页面跳转所带来的参数
        if (options.id) {
            this.setData({
                addressId: options.id
            });
            this.getAddressDetail();
        }
        // this.getRegionList(1);
    },
    onReady: function(e) {
        var that = this;
        //请求数据
        model.updateAreaData(that, 0, e);
    },
      //点击选择城市按钮显示picker-view
  translate: function (e) {
    model.animationEvents(this, 0, true,400);  
  },
  //隐藏picker-view
  hiddenFloatView: function (e) {
    model.animationEvents(this, 200, false,400);
  },
  //滑动事件(即选择省市区)
  bindChange: function (e) {
    model.updateAreaData(this, 1, e);
    item = this.data.item;
    let shop = this.data.shop;
    shop.province = item.provinces[item.value[0]].name;
    shop.city= item.citys[item.value[1]].name;
    shop.district= item.countys[item.value[2]].name;
    this.setData({
        shop:shop
    });
  },
    //保存商家（即商家入驻）
    saveShop() {
        let shop = this.data.shop;
        if (shop.name == '' || shop.name == undefined) {
            util.showErrorToast('请输入商家名称');
            return false;
        }
        if (shop.boss == '' || shop.boss == undefined) {
            util.showErrorToast('请输入姓名');
            return false;
        }
        if (shop.phone == '' || shop.phone == undefined) {
            util.showErrorToast('请输入手机号码');
            return false;
        }
        if (shop.district== '') {
            util.showErrorToast('请输入省市区');
            return false;
        }
        if (shop.address == '' || shop.address == undefined) {
            util.showErrorToast('请输入详细地址');
            return false;
        }
        let that = this;
        let url=api.addShop;//新增商家（即商家入驻）
        if(this.data.shop.id!=0){
            url=api.editShop;//修改商家信息
        }
        util.request(url, {
            id:shop.id,
            name: shop.name,
            boss: shop.boss,
            phone: shop.phone,
            province: shop.province,
            city: shop.city,
            district: shop.district,
            address: shop.address,
            status:'禁用'
        }).then(function(res) {
            if (res.code > 0) {
                util.showSuccessToast('保存成功');
               setTimeout(function(){
                    wx.navigateBack();
               },1000);
            }
        });
    },
    onShow: function() {
        let id = this.data.addressId;
        if (id > 0) {
            wx.setNavigationBarTitle({
                title: '编辑商家',
            })
        } else {
            wx.setNavigationBarTitle({
                title: '商家入驻',
            })
        }
    },
    onHide: function() {
        // 页面隐藏

    },
    onUnload: function() {
        // 页面关闭

    }
})