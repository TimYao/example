/*
 */
function jsModelDialog(parms){
    var _this = this;
    var _dialog = parms.Instance;
    var _dialogWidth = parms.Width;
    var _dialogHtml = parms.ContentHTML;
    var _zIndex = parms.ZIndex;
    var _sender = parms.Sender;
    var _height = parms.Height;

    if(_dialog == null){
        _dialog =  document.createElement('div');
        document.body.appendChild(_dialog);
    }
    _dialog.style.position = "absolute";
    if(_height == null){
        _dialog.style.height = "auto";
    }else{
        _dialog.style.height = _height + "px";
    }

    $(_dialog).hide();

    if(_dialogWidth != null){
        _dialog.style.width = _dialogWidth + "px";
    }
    if(_dialogHtml != null)
    {
        _dialog.innerHTML = _dialogHtml;
    }

    var _dialogmask = document.getElementById('dialog-mask');
    if(_dialogmask == null)
    {
        _dialogmask = document.createElement('div');
        _dialogmask.id = 'dialog-mask';
        document.body.appendChild(_dialogmask);
        $(_dialogmask).hide();
    }

    $(_dialogmask).css("background", "none repeat scroll 0 0 #cccccc");
    $(_dialogmask).css("height", "100%");
    $(_dialogmask).css("width", "100%");
    $(_dialogmask).css("left", 0);
    $(_dialogmask).css("position", "absolute");
    $(_dialogmask).css("top", 0);
    $(_dialogmask).css("filter", "alpha(opacity=50)");/*IE*/
    $(_dialogmask).css("opacity", 0.5);///*Mozilla*/

    _this.RefreshDialogShow = function (heightmodify){
        var iframe = $(_dialog).find("iframe");

        if(iframe.length > 0){
            iframe.height(iframe.contents().find("body").outerHeight());
            if(_height == null){
                $(_dialog).height(iframe.outerHeight()+ (heightmodify?heightmodify:0));
            }
        }

        var dialogTop = Math.abs($(window).height() - $(_dialog).height()) / 2;
        if($(window).scrollTop() > 0){
            dialogTop = dialogTop + $(window).scrollTop()
        }
        $(_dialog).css("top", dialogTop + "px");
        $(_dialog).css('left', ($(window).width() - $(_dialog).outerWidth()) / 2);
    };

    _this.Hide = function(){
        $(_dialog).hide();
        $(_dialogmask).hide();
    };

    _this.Show = function(){
        $(_dialogmask).show();
        $(_dialogmask).height($(document).height());

        if(_zIndex != null){
            _dialogmask.style.zIndex = _zIndex;
            _dialog.style.zIndex = _zIndex + 1;
        }else{
            _dialogmask.style.zIndex = 999;
            _dialog.style.zIndex = 1000;
        }
        _this.RefreshDialogShow();
        $(_dialog).show();
        $(_dialogmask).show();
    };

    if(parms.Title != null){
        $(_dialog).find(".dialog-title").html(parms.Title);
    }

    $(_dialog).find(".dialog-close").click(function(){
        _this.Hide();
    });

    if(_sender != null){
        $(_sender).click(function(){
            _this.Show();
        });
    }
}