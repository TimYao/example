//type 0:基本信息 1:edu 2:work 3:skill 4:userMgmt
function operateUserHelper(CSDNID,operate,type,reason,callback){
    var url = '/user/operate';
    var params = {'CSDNID':CSDNID,'operate':operate,'reason':reason,'type':type};
    $.ajax({
        type: 'POST'
        ,url: url
        ,dataType:'json'
        ,data: params
        ,success: function(data){
            if(data.count > 0){
                callback(null, data);
            }
            else{
                callback("操作失败",  null);
            }
        }
        ,error:function(XMLHttpRequest, textStatus, errorThrown){
            callback("请求失败",  null);
        }
    });
}

//type 0:基本信息  1:edu 2:work 3:skill
function operateUsersHelper(CSDNIDs,operate,type,callback){
    var url = '/users/operate';
    var params = {'CSDNIDs':CSDNIDs,'operate':operate,'type':type};
    $.ajax({
        type: 'POST'
        ,url: url
        ,dataType:'json'
        ,data: params
        ,success: function(data){
            if(data.count > 0){
                callback(null, data);
            }
            else{
                callback("操作失败",  null);
            }
        }
        ,error:function(XMLHttpRequest, textStatus, errorThrown){
            callback("请求失败",  null);
        }
    });
}

//CSDNIDs由逗号分隔 type 0:基本信息  1:edu 2:work 3:skill
function unlockUser(CSDNIDs,type,callback){
    var url = '/users/unlockUsers';
    var params = {'CSDNIDs':CSDNIDs,'type': type};
    $.ajax({
        type: 'POST'
        ,url: url
        ,dataType:'json'
        ,data: params
        ,success: function(data){
            if(data.count > 0){
                callback(null, data);
            }
            else{
                callback("操作失败",  null);
            }
        }
        ,error:function(XMLHttpRequest, textStatus, errorThrown){
            callback("请求失败",  null);
        }
    });
}