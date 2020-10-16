// const ApiRootUrl = 'http://localhost:8360/api/';
const ApiRootUrl = 'https://www.hiolabs.com/api/';
const ApiRootUrlTwo = 'http://localhost:8081/jxambb/';
// const ApiRootUrlTwo = 'https://yfk.qrzyyn.com/jxambb/';

module.exports = {
    // 登录
    AuthLoginByWeixin: ApiRootUrl + 'auth/loginByWeixin', //微信登录
    // 首页
    IndexUrl: ApiRootUrl + 'index/appInfo', //首页数据接口
    GoodsCarouselUrl: ApiRootUrlTwo + 'goodscarousel/findGoodsCarousel', //商品轮播
    recommendGoods:ApiRootUrlTwo + 'category/find',//推荐好物
    RecommendShops:ApiRootUrlTwo + 'shop/findRecommendShop',//推荐商家（前10条）
    Advert:ApiRootUrlTwo + 'advert/findAdvert',//广告（前5条）
    // 分类
    // CatalogList: ApiRootUrl + 'catalog/index', //分类目录全部分类数据接口
    CatalogList: ApiRootUrlTwo + 'dictionary/fastFind', //分类目录全部分类数据接口
    ProductCatalog: ApiRootUrlTwo + 'category/find', //商家中的商品分类
    GetProduct: ApiRootUrlTwo + 'product/find', //商家中的商品信息
    FindProduct: ApiRootUrlTwo + 'product/findProduct', //根据商家id和分类进行商品查询
    findProductByKeyword: ApiRootUrlTwo + 'product/find', //根据商家id和分类进行商品查询
    CatalogCurrent: ApiRootUrl + 'catalog/current', //分类目录当前分类数据接口
    GetCurrentList: ApiRootUrl + 'catalog/currentlist',
    // 购物车
    CartAdd: ApiRootUrl + 'cart/add', // 添加商品到购物车
    CartList: ApiRootUrl + 'cart/index', //获取购物车的数据
    GetCartList: ApiRootUrlTwo + 'shoppingcart/find', //获取购物车的数据
    CartUpdate: ApiRootUrl + 'cart/update', // 更新购物车的商品
    deleteShoppingcart: ApiRootUrlTwo + 'shoppingcart/del', // 删除购物车的商品
    CartChecked: ApiRootUrl + 'cart/checked', // 选择或取消选择商品
    CartGoodsCount: ApiRootUrl + 'cart/goodsCount', // 获取购物车商品件数
    CartCheckout: ApiRootUrl + 'cart/checkout', // 下单前信息确认
    messageproduct: ApiRootUrlTwo + 'product/messageproduct', //商家
    Addshoppingcart: ApiRootUrlTwo + 'shoppingcart/add', //将商品加入购物车
    Editshoppingcart: ApiRootUrlTwo + 'shoppingcart/edit', // 更新购物车的商品
    batchEditshoppingcart: ApiRootUrlTwo + 'shoppingcart/batchEdit', //批量修改购物车
    //商家
    RecommendShop: ApiRootUrlTwo + 'shop/findRecommendShop',
    findShopBySale: ApiRootUrlTwo + 'shop/findShopBySale',//按销量查询商家，由高到底排序
    // 商品
    GoodsCount: ApiRootUrl + 'goods/count', //统计商品总数
    GoodsDetail: ApiRootUrl + 'goods/detail', //获得商品的详情
    GoodsList: ApiRootUrl + 'goods/list', //获得商品列表
    GoodsShare: ApiRootUrl + 'goods/goodsShare', //获得商品的详情
    SaveUserId: ApiRootUrl + 'goods/saveUserId',
    ProductCarousel: ApiRootUrlTwo + 'enclosure/findById', //产品轮播图
    addBrowserHistory: ApiRootUrlTwo + 'browserhistory/add',//添加浏览记录
    // 收货地址
    // AddressDetail: ApiRootUrl + 'address/addressDetail', //收货地址详情
    AddressDetail: ApiRootUrlTwo + 'address/getMe', //收货地址详情
    // DeleteAddress: ApiRootUrl + 'address/deleteAddress', //保存收货地址
    DeleteAddress: ApiRootUrlTwo + 'address/del', //保存收货地址
    // SaveAddress: ApiRootUrl + 'address/saveAddress', //保存收货地址
    SaveAddress: ApiRootUrlTwo + 'address/add',
    // GetAddresses: ApiRootUrl + 'address/getAddresses',
    GetAddresses: ApiRootUrlTwo + 'address/find',
    RegionList: ApiRootUrl + 'region/list', //获取区域列表
    PayPrepayId: ApiRootUrl + 'pay/preWeixinPay', //获取微信统一下单prepay_id
    OrderSubmit: ApiRootUrl + 'order/submit', // 提交订单
    OrderList: ApiRootUrlTwo + 'orderList/fastFind', //订单列表
    OrderDetail: ApiRootUrlTwo + 'orderDetail/findById', //订单详情
    OrderDelete: ApiRootUrl + 'order/delete', //订单删除
    OrderCancel: ApiRootUrl + 'order/cancel', //取消订单
    OrderConfirm: ApiRootUrl + 'order/confirm', //物流详情
    OrderCount: ApiRootUrl + 'order/count', // 获取订单数
    OrderCountInfo: ApiRootUrl + 'order/orderCount', // 我的页面获取订单数状态
    OrderExpressInfo: ApiRootUrl + 'order/express', //物流信息
    OrderGoods: ApiRootUrl + 'order/orderGoods', // 获取checkout页面的商品列表
    // 足迹
    // FootprintList: ApiRootUrl + 'footprint/list', //足迹列表
    BrowserHistory: ApiRootUrlTwo + 'browserhistory/find', //足迹列表
    FootprintDelete: ApiRootUrl + 'footprint/delete', //删除足迹
    deletetBrowserHistory: ApiRootUrlTwo + 'browserhistory/del', //删除足迹
    browserHistoryIsExist: ApiRootUrlTwo + 'browserhistory/isExist', //删除足迹
    // 搜索
    // SearchIndex: ApiRootUrl + 'search/index', //搜索页面数据
    findSearchHistory: ApiRootUrlTwo + 'searchhistory/find', //搜索页面数据
    addSearchHistory: ApiRootUrlTwo + 'searchhistory/add', //保存搜索记录
    deleteSearchHistory: ApiRootUrlTwo + 'searchhistory/batchDel', //删除搜索记录
    SearchHelper: ApiRootUrl + 'search/helper', //搜索帮助
    SearchClearHistory: ApiRootUrl + 'search/clearHistory', //搜索帮助
    ShowSettings: ApiRootUrl + 'settings/showSettings',
    SaveSettings: ApiRootUrl + 'settings/save',
    addSettings: ApiRootUrlTwo + 'consumer/add',
    editSettings: ApiRootUrlTwo + 'consumer/edit',
    isExist: ApiRootUrlTwo + 'consumer/isExist',
    SettingsDetail: ApiRootUrl + 'settings/userDetail',
    GetBase64: ApiRootUrl + 'qrcode/getBase64', //获取商品详情二维码
    //我的
    FindCustomer: ApiRootUrlTwo + 'consumer/getMe',//查找消费者
    //获取openId
    GetOpenId: ApiRootUrlTwo + 'consumer/getOpenId',//获取用户的openId

};