var app = getApp();
var WxParse = require('../../lib/wxParse/wxParse.js');
var util = require('../../utils/util.js');
var timer = require('../../utils/wxTimer.js');
var api = require('../../config/api.js');
const user = require('../../services/user.js');
Page({
    data: {
        shoppingCartAmount: 0,
        totalAmount:"",
        id: 0,
        goods: {},
        gallery: [],
        galleryImages:[],
        specificationList: [],
        productList: [],
        cartGoodsCount: 0,
        checkedSpecPrice: 0,
        number: 1,
        checkedSpecText: '',
        tmpSpecText: '请选择规格和数量',
        openAttr: false,
        soldout: false,
        disabled: '',
        alone_text: '单独购买',
        userId: 0,
        priceChecked: false,
        goodsNumber: 0,
        loading: 0,
        current: 0,
        showShareDialog:0,
        userInfo:{},
        autoplay:true,
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
    },
    hideDialog: function (e) {
        let that = this;
        that.setData({
            showShareDialog: false,
        });
    },
    shareTo:function(){
        let userInfo = wx.getStorageSync('userInfo');
        if (userInfo == '') {
            util.loginNow();
            return false;
        } else {
            this.setData({
                showShareDialog: !this.data.showShareDialog,
            });
        }
    },
    createShareImage: function () {
        let id = this.data.id;
        wx.navigateTo({
            url: '/pages/share/index?goodsid=' + id
        })
    },
    previewImage: function (e) {
        let current = e.currentTarget.dataset.src;
        let that = this;
        wx.previewImage({
            current: current, // 当前显示图片的http链接  
            urls: that.data.galleryImages // 需要预览的图片http链接列表  
        })
    },
    bindchange: function(e) {
        let current = e.detail.current;
        this.setData({
            current: current
        })
    },
    inputNumber(event) {
        let number = event.detail.value;
        if(number >= 0){
            this.setData({
                number: number
            })
            this.count();
        }else{
            this.setData({
                number: 1
            })
        }
    },
    goIndex: function() {
        wx.switchTab({
            url: '/pages/index/index',
        })
    },
    onShareAppMessage: function(res) {
        let id = this.data.id;
        let name = this.data.goods.name;
        let image = this.data.goods.list_pic_url;
        let userId = this.data.userId;
        return {
            title: name,
            path: '/pages/goods/goods?id=' + id + '&&userId=' + userId,
            imageUrl: image
        }
    },
    onUnload: function() {},
    handleTap: function(event) { //阻止冒泡 
    },
    getGoodsInfo: function() {
        let that = this;
        util.request(api.GoodsDetail, {
            id: that.data.id
        }).then(function(res) {
            if (res.errno === 0) {
                let _specificationList = res.data.specificationList;
                // 如果仅仅存在一种货品，那么商品页面初始化时默认checked
                if (_specificationList.valueList.length == 1) {
                    _specificationList.valueList[0].checked = true
                    that.setData({
                        checkedSpecText: '已选择：' + _specificationList.valueList[0].value,
                        tmpSpecText: '已选择：' + _specificationList.valueList[0].value,
                    });
                } else {
                    that.setData({
                        checkedSpecText: '请选择规格和数量'
                    });
                }
                let galleryImages = [];
                for (const item of res.data.gallery) {
                    galleryImages.push(item.img_url);
                }
                that.setData({
                    goods: res.data.info,
                    goodsNumber: res.data.info.goods_number,
                    gallery: res.data.gallery,
                    specificationList: res.data.specificationList,
                    productList: res.data.productList,
                    checkedSpecPrice: res.data.info.retail_price,
                    galleryImages: galleryImages,
                    loading:1
                });
                WxParse.wxParse('goodsDetail', 'html', res.data.info.goods_desc, that);
                wx.setStorageSync('goodsImage', res.data.info.https_pic_url);
                
            }
            else{
                util.showErrorToast(res.errmsg)
            }
        });
    },
    clickSkuValue: function(event) {
        // goods_specification中的id 要和product中的goods_specification_ids要一样
        let that = this;
        let specNameId = event.currentTarget.dataset.nameId;
        let specValueId = event.currentTarget.dataset.valueId;
        let index = event.currentTarget.dataset.index;

        //判断是否可以点击
        let _specificationList = this.data.specificationList;
        if (_specificationList.specification_id == specNameId) {
            for (let j = 0; j < _specificationList.valueList.length; j++) {
                if (_specificationList.valueList[j].id == specValueId) {
                    //如果已经选中，则反选
                    if (_specificationList.valueList[j].checked) {
                        _specificationList.valueList[j].checked = false;
                    } else {
                        _specificationList.valueList[j].checked = true;
                    }
                } else {
                    _specificationList.valueList[j].checked = false;
                }
            }
        }
        this.setData({
            'specificationList': _specificationList
        });
        //重新计算spec改变后的信息
        this.changeSpecInfo();

        //重新计算哪些值不可以点击
    },
    //获取选中的规格信息
    getCheckedSpecValue: function() {
        let checkedValues = [];
        let _specificationList = this.data.specificationList;
        let _checkedObj = {
            nameId: _specificationList.specification_id,
            valueId: 0,
            valueText: ''
        };
        for (let j = 0; j < _specificationList.valueList.length; j++) {
            if (_specificationList.valueList[j].checked) {
                _checkedObj.valueId = _specificationList.valueList[j].id;
                _checkedObj.valueText = _specificationList.valueList[j].value;
            }
        }
        checkedValues.push(_checkedObj);
        return checkedValues;
    },
    //根据已选的值，计算其它值的状态
    setSpecValueStatus: function() {

    },
    //判断规格是否选择完整
    isCheckedAllSpec: function() {
        return !this.getCheckedSpecValue().some(function(v) {
            console.log(v);
            if (v.valueId == 0) {
                return true;
            }
        });
    },
    getCheckedSpecKey: function() {
        let checkedValue = this.getCheckedSpecValue().map(function(v) {
            return v.valueId;
        });
        return checkedValue.join('_');
    },
    changeSpecInfo: function() {
        let checkedNameValue = this.getCheckedSpecValue();
        this.setData({
            disabled: '',
            number: 1
        });
        //设置选择的信息
        let checkedValue = checkedNameValue.filter(function(v) {
            if (v.valueId != 0) {
                return true;
            } else {
                return false;
            }
        }).map(function(v) {
            return v.valueText;
        });
        if (checkedValue.length > 0) {
            this.setData({
                tmpSpecText: '已选择：' + checkedValue.join('　'),
                priceChecked: true

            });
        } else {
            this.setData({
                tmpSpecText: '请选择规格和数量',
                priceChecked: false
            });
        }

        if (this.isCheckedAllSpec()) {
            this.setData({
                checkedSpecText: this.data.tmpSpecText
            });

            // 点击规格的按钮后
            // 验证库存
            let checkedProductArray = this.getCheckedProductItem(this.getCheckedSpecKey());
            if (!checkedProductArray || checkedProductArray.length <= 0) {
                this.setData({
                    soldout: true
                });
                // console.error('规格所对应货品不存在');
                wx.showToast({
                    image: '/images/icon/icon_error.png',
                    title: '规格所对应货品不存在',
                });
                return;
            }
            let checkedProduct = checkedProductArray[0];
            if (checkedProduct.goods_number < this.data.number) {
                //找不到对应的product信息，提示没有库存
                this.setData({
                    checkedSpecPrice: checkedProduct.retail_price,
                    goodsNumber: checkedProduct.goods_number,
                    soldout: true
                });
                wx.showToast({
                    image: '/images/icon/icon_error.png',
                    title: '库存不足',
                });
                return false;
            }
            if (checkedProduct.goods_number > 0) {
                this.setData({
                    checkedSpecPrice: checkedProduct.retail_price,
                    goodsNumber: checkedProduct.goods_number,
                    soldout: false
                });

                var checkedSpecPrice = checkedProduct.retail_price;

            } else {
                this.setData({
                    checkedSpecPrice: this.data.goods.retail_price,
                    soldout: true
                });
            }
        } else {
            this.setData({
                checkedSpecText: '请选择规格和数量',
                checkedSpecPrice: this.data.goods.retail_price,
                soldout: false
            });
        }
    },
    getCheckedProductItem: function(key) {
        return this.data.productList.filter(function(v) {
            if (v.goods_specification_ids == key) {
                return true;
            } else {
                return false;
            }
        });
    },
    onLoad: function(options) {
        this.findProductCarousel(options.id);
        this.findGoodsDetail(options.id);
        this.addBrowserHistory(options.id);
        let id = 0;
        var scene = decodeURIComponent(options.scene);
        if (scene != 'undefined') {
            id = scene;
        } else {
            id = options.id;
        }
        this.setData({
            id: id, // 这个是商品id
            valueId: id,
        });
    },
    //添加我的足迹
    addBrowserHistory(productId){
        let that=this;
        let openId = wx.getStorageSync('openId');
        if(openId==undefined || openId.length==0){//如果没有openId,不保存浏览足迹
            return false;
        }
        let obj={customer:{id:openId},product:{id:productId}};
         //判断是否存在
         util.request(api.browserHistoryIsExist,obj).then(function(res){
            if(res.code <=0){//不存在，保存浏览记录
                util.request(api.addBrowserHistory,obj).then(function(res){
                    if(res.code <=0){
                        console.log("保存商品浏览记录失败")
                    }
                })
            }
        });
    },
    //查询商品详情
    findGoodsDetail(productId){
        let that = this;
        util.request(api.GetProduct,{productId:productId}).then(function(res) {
            if (res.data.length > 0) {
                that.setData({
                     goods: res.data,
                     loading:1
                });
                WxParse.wxParse('goodsDetail', 'html', res.data[0].goods.detail, that);
                that.getShoppingCartInfo();//获取商品详情后判断购物车有无此商品
            }
        });
    },
    //查询产品轮播图
    findProductCarousel(productId){
        let that = this;
        util.request(api.ProductCarousel,{productId:productId}).then(function(res) {
            if (res.length > 0) {
                that.setData({
                    gallery: res
                });
            }
        });
    },
    onShow: function() {
        let userInfo = wx.getStorageSync('userInfo');
        let info = wx.getSystemInfoSync();
        let sysHeight = info.windowHeight - 100;
        let userId = userInfo.id;
        if (userId > 0) {
            this.setData({
                userId: userId,
                userInfo: userInfo,
            });
        }
        this.setData({
            priceChecked: false,
            sysHeight: sysHeight,
        })
        // this.getGoodsInfo();
        // this.getCartCount();
    },
    onHide:function(){
        this.setData({
            autoplay:false
        })
    },
    getCartCount: function() {
        let that = this;
        util.request(api.CartGoodsCount).then(function(res) {
            if (res.errno === 0) {
                that.setData({
                    cartGoodsCount: res.data.cartTotal.goodsCount
                });
            }
        });
    },
    onPullDownRefresh: function() {
        wx.showNavigationBarLoading()
        this.getGoodsInfo();
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
    },
    openCartPage: function() {
        wx.switchTab({
            url: '/pages/cart/cart',
        });
    },
    goIndexPage: function() {
        wx.switchTab({
            url: '/pages/index/index',
        });
    },
    switchAttrPop: function() {
        let goods = this.data.goods;
        //如果库存开始便为0，则打不开窗口
        if(goods[0].stock == 0){
            return false;
        }
        if(goods[0].stock > 0){
            goods[0].stock = parseInt(goods[0].stock)-1;//打开规格窗口，库存 -1
        }
        if (this.data.openAttr == false) {
            this.count();
            this.setData({
                openAttr: !this.data.openAttr,
                goods: goods
            });
        }
    },
    closeAttr: function() {
        let goods = this.data.goods;
        if(goods[0].stock >= 0 || this.data.number > 1){
            goods[0].stock = parseInt(goods[0].stock) + parseInt(this.data.number); //关闭规格窗口，库存变回原数
        }
        this.setData({
            openAttr: false,
            alone_text: '单独购买',
            goods: goods,
            number: 1
        });
    },
    goMarketing: function(e) {
        let that = this;
        that.setData({
            showDialog: !this.data.showDialog
        });
    },
    //查询用户的购物车里有没有当前商品，如果有则返回购物车id和购物车里该商品的数量
    getShoppingCartInfo:function(){
        let that = this;
        let goods = that.data.goods;    //获取改商品的信息
        //查询改顾客购物车中的所有商品
        util.request(api.GetCartList,{  
            customer:{id:wx.getStorageSync('openId')}
        }).then(function(res){
            let shoppingCartListInfo = res.data;
            //判断该用户购物车有无商品
            if(shoppingCartListInfo.length > 0){
                let standard = goods[0].standard;  //获取该页面商品的规格
                for(let i = 0; i < shoppingCartListInfo.length; i++){
                    //比对用户购物车里有没有和该页面相同的商品
                    if(standard == shoppingCartListInfo[i].standard){
                        let shoppingCartAmount = parseInt(shoppingCartListInfo[i].amount); //获取购物车中该商品的数量
                        that.setData({
                            shoppingCartId: shoppingCartListInfo[i].id, //购物车的主键id
                            shoppingCartAmount: shoppingCartAmount,  //购物车中该商品的数量
                            shoppingCartMessage: 1  //提示信息，如果为1则购物车中有改商品，为0则无
                        })
                        return false;
                    }else{
                        that.setData({
                            shoppingCartMessage: 0
                        })
                    }
                }
            }else{
                that.setData({
                    shoppingCartMessage: 0
                })
            }
        })
    },
    //修改购物车里商品的数量
    updateShoppingAmount: function(){
        let that = this;
        let shoppingCartId = this.data.shoppingCartId; //获取拥有改商品的购物车主键id
        let shoppingCartAmount = this.data.shoppingCartAmount;  //获取拥有改商品的购物车的数量
        let goodsAmount = this.data.number;     //获取用户想购买该商品的数量（加减按钮中间input框的值）
        let amountCounts = shoppingCartAmount + goodsAmount;    //需要更改的数量
        util.request(api.Editshoppingcart,{
            id: shoppingCartId,
            amount: amountCounts
        }).then(function(res){
            if(res.code>=0){
                util.showSuccessToast('加入成功')
                that.setData({
                    shoppingCartAmount: amountCounts    //更改后购物车中改商品的数量
                })
                if (that.data.openAttr == true) {
                    that.setData({
                        openAttr: !that.data.openAttr,  
                    });
                }
            }else{
                wx.showToast({
                    image: '/images/icon/icon_error.png',
                    title: _res.errmsg,
                });
            }
        })
    },
    addToCart: function() {
        // 判断是否登录，如果没有登录，则登录
        util.loginNow();
        var that = this;
        let goods = that.data.goods;
        let userInfo = wx.getStorageSync('userInfo');
        if (userInfo == '') {
            return false;
        }
        that.getShoppingCartInfo(); //判断购物车里有无这件商品
        if (this.data.openAttr == false ) {
            if(goods[0].stock > 0){
                goods[0].stock = parseInt(goods[0].stock)-1;//打开规格窗口，库存 -1
            }
            that.count();//计算当前总价格
            //打开规格选择窗口
            this.setData({
                openAttr: !that.data.openAttr,
                goods: goods
            });
            this.setData({
                alone_text: '加入购物车'
            })
        } else {
            let goods = that.data.goods;
            //验证库存
            if (goods[0].stock < 0) {
                //要买的数量比库存多
                wx.showToast({
                    image: '/images/icon/icon_error.png',
                    title: '库存不足',
                });
                return false;
            }
            //如果购物车中存在此商品，则直接修改数量（amount）
            if(that.data.shoppingCartMessage == 1){
                //修改购物车中此商品的数量（amount）
                that.updateShoppingAmount();
            }
            //如果购物车中不存在此商品，把此商品的信息存入购物车中
            if(that.data.shoppingCartMessage == 0){
                util.request(api.Addshoppingcart, {
                    addType: 0,
                    goods:{id: goods[0].goods.id},              //商品的id
                    customer:{id:wx.getStorageSync('openId')},  //顾客id
                    amount:that.data.number.toString(),         //商品的数量
                    photo:goods[0].photo,                       //图片路径
                    product:{id:goods[0].id},                   //产品表id
                    name:goods[0].goods.name,                   //商品名称
                    weight:goods[0].weight,                     //商品的重量
                    price:goods[0].price,                       //商品的价格
                    standard:goods[0].standard,                 //商品的规格
                    status: "0"                                 //状态码
                })
                .then(function(res) {
                    if(res.code>0){
                        util.showSuccessToast('加入成功')
                        if (that.data.openAttr == true) {
                            that.setData({
                                openAttr: !that.data.openAttr,
                                shoppingCartAmount: that.data.number
                            });
                        } 
                    }else{
                        wx.showToast({
                            image: '/images/icon/icon_error.png',
                            title: _res.errmsg,
                        });
                    }
        
                });
            }
            
        }
    },
    fastToCart: function() {
        // 判断是否登录，如果没有登录，则登录
        util.loginNow();
        let userInfo = wx.getStorageSync('userInfo');
        let goods = this.data.goods;
        if (userInfo == '') {
            return false;
        }
        var that = this;
        if (this.data.openAttr === false) {
            if(goods[0].stock > 0){
                goods[0].stock = parseInt(goods[0].stock)-1;//打开规格窗口，库存 -1
            }
            that.count(); //显示总价格
            //打开规格选择窗口
            this.setData({
                openAttr: !this.data.openAttr,
                goods: goods
            });
            that.setData({
                alone_text: '立即购买'
            })
        } else {
        //     //提示选择完整规格
        //     if (!this.isCheckedAllSpec()) {
        //         wx.showToast({
        //             image: '/images/icon/icon_error.png',
        //             title: '请选择规格',
        //         });
        //         return false;
        //     }
        //     //根据选中的规格，判断是否有对应的sku信息
        //     let checkedProductArray = this.getCheckedProductItem(this.getCheckedSpecKey());
        //     if (!checkedProductArray || checkedProductArray.length <= 0) {
        //         //找不到对应的product信息，提示没有库存
        //         wx.showToast({
        //             image: '/images/icon/icon_error.png',
        //             title: '库存不足',
        //         });
        //         return false;
        //     }
        //     let checkedProduct = checkedProductArray[0];
        //     //验证库存
        //     if (checkedProduct.goods_number < this.data.number) {
        //         //要买的数量比库存多
        //         wx.showToast({
        //             image: '/images/icon/icon_error.png',
        //             title: '库存不足',
        //         });
        //         return false;
        //     }

            //验证库存
            let goods = that.data.goods;
            if (goods[0].stock < 0) {
                //要买的数量比库存多
                wx.showToast({
                    image: '/images/icon/icon_error.png',
                    title: '库存不足',
                });
                return false;
            }
            //立即购买
            util.request(api.Addshoppingcart, {
                    addType: 1, // 0：正常加入购物车，1:立即购买，2:再来一单
                    goods:{id: goods[0].goods.id},              //商品的id
                    customer:{id:wx.getStorageSync('openId')},  //顾客id
                    amount:that.data.number.toString(),         //商品的数量
                    photo:goods[0].photo,                       //图片路径
                    product:{id:goods[0].id},                   //产品表id
                    name:goods[0].goods.name,                   //商品名称
                    weight:goods[0].weight,                     //商品的重量
                    price:goods[0].price,                       //商品的价格
                    standard:goods[0].standard,                 //商品的规格
                    status: "1"
                }, "POST")
                .then(function(res) {
                    let _res = res;
                    if (_res.code >= 0) {
                        goods[0]['totalMoney'] = that.data.totalMoney; //将总金额加入商品信息中
                        goods[0]['amount'] = that.data.number;  //将总数量加入商品信息中
                        goods[0]['productIds'] = that.data.id; //将产品id修改为productIds
                        wx.setStorageSync('checkedGoodsList1', goods);
                        wx.navigateTo({
                            url: '/pages/order-check/index?addtype=1'
                        });
                    } else {
                        wx.showToast({
                            image: '/images/icon/icon_error.png',
                            title: _res.errmsg,
                        });
                    }
                });
        }
    },
    cutNumber: function() {
        let goods = this.data.goods;//获取当前页的商品信息
        //当选择的数量大于1时，点击（-）按钮，库存加1，
        if(this.data.number > 1){
                goods[0].stock = parseInt(goods[0].stock) + 1;
                this.setData({
                    number: (this.data.number - 1 > 1) ? this.data.number - 1 : 1,
                    goods: goods
                });
                this.count();
        }else{
            wx.showToast({
                image: '/images/icon/icon_error.png',
                title: '不能在减了',
            });
       }
        this.setData({
            disabled: ''
        });
    },
    addNumber: function() {
        let goods = this.data.goods;
        if(goods[0].stock > 0){
            goods[0].stock = parseInt(goods[0].stock) - 1;
            this.setData({
                number: Number(this.data.number) + 1,
                goods: goods
            });
            this.count();
       }else{
            wx.showToast({
                image: '/images/icon/icon_error.png',
                title: '库存不足',
            });
       }
        
        // let checkedProductArray = this.getCheckedProductItem(this.getCheckedSpecKey());
        // let checkedProduct = checkedProductArray;
        // var check_number = this.data.number + 1;
        // if (checkedProduct.goods_number < check_number) {
        //     this.setData({
        //         disabled: true
        //     });
        // }
    },
    //计算当时的总金额
    count: function(){
        let goods = this.data.goods; //获取商品的信息
        let totalMoney = goods[0].price * this.data.number;  //计算总金额
        this.setData({
            totalMoney: totalMoney,
            goods: goods
        }) 
    }
})