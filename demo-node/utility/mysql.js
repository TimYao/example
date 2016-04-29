module.exports = function(config){
    var mysql = require("mysql");
    var sqlHelper = {};

    if(!global.mysqlPools){
        global.mysqlPools = {};
        process.on('exit', function () {
            console.log("connection pool released.");
            for(var dbName in global.mysqlPools){
                var poolCluster = global.mysqlPools[dbName];
                poolCluster.end();
                delete global.mysqlPools[dbName];
            }
            delete global.mysqlPools;
        });
    }

    var getPool = function(dbName, wr){
        var poolCluster
        poolCluster = global.mysqlPools[dbName];
        var cfg = config[dbName];
        if(!poolCluster){
            poolCluster = mysql.createPoolCluster();
            if(cfg.constructor == Array){
                var slaveindex = 0;
                for(var i= 0,len=cfg.length;i<len; i++){
                    cfg[i].multipleStatements = true;
                    if(cfg[i].type && cfg[i].type == "master"){
                        poolCluster.add('MASTER', cfg[i]);
                    }else{
                        poolCluster.add('SLAVE' + slaveindex, cfg[i]);
                        slaveindex = slaveindex + 1;
                    }
                }
            }else{
                cfg.multipleStatements = true;
                poolCluster.add("MASTER", cfg);
            }
            global.mysqlPools[dbName]  = poolCluster;
        }
        if(poolCluster._findNodeIds("*").length == 1){
            return poolCluster.of();
        }else if (poolCluster._findNodeIds("*").length > 1){
            if(wr == "w"){
                return poolCluster.of('MASTER');
            }else{
                return poolCluster.of('SLAVE*');
            }
        }else{
            console.log("连接池异常, dbName:%s", dbName);
            delete global.mysqlPools[dbName];
            throw "连接池异常";
        }
    };

    var queryformat = function (query, values) {
        if (!values) return query;
        return query.replace(/\@(\w+)/g, function (txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key]);
            }
            return txt;
        }.bind(this));
    };

    sqlHelper.ExecuteDataRow = function (){
        var dbName = arguments[0], sql = arguments[1], params = arguments[2],wr=arguments[3],callback;

        if(typeof(wr) == "function"){
            callback = wr;
            wr = "w";
        }else if(typeof(wr) == "string"){
            callback = arguments[4];
        }

        var pool = getPool(dbName, wr);

        pool.getConnection(function(err, conn) {
            conn.config.queryFormat = queryformat;
            conn.query(sql, params, function(err, rows) {
                callback(err, (rows && rows.length> 0)? rows[0]: null);
                conn.release();
            });
        });
    };

    sqlHelper.ExecuteDataTable = function (){
        var dbName = arguments[0], sql = arguments[1], params = arguments[2],wr=arguments[3],callback;

        if(typeof(wr) == "function"){
            callback = wr;
            wr = "w";
        }else if(typeof(wr) == "string"){
            callback = arguments[4];
        }

        var pool = getPool(dbName, wr);
        pool.getConnection(function(err, conn) {
            conn.config.queryFormat = queryformat;
            conn.query(sql, params, function(err, rows) {
                callback(err, rows);
                conn.release();
            });
        });
    };

    sqlHelper.ExecuteDataSet = function (){
        var dbName = arguments[0], sql = arguments[1], params = arguments[2],wr=arguments[3],callback;

        if(typeof(wr) == "function"){
            callback = wr;
            wr = "w";
        }else if(typeof(wr) == "string"){
            callback = arguments[4];
        }

        var pool = getPool(dbName,wr);
        pool.getConnection(function(err, conn) {
            conn.config.queryFormat = queryformat;
            conn.query(sql, params, function(err, rows) {
                callback(err, rows);
                conn.release();
            });
        });
    };

    sqlHelper.ExecuteInsert = function(dbName, sql, params, callback){
        var pool = getPool(dbName, "w");
        pool.getConnection(function(err, conn) {
            conn.config.queryFormat = queryformat;
            conn.query(sql, params, function(err, rows) {
        		if(err){
        			callback(err,null);
        		}
        		else {
                	callback(err, rows.insertId);
                	conn.release();
        		}
            });
        });
    };

    sqlHelper.ExecuteNoQuery = function(dbName, sql, params, callback){
        var pool = getPool(dbName, "w");

        pool.getConnection(function(err, conn) {
            conn.config.queryFormat = queryformat;
            conn.query(sql, params, function(err, data) {
                var rowcount = 0;
                if(err){
                    callback(err, rowcount);
                }else{
                    if(data.constructor == Array){
                        var result = data[data.length - 1];
                        if(result.affectedRows){
                            rowcount = result.affectedRows;
                        }
                    }else{
                        rowcount = data.affectedRows;
                    }

                    callback(err, rowcount);
                }
                conn.release();
            });
        });
    };

    sqlHelper.InsertJson = function(dbName, tableName, obj, callback){
        var pool = getPool(dbName, "w");

        pool.getConnection(function(err, conn) {
            conn.config.queryFormat = queryformat;
            conn.query("INSERT INTO " + tableName + " SET @obj", {obj:obj}, function(err, data) {
                if(err){
                    callback(err, null);
                }else if(data){
                    callback(err, data.insertId);
                }
                conn.release();
            });
        });
    };

    sqlHelper.ExecuteScalar = function(){
        var dbName = arguments[0], sql = arguments[1], params = arguments[2],wr=arguments[3],callback;

        if(typeof(wr) == "function"){
            callback = wr;
            wr = "w";
        }else if(typeof(wr) == "string"){
            callback = arguments[4];
        }

        var pool = getPool(dbName, wr);

        pool.getConnection(function(err, conn) {
            conn.config.queryFormat = queryformat;
            conn.query(sql, params, function(err, rows) {
                if(rows.length> 0){
                    var data = rows[0];
                    for(var p in data){
                        callback(err, data[p]);
                        conn.release();
                        return;
                    }
                }else{
                    callback(err, null);
                }
                conn.release();
            });
        });
    };

    sqlHelper.ExecuteDataByPage = function (){
        var dbName = arguments[0]
            , sql = arguments[1]
            , params = arguments[2]
            , pageindex = arguments[3]
            , pagesize = arguments[4]
            , wr=arguments[5],callback;

        if(typeof(wr) == "function"){
            callback = wr;
            wr = "w";
        }else if(typeof(wr) == "string"){
            callback = arguments[6];
        }

        var pool = getPool(dbName, wr);
        pool.getConnection(function(err, conn) {
            conn.config.queryFormat = queryformat;
            var index = ( pageindex - 1 ) * pagesize;
            conn.query(sql + ' LIMIT ' + index + ',' + pagesize + ';' + 'select count(*) as count from (' + sql + ') as counttable', params, function(err, result) {
                callback(err, result[0], result[1][0].count);
                conn.release();
            });
        });
    };

    return sqlHelper;
}
