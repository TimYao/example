var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var redisClient = require('../utility/redis')();
var time = require("../utility/time")();
var promise = require('promise');
var nodeModel = require("./node");
var expertKnowledgeModel = require("./expertKnowledge");
var baseModel = require("./base");
var knowledgeModel = require("./knowledge");
var ucModel = require("./uc");
var image = require("./image");
var formidable = require('formidable');
var ExpertReceiveModel = require('./expertReceive');


var db = "knowledge";

exports.doSave = doSave;
exports.editSave = editSave;
exports.checkUpdate = checkUpdate;
exports.checkUnComplete = checkUnComplete;
exports.insertSave = insertSave;
exports.checkInsert = checkInsert;
exports.checkUserByUC = checkUserByUC;
exports.checkUserUnq = checkUserUnq;
exports.doInsert = doInsert;
exports.doUpdate = doUpdate;
exports.doDel = doDel;
exports.getInfo = getInfo;
exports.getInfoByUsername = getInfoByUsername;
exports.getList = getList;
exports.getExpertBase = getExpertBase;
exports.getExpertKnowledge = getExpertKnowledge;
//exports.getNodeTree = getNodeTree;
exports.getUnCompleteMul = getUnCompleteMul;


//添加编辑保存
function doSave(fields,files,operator){
    var json_ret = {'succ':0,'msg':''};
    return new promise(function(resolve, reject){
        var realname = fields.realname||'';
        var username = fields.username||'';
        var introduction = fields.introduction||'';
        var base_id = fields.base_id||'';

        var avatar = files.avatar;
        var id = fields.id?fields.id:0;
        if(realname == ''){
            json_ret['msg'] = "真实姓名为空！";
            return resolve(json_ret);
        }
        if(username == ''){
            json_ret['msg'] = "用户名为空！";
            return resolve(json_ret);
        }

        if(introduction == ''){
            json_ret['msg'] = "介绍为空！";
            return resolve(json_ret);
        }
        if(base_id == ''){
            json_ret['msg'] = "知识库为空！";
            return resolve(json_ret);
        }
        if(avatar.name == '' && id==0){
            json_ret['msg'] = "头像为空！";
            return resolve(json_ret);
        }
        if(id > 0){
            editSave(id,username,base_id,realname,introduction,avatar,operator)
            .then(function(json_ret){
                // 删除缓存
                var key = username.toLowerCase().trim() + '_knowledgeId';
                redisClient.delete(key);
                return resolve(json_ret);
            }).catch(function(err){
                return reject(err);
            })
        }else{
            insertSave(username,base_id,realname,introduction,avatar)
            .then(function(json_ret){
                // 删除缓存
                var key = username.toLowerCase().trim() + '_knowledgeId';
                redisClient.delete(key);
                return resolve(json_ret);
            }).catch(function(err){
                return reject(err);
            });
        }


    })

}

function editSave(id,username,base_id,realname,introduction,avatar,operator){
    var json_ret = {'succ':0,'msg':''};
    var orgInfo;
    return new promise(function(resolve, reject){
        checkUpdate(id,username,base_id,realname,introduction,avatar)
        .then(function(json_ret){
            if(json_ret['succ'] == 1){
                return new promise(function(resolve,reject){
                    orgInfo = json_ret['orgInfo'];
                    var info = {
                        'base_id': base_id,
                        'username': username,
                        'realname': realname,
                        'introduction': introduction,
                        'avatar_url':orgInfo.avatar_url
                    };
                    if(avatar.name != ''){// 上传图片
                        image.saveImg(avatar, 'expert')
                            .then(function(url){
                                if(url){
                                    info.avatar_url = url;
                                }
                                return resolve(info);

                            })
                    }else{
                        return resolve(info);
                    }

                }).then(function(info){
                        return doUpdate(info,operator,id);
                })
                .then(function(result){
                    //如果修改负责知识库，那么删除以前负责的知识点
                    if(orgInfo.base_id != base_id){
                        expertKnowledgeModel.doDel(username,orgInfo.base_id).then(function(){
                            return resolve({'succ':1,'msg':'修改成功'});
                        })
                    }else{
                    return resolve({'succ':1,'msg':'修改成功'});
                    }
                }).catch(function(reason) {
                    return resolve({'succ':0,'msg':"修改失败，请重试！"+reason});
                })
            }else{
                return resolve(json_ret);
            }
        }).catch(function(reason) {
                return resolve({'succ':0,'msg':"修改失败，请重试！"+reason});
        })

    })
}

