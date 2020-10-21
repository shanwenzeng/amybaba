var util = require('../../utils/util.js');
var api = require('../../config/api.js');
const pay = require('../../services/pay.js');
const app = getApp()

Page({
    data: {
        checkedGoodsList: [],
        checkedAddress: {},//选择的地址
        totalMoney: 0.00, //商品总价
        freightPrice: 0.00, //快递费
        orderTotalPrice: 0.00, //订单总价
        actualPrice: 0.00, //实际需要支付的总价
        addressId: 0,
        totalAmount: 0,
        postscript: '',
        outStock: 0,
        payMethodItems: [{
                name: 'offline',
                value: '线下支付'
            },
            {
                name: 'online',
                value: '在线支付',
                checked: 'true'
            },
        ],
        payMethod:1,
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
    },
    payChange(e){
        let val = e.detail.value;
        if(val == 'offline'){
            this.setData({
                payMethod:0
            })
        }
        else{
            this.setData({
                payMethod:1
            })
        }
    },
    toGoodsList: function (e) {
        wx.navigateTo({
            url: '/pages/ucenter/goods-list/index',
        });
    },
    toSelectAddress: function () {
        wx.navigateTo({
            url: '/pages/ucenter/address/index?type=1',
        });
    },
    toAddAddress: function () {
        wx.navigateTo({
            url: '/pages/ucenter/address-add/index',
        })
    },
    bindinputMemo(event) {
        let postscript = event.detail.value;
        this.setData({
            postscript: postscript
        });
    },
    onLoad: function (options) {        
        let addType = options.addtype;
        let orderFrom = options.orderFrom;
        if (addType != undefined) {
            this.setData({
                addType: addType
            })
        }
        if (orderFrom != undefined) {
            this.setData({
                orderFrom: orderFrom
            })
        }
    },
    onUnload: function () {
        wx.removeStorageSync('addressId');
    },
    onShow: function () {
        // 页面显示
        // TODO结算时，显示默认地址，而不是从storage中获取的地址值
        // try {
        //     var addressId = wx.getStorageSync('addressId');
        //     if (addressId == 0 || addressId == '') {
        //         addressId = 0;
        //     }
        //     this.setData({
        //         'addressId': addressId
        //     });
        // } catch (e) {}
        
        this.getCheckoutInfo();
        // wx.removeStorageSync('addressId');
        // this.getAddressInfo();
    },
    onPullDownRefresh: function () {
        wx.showNavigationBarLoading()
        try {
            var addressId = wx.getStorageSync('addressId');
            console.log(addressId)
            if (addressId == 0 || addressId == '') {
                addressId = 0;
            }
            this.setData({
                'addressId': addressId
            });
        } catch (e) {
            // Do something when catch error
        }
        this.getCheckoutInfo();
        // this.getAddressInfo();
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
    },
    // TODO 有个bug，用户没选择地址，支付无法继续进行，在切换过token的情况下
    getCheckoutInfo: function () {
        let that = this;
        // let addressId = that.data.addressId;
        let addressId = wx.getStorageSync('addressId');
        let openId=wx.getStorageSync('openId');
        if(addressId === 0 || addressId == "" || addressId == null){
            util.request(api.GetAddresses,{customer:{id:openId}}, "POST"
        ).then(function (res) {
            for(let i=0;i < res.data.length;i++){
                if(res.data[i].isDefault == '是'){
                    that.setData({
                        checkedAddress: res.data[i],
                        addressId: res.data[i].id
                    })
                }
            }
        })
        } else{
            util.request(api.GetAddresses,{customer:{id:openId}}, "POST"
        ).then(function (res) {
            for(let i=0;i < res.data.length;i++){
                if(res.data[i].id===addressId){
                    let addressObject = res.data[i];
                    that.setData({
                        checkedAddress: addressObject,
                        addressId: res.data[i].id
                    })
                }
            }
        });
        }
        util.request(api.GetCartList,{
            customer:{id:openId},
            checked:'1'
        }).then(function (res) {
            let totalAmount=0;//购物车总数量
            let totalMoney=0;//总金额
            for(let i=0;i<res.data.length;i++){
                if(res.data[i].checked=="1"){
                    totalAmount=parseInt(totalAmount)+parseInt(res.data[i].amount);
                    totalMoney=totalMoney+parseFloat(res.data[i].amount)*parseFloat(res.data[i].price)
                }
            }
            let freightPrice = 0; //快递费
            let orderTotalPrice = freightPrice + totalMoney; //实际需要支付的总价
            let actualPrice = freightPrice + totalMoney; //订单总价
            that.setData({
                checkedGoodsList: res.data,
                actualPrice: actualPrice,
                freightPrice: freightPrice,
                totalMoney: totalMoney,
                orderTotalPrice: orderTotalPrice,
                totalAmount:totalAmount,
            });

            let goods = res.data.checkedGoodsList;
            if (res.data.outStock == 1) {
                util.showErrorToast('有部分商品缺货或已下架');
            } else if (res.data.numberChange == 1) {
                util.showErrorToast('部分商品库存有变动');
            }          
        });      
    },
    submitOrder: function (e) {       
        //添加订单（即向orderList表中添加数据）
        let checkedIds = wx.getStorageSync('checkedGoodsId'); //获取购物车勾选的id
        console.log(checkedIds)
        let customerId = wx.getStorageSync('openId');  //获取用户的id
        let number = util.formatTimeNum(new Date(),'YMDhms');  //获取时间戳，为订单号
        let name = this.data.checkedAddress.name; //收货人姓名
        let phone = this.data.checkedAddress.phone; //收货人电话
        let province = this.data.checkedAddress.province; //收货地址
        let city = this.data.checkedAddress.city; //收货地城市
        let district = this.data.checkedAddress.district  //收货地址县（区）
        let detailAddress = this.data.checkedAddress.detailAddress; //详细地址
        util.request(api.generateOrder,{
            id: checkedIds.toString(),
            number: number,
            customer:{id: customerId},
            orderStatus:'待付款',
            shipStatus:'待发货',
            name: name,
            phone: phone,
            province: province,
            city: city,
            district: district,
            detailAddress: detailAddress
        }).then(function(res){
            if(res.code > 0){
                let orderId="wx_orderId_"+res.data;
                pay.payOrder(orderId,customerId).then(res => {
                    wx.redirectTo({
                        url: '/pages/payResult/payResult?status=1&orderId=' + orderId
                    });
                }).catch(res => {
                    wx.redirectTo({
                        url: '/pages/payResult/payResult?status=0 & orderId= '+ orderId
                    });
                }).catch(res => {
                    wx.redirectTo({
                        url: '/pages/payResult/payResult?status=0&orderId=' + orderId
                    });
                });
            } else {
                util.showErrorToast(res.errmsg);
            }
            wx.hideLoading()
            // }else{
            //     util.showErrorToast("提交订单失败，请联系客服");
            // }
        });
        return false;





        let addressId = parseInt(this.data.addressId);
        console.log(addressId<0)
        if (addressId <= 0) {
            console.log(1231)
            util.showErrorToast('请选择收货地址');
            return false;
        }
        
        // console.log(typeof(parseInt(this.data.addressId)));
        let postscript = this.data.postscript;
        let freightPrice = this.data.freightPrice;
        let actualPrice = this.data.actualPrice;
        
        wx.showLoading({
            title: '',
            mask:true
        })
        
        util.request(api.OrderSubmit, {
            addressId: addressId,
            postscript: postscript,
            freightPrice: freightPrice,
            actualPrice: actualPrice,
            offlinePay: 0,
        }, 'POST').then(res => {
            console.log(res)
            if (res.errno === 0) {
                wx.removeStorageSync('orderId');
                wx.setStorageSync('addressId', 0);
                const orderId = res.data.orderInfo.id;
                pay.payOrder(parseInt(orderId)).then(res => {
                    wx.redirectTo({
                        url: '/pages/payResult/payResult?status=1&orderId=' + orderId
                    });
                }).catch(res => {
                    wx.redirectTo({
                        url: '/pages/payResult/payResult?status=0&orderId=' + orderId
                    });
                });
            } else {
                util.showErrorToast(res.errmsg);
            }
            wx.hideLoading()
        });
    },
    offlineOrder: function (e) {
        if (this.data.addressId <= 0) {
            util.showErrorToast('请选择收货地址');
            return false;
        }
        let addressId = this.data.addressId;
        let postscript = this.data.postscript;
        let freightPrice = this.data.freightPrice;
        let actualPrice = this.data.actualPrice;
        util.request(api.OrderSubmit, {
            addressId: addressId,
            postscript: postscript,
            freightPrice: freightPrice,
            actualPrice: actualPrice,
            offlinePay: 1
        }, 'POST').then(res => {
            if (res.errno === 0) {
                wx.removeStorageSync('orderId');
                wx.setStorageSync('addressId', 0);
                wx.redirectTo({
                    url: '/pages/payOffline/index?status=1',
                })
            } else {
                util.showErrorToast(res.errmsg);
                wx.redirectTo({
                    url: '/pages/payOffline/index?status=0',
                })
            }
        });
    }
})