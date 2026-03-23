$(document).ready(function () {
    // 初始化轮播图、日期组件等
    $('#carousel').carousel({
        interval: 3000
    });
    $('#datepicker').datepicker(); // 假设您使用了一个jQuery日期选择器插件

    // 加载课程数据
    function loadCourses(filter = {}) {
        $.ajax({
            url: 'http://localhost:5000/courses',
            data: filter,
            success: function (data) {
                // 根据返回的数据更新课程列表
                $('#course-list').empty();
                data.forEach(function (course) {
                    // 创建并添加课程卡片到列表
                });
            }
        });
    }

    // 页面加载时加载课程数据
    loadCourses();

    // 处理选项卡点击事件
    $('input[name="options"]').on('change', function () {
        var filter = {};
        if ($(this).val() === '热门') {
            // 设置热门课程的过滤条件
        } else if ($(this).val() === '最新') {
            // 设置最新课程的过滤条件
        } else if ($(this).val() === '免费') {
            filter.isFree = true;
        }
        loadCourses(filter);
    });

    // 处理日期选择事件（如果需要）
    $('#datepicker').on('changeDate', function (e) {
        // 根据选择的日期更新课程列表（如果需要）
    });

    // 处理三级菜单点击事件（根据需要实现）
});