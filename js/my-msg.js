/**
 * Created by Ge.Song on 2016/4/12.
 * 这里是消息页面的所有js
 */
//* Initialize your app
var myApp = new Framework7({ swipeBackPage:false});
// *Export selectors engine
var $$ = Dom7;
// *Add view
var mainView = myApp.addView(".view-main", {});

mainView.params.doctorsno = GetQueryString("drsno");
mainView.params.customersno = GetQueryString("customersno");
mainView.params.asdoctorsno = GetQueryString("asdoctorsno");
mainView.params.msgback = "d";
//* 载入第一个首页
var loadpagename = GetQueryString("loadpagename");
if (loadpagename == undefined || loadpagename.length <= 0)
    loadpagename = "MsgMyPatientIndex.html";
mainView.loadPage({ url: loadpagename +  "?" + removeQueryStringParm("loadpagename"), animatePages: false });

var myTimerId;  //* 一个定时timer句柄

//* 页面载入时log下页面
$$(document).on("pageInit", function(e) {
    console.log("pagename: " + e.detail.page.name);
});

//页面回退记录回退状态
$$(document).on('pageBack', function (e) {
    var page = e.detail.page;
    if (page.name === 'Msg_Talking') {
        //从聊天回退到患者主页
        if (page.query.pageback == "MyPatient") {
            window.location = "MyPatient.html?loadpagename=PatientInfo.html&doctorsno=" + page.query.drsno + "&sno=" + page.query.customersno + "&pageback=PatientIndex";
        }
        else
        {
            window.Location = page.view.history;
            //mainView.loadPage({ url: "MsgMyPatientIndex.html" });
        }
       
    }
    if (page.name === 'Msg_ConsultingRecords') {
        //从咨询记录回退到患者主页
        if (page.query.pageback == "MyPatient") {
            window.location = "MyPatient.html?loadpagename=PatientInfo.html&doctorsno=" + page.query.drsno + "&sno=" + page.query.customersno + "&pageback=PatientIndex";
        }
        else {
            window.Location = page.view.history;
        }

    }



})



