module.exports = function(){
    var redis = require('redis');
    var config = require('../conf/dbconfig').redis;
    if(global.redisHelper){
        return global.redisHelper;
    }
    else{
        var redisHelper = {};
    }

    var RedisClient = redis.createClient(config.port, config.host);

    redisHelper.get = function(key, callback){
        RedisClient.get(key, function(err, reply){
            callback(err, reply);
        });
    }

    redisHelper.set = function(key, value, expire){
        RedisClient.set(key, value);

        if(expire && expire > 0){
            RedisClient.expire(key, expire);
        }
    }

    redisHelper.mget = function(keys, callback){
        if(keys.constructor != Array){
            callback("传入参数keys必须为数组", null);
            return;
        }

        if(keys.length == 0){
            callback("传入参数keys为空", null);
            return;
        }


        RedisClient.mget(keys, function(err,replies){
            callback(err, replies);
        });
    }

    redisHelper.mset = function(keys, value, callback){
        if(keys.constructor != Array){
            callback("传入参数keys必须为数组", null);
            return;
        }

        if(keys.length == 0){
            callback("传入参数keys为空", null);
            return;
        }


        var setvalues = [];
        keys.forEach(function(d){
            setvalues.push(d);
            setvalues.push(value);
        });

        RedisClient.mset(setvalues, function(err,result){
            callback(err, result);
        });
    };

    redisHelper.delete = function(key){
        RedisClient.del(key);
    }
    redisHelper.hgetall = function(key,callback){
        RedisClient.hgetall(key,callback);
    }
    redisHelper.hset = function(key,field,value){
        RedisClient.hset(key,field,value);
    }
    redisHelper.hget = function(key,field,callback){
        RedisClient.hget(key,field,callback);
    }
    redisHelper.expire = function(key,expire){
        RedisClient.expire(key,expire);
    }

    global.redisHelper = redisHelper;
    return global.redisHelper;
};

