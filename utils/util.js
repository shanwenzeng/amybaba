var api = require('../config/api.js');
// 引入SDK核心类(腾讯位置)
var QQMapWX = require('../lib/qqmap/qqmap-wx-jssdk.js');
function formatTime(date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()

    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
/*************************************************
 * 将数值型的日期转换成长日期格式，
 * 例如：1495977369000；YYYY-MM-DD  hh:mm:ss,并解决时间相差8小时的问题
 * 返回：字符串值
 *************************************************/
Date.prototype.getLongDate=function(value){
    if(value!=undefined) {
        var d=new Date(value);
        return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getUTCDate()+" "+(d.getUTCHours())+":"+d.getUTCMinutes()+":"+d.getUTCSeconds();
    }else{
        return "";
    }
};
const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : '0' + n
}

function formatTimeNum(number, format) {

    var formateArr = ['Y', 'M', 'D', 'h', 'm', 's'];
    var returnArr = [];

    var date = new Date(number * 1000);
    returnArr.push(date.getFullYear());
    returnArr.push(formatNumber(date.getMonth() + 1));
    returnArr.push(formatNumber(date.getDate()));

    returnArr.push(formatNumber(date.getHours()));
    returnArr.push(formatNumber(date.getMinutes()));
    returnArr.push(formatNumber(date.getSeconds()));

    for (var i in returnArr) {
        format = format.replace(formateArr[i], returnArr[i]);
    }
    return format;
}
//获得日期字符串
function getDateString()  {   
    let d = new Date();
    let dateString = d.getFullYear() + "" +(d.getMonth()+1) + "" + d.getDate() + "" + d.getHours() + "" + d.getMinutes() + "" + d.getSeconds()+""+d.getMilliseconds()+""+ Math.floor(Math.random()*10000);
    return dateString;   
}
function testPhone(num) {
    var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1})|(16[0-9]{1})|(19[0-9]{1}))+\d{8})$/;
    if (num==undefined || num.length == 0) {
        wx.showToast({
            title: '手机号为空',
            image: '/images/icon/icon_error.png',
        })
        return false;
    } else if (num.length < 11) {
        wx.showToast({
            title: '手机号长度有误！',
            image: '/images/icon/icon_error.png',
        })
        return false;
    } else if (!myreg.test(num)) {
        wx.showToast({
            title: '手机号有误！',
            image: '/images/icon/icon_error.png',
        })
        return false;
    } else {
        return true;
    }
}

/**
 * 封封微信的的request
 */
function request(url, data = {}, method = "POST") {
    return new Promise(function(resolve, reject) {
        wx.request({
            url: url,
            data: data,
            method: method,
            header: {
                'Content-Type': 'application/json',
                'X-Nideshop-Token': wx.getStorageSync('token')
            },
            success: function(res) {
                if (res.statusCode == 200) {

                    if (res.data.errno == 401) {
                        //需要登录后才可以操作

                        let code = null;
                        return login().then((res) => {
                            code = res.code;
                            return getUserInfo();
                        }).then((userInfo) => {
                            //登录远程服务器
                            request(api.AuthLoginByWeixin, {
                                code: code,
                                userInfo: userInfo
                            }, 'POST').then(res => {
                                if (res.errno === 0) {
                                    //存储用户信息
                                    wx.setStorageSync('userInfo', res.data.userInfo);
                                    wx.setStorageSync('token', res.data.token);
                                    resolve(res);
                                } else {
                                    reject(res);
                                }
                            }).catch((err) => {
                                reject(err);
                            });
                        }).catch((err) => {
                            reject(err);
                        })
                    } else {
                        resolve(res.data);
                    }
                } else {
                    reject(res.errMsg);
                }

            },
            fail: function(err) {
                reject(err)
            }
        })
    });
}

/**
 * 检查微信会话是否过期
 */
function checkSession() {
    return new Promise(function(resolve, reject) {
        wx.checkSession({
            success: function() {
                resolve(true);
            },
            fail: function() {
                reject(false);
            }
        })
    });
}

/**
 * 调用微信登录
 */
function login() {
    return new Promise(function(resolve, reject) {
        wx.login({
            success: function(res) {
                if (res.code) {
                    //登录远程服务器
                    resolve(res);
                } else {
                    reject(res);
                }
            },
            fail: function(err) {
                reject(err);
            }
        });
    });
}