//==================== 首页-我的患者 ========================
myApp.onPageInit("Msg_MyPatientIndex", function () {
    var docsno = mainView.params.doctorsno;
    if(docsno == undefined || docsno.length <=0){
        myApp.alert("参数有误,未取得医生号码", function () { mainView.router.back(); });
        return;
    }
    mainView.params.msgback = "d";
    setUnreadMsgCount(0);
    //* 点击上方小秘书进入小秘书设定画面
    var objPage = $("div.page[data-page='Msg_MyPatientIndex']");

    //* 点选过滤条件显示隐藏名称列表图层
    objPage.find(".js_droptitle").click(function(){
        objPage.find(".js_dropitem").toggleClass("hidden");
        objPage.find(".js_droptitle").parent().toggleClass("active");
    });

    var mySearchbar = myApp.searchbar('.searchbar', {
        searchList: ".list-block-search",
        searchIn: ".item-title",
        found:".searchbar-found",
        notFoud:".searchbar-not-found",
        onDisable: function(){ objPage.find("#SecretaryLink").removeClass("hidden"); },
        onSearch : function(){ objPage.find("#SecretaryLink").addClass("hidden"); }
    });

    loadAgentList();

    //* 载入委托你的医生列表按钮
    function loadAgentList(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "doctor.getwhowantmeagent.go",
            postdata: {
                docsno:docsno
            },
            before: function () {
                myApp.showPreloader();
                objPage.find("#AgentNameList").html("");
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    for (var i = 0; i < rtn.data.length; i++) {
                        objPage.find("#AgentNameList").append("<div class='button col-25' data-doctorsno='" + rtn.data[i].doctorsno + "'>" + rtn.data[i].truename + "</div>");
                    }
                    var selectedfilter = mainView.params.mypatientfilter;
                    if(selectedfilter == undefined || selectedfilter.length <= 0 )
                        selectedfilter = "ME";
                    objPage.find("div.button.color-gray").removeClass("button-fill").removeClass("color-gray"); //*移除灰色选中按钮
                    objPage.find("div.button[data-doctorsno='" + selectedfilter+ "']").addClass("button-fill").addClass("color-gray"); //* 添加选中
                    objPage.find("#dropFilterName").text(objPage.find("div.button[data-doctorsno='" + selectedfilter+ "']").text());
                    loadContactList();

                    objPage.find(".js_dropitem_content div.button").unbind("click").click(function(){
                        objPage.find("div.button.color-gray").removeClass("button-fill").removeClass("color-gray"); //*移除灰色选中按钮
                        $(this).addClass("button-fill").addClass("color-gray"); //* 添加选中
                        objPage.find("#dropFilterName").text($(this).text());
                        loadContactList();    //* 载入下方通讯列表
                        objPage.find(".js_droptitle").click();  //* 触发点击关闭弹出层
                    });

                } else {
                    myApp.alert(rtn.msg, function () { mainView.router.back(); });
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }
    //* 载入当前过滤条件下你能看到的消息列表
    function loadContactList(){
        var asdocsno = objPage.find("div.button.color-gray").data("doctorsno");
        mainView.params.mypatientfilter = asdocsno;
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim2.getmsgcontactlist.go",
            postdata: {
                viewersno:docsno,
                asdoctorsno :asdocsno,
                fromtype: "c2d" //* 故意反好取资料
            },
            before: function () {
                myApp.showPreloader();
                objPage.find("#ulContactList li:gt(0)").remove();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    var compiledSearchTemplate = Template7.compile(objPage.find("script#TempalteContactList").html());
                    objPage.find("#ulContactList").append(compiledSearchTemplate(rtn));
                    objPage.find("#ulContactList div.swipeout-actions-right a.action").unbind("click").click(function(){
                        //* 点击消息列表右边的 置顶/取消置顶/已读/未读/删除
                        clickMarkAction($(this));
                    });
                    objPage.find("#ulContactList div.swipeout-content").click(function(){
                        //* 点击某条记录.进入明细对话页面
                        mainView.params.asdoctorsno = $(this).data("asdoctorsno");
                        mainView.params.customersno =  $(this).data("customersno");
                        mainView.router.load({url:"MsgTalking.html"});
                    });

                } else {
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });

    }
    //* 点击消息列表右边的 置顶/取消置顶/已读/未读/删除
    function clickMarkAction(obj){
        var action = obj.data("action");
        var summarysno = obj.data("summarysno");
        if(action == undefined || action.length <= 0 ||summarysno == undefined || summarysno.length <=0) {
            myApp.alert("参数不足");
            return;
        }
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim.markssgcontactpersonalsetting.go",
            postdata: {
                action:action,
                summarysno :summarysno
            },
            before: function () {
                myApp.showPreloader();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    loadContactList();
                } else {
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }
});

//==================== 小秘书设定 ==================
myApp.onPageInit("Msg_SecretarySetting", function () {
    var docsno = mainView.params.doctorsno;
    if(docsno == undefined || docsno.length <=0){
        myApp.alert("参数有误,未取得医生号码", function () { mainView.router.back(); });
        return;
    }
    var objPage = $("div.page[data-page='Msg_SecretarySetting']");

    //* 我只要它是搜索和遮罩
    var mySearchbar = myApp.searchbar('.searchbar', {
        onEnable : function(){ objPage.find("#ulsearch").html(""); objPage.find(".mishu-seachblock").removeClass("hidden"); },
        onDisable : function(){ objPage.find(".mishu-seachblock").addClass("hidden"); }
    });

    var prevval = "";
    objPage.find(".searchbar input[type='search']").change(function(){
        var val = objPage.find(".searchbar input[type='search']").val();
        if(val == prevval || val =="") { return; }
        prevval = val;
        searchDoctor(val);
    });

    loadSecretarySetting();

    //* 进入画面载入小秘书列表
    function loadSecretarySetting(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "doctor.getsecretarylist.go",
            postdata: {
                docsno:docsno
            },
            before: function () {
                myApp.showPreloader();
                objPage.find("#ulNowUse").html("");
                objPage.find("#ulSecretaryList").html("");
                mySearchbar.disable();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    var compiledSearchTemplate = Template7.compile(objPage.find("script#TempalteSecretaryItem").html());
                    for (var i = 0; i < rtn.nowusedata.length; i++) {
                        var html = compiledSearchTemplate(rtn.nowusedata[i]);
                        objPage.find("#ulNowUse").append(html);
                    }
                    for (var i = 0; i < rtn.data.length; i++) {
                        var html = compiledSearchTemplate(rtn.data[i]);
                        objPage.find("#ulSecretaryList").append( html);
                    }
                    setBindEvent(); //* 设置显示隐藏和绑定click事件
                } else {
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }

    //* 通过名字搜索医生
    function searchDoctor(val){
        var objdiv = objPage.find("#ulsearch");
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "doctor.searchdoctorbydoctorname.go",
            postdata: {
                doctorname : val,
                docsno : docsno
            },
            before: function () {
                objdiv.html("<li><label class=\"item-content\"><span class=\"preloader\" style=\"margin: 0 auto;\"></span></label></li>");
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    if(rtn.data.length > 0){
                        objdiv.html("");
                        var compiledSearchTemplate = Template7.compile(objPage.find("script#TempalteSecretaryItem").html());
                        for (var i = 0; i < rtn.data.length; i++) {
                            var html = compiledSearchTemplate(rtn.data[i]);
                            objdiv.append(html);
                        }
                    }else{
                        objdiv.html("<li><label class=\"item-content txtCenter\">抱歉，未找到搜索结果</label></li>");
                    }

                    setBindEvent(); //* 设置显示隐藏和绑定click事件
                } else {
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
            }
        });
    }

    //* 设置当前选中li的小秘书
    function setSecretary(liobj){
        var secretaryno = $(liobj).data("secretaryno");
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "doctor.setsecretary.go",
            postdata: {
                docsno:docsno,
                agentsno:secretaryno
            },
            before: function () {
                myApp.showPreloader();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    loadSecretarySetting();
                } else {
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }

    //* 取消当前小秘书绑定
    function unsetSecretary(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "doctor.unsetsecretary.go",
            postdata: {
                docsno:docsno
            },
            before: function () {
                myApp.showPreloader();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    loadSecretarySetting();
                    setBindEvent();
                } else {
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }

    //* 显示/隐藏 绑定点击事件
    function setBindEvent(){
        if(objPage.find("#ulNowUse li").length > 0)
        {
            objPage.find("#divnow").removeClass("hidden");  //* 显示上方小秘书
            objPage.find("#divnotnow").addClass("hidden");  //* 隐藏提示
        }else{
            objPage.find("#divnow").addClass("hidden");  //* 隐藏上方小秘书
            objPage.find("#divnotnow").removeClass("hidden");  //* 显示提示
        }
        //* 隐藏下方列表的取消button
        objPage.find("#divnow .js_btnCancelBind").removeClass("hidden");
        objPage.find("#ulSecretaryList .js_btnCancelBind").addClass("hidden");
        objPage.find("#ulsearch .js_btnCancelBind").addClass("hidden");


        //* 点选上方已设置的小秘书取消绑定
        objPage.find("#ulNowUse .js_btnCancelBind").unbind("click").click(function(){
            //* 已有需要confirm
            myApp.confirm('取消后小秘书将不再收到您患者的咨询消息','确定取消小秘书服务吗', function () {
                unsetSecretary();
            });
        });
        //* 点选下方列表设置为小秘书
        objPage.find("#ulNowUse li").unbind("click");

        objPage.find("#ulSecretaryList li, #ulsearch li").unbind("click").click(function(){
            var liobj = this;
            if($(liobj).data("secretaryno") != undefined && $(liobj).data("secretaryno").length > 0){
                if(objPage.find("#ulNowUse li").length > 0)
                {
                    //* 已有需要confirm
                    myApp.confirm('您已经选择了一位您的小秘书<br>确定替换TA吗','', function () {
                        setSecretary(liobj);
                    });
                }else{
                    //* 没有直接提交
                    myApp.confirm('您确定设置TA为您的小秘书吗','', function () {
                        setSecretary(liobj);
                    });
                }
            }
        });
    }
});

//==================== 聊天画面 ====================
myApp.onPageInit("Msg_Talking", function (){
    var asdoctorsno = mainView.params.asdoctorsno;
    var customersno = mainView.params.customersno;
    var doctorsno = mainView.params.doctorsno;

    if(asdoctorsno == undefined || asdoctorsno.length <=0){
        myApp.alert("参数有误,未取得医生号码", function () { mainView.router.back(); });
        return;
    }
    if(customersno == undefined || customersno.length <=0){
        myApp.alert("参数有误,未取得病人号码", function () { mainView.router.back(); });
        return;
    }
    if(doctorsno == undefined || doctorsno.length <=0){
        myApp.alert("参数有误,未取得当前用户号码", function () { mainView.router.back(); });
        return;
    }

    var objPage = $("div.page[data-page='Msg_Talking']");


    var bSending = false;  //* 是否正在发送
    var doctorname = "";    //* 医生名字
    var doctorpic = "";     //* 医生头像
    var curdt = null;       //* 上次显示时间提示的时间.如果超过20分钟需要重新显示时间
    var oldestDt = new Date();  //* 最老的时间(用于查看更老的历史)

    objPage.find("#tabDoctor").click(function(){
        location.href = "MyPatient.html?loadpagename=PatientInfo.html&doctorsno=" + doctorsno + "&sno=" + customersno + "&asdoctorsno=" + asdoctorsno + "&pageback=PatientIndex";
    });
    objPage.find("#tabTalk").click(function(){  mainView.router.load({url:"MsgTalking.html"             , animatePages: false }); });
    objPage.find("#tabRecords").click(function(){  mainView.router.load({url:"MsgConsultingRecords.html", animatePages: false }); });
    //* hack一下.framework7为了下拉滚动的布局会自动设置一个minheight是windows+20px.
    //* 这样我们如果进入画面时滚动到最底会让上方的消息只显示一半.所以这里在页面载入时重新定个比较小的minheight令其失效
    objPage.find('.page-content-inner').css('min-height', '1px');

    objPage.find("#backlink").click(function () {
        var backlink = GetQueryString("back");
        if (backlink) {
            location.href = 'MyPatient.html?loadpagename=' + backlink + ".html&&doctorsno=" + GetQueryString("drsno") + "&&sno=" + GetQueryString("customersno");
        }

        if(mainView.params.msgback == "g")
            mainView.router.load({url:"MsgGroupPatientIndex.html" });
        else
            mainView.router.load({url:"MsgMyPatientIndex.html" });
    });

    var myMessages = myApp.messages('.messages',{autoLayout :false, messageTemplate:objPage.find("script#TemplateTalkItem2").html() });
    initTalkPage();

    //================ 进入画面载入历史记录 =================
    //* 载入初始资料
    function initTalkPage(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim2.getmsghistory.go",
            postdata: {
                customersno: customersno,
                doctorsno: asdoctorsno,
                viewersno: doctorsno
            },
            before: function () {
                myApp.showPreloader();
            },
            success:function(rtn){
                if (rtn.issuccess) {
                    doctorname = rtn.doctorname;
                    doctorpic = rtn.doctorpic;
                    objPage.find(".navbar-inner .center.sliding").text(rtn.customername);
                    showServerTalkList(rtn.data);
                    myTimerId = setInterval(function () {
                        getLatestMsg(customersno,asdoctorsno,doctorsno);
                    }, 10000);
                } else {
                    myApp.alert(rtn.msg, function () { mainView.router.back(); });
                }
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }
    //* 将server端的资料处理.
    function showServerTalkList(list){
        var arr = new Array();
        for (var i = 0; i < list.length; i++) {
            var isMySend = (list[i].realsendersno ==  doctorsno);   //* 是否是我自己发的
            var isDoctorSend = (list[i].fromtype == 'd2c' || list[i].fromtype == 'g2c');    //* 是否是医生发的
            var msg2 = {
                msgid : list[i].sno,
                createdt : list[i].createdt,
                type : isMySend ? "sent" : "received",
                hasImage : list[i].picsrc != null && list[i].picsrc.length > 0,
                avatar : isMySend ? list[i].realsenderpic : isDoctorSend ? list[i].realsenderpic : list[i].customerpic,
                name : isMySend? "" : isDoctorSend ? list[i].realsendername : list[i].customername,
                text : list[i].picsrc.length > 0 ? "<img src='"+ list[i].picsrc + "' class='lazy js_img'>" : transformUrl(list[i].textinfo)
            };

            if (curdt == null || curdt.dateDiff("n", msg2.createdt) > 20)
            {
                curdt = msg2.createdt;
                msg2.day = getShowDt(msg2.createdt);
            }
            if (oldestDt.dateDiff("s", msg2.createdt) < 0) {
                if (oldestDt.dateDiff("n", msg2.createdt) < -20) {
                    msg2.day = getShowDt(msg2.createdt);
                }
                oldestDt = msg2.createdt;
            }
            arr.push(msg2);
        }
        myMessages.addMessages(arr,"append");
        scrollBottom();
        bindTalkImgClick();
    }

    function showServerTalkListTop(list){
        var arr = new Array();
        for (var i = list.length - 1 ; i >= 0; i--) {
            var isMySend = (list[i].realsendersno ==  doctorsno);   //* 是否是我自己发的
            var isDoctorSend = (list[i].fromtype == 'd2c' || list[i].fromtype == 'g2c');    //* 是否是医生发的
            var msg2 = {
                msgid : list[i].sno,
                createdt : list[i].createdt,
                type : isMySend ? "sent" : "received",
                hasImage : list[i].picsrc != null && list[i].picsrc.length > 0,
                avatar : isMySend ? list[i].realsenderpic : isDoctorSend ? list[i].realsenderpic : list[i].customerpic,
                name : isMySend? "" : isDoctorSend ? list[i].realsendername : list[i].customername,
                text : list[i].picsrc.length > 0 ? "<img src='"+ list[i].picsrc + "' class='lazy js_img'>" : transformUrl(list[i].textinfo)
            };

            if (curdt == null || curdt.dateDiff("n", msg2.createdt) > 20)
            {
                curdt = msg2.createdt;
                msg2.day = getShowDt(msg2.createdt);
            }
            if (oldestDt.dateDiff("s", msg2.createdt) < 0) {
                if (oldestDt.dateDiff("n", msg2.createdt) < -20) {
                    msg2.day = getShowDt(msg2.createdt);
                }
                oldestDt = msg2.createdt;
            }
            arr.push(msg2);
        }
        myMessages.addMessages(arr,"prepend");
        bindTalkImgClick();
    }
    function getShowDt(createdt){
        var today = new Date();
        if(createdt.getMonth() == today.getMonth() && createdt.getDate() == today.getDate())
            return createdt.format("今天 HH:mm");
        if(createdt.getMonth() == today.getMonth() && createdt.getDate() == today.getDate() - 1)
            return createdt.format("昨天 HH:mm");
        else
            return createdt.format("yyyy-MM-dd HH:mm");
    }
    //================ 发送文字消息 =================
    objPage.find(".send-message").click(function(){
        var msg = objPage.find("#chat-content").val();
        if (msg.trim() == "") {
            myApp.alert("不能发送空消息", "提示", function () {
                objPage.find("#chat-content").focus();
            });
            return;
        }
        objPage.find("#chat-content").val("");
        var msgId = Math.random().toString(36).substr(2);
        var msg2 = {
            msgid : msgId,
            type : "sent" ,
            hasImage : false,
            avatar : doctorpic,
            name : "",
            text : transformUrl(msg)
        };
        myMessages.addMessage(msg2);
        scrollBottom();
        bindTalkImgClick();
        objPage.find("#" + msgId).append($("#" + msgId).append("<img class='loadimg' src='img/loading.gif' style='margin: 12px; width: 1.8em; height: 1.8em; float: right;' />"));
        sendTxtMsg(msgId, msg);
    });
    //* 发送文字消息
    function sendTxtMsg(msgId,msg){
        bSending = true;
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim2.sendtxtmsg.go",
            postdata: {
                customersno: customersno,
                doctorsno: asdoctorsno,
                viewersno: doctorsno,
                msgtype: 'txt',
                content : msg
            },
            success:function(rtn){
                if (rtn.issuccess) {
                    objPage.find("#" + msgId).addClass("sendedmsg");
                } else {
                    objPage.find("#" + msgId).append("<div class='message-label'>" + rtn.msg +"</div>");
                }
            },
            fail:function(){
                objPage.find("#" + msgId).append("<div class='message-label'>发送失败</div>");
            },
            complete: function () {
                objPage.find("#" + msgId +" .loadimg").remove();
                if(objPage.find("img.loadimg").size() <= 0){
                    bSending = false;
                    getLatestMsg();
                }
            }
        });
    }
    //* 输入框获取焦点显示内容到底部
    objPage.find("#chat-content").click(function () { scrollBottom(); });

    //================ 发送图片消息 =================
    objPage.find("#message-photo").click(function () {
        var buttons1 = [
            {
                text: '拍照',
                color: 'black',
                onClick: function () {
                    var pictureSource;      //图片来源
                    var destinationType;        //设置返回值的格式
                    // 等待PhoneGap连接设备
                    document.addEventListener("deviceready", onDeviceReady, false);
                    // PhoneGap准备就绪，可以使用！
                    function onDeviceReady() {
                        pictureSource = navigator.camera.PictureSourceType;
                        destinationType = navigator.camera.DestinationType;
                    }
                    navigator.camera.getPicture(onSuccess, onFail, {
                        quality: 50,
                        destinationType: Camera.DestinationType.DATA_URL
                    });
                    function onSuccess(imageData) {
                        sendImgMsg(imageData);
                    }
                    function onFail(message) {
                        $("#chat-screen").append("<li class='time-record'><time>" + message +"</time></li>");
                        //alert('Failed because: ' + message);
                    }
                }
            },
            {
                text: '<label for="fileInput"  style="display:block;">从相册选取</label>',
                color: 'black',
                onClick: function () {
                }
            }
        ];
        var buttons2 = [
            {
                text: '取消',
                color: 'black'
            }
        ];
        var groups = [buttons1, buttons2];
        myApp.actions(groups);
    });

    $("#fileInput").localResizeIMG({
        width: 400,//宽度
        quality: 0.8,//质量
        success: function (result) { sendImgMsg(result.clearBase64); }
    });
    //* 发送图片.
    function sendImgMsg(imgdata){
        bSending = true;
        //* 这里imgdata必须是带头的base64,例如 "data:image/jpeg;base64," + img;
        var msgId = Math.random().toString(36).substr(2);
        var msg2 = {
            msgid : msgId,
            type : "sent" ,
            hasImage : true,
            avatar : doctorpic,
            name : "",
            text : "<img src='data:image/jpeg;base64," + imgdata + "' class='lazy js_img' />"
        };
        myMessages.addMessage(msg2);
        scrollBottom();
        bindTalkImgClick();

        objPage.find("#" + msgId).append(
            $("#" + msgId).append("<img class='loadimg' src='img/loading.gif' style='margin: 12px; width: 1.8em; height: 1.8em; float: right;' />")
        );
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim2.SendFileMsg.go",
            postdata: {
                customersno: customersno,
                doctorsno: asdoctorsno,
                viewersno: doctorsno,
                imagedata:imgdata
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    objPage.find("#" + msgId).addClass("sendedmsg");
                } else {
                    objPage.find("#" + msgId).append("<div class='message-label'> " + rtn.msg + "</div>");
                }
            },
            fail: function () {
                objPage.find("#" + msgId).append("<div class='message-label'>发送失败</div>");
            },
            complete: function () {
                objPage.find("#" + msgId +" .loadimg").remove();
                if(objPage.find("img.loadimg").size() <= 0){
                    bSending = false;
                    getLatestMsg();
                }
            }
        });
    }
    //================ 定时收取消息 =================

    //* 显示更新的消息
    function getLatestMsg(customersno,doctorsno,viewersno){
        if($("div.view-main").attr("data-page") != "Msg_Talking"){
            console.log("不是talk当前页面.取消更新");
            //clearInterval(myTimerId);
            return;
        }
        if(bSending || objPage.find("img.loadimg").size() > 0)
            return;

        console.log("get");
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim2.getunreadmsg.go",
            postdata: {
                customersno: customersno,
                doctorsno: doctorsno,
                viewersno: viewersno
            },
            success:function(rtn){
                if (rtn.issuccess) {
                    myMessages.removeMessage(".messages .sendedmsg");
                    //objPage.find(".messages .sendedmsg").remove();
                    if(rtn.data.length > 0 ){
                        showServerTalkList(rtn.data);
                    }
                }
            }
        });
    }

    //================ 下拉取得更早消息 =================
    var ptrContent = $$('.pull-to-refresh-content');
    // 添加'refresh'监听器
    ptrContent.on('refresh', function () {
        if (bSending == true || objPage.find("img.loadimg").size() > 0) {
            myApp.pullToRefreshDone();
            return;
        }
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim2.getoldermsg.go",
            postdata: {
                customersno: customersno,
                doctorsno: asdoctorsno,
                viewersno: doctorsno,
                startDt: oldestDt.format("yyyy-MM-dd HH:mm:ss"),
                oldestsno : objPage.find("div.messages div.message:eq(0)").attr("id")
            },
            before: function () {
                bSending = true;
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    if(rtn.data.length > 0){
                        showServerTalkListTop(rtn.data);
                    }
                } else {
                    myApp.alert(rtn.msg);
                }
            },
            complete: function () {
                myApp.pullToRefreshDone();
                bSending = false;
            }
        });
    });

    //================ OTHER ==========================
    //* 滚动到最底
    function scrollBottom() {
        objPage.find("#talkpagecontent").scrollTop = objPage.find("#talkpagecontent").scrollHeight;
        try {
            document.getElementById('talkpagecontent').scrollTop = document.getElementById('talkpagecontent').scrollHeight;
        }catch(err){
        }
    }

    //* 绑定聊天中图片的
    function bindTalkImgClick() {
        objPage.find(".messages .js_img").unbind("click").click(function () {
            var myPhotoBrowserPopupDark = myApp.photoBrowser({
                photos: [$(this).attr("src")],
                theme: 'dark'
            });
            myPhotoBrowserPopupDark.open($(this).data("no"));
        });
    }
    function transformUrl(str){
        var reg = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g;
        return str.replace(reg, "<a target='_blank' href='$1$2' class='external'>$1$2</a>");
    };
});
myApp.onPageBeforeRemove("Msg_Talking", function () {
    console.log("talk页面Remove.timmer取消");
    clearInterval(myTimerId);
});

