var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
var timer = require('../../../utils/wxTimer.js');
var remaintimer = require('../../../utils/remainTime.js');
const pay = require('../../../services/pay.js');
const app = getApp()

// TODO 拼团订单不能退款
Page({
    data: {
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
        discount:'0',//优惠
        orderId: 0,
        orderInfo: {},
        orderGoods: [],
        handleOption: {},
        textCode: {},
        goodsCount: 0,
        goods_price:0,
        ship:0,
        addressId: 0,
        postscript: '',
        hasPay: 0,
        success: 0,
        imageUrl: '',
        wxTimerList: {},
        express: {},
        onPosting: 0,
        userInfo:{},
        address:{
            name:'',
            phone:'',
            province:'',
            city:'',
            district:'',
            address:''
        },
        shopName: "",
        addShoppingCart: {
            customer: [],
            goods: [],
            product: [],
            name: [],
            standard: [],
            status: [],
            weight: [],
            price: [],
            amount: [],
            photo: [],
        },
        goods:[],
    },
    reOrderAgain: function () {
        let orderId = this.data.orderId;
        this.batchAddShoppingCart(); //点击再来一单，将信息传到提交订单页面
        wx.redirectTo({
            url: '/pages/order-check/index?addtype=2&orderFrom=' + orderId
        })
    },
    copyText: function (e) {
        let data = e.currentTarget.dataset.text;
        wx.setClipboardData({
            data: data,
            success(res) {
                wx.getClipboardData({
                    success(res) {}
                })
            }
        })
    },
    toGoodsList: function (e) {
        let order = this.data.orderInfo.id;
        wx.navigateTo({
            url: '/pages/ucenter/goods-list/index?order=' + order,
        });
    },
    toExpressInfo: function (e) {
        let orderId = this.data.orderId;
        wx.navigateTo({
            url: '/pages/ucenter/express-info/index?id=' + orderId,
        });
    },
    toRefundSelect: function (e) {
        wx.navigateTo({
            url: '/pages/refund-select/index',
        });
    },
    payOrder: function (e) {
        console.log(this+"....")
        let that = this;
        let orderId="wx_orderId_"+this.data.orderId;
        let order=this.data.orderId;//保存到消费记录表(recharge)中的order
        //检测是否有余额，如果有余额，则优先使用余额支付，否则调用微信支付
        util.request(api.findMoney,{
            id:wx.getStorageSync('openId')
        }).then(function(res){
            if(res.code>0 && res.data>=that.data.orderInfo.price){    
                wx.showModal({
                    title: "您余额为："+res.data+"元",
                    content: "您确定支付吗？",
                    success: function (res) {
                        if (res.confirm) {                                    
                            util.request(api.investMoney,{
                                id:wx.getStorageSync('openId'),
                                customer:{id:wx.getStorageSync('openId')},
                                money:that.data.orderInfo.price,
                                order:order,
                                type:"商品消费"
                            }).then(function(res){
                                if(res.code>0){
                                    //付款成功后，修改订态状态为待发货
                                    ////批量修改商品的销售量和库存
                                    that.editProductStockAndSell();
                                    util.request(api.editOrderList,{
                                        id:order,
                                        status:'待发货'
                                    }).then(function(res){
                                        if(res.code>0){
                                            wx.redirectTo({
                                                url: '/pages/payResult/payResult?status=1&orderId=' + orderId
                                            });
                                        }
                                    });
                                }else{
                                    wx.redirectTo({
                                        url: '/pages/payResult/payResult?status=0&orderId= '+ orderId
                                    });
                                }
                            });
                        }
                    }
                });
            }else{
                //调用微信支付
                pay.payOrder(orderId,wx.getStorageSync('openId'),that.data.orderInfo.price.toString()).then(res => {
                    //付款成功后，修改订态状态为待发货
                    ////批量修改商品的销售量和库存
                    that.editProductStockAndSell();
                    util.request(api.editOrderList,{
                        id:order,
                        status:'待发货'
                    }).then(function(res){
                        if(res.code>0){
                            wx.redirectTo({
                                url: '/pages/payResult/payResult?status=1&orderId=' + orderId
                            });
                        }
                    });
                }).catch(res => {
                    wx.redirectTo({
                        url: '/pages/payResult/payResult?status=0&orderId= '+ orderId
                    });
                });
            }
        });


        pay.payOrder(parseInt(that.data.orderId)).then(res => {
            that.getOrderDetail();
        }).catch(res => {
            util.showErrorToast(res.errmsg);
        });
    },
    toSelectAddress: function () {
        let orderId = this.data.orderId;
        wx.navigateTo({
            url: '/pages/ucenter/address-select/index?id=' + orderId,
        });
    },
    onLoad: function (options) {
        this.data.orderId=wx.getStorageSync('orderId');
    },
    onShow: function () {
        var orderId = wx.getStorageSync('orderId');
        let userInfo = wx.getStorageSync('userInfo');
        this.setData({
            orderId: orderId,
            userInfo:userInfo
        });
        wx.showLoading({
            title: '加载中...',
        })
        this.getOrderDetail();//查询订单详情
        // this.getExpressInfo();
        this.findOrderDetail();//查询订单的每项商品详情
    },
    onUnload: function () {
        let oCancel = this.data.handleOption.cancel;
    },
    onHide: function () {
        let oCancel = this.data.handleOption.cancel;
    },
    orderTimer: function (endTime) {
        let that = this;
        var orderTimerID = '';
        let wxTimer2 = new timer({
            endTime: endTime,
            name: 'orderTimer',
            id: orderTimerID,
            complete: function () {
                that.letOrderCancel();
            },
        })
        wxTimer2.start(that);
    },
    bindinputMemo(event) {
        let postscript = event.detail.value;
        this.setData({
            postscript: postscript
        });
    },
    getExpressInfo: function () {
        this.setData({
            onPosting: 0
        })
        let that = this;
        util.request(api.OrderDetail, {
            orderId: that.data.orderId
        }).then(function (res) {
            if (res.data.length > 0) {
                let express = res.data;
                // express.traces = JSON.parse(res.data.traces);
                that.setData({
                    onPosting: 1,
                    express: express
                });
            }
        });
    },
    getOrderDetail: function () {
        let that = this;
        let amount=0;
        let price=0;
        let orderInfo={};
        util.request(api.OrderList, {
            customer:{id:wx.getStorageSync('openId')},
            id: that.data.orderId
        }).then(function (res) {
            if (res.length > 0) {
                that.findShopName(res[0].shop) //查询商家名称
                //将图片拆分成数组
                if(res[0].allImage!=undefined && res[0].allImage!=null && res[0].allImage.length>0){
                    res[0].allImage=res[0].allImage.split(",");
                }
                that.setData({
                    address:{
                        name:res[0].name,
                        phone:res[0].phone,
                        province:res[0].province,
                        city:res[0].city,
                        district:res[0].district,
                        address:res[0].address
                    },
                    orderInfo:{
                        id:res[0].id,
                        allImage:res[0].allImage,
                        amount: res[0].amount,
                        price:res[0].totalPrice,
                        createTime:Date.prototype.getLongDate(res[0].createTime) ,//重新设置时间格式
                        number:res[0].number,
                        status:res[0].status,
                        productIds:res[0].productIds.split(",")
                    }
                });
                if(res[0].status == "待付款"){
                    that.setData({
                        handleOption:{
                            cancel: true,
                            pay: true
                        }
                    })
                }
                if(res[0].status == "待收货"){
                    that.setData({
                        handleOption:{
                            confirm: true
                        }
                    })
                }
                wx.setStorageSync('orderInfo', that.data.orderInfo);//将查询出来的订单放在缓存中，用于再来一单方法中调用
            }
        });
        wx.hideLoading();
    },
    letOrderCancel: function () {
        let that = this;
        util.request(api.OrderCancel, {
            orderId: that.data.orderId
        }, 'POST').then(function (res) {
            if (res.errno === 0) {
                that.getOrderDetail();
            } else {
                util.showErrorToast(res.errmsg);
            }
        });
    },
    // “删除”点击效果
    deleteOrder: function () {
        let that = this;
        wx.showModal({
            title: '',
            content: '确定要删除此订单？',
            success: function (res) {
                if (res.confirm) {
                    util.request(api.OrderDelete, {
                        orderId: that.data.orderId
                    }, 'POST').then(function (res) {
                        if (res.errno === 0) {
                            wx.showToast({
                                title: '删除订单成功'
                            });
                            wx.removeStorageSync('orderId');
                            wx.setStorageSync('doRefresh', 1);
                            wx.navigateBack();
                        } else {
                            util.showErrorToast(res.errmsg);
                        }
                    });
                }
            }
        });
    },
    // “确认收货”点击效果
    confirmOrder: function (e) {
        let that = this;
        wx.showModal({
            title: '',
            content: '您确认收货？',
            success: function (res) {
                if (res.confirm) {
                     //付款成功后，修改订态状态为待发货
                     util.request(api.editOrderList,{
                        id:that.data.orderInfo.id,
                        status:'已收货'
                    }).then(function(res){
                        if(res.code>0){
                            wx.showToast({
                                title: '确认收货成功！'
                            });
                            setTimeout(() => {
                                wx.navigateBack()
                            }, 2000); 
                        }else {
                            util.showErrorToast(res.errmsg);
                        }
                    })
                }
            }
        });
    },
    // “取消订单”点击效果
    cancelOrder: function (e) {
        let id=e.currentTarget.dataset.index;//订单id
        let that = this;
        wx.showModal({
            title: '',
            content: '确定要取消此订单？',
            success: function (res) {
                if (res.confirm) {
                    util.request(api.delOrderList, {
                        id: id
                    }).then(function (res) {
                        if (res> 0) {
                            wx.showToast({
                                title: '取消订单成功'
                            });
                            setTimeout(function(){
                                wx.navigateBack();
                            },2000)
                        } else {
                            util.showErrorToast("订单取消失败，请联系客服");
                        }
                    });
                }
            }
        });
    },

    //获取商家名称
    findShopName: function(id){
        let that = this;
        util.request(api.findShopName,{id: id}).then(function(res){
            that.setData({
                shopName: res.name
            })
        })
    },

    //根据订单的id（orderdetailt中的id）查出商品信息，传给提交订单页面
    findOrderDetail: function(){
        let that = this;
        util.request(api.findOrderDetail, {
            order:this.data.orderId
        }).then(function(res) {
            if(res.data.length>0){
                let freightPrice =  parseFloat(res.data[0].delivery);;//配送费
                let discount = 0; //折扣
                for(let i = 0; i < res.data.length; i++){
                    discount += parseFloat(res.data[i].discount);
                }
                that.setData({
                    goods: res.data,
                    freightPrice: freightPrice,
                    discount: discount
                })
                wx.setStorageSync('checkedGoodsList', res.data)
            }
        });
    },


    //点击再来一单，将商品批量加入购物车，状态为1(stutas)
    batchAddShoppingCart:function(){
        let that = this;
        //点击再来一单，将商品批量加入购物车，状态为1(stutas)
        let goods = this.data.goods;
        let status = 1;
        for(let i = 0; i < goods.length; i++){
            that.data.addShoppingCart.customer.push(goods[i].customer.id); //获取顾客id
            that.data.addShoppingCart.goods.push(goods[i].goods.id);      // 商品id
            that.data.addShoppingCart.product.push(goods[i].product.id);  //获取商品类型id
            that.data.addShoppingCart.name.push(goods[i].name);    //获取商品名称  
            that.data.addShoppingCart.standard.push(goods[i].standard);   //获取商品类型名称       
            that.data.addShoppingCart.status.push(status);              //状态码（为1）
            that.data.addShoppingCart.weight.push(goods[i].product.weight); //获取商品规格
            that.data.addShoppingCart.price.push(goods[i].price);        //获取商品价格
            that.data.addShoppingCart.amount.push(goods[i].amount);          //获取商品的数量
            that.data.addShoppingCart.photo.push(goods[i].photo);          //获取商品的图片路径
        }
        util.request(api.batchAddShoppingCart, {
            customer:that.data.addShoppingCart.customer.toString(),
            goods:that.data.addShoppingCart.goods.toString(),
            product:that.data.addShoppingCart.product.toString(),
            name: that.data.addShoppingCart.name.toString(),
            standard: that.data.addShoppingCart.standard.toString(),
            status: that.data.addShoppingCart.status.toString(),
            weight: that.data.addShoppingCart.weight.toString(),
            price: that.data.addShoppingCart.price.toString(),
            amount: that.data.addShoppingCart.amount.toString(),
            photo: that.data.addShoppingCart.photo.toString()
        })
        .then(function(res) {
        })
    },

    //批量修改商品的销售量和库存
    editProductStockAndSell: function(){
        let productIds = [];
        let amount = [];
        let goods = this.data.goods;
        for(let i = 0; i < goods.length; i++){
            productIds.push(goods[i].product.id);
            amount.push(goods[i].amount);
        }
        util.request(api.batchEditProduct,{id: productIds.toString(),stock: amount.toString(),sell: amount.toString()}).then();
    }
})