function checkUpdate(id,username,base_id,realname,introduction,avatar){
    var json_ret = {'succ':0,'msg':''};
    return new promise(function(resolve,reject){
        checkUserByUC(username)
        .then(function(json_ret){
            if(json_ret['succ'] == 0){
                return resolve(json_ret);
            }else{
                var orgInfo;
                getInfo(id)
                .then(function(ret){
                    return new promise(function(resolve,reject){
                        orgInfo = ret.info;
                        if(username != ret.info.username){
                            checkUserUnq(username)
                                .then(function(json_ret2){
                                    json_ret =json_ret2;
                                    if(json_ret['succ'] == 1){
                                        return resolve(true);
                                    }else{
                                        return resolve(false);
                                    }

                                })
                        }else{
                            return resolve(true);
                        }
                    })
                })
                .then(function(usernameFlag) {
                    if (usernameFlag) {
                        checkUnComplete(username,base_id,orgInfo)
                        .then(function(baseFlag){
                            if(baseFlag){
                                return resolve({'succ':1,'msg':"ok",'orgInfo':orgInfo});

                            }else{
                                return resolve({'succ':0,'msg':"该用户有尚未完成的内容收录，不能修改知识库！"});
                            }

                        })
                    }else{
                        return resolve(json_ret);
                    }
                }).catch(function(err) {
                        return reject(err);
                })


            }
        }).catch(function(err) {
                return reject(err);
        })
    })

}

function checkUnComplete(username,base_id,orgInfo){
    return new promise(function(resolve,reject){
        if(base_id != orgInfo.base_id){
            ExpertReceiveModel.getUnCompleteCount(username)
                .then(function(count){
                    if(count == 0){
                        return resolve(true);
                    }else{
                        return resolve(false);
                    }

                }).catch(function(err) {
                    return reject(err);
                })
        }else{
            return resolve(true);
        }
    })
}

function insertSave(username,base_id,realname,introduction,avatar){
    var json_ret = {'succ':0,'msg':''};
    return new promise(function(resolve, reject){
        checkInsert(username)
            .then(function(json_ret){
                if(json_ret['succ'] == 0){
                    return resolve(json_ret);
                }else{
                    var info = {
                        'base_id': base_id,
                        'username': username,
                        'realname': realname,
                        'introduction': introduction,
                        'avatar_url': avatar
                    };
                    // 上传图片
                    image.saveImg(info.avatar_url, 'expert').then(function(url){
                        if(url){
                            info.avatar_url = url;
                        }
                        return doInsert(info);
                    }).then(function(result){
                        return resolve({'succ':1,'msg':"添加成功"});
                    }).catch(function(reason) {
                        return resolve({'succ':0,'msg':"添加失败，请重试！"+reason});
                    })
                }

            }).catch(function(err) {
                return reject(err);
            })
    })
}

function checkInsert(username){
    var json_ret = {'succ':0,'msg':''};
    return new promise(function(resolve, reject){
        checkUserByUC(username)
            .then(function(json_ret){
                if(json_ret['succ'] == 0){
                    return resolve(json_ret);
                }else{
                    return checkUserUnq(username);
                }
            })
            .then(function(json_ret){
                return resolve(json_ret);
            }).catch(function(err) {
                return reject(err);
            })
    })

}

function checkUserByUC(username){
    var json_ret = {'succ':0,'msg':''};
    return new promise(function(resolve, reject){
        ucModel.getUserInfo(username)
            .then(function(ucInfo){
                if(ucInfo.err > 0){
                    json_ret['msg'] =  "用户名错误！"+ucInfo.msg;
                    return resolve(json_ret);
                }else{
                    json_ret['succ'] = 1;
                    json_ret['msg'] =  "ok";
                    return resolve(json_ret);
                }
            }).catch(function(err) {
                return reject(err);
            })
    })

}
function checkUserUnq(username){
    var json_ret = {'succ':0,'msg':''};
    return new promise(function(resolve, reject) {
        getInfoByUsername(username)
            .then(function (ret2) {
                if (ret2.info == null || ret2.info == '') {
                    json_ret['succ'] = 1;
                    json_ret['msg'] = "ok";
                    return resolve(json_ret);
                } else {
                    json_ret['msg'] = "该用户已经存在！";
                    return resolve(json_ret);
                }

            }).catch(function(err) {
                return reject(err);
            })
    })
}

