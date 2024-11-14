class AnimationManager {
    constructor() {
        this.shapes = document.querySelectorAll('.shape');
        this.init();
    }

    init() {
        // 添加鼠标进入动画
        this.shapes.forEach(shape => {
            shape.addEventListener('mouseenter', () => {
                this.playEnterAnimation(shape);
            });

            shape.addEventListener('mouseleave', () => {
                this.playLeaveAnimation(shape);
            });

            // 添加点击动画
            shape.addEventListener('click', (e) => {
                this.playClickAnimation(shape, e);
            });
        });
    }

    playEnterAnimation(shape) {
        // 移除之前的动画类
        shape.classList.remove('shape-leave');
        
        // 根据形状类型添加不同的动画
        if (shape.classList.contains('hexagon')) {
            shape.style.transform = 'scale(1.1) rotate(30deg)';
        } else if (shape.classList.contains('circle')) {
            shape.style.transform = 'scale(1.1) rotate(180deg)';
        } else if (shape.classList.contains('diamond')) {
            shape.style.transform = 'scale(1.1) rotate(45deg)';
        } else if (shape.classList.contains('triangle')) {
            shape.style.transform = 'scale(1.1) rotate(-30deg)';
        }
    }

    playLeaveAnimation(shape) {
        shape.style.transform = 'scale(1) rotate(0deg)';
    }

    playClickAnimation(shape, e) {
        // 创建点击波纹效果
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        
        const rect = shape.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        shape.appendChild(ripple);
        
        // 动画结束后移除波纹元素
        setTimeout(() => {
            ripple.remove();
        }, 1000);

        // 添加点击缩放动画
        shape.style.transform = 'scale(0.95)';
        setTimeout(() => {
            shape.style.transform = 'scale(1)';
        }, 200);
    }
}

// 初始化动画管理器
const animationManager = new AnimationManager(); 