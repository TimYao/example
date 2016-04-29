/**
 * Created by Liujunjie on 14-1-15.
 */

function showMenu(str){

    $('#collapseOne').find('a').each(function(){
            if($(this).html() == str){
                $(this).attr('class', 'on');
                return false;
            }
        }
    );
}