function doInsert(fileds){
    var sql = "INSERT INTO expert(base_id,username,realname,introduction,avatar_url,create_at,status) VALUES(@base_id,@username,@realname,@introduction,@avatar_url,@create_at,@status)";
    var params = {
        'base_id': fileds['base_id'],
        'username': fileds['username'],
        'realname': fileds['realname'],
        'introduction': fileds['introduction'],
        'avatar_url': fileds['avatar_url'],
        'create_at': time.now(),
        'status': 1,
    };
    return new promise(function(resolve, reject) {
        sqlHelper.ExecuteInsert(db, sql, params, function(err,lastId){
            if(err){
                return reject(err);
            }
            else
            {
                return resolve({lastId:lastId});
            }
        });
    });
}

function doUpdate(fileds,username,id){
    var sql = "UPDATE expert " +
        "SET base_id=@base_id,username=@username,realname=@realname,introduction=@introduction,avatar_url=@avatar_url,opreator=@opreator,update_at=@update_at " +
        "WHERE id=@id";
    var params = {
        'id':id,
        'base_id': fileds['base_id'],
        'username': fileds['username'],
        'realname': fileds['realname'],
        'introduction': fileds['introduction'],
        'avatar_url': fileds['avatar_url'],
        'opreator':username,
        'update_at':time.now(),
    };
    return new promise(function(resolve, reject) {
        sqlHelper.ExecuteNoQuery(db, sql, params, function(err,affectedRows){
            if(err){
                return reject(err);
            }
            else
            {
                return resolve({affectNum:affectedRows});
            }
        });
    });
}

function doDel(id,username){
    var sql = "UPDATE expert SET status=@status,opreator=@opreator,update_at=@update_at WHERE id=@id";
    var params = {
        'status': -1,
        'id': id,
        'opreator':username,
        'update_at':time.now(),
    };
    return new promise(function(resolve, reject) {
        sqlHelper.ExecuteNoQuery(db, sql, params, function(err,affectedRows){
            if(err){
                return reject(err);
            }
            else
            {
                // 删除缓存
                var key = username.toLowerCase().trim() + '_knowledgeId';
                redisClient.delete(key);
                return resolve({affectNum:affectedRows});
            }
        });
    });
}

function getInfo(id){
    var sql = "SELECT * FROM expert WHERE id=@id and status=@status";
    var params = {
        'id': id,
        'status':1
    };
    return new  promise(function(resolve,reject){
        sqlHelper.ExecuteDataRow(db, sql, params, function(err,row){
            if(err){
                return reject(err);
            }
            else
            {
                return resolve({info:row});
            }
        });
    })
}
function getInfoByUsername(username){
    var sql = "SELECT * FROM expert WHERE username=@username and status=@status";
    var params = {
        'username':username,
        'status':1
    };
    return new  promise(function(resolve,reject){
        sqlHelper.ExecuteDataRow(db, sql, params, function(err,row){
            if(err){
                return reject(err);
            }
            else
            {
                return resolve({info:row});
            }
        });
    })
}

function getList(base_id,page,pagesize){
    var params = [];
    var where = " WHERE status=@status";
    params['status']=1;

    if(base_id > 0){
        where += " AND base_id=@base_id";
        params['base_id'] = base_id;
    }
    var orderBy = " ORDER BY create_at desc";

    var sql = "SELECT * FROM expert"+where+orderBy;

    return new  promise(function(resolve,reject){
        sqlHelper.ExecuteDataByPage(db, sql, params, page, pagesize,function(err,rows,count){
            if(err){
                return reject(err);
            }
            else
            {
                return resolve({rows:rows,count:count});
            }
        });
    })
}

/**
 * 获取专家所属的知识库
 * @param list 专家列表
 */
function getExpertBase(list){
    var bases_ids=[];
    var bases_ids_str;
    list.forEach(function(expert){
        bases_ids.push(expert['base_id']);
    })
    bases_ids_str = bases_ids.join(',');
    if(bases_ids_str == ''){
        return new promise(function(resolve,reject){
            return resolve({list:list});
        });
    }

    return new promise(function(resolve,reject){
        baseModel.getListByIds(bases_ids_str).then(function(bases){
            for (i in list)
            {
                bases.forEach(function(base){
                    if(list[i]['base_id'] == base['id']){
                        list[i]['base_name'] = base['name'];
                    }
                })
            }
            return resolve({list:list});
        }).catch(function(err) {
            return reject(err);
        })
    })


}
/**
 * 获取专家分配的知识点
 * @param list 专家列表
 */