//==================== 诊疗记录 ====================
myApp.onPageInit("Msg_ConsultingRecords", function () {
    var doctorsno = mainView.params.asdoctorsno;
    var customersno = mainView.params.customersno;
    var viewersno = mainView.params.doctorsno;
    if(doctorsno == undefined || doctorsno.length <=0){
        myApp.alert("参数有误,未取得医生号码", function () { mainView.router.back(); });
        return;
    }
    if(customersno == undefined || customersno.length <=0){
        myApp.alert("参数有误,未取得病人号码", function () { mainView.router.back(); });
        return;
    }
    if(viewersno == undefined || viewersno.length <=0){
        myApp.alert("参数有误,未取得当前用户号码", function () { mainView.router.back(); });
        return;
    }

    var objPage = $("div.page[data-page='Msg_ConsultingRecords']");
    var aryRecords; //* 图片列表,keydt=图片日期,picsrc=图片地址


    objPage.find("#tabDoctor").click(function () {
        location.href = "MyPatient.html?loadpagename=PatientInfo.html&doctorsno=" + viewersno + "&sno=" + customersno + "&asdoctorsno=" + doctorsno +"&pageback=PatientIndex";


    });
    objPage.find("#tabTalk").click(function () { mainView.router.load({ url: "MsgTalking.html", animatePages: false }); });
    objPage.find("#tabRecords").click(function(){  mainView.router.load({url:"MsgConsultingRecords.html", animatePages: false }); });
    objPage.find("#backlink").click(function(){
        if(mainView.params.msgback == "g")
            mainView.router.load({url:"MsgGroupPatientIndex.html" });
        else
            mainView.router.load({url:"MsgMyPatientIndex.html" });
    });
    loadConsultingRecords();
    //* 进入画面载入日期和图片列表.初始化下拉选单
    function loadConsultingRecords(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim2.getconsultingrecords.go",
            postdata: {
                customersno : customersno,
                doctorsno : viewersno
            },
            before: function () {
                myApp.showPreloader();
                objPage.find("#selRecordDt").html("");  //* 下拉选单清空
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    objPage.find(".navbar-inner .center.sliding").text(rtn.customername);
                    if(rtn.data.length > 0){
                        aryRecords = rtn.data;
                        for (var i = 0; i < aryRecords.length; i++) {
                            aryRecords[i].keydt =  aryRecords[i].lastchangedt.format("yyyyMMdd");
                            if(objPage.find("#selRecordDt option[value='" + aryRecords[i].keydt + "']").size()  <= 0)
                                objPage.find("#selRecordDt").append("<option value='"+ aryRecords[i].keydt +"'>" + aryRecords[i].lastchangedt.format("yyyy年MM月dd日") +"</option>");
                        }
                        objPage.find("#selRecordDt").change();
                    }else{
                        //* 没记录
                        objPage.find("#selRecordDt").append("<option value=''>近7天无可供显示的图片</option>");
                    }
                } else {
                    myApp.alert(rtn.msg, function () { mainView.router.back(); });
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }

    //* 当日期选择改变时带出该天的图片信息
    objPage.find("#selRecordDt").change(function(){
        var dt = objPage.find("#selRecordDt").val();
        if(aryRecords == undefined || aryRecords.length <= 0
            ||objPage.find("#selRecordDt").val() == undefined ||objPage.find("#selRecordDt").val() == "")
            return;

        objPage.find("ul.figure-list").html("");    //* 下方LIST
        var aryImg = new Array();
        for(var i = 0; i < aryRecords.length;i++){
            if(aryRecords[i].keydt == dt && aryRecords[i].picsrc.length > 0){
                var strHtml = "<li data-no='"+aryImg.length+"'><figure style='background-image:url(" + aryRecords[i].picsrc +")'></figure></li>";
                //* 是这天的图片记录就列在下面
                objPage.find("ul.figure-list").append(strHtml);
                aryImg[aryImg.length] = aryRecords[i].picsrc;
            }
        }

        var myPhotoBrowserPopupDark = myApp.photoBrowser({
            photos : aryImg,
            theme: 'dark'
        });

        //* 点选图片预览
        $("ul.figure-list li").unbind("click").click(function () {
            myPhotoBrowserPopupDark.open($(this).data("no"));
        });
    });
});

//==================== 科室患者 ====================
myApp.onPageInit("Msg_GroupPatientIndex", function () {
    var objPage = $("div.page[data-page='Msg_GroupPatientIndex']");
    objPage.find(".OfficePatientTab .txtRight").click(function(){ mainView.router.load({url:"MsgMyPatientIndex.html"}); });
    var docsno = mainView.params.doctorsno;
    if(docsno == undefined || docsno.length <=0){
        myApp.alert("参数有误,未取得医生号码", function () { mainView.router.back(); });
        return;
    }
    mainView.params.msgback = "g";

    var subgroupsno = "";

    $.Frame.Ajax.Ajax({
        url: $.Frame.Config.Constant.ServerUrl + "doctor.getsubgroupsnobydoctorsno.go",
        postdata: {
            docsno:docsno
        },
        before: function () {
            myApp.showPreloader();
        },
        success: function (rtn) {
            if (rtn.issuccess)
                subgroupsno = rtn.subgroupsno;
        },
        error:function(){
            myApp.alert("error");
        },
        complete: function () {
            myApp.hidePreloader();
            //* 没有科组信息
            if(subgroupsno == ""){
                myApp.alert("暂无您的科室信息", function () { mainView.router.back(); });
                return;
            }
            mainView.params.subgroupsno = subgroupsno;
            //* 载入聊天对话
            loadContactList();
        }
    });

    //* 载入聊天对话
    function loadContactList(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim2.getmsgcontactlist.go",
            postdata: {
                viewersno:docsno,
                asdoctorsno :subgroupsno,
                fromtype: "c2g" //*故意写反
            },
            before: function () {
                myApp.showPreloader();
                objPage.find("#ulGroupContactList li").remove();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    if(rtn.contactlist.length > 0) {
                        //* 科室患者如果设置了免打搅就没有红点
                        if (rtn.nodisturb == "1" && rtn.contactlist != undefined) {
                            for (var i = 0; i < rtn.contactlist.length; i++) {
                                rtn.contactlist[i].noreadcount = 0;
                            }
                        }
                        var compiledSearchTemplate = Template7.compile(objPage.find("script#TempalteGroupContactList").html());
                        objPage.find("#ulGroupContactList").append(compiledSearchTemplate(rtn));
                        objPage.find("#ulGroupContactList div.swipeout-actions-right a.action").unbind("click").click(function () {
                            //* 点击消息列表右边的 置顶/取消置顶/已读/未读/删除
                            clickMarkAction($(this));
                        });

                        objPage.find("#ulGroupContactList div.swipeout-content").click(function () {
                            mainView.params.asdoctorsno = $(this).data("asdoctorsno");
                            mainView.params.customersno = $(this).data("customersno");
                            mainView.router.load({url: "MsgTalking.html"});
                        });
                    }else{
                        objPage.find("#divgrouplist").addClass("hidden");
                    }
                } else {
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }

    //* 点击消息列表右边的 置顶/取消置顶/已读/未读/删除
    function clickMarkAction(obj){
        var action = obj.data("action");
        var summarysno = obj.data("summarysno");
        if(action == undefined || action.length <= 0 ||summarysno == undefined || summarysno.length <=0) {
            myApp.alert("参数不足");
            return;
        }
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "webim.markssgcontactpersonalsetting.go",
            postdata: {
                action:action,
                summarysno :summarysno
            },
            before: function () {
                myApp.showPreloader();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    loadContactList();
                } else {
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }
});

//==================== 全部患者 ====================
myApp.onPageInit("Msg_GroupPatientList", function () {
    var objPage = $("div.page[data-page='Msg_GroupPatientList']");
    var docsno = mainView.params.doctorsno;
    if(docsno == undefined || docsno.length <=0){
        myApp.alert("参数有误,未取得医生号码", function () { mainView.router.back(); });
        return;
    }
    var subgroupsno = mainView.params.subgroupsno;
    if(subgroupsno == undefined || subgroupsno.length <=0){
        myApp.alert("参数有误,未取得科室号码", function () { mainView.router.back(); });
        return;
    }

    $.Frame.Ajax.Ajax({
        url: $.Frame.Config.Constant.ServerUrl + "mypatient.getpatientlistfromsubgroupsno.go",
        postdata: {
            subgroupsno:subgroupsno
        },
        before: function () {
            myApp.showPreloader();
            objPage.find("#ulPatientList li").remove()
        },
        success: function (rtn) {
            if (rtn.issuccess) {
                var compiledSearchTemplate = Template7.compile(objPage.find("script#TempaltePatientList").html());
                objPage.find("#ulPatientList").append(compiledSearchTemplate(rtn));
            }
        },
        error:function(){
            myApp.alert("error");
        },
        complete: function () {
            myApp.hidePreloader();
        }
    });

});

//==================== 科室医生 ====================
myApp.onPageInit("Msg_GroupDoctorList", function () {
    var objPage = $("div.page[data-page='Msg_GroupDoctorList']");
    var docsno = mainView.params.doctorsno;
    if(docsno == undefined || docsno.length <=0){
        myApp.alert("参数有误,未取得医生号码", function () { mainView.router.back(); });
        return;
    }
    var subgroupsno = mainView.params.subgroupsno;
    if(subgroupsno == undefined || subgroupsno.length <=0){
        myApp.alert("参数有误,未取得科室号码", function () { mainView.router.back(); });
        return;
    }
    showmore();

    function showmore(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "doctor.getlistbysubgroupsno.go",
            postdata: {
                subgroupsno:subgroupsno,
                toPage: objPage.find("#toPage").val(),
                Count_per_Page: 999999
            },
            before: function () {
                myApp.showPreloader();
                //objPage.find("#uldoctorlist li").remove()
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    $("#more").remove();
                    var compiledSearchTemplate = Template7.compile(objPage.find("script#TempalteDoctorList").html());
                    objPage.find("#uldoctorlist").append(compiledSearchTemplate(rtn));
                    if (rtn.totalpage > parseInt(objPage.find("#toPage").val())) {
                        objPage.find("#toPage").val(parseInt(objPage.find("#toPage").val()) + 1);
                        objPage.find("#uldoctorlist").append("<li id='more' style='text-align:center' ><a style='color: #999999;text-decoration: none;' >加载更多</a></li>");
                        objPage.find("li#more").click(function(){ showmore(); });
                    }
                }else{
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }


});

//==================== 设置免打搅 ====================
myApp.onPageInit("Msg_NoDisturb", function () {
    var objPage = $("div.page[data-page='Msg_NoDisturb']");
    var docsno = mainView.params.doctorsno;
    if(docsno == undefined || docsno.length <=0){
        myApp.alert("参数有误,未取得医生号码", function () { mainView.router.back(); });
        return;
    }
    initPage();
    function initPage(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "doctor.getnodisturbsetting.go",
            postdata: {
                doctorsno:docsno
            },
            before: function () {
                myApp.showPreloader();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    if(rtn.nodisturb =="1")
                        objPage.find("#chkNoDisturb").prop("checked",true);
                    else
                        objPage.find("#chkNoDisturb").prop("checked",false);
                    objPage.find("#chkNoDisturb").change(function(){ setNoDisturb(); });
                }else{
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }
    function setNoDisturb(){
        var val = 0;
        if(objPage.find("#chkNoDisturb").prop("checked"))
            val = 1;
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "doctor.setnodisturb.go",
            postdata: {
                doctorsno:docsno,
                val:val
            },
            before: function () {
                myApp.showPreloader();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    //myApp.alert("设置成功");
                }else{
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }



});

//==================== 科室患者明细 ====================
myApp.onPageInit("Msg_PatientDetail", function (page) {
    var objPage = $("div.page[data-page='Msg_PatientDetail']");
    var docsno = mainView.params.doctorsno;
    if(docsno == undefined || docsno.length <=0){
        myApp.alert("参数有误,未取得医生号码", function () { mainView.router.back(); });
        return;
    }
    var custsno = page.query.customersno;
    if(custsno == undefined || custsno.length <=0){
        myApp.alert("参数有误,未取得病人号码", function () { mainView.router.back(); });
        return;
    }
    objPage.find("#btnAddFollowing").click(function(){ setFollowing(); });
    initPage();
    function initPage(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "mypatient.getpatientdetailinfo.go",
            postdata: {
                doctorsno: docsno,
                sno: custsno
            },
            before: function () {
                myApp.showPreloader();
            },
            success: function (rtn) {
                if (rtn.issuccess) {
                    objPage.find("#headName").text(rtn.userinfo[0].truename);
                    objPage.find("#lbName").text(rtn.userinfo[0].truename);
                    objPage.find("#imgHeadpic").attr("src", rtn.userinfo[0].picsrc);
                    objPage.find("#lbphone").text(rtn.userinfo[0].logincellphone);
                    objPage.find("#alink").attr("href", "tel:" + rtn.userinfo[0].logincellphone);
                    if(rtn.userinfo[0].sextype == '0')
                        objPage.find("#imgSex").attr("src", "img/male.png");
                    else if(rtn.userinfo[0].sextype == '0')
                        objPage.find("#imgSex").attr("src", "img/female.png");
                    else
                        objPage.find("#imgSex").remove();
                    if(rtn.userinfo[0].age > 0)
                        objPage.find("#lbAge").text(rtn.userinfo[0].age + "岁");
                    //* 如果已经是自己患者了就不显示toolbar
                    if(rtn.isfocus)
                        objPage.find("div.toolbar").addClass("hidden");
                }else{
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }

    function setFollowing(){
        $.Frame.Ajax.Ajax({
            url: $.Frame.Config.Constant.ServerUrl + "doctor.Following.go",
            postdata: {
                doctorsno: docsno,
                customersno: custsno
            },
            before: function () {
                myApp.showPreloader();
            },
            success: function (rtn) {
                if (rtn.state == 1) {
                    myApp.alert("添加成功");
                    objPage.find("div.toolbar").addClass("hidden");
                }else{
                    myApp.alert(rtn.msg);
                }
            },
            error:function(){
                myApp.alert("error");
            },
            complete: function () {
                myApp.hidePreloader();
            }
        });
    }

});
