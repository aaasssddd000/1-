class AuthManager {
    constructor() {
        this.currentUser = null;
        this.registrationType = 'user';
        this.adminCode = '1234';
        this.init();
    }

    init() {
        console.log('Initializing AuthManager...');
        this.bindEvents();
        this.checkInitialAdmin();
        
        // 检查当前页面
        const currentPage = window.location.pathname.split('/').pop();
        
        if (currentPage === 'login.html') {
            // 在登录页面，检查是否已登录
            const savedUser = localStorage.getItem('currentUser');
            const savedToken = localStorage.getItem('authToken');
            
            if (savedUser && savedToken) {
                // 已登录，清除登录状态，要求重新登录
                localStorage.removeItem('currentUser');
                localStorage.removeItem('authToken');
                localStorage.removeItem('lastLoginTime');
            }
        } else {
            // 在其他页面，检查登录状态
            this.checkLoginState();
        }
    }

    checkLoginState() {
        console.log('Checking login state...');
        
        const savedUser = localStorage.getItem('currentUser');
        const savedToken = localStorage.getItem('authToken');
        
        if (!savedUser || !savedToken) {
            console.log('No login info found, redirecting to login page...');
            // 强制跳转到登录页面
            window.location.replace('login.html');
            return;
        }

        try {
            this.currentUser = JSON.parse(savedUser);
            if (!this.validateToken(savedToken)) {
                throw new Error('Invalid token');
            }
        } catch (error) {
            console.error('Login state check failed:', error);
            // 登录状态无效，强制跳转到登录页面
            window.location.replace('login.html');
        }
    }

    checkAutoLogin() {
        const savedUser = localStorage.getItem('currentUser');
        const savedToken = localStorage.getItem('authToken');
        
        if (savedUser && savedToken) {
            try {
                this.currentUser = JSON.parse(savedUser);
                if (this.validateToken(savedToken)) {
                    // 已登录且token有效，重定向到主页
                    window.location.href = 'index.html';
                } else {
                    // token无效，清除登录状态
                    this.logout();
                }
            } catch (error) {
                console.error('Auto login failed:', error);
                this.logout();
            }
        }
    }

    validateToken(token) {
        // 这里可以添加更复杂的token验证逻辑
        return token && token.length > 20;
    }

    generateToken() {
        // 生成一个更安全的token
        const timestamp = new Date().getTime();
        const random = Math.random().toString(36).substring(2);
        const userInfo = this.currentUser.id + this.currentUser.role;
        return `${timestamp}.${random}.${userInfo}`;
    }

    logout() {
        try {
            // 清除登录状态
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('lastLoginTime');
            
            // 直接跳转到登录页面
            window.location.href = window.location.origin + '/login.html';
        } catch (error) {
            console.error('Fallback logout error:', error);
            // 如果还是失败，使用 replace
            window.location.replace('/login.html');
        }
    }

    bindEvents() {
        // 登录表单
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(loginForm);
            });
        }

        // 注册表单
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(registerForm);
            });
        }

        // 标签切换
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // 注册类型切换
        document.querySelectorAll('.auth-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchRegistrationType(btn.dataset.type);
            });
        });

        // 输入验证
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                this.validateInput(input);
            });
        });
    }

    validateInput(input) {
        const formGroup = input.closest('.form-group');
        
        switch(input.name) {
            case 'phone':
                if (!this.validatePhone(input.value)) {
                    this.showInputError(formGroup, '请输入正确的手机号');
                } else {
                    this.clearInputError(formGroup);
                }
                break;
            case 'password':
                if (input.value.length < 6) {
                    this.showInputError(formGroup, '密码长度不能少于6位');
                } else {
                    this.clearInputError(formGroup);
                }
                break;
            case 'confirmPassword':
                const password = input.closest('form').querySelector('input[name="password"]').value;
                if (input.value !== password) {
                    this.showInputError(formGroup, '两次输入的密码不一致');
                } else {
                    this.clearInputError(formGroup);
                }
                break;
            case 'adminCode':
                if (this.registrationType === 'admin' && input.value !== this.adminCode) {
                    this.showInputError(formGroup, '管理员注册码错误');
                } else {
                    this.clearInputError(formGroup);
                }
                break;
        }
    }

    showInputError(formGroup, message) {
        formGroup.classList.add('error');
        const errorDiv = formGroup.querySelector('.error-message') || document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(errorDiv);
        }
    }

    clearInputError(formGroup) {
        formGroup.classList.remove('error');
        const errorDiv = formGroup.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    async handleLogin(form) {
        try {
            const submitBtn = form.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = '登录中...';

            const formData = new FormData(form);
            const phone = formData.get('phone');
            const password = formData.get('password');

            // 表单验证
            if (!this.validateLoginForm(phone, password)) {
                submitBtn.disabled = false;
                submitBtn.textContent = '登录';
                return;
            }

            // 获取用户数据
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.phone === phone);

            if (!user) {
                this.showMessage('用户不存在', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = '登录';
                return;
            }

            if (user.password !== password) {
                this.showMessage('密码错误', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = '登录';
                return;
            }

            // 登录成功
            this.currentUser = user;
            const token = this.generateToken();
            const loginTime = new Date().getTime();
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('authToken', token);
            localStorage.setItem('lastLoginTime', loginTime.toString());
            
            this.showMessage('登录成功');
            
            // 添加登录成功动画
            form.classList.add('success');
            
            // 跳转到主页
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('登录失败，请重试', 'error');
            const submitBtn = form.querySelector('.submit-btn');
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
        }
    }

    async handleRegister(form) {
        try {
            const submitBtn = form.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = '注册中...';

            const formData = new FormData(form);
            const phone = formData.get('phone');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            const adminCode = formData.get('adminCode');

            // 表单验证
            if (!this.validateRegisterForm(phone, password, confirmPassword, adminCode)) {
                submitBtn.disabled = false;
                submitBtn.textContent = '注册';
                return;
            }

            // 检查用户是否已存在
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.some(u => u.phone === phone)) {
                this.showMessage('该手机号已注册', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = '注册';
                return;
            }

            // 创建新用户
            const newUser = {
                id: Date.now().toString(),
                phone,
                password,
                role: this.registrationType,
                createTime: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            this.showMessage('注册成功，请登录');
            this.switchTab('login');
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = '注册';
        } catch (error) {
            console.error('Register error:', error);
            this.showMessage('注册失败，请重试', 'error');
            const submitBtn = form.querySelector('.submit-btn');
            submitBtn.disabled = false;
            submitBtn.textContent = '注册';
        }
    }

    validateLoginForm(phone, password) {
        if (!phone || !password) {
            this.showMessage('请填写所有必填项', 'error');
            return false;
        }

        if (!this.validatePhone(phone)) {
            this.showMessage('请输入正确的手机号', 'error');
            return false;
        }

        return true;
    }

    validateRegisterForm(phone, password, confirmPassword, adminCode) {
        if (!phone || !password || !confirmPassword) {
            this.showMessage('请填写所有必填项', 'error');
            return false;
        }

        if (!this.validatePhone(phone)) {
            this.showMessage('请输入正确的手机号', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showMessage('密码长度不能少于6位', 'error');
            return false;
        }

        if (password !== confirmPassword) {
            this.showMessage('两次输入的密码不一致', 'error');
            return false;
        }

        if (this.registrationType === 'admin' && adminCode !== this.adminCode) {
            this.showMessage('管理员注册码错误', 'error');
            return false;
        }

        return true;
    }

    validatePhone(phone) {
        return /^1[3-9]\d{9}$/.test(phone);
    }

    switchTab(tabName) {
        // 切换标签激活状态
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // 切换表单显示
        document.querySelectorAll('.auth-form').forEach(form => {
            if (form.id === `${tabName}Form`) {
                form.style.display = 'block';
                form.classList.add('fade-enter');
            } else {
                form.style.display = 'none';
            }
        });
    }

    switchRegistrationType(type) {
        this.registrationType = type;
        
        // 更新按钮状态
        document.querySelectorAll('.auth-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // 显示/隐藏管理员字段
        const adminField = document.querySelector('.admin-field');
        if (adminField) {
            adminField.style.display = type === 'admin' ? 'block' : 'none';
            const adminCodeInput = adminField.querySelector('input');
            adminCodeInput.required = type === 'admin';
        }
    }

    checkInitialAdmin() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (!users.some(user => user.role === 'admin')) {
            const adminUser = {
                id: 'admin',
                phone: 'admin',
                password: 'admin',
                role: 'admin',
                createTime: new Date().toISOString()
            };
            users.push(adminUser);
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Initial admin account created');
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

    confirmLogout() {
        console.log('Confirming logout...');
        
        // 直接调用登出方法，不使用确认对话框
        this.doLogout();
    }

    doLogout() {
        try {
            console.log('Logging out...');
            
            // 清除所有登录状态
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('lastLoginTime');

            // 强制跳转到登录页面
            window.location.replace('login.html');
            
        } catch (error) {
            console.error('Logout failed:', error);
            // 如果出错，尝试其他跳转方式
            try {
                window.location.href = 'login.html';
            } catch (e) {
                // 如果还是失败，尝试最后的方式
                document.location = 'login.html';
            }
        }
    }
}

// 初始化认证管理器
window.authManager = new AuthManager(); 