function getExpertKnowledge(list) {
    return new promise(function(resolve, reject) {
        var expert_usernames=[];
        var expert_usernames_str;
        list.forEach(function(expert){
            expert_usernames.push("'"+expert['username']+"'");
        })
        expert_usernames_str = expert_usernames.join(",");
        if(expert_usernames_str == ''){
            return resolve({list:list});
        }

        expertKnowledgeModel.getListByExpertUsernames(expert_usernames_str)
        .then(
            function(result){
                var expert_know_list = result.knowledges;
                for (i in list) {
                    list[i]['knowledge_names'] = [];
                }

                var kl_ids = [];
                var kl_ids_str;
                expert_know_list.forEach(function (kl_row) {
                    kl_ids.push(kl_row['knowledge_id']);
                })
                kl_ids_str = kl_ids.join(',');
                if (kl_ids_str != '') {
                        knowledgeModel.getListByIds(kl_ids_str)
                        .then( function (kown) {
                            for (i in expert_know_list) {
                                kown.forEach(function (k) {
                                    if (expert_know_list[i]['knowledge_id'] == k['id']) {
                                        expert_know_list[i]['knowledge_name'] = k['name'];
                                    }
                                })
                            }
                            for (i in list) {
                                expert_know_list.forEach(function (e_k) {
                                    if (list[i]['username'] == e_k['expert']) {
                                        list[i]['knowledge_names'].push(e_k['knowledge_name']);
                                    }
                                })
                            }
                            return resolve({list: list});
                        }).catch(function(err){
                                return reject(err);
                        })
                }
                else {
                        return resolve({list: list});
                }
            }
        ).catch(function(err){
            return reject(err);
        })

    })
}





//获取节点树
//var list = [];
//var currWhileNodeId;
//var i=1;
//function getNodeTree(infoRet,nodeId){
//    return new promise(function(resolve, reject){
//        var info = infoRet.info;
//        var baseId = info.base_id;
//        var nodeArr = nodeId.split('-');
//        if (i == 1) {
//            //知识库下的一级节点
//            currWhileNodeId = baseId;
//
//        }
//        nodeModel.getItem(currWhileNodeId, i).then(function (childNode) {
//            if(childNode!='' && childNode.length > 0){
//                currWhileNodeId = (nodeArr[i - 1] == "") ? childNode[0]['id'] : nodeArr[i - 1];
//                list[i] = {};
//                list[i]['currId'] = currWhileNodeId;
//                list[i]['list'] = childNode;
//                i++;
//                getNodeTree(infoRet,nodeId)//递归调用
//                    .then(function(ret) {
//                        return resolve(ret);//合并递归内容
//                    }).catch(function(err) {
//                        return reject(err);
//                    });
//            }else{
//                var tmp_list = list;
//                i=1;
//                currWhileNodeId='';
//                list = [];
//                return resolve(tmp_list);
//
//            }
//
//        }).catch(function(err) {
//            return reject(err);
//        })
//    })
//}

//现在不负责的知识点内是否有尚未完成的内容收录
function getUnCompleteMul(knowledges,klIds,expert){
    var json_ret={'succ':0,'msg':''};
    return new promise(function(resolve, reject){
        var org_kls = knowledges.knowledges;
        var org_ids = [];//以前负责的知识点


        for(var i=0;i<org_kls.length;i++){
            org_ids.push(org_kls[i]['knowledge_id']);
        }


        var toDel=[];
        toDel = toDel.concat(org_ids);
        for(var aa=0;aa<org_ids.length;aa++){
            for(var bb=0;bb<klIds.length;bb++){//本次需要负责的知识点
                if(parseInt(org_ids[aa]) == parseInt(klIds[bb])){
                    var delindex = toDel.indexOf(org_ids[aa]);
                    toDel.splice(delindex,1);
                    console.log(toDel);
                }
            }
        }

        if(toDel.length > 0){
            ExpertReceiveModel.getUnCompleteCountByKid(expert,toDel)
                .then(function(rows){
                    var unComplete = [];//尚未完成的知识点收录id
                    for(i in rows){
                        if(rows[i]['count'] > 0){
                            unComplete.push(rows[i]['knowledge_id']);
                        }
                    }
                    if(unComplete.length > 0){
                        knowledgeModel.getListByIds(unComplete.join(','))
                            .then(function(ks){
                                var unComNames = [];
                                for(i in ks){
                                    unComNames.push(ks[i]['name']);
                                }
                                json_ret['succ'] = 0;
                                json_ret['msg'] = unComNames.join(',')+"\n知识点下有尚未完成收录的，不可取消";
                                return resolve(json_ret);
                            })
                    }else{
                        json_ret['succ'] = 1;
                        json_ret['msg'] = "ok";
                        return resolve(json_ret);
                    }
                }).catch(function(err){
                    return reject(err);
                })
        }else{
            json_ret['succ'] = 1;
            json_ret['msg'] = "ok";
            return resolve(json_ret);
        }

    })

}