function getUserInfo() {
    return new Promise(function(resolve, reject) {
        wx.getUserInfo({
            withCredentials: true,
            success: function(res) {
                resolve(res);
            },
            fail: function(err) {
                reject(err);
            }
        })
    });
}

function redirect(url) {

    //判断页面是否需要登录
    if (false) {
        wx.redirectTo({
            url: '/pages/auth/login/login'
        });
        return false;
    } else {
        wx.redirectTo({
            url: url
        });
    }
}

function showErrorToast(msg) {
    wx.showToast({
        title: msg,
        icon: 'none',
    })
}

function showSuccessToast(msg) {
    wx.showToast({
        title: msg,
        icon: 'success',
    })
}

function sentRes(url, data, method, fn) {
    data = data || null;
    if (data == null) {
        var content = require('querystring').stringify(data);
    } else {
        var content = JSON.stringify(data); //json format
    }

    var parse_u = require('url').parse(url, true);
    var isHttp = parse_u.protocol == 'http:';
    var options = {
        host: parse_u.hostname,
        port: parse_u.port || (isHttp ? 80 : 443),
        path: parse_u.path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(content, "utf8"),
            'Trackingmore-Api-Key': '1b70c67e-d191-4301-9c05-a50436a2526d'
        }
    };
    var req = require(isHttp ? 'http' : 'https').request(options, function(res) {
        var _data = '';
        res.on('data', function(chunk) {
            _data += chunk;
        });
        res.on('end', function() {
            fn != undefined && fn(_data);
        });
    });
    req.write(content);
    req.end();
}

function loginNow() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo == '') {
        wx.navigateTo({
            url: '/pages/app-auth/index',
        });
        return false;
    } else {
        return true;
    }
}

function getTextLength(str, full) {
    let len = 0;
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        //单字节加1 
        if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
            len++;
        } else {
            len += (full ? 2 : 1);
        }
    }
    return len;
}

/**
 * rgba(255, 255, 255, 1) => #ffffff
 * @param {String} color 
 */
function transferColor(color = '') {
    let res = '#';
    color = color.replace(/^rgba?\(/, '').replace(/\)$/, '');
    color = color.split(', ');

    color.length > 3 ? color.length = 3 : '';
    for (let item of color) {
        item = parseInt(item || 0);
        if (item < 10) {
            res += ('0' + item)
        } else {
            res += (item.toString(16))
        }
    }

    return res;
}

function transferBorder(border = '') {
    let res = border.match(/(\w+)px\s(\w+)\s(.*)/);
    let obj = {};

    if (res) {
        obj = {
            width: +res[1],
            style: res[2],
            color: res[3]
        }
    }

    return res ? obj : null;
}


/**
 * 内边距，依次为上右下左
 * @param {*} padding 
 */
function transferPadding(padding = '0 0 0 0') {
    padding = padding.split(' ');
    for (let i = 0, len = padding.length; i < len; i++) {
        padding[i] = +padding[i].replace('px', '');
    }

    return padding;
}
/**
 * type1: 0, 25, 17, rgba(0, 0, 0, 0.3)
 * type2: rgba(0, 0, 0, 0.3) 0px 25px 17px 0px => (0, 25, 17, rgba(0, 0, 0, 0.3))
 * @param {*} shadow 
 */
function transferBoxShadow(shadow = '', type) {
    if (!shadow || shadow === 'none') return;
    let color;
    let split;

    split = shadow.match(/(\w+)\s(\w+)\s(\w+)\s(rgb.*)/);

    if (split) {
        split.shift();
        shadow = split;
        color = split[3] || '#ffffff';
    } else {
        split = shadow.split(') ');
        color = split[0] + ')'
        shadow = split[1].split('px ');
    }

    return {
        offsetX: +shadow[0] || 0,
        offsetY: +shadow[1] || 0,
        blur: +shadow[2] || 0,
        color
    }
}

function getUid(prefix) {
    prefix = prefix || '';

    return (
        prefix +
        'xxyxxyxx'.replace(/[xy]/g, c => {
            let r = (Math.random() * 16) | 0;
            let v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        })
    );
}  
 //利用腾讯地图的位置服务,有使用次数上的限制，每天只能用1万次，当然可以再去买配额
