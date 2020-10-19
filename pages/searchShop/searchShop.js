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
        defaultKeyword: {},
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
            this.findShopByKeyword(options.keyword);
        }
    },
    //保存搜索记录
    addSearchHistory:function(key){
        if(key==undefined || key.length==0)return false;
        let that = this;
        util.request(api.addSearchHistory,{
            customer:{id:wx.getStorageSync('openId')},
            keyword:key
        }).then(function (res) {
            if(res.code<=0){
                console.log("保存搜索记录失败")
            }
        });
    },
    //查询搜索历史记录
    findSearchHistory() {
        let that = this;
        util.request(api.findSearchHistory).then(function (res) {
            if (res.data.length> 0) {
                let history=new Array();//历史记录
                let historyId=new Array();//历史记录的Id
                let hot=new Array();//热门记录
                let def=new Array();//默认记录
                for (let index = 0; index < res.data.length; index++) {
                   if(res.data[index].type=="热门搜索"){
                       hot.push(res.data[index].keyword)
                   }else if(res.data[index].type=="默认搜索"){
                    def.push(res.data[index].keyword)
                    }else{
                        history.push(res.data[index].keyword)
                        historyId.push(res.data[index].id)//保存历史记录id,用于执行删除
                    }
                 }
                that.setData({
                    historyKeyword:history,
                    defaultKeyword: def,
                    hotKeyword: hot,
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
                this.findShopByKeyword(wx.getStorageSync('keyword'),'distanceSort',distanceSortOrder);
                break;
            default:
                //综合排序
                this.setData({
                    'currentSortType': 'default',
                    'currentSortOrder': 'desc',
                    'salesSortOrder': 'desc'
                });
                this.findShopByKeyword(wx.getStorageSync('keyword'),compositeSort,'default');
        }
    },
    onKeywordConfirm(event) {
        this.getSearchResult(event.detail.value);
        this.addSearchHistory(event.detail.value);//保存搜索记录
    }
})