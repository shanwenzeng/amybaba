var util = require('../../utils/util.js');
var api = require('../../config/api.js');

var app = getApp()
Page({
    data: {
        keywrod: '',
        searchStatus: false,
        goodsList: [],
        helpKeyword: [],
        historyKeyword: [],
        categoryFilter: false,
        currentSortType: 'default',
        hotKeyword: [],
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
            this.getGoodsList(options.keyword);
        }
    },
  //保存搜索记录
  addSearchHistory:function(key){
    if(key==undefined || key.length==0)return false;
    let that = this;
    let openId = wx.getStorageSync('openId');
    if(openId==undefined || openId.length==0){//如果没有openId,不保存浏览足迹
        return false;
    }
    let obj={customer:{id:openId}, keyword: key,type:"2"};
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
        util.request(api.findSearchHistory,{customer:{id:wx.getStorageSync('openId')},type:"2"}).then(function (res) {
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
            goodsList: []
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
    //根据商家id和输入框输入信息查找商品,并且根据条件进行排序
    getGoodsList: function (keyword,shopId,orderCondition,orderType) {
        let that = this;
        util.request(api.FindProduct,{
            condition:keyword, 
            id:shopId,
            orderCondition: orderCondition,
            orderType: orderType
        }).then(function(res) {
            if (res.data.length > 0) {//查询到产品
                that.setData({
                    searchStatus: true,
                    goodsList: res.data,
                });
            }else{//没有查询到商品
                util.showErrorToast("没有查询到商品")
            }
            //重新获取关键词
            that.findSearchHistory();
        });
    },
    onKeywordTap: function (event) {
        this.getSearchResult(event.target.dataset.keyword);
        console.log(event.target.dataset.keyword)
    },
    getSearchResult(keyword) {
        this.setData({
            keyword: keyword,
            page: 1,
            categoryId: 0,
            goodsList: []
        });

        this.getGoodsList(keyword,wx.getStorageSync('shopId'));
    },
    openSortFilter: function (event) {
        let currentId = event.currentTarget.id;
        switch (currentId) {
            case 'salesSort':
                let _SortOrder = 'asc';
                if (this.data.salesSortOrder == 'asc') {
                    _SortOrder = 'desc';
                }
                this.setData({
                    'currentSortType': 'sales',
                    'currentSortOrder': 'asc',
                    'salesSortOrder': _SortOrder
                });
                this.getGoodsList(this.data.keyword,wx.getStorageSync('shopId'),'sell',_SortOrder);
                break;
            case 'priceSort':
                let tmpSortOrder = 'asc';
                if (this.data.currentSortOrder == 'asc') {
                    tmpSortOrder = 'desc';
                }
                this.setData({
                    'currentSortType': 'price',
                    'currentSortOrder': tmpSortOrder,
                    'salesSortOrder': 'asc'
                });
                this.getGoodsList(this.data.keyword,wx.getStorageSync('shopId'),'price',tmpSortOrder);
                break;
            default:
                //综合排序
                this.setData({
                    'currentSortType': 'default',
                    'currentSortOrder': 'desc',
                    'salesSortOrder': 'desc'
                });
                this.getGoodsList(this.data.keyword,wx.getStorageSync('shopId'));
        }
    },
    onKeywordConfirm(event) {
        this.getSearchResult(event.detail.value);
        this.addSearchHistory(event.detail.value);//保存搜索记录
    }
})