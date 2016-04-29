
function LocationlDropList(params)
{
    var _this = this;
    var _itemID = params.ItemID;
    var _itemName = params.ItemName;
    var _cityAjaxUrl = params.CityAjaxUrl;//获取城市的ajax地址
    var _provinceDropListClassName = params.ProvinceDropListClassName;
    var _cityDropListClassName = params.CityDropListClassName;
    var _provinceSender = params.ProvinceSender;
    var _citySender = params.CitySender;
    var _dropListMaxHeight = params.DropListMaxHeight;
    var _provinceItems = params.ProvinceItems;
    var _optionLabel = params.OptionLabel;
    var _optionLabelProvince = params.OptionLabelProvince;
    var _zIndex = params.ZIndex;
    var _offsetUpdate = params.OffsetUpdate;
    
    var _provinceSel = params.ProvinceSelector;
    var _citySel = params.CitySelector;

    var _provinceChanged = function (citycode, cb){
       _citySel.ClearItem();
       _citySel.Add("", _optionLabel);
       
       $.post(_cityAjaxUrl, { pid: _provinceSel.GetValue() },
       function(result) {
           if (result == null) return;
           for (var i = 0; result[i]; i++) {
               _citySel.Add(result[i].Value, result[i].Key);
               //if(result.length == 1) _citySel.SelectItem(result[i].Value);                
           }
           if(result.length > 0) _citySel.SelectItem(result[0].Value);
           if(citycode){
                _citySel.SelectItem(citycode);
                if(cb) {
                    cb();
                }
           }
           
           if(_citySel.GetValue() == ""){
               _citySel.SelectItem("");
           }
       }, 'json');
    };
    
    _this.SelectLocation = function(ProvinceCode, CityCode, cb){
        _provinceSel.SelectItem(ProvinceCode, true);
        _provinceChanged(CityCode, cb);
    };
    

    $(function(){
        if(_provinceSel == null){
        _provinceSel  = eval("window.select_" + _itemID + "Province");
        _provinceSel = new lDropList({
           ItemID:  _itemID +"Province"
            ,ItemName: _itemName + "Province"
            ,ItemValue: ""
           ,ClassName: _provinceDropListClassName
           ,SenderElement:_provinceSender
           ,ZIndex:_zIndex
           ,MaxHeight:_dropListMaxHeight
           });
           _provinceSel.ClearItem();
           _provinceSel.Add("", _optionLabelProvince);

            for(var i=0; i< _provinceItems.length; i++){
                _provinceSel.Add(_provinceItems[i].Code, _provinceItems[i].Name);
            }
           _provinceSel.SelectItem("");
        }
       _provinceSel.onchange = _provinceChanged;

        if(_citySel == null){
        _citySel = eval("window.select_" + _itemID);
        _citySel = new lDropList({
           ItemID: _itemID
            ,ItemName: _itemName
            ,ItemValue: ""
            ,ClassName: _cityDropListClassName
            ,SenderElement:_citySender
            ,ZIndex:_zIndex
            ,OffsetUpdate: _offsetUpdate
            ,MaxHeight:_dropListMaxHeight
           });
        }
//       _citySel.ClearItem();
//       _citySel.SelectItem("");
   });
}

