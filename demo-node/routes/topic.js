var Topic = require("../models/topic");
var time = require("../utility/time")();
var promise = require('promise');
var async = require('async');
var knowledgeContent = require("../models/knowledgeContent");
var ContentModel = require("../models/content");
var knowledgeModel = require("../models/knowledge");

module.exports.autoroute = {
    get: {
        '/topic/list' : list,
        '/topic/new' : newTopic,
        '/topic/sub_topic' : subTopicList,
        '/topic/select': selectContent,
        '/topic/:topic_id/edit': TopicContentList,
        '/topic/delete_content' : removeContent
    },
    post: {
        '/topic/create' : createTopic,
        '/topic/add_content' : addContent,
        '/topic/publish' : publish,
        '/topic/sort': sort
    }

};

//子专题内容排序
function sort(req, res){
    var info = req.body;
    info.opreator = req.session.user.userName;
    var topicId = info.id;

    Topic.sort(info).then(function(status){
        // 重定向到首页
        res.redirect('/topic/' + topicId + '/edit');
    }).catch(function(err){
        logger.warn("failed to sort topic content "+err);
        return Q.reject(err);
    });

}

//专题列表页
function list(req, res,next){
    var page = req.query.page?req.query.page:1;
    var pagesize = 10;
    var params = req.query;
    async.waterfall([
        //获取专题列表
        function(cb){
            Topic.getAllBase(function(err,list){
                cb(err,list)
            })
        },
        function(list,cb){
            //获取最新子专题
            Topic.getNewTopic(function(err,new_topic){
                cb(err,list,new_topic);
            })
        },
        function(list,new_topic,cb){
            //获取专题中子专题个数
            Topic.getTopicCount(function(err,topic_count){
                cb(err,list,new_topic,topic_count);
            })
        }
    ],function(err,list,new_topic,topic_count){
        if(err){
            res.render('topic/list',{list:[],new_topic:{},topic_count:{}});
        }else{
            res.render('topic/list',{list:list,new_topic:new_topic,topic_count:topic_count});
        }
    })
}

function newTopic(req,res,next){
    var base_id = req.query.base_id;
    res.render('topic/new',{base_id:base_id, remodel: 0});
}
//创建子专题
function createTopic(req,res,next){
    var name = req.body.name;
    var base_id = req.body.base_id;
    async.waterfall([
        function(cb){
            Topic.findByName(base_id,name,function(err,data){
                cb(err,data);
            })
        },
        function(data,cb){
            if(data){
                cb(null,'子专题名称已存在');
            }else{
                Topic.insertTopic(base_id,name,function(err,id){
                    cb(err,null);
                });
            }
        }
    ],function(err,msg){
        if(err){
            res.render('topic/new',{base_id:base_id});
        }else if(msg){
            res.render('topic/new',{base_id:base_id,msg:msg});
        }else{
            res.redirect("/topic/sub_topic?base_id=" + base_id);
        }
    });
}

//子专题列表页
function subTopicList(req,res,next){
    var base_id = req.query.base_id;
    var baseName = req.query.name;
    var page = req.query.page || 1;
    var page_size = 10;
    async.waterfall([
        function(cb){
            Topic.subTopicList(page,page_size,base_id,function(err,list,count){
                var topic_ids = []
                for(var i in list){
                    topic_ids.push(list[i].id);
                }
                cb(err,list,count,topic_ids);
            });
        },
        function(list,count,topic_ids,cb){
           Topic.subTopicContentCount(topic_ids,function(err,topic_counts){
               cb(err,list,count,topic_counts);
           });

        }
    ],function(err,list,count,topic_counts){
        var pageModel = require("../models/pagemodel")({linkformat: "sub_topic?page=:page",querys: req.query, itemcount: count, current: page, size:page_size});
        res.render('topic/sub_topic_list',{baseName: baseName, list:list,count:count,topic_counts:topic_counts,pageModel:pageModel})
    });
}

//专题内容添加页面
function selectContent(req,res,next){
    var base_id = req.query.base_id;
    var topic_id = req.query.topic_id;
    var params = req.query;
    var page = req.query.page || 1;
    var pagesize = 10;
    //获取知识库下收录内容
    async.waterfall([
        // 获取知识库下知识点列表
        function(cb){
            knowledgeModel.knowledgeList(base_id, function(err, knowledgeList){
                cb(err,knowledgeList);
            });
        },
        //获取子专题下已经收录的内容
        function(knowledgeList,cb){
            Topic.getContentById(topic_id,function(err,data){
                var topic_content = [];
                for(var i in data){
                    topic_content.push(data[i].content_id);
                }
                cb(err,topic_content,knowledgeList);
            });
        },
        //根据条件获取收录的内容
        function(content_ids,knowledgeList,cb){
            params['content_ids'] = content_ids ;
            if(params['keys'] && params['keys']!=''){
                knowledgeContent.getDataByKey(page, pagesize,params,function(err,list,itemCount){
                    if(err){
                        console.log('get knowledge list failed.');
                        cb(err);
                    }else{
                        //时间处理,类型处理
                        for(var k in list){
                            list[k].create_at = time.jsDateTimeToStr(list[k].create_at);
                            list[k].content_type = knowledgeContent.contentTypeProcess(list[k].content_type);
                        }
                        cb(err,list,itemCount,knowledgeList);
                    }
                })
            }else{
                knowledgeContent.getListByPage(page, pagesize,params,function(err,list,itemCount){
                if(err){
                    console.log('get knowledge list failed.');
                    cb(err);
                }else{
                    //时间处理,类型处理
                    for(var k in list){
                        list[k].create_at = time.jsDayToStr(list[k].create_at);
                        list[k].content_type = knowledgeContent.contentTypeProcess(list[k].content_type);
                    }
                    cb(err,list,itemCount,knowledgeList);
                }
            })
            }
        },
        function(list,itemCount,knowledgeList,cb){
            if(list.length > 0){
                knowledgeContent.getNodeAndContent(list,function(err,knowledgeHash,contentHash,bases,baseHash){
                    cb(err,list,itemCount,knowledgeHash,contentHash,bases,baseHash,knowledgeList);
                });
            }else{
                knowledgeContent.getAllBase(function(err,bases,baseHash){
                    cb(null,list,itemCount,{},{},bases,baseHash,knowledgeList);
                })
            }

        }
    ],function(err,list,itemCount,knowledgeHash,contentHash,bases,baseHash,knowledgeList){
        if(err){
            res.render('error/500');
        }else{
            var pageModel = require("../models/pagemodel")({linkformat: "/topic/select?page=:page",querys: req.query, itemcount: itemCount, current: page, size:pagesize});
            res.render('topic/select_content_list',{
                topic_id:topic_id,
                base_id:base_id,
                params:params,
                pageModel:pageModel,
                knowledgeHash:knowledgeHash,
                contentHash:contentHash,
                bases:bases,
                baseHash:baseHash,
                list:list,
                knowledge: knowledgeList
            });
        }
    })
}