function findDistance(lat,long,callback){
       //拿到商家的地理位置，用到了腾讯地图的api
    // 实例化API核心类
    var _that = this
    var demo = new QQMapWX({
        key: 'AUFBZ-PBMW3-L343G-YPN7H-NXVK7-QKB6C' // 必填，腾讯位置服务中的key
    });
    // 调用接口
    demo.calculateDistance({
        to: [{
            latitude: lat, //商家的纬度
            longitude: long, //商家的经度
        }],
        success: function(res) {
            let hw = res.result.elements[0].distance //拿到距离(米)
            if (hw && hw !== -1) { //拿到正确的值
                //转换成公里
                hw = (hw / 2 / 500).toFixed(2)
            } else {
                hw = "距离太近或请刷新重试"
            }
            callback(hw);
        }
    });
}
// 获取位置,得用腾讯地图
function getLocation(callback){
    var that = this
    wx.getLocation({
        type: 'wgs84', // 默认为 wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
        success: function (res) {
            var qqmapsdk = new QQMapWX({
            key: 'AUFBZ-PBMW3-L343G-YPN7H-NXVK7-QKB6C' // 必填
            });
            qqmapsdk.reverseGeocoder({
            // location: {
            //     latitude: that.data.latitude,
            //     longitude: that.data.longitude
            // },
            success: function (res) {
                //  console.log(res)
                // console.log("获取地址成功：" + res.result.ad_info.city);
                callback(res);//回调函数
            },
            fail: function (res) {
                console.log("获取地址失败" + res);
            },
            complete: function (res) {
                // console.log(res);
            }
            });
        }
    })
}
function findXy(lati,long,callback) { //获取用户的经纬度
    var that = this;
        wx.getLocation({
        type: 'wgs84',
        success(res) {
            let distance= getDistance(res.latitude, res.longitude,lati,long)
            callback(distance);//回调函数
        }
        })
    }
//计算距离
/**
 * @creator swz
 * @data 2020/10/07
 * @desc 由经纬度计算两点之间的距离，la为latitude缩写，lo为longitude
 * @param la1 第一个坐标点的纬度
 * @param lo1 第一个坐标点的经度
 * @param la2 第二个坐标点的纬度
 * @param lo2 第二个坐标点的经度
 * @return (int)s   返回距离(单位千米或公里)
 * @tips 注意经度和纬度参数别传反了，一般经度为0~180、纬度为0~90
 * 具体算法不做解释，有兴趣可以了解一下球面两点之间最短距离的计算方式
 */
function getDistance(la1, lo1, la2, lo2) {
var La1 = la1 * Math.PI / 180.0;
var La2 = la2 * Math.PI / 180.0;
var La3 = La1 - La2;
var Lb3 = lo1 * Math.PI / 180.0 - lo2 * Math.PI / 180.0;
var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(La3 / 2), 2) + Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)));
s = s * 6378.137;
s = Math.round(s * 10000) / 10000;
s = s.toFixed(2);
return s;
}
//传递一个数组，返回一个按距离由近到排序的新数组
function computeDistance(arr,callback){
    for (let i = 0; i < arr.length; i++) {
        findXy(arr[i].latitude,arr[i].longitude,function(dis){
            arr[i].distance=dis;
            if((i+1)==arr.length){//最后一次循环，进行冒泡排序
                //冒泡排序法，按距离从近到远排序
                for(let index = arr.length-1;index>0;index--){
                    for(let j=0;j<index;j++){
                        if(parseFloat(arr[j].distance)>parseFloat(arr[j+1].distance)){
                            var temp = arr[j];
                            arr.splice(j,1,arr[j+1]);
                            arr.splice(j+1,1,temp);
                        }
                    }
                }
                //将10千米之内的商家放入新数绷
                let array=new Array();
                for(let i=0;i<arr.length;i++){
                    if(arr[i].distance<10){
                        array.push(arr[i]);
                    }else{
                        break;
                    }
                }
               callback(array);//回调函数，参数为排好序的数组（由近到远，10千米之内）
            }
        });
    }
}
module.exports = {
    formatTime: formatTime,
    formatTimeNum: formatTimeNum,
    request,
    redirect,
    showErrorToast,
    showSuccessToast,
    checkSession,
    login,
    getUserInfo,
    testPhone,
    sentRes,
    loginNow,
    getTextLength,
    transferBorder,
    transferColor,
    transferPadding,
    transferBoxShadow,
    getUid,
    findDistance,
    getLocation,
    findXy,
    getDistance,
    getDateString,
    computeDistance
}