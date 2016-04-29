var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var timer = require("../utility/time")();
var promise = require('promise');
var redisClient = require('../utility/redis')();
var nodeModel = require('./node');
var httpRequest = require('../utility/request')();

exports.sort = sort;

function sort(info){
	return new promise(function(resolve, reject) {
		var ids = nodeModel.getIdPath(info);
		// 根据ids排序
		var promises = ids.map(function(d){
			if(d && d.sort){
				return baseSort(d);
			}
		});

		promise.all(promises).then(function(result){
			// 删除缓存
			var key = "base_list";
			redisClient.delete(key);
			return resolve(true);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function baseSort(data){
	return new promise(function(resolve, reject) {
		var time = new Date();
		var sql = "update base set sort=@sort, update_at=@time, opreator=@opreator where id=@id";
		var params = {'sort': data.sort, 'id': data.id, 'update_at': time, 'opreator': data.opreator};
		sqlHelper.ExecuteNoQuery("knowledge", sql, params, function(err, count){
			if(err){
				return reject(err);
			}
			else{
				return resolve(count);
			}
		});
	});
}

exports.release = function(baseId, opreator){
	//获取专家数，收录内容数
	var data = [];
	return new promise(function(resolve, reject) {
		number(baseId, data).then(function(results){
			if(results[0] == 0 || results[2] == 0){
				return false;
			}
			else{
				// 知识库发布
				return baseRelease(baseId, opreator);
			}
		}).then(function(data){
			if(data){
				var key = 'tree_user_' + baseId;
				redisClient.delete(key);
				key = "base_list";
				redisClient.delete(key);
				// 调用接口发送通知
				return sendNotify(baseId);
			}
			else {
				return data;
			}
		}).then(function(status){
			return resolve(status);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function sendNotify(baseId){
	return new promise(function(resolve, reject) {
		var settings = require('../conf/appconfig').toLib;
		var url = settings.lib+'/api/release/notify'+"?base_id="+baseId;
        var token = settings.token;
        var params = {};
        httpRequest.getData(url, 'GET', params, token, function(dberr) {
            return reject(dberr);
        },function(body){
            var result = JSON.parse(body);
            if(result.err > 0){
                return reject(result.msg);
            }
            else{
                return resolve(true);
            }
        });
	});
}

function baseRelease(baseId, opreator){
	return new promise(function(resolve, reject) {
		var time = new Date();
		var sql = "update base set status=@status, opreator=@opreator, update_at=@time where id=@baseId";
		var params = {'baseId': baseId, 'status': 1, 'opreator': opreator, 'time': time};
		sqlHelper.ExecuteNoQuery("knowledge", sql, params, function(err, data){
			if(err){
				return reject(err);
			}
			else{
				if(data){
					return resolve(true);
				}
				else{
					return resolve(false);
				}
			}
		});
	});
}

exports.save = function(baseInfo, opreator){
	var baseId = parseInt(baseInfo.id);
	var name = baseInfo.name;
	var desc = baseInfo.description;
	var color = baseInfo.color;
	var hover = baseInfo.hover;
	var logo = baseInfo.image_url;
	var structure = baseInfo.structure_url;
	var background = baseInfo.background_url;
	var time = new Date();

	return new promise(function(resolve, reject) {
		if(baseId){
			// update
			var sql = "update base set name=@name,description=@desc,color=@color,hover=@hover,image_url=@logo,structure_url=@structure,background=@background,opreator=@opreator,update_at=@time where id=@baseId";
			var params = {
				'baseId':baseId, 
				'name':name, 
				'desc':desc,
				'color': color,
				'hover': hover, 
				'logo':logo, 
				'structure':structure, 
				'background': background,
				'opreator':opreator, 
				'time':time
			};			
		}
		else {
			// insert
			var sql = "insert into base (name,description,color,hover,image_url,structure_url,background,create_at,opreator) values (@name,@desc,@color,@hover,@logo,@structure,@background,@time,@opreator)";
			var params = {
				'name':name, 
				'desc':desc,
				'color': color,
				'hover': hover, 
				'logo':logo, 
				'structure':structure,
				'background': background, 
				'opreator':opreator, 
				'time':time
			};
		}
		sqlHelper.ExecuteNoQuery("knowledge", sql, params, function(err, count){
			if(err){
				return reject(err);
			}
			else {
				if(baseId){
					var key = 'tree_user_' + baseId;
					redisClient.delete(key);
					key = 'tree_expert_' + baseId;
					redisClient.delete(key);
					key = "base_list";
					redisClient.delete(key);
				}
				return resolve(count);
			}
		});
	});
}

exports.info =  function(baseId){
	var sql = "select * from base where id=@baseId";
	var params = {'baseId': baseId};
	return new promise(function(resolve, reject) {
		sqlHelper.ExecuteDataRow("knowledge", sql, params, function(err, info){
			if(err){
				return reject(err);
			}
			else{
				return resolve(info);
			}
		});
	});
}

exports.list = function(page,pagesize){
	var info;
	return new promise(function(resolve, reject) {
		// 获取知识库列表
		baseList(page, pagesize).then(function(result){
			info = result;
			return count(info.data); // 查询专家 订阅和收录数
		}).catch(function(err){
			return reject(err);
		}).then(function(count){
			var results = info.data;
			// 内容处理
			for(var i=0; i<results.length; i++){
				results[i].create_at = timer.jsDateTimeToStr(results[i].create_at);
				results[i].name += '知识库';
				results[i].expert = count[i][0];
				results[i].sub = count[i][1];
				results[i].content = count[i][2];
			}
			info.data = results;
			return resolve(info);
		}).catch(function(err){
			return reject(err);
		});
	});
}

// 知识库分页列表
function baseList(page,pagesize){
	return new promise(function(resolve, reject) {
		var sql = "select * from base order by sort asc";
		var params = {};
		sqlHelper.ExecuteDataByPage("knowledge", sql, params, page, pagesize, function(err, data, count){
			if(err){
				return reject(err);
			}
			else{
				return resolve({data: data, count: count});
			}
		});
	});
}

exports.allBaseList = function(){
	var sql = "select * from base order by sort asc";
	var params = [];
	return new promise(function(resolve, reject) {
		sqlHelper.ExecuteDataTable("knowledge", sql, params, function(err, data){
			if(err){
				return reject(err);
			}
			else{
				return resolve({data:data});
			}
		});
	});
}

exports.getAll = function (callback) {
    var sql = "select * from base order by sort asc";
    var params = {};
    sqlHelper.ExecuteDataTable("knowledge", sql, params, callback);
}


function count (list) {
    var promises = list.map(function (data) {
        var baseId = data.id;
        return number(baseId, data); // 获取专家数，订阅数和收录内容数
    });
    return new promise.all(promises);
}

function number(baseId) {
    return new promise(function (resolve, reject) {
        var sql = "select count(*) as count from expert where base_id=@baseId and status=@status; select count(*) as count from subscription where status=@status and id_path like @idPath; select count(*) as count from expert_confirm_content where base_id=@baseId and status=@status";
        var params = {'status': 1, 'idPath': baseId + '-%', 'baseId': baseId};
        sqlHelper.ExecuteDataSet("knowledge", sql, params, function (err, result) {
            if (err) {
                return reject(err);
            }
            else {
                var count = [];
                for (var k in result) {
                    count.push(result[k][0].count);
                }
                return resolve(count);
            }
        });
    });
}

exports.getListByIds=function(bases_ids_str){
	return new promise(function(resolve,reject){
		if(bases_ids_str.length){
			var sql="select id,name from base where id in("+bases_ids_str+")";
			var params={};
			sqlHelper.ExecuteDataTable("knowledge", sql, params,function(err,bases){
				if(err){
					return reject(err);
				}
				else
				{
					return resolve(bases);
				}
			});
		}
		else{
			return resolve([]);
		}
	})
}
