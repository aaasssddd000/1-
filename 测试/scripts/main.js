class AppManager {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        // 绑定形状点击事件
        document.querySelectorAll('.shape').forEach(shape => {
            shape.addEventListener('click', (e) => {
                const action = shape.getAttribute('data-action');
                this.handleAction(action);
            });
        });

        // 绑定导航按钮点击事件
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.getAttribute('data-page');
                switch(page) {
                    case 'home':
                        this.showHomePage();
                        break;
                    case 'activities':
                        this.showActivitiesPage();
                        break;
                    case 'myEvents':
                        this.showMyEvents();
                        break;
                }
                
                // 更新按钮状态
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // 初始化模态框关闭功能
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // 初始化页面状态
        this.showPage(this.currentPage);
    }

    handleNavigation(action) {
        switch(action) {
            case '首页':
                this.showHomePage();
                break;
            case '活动列表':
                this.showActivitiesPage();
                break;
            case '我的活动':
                this.showMyEvents();
                break;
        }
    }

    handleAction(action) {
        switch(action) {
            case 'publish':
                this.showPublishModal();
                break;
            case 'list':
                this.showActivitiesPage();
                break;
            case 'myEvents':
                this.showMyEvents();
                break;
            case 'myCreated':
                this.showMyCreatedEvents();
                break;
            case 'search':
                this.showActivitiesPage();
                document.getElementById('searchInput')?.focus();
                break;
        }
    }

    showPage(pageName) {
        // 防止重复切换同一页面
        if (this.currentPage === pageName) return;

        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });

        // 显示指定页面
        const page = document.getElementById(`${pageName}Page`);
        if (page) {
            page.style.display = 'block';
            // 使用 CSS 类而不是直接设置动画
            page.classList.add('page-transition');
            // 动画结束后移除类
            setTimeout(() => {
                page.classList.remove('page-transition');
            }, 500);
        }

        // 更新导航按钮状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            const btnPage = btn.getAttribute('data-page');
            if (btnPage === pageName) {
                btn.classList.add('active');
            }
        });

        this.currentPage = pageName;

        // 如果是活动列表页面，只在必要时刷新活动列表
        if (pageName === 'activities' && window.activityManager) {
            // 使用防抖，避免频繁刷新
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = setTimeout(() => {
                window.activityManager.loadActivities();
            }, 100);
        }
    }

    showHomePage() {
        // 清除所有活跃状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 设置首页按钮为活跃
        const homeBtn = document.querySelector('[data-page="home"]');
        if (homeBtn) {
            homeBtn.classList.add('active');
        }
        
        this.showPage('home');
    }

    showActivitiesPage() {
        // 先切换页面
        this.showPage('activities');
        
        // 确保 ActivityManager 已初始化
        if (!window.activityManager) {
            window.activityManager = new ActivityManager();
        }

        // 获取容器
        const container = document.getElementById('activitiesList');
        if (!container) return;

        // 显示加载动画
        container.innerHTML = '<div class="loading-spinner"></div>';

        // 使用 setTimeout 确保加载动画显示
        setTimeout(() => {
            try {
                // 加载并显示活动
                const activities = window.activityManager.loadActivities();
                if (activities && activities.length > 0) {
                    window.activityManager.renderActivities(activities);
                } else {
                    container.innerHTML = '<div class="no-activities">暂无活动</div>';
                }
            } catch (error) {
                console.error('Error loading activities:', error);
                container.innerHTML = '<div class="no-activities">加载失败，请重试</div>';
            }
        }, 300);
    }

    showMyEvents() {
        // 防止重复切换
        if (this.currentPage === 'activities' && document.querySelector('[data-page="myEvents"].active')) {
            return;
        }

        this.showPage('activities');
        if (window.activityManager) {
            // 使用防抖
            clearTimeout(this.myEventsTimeout);
            this.myEventsTimeout = setTimeout(() => {
                window.activityManager.showMyEvents();
            }, 100);
        }
        
        // 更新导航按钮状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-page') === 'myEvents') {
                btn.classList.add('active');
            }
        });
    }

    showPublishModal() {
        const modal = document.getElementById('publishModal');
        if (!modal) return;
        
        modal.style.display = 'block';
        
        // 重置表单
        const form = document.getElementById('publishForm');
        if (form) {
            form.reset();
            
            // 移除旧的事件监听器
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // 添加新的事件监听器
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePublishSubmit(newForm);
            });
        }
    }

    handlePublishSubmit(form) {
        console.log('Handling form submission...');
        
        // 禁用提交按钮，防止重复提交
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '发布中...';

        try {
            const formData = new FormData(form);
            const imageFile = formData.get('image');
            
            // 创建活动数据对象
            const activityData = {
                id: Date.now().toString(),
                title: formData.get('title'),
                description: formData.get('description'),
                date: formData.get('date'),
                location: formData.get('location'),
                tags: formData.get('tags').split(',').map(tag => tag.trim()),
                participants: [],
                comments: []
            };

            // 处理图片上传
            if (imageFile && imageFile.size > 0) {
                this.compressImage(imageFile, (compressedImage) => {
                    activityData.image = compressedImage;
                    this.saveActivityAndRefresh(activityData, form);
                });
            } else {
                console.log('No image uploaded, using default');
                activityData.image = 'images/default.jpg';
                this.saveActivityAndRefresh(activityData, form);
            }
        } catch (error) {
            console.error('Error in handlePublishSubmit:', error);
            this.showMessage('发布失败，请重试', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = '发布活动';
        }
    }

    compressImage(file, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 设置压缩后的宽度和高度
                const maxWidth = 800;
                const maxHeight = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // 压缩图片质量
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                callback(compressedDataUrl);
            };
            img.src = event.target.result;
        };
        reader.onerror = (error) => {
            console.error('Error reading image:', error);
            this.showMessage('图片处理失败，请重试', 'error');
        };
        reader.readAsDataURL(file);
    }

    saveActivityAndRefresh(activityData, form) {
        try {
            console.log('Saving activity:', activityData);
            
            // 确保 ActivityManager 已初始化
            if (!window.activityManager) {
                console.log('Creating new ActivityManager');
                window.activityManager = new ActivityManager();
            }

            // 添加新活动
            window.activityManager.addActivity(activityData);
            console.log('Activity saved successfully');

            // 关闭模态框
            this.closeModal(document.getElementById('publishModal'));
            
            // 重置表单
            if (form) {
                form.reset();
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '发布活动';
                }
            }

            // 显示成功消息
            this.showMessage('活动发布成功！');

            // 切换到活动列表页面
            setTimeout(() => {
                this.showActivitiesPage();
            }, 1000);

        } catch (error) {
            console.error('Error saving activity:', error);
            this.showMessage('保存失败，请重试', 'error');
            
            // 恢复提交按钮状态
            if (form) {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '发布活动';
                }
            }
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showMessage(text, type = 'success') {
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.textContent = text;
        document.body.appendChild(message);

        // 添加动画
        requestAnimationFrame(() => {
            message.style.opacity = '1';
            message.style.transform = 'translateX(0)';
        });

        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateX(100%)';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    showMyCreatedEvents() {
        this.showPage('activities');
        if (window.activityManager) {
            window.activityManager.showMyCreatedEvents();
        }
    }
}

// 初始化应用并设为全局变量
window.app = new AppManager(); 

// 添加页面加载优化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟加载非关键资源
    setTimeout(() => {
        // 预加载图片
        const images = ['images/default.jpg'];
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }, 1000);
}); 

// 添加性能监控
class PerformanceMonitor {
    static logTiming(label) {
        const timing = performance.now();
        console.log(`${label}: ${timing}ms`);
        return timing;
    }

    static measureOperation(operation, label) {
        const start = performance.now();
        operation();
        const end = performance.now();
        console.log(`${label} took ${end - start}ms`);
    }
} 