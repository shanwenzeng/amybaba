var util = require('../../utils/util.js');
var api = require('../../config/api.js');
const app = getApp()

Page({
    data: {
        cartGoods: [],
        cartTotal: {
            "goodsCount": 0,
            "goodsAmount": 0.00,
            "checkedGoodsCount": 0,
            "checkedGoodsAmount": 0.00,
            "userId_test": ''
        },
        isEditCart: false,
        checkedAllStatus: true,
        editCartList: [],
        isTouchMove: false,
        startX: 0, //开始坐标
        startY: 0,
        hasCartGoods: 0,
        totalMoney:'',
        totalAmount:'',
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
    },
    onLoad: function() {
    },
    onReady: function() {
        // 页面渲染完成
    },
    onShow: function() {
        // 页面显示
        this.getCartList();
        wx.removeStorageSync('categoryId');
    },
    onPullDownRefresh: function() {
        wx.showNavigationBarLoading()
        this.getCartList();
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
    },
    onHide: function() {
        // 页面隐藏
    },
    onUnload: function() {
        // 页面关闭
    },
    toIndexPage: function() {
        wx.switchTab({
            url: '/pages/index/index',
        });
    },
    //加载购物车数据
    getCartList: function() {
        let that = this;
        let openId=wx.getStorageSync('openId');
        util.request(api.GetCartList,{customer:{id:openId}}).then(function(res) {
            if (res.data.length > 0) {
                let hasCartGoods = res.data.length;
                if (hasCartGoods.length != 0) {
                    hasCartGoods = 1;
                } else {
                    hasCartGoods = 0;
                }
                let totalAmount=0;//购物车总数量
                let totalMoney=0;//总金额
                for(let i=0;i<res.data.length;i++){
                    if(res.data[i].checked=="1"){
                        totalAmount=parseInt(totalAmount)+parseInt(res.data[i].amount);
                        totalMoney=totalMoney+parseFloat(res.data[i].amount)*parseFloat(res.data[i].price)
                    }
                }
                that.setData({
                    cartGoods: res.data,
                    cartTotal: res.data.length,
                    hasCartGoods: hasCartGoods,
                    totalAmount:totalAmount,
                    totalMoney:totalMoney
                });

                //设置导航栏中购物车中的总数量
                // wx.setTabBarBadge({
                //     index: 2,//2代表第3个导航
                //     text: totalAmount.toString()//导航栏中的文本
                // })

            }
            that.setData({
                checkedAllStatus: that.isCheckedAll()
            });
        });
    },
    isCheckedAll: function() {
        //判断购物车商品已全选
        return this.data.cartGoods.every(function(element, index, array) {
            if (element.checked == true) {
                return true;
            } else {
                return false;
            }
        });
    },
    getCheckedGoodsCount: function() {
        let checkedGoodsCount = 0;
        let checkedGoodsAmount = 0;

        this.data.cartGoods.forEach(function(v) {
            if (v.checked == true) {
                checkedGoodsCount += v.number;
                checkedGoodsAmount += v.number * v.retail_price
            }
        });
        this.setData({
            'cartTotal.checkedGoodsCount': checkedGoodsCount,
            'cartTotal.checkedGoodsAmount': checkedGoodsAmount,
        });
    },
    //全选与反选
    checkedAll: function() {
        let cartGoods=this.data.cartGoods;
        let totalAmount=0;//购物车总数量
        let totalMoney=0;//总金额
        for (let i = 0; i < cartGoods.length; i++) {
            if(this.data.checkedAllStatus==true){
                cartGoods[i].checked=0;   
            }else{
                cartGoods[i].checked=1;   
                totalAmount=parseInt(totalAmount)+parseInt(cartGoods[i].amount);
                totalMoney=totalMoney+parseFloat(cartGoods[i].amount)*parseFloat(cartGoods[i].price)
            }         
        }
        this.setData({
            cartGoods:cartGoods,
            checkedAllStatus:!this.data.checkedAllStatus,
            totalAmount:totalAmount,
            totalMoney:totalMoney
        });
    },
    //修改数量
    updateCart: function(itemIndex, amount,id) {
        let that = this;
        util.request(api.Editshoppingcart, {
            id:id,
            amount: amount,
        }).then(function(res) {
            if (res.code > 0) {
               that.getCartList();//修改数量成功后，重新加载数据
            } else {
                util.showErrorToast('库存不足了')
            }
            that.setData({
                checkedAllStatus: that.isCheckedAll()
            });
        });

    },
    //减少选中的商品数量
    cutNumber: function(event) {
        
        let itemIndex = event.target.dataset.itemIndex;
        let cartItem = this.data.cartGoods[itemIndex];
        if (cartItem.amount - 1 == 0) {
            util.showErrorToast('删除左滑试试')
        }
        let amount = (cartItem.amount - 1 > 1) ? cartItem.amount - 1 : 1;
        this.updateCart(itemIndex, amount, cartItem.id);
        
    },
    //增加选中的商品数量
    addNumber: function(event) {
        let itemIndex = event.target.dataset.itemIndex;
        let cartItem = this.data.cartGoods[itemIndex];
        // console.log(cartItem)
        let amount = Number(cartItem.amount) + 1;
        this.updateCart(itemIndex, amount, cartItem.id);
    },
    checkoutOrder: function() {
        //获取已选择的商品
        util.loginNow();
        let that = this;
        var checkedGoods = this.data.cartGoods.filter(function(element, index, array) {
            if (element.checked == true) {
                return true;
            } else {
                return false;
            }
        });
        if (checkedGoods.length <= 0) {
            util.showErrorToast('你好像没选中商品');
            return false;
        }
        wx.setStorageSync('checkedGoodsList', checkedGoods);//将选中的商品传到订单页面
        
        wx.navigateTo({
            url: '/pages/order-check/index?addtype=0'
        })
    },
    selectTap: function(e) {
        const index = e.currentTarget.dataset.index;
        const list = this.data.goodsList.list;
        if (index !== '' && index != null) {
            list[parseInt(index, 10)].active = !list[parseInt(index, 10)].active;
            this.setGoodsList(this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list);
        }
    },
    //单个选中商品
    checkedItem: function(e) {
        let itemIndex = e.currentTarget.dataset.itemIndex;
        let that = this;
        let checked;
        if(that.data.cartGoods[itemIndex].checked == 0){
            checked = 1; 
        }else{
            checked = 0;
        }
        if (!this.data.isEditCart) {
            util.request(api.Editshoppingcart, {
                id: that.data.cartGoods[itemIndex].id,
                checked: checked
            }).then(function(res) {
                if (res.code > 0) {
                    that.getCartList();//选择商品后，重新加载数据
                }
                that.setData({
                    checkedAllStatus: that.isCheckedAll()
                });
            });
        } else {
            //编辑状态
            let tmpCartData = this.data.cartGoods.map(function(element, index, array) {
                if (index == itemIndex) {
                    element.checked = !element.checked;
                }

                return element;
            });
            this.getCheckedGoodsCount();
            that.setData({
                cartGoods: tmpCartData,
                checkedAllStatus: that.isCheckedAll(),
                // 'cartTotal.checkedGoodsCount': that.getCheckedGoodsCount()
            });
        }
    },
    handleTap: function(event) { //阻止冒泡 

    },
    touchstart: function(e) {
        //开始触摸时 重置所有删除
        this.data.cartGoods.forEach(function(v, i) {
            if (v.isTouchMove) //只操作为true的
                v.isTouchMove = false;
        })
        this.setData({
            startX: e.changedTouches[0].clientX,
            startY: e.changedTouches[0].clientY,
            cartGoods: this.data.cartGoods
        })
    },
    //滑动事件处理
    touchmove: function(e) {
        var that = this,
            index = e.currentTarget.dataset.index, //当前索引
            startX = that.data.startX, //开始X坐标
            startY = that.data.startY, //开始Y坐标
            touchMoveX = e.changedTouches[0].clientX, //滑动变化坐标
            touchMoveY = e.changedTouches[0].clientY, //滑动变化坐标
            //获取滑动角度
            angle = that.angle({
                X: startX,
                Y: startY
            }, {
                X: touchMoveX,
                Y: touchMoveY
            });
        that.data.cartGoods.forEach(function(v, i) {
            v.isTouchMove = false
            //滑动超过30度角 return
            if (Math.abs(angle) > 30) return;
            if (i == index) {
                if (touchMoveX > startX) //右滑
                    v.isTouchMove = false
                else //左滑
                    v.isTouchMove = true
            }
        })
        //更新数据
        that.setData({
            cartGoods: that.data.cartGoods
        })
    },
    /**
     * 计算滑动角度
     * @param {Object} start 起点坐标
     * @param {Object} end 终点坐标
     */
    angle: function(start, end) {
        var _X = end.X - start.X,
            _Y = end.Y - start.Y
        //返回角度 /Math.atan()返回数字的反正切值
        return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
    },
    //删除购物车中的端口
    deleteGoods: function(e) {
        //获取已选择的商品
        let itemIndex = e.currentTarget.dataset.itemIndex;
        let productId = this.data.cartGoods[itemIndex].id;
        let that = this;
        util.request(api.deleteShoppingcart, {id: productId}).then(function(res) {
            if (res > 0) {
                that.getCartList();//删除成功，重新加载数据
            }
            that.setData({
                checkedAllStatus: that.isCheckedAll()
            });
        });

    }
})