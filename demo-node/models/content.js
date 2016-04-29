var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var redisClient = require('../utility/redis')();
var async = require('async');
var promise = require('promise');
var expertKnowledgeModel = require('./expertKnowledge');
var expertModel = require('./expert');
var expertReceiveModel = require('./expertReceive');
var httpRequest = require('../utility/request')();
var expertConfirmModel = require('./expertConfirm');
var tool = require('../utility/tool');

exports.expertList = expertList;
exports.confirmContent = confirmContent;
exports.contentWeekly = contentWeekly;
exports.contentInfoByIds = contentInfoByIds;

function contentInfoByIds(ids){
	return new promise(function(resolve,reject){
		var promises = ids.map(function(id){
			return contentInfoById(id);
		});
		promise.all(promises).then(function(result){
			return resolve(result);
		}).catch(function(err){
			console.log("===========获取不到数据");
			return reject(err);
		});
	});
}

function contentInfoById(contentId){
	return new promise(function(resolve,reject){
		// 获取baseId
		expertConfirmModel.confirmInfoByContentId(contentId).then(function(confirmInfo){
			if(confirmInfo){
				var baseId = confirmInfo.base_id;
			}
			return contentInfoByInterface(baseId,contentId);
		}).then(function(contentInfo){
			return resolve(contentInfo);
		}).catch(function(err){
			console.log(err);
			return reject(err);
		});
	});
}

function contentInfoByInterface(baseId, contentId){
	return new promise(function(resolve, reject) {
		var settings = require('../conf/appconfig').toLib;
		var url = settings.lib+'/api/content/info'+"?base_id="+baseId+"&content_id="+contentId;
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
                return resolve(result.data);
            }
        });
	});
}

//根据content_id获取出各知识库固定的条目
function contentWeekly(baseId,confirmInfo,num,page,pageSize){
	// 根据base_id把content_id拆除不同的数组
	var contentArr = arrByBaseId(baseId,confirmInfo).contentIds;
	var baseIds = arrByBaseId(baseId,confirmInfo).baseIds;
	var count = 0;
	return new promise(function(resolve,reject){
		var promises = contentArr.map(function(d){
			return contentFilter(d,num);
		});

		promise.all(promises).then(function(result){
			var contentIds = new Array();
			for(var k in result){
				var resultArr = result[k];
				for(var m in resultArr){
					contentIds.push(resultArr[m].id);
				}
			}
			count = contentIds.length;
			// contentIds数据库排序
			return contentFilter(contentIds,0,page,pageSize);
		}).then(function(result){
			var ids = new Array();
			for(var k in result){
				ids.push(result[k].id);
			}
			var json = {count: count, ids: ids, baseIds: baseIds};
			return resolve(json);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function contentFilter(contentArr,num,page,pageSize){
	return new promise(function (resolve, reject) {
		if(contentArr.length){
			var sql = "select distinct(id) from content where id in (" + contentArr.join(',')+") order by read_count desc";
			var params = {};
			if(num){
				sql += ' limit @num';
				params.num = num;
			}
			if(page && pageSize){
				sql += ' limit ' + (page-1)*pageSize + ',' + page*pageSize;
			}
	        sqlHelper.ExecuteDataTable("knowledge", sql, params, function (err, data) {
	            if (err) {
	                return reject(err);
	            }
	            else {
	                return resolve(data);
	            }
	        });
	   }
	   else{
	   		return resolve([]);
	   }
    });
}

function arrByBaseId(baseId,confirmInfo){
	var json = {};
	// 根据base_id把content_id拆除不同的数组
	var contentObj = new Array();
	var arrId = new Array();
	if(confirmInfo.length){
		var key = confirmInfo[0].base_id;
		var arr = new Array();
		for(var k in confirmInfo){
			var id = confirmInfo[k].base_id;
			arrId.push(id);
			if(baseId){
				if(id == baseId){
					arr.push(confirmInfo[k].content_id);
				}
			}
			else{
				if(id == key){
					arr.push(confirmInfo[k].content_id);
				}
				else{
					contentObj.push(arr);
					arr = new Array();
					key = confirmInfo[k].base_id;
					arr.push(confirmInfo[k].content_id);
				}
			}
		}
		contentObj.push(arr);
	}
	arrId = tool.unique(arrId);
	json.contentIds = contentObj;
	json.baseIds = arrId;
	return json;
}

//根据ids批量获取知识点
exports.getByIds = function (ids, callback) {
    var sql = "select * from content where id in(" + ids.join(',') + ")";
    //var params = {'ids': ids.join(',')};
    var params={}
    sqlHelper.ExecuteDataTable("knowledge", sql, params, callback);
};

function expertList(baseId, knowledgeId){
	return new promise(function(resolve,reject){
		expertKnowledgeModel.expertByKnowledgeId(baseId, knowledgeId).then(function(data){
			if(data.length){
				var promises = data.map(function(d){
					if(d.expert){
						return expertModel.getInfoByUsername(d.expert);
					}
				});
				return promise.all(promises);
			}
			else{
				return data;
			}
		}).then(function(result){
			var arr = new Array();
			if(result.length){
				for(var k in result){
					arr.push(result[k].info);
				}
			}
			return resolve(arr);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function confirmContent(info){
	return new promise(function(resolve,reject){
		// 加入到待审核列表--为了数据排重使用
		expertReceiveModel.insertContent(info).then(function(id){
			// 调取接口收录数据
			if(!id){
				throw new Error('待审核数据插入失败！');
			}
			var username = info.expert;
			return _confirmContent(username,id);
		}).then(function(status){
			return resolve(status);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function _confirmContent(username,id){
	return new promise(function(resolve,reject){
		var settings = require('../conf/appconfig').toLib;
		var url = settings.lib+'/api/confirm_content'+"?id="+id+"&username="+username;
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