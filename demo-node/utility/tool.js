/*
 *  说明：获取客户端IP地址
 *  使用：
 *  initnode.request.getClientIp();
 */
exports.getClientIp = function (req) {
    var ipAddress;
    var forwardedIpsStr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if (forwardedIpsStr) {
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    return ipAddress;
};

/*
 * 判断参数正整数
 */
exports.confirmInt = function (data) {
    if(data){
        var typeStr = /^[0-9]*[1-9][0-9]*$/;
    	var re = new RegExp(typeStr);
    	var dataStr = data.toString();
    	if(dataStr.match(re) == null){
    		return false;
    	}
        else {
        	return true;
        }
    }else{
        return false;
    }
};

/*
 * 数组去重
 */
exports.unique = function(data){
    var arr = new Array();
    if(data.length){
        arr.push(data[0]);
        for(var i = 1; i < data.length; i++) //从第二项开始遍历
        {
            //如果当前数组的第i项在当前数组中第一次出现的位置不是i，
            //那么表示第i项是重复的，忽略掉。否则存入结果数组
            if (data.indexOf(data[i]) == i) arr.push(data[i]);
        }
    }
    return arr;
}
