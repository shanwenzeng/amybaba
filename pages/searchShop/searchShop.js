var util = require('../../utils/util.js');
var api = require('../../config/api.js');

var app = getApp()
Page({
    data: {
        keywrod: '',
        searchStatus: false,
        shopList: [],
        helpKeyword: [],
        historyKeyword: [],
        categoryFilter: false,
        currentSortType: 'default',
        filterCategory: [],
        currentSortOrder: 'desc',
        salesSortOrder:'desc',
        categoryId: 0,
        historyId:[],
        ApiRootUrl:app.globalData.ApiRootUrl,//项目根目录
    },
    //事件处理函数
    closeSearch: function () {
        wx.navigateBack()
    },
    clearKeyword: function () {
        this.setData({
            keyword: '', 
            searchStatus: false
        });
    },
    onLoad: function (options) {
        this.findSearchHistory();//查询搜索历史记录
        //从首页中的商品分类进入
        if(options.keyword!=undefined && options.keyword.length>0){
            this.findShopByKeyword(options.keyword);
        }
    },
      //保存搜索记录
  addSearchHistory:function(key){
    if(key==undefined || key.length==0)return false;
    let openId = wx.getStorageSync('openId');
    if(openId==undefined || openId.length==0){//如果没有openId,不保存浏览足迹
        return false;
    }
    let obj={customer:{id:openId}, keyword: key,type:"1"};
      //判断是否存在
      util.request(api.searchHistoryIsExist,obj).then(function(res){
        if(res.code <=0){//不存在，保存浏览记录
            util.request(api.addSearchHistory,obj).then(function(res){
                if(res.code <=0){
                    console.log("保存搜索记录失败")
                }
            })
        }
        else{
            return false;
        }
    });
},

    //查询搜索历史记录
    findSearchHistory() {
        let that = this;
        util.request(api.findSearchHistory,{customer:{id:wx.getStorageSync('openId')},type:"1"}).then(function (res) {
            if (res.data.length> 0) {
                let history=new Array();//历史记录
                let historyId=new Array();//历史记录的Id
                for (let index = 0; index < res.data.length; index++) {
                    history.push(res.data[index].keyword)
                    historyId.push(res.data[index].id)//保存历史记录id,用于执行删除
                 }
                that.setData({
                    historyKeyword:history,
                    historyId:historyId
                });
            }
        });
    },
    //文本框输入时，保存搜索关键字到keyword中
    inputChange: function (e) {
        this.setData({
            keyword: e.detail.value,
            searchStatus: false
        });
        this.getHelpKeyword();
    },
    getHelpKeyword: function () {
        let that = this;
        util.request(api.SearchHelper, { keyword: that.data.keyword }).then(function (res) {
            if (res.errno === 0) {
                that.setData({
                    helpKeyword: res.data
                });
            }
        });
    },
    inputFocus: function () {
        this.setData({
            searchStatus: false,
            shopList: []
        });

        if (this.data.keyword) {
            this.getHelpKeyword();
        }
    },
    //清除搜索历史记录
    clearHistory: function () {
        util.request(api.deleteSearchHistory,this.data.historyId).then(function(res){
            if(res<=0){
                console.log("搜索历史记录删除失败")
            }
        });
        this.setData({
            keyword: '', 
            historyKeyword:[],
            historyId:[],
            searchStatus: false
        });
    },
    findShopByKeyword: function (keyword,orderCondition,orderType) {
        let that = this;
        util.request(api.findShopByKeyword,{condition:keyword,orderCondition:orderCondition,orderType:orderType}).then(function(res) {
            if (res.data.length > 0) {//查询到产品
                that.setData({
                    searchStatus: true,
                    shopList: res.data,
                });
            }else{//没有查询到商品
                util.showErrorToast("没有查询到商品")
            }
            //重新获取关键词
            that.findSearchHistory();
        });
    },
    //点击搜索历史时执行
    onKeywordTap: function (event) {
        this.getSearchResult(event.target.dataset.keyword);
    },
    getSearchResult(keyword) {
        this.setData({
            keyword: keyword,
            page: 1,
            categoryId: 0,
            shopList: []
        });
        wx.setStorageSync('keyword', keyword);//保存查询关键字到缓存中，方便分类查询时使用
        this.findShopByKeyword(keyword);
    },
    openSortFilter: function (event) {
        let currentId = event.currentTarget.id;
        switch (currentId) {
            case 'highOpinionSort'://好评排序
                let highOpinionOrder = 'asc';
                if (this.data.salesSortOrder == 'asc') {
                    highOpinionOrder = 'desc';
                }
                this.setData({
                    'currentSortType': 'highOpinion',
                    'currentSortOrder': 'asc',
                    'salesSortOrder': highOpinionOrder
                });
                this.findShopByKeyword(wx.getStorageSync('keyword'),'highOpinionOrder',highOpinionOrder);
                break;
            case 'distanceSort'://按距离排序
                let distanceSortOrder = 'asc';
                if (this.data.currentSortOrder == 'asc') {
                    distanceSortOrder = 'desc';
                }
                this.setData({
                    'currentSortType': 'distance',
                    'currentSortOrder': distanceSortOrder,
                    'salesSortOrder': 'asc'
                });
                // this.findShopByKeyword(wx.getStorageSync('keyword'),'distanceSort',distanceSortOrder);
                this.distanceSort();
                break;
            default:
                //综合排序
                this.setData({
                    'currentSortType': 'default',
                    'currentSortOrder': 'desc',
                    'salesSortOrder': 'desc'
                });
                this.findShopByKeyword(wx.getStorageSync('keyword'),'compositeSort','default');
        }
    },
    onKeywordConfirm(event) {
        this.getSearchResult(event.detail.value);
        this.addSearchHistory(event.detail.value);//保存搜索记录
    },
    //根据距离排序
    distanceSort: function(){
        let that = this;
        //获取所查出来的商家
        let shopList = this.data.shopList;
        //获取是升序还是降序
        let currentSortOrder = this.data.currentSortOrder;
        //向数组中添加距离
        for(let i = 0; i < shopList.length; i++){
            //根据经纬度求出距离
            util.findXy(shopList[i].latitude,shopList[i].longitude,function(dis){
                shopList[i].distance = dis; //将每一项的距离加入各自的对象中
                if((i+1) == shopList.length){//最后一次循环，进行冒泡排序
                    //冒泡排序法，按距离从近到远排序（升序）
                    for(let index = shopList.length - 1; index > 0; index--){
                        for(let j = 0; j < index; j++){
                            if(parseFloat(shopList[j].distance)>parseFloat(shopList[j+1].distance)){
                                var temp = shopList[j];
                                shopList.splice(j,1,shopList[j+1]);
                                shopList.splice(j+1,1,temp);
                            }
                        }
                    }
                    if(currentSortOrder == 'asc'){ //如果是升序
                        shopList = shopList;    
                    }else if(currentSortOrder == 'desc'){//如果是降序
                        //reverse() 方法将数组中元素的位置颠倒，并返回该数组。数组的第一个元素会变成最后一个，数组的最后一个元素变成第一个，该方法会改变原来的数组，而不会创建新的数组。
                        shopList = shopList.reverse();  
                    }
                    that.setData({
                        shopList: shopList
                    })
                }
            })
        }
    }
})