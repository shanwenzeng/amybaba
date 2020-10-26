var util = require('../../utils/util.js');
var api = require('../../config/api.js');
const pay = require('../../services/pay.js');
const { formatTime } = require('../../utils/util.js');
const app = getApp()

Page({
    data: {
        // checkedGoodsList: [],
        checkedAddress: {},
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
        this.getAddress();//获取地址信息
        this.getGodds();//获取商品信息
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
    //提交订单
    submitOrder: function (e) {
        if (this.data.addressId <= 0) {
            util.showErrorToast('请选择收货地址');
            return false;
        }
        //添加订单（即向orderList表中添加数据）
        let that = this;
        let id = [];            //定义购物车勾选的id
        let productId = [];
        let goods = [];         //产品表id
        let goodsName = [];     //定义购物车勾选商品的名称
        let standard = [];      //定义购物车勾选商品的规格
        let simple = [];        //订单的备注
        let price = [];         //定义加入购物车的价格
        let amount = [];        //定义购物车勾选商品的数量
        let image = [];         //定义购物车勾选商品的图片路径
        let checkedGoodsList = that.data.checkedGoodsList; //获取购物车勾选的对象
        let postscriptValue = that.data.postscript;      //获取备注
        if(postscriptValue == null || postscriptValue == ""){ //如果备注为空，默认输入“无备注”
            postscriptValue = "无";
        }

        for(let i = 0; i < checkedGoodsList.length; i++){
            id.push(checkedGoodsList[i].id);                //获取购物车勾选的id
            goods.push(checkedGoodsList[i].goods.id);      // 产品表id
            goodsName.push(checkedGoodsList[i].goods.name);       //获取购物车勾选商品的规格
            standard.push(checkedGoodsList[i].standard);    //获取购物车勾选商品的规格          
            simple.push(postscriptValue);              //获取备注                 
            price.push(checkedGoodsList[i].price);          //获取加入购物车的价格
            amount.push(checkedGoodsList[i].amount);        //获取购物车勾选商品的数量
            image.push(checkedGoodsList[i].photo);          //获取购物车勾选商品的图片路径
        }
        
        //将集合转化为字符串
        goods=goods.join(",");
        goodsName=goodsName.join(",");
        standard=standard.join(",");
        simple = simple.join(",");
        price=price.join(",");
        amount=amount.join(",");
        image=image.join(",");

        let customerId = wx.getStorageSync('openId');  //获取用户的id
        let number = util.formatTimeNum(new Date(),'YMDhms');  //获取时间戳，为订单号
        let name = this.data.checkedAddress.name; //收货人姓名
        let phone = this.data.checkedAddress.phone; //收货人电话号码
        let province = this.data.checkedAddress.province; //收货地址
        let city = this.data.checkedAddress.city; //收货地城市
        let district = this.data.checkedAddress.district  //收货地址县（区）
        let detailAddress = this.data.checkedAddress.detailAddress; //详细地址
        util.request(api.generateOrder,{
            id: id.toString(),
            number: number,
            customer:{id: customerId},
            status:'待付款',
            name: name,
            phone: phone,
            province: province,
            city: city,
            district: district,
            detailAddress: detailAddress,
            goods: goods,
            goodsName: goodsName,
            standard: standard,
            simple: simple,
            price: price,
            amount: amount,
            image: image
        }).then(function(res){
            if(res.code > 0){
                // let orderId=res.data;
                let orderId="wx_orderId_"+res.data;
                console.log(orderId+".......")
                pay.payOrder(orderId,customerId).then(res => {
                    wx.redirectTo({
                        url: '/pages/payResult/payResult?status=1&orderId=' + orderId
                    });
                }).catch(res => {
                    wx.redirectTo({
                        url: '/pages/payResult/payResult?status=0&orderId= '+ orderId
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
    },
    offlineOrder: function (e) {
        // if (this.data.addressId <= 0) {
        //     util.showErrorToast('请选择收货地址');
        //     return false;
        // }
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
    },
    //获取地址信息
    getAddress:function(){
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
    },
    //获取商品信息
    getGodds:function(){
        let that = this;
         //获取选中的商品信息
        let addType = that.data.addType;
        let ids;
        let id="";
        if(addType == 0){
            ids = wx.getStorageSync('checkedGoodsList');
            for (let i = 0; i < ids.length; i++) {
                id += ids[i].id+",";            
            }
            id=id.substr(0,id.length-1);//选中商品的id
            util.request(api.GetCartList,
                {
                    id:id,
                    addType: addType,
                }
                ).then(function (res) {
                    console.log(res);
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
                     actualPrice: actualPrice,
                     freightPrice: freightPrice,
                     totalMoney: totalMoney,
                     orderTotalPrice: orderTotalPrice,
                     totalAmount:totalAmount,
                     checkedGoodsList:res.data,//设置选中的商品信息 
                 });

                //  let goods = res.data.checkedGoodsList;
                //  if (res.data.outStock == 1) {
                //      util.showErrorToast('有部分商品缺货或已下架');
                //  } else if (res.data.numberChange == 1) {
                //      util.showErrorToast('部分商品库存有变动');
                //  }       
             }); 
        }
        if(addType == 1){
        ids = wx.getStorageSync('checkedGoodsList1');
        let totalAmount = ids[0].amount;//总数量
        let totalMoney = ids[0].totalMoney; //总金额
        let freightPrice = 0; //快递费
        let actualPrice = freightPrice + totalMoney; //订单总价
        let orderTotalPrice = freightPrice + totalMoney; //实际需要支付的总价
        that.setData({
            totalAmount: totalAmount,
            actualPrice: actualPrice,
            freightPrice: freightPrice,
            totalMoney: totalMoney,
            orderTotalPrice: orderTotalPrice,
            checkedGoodsList: ids,
        })
        }
        console.log(ids);
    }
})