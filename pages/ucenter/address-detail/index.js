var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
var app = getApp();
Page({
    data: {

        address: {
            id: 0,
            province_id: 0,
            city_id: 0,
            district_id: 0,
            detailAddress: '',
            full_region: '',
            name: '',
            phone: '',
            isDefault: 0
        },
        addressId: 0,
        openSelectRegion: false,
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
        regionType: 1,
        regionList: [],
        selectRegionDone: false
    },
    phoneChange(e) {
        let phone = e.detail.value;
        let address = this.data.address;
        if (util.testPhone(phone)) {
            address.phone = phone;
            this.setData({
                address: address
            });
        }
    },
    bindinputName(event) {
        let address = this.data.address;
        address.name = event.detail.value;
        this.setData({
            address: address
        });
    },
    bindinputAddress(event) {
        let address = this.data.address;
        address. detailAddress = event.detail.value;
        this.setData({
            address: address
        });
    },
    switchChange(e) {
        let status = e.detail.value;
        let isDefault = 0;
        if (status == true) {
            isDefault = 1;
        }
        let address = 'address.isDefault';
        this.setData({
            [address]: isDefault
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
        this.getRegionList(1);
    },
    onReady: function() {

    },
    selectRegionType(event) {
        let that = this;
        let regionTypeIndex = event.target.dataset.regionTypeIndex;
        let selectRegionList = that.data.selectRegionList;

        //判断是否可点击
        if (regionTypeIndex + 1 == this.data.regionType || (regionTypeIndex - 1 >= 0 && selectRegionList[regionTypeIndex - 1].id <= 0)) {
            return false;
        }

        this.setData({
            regionType: regionTypeIndex + 1
        })

        let selectRegionItem = selectRegionList[regionTypeIndex];

        this.getRegionList(selectRegionItem.parent_id);

        this.setRegionDoneStatus();

    },
    selectRegion(event) {
        let that = this;
        let regionIndex = event.target.dataset.regionIndex;
        let regionItem = this.data.regionList[regionIndex];
        let regionType = regionItem.type;
        let selectRegionList = this.data.selectRegionList;
        selectRegionList[regionType - 1] = regionItem;


        if (regionType != 3) {
            this.setData({
                selectRegionList: selectRegionList,
                regionType: regionType + 1
            })
            this.getRegionList(regionItem.id);
        } else {
            this.setData({
                selectRegionList: selectRegionList
            })
        }

        //重置下级区域为空
        selectRegionList.map((item, index) => {
            if (index > regionType - 1) {
                item.id = 0;
                item.name = index == 1 ? '城市' : '区县';
                item.parent_id = 0;
            }
            return item;
        });

        this.setData({
            selectRegionList: selectRegionList
        })


        that.setData({
            regionList: that.data.regionList.map(item => {

                //标记已选择的
                if (that.data.regionType == item.type && that.data.selectRegionList[that.data.regionType - 1].id == item.id) {
                    item.selected = true;
                } else {
                    item.selected = false;
                }

                return item;
            })
        });

        this.setRegionDoneStatus();

    },
    doneSelectRegion() {
        if (this.data.selectRegionDone === false) {
            return false;
        }

        let address = this.data.address;
        let selectRegionList = this.data.selectRegionList;
        address.province_id = selectRegionList[0].id;
        address.city_id = selectRegionList[1].id;
        address.district_id = selectRegionList[2].id;
        address.province_name = selectRegionList[0].name;
        address.city_name = selectRegionList[1].name;
        address.district_name = selectRegionList[2].name;
        address.full_region = selectRegionList.map(item => {
            return item.name;
        }).join('');

        this.setData({
            address: address,
            openSelectRegion: false
        });

    },
    cancelSelectRegion() {
        this.setData({
            openSelectRegion: false,
            regionType: this.data.regionDoneStatus ? 3 : 1
        });
    },
    getRegionList(regionId) {
        let that = this;
        let regionType = that.data.regionType;
        util.request(api.RegionList, {
            parentId: regionId
        },'GET').then(function(res) {
            if (res.errno === 0) {
                that.setData({
                    regionList: res.data.map(item => {

                        //标记已选择的
                        if (regionType == item.type && that.data.selectRegionList[regionType - 1].id == item.id) {
                            item.selected = true;
                        } else {
                            item.selected = false;
                        }

                        return item;
                    })
                });
            }
        });
    },
    //保存地址
    saveAddress() {
        let address = this.data.address;
        console.log(address)
        if (address.name == '' || address.name == undefined) {
            util.showErrorToast('请输入姓名');
            return false;
        }
        if (address.phone == '' || address.phone == undefined) {
            util.showErrorToast('请输入手机号码');
            return false;
        }
        if (address.district== '') {
            util.showErrorToast('请输入省市区');
            return false;
        }
        if (address. detailAddress == '' || address. detailAddress == undefined) {
            util.showErrorToast('请输入详细地址');
            return false;
        }
        let that = this;
        util.request(api.SaveAddress, {
            name: address.name,
            phone: address.phone,
            province: address.province_name==''?address.province:address.province_name,
            city: address.city_name==''?address.city:address.city_name,
            district: address.district_name==''?address.district:address.district_name,
            detailAddress: address. detailAddress,
            isDefault: address.isDefault==0?'否':'是',
            customer:{id:wx.getStorageSync('openId')}
        }).then(function(res) {
            if (res.code > 0) {
                util.showSuccessToast('保存成功');
               setTimeout(function(){
                    wx.navigateBack();
               },2000);
            }
        });
    },
    onShow: function() {
        let id = this.data.addressId;
        if (id > 0) {
            wx.setNavigationBarTitle({
                title: '编辑地址',
            })
        } else {
            wx.setNavigationBarTitle({
                title: '新增地址',
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