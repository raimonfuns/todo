
function Gtd() {
    this.init();
}
Gtd.prototype = {
    init: function () {
        var _this = this;
        this.wrap = document.getElementById('wrap');

        // 左侧目录列表相关参数
        this.oTaskCategoryUl = this.wrap.getElementsByTagName('ul')[2]; // 左侧目录列表模块
        this.oContentMode = this.getByClass(this.wrap, 'task-cont')[0]; // 中间任务列表模块
        this.totalCount = this.getByClass(this.wrap, 'taskCount')[0]; // 全部任务总数
        this.sDefaultId = '/10000'; // 默认目录的id
        this.initLocalStorage(); // 初始化LocalStorage
        this.updateCategory(this.sDefaultId); // 初始化左侧目录
        this.aTaskCategory = this.oTaskCategoryUl.getElementsByTagName('li'); // 左侧目录列表li
        this.aListItem = this.oTaskCategoryUl.getElementsByTagName('a');
        this.oTargetAddOn = this.getByClass(this.oTaskCategoryUl, 'on')[0]; // 当前选中的分类
        this.aDeleteBtn = this.oTaskCategoryUl.getElementsByTagName('i');
        this.oAddCategoryBtn = document.getElementById('addCategory');
        this.oAddTaskBtn = document.getElementById('addTask');

        // 中间任务列表相关参数
        this.oProcess = document.getElementById('process');
        this.oProcessUl = this.oProcess.getElementsByTagName('ul')[0];
        this.aProcessFilterBtn = this.oProcessUl.getElementsByTagName('a');
        this.sProcessNow = 0; // 当前选中的任务状态 --- 所有
        this.oProcessContList = this.getByClass(this.oProcess, 'cont-list')[0];
        this.sTaskOnId = '/0'; // 当前选中的任务
        this.updateProcessList(this.sDefaultId); // 默认分类的id是 '/10000'

        // 任务详细内容输入，标题、时间、内容，全局使用
        this.oTitleInput = this.oContentMode.getElementsByTagName('input')[0];
        this.oDateInput = this.oContentMode.getElementsByTagName('input')[1];
        this.oContentTextarea = this.oContentMode.getElementsByTagName('textarea')[0];

         // 任务详细内容的按钮
        this.oTaskContentBtn = this.getByClass(this.oContentMode, 'btn-wrap')[0];
        this.oEditBtn = this.getByClass(this.oTaskContentBtn, 'edit-btn')[0];
        this.oFinishBtn = this.getByClass(this.oTaskContentBtn, 'finish-btn')[0];
        
        // 遮罩层
        this.oOverlayCode = document.getElementById('overlayCode');

        // 自定义prompt弹出框
        this.oPromptBoxWrap = document.getElementById('prompt-box-wrap');
        this.oPromptBoxInput = this.oPromptBoxWrap.getElementsByTagName('input')[0];
        this.oPromptBoxText = this.getByClass(this.oPromptBoxWrap, 'boxText')[0];
        this.oPromptSubmitBtn = this.getByClass(this.oPromptBoxWrap, 'boxSubmit')[0];

        // 自定义confirm弹出框
        this.oConfirmBoxWrap = document.getElementById('confirm-box-wrap');
        this.oConfirmBoxText = this.getByClass(this.oConfirmBoxWrap, 'boxText')[0];
        this.oConfirmBoxBtnSure = this.getByClass(this.oConfirmBoxWrap, 'boxBtnSure')[0];
        this.oConfirmBoxBtnCancel = this.getByClass(this.oConfirmBoxWrap, 'boxBtnCancel')[0];

        // 错误信息
        this.oError = document.getElementById('error');

        // 目录展开与收起
        this.taskTrigger();
        // 根据完成状态进行筛选
        this.filterTaskState();
        // 添加目录
        this.oAddCategoryBtn.onclick = function () { 
            _this.oPromptBoxInput.value = '';
            _this.oPromptBoxText.innerHTML = '请输入目录名称:';
            _this.showBox(_this.oPromptBoxWrap);
            _this.oPromptBoxInput.focus();
            _this.oPromptSubmitBtn.onclick = function () {
                _this.addCategory.call(_this);
                _this.hideBox(_this.oPromptBoxWrap);
            };
        };
        this.oPromptBoxInput.onkeydown = function (ev) {
            var oEvent = ev || event;
            if (oEvent.keyCode === 13) {
                _this.oPromptSubmitBtn.onclick();
            }
        };
        // 添加任务
        this.oAddTaskBtn.onclick = function () {_this.addTask.call(_this);}; // 添加任务
        this.oEditBtn.onclick = function () {_this.editTask.call(_this);}; // 编辑任务
        this.oFinishBtn.onclick = function () {_this.finishTask.call(_this);}; // 完成任务
        // 隐藏弹出框
        this.oOverlayCode.onclick = function () { 
            _this.oPromptBoxInput.value = '';
            _this.hideBox(_this.oPromptBoxWrap);
            _this.hideBox(_this.oConfirmBoxWrap);
        };
    },
    // 初始化LocalStorag
    initLocalStorage: function () {  
        if (!(window.localStorage && window.localStorage.getItem)) {
            alert("该浏览器不支持localStorage本地存储");
        } else {
            this.ls = localStorage;
        }
    },
    // 更新左侧目录
    updateCategory: function (sCategoryId) {
        // this.ls.clear();
        if (!this.getItem(this.sDefaultId)) { // 用户第一次打开，初始化默认分类的id为10000，初始化目录结构数据
            this.setItem(this.sDefaultId, {total: 0, rows: []});
            this.setItem('categoryStructor', {"rows":[{"id":"/10000","title":"默认分类","subcategory":null}]});
        }
        var oData = this.getItem('categoryStructor');
        if (!oData) { return false; }
        var sHtmlContent = '';
        var aRows = oData.rows;
        var totalCount = 0;
        this.each(aRows, function (i, value) {
            var oProcessData = this.getItem(value.id);
            var count = oProcessData ? oProcessData.total : 0;
            var sDefaultClass = (value.id === this.sDefaultId) ? 'task-dft ' : '';
            var sOnClass = (value.id === sCategoryId) ? 'on ' : '';
            totalCount += count;
            sHtmlContent += '<li class="TaskCategory group ' + sDefaultClass + 'TaskCategory-fold" data-id="' + value.id + '">' +
                                '<a href="#" class="list-item ' + sOnClass + 'ico-task"><span>' + value.title + '</span><span> (' + count + ') </span><i class="ico-delete"></i></a>';
            if (value.subcategory) {
                sHtmlContent += '<ul>';
                for (var j = 0; j < value.subcategory.length; j++) {
                    oProcessData = this.getItem(value.subcategory[j].id);
                    count = oProcessData ? oProcessData.total : 0;
                    sHtmlContent += '<li class="TaskCategory group" data-id="' + value.subcategory[j].id + '">' +
                                        '<a href="#" class="list-item ico-task-sec"><span>' + value.subcategory[j].title + '</span><span> (' + count + ') </span><i class="ico-delete"></i></a>' +
                                    '</li>';
                }
                sHtmlContent += '</ul></li>';
            } else {
                sHtmlContent +=  '<ul></ul></li>';
            } 
        });
        this.totalCount.innerHTML = totalCount;
        this.oTaskCategoryUl.innerHTML = sHtmlContent;
        this.oTargetAddOn = this.getByClass(this.oTaskCategoryUl, 'on')[0]; // 更新当前现在的分类
    },
    // 更新中间任务进度列表
    updateProcessList: function (sCategoryId) {
        var _this = this;
        var htmlContent = '';
        var oData = {rows:[]};
        var oTaskId = this.getItem(sCategoryId);
        var oTaskList = this.getItem('taskList');
        var oProcessData = {};
        var time = '';
        var aState = [
            'all',
            'unfinished',
            'finished'
        ];
        var sFilterState = aState[this.sProcessNow] || 'all';

        if (oTaskId) {
            this.each(oTaskId.rows, function (i, taskId) {
                this.each(oTaskList.rows, function(j, task) {
                    if (task.taskId === taskId) {
                        oData.rows.push(task);
                    }
                });
            });
        } else {
            this.addTask(); //如果没有任务，则准备添加
            this.oProcessContList.innerHTML = '';
            return false;
        } 

        if (oData) {
            for (var n = 0; n < oData.rows.length; n++) {
                var taskInfo = {};
                if (sFilterState === 'all' ||  sFilterState === 'unfinished' && !oData.rows[n].finished || sFilterState === 'finished' && oData.rows[n].finished) {
                    time = oData.rows[n].taskTime;
                    taskInfo.taskTitle = oData.rows[n].taskTitle;
                    taskInfo.taskId = oData.rows[n].taskId;
                    taskInfo.finished = oData.rows[n].finished;
                    if (oProcessData[time]) {
                        oProcessData[time].push(taskInfo); 
                    } else {
                        var arr = [];
                        arr.push(taskInfo);
                        oProcessData[time] = arr;
                    }
                }
            }
        }
        var keyArr = [];
        for (var key in oProcessData) {
            keyArr.push(key);
        }
        keyArr.sort();
        this.oProcessContList.innerHTML = ""; // 清空列表
        this.each(keyArr, function (i, keyValue) {
            var oTaskTime = document.createElement('h3'),
                taskTitleHtml = '',
                finishedState = '',
                sSelectClass = '';
            oTaskTime.className = 'taskTime';
            oTaskTime.innerText = keyValue;
            this.oProcessContList.appendChild(oTaskTime);
            this.each(oProcessData[keyValue], function (j, task) {
                // 默认打开第一个任务的详细信息
                if (j === 0 && i === 0) {
                    this.sTaskOnId = task.taskId;
                    this.updateTaskInfo(this.sTaskOnId); 
                    sSelectClass = ' on';
                }  else {
                    sSelectClass = '';
                }
                finishedState = task.finished ? 'finished' : '';
                var oTaskLi =  document.createElement('li');
                var oTaskA =  document.createElement('a');
                oTaskLi.className = 'noteTitle' + sSelectClass + ' ' + finishedState;
                oTaskLi.setAttribute('task-id', task.taskId);
                oTaskA.href = 'javascript:void(0);';
                oTaskA.innerText = task.taskTitle;
                oTaskLi.appendChild(oTaskA);
                this.oProcessContList.appendChild(oTaskLi);
            });
        });       
        // 点击查看任务详细内容
        var aTaskLi = this.getByClass(this.oProcessContList, 'noteTitle');
        this.each(aTaskLi, function (i, element) {
            element.onclick = function () {
                _this.each(aTaskLi, function (j, ele) {
                    _this.removeClass(ele, 'on');
                });
                _this.addClass(this, 'on');
                if (_this.sTaskOnId !== this.getAttribute('task-id')) { // 点击已选中的任务时，不做任何操作
                    _this.sTaskOnId = this.getAttribute('task-id');
                    _this.updateTaskInfo(_this.sTaskOnId);
                }
            };
        });
    },
    // 更新任务详细信息
    updateTaskInfo: function (sTaskId) {
        var sCategoryId = this.oTargetAddOn.parentNode.getAttribute('data-id');
        var oTaskData;
        var oCategoryData = {rows:[]};
        var oTaskId = this.getItem(sCategoryId);
        var oTaskList = this.getItem('taskList');
        if (oTaskId) {
            this.each(oTaskId.rows, function (i, taskId) {
                this.each(oTaskList.rows, function(j, task) {
                    if (task.taskId === taskId) {
                        oCategoryData.rows.push(task);
                    }
                });
            });
        }  

        // 任务详细内容显示，标题、时间、内容
        var oTitle = this.getByClass(this.oContentMode, 'task-title-text')[0];
        var oDate = this.getByClass(this.oContentMode, 'task-date-text')[0];
        var oContent = this.getByClass(this.oContentMode, 'main-content')[0];
        // 任务详细内容输入，标题、时间、内容，全局使用
        this.oTitleInput = this.oContentMode.getElementsByTagName('input')[0];
        this.oDateInput = this.oContentMode.getElementsByTagName('input')[1];
        this.oContentTextarea = this.oContentMode.getElementsByTagName('textarea')[0];
        
        this.each(oCategoryData.rows, function (i, value) {
            if (value.taskId === sTaskId) {
                oTaskData = value;
            }
        });

        if (!oTaskData) {
            this.addTask();
        } else {
            this.removeClass(this.oContentMode, 'edit-mode');
            oTitle.innerText = oTaskData.taskTitle;
            oDate.innerText = oTaskData.taskTime;
            oContent.innerText = oTaskData.taskContent;
            this.oTitleInput.value = oTaskData.taskTitle;
            this.oDateInput.value = oTaskData.taskTime;
            this.oContentTextarea.value = oTaskData.taskContent;
        }
    },
    // 左侧按键展开、收起事件
    taskTrigger: function () {
        var _this = this;
        this.each(this.aListItem, function (i, value) {
            
        });
        this.oTaskCategoryUl.onclick = function (ev) {
            var oEvent = ev || event;
            var oTarget = oEvent.target || oEvent.srcElement;
            var tagName = oTarget.tagName.toLowerCase();
            var oTaskCategory = null;
            if (tagName === 'a') {  // 按下a标签
                _this.oTargetAddOn = oTarget;
                oTaskCategory = oTarget.parentNode;
            } else if (tagName === 'span') {    // 按下span标签    
                _this.oTargetAddOn = oTarget.parentNode;
                oTaskCategory = oTarget.parentNode.parentNode;
            } else if (tagName === 'i') {   // 按下删除按键
                if (_this.hasClass(oTarget.parentNode.parentNode, 'task-dft')) { // 默认分类不能删除
                    alert("默认分类不能删除");
                } else {
                    _this.oConfirmBoxText.innerHTML = "你确定删除《" + oTarget.parentNode.children[0].innerHTML + "》分类吗?";
                    _this.showBox(_this.oConfirmBoxWrap);
                    _this.oConfirmBoxBtnSure.onclick = function () {
                        _this.deleteCategory(oTarget);
                        
                    };
                    _this.oConfirmBoxBtnCancel.onclick = function () {
                        _this.hideBox(_this.oConfirmBoxWrap);
                    };
                        
                }
                return false;
            }
            if (_this.hasClass(oTaskCategory, 'TaskCategory-fold')) {
                _this.removeClass(oTaskCategory, 'TaskCategory-fold');    
            } else {
                _this.addClass(oTaskCategory, 'TaskCategory-fold');
            }
            if (!_this.hasClass(_this.oTargetAddOn, 'on')) {
                // 选中当前分类
                _this.each(_this.aListItem, function (i, element) {
                    _this.removeClass(element, 'on');
                });
                _this.addClass(_this.oTargetAddOn, 'on');

                // 默认显示所有任务，不管完成与否
                var aFilterBtn = _this.aProcessFilterBtn;
                _this.each(aFilterBtn, function (i, element) {
                    element.className = '';
                });
                aFilterBtn[0].className = 'active';

                _this.removeClass(oTaskCategory, 'TaskCategory-fold');
                _this.sProcessNow = 0;
                _this.updateProcessList.call(_this, _this.oTargetAddOn.parentNode.getAttribute('data-id'));
            }
        };
    },
    // 删除目录
    deleteCategory: function (oTarget) {
        var oSaveStructorData = this.getItem('categoryStructor');
        var oTaskList = this.getItem('taskList');
        var sId = oTarget.parentNode.parentNode.getAttribute('data-id');
        var oDeleteTaskList = this.getItem(sId) ? this.getItem(sId) : {rows:[]};
        if (!this.hasClass(oTarget.parentNode, 'ico-task-sec')) { // 删除主目录
            // 删除主目录对应的任务      
            this.each(oDeleteTaskList.rows, function (i, delTask) {
                this.each(oTaskList.rows, function(j, task) {
                    if (task.taskId === delTask) {
                        oTaskList.rows.splice(j, 1);
                    }
                });
            });
            this.each(oSaveStructorData.rows, function (i, value) {
                if (value.id === sId) {
                    var sSubcategory = value.subcategory;
                    if (sSubcategory) {
                        this.each(sSubcategory, function (j, val) {
                            this.ls[val.id] = undefined;;
                            this.ls[val.id] = undefined;
                            try {
                                delete this.ls[val.id];
                            } catch(e){}
                        });
                    }
                }
            });
            this.ls[sId] = undefined;
            try {
                delete this.ls[sId]; // 删除主目录对应的任务
            } catch(e){}
            this.each(oSaveStructorData.rows, function (i, value) {
                if (value.id === sId) {
                    oSaveStructorData.rows.splice(i, 1); 
                }
            });
            this.setItem('categoryStructor', oSaveStructorData);
            this.setItem('taskList', oTaskList);
            this.updateCategory(this.sDefaultId);
            this.updateProcessList(this.sDefaultId);
        } else {
            var sParentId = oTarget.parentNode.parentNode.parentNode.parentNode.getAttribute('data-id');
            var oSaveParentTaskData = this.getItem(sParentId);
            var aChildDeleteTask = [];
            
            this.each(oDeleteTaskList.rows, function (i, delTask) {
                this.each(oTaskList.rows, function(j, task) {
                    if (task.taskId === delTask) {
                        oSaveParentTaskData.total--;
                        oTaskList.rows.splice(j, 1);
                    }
                });
            });
            this.ls[sId] = undefined;
            try {
                delete this.ls[sId]; // 删除子目录对应的任务
            } catch(e){}
            
            this.each(oSaveStructorData.rows, function (i, value) {
                if (value.id === sParentId) {
                    this.each(value.subcategory, function(j, val) {
                        if (val.id === sId) {
                            value.subcategory.splice(j, 1);
                        }
                    });
                }
                
            });
            this.setItem('categoryStructor', oSaveStructorData);
            this.setItem('taskList', oTaskList);
            this.setItem(sParentId, oSaveParentTaskData);
            this.updateCategory(sParentId);
            this.updateProcessList(sParentId);
        }
        this.updateTaskInfo(this.sTaskOnId);
        this.hideBox(this.oConfirmBoxWrap);
    },
    // 根据完成状态进行筛选
    filterTaskState: function () {
        var _this = this;
        var aFilterBtn = this.aProcessFilterBtn;
        this.each(aFilterBtn, function (i, element) {
            element.index = i;
            element.onclick = function () {
                if (this.index !== _this.sProcessNow) {
                    _this.each(aFilterBtn, function (j, ele) {
                        ele.className = '';
                    });
                    _this.sProcessNow = this.index;
                    this.className = 'active';
                    _this.updateProcessList(_this.oTargetAddOn.parentNode.getAttribute('data-id'));
                }
            };
        });        
    },
    // 添加目录
    addCategory: function () {
        var _this = this;
        var sCategoryName = _this.oPromptBoxInput.value;
        if (!sCategoryName) { return false; }
        var oLi = document.createElement('li');
        var oCategoryData = {};
        var oSaveData = this.getItem('categoryStructor');
        var sRandomId = '/' + parseInt(Math.random()*1000000);
        while (_this.ls[sRandomId]) { // 防止生成重复的目录id
            sRandomId = '/' + parseInt(Math.random()*1000000);
        }
        oCategoryData = {id: sRandomId, title: sCategoryName, subcategory: null};
        oLi.className = 'TaskCategory';
        oLi.setAttribute('data-id', sRandomId);
        if (this.hasClass(this.oTargetAddOn.parentNode, 'task-dft')) { // 选择默认分类时，创建一个新分类
            oLi.innerHTML = '<a href="#" class="list-item ico-task"><span>' + sCategoryName + '</span><span> (0)</span><i class="ico-delete"></i></a><ul></ul>';
            this.oTaskCategoryUl.appendChild(oLi);
            oSaveData.rows.push(oCategoryData);
        } else { // 非默认分类时，在内部创建新分类
            var sId = '';

            oLi.innerHTML = '<a href="#" class="list-item ico-task-sec"><span>' + sCategoryName + '</span><span> (0)</span><i class="ico-delete"></i></a>';
            if (this.hasClass(this.oTargetAddOn, 'ico-task-sec')) { // 给当前ul添加分类
                sId = this.oTargetAddOn.parentNode.parentNode.parentNode.getAttribute('data-id');
                this.oTargetAddOn.parentNode.parentNode.appendChild(oLi);
            } else { // 给子分类的ul添加分类
                sId = this.oTargetAddOn.parentNode.getAttribute('data-id');
                this.removeClass(this.oTargetAddOn.parentNode, 'TaskCategory-fold');
                if (this.oTargetAddOn.nextElementSibling) {
                    this.oTargetAddOn.nextElementSibling.appendChild(oLi);
                } else {
                    this.oTargetAddOn.nextSibling.appendChild(oLi);
                }
            }
            this.each(oSaveData.rows, function (i, value) {
                if (value.id === sId) {
                    var oSubcategoryData = {id: sRandomId, title: sCategoryName};
                    aOldSubcategoryData = value.subcategory || [];
                    aOldSubcategoryData.push(oSubcategoryData);
                    value.subcategory = aOldSubcategoryData;
                }
            });
        }
        this.setItem('categoryStructor', oSaveData);
    },
    // 添加任务
    addTask: function () {
        var _this = this;
        var oOkBtn = this.getByClass(_this.oContentMode, 'if-save-btn')[0];
        var oCancel = this.getByClass(_this.oContentMode, 'if-save-btn')[1];
        this.oTitleInput.value = "";
        this.oDateInput.value = "";
        this.oContentTextarea.value = "";
        this.btnTrigger.call(this);
        this.addClass(_this.oContentMode, 'edit-mode');
        oOkBtn.onclick = function () {
            _this.saveTask();
        };
        oCancel.onclick = function () {
            _this.btnTrigger.call(_this);
            _this.removeClass(_this.oContentMode, 'edit-mode');
        };
    },
    // 编辑任务
    editTask: function () {
        var _this = this;
        var oOkBtn = this.getByClass(this.oContentMode, 'if-save-btn')[0];
        var oCancel = this.getByClass(this.oContentMode, 'if-save-btn')[1];
        this.btnTrigger.call(this);
        this.addClass(this.oContentMode, 'edit-mode');
        oOkBtn.onclick = function () {
            _this.saveEditTask();
        };
        oCancel.onclick = function () {
            _this.btnTrigger.call(_this);
            _this.updateTaskInfo(_this.sTaskOnId);
            _this.removeClass(_this.oContentMode, 'edit-mode');
        };
    },
    // 保存新建的任务
    saveTask: function () {
        this.btnTrigger();
        if(!this.getItem('taskList')) { // 存放所有任务的容器
            this.setItem('taskList', {rows:[]});
        }
        var sId = this.oTargetAddOn.parentNode.getAttribute('data-id');
        var oSaveData = this.getItem(sId) ? this.getItem(sId) : {total: 0, rows:[]};
        var oTemp = {};
        var oTaskList = this.getItem('taskList');
        var sTaskRandomId = '/' + parseInt(Math.random()*1000000);
        var aIdArray = [];
        this.each(oTaskList.rows, function (i, value) {
            aIdArray.push(value.taskId);
        });
        while (aIdArray[sTaskRandomId]) { // 防止生成重复的任务id
            sTaskRandomId = '/' + parseInt(Math.random()*1000000);
        }

        oSaveData.total++;
        oTemp.taskId = sTaskRandomId;
        oTemp.taskTitle = this.oTitleInput.value;
        oTemp.taskTime = this.oDateInput.value;
        oTemp.taskContent = this.oContentTextarea.value;
        oTemp.finished = false;
        if (!this.checkValid(oTemp.taskTitle, oTemp.taskTime)) {
            return false;
        }
        oSaveData.rows.push(oTemp.taskId);
        oTaskList.rows.push(oTemp);
        this.setItem('taskList', oTaskList);
        if (this.hasClass(this.oTargetAddOn, 'ico-task-sec')) { // 添加到子分类的同时，也是添加到主分类
            var sParentId = this.oTargetAddOn.parentNode.parentNode.parentNode.getAttribute('data-id');
            var oParentSaveData = this.getItem(sParentId) ? this.getItem(sParentId) : {total: 0, rows:[]};
            var oParent = this.oTargetAddOn.parentNode.parentNode.previousSibling ? 
            this.oTargetAddOn.parentNode.parentNode.previousSibling :
            this.oTargetAddOn.parentNode.parentNode.previousElementSibling;
            oParentSaveData.total++;
            oParent.children[1].innerHTML = ' (' + oParentSaveData.total + ') ';
            oParentSaveData.rows.push(oTemp.taskId);
            this.setItem(sParentId, oParentSaveData);
        }
        this.setItem(sId, oSaveData);
        this.oTargetAddOn.children[1].innerHTML = ' (' + oSaveData.total + ') ';
        this.totalCount.innerHTML = 1 + parseInt(this.totalCount.innerHTML);
        this.updateProcessList(sId);
        this.removeClass(this.oContentMode, 'edit-mode');
    },
    // 保存编辑的任务
    saveEditTask: function () {
        this.btnTrigger();
        var sId = this.oTargetAddOn.parentNode.getAttribute('data-id');
        var oTemp = {};
        var oTaskList = this.getItem('taskList');

        oTemp.taskId = this.sTaskOnId;
        oTemp.taskTitle = this.oTitleInput.value;
        oTemp.taskTime = this.oDateInput.value;
        oTemp.taskContent = this.oContentTextarea.value;
        if (!this.checkValid(oTemp.taskTitle, oTemp.taskTime)) {
            return false;
        }
        this.each(oTaskList.rows, function (i, task) {
            if (task.taskId === this.sTaskOnId) {
                oTemp.finished = task.finished; // 不改动完成状态
                oTaskList.rows[i] = oTemp;
            }
        });
        this.setItem('taskList', oTaskList);
        this.updateProcessList(sId);
        this.removeClass(this.oContentMode, 'edit-mode');
    },
    // 检查输入数据的有效性
    checkValid: function (title, date) {
        if (title.length == 0) {  // 检查标题
            this.oError.innerText = '请输入标题';
            this.css(this.oError, 'display', 'inline-block');
        } else if (!/\d{4}-\d{2}-\d{2}/.test(date)) { // // 检查日期格式
            this.oError.innerText = '请输入正确的日期格式，如2015-01-01';
            this.css(this.oError, 'display', 'inline-block');
        } else {
            this.css(this.oError, 'display', 'none');
            return true;
        }
        return false;
    },
    // 完成任务
    finishTask: function () {
        var _this = this;
        _this.oConfirmBoxText.innerHTML = "是否确认完成？";
        _this.showBox(_this.oConfirmBoxWrap);
        _this.oConfirmBoxBtnSure.onclick = function () {
            var oTaskList = _this.getItem('taskList');
            _this.each(oTaskList.rows, function (i, task) {
                if (task.taskId === _this.sTaskOnId) {
                    task.finished = true;
                }
            });
            _this.setItem('taskList', oTaskList);
            _this.aProcessFilterBtn[2].onclick();
            _this.hideBox(_this.oConfirmBoxWrap);
        };
        _this.oConfirmBoxBtnCancel.onclick = function () {
            _this.hideBox(_this.oConfirmBoxWrap);
        };
    },
    // 按钮切换
    btnTrigger: function () {
        this.css(this.oTaskContentBtn, 'right', '-85');
        this.doMove(this.oTaskContentBtn, {right: 0}, null, 5);
    },
    // 显示弹出窗
    showBox: function (oBoxWrap) {
        var _this = this;
        this.css(oBoxWrap, 'top', document.documentElement.clientHeight/2 - 100);
        this.css(oBoxWrap, 'display', 'block');
        this.css(this.oOverlayCode, 'opacity', 0);
        this.css(this.oOverlayCode, 'display', 'block');
        this.doMove(this.oOverlayCode, {opacity: 80}, null, 2);
    },
    // 隐藏弹出窗
    hideBox: function (oBoxWrap) {
        oBoxWrap.style.display = 'none';
        this.oOverlayCode.style.display = 'none';
    },
    // css方法
    css: function (oElement, attr, value) {
        if (arguments.length === 2) {
            return oElement.currentStyle ? oElement.currentStyle[attr] : getComputedStyle(oElement, false)[attr];
        } else if (arguments.length === 3) {
            switch(attr) {
                case 'width':
                case 'height':
                case 'top':
                case 'left':
                case 'right':
                case 'bottom':
                    oElement.style[attr] = value + 'px';
                    break;
                case 'opacity':
                    oElement.style.filter = 'alpha(opacity:' + value + ')';
                    oElement.style.opacity = value / 100;
                    break;
                default:
                    oElement.style[attr] = value;
                    break;
            }
        }
    },
    // 缓冲运动
    doMove: function (oElement, oAttr, fnCallback, speed) {
        var _this = this;
        clearInterval(oElement.timer);
        oElement.timer = setInterval(function () {
            var bStop = true;
            for (var property in oAttr) {
                var iCur = parseFloat(_this.css(oElement, property));
                if (property === 'opacity') {
                    iCur = parseInt(iCur.toFixed(2) * 100);
                }
                var iSpeed = (oAttr[property] - iCur) / speed;
                iSpeed = iSpeed > 0 ? Math.ceil(iSpeed) : Math.floor(iSpeed);

                if (iCur != oAttr[property]) {
                    bStop = false;
                    _this.css(oElement, property, iCur + iSpeed);
                } 
            }
            if (bStop) {
                clearInterval(oElement.timer);
                if (fnCallback) {
                    fnCallback.apply(this, arguments); 
                }   
            }
        }, 30);
    },
    // 获取本地数据，参数为目录id
    getItem: function (sId) {
        return JSON.parse(this.ls.getItem(sId));
    },
    // 设置本地数据，参数为目录id和对应的数据
    setItem: function (sId, oData) {
        this.ls.setItem(sId, JSON.stringify(oData));
    },
    // 通过class获取元素
    getByClass: function (oElement, sClassName) {
        var elements = oElement.getElementsByTagName('*');
        var aResult = [];
        for (var i = 0; i < elements.length; i++) {
            if (this.hasClass(elements[i], sClassName)) {
                aResult.push(elements[i]);
            }
        }
        return aResult;
    },
    // 判断元素是否有指定class
    hasClass: function (oElement, sClassName) {
        var aClassName = this.getClassNames(oElement);
        return this.inArray(sClassName, aClassName) != -1;
    },
    // 获取元素的所有class，一数组的形式返回
    getClassNames: function (oElement) {
        if (!oElement) {return false;}
        return this.trim(oElement.className).replace(/\s+/g, ' ').split(' ');
    },
    // 为元素添加相应class
    addClass: function (oElement, sClassName) {
        if (!oElement || !sClassName) {return false;}
        var aClassName = this.getClassNames(oElement);
        if (this.inArray(sClassName, aClassName) != -1) {return false;}
        oElement.className += (oElement.className ? ' ' : '')+ sClassName;
    },
    // 为元素移除相应class
    removeClass: function (oElement, sClassName) {
        if (!oElement || !sClassName) {return false;}
        var aClassName = this.getClassNames(oElement);
        var length = aClassName.length;
        for (var i = 0; i < length; i++) {
            if (aClassName[i] === sClassName) {
                aClassName.splice(i, 1);
            }
        }
        oElement.className = aClassName.join(' ');
        return (length === aClassName.length) ? false : true;
    },
    // 去掉前后空格
    trim: function (str) {
        return str.replace(/^\s+|\s+$/g,'');
    },
    // 判断元素是否在数组中
    inArray: function (value, array) {
        // if (!this.isArray(array)) {return false;}
        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function(elt /*, from*/) {
                var len = this.length >>> 0; // 利用位运算中的无符号右移操作符进行转型

                var from = Number(arguments[1]) || 0;
                from = (from < 0) ? Math.ceil(from): Math.floor(from);
                if (from < 0)
                  from += len;

                for (; from < len; from++) {
                  if (from in this &&
                      this[from] === elt)
                    return from;
                }
                return -1;
            };
        }
        return array.indexOf(value, arguments[2]);
    },
    // 判断是否为数组
    isArray: function (array) {
        var str = Object.prototype.toString.call(array).slice(8,-1).toLowerCase();
        if (str == "array") { return true; }
        else { return false; }
    },
    // 遍历数组
    each: function (arr, fn) {
        if (typeof fn !== 'function') { return false; }
        for (var i = 0; i < arr.length; i++) {
            fn.call(this, i, arr[i]);
        }
    }
};
window.onload = function () {
    new Gtd();
};
