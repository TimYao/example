/**
 * Created by houjy on 16-1-6.
 */
var promise = require('promise');
var redisClient = require('../utility/redis')();
var settings = require('../conf/appconfig').toLib;
var httpRequest = require('../utility/request')();
var traverse = require('traverse');

exports.tree = tree;
exports.nodeConNum = nodeConNum;
exports.nodeHaveChildNode = nodeHaveChildNode;
exports.getLevel1 = getLevel1;
exports.childNode = childNode;

//获取目录树
function tree(baseId){
    return new promise(function(resolve, reject) {
        var url = settings.lib+'/api/treeExpert'+"?baseId="+baseId;
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

//知识库下有知识点的所有节点
function nodeConNum(treeJson){
    var nodeConNum = {};
    traverse(treeJson).reduce(function (x) {
        if (this.key == 'knowledge') {
            nodeConNum[this.parent.key] = true;
        }
    });
   return nodeConNum;

}

//知识库下有子节点的所有节点
function nodeHaveChildNode(treeJson){
    var nodeHaveChild = {};
    var nodeTree = traverse(treeJson).map(function (x) {
        if(this.key == "knowledge" || this.key == "name"){//去掉name和knowledge
            this.remove();
        }
    });
    traverse(nodeTree).reduce(function (x) {
        if(!this.isLeaf){//不是最后一级节点
            nodeHaveChild[this.key] = true;
        }
    });
    return nodeHaveChild;
}

//知识库下的一级节点
function getLevel1(treeJson,baseId) {
    var level1={};
    var level1Tree = traverse(treeJson).map(function (acc, x) {
        if(this.key == "knowledge"){
            this.remove();
        }
    });
    traverse(level1Tree).reduce(function (x) {
        if(this.level == 1 && this.key !='name'){
            level1[this.key] = {};
            level1[this.key].id = this.key;
            level1[this.key].name = this.node.name;
            level1[this.key].id_path = baseId+'-';
        }
    });


    //id,id_path,name
    return level1;
}

function childNode(treeJson,idPath){
    var child=[];
    var childJson = traverse(treeJson).get(idPath.slice(1));
    childJson = traverse(childJson).map(function (acc, x) {
        if(this.key == "knowledge"){
            this.remove();
        }
    });
    var i=0;
    traverse(childJson).reduce(function (x) {
        if(this.level == 1 && this.key !='name'){
            child[i] = {};
            child[i].id = this.key;
            child[i].name = this.node.name;
            child[i].id_path = idPath.join('-')+'-';
            child[i].level = idPath.length;
            i++;
        }
    });
    //child = JSON.stringify(child);
    return child;
}

