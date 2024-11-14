class ActivityManager {
    constructor() {
        this.activities = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        console.log('Initializing ActivityManager...');
        this.loadActivities();
        this.bindEvents();
    }

    bindEvents() {
        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.filterActivities();
            });
        }

        // 标签筛选
        document.querySelectorAll('.tags-filter .tag').forEach(tag => {
            tag.addEventListener('click', () => {
                document.querySelectorAll('.tags-filter .tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                this.currentFilter = tag.textContent;
                this.filterActivities();
            });
        });

        // 日期筛选
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.filterActivities();
            });
        }
    }

    filterActivities() {
        const filtered = this.activities.filter(activity => {
            const matchesSearch = activity.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                                  activity.description.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesTag = this.currentFilter === '全部' || activity.tags.includes(this.currentFilter);
            return matchesSearch && matchesTag;
        });

        this.renderActivities(filtered);
    }

    async loadActivities() {
        try {
            const container = document.getElementById('activitiesList');
            if (container) {
                container.innerHTML = '<div class="loading-spinner"></div>';
            }

            const savedActivities = localStorage.getItem('activities');
            if (savedActivities) {
                this.activities = JSON.parse(savedActivities);
                this.renderActivities();
            } else {
                container.innerHTML = '<div class="no-activities">暂无活动</div>';
            }
        } catch (error) {
            console.error('Error loading activities:', error);
            this.showError('加载失败，请刷新重试');
        }
    }

    showError(message) {
        const container = document.getElementById('activitiesList');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                    <button onclick="window.location.reload()">刷新页面</button>
                </div>
            `;
        }
    }

    saveActivities() {
        try {
            localStorage.setItem('activities', JSON.stringify(this.activities));
            console.log('Activities saved:', this.activities);
            this.loadActivities();
        } catch (error) {
            console.error('Error saving activities:', error);
        }
    }

    addActivity(activityData) {
        this.activities.push(activityData);
        this.saveActivities();
        console.log('Activity added:', activityData);
        this.renderActivities();
    }

    deleteActivity(activityId) {
        try {
            // 确认是否要删除
            if (!confirm('确定要删除这个活动吗？')) {
                return;
            }

            // 从数组中删除活动
            const activityIndex = this.activities.findIndex(activity => activity.id.toString() === activityId.toString());
            if (activityIndex !== -1) {
                // 从数组中移除活动
                this.activities.splice(activityIndex, 1);
                
                // 直接更新 localStorage
                localStorage.setItem('activities', JSON.stringify(this.activities));
                console.log('Activity deleted:', activityId);
                
                // 重新渲染活动列表
                this.renderActivities();
                
                // 显示成功消息
                this.showMessage('活动已成功删除');
            } else {
                console.error('Activity not found for deletion:', activityId);
                this.showMessage('删除失败：未找到活动', 'error');
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
            this.showMessage('删除失败，请重试', 'error');
        }
    }

    cancelActivity(activityId) {
        try {
            // 确认是否要取消
            if (!confirm('确定要取消这个活动吗？')) {
                return;
            }

            // 查找并更新活动状态
            const activity = this.activities.find(a => a.id.toString() === activityId.toString());
            if (activity) {
                // 更新活动状态
                activity.status = 'cancelled';
                
                // 直接更新 localStorage
                localStorage.setItem('activities', JSON.stringify(this.activities));
                console.log('Activity cancelled:', activityId);
                
                // 重新渲染活动列表
                this.renderActivities();
                
                // 显示成功消息
                this.showMessage('活动已成功取消');
            } else {
                console.error('Activity not found for cancellation:', activityId);
                this.showMessage('取消失败：未找到活动', 'error');
            }
        } catch (error) {
            console.error('Error cancelling activity:', error);
            this.showMessage('取消失败，请重试', 'error');
        }
    }

    renderActivities(activities = this.activities) {
        const container = document.getElementById('activitiesList');
        if (!container) {
            console.error('Activities container not found');
            return;
        }

        if (!activities || activities.length === 0) {
            container.innerHTML = '<div class="no-activities">暂无活动</div>';
            return;
        }

        const html = activities.map(activity => `
            <div class="activity-card ${activity.status === 'cancelled' ? 'cancelled' : ''}" data-id="${activity.id}">
                <img src="${activity.image || 'images/default.jpg'}" 
                     alt="${activity.title}" 
                     class="activity-image"
                     onerror="this.src='images/default.jpg'">
                <div class="activity-content">
                    <h3 class="activity-title">${activity.title}</h3>
                    <div class="activity-meta">
                        <span>${new Date(activity.date).toLocaleDateString('zh-CN')}</span>
                        <span>${activity.location}</span>
                        ${activity.status === 'cancelled' ? '<span class="status-cancelled">已取消</span>' : ''}
                    </div>
                    <div class="activity-tags">
                        ${activity.tags.map(tag => `
                            <span class="tag">${tag}</span>
                        `).join('')}
                    </div>
                    <div class="activity-actions">
                        <button class="details-btn" onclick="activityManager.showDetails('${activity.id}')">
                            查看详情
                        </button>
                        ${activity.status !== 'cancelled' ? `
                            <button class="signup-btn" onclick="activityManager.toggleSignup('${activity.id}')">
                                ${activity.participants.includes(currentUser) ? '取消报名' : '报名参加'}
                            </button>
                            <button class="cancel-btn" onclick="activityManager.cancelActivity('${activity.id}')">
                                取消活动
                            </button>
                        ` : ''}
                        <button class="delete-btn" onclick="activityManager.deleteActivity('${activity.id}')">
                            删除活动
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;

        // 添加动画效果
        container.querySelectorAll('.activity-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });

        // 添加图片加载优化
        container.querySelectorAll('img').forEach(img => {
            img.loading = 'lazy'; // 启用懒加载
            img.onerror = () => {
                img.src = 'images/default.jpg';
            };
        });
    }

    showDetails(activityId) {
        const activity = this.activities.find(a => a.id.toString() === activityId.toString());
        if (!activity) {
            console.error('Activity not found:', activityId);
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content activity-details">
                <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>${activity.title}</h2>
                <img src="${activity.image || 'images/default.jpg'}" 
                     alt="${activity.title}" 
                     class="activity-image">
                <div class="activity-info">
                    <p><strong>时间：</strong>${new Date(activity.date).toLocaleDateString('zh-CN')}</p>
                    <p><strong>地点：</strong>${activity.location}</p>
                    <p><strong>描述：</strong>${activity.description}</p>
                    <p><strong>参与人数：</strong>${activity.participants.length}</p>
                    <p><strong>状态：</strong>${activity.status || '正常'}</p>
                </div>
                <div class="activity-tags">
                    ${activity.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="comments-section">
                    <h3>评论区</h3>
                    <div class="comments-list">
                        ${this.renderComments(activity.comments)}
                    </div>
                    <div class="comment-form">
                        <textarea placeholder="发表评论..." id="commentText"></textarea>
                        <button onclick="activityManager.addComment('${activity.id}')">发送</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加点击背景关闭模态框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // 添加ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    renderComments(comments = []) {
        if (!comments || comments.length === 0) {
            return '<p class="no-comments">暂无评论</p>';
        }

        return comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${new Date(comment.date).toLocaleDateString('zh-CN')}</span>
                </div>
                <p class="comment-content">${comment.content}</p>
            </div>
        `).join('');
    }

    toggleSignup(activityId) {
        const activity = this.activities.find(a => a.id.toString() === activityId.toString());
        if (!activity) return;

        const index = activity.participants.indexOf(currentUser);
        if (index === -1) {
            activity.participants.push(currentUser);
            this.showMessage('报名成功！');
        } else {
            activity.participants.splice(index, 1);
            this.showMessage('已取消���名');
        }

        this.saveActivities();
        this.renderActivities();
    }

    addComment(activityId) {
        const activity = this.activities.find(a => a.id.toString() === activityId.toString());
        const textarea = document.getElementById('commentText');
        if (!activity || !textarea || !textarea.value.trim()) return;

        activity.comments.push({
            author: currentUser,
            content: textarea.value.trim(),
            date: new Date().toISOString()
        });

        this.saveActivities();
        this.showDetails(activityId);
        this.showMessage('评论发布成功！');
    }

    showMessage(text, type = 'success') {
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    showMyEvents() {
        try {
            // 过滤出用户已报名且未取消的活动
            const myActivities = this.activities.filter(activity => 
                activity.participants.includes(currentUser) && activity.status !== 'cancelled'
            );

            // 渲染已报名的活动
            this.renderActivities(myActivities);

            // 如果没有已报名的活动，显示提示信息
            if (myActivities.length === 0) {
                const container = document.getElementById('activitiesList');
                if (container) {
                    container.innerHTML = '<div class="no-activities">您还没有报名任何活动</div>';
                }
            }

            // 更新导航按钮状态
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-page') === 'myEvents') {
                    btn.classList.add('active');
                }
            });

            console.log('Showing my events:', myActivities);
        } catch (error) {
            console.error('Error showing my events:', error);
            this.showMessage('加载我的活动失败，请重试', 'error');
        }
    }

    // 添加显示我创建的活动的方法
    showMyCreatedEvents() {
        try {
            // 过滤出用户创建的活动
            const myCreatedActivities = this.activities.filter(activity => 
                activity.creator === currentUser
            );

            // 渲染创建的活动
            this.renderActivities(myCreatedActivities);

            // 如果没有创建的活动，显示提示信息
            if (myCreatedActivities.length === 0) {
                const container = document.getElementById('activitiesList');
                if (container) {
                    container.innerHTML = '<div class="no-activities">您还没有创建任何活动</div>';
                }
            }

            // 更新导航按钮状态
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-page') === 'myCreated') {
                    btn.classList.add('active');
                }
            });

            console.log('Showing my created events:', myCreatedActivities);
        } catch (error) {
            console.error('Error showing my created events:', error);
            this.showMessage('加载我创建的活动失败，请重试', 'error');
        }
    }

    // 修改 handlePublishSubmit 方法，添加创建者信息
    handlePublishSubmit(form) {
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
            comments: [],
            creator: currentUser, // 添加创建者信息
            createTime: new Date().toISOString() // 添加创建时间
        };

        // ... 其他代码保持不变 ...
    }
}

// 初始化活动管理器并设为全局变量
window.activityManager = new ActivityManager(); 