//添加内容到子专题
function addContent(req,res,next){
    var topic_id= req.body.topic_id;
    var content_ids = req.body.content_ids;
    var user_name =  req.session.user.userName;
    var base_id = req.body.base_id;

    Topic.addContentToTopic(topic_id,base_id,user_name,content_ids,function(err,result){
        if(err){

        }else{
            res.redirect('/topic/' + topic_id + '/edit');
        }
    })
}

//子专题内容列表
function TopicContentList(req,res,next){
    var topic_id = req.params["topic_id"];
    async.waterfall([
        function(cb){
            Topic.getNameById(topic_id,function(err,topic){
                cb(err,topic);
            });
        },
        function(topic,cb){
            Topic.getBaseNameById(topic.base_id,function(err,base){
                cb(err,topic,base);
            });
        },
        function(topic,base,cb){
          Topic.getContentById(topic_id,function(err,list){
              var topic_content = [];
              for(var i in list){
                  topic_content.push(list[i].content_id);
              }
             cb(err,topic,base,list,topic_content);
          })
        },
        //获取内容title
        function(topic,base,list,topic_content,cb){
            if(topic_content.length > 0){
                ContentModel.getByIds(topic_content,function(err,content_list){
                    for(var i in content_list){
                        for(var j in list){
                            if(content_list[i].id == list[j].content_id){
                                content_list[i].sort = list[j].sort;
                                // content_hash[content_list[i].id] = [content_list[i].title,content_list[i].url, list[j].sort];
                            }
                        }
                    }
                    cb(err,topic,base,list,topic_content,content_list);
                })
            }else{
                cb(null,topic,base,list,topic_content,{});
            }
        },
        //获取内容收录日期
        function(topic,base,list,topic_content,content_hash,cb){
            if(topic_content.length > 0){
                knowledgeContent.getAllByContentIds(topic_content,function(err,content_data){
                    for(var k in content_data){
                        for(var m in content_hash){
                            if(content_hash[m].id == content_data[k].content_id){
                                content_data[k].title = content_hash[m].title;
                                content_data[k].url = content_hash[m].url;
                                content_data[k].sort = content_hash[m].sort;
                            }
                        }
                        content_data[k].create_at = time.jsDayToStr(content_data[k].create_at);
                        content_data[k].content_type = knowledgeContent.contentTypeProcess(content_data[k].content_type);
                    }
                    // 按照sort排序
                    content_data = Topic.sortBySort(content_data);
                    cb(err,topic,base,list,topic_content,content_hash,content_data);
                });
            }else{
                cb(null,topic,base,list,topic_content,content_hash,[]);
            }

        }
    ],function(err,topic,base,list,topic_content,content_hash,content_data){
        if(err){
            console.log(err);
        }else{
            res.render('topic/topic_show',{topic:topic,base:base,topic_content:topic_content,content_hash:content_hash,content_data:content_data})
        }
    });
}

function removeContent(req,res,next){
    var content_id = req.query.content_id;
    var topic_id = req.query.topic_id;
    Topic.removeContent(content_id,topic_id,function(err,result){
        if(err){
            console.log('删除失败');
        }else{

        }
        res.redirect('/topic/' + topic_id.toString() + '/edit')
    })
}

function publish(req,res,next){
    var topic_id = req.body.topic_id;
    async.waterfall([
        function(cb){
            Topic.getNameById(topic_id,function(err,result){
               cb(err,result);
            })
        },
        function(topic,cb){
          if(topic){
              Topic.findByNameAndStatus(topic.base_id,topic.name,function(err,data){
                  if(data){
                      var msg = "不能发布同名子专题";
                      cb(null,msg,false);
                  }else{
                      cb(err,'',true)
                  }
              })
          }else{
              var msg = "子专题不存在";
              cb(null,msg,false);
          }
        },
        function(msg,can_publish,cb){
            if(can_publish){
                Topic.publish(topic_id,function(err,result){
                    cb(err,msg,can_publish,result);
                })
            }else{
                cb(null,msg,can_publish,null)
            }
        }
    ],function(err,msg,can_publish,result){
        if(err){
            res.json({status:false});
        }else if(!can_publish && msg != ''){
            res.json({status:false,msg:msg});
        }else if(can_publish){
            res.json({status:true});
        }
    });
}


