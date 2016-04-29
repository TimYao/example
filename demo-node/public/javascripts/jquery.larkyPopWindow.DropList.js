/*!
 * Larky DropList v1.0.0
 * http://larky.com/
 *
 * Copyright 2011, Larky Liu
 * Date: 2012年3月21日 11:08:36
 */

 /*
注意：需要引用jquery.larkyPopWindow.js

调用示例：
    var mydrplist = new lDropList(
    {
        ItemID: "testDropList" //可选 ID
        ,ItemName: "testDropList" //必填  Name
        ,ItemValue: "1" //可选  初始值，没有此项的话下拉框默认选取Items[0]
        ,Items: new Array( //可选  绑定数据列表 
            {ItemText:"请选择", ItemValue:""}  
            ,{ItemText:"aaa", ItemValue:"1"}
            ,{ItemText:"bbb", ItemValue:"2"}
            ,{ItemText:"ccc", ItemValue:"3"}
            ,{ItemText:"ddd", ItemValue:"4"}
            ); 
        ,ClassName: "divc"//可选  下拉框样式（ul样式）
        ,ContainerID: "drlistContainter"//与SenderElement二选一 创建控件的父元素位置
        //,SenderElement: $("#dropsrc")[0] //与ContainerID二选一    点击哪一个元素触发控件显示  以下统称“父控件”，如果为空则自动默认创建div元素
        ,SenderElementClassName: "droplistContainer" //可选  “父控件”的class属性，选择SenderElement自动创建的可能会用到
        ,Multi: false //可选如果为true，则为多选模式
        ,Zindex:999 //可选 z-index
        //,TopContainer: $("#fatherDIv")[0] //可选 如果要使用div里嵌套内容来相对定位
        ,MaxHeight: 200 //可选
    });

    mydrplist2.onchange = function()
    {
        alert(mydrplist2.GetValue());
    }
*/
function lDropList(parms)
{
    var _this = this;
    var _listPanel;  //弹出界面
    var _className = parms.ClassName; //弹出界面样式
    var _input; //控件名
    var _itemValue = parms.ItemValue; //初始值
    var _itemText = ""; //初始文本
    var _itemList = parms.Items; //绑定数据列表
    var _sender; //下拉列表源div
    var _multiSelect = false; //是否允许多选
    var _zIndex = 9999;
    var _maxHeight = parms.MaxHeight;

    //返回itemlist中对应value的text
    var drpList_FindText = function(itemList, itemValue)
    {
        var i =0;
        for(i=0; i< itemList.length; i++)
        {
            if(itemList[i].ItemValue == itemValue)
                break;
        }

        if(itemList[i] != null)
        {
            return itemList[i].ItemText;         
        }
        return "";
    };

    //去除前后的逗号（多选用）
    var TrimValues = function(inputs)
    {
        return inputs.replace(",,",",").replace(/^\,+/gi, "").replace(/\,+$/gi,"");
    };

    //删除一个数值（多选用）
    var DeleteValue = function(inputs, values)
    {
        return TrimValues(("," + inputs + ",").replace("," + values +",", ","));
    };

    //获取选中项目对应的全部文本
    var GetItemText = function(inputValue)
    {
        var returnValue = "";
        if(_multiSelect)
        {
            for(var i=0;i< _itemList.length; i++)
            {
                var rgx = new RegExp("," + _itemList[i].ItemValue + ",","ig");              
                if(rgx.test("," +inputValue + "," )){
                    return _itemList[i].ItemText + "...";
                    //returnValue = TrimValues(returnValue + "," + _itemList[i].ItemText);
                }
            }
            return returnValue +　"...";
        }
        return drpList_FindText(_itemList, inputValue);     
    };

    //点选后更新下拉框选中文本及数值
    var RefreshInput = function(itemValue, e)
    {
        var itemText = drpList_FindText(_itemList, itemValue);
        
        if(_multiSelect)
        {
            var e1 = e?e:window.event;
            var chbx = e1.target;
            
            if(e1.target.tagName == "INPUT")
            {
                if(chbx.checked)
                {
                    _itemValue = TrimValues(_itemValue + "," + itemValue);
                }
                else
                {
                    _itemValue = DeleteValue(_itemValue, itemValue);
                }
                _itemText = GetItemText(_itemValue);
            }
        }
        else
        {
            _itemValue = itemValue;
            _itemText = itemText;
        }

        if(_sender.tagName == "INPUT")
        {
            $(_sender).val(_itemText);
        }
        else
        {
            $(_sender).text(_itemText);
        }

        if(_itemValue != _input.value)
        {
            _input.value = _itemValue;
            _this.onchange();
        }
    };

    
    this.Initiate = function(){
        if(parms.ZIndex != null)
        {
            _zIndex = parms.ZIndex;
        }

        if(parms.Multi != null)
        {
            _multiSelect = parms.Multi;
        }
        
        if(_multiSelect)
        {
            _itemValue = "";
        }

        if(_itemList == null || _itemList.length == 0)
        {
            _itemList = new Array({ItemText:"", ItemValue:""});
        }
        
        if(_itemValue == null)
        {
            if( _itemList.length > 0)
            {
                _itemValue = _itemList[0].ItemValue ;
            }
        }
        
        if(parms.SenderElement != null)
        {
            _sender = parms.SenderElement;
        }
        else if(parms.ContainerID != null)
        {
            _sender = document.createElement("div");
            $(_sender).appendTo($("#" + parms.ContainerID));
        }
        
        if(parms.SenderElementClassName != null)
        {
            _sender.className = parms.SenderElementClassName;
        }

        if(_itemList == null)
        {
            _itemList = new Array();
        }

        _listPanel = document.createElement("ul");      

        //添加下拉项
        var itemtemplate = "";
        for(var i=0;i<_itemList.length;i++)
        {
            itemtemplate = "<li itemvalue=\"" + _itemList[i].ItemValue + "\">";
            if(_multiSelect)
            {
                itemtemplate = itemtemplate + "<input type=\"checkbox\"";
                if(("," + _itemValue + ",").indexOf("," + _itemList[i].ItemValue + ",") != -1)
                {
                    itemtemplate = itemtemplate + " checked=\"checked\" ";
                }
                itemtemplate = itemtemplate + " />";
            }
            itemtemplate = itemtemplate + _itemList[i].ItemText;
            itemtemplate = itemtemplate + "</li>";

            $(_listPanel).append(itemtemplate);
        }
        _listPanel.style.display = "none";
        _listPanel.style.position = "absolute";

        if(parms.PutNearBy){
            $(_sender).after($(_listPanel));
        }else{
            $(_listPanel).appendTo($(document.body));
        }

        //控件赋值
        if ("\v" == "v")
            _input = document.createElement("<input name='" + parms.ItemName + "'>");
        else {
            _input = document.createElement("input");
            _input.name = parms.ItemName;
        }
        if(parms.ItemID != null)
        {
            _input.id = parms.ItemID;
        }
        _input.type = "hidden";
//      $(_input).attr("senderpos", "top: " + $(_sender).offset().top + ",left:" +$(_sender).offset().left + ",height:" + $(_sender).outerHeight() +",width:" + $(_sender).outerWidth());
        $(_input).attr("useSenderPos","true")
        if(parms.OffsetUpdate != null)
        {
            $(_input).attr("offsetupdate", parms.OffsetUpdate);
        }
        $(_sender).after($(_input));

        //为dropList赋初始值
        _itemText = GetItemText(_itemValue);
        if(_sender.tagName == "INPUT")
        {
            $(_sender).val(_itemText);
        }
        else
        {
            $(_sender).text(_itemText);
        }
        _input.value = _itemValue;

        //调用ppWindow
        var mydrplist = new ppWindow(
        {
            DivElement: _listPanel
            ,ClassName: _className
            ,ClickSelfHide: !_multiSelect
            ,FuncItemClicked: RefreshInput
            ,ZIndex: _zIndex
            ,PutNearBy: parms.PutNearBy
    //      ,Position: parms.Position 
    //      ,PositionModify: parms.PositionModify
        });

        $(_sender).click(function(e){
            if(_maxHeight != null)
            {
                if($(_listPanel).height()>_maxHeight){$(_listPanel).css({height: _maxHeight+"px","overflow-y":"scroll" })};
            }

            if(_listPanel.style.display == "none"){
                mydrplist.show(e);
            }else{
                mydrplist.hide(e);
            }
        });
    }

    //为下拉框增添选项
    this.Add = function(itemValue, itemText){
        _itemList.push({ ItemValue: itemValue, ItemText: itemText });

        var itemTemplate = "<li itemvalue=\"" + itemValue + "\">";
        if(_multiSelect)
        {
            itemTemplate = itemTemplate + "<input type=\"checkbox\" />";
        }
        itemTemplate = itemTemplate + itemText + "</li>";
        $(_listPanel).append(itemTemplate);
    };

    //获得下拉框中对应的文本
    this.GetItemText = function(itemValue)
    {
        drpList_FindText(_itemList, itemValue);
    };

    //获得当前选中项目的文本
    this.GetText = function()
    {
        return _itemText;
    };

    //获得当前选中项目的值
    this.GetValue = function()
    {
        return _itemValue;
    };

    //选中特定项目
    this.SelectItem = function(itemValue, noEvent)
    {
        _itemValue = itemValue;
        _itemText = GetItemText(_itemValue);

        if(_sender.tagName == "INPUT")
        {
            $(_sender).val(_itemText);
        }
        else
        {
            $(_sender).text(_itemText);
        }

        if(_itemValue != _input.value)
        {
            _input.value = _itemValue;
            if(noEvent == null || noEvent == false)
            {
                _this.onchange();
            }
        }

        if(_multiSelect)
        {
            $(_listPanel).html("");
            var itemtemplate = "";
            for(var i=0;i<_itemList.length;i++)
            {
                itemtemplate = "<li itemvalue=\"" + _itemList[i].ItemValue + "\">";
                if(_multiSelect)
                {
                    itemtemplate = itemtemplate + "<input type=\"checkbox\"";
                    if(("," + _itemValue + ",").indexOf("," + _itemList[i].ItemValue + ",") != -1)
                    {
                        itemtemplate = itemtemplate + " checked=\"checked\" ";
                    }
                    itemtemplate = itemtemplate + " />";
                }
                itemtemplate = itemtemplate + _itemList[i].ItemText;
                itemtemplate = itemtemplate + "</li>";

                $(_listPanel).append(itemtemplate);
            }
        }
    };

    //删除列表中的项目
    this.DeleteItem = function(itemValue)
    {
        for(var indx=0; indx< _itemList.length; indx++)
        {
            if(_itemList[indx].ItemValue == itemValue)
            {
                _itemList.splice(indx,1);
                break;
            }
        }

        $(_listPanel).find("li[itemvalue='"+ itemValue +"']").remove();

        if(("," + _itemValue + ",").indexOf("," + itemValue + ",") != -1)
        {
            _itemValue = DeleteValue(_itemValue, itemValue);            
            _itemText = GetItemText(_itemValue);
            _input.value = _itemValue;
            if(_sender.tagName == "INPUT")
            {
                $(_sender).val(_itemText);
            }
            else
            {
                $(_sender).text(_itemText);
            }
        }

        if(_maxHeight != null)
        {
            if($(_listPanel).height() ==_maxHeight)
            {
                $(_listPanel).css({height: "auto", "overflow-y": ""});
            };
        }
    };

    //清空列表
    this.ClearItem = function()
    {
        _itemList.splice(0, _itemList.length);
        $(_listPanel).find("li").remove();

        _itemValue =  "";           
        _itemText = "";
        _input.value = _itemValue;

        if(_sender.tagName == "INPUT")
        {
            $(_sender).val(_itemText);
        }
        else
        {
            $(_sender).text(_itemText);
        }

        if(_maxHeight != null)
        {
            if($(_listPanel).height() ==_maxHeight)
            {
                $(_listPanel).css({height: "auto", "overflow-y": ""});
            };
        }
    };

    //变更事件
    this.onchange = new Function;
    
    this.Initiate();